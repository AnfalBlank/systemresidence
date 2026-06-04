import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapObituary } from '../utils/mappers.js'
import { newId } from '../utils/id.js'

const router = Router()
router.use(requireAuth)

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const result = await db.execute(
      'SELECT * FROM obituaries ORDER BY tanggal DESC, created_at DESC'
    )
    res.json(result.rows.map(mapObituary))
  })
)

router.post(
  '/',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        namaAlmarhum: z.string().min(1),
        unit: z.string().min(1),
        lokasiRumahDuka: z.string().min(1),
        jadwalPemakaman: z.string().min(1),
        catatan: z.string().optional(),
      })
      .parse(req.body)
    const id = newId('o')
    const tanggal = new Date().toISOString().slice(0, 10)
    await db.execute({
      sql: 'INSERT INTO obituaries (id, nama_almarhum, unit, lokasi_rumah_duka, jadwal_pemakaman, tanggal, catatan) VALUES (?,?,?,?,?,?,?)',
      args: [
        id,
        body.namaAlmarhum,
        body.unit,
        body.lokasiRumahDuka,
        body.jadwalPemakaman,
        tanggal,
        body.catatan ?? null,
      ],
    })
    const result = await db.execute({
      sql: 'SELECT * FROM obituaries WHERE id = ?',
      args: [id],
    })
    res.status(201).json(mapObituary(result.rows[0]))
  })
)

export default router
