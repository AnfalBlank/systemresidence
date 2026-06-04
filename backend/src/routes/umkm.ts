import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapUmkmAd } from '../utils/mappers.js'
import { newId } from '../utils/id.js'

const router = Router()
router.use(requireAuth)

const selectSql = `
  SELECT a.*, r.nama as pemilik, r.no_hp as owner_hp, r.blok, r.lantai, r.nomor_unit
  FROM umkm_ads a JOIN residents r ON r.id = a.owner_id
`

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const result = await db.execute(`${selectSql} ORDER BY a.created_at DESC`)
    res.json(result.rows.map(mapUmkmAd))
  })
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        nama: z.string().min(1),
        jenis: z.enum(['Produk', 'Jasa']),
        banner: z.string().optional(),
        promo: z.string().min(1),
      })
      .parse(req.body)
    const id = newId('ad')
    await db.execute({
      sql: 'INSERT INTO umkm_ads (id, owner_id, nama, jenis, banner, promo) VALUES (?,?,?,?,?,?)',
      args: [id, req.user!.id, body.nama, body.jenis, body.banner ?? null, body.promo],
    })
    res.status(201).json({ id })
  })
)

router.post(
  '/:id/track',
  asyncHandler(async (req, res) => {
    const { event } = z
      .object({ event: z.enum(['view', 'click', 'chat']) })
      .parse(req.body)
    const col = `${event}s`
    await db.execute({
      sql: `UPDATE umkm_ads SET ${col} = ${col} + 1 WHERE id = ?`,
      args: [req.params.id],
    })
    res.json({ ok: true })
  })
)

export default router
