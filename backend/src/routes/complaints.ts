import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapComplaint } from '../utils/mappers.js'
import { newId } from '../utils/id.js'
import { notify, notifyMany } from '../utils/notify.js'

const router = Router()
router.use(requireAuth)

const selectComplaintSql = `
  SELECT c.*, r.nama as pelapor, r.blok, r.lantai, r.nomor_unit
  FROM complaints c
  JOIN residents r ON r.id = c.resident_id
`

// Warga: list own. Admins (super_admin, pengelola) see all complaints.
// Petugas Keamanan does NOT manage complaints per PRD section 2.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const isAdmin = ['super_admin', 'pengelola'].includes(req.user!.role)
    const sql = isAdmin
      ? `${selectComplaintSql} ORDER BY c.created_at DESC`
      : `${selectComplaintSql} WHERE c.resident_id = ? ORDER BY c.created_at DESC`
    const result = isAdmin
      ? await db.execute(sql)
      : await db.execute({ sql, args: [req.user!.id] })
    res.json(result.rows.map(mapComplaint))
  })
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        kategori: z.enum(['Kebersihan', 'Keamanan', 'Infrastruktur', 'Fasilitas']),
        judul: z.string().min(1),
        deskripsi: z.string().min(1),
        foto: z.string().optional(),
      })
      .parse(req.body)
    const id = newId('c')
    const tanggal = new Date().toISOString().slice(0, 10)
    await db.execute({
      sql: 'INSERT INTO complaints (id, resident_id, kategori, judul, deskripsi, status, tanggal, foto) VALUES (?,?,?,?,?,?,?,?)',
      args: [
        id,
        req.user!.id,
        body.kategori,
        body.judul,
        body.deskripsi,
        'Baru',
        tanggal,
        body.foto ?? null,
      ],
    })
    const result = await db.execute({
      sql: `${selectComplaintSql} WHERE c.id = ?`,
      args: [id],
    })
    // Notify pengelola/admin (per PRD, petugas_keamanan does not manage complaints)
    const officers = await db.execute(
      "SELECT id FROM residents WHERE role IN ('pengelola','super_admin') AND account_status = 'Aktif'"
    )
    await notifyMany(
      officers.rows.map((r) => String(r.id)),
      {
        type: 'complaint_update',
        title: `Pengaduan Baru: ${body.kategori}`,
        message: `${req.user!.nama}: ${body.judul}`,
        link: '/pengaduan',
        entityId: id,
      }
    )
    res.status(201).json(mapComplaint(result.rows[0]))
  })
)

router.patch(
  '/:id/status',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    const { status } = z
      .object({ status: z.enum(['Baru', 'Diproses', 'Selesai']) })
      .parse(req.body)
    const before = await db.execute({
      sql: 'SELECT resident_id, judul FROM complaints WHERE id = ?',
      args: [req.params.id],
    })
    await db.execute({
      sql: 'UPDATE complaints SET status = ? WHERE id = ?',
      args: [status, req.params.id],
    })
    if (before.rows[0]) {
      await notify({
        userId: String(before.rows[0].resident_id),
        type: 'complaint_update',
        title: `Status Pengaduan: ${status}`,
        message: String(before.rows[0].judul),
        link: '/pengaduan',
        entityId: req.params.id,
      })
    }
    res.json({ ok: true })
  })
)

export default router
