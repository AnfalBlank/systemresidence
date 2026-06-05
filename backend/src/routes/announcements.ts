import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapAnnouncement } from '../utils/mappers.js'
import { newId } from '../utils/id.js'

const router = Router()

router.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const result = await db.execute(
      'SELECT * FROM announcements ORDER BY tanggal DESC, created_at DESC'
    )
    res.json(result.rows.map(mapAnnouncement))
  })
)

router.post(
  '/',
  requireAuth,
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        judul: z.string().min(1),
        isi: z.string().min(1),
        kategori: z.enum(['Umum', 'Penting', 'Darurat']),
      })
      .parse(req.body)

    const id = newId('a')
    const tanggal = new Date().toISOString().slice(0, 10)
    await db.execute({
      sql: 'INSERT INTO announcements (id, judul, isi, kategori, tanggal, penulis, author_id) VALUES (?,?,?,?,?,?,?)',
      args: [id, body.judul, body.isi, body.kategori, tanggal, req.user!.nama, req.user!.id],
    })
    const result = await db.execute({
      sql: 'SELECT * FROM announcements WHERE id = ?',
      args: [id],
    })
    res.status(201).json(mapAnnouncement(result.rows[0]))
  })
)

router.patch(
  '/:id',
  requireAuth,
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        judul: z.string().min(1).optional(),
        isi: z.string().min(1).optional(),
        kategori: z.enum(['Umum', 'Penting', 'Darurat']).optional(),
      })
      .parse(req.body)
    const updates: string[] = []
    const args: string[] = []
    if (body.judul !== undefined) { updates.push('judul = ?'); args.push(body.judul) }
    if (body.isi !== undefined) { updates.push('isi = ?'); args.push(body.isi) }
    if (body.kategori !== undefined) { updates.push('kategori = ?'); args.push(body.kategori) }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })
    args.push(req.params.id)
    await db.execute({ sql: `UPDATE announcements SET ${updates.join(', ')} WHERE id = ?`, args })
    const result = await db.execute({ sql: 'SELECT * FROM announcements WHERE id = ?', args: [req.params.id] })
    res.json(mapAnnouncement(result.rows[0]))
  })
)

router.delete(
  '/:id',
  requireAuth,
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    await db.execute({
      sql: 'DELETE FROM announcements WHERE id = ?',
      args: [req.params.id],
    })
    res.json({ ok: true })
  })
)

export default router

