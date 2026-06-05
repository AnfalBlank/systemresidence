import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapBooking, mapFacility } from '../utils/mappers.js'
import { newId } from '../utils/id.js'
import { notify, notifyMany } from '../utils/notify.js'

const router = Router()
router.use(requireAuth)

router.get(
  '/facilities',
  asyncHandler(async (_req, res) => {
    const result = await db.execute('SELECT * FROM facilities ORDER BY nama')
    res.json(result.rows.map(mapFacility))
  })
)

// Pengelola: create facility
router.post(
  '/facilities',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        nama: z.string().min(1),
        tipe: z.enum(['Aula', 'Lapangan', 'Gazebo', 'Ruang Serbaguna']),
        deskripsi: z.string().optional(),
        kapasitas: z.number().int().nonnegative(),
        foto: z.string().optional(),
        jamOperasional: z.string().optional(),
      })
      .parse(req.body)
    const id = newId('fac')
    await db.execute({
      sql: 'INSERT INTO facilities (id, nama, tipe, deskripsi, kapasitas, foto, jam_operasional) VALUES (?,?,?,?,?,?,?)',
      args: [
        id,
        body.nama,
        body.tipe,
        body.deskripsi ?? '',
        body.kapasitas,
        body.foto ?? null,
        body.jamOperasional ?? '',
      ],
    })
    const result = await db.execute({ sql: 'SELECT * FROM facilities WHERE id = ?', args: [id] })
    res.status(201).json(mapFacility(result.rows[0]))
  })
)

// Pengelola: delete facility
router.delete(
  '/facilities/:id',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    await db.execute({ sql: 'DELETE FROM facilities WHERE id = ?', args: [req.params.id] })
    res.json({ ok: true })
  })
)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const isAdmin = ['super_admin', 'pengelola'].includes(req.user!.role)
    const sql = `
      SELECT b.*, f.nama as fasilitas
      FROM bookings b JOIN facilities f ON f.id = b.facility_id
      ${isAdmin ? '' : 'WHERE b.resident_id = ?'}
      ORDER BY b.created_at DESC
    `
    const result = isAdmin
      ? await db.execute(sql)
      : await db.execute({ sql, args: [req.user!.id] })
    res.json(result.rows.map(mapBooking))
  })
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        facilityId: z.string(),
        tanggal: z.string(),
        waktu: z.string(),
        keperluan: z.string().min(1),
      })
      .parse(req.body)
    const id = newId('b')
    await db.execute({
      sql: 'INSERT INTO bookings (id, facility_id, resident_id, tanggal, waktu, keperluan) VALUES (?,?,?,?,?,?)',
      args: [id, body.facilityId, req.user!.id, body.tanggal, body.waktu, body.keperluan],
    })
    // Notify pengelola
    const fac = await db.execute({ sql: 'SELECT nama FROM facilities WHERE id = ?', args: [body.facilityId] })
    const officers = await db.execute(
      "SELECT id FROM residents WHERE role IN ('pengelola','super_admin') AND account_status = 'Aktif'"
    )
    await notifyMany(
      officers.rows.map((r) => String(r.id)),
      {
        type: 'complaint_update',
        title: 'Pengajuan Booking Baru',
        message: `${req.user!.nama} mengajukan booking ${fac.rows[0]?.nama ?? 'fasilitas'} pada ${body.tanggal}`,
        link: '/booking',
        entityId: id,
      }
    )
    res.status(201).json({ id, status: 'Pending' })
  })
)

router.patch(
  '/:id/status',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    const { status } = z
      .object({ status: z.enum(['Pending', 'Approved', 'Rejected', 'Finished']) })
      .parse(req.body)
    const before = await db.execute({
      sql: `SELECT b.resident_id, f.nama as fac_nama, b.tanggal, b.waktu
            FROM bookings b JOIN facilities f ON f.id = b.facility_id WHERE b.id = ?`,
      args: [req.params.id],
    })
    await db.execute({
      sql: 'UPDATE bookings SET status = ? WHERE id = ?',
      args: [status, req.params.id],
    })
    const row = before.rows[0]
    if (row && (status === 'Approved' || status === 'Rejected')) {
      await notify({
        userId: String(row.resident_id),
        type: status === 'Approved' ? 'booking_approved' : 'booking_rejected',
        title: status === 'Approved' ? 'Booking Disetujui' : 'Booking Ditolak',
        message: `${row.fac_nama} pada ${row.tanggal} ${row.waktu}`,
        link: '/booking',
        entityId: req.params.id,
      })
    }
    res.json({ ok: true })
  })
)

export default router
