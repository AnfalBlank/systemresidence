import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import {
  mapChatGroup,
  mapMessage,
  mapPrivateChat,
} from '../utils/mappers.js'
import { newId } from '../utils/id.js'

const router = Router()
router.use(requireAuth)

// Helper: ensure chat_reads row exists, then update last_read_at to now
async function markRead(userId: string, key: string) {
  await db.execute({
    sql: `INSERT INTO chat_reads (user_id, conversation_key, last_read_at)
          VALUES (?, ?, unixepoch())
          ON CONFLICT(user_id, conversation_key) DO UPDATE SET last_read_at = unixepoch()`,
    args: [userId, key],
  })
}

// List groups (with last message, member count, AND unread count for current user)
router.get(
  '/groups',
  asyncHandler(async (req, res) => {
    const me = req.user!.id
    const result = await db.execute({
      sql: `
        SELECT
          g.*,
          (SELECT COUNT(*) FROM chat_group_members WHERE group_id = g.id) as anggota,
          (SELECT isi FROM chat_messages WHERE group_id = g.id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM chat_messages WHERE group_id = g.id ORDER BY created_at DESC LIMIT 1) as last_time,
          (
            SELECT COUNT(*) FROM chat_messages cm
            WHERE cm.group_id = g.id
              AND cm.sender_id != ?
              AND cm.created_at > COALESCE(
                (SELECT last_read_at FROM chat_reads WHERE user_id = ? AND conversation_key = 'g:' || g.id),
                0
              )
          ) as unread
        FROM chat_groups g
        ORDER BY g.is_main DESC, g.nama ASC
      `,
      args: [me, me],
    })
    res.json(result.rows.map((row) => ({
      ...mapChatGroup(row),
      unread: Number(row.unread ?? 0),
    })))
  })
)

// List private chats (one row per peer, with unread count)
router.get(
  '/private',
  asyncHandler(async (req, res) => {
    const me = req.user!.id
    const result = await db.execute({
      sql: `
        SELECT
          peer.id as peer_id, peer.nama, peer.blok, peer.lantai, peer.nomor_unit, peer.foto,
          MAX(m.created_at) as last_time,
          (
            SELECT isi FROM chat_messages
            WHERE (sender_id = me.id AND recipient_id = peer.id) OR (sender_id = peer.id AND recipient_id = me.id)
            ORDER BY created_at DESC LIMIT 1
          ) as last_message,
          (
            SELECT COUNT(*) FROM chat_messages cm
            WHERE cm.sender_id = peer.id AND cm.recipient_id = me.id
              AND cm.created_at > COALESCE(
                (SELECT last_read_at FROM chat_reads WHERE user_id = me.id AND conversation_key = 'p:' || peer.id),
                0
              )
          ) as unread
        FROM chat_messages m
        JOIN residents me ON me.id = ?
        JOIN residents peer ON peer.id = CASE WHEN m.sender_id = me.id THEN m.recipient_id ELSE m.sender_id END
        WHERE (m.sender_id = me.id OR m.recipient_id = me.id) AND m.recipient_id IS NOT NULL
        GROUP BY peer.id
        ORDER BY last_time DESC
      `,
      args: [me],
    })
    res.json(result.rows.map((row) => ({
      ...mapPrivateChat(row),
      unread: Number(row.unread ?? 0),
    })))
  })
)

// Total unread count (groups + private), for the bell/header badge
router.get(
  '/unread-summary',
  asyncHandler(async (req, res) => {
    const me = req.user!.id
    const groupsResult = await db.execute({
      sql: `SELECT COALESCE(SUM(c), 0) as total FROM (
        SELECT (
          SELECT COUNT(*) FROM chat_messages cm
          WHERE cm.group_id = g.id AND cm.sender_id != ?
            AND cm.created_at > COALESCE(
              (SELECT last_read_at FROM chat_reads WHERE user_id = ? AND conversation_key = 'g:' || g.id),
              0
            )
        ) as c FROM chat_groups g
      )`,
      args: [me, me],
    })
    const privateResult = await db.execute({
      sql: `SELECT COUNT(*) as c FROM chat_messages cm
            WHERE cm.recipient_id = ?
              AND cm.created_at > COALESCE(
                (SELECT last_read_at FROM chat_reads WHERE user_id = ? AND conversation_key = 'p:' || cm.sender_id),
                0
              )`,
      args: [me, me],
    })
    res.json({
      groups: Number(groupsResult.rows[0]?.total ?? 0),
      private: Number(privateResult.rows[0]?.c ?? 0),
      total: Number(groupsResult.rows[0]?.total ?? 0) + Number(privateResult.rows[0]?.c ?? 0),
    })
  })
)

// Group messages — also marks the group as read
router.get(
  '/groups/:id/messages',
  asyncHandler(async (req, res) => {
    const result = await db.execute({
      sql: `
        SELECT m.*, r.nama as pengirim, r.blok, r.lantai, r.nomor_unit, m.sender_id
        FROM chat_messages m
        JOIN residents r ON r.id = m.sender_id
        WHERE m.group_id = ?
        ORDER BY m.created_at ASC
        LIMIT 200
      `,
      args: [req.params.id],
    })
    await markRead(req.user!.id, `g:${req.params.id}`)
    res.json(result.rows.map((row) => mapMessage(row, req.user!.id)))
  })
)

router.post(
  '/groups/:id/messages',
  asyncHandler(async (req, res) => {
    const { isi } = z.object({ isi: z.string().min(1) }).parse(req.body)
    const id = newId('m')
    await db.execute({
      sql: 'INSERT INTO chat_messages (id, group_id, sender_id, isi) VALUES (?,?,?,?)',
      args: [id, req.params.id, req.user!.id, isi],
    })
    // Mark sender's own group as read up to this message
    await markRead(req.user!.id, `g:${req.params.id}`)
    res.status(201).json({ id })
  })
)

// Private messages — also marks conversation as read
router.get(
  '/private/:peerId/messages',
  asyncHandler(async (req, res) => {
    const me = req.user!.id
    const peer = req.params.peerId
    const result = await db.execute({
      sql: `
        SELECT m.*, r.nama as pengirim, r.blok, r.lantai, r.nomor_unit, m.sender_id
        FROM chat_messages m
        JOIN residents r ON r.id = m.sender_id
        WHERE (m.sender_id = ? AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = ?)
        ORDER BY m.created_at ASC
        LIMIT 200
      `,
      args: [me, peer, peer, me],
    })
    await markRead(me, `p:${peer}`)
    res.json(result.rows.map((row) => mapMessage(row, me)))
  })
)

router.post(
  '/private/:peerId/messages',
  asyncHandler(async (req, res) => {
    const { isi } = z.object({ isi: z.string().min(1) }).parse(req.body)
    const id = newId('m')
    await db.execute({
      sql: 'INSERT INTO chat_messages (id, sender_id, recipient_id, isi) VALUES (?,?,?,?)',
      args: [id, req.user!.id, req.params.peerId, isi],
    })
    // Mark sender's own conversation as read
    await markRead(req.user!.id, `p:${req.params.peerId}`)
    res.status(201).json({ id })
  })
)

// Explicitly mark a conversation as read (called when opening chat view)
router.post(
  '/groups/:id/read',
  asyncHandler(async (req, res) => {
    await markRead(req.user!.id, `g:${req.params.id}`)
    res.json({ ok: true })
  })
)

router.post(
  '/private/:peerId/read',
  asyncHandler(async (req, res) => {
    await markRead(req.user!.id, `p:${req.params.peerId}`)
    res.json({ ok: true })
  })
)

// Search residents (to start a new private chat)
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? '').trim()
    if (!q) return res.json([])
    const result = await db.execute({
      sql: `SELECT id, nama, blok, lantai, nomor_unit, foto
            FROM residents
            WHERE id != ? AND (nama LIKE ? OR (blok || '-' || lantai || '-' || nomor_unit) LIKE ?)
            LIMIT 20`,
      args: [req.user!.id, `%${q}%`, `%${q}%`],
    })
    res.json(
      result.rows.map((row) => ({
        id: String(row.id),
        nama: String(row.nama),
        unit: `${row.blok}-${row.lantai}-${row.nomor_unit}`,
        foto: row.foto ? String(row.foto) : undefined,
      }))
    )
  })
)

export default router
