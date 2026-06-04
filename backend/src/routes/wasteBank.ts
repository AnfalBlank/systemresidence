import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapWasteRecord } from '../utils/mappers.js'
import { newId } from '../utils/id.js'

const router = Router()
router.use(requireAuth)

const pricePerKg: Record<string, number> = {
  Plastik: 3000,
  Kertas: 1500,
  Logam: 6000,
  'Botol Kaca': 1500,
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await db.execute({
      sql: 'SELECT * FROM waste_records WHERE resident_id = ? ORDER BY tanggal DESC, created_at DESC',
      args: [req.user!.id],
    })
    const records = result.rows.map(mapWasteRecord)
    const balance = records.reduce(
      (s, r) => s + (r.tipe === 'setor' ? r.nilai : -r.nilai),
      0
    )
    res.json({ records, balance })
  })
)

router.post(
  '/setor',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        jenis: z.string().min(1),
        berat: z.number().positive(),
      })
      .parse(req.body)
    const nilai = Math.round(body.berat * (pricePerKg[body.jenis] ?? 2000))
    await db.execute({
      sql: 'INSERT INTO waste_records (id, resident_id, tanggal, jenis, berat, nilai, tipe) VALUES (?,?,?,?,?,?,?)',
      args: [
        newId('w'),
        req.user!.id,
        new Date().toISOString().slice(0, 10),
        body.jenis,
        body.berat,
        nilai,
        'setor',
      ],
    })
    res.json({ nilai })
  })
)

router.post(
  '/tarik',
  asyncHandler(async (req, res) => {
    const { nominal } = z
      .object({ nominal: z.number().positive() })
      .parse(req.body)

    // Compute current balance
    const result = await db.execute({
      sql: `SELECT COALESCE(SUM(CASE WHEN tipe = 'setor' THEN nilai ELSE -nilai END), 0) as balance
            FROM waste_records WHERE resident_id = ?`,
      args: [req.user!.id],
    })
    const balance = Number(result.rows[0]?.balance ?? 0)
    if (nominal > balance) {
      return res.status(400).json({ error: 'Saldo tidak mencukupi' })
    }
    await db.execute({
      sql: 'INSERT INTO waste_records (id, resident_id, tanggal, jenis, berat, nilai, tipe) VALUES (?,?,?,?,?,?,?)',
      args: [
        newId('w'),
        req.user!.id,
        new Date().toISOString().slice(0, 10),
        'Penarikan saldo',
        0,
        nominal,
        'tarik',
      ],
    })
    res.json({ ok: true, balance: balance - nominal })
  })
)

export default router
