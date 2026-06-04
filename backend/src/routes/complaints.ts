import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapComplaint } from '../utils/mappers.js'
import { newId } from '../utils/id.js'

const router = Router()
router.use(requireAuth)

const selectComplaintSql = `
  SELECT c.*, r.nama as pelapor, r.blok, r.lantai, r.nomor_unit
  FROM complaints c
  JOIN residents r ON r.id = c.resident_id
`

// Warga: list own
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const isAdmin = ['super_admin', 'pengelola', 'petugas_keamanan'].includes(
      req.user!.role
    )
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
    res.status(201).json(mapComplaint(result.rows[0]))
  })
)

router.patch(
  '/:id/status',
  requireRole('super_admin', 'pengelola', 'petugas_keamanan'),
  asyncHandler(async (req, res) => {
    const { status } = z
      .object({ status: z.enum(['Baru', 'Diproses', 'Selesai']) })
      .parse(req.body)
    await db.execute({
      sql: 'UPDATE complaints SET status = ? WHERE id = ?',
      args: [status, req.params.id],
    })
    res.json({ ok: true })
  })
)

export default router
