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

// List groups (with last message + member count)
router.get(
  '/groups',
  asyncHandler(async (_req, res) => {
    const result = await db.execute(`
      SELECT
        g.*,
        (SELECT COUNT(*) FROM chat_group_members WHERE group_id = g.id) as anggota,
        (SELECT isi FROM chat_messages WHERE group_id = g.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM chat_messages WHERE group_id = g.id ORDER BY created_at DESC LIMIT 1) as last_time
      FROM chat_groups g
      ORDER BY g.is_main DESC, g.nama ASC
    `)
    res.json(result.rows.map(mapChatGroup))
  })
)

// List private chats (one row per peer)
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
          ) as last_message
        FROM chat_messages m
        JOIN residents me ON me.id = ?
        JOIN residents peer ON peer.id = CASE WHEN m.sender_id = me.id THEN m.recipient_id ELSE m.sender_id END
        WHERE (m.sender_id = me.id OR m.recipient_id = me.id) AND m.recipient_id IS NOT NULL
        GROUP BY peer.id
        ORDER BY last_time DESC
      `,
      args: [me],
    })
    res.json(result.rows.map(mapPrivateChat))
  })
)

// Group messages
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
    res.status(201).json({ id })
  })
)

// Private messages between current user and peer
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
    res.status(201).json({ id })
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
