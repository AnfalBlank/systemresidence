import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapVisitor } from '../utils/mappers.js'
import { generatePIN, newId } from '../utils/id.js'
import { notify } from '../utils/notify.js'

const router = Router()
router.use(requireAuth)

const selectSql = `
  SELECT v.*, r.blok, r.lantai, r.nomor_unit
  FROM visitors v
  JOIN residents r ON r.id = v.host_id
`

// List own (warga) or all (petugas)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const isSec = ['super_admin', 'petugas_keamanan', 'pengelola'].includes(
      req.user!.role
    )
    const result = isSec
      ? await db.execute(`${selectSql} ORDER BY v.created_at DESC`)
      : await db.execute({
          sql: `${selectSql} WHERE v.host_id = ? ORDER BY v.created_at DESC`,
          args: [req.user!.id],
        })
    res.json(result.rows.map(mapVisitor))
  })
)

// Warga registers visitor
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        nama: z.string().min(1),
        keperluan: z.string().min(1),
        tanggal: z.string().min(1),
        jam: z.string().min(1),
      })
      .parse(req.body)
    const id = newId('vis')
    const pin = generatePIN()
    await db.execute({
      sql: 'INSERT INTO visitors (id, host_id, nama, keperluan, tanggal, jam, pin) VALUES (?,?,?,?,?,?,?)',
      args: [id, req.user!.id, body.nama, body.keperluan, body.tanggal, body.jam, pin],
    })
    const result = await db.execute({
      sql: `${selectSql} WHERE v.id = ?`,
      args: [id],
    })
    res.status(201).json(mapVisitor(result.rows[0]))
  })
)

// Petugas: update status
router.patch(
  '/:id/status',
  requireRole('super_admin', 'petugas_keamanan'),
  asyncHandler(async (req, res) => {
    const { status } = z
      .object({ status: z.enum(['Menunggu', 'Di Dalam', 'Selesai']) })
      .parse(req.body)
    const updates = ['status = ?']
    const args: (string | number | null)[] = [status]
    if (status === 'Di Dalam') { updates.push('checked_in_at = unixepoch()') }
    if (status === 'Selesai') { updates.push('checked_out_at = unixepoch()') }
    args.push(req.params.id)
    await db.execute({
      sql: `UPDATE visitors SET ${updates.join(', ')} WHERE id = ?`,
      args,
    })
    // Notify host
    const host = await db.execute({
      sql: 'SELECT host_id, nama FROM visitors WHERE id = ?',
      args: [req.params.id],
    })
    if (host.rows[0]) {
      await notify({
        userId: String(host.rows[0].host_id),
        type: 'visitor_status',
        title: status === 'Di Dalam' ? 'Tamu Anda Telah Masuk' : status === 'Selesai' ? 'Tamu Telah Pulang' : 'Status Tamu Diperbarui',
        message: `${host.rows[0].nama}: ${status}`,
        link: '/tamu',
        entityId: req.params.id,
      })
    }
    res.json({ ok: true })
  })
)

// Petugas: verify by PIN
router.post(
  '/verify-pin',
  requireRole('super_admin', 'petugas_keamanan'),
  asyncHandler(async (req, res) => {
    const { pin } = z.object({ pin: z.string().min(1) }).parse(req.body)
    const result = await db.execute({
      sql: `${selectSql} WHERE v.pin = ? AND v.status != 'Selesai'`,
      args: [pin],
    })
    const row = result.rows[0]
    if (!row) return res.status(404).json({ error: 'PIN tidak valid' })
    res.json(mapVisitor(row))
  })
)

export default router
