import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapPanicAlert } from '../utils/mappers.js'
import { newId } from '../utils/id.js'

const router = Router()
router.use(requireAuth)

const selectPanicSql = `
  SELECT p.*, r.nama, r.blok, r.lantai, r.nomor_unit
  FROM panic_alerts p
  JOIN residents r ON r.id = p.resident_id
`

// Warga sends panic alert
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { jenis } = z
      .object({ jenis: z.enum(['Medis', 'Kebakaran', 'Keamanan']) })
      .parse(req.body)
    const id = newId('pa')
    await db.execute({
      sql: 'INSERT INTO panic_alerts (id, resident_id, jenis) VALUES (?,?,?)',
      args: [id, req.user!.id, jenis],
    })
    res.status(201).json({ id, jenis, status: 'Aktif' })
  })
)

// Petugas keamanan: list all alerts
router.get(
  '/',
  requireRole('super_admin', 'petugas_keamanan', 'pengelola'),
  asyncHandler(async (_req, res) => {
    const result = await db.execute(
      `${selectPanicSql} ORDER BY p.status = 'Aktif' DESC, p.waktu DESC`
    )
    res.json(result.rows.map(mapPanicAlert))
  })
)

// Update alert status
router.patch(
  '/:id/status',
  requireRole('super_admin', 'petugas_keamanan'),
  asyncHandler(async (req, res) => {
    const { status } = z
      .object({ status: z.enum(['Aktif', 'Ditangani', 'Selesai']) })
      .parse(req.body)
    const args =
      status === 'Aktif'
        ? [status, null, req.params.id]
        : [status, req.user!.id, req.params.id]
    await db.execute({
      sql: 'UPDATE panic_alerts SET status = ?, handled_by = ?, handled_at = unixepoch() WHERE id = ?',
      args,
    })
    res.json({ ok: true })
  })
)

export default router
