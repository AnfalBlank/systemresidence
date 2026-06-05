import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapObituary } from '../utils/mappers.js'
import { newId } from '../utils/id.js'
import { notifyMany, resolveTargetUsers } from '../utils/notify.js'

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
    const userIds = await resolveTargetUsers('Seluruh Warga')
    await notifyMany(userIds, {
      type: 'obituary',
      title: 'Berita Duka',
      message: `Telah berpulang: ${body.namaAlmarhum} (${body.unit})`,
      link: '/berita-duka',
      entityId: id,
    })
    res.status(201).json(mapObituary(result.rows[0]))
  })
)

router.patch(
  '/:id',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        namaAlmarhum: z.string().min(1).optional(),
        unit: z.string().min(1).optional(),
        lokasiRumahDuka: z.string().min(1).optional(),
        jadwalPemakaman: z.string().min(1).optional(),
        catatan: z.string().optional(),
      })
      .parse(req.body)
    const updates: string[] = []
    const args: (string | null)[] = []
    if (body.namaAlmarhum !== undefined) { updates.push('nama_almarhum = ?'); args.push(body.namaAlmarhum) }
    if (body.unit !== undefined) { updates.push('unit = ?'); args.push(body.unit) }
    if (body.lokasiRumahDuka !== undefined) { updates.push('lokasi_rumah_duka = ?'); args.push(body.lokasiRumahDuka) }
    if (body.jadwalPemakaman !== undefined) { updates.push('jadwal_pemakaman = ?'); args.push(body.jadwalPemakaman) }
    if (body.catatan !== undefined) { updates.push('catatan = ?'); args.push(body.catatan || null) }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })
    args.push(req.params.id)
    await db.execute({ sql: `UPDATE obituaries SET ${updates.join(', ')} WHERE id = ?`, args })
    const result = await db.execute({ sql: 'SELECT * FROM obituaries WHERE id = ?', args: [req.params.id] })
    res.json(mapObituary(result.rows[0]))
  })
)

router.delete(
  '/:id',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    await db.execute({ sql: 'DELETE FROM obituaries WHERE id = ?', args: [req.params.id] })
    res.json({ ok: true })
  })
)

export default router
