import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapSkillProvider } from '../utils/mappers.js'
import { newId } from '../utils/id.js'

const router = Router()
router.use(requireAuth)

const selectSql = `
  SELECT s.*, r.nama, r.no_hp, r.blok, r.lantai, r.nomor_unit, r.foto,
    COALESCE((SELECT AVG(rating) FROM skill_reviews WHERE provider_id = s.id), 0) as rating,
    (SELECT COUNT(*) FROM skill_reviews WHERE provider_id = s.id) as jumlah_review,
    (SELECT GROUP_CONCAT(url, '|') FROM skill_portfolios WHERE provider_id = s.id) as portofolio
  FROM skill_providers s
  JOIN residents r ON r.id = s.resident_id
`

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const result = await db.execute(`${selectSql} ORDER BY rating DESC, jumlah_review DESC`)
    res.json(result.rows.map(mapSkillProvider))
  })
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        kategori: z.string().min(1),
        deskripsi: z.string().optional(),
        portofolio: z.array(z.string().url()).optional(),
      })
      .parse(req.body)
    const id = newId('s')
    await db.execute({
      sql: 'INSERT INTO skill_providers (id, resident_id, kategori, deskripsi) VALUES (?,?,?,?)',
      args: [id, req.user!.id, body.kategori, body.deskripsi ?? ''],
    })
    if (body.portofolio) {
      for (const url of body.portofolio) {
        await db.execute({
          sql: 'INSERT INTO skill_portfolios (id, provider_id, url) VALUES (?,?,?)',
          args: [newId('sp'), id, url],
        })
      }
    }
    res.status(201).json({ id })
  })
)

router.get(
  '/:id/reviews',
  asyncHandler(async (req, res) => {
    const result = await db.execute({
      sql: `SELECT sr.*, r.nama as penulis FROM skill_reviews sr
            JOIN residents r ON r.id = sr.reviewer_id
            WHERE sr.provider_id = ? ORDER BY sr.created_at DESC`,
      args: [req.params.id],
    })
    res.json(
      result.rows.map((row) => ({
        id: String(row.id),
        penulis: String(row.penulis),
        rating: Number(row.rating),
        komentar: String(row.komentar ?? ''),
        tanggal: new Date(Number(row.created_at) * 1000).toISOString().slice(0, 10),
      }))
    )
  })
)

router.post(
  '/:id/reviews',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        rating: z.number().int().min(1).max(5),
        komentar: z.string().optional(),
      })
      .parse(req.body)
    await db.execute({
      sql: 'INSERT INTO skill_reviews (id, provider_id, reviewer_id, rating, komentar) VALUES (?,?,?,?,?)',
      args: [newId('sr'), req.params.id, req.user!.id, body.rating, body.komentar ?? ''],
    })
    res.status(201).json({ ok: true })
  })
)

export default router
