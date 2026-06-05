import { Router } from 'express'
import { db } from '../db/client.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import type { Row } from '@libsql/client'

const router = Router()
router.use(requireAuth)

function relativeTime(epochSeconds: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - epochSeconds
  if (diff < 60) return 'Baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} hari lalu`
  return new Date(epochSeconds * 1000).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short',
  })
}

function mapNotification(row: Row) {
  return {
    id: String(row.id),
    type: String(row.type),
    title: String(row.title),
    message: String(row.message),
    link: row.link ? String(row.link) : null,
    entityId: row.entity_id ? String(row.entity_id) : null,
    read: row.read_at != null,
    waktu: relativeTime(Number(row.created_at)),
    createdAt: Number(row.created_at),
  }
}

// List notifications for current user, plus unread count
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const me = req.user!.id
    const result = await db.execute({
      sql: `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      args: [me],
    })
    const unreadResult = await db.execute({
      sql: `SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read_at IS NULL`,
      args: [me],
    })
    res.json({
      items: result.rows.map(mapNotification),
      unread: Number(unreadResult.rows[0]?.c ?? 0),
    })
  })
)

// Mark single notification as read
router.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await db.execute({
      sql: `UPDATE notifications SET read_at = unixepoch() WHERE id = ? AND user_id = ?`,
      args: [req.params.id, req.user!.id],
    })
    res.json({ ok: true })
  })
)

// Mark all as read
router.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await db.execute({
      sql: `UPDATE notifications SET read_at = unixepoch() WHERE user_id = ? AND read_at IS NULL`,
      args: [req.user!.id],
    })
    res.json({ ok: true })
  })
)

// Delete one
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await db.execute({
      sql: `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
      args: [req.params.id, req.user!.id],
    })
    res.json({ ok: true })
  })
)

// Clear all
router.delete(
  '/',
  asyncHandler(async (req, res) => {
    await db.execute({
      sql: `DELETE FROM notifications WHERE user_id = ?`,
      args: [req.user!.id],
    })
    res.json({ ok: true })
  })
)

export default router
