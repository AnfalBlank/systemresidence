import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapCampaign } from '../utils/mappers.js'
import { newId } from '../utils/id.js'

const router = Router()
router.use(requireAuth)

const selectCampaignSql = `
  SELECT c.*,
    COALESCE((SELECT SUM(jumlah) FROM donations WHERE campaign_id = c.id), 0) as terkumpul,
    (SELECT COUNT(*) FROM donations WHERE campaign_id = c.id) as donatur
  FROM campaigns c
`

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const result = await db.execute(`${selectCampaignSql} ORDER BY c.created_at DESC`)
    res.json(result.rows.map(mapCampaign))
  })
)

router.post(
  '/',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        judul: z.string().min(1),
        tipe: z.enum(['Renovasi', 'Bantuan Sosial', 'Perbaikan Fasilitas']),
        deskripsi: z.string().optional(),
        foto: z.string().optional(),
        target: z.number().positive(),
        berakhir: z.string(),
      })
      .parse(req.body)
    const id = newId('cf')
    await db.execute({
      sql: 'INSERT INTO campaigns (id, judul, tipe, deskripsi, foto, target, berakhir) VALUES (?,?,?,?,?,?,?)',
      args: [
        id,
        body.judul,
        body.tipe,
        body.deskripsi ?? '',
        body.foto ?? null,
        body.target,
        body.berakhir,
      ],
    })
    res.status(201).json({ id })
  })
)

// Donate — also creates a transaction (income)
router.post(
  '/:id/donate',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        jumlah: z.number().positive(),
        metode: z.enum(['transfer', 'qris']),
      })
      .parse(req.body)
    const campaignResult = await db.execute({
      sql: 'SELECT judul FROM campaigns WHERE id = ?',
      args: [req.params.id],
    })
    if (!campaignResult.rows[0])
      return res.status(404).json({ error: 'Campaign tidak ditemukan' })

    await db.execute({
      sql: 'INSERT INTO donations (id, campaign_id, donor_id, jumlah, metode) VALUES (?,?,?,?,?)',
      args: [newId('dn'), req.params.id, req.user!.id, body.jumlah, body.metode],
    })
    await db.execute({
      sql: 'INSERT INTO transactions (id, tanggal, keterangan, kategori, tipe, jumlah) VALUES (?,?,?,?,?,?)',
      args: [
        newId('t'),
        new Date().toISOString().slice(0, 10),
        `Donasi: ${campaignResult.rows[0].judul}`,
        'Crowdfunding',
        'pemasukan',
        body.jumlah,
      ],
    })
    res.json({ ok: true })
  })
)

export default router
