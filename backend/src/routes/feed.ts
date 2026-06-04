import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapFeedPost } from '../utils/mappers.js'
import { newId } from '../utils/id.js'

const router = Router()
router.use(requireAuth)

const selectFeedSql = (uid: string) => `
  SELECT
    p.*,
    r.nama as penulis,
    r.blok, r.lantai, r.nomor_unit,
    r.foto as author_foto,
    (SELECT COUNT(*) FROM feed_likes WHERE post_id = p.id) as likes,
    (SELECT COUNT(*) FROM feed_comments WHERE post_id = p.id) as komentar,
    EXISTS(SELECT 1 FROM feed_likes WHERE post_id = p.id AND resident_id = '${uid.replace(/'/g, "''")}') as liked
  FROM feed_posts p
  JOIN residents r ON r.id = p.author_id
`

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await db.execute(
      `${selectFeedSql(req.user!.id)} ORDER BY p.created_at DESC`
    )
    res.json(result.rows.map(mapFeedPost))
  })
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        kategori: z.enum([
          'Informasi',
          'Jual Beli',
          'Kehilangan',
          'Lowongan Kerja',
          'Aktivitas Warga',
        ]),
        isi: z.string().min(1),
        gambar: z.string().optional(),
      })
      .parse(req.body)
    const id = newId('f')
    await db.execute({
      sql: 'INSERT INTO feed_posts (id, author_id, kategori, isi, gambar) VALUES (?,?,?,?,?)',
      args: [id, req.user!.id, body.kategori, body.isi, body.gambar ?? null],
    })
    const result = await db.execute({
      sql: `${selectFeedSql(req.user!.id)} WHERE p.id = ?`,
      args: [id],
    })
    res.status(201).json(mapFeedPost(result.rows[0]))
  })
)

router.post(
  '/:id/like',
  asyncHandler(async (req, res) => {
    const existing = await db.execute({
      sql: 'SELECT 1 FROM feed_likes WHERE post_id = ? AND resident_id = ?',
      args: [req.params.id, req.user!.id],
    })
    if (existing.rows.length > 0) {
      await db.execute({
        sql: 'DELETE FROM feed_likes WHERE post_id = ? AND resident_id = ?',
        args: [req.params.id, req.user!.id],
      })
      res.json({ liked: false })
    } else {
      await db.execute({
        sql: 'INSERT INTO feed_likes (post_id, resident_id) VALUES (?,?)',
        args: [req.params.id, req.user!.id],
      })
      res.json({ liked: true })
    }
  })
)

router.get(
  '/:id/comments',
  asyncHandler(async (req, res) => {
    const result = await db.execute({
      sql: `SELECT c.*, r.nama, r.blok, r.lantai, r.nomor_unit
            FROM feed_comments c JOIN residents r ON r.id = c.author_id
            WHERE c.post_id = ? ORDER BY c.created_at ASC`,
      args: [req.params.id],
    })
    res.json(
      result.rows.map((row) => ({
        id: String(row.id),
        nama: String(row.nama),
        unit: `${row.blok}-${row.lantai}-${row.nomor_unit}`,
        isi: String(row.isi),
        waktu: new Date(Number(row.created_at) * 1000).toLocaleString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }))
    )
  })
)

router.post(
  '/:id/comments',
  asyncHandler(async (req, res) => {
    const { isi } = z.object({ isi: z.string().min(1) }).parse(req.body)
    const id = newId('cm')
    await db.execute({
      sql: 'INSERT INTO feed_comments (id, post_id, author_id, isi) VALUES (?,?,?,?)',
      args: [id, req.params.id, req.user!.id, isi],
    })
    res.status(201).json({ id })
  })
)

export default router
