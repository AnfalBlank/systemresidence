import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapTransaction } from '../utils/mappers.js'
import { newId } from '../utils/id.js'

const router = Router()
router.use(requireAuth)

router.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    const period = z
      .enum(['Bulanan', 'Tahunan'])
      .default('Bulanan')
      .parse(req.query.period ?? 'Bulanan')

    const now = new Date()
    let prefix = ''
    if (period === 'Bulanan') {
      prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    } else {
      prefix = String(now.getFullYear())
    }
    const result = await db.execute({
      sql: 'SELECT * FROM transactions WHERE tanggal LIKE ? ORDER BY tanggal DESC, created_at DESC',
      args: [prefix + '%'],
    })
    const txs = result.rows.map(mapTransaction)
    const pemasukan = txs.filter((t) => t.tipe === 'pemasukan').reduce((s, t) => s + t.jumlah, 0)
    const pengeluaran = txs.filter((t) => t.tipe === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0)
    res.json({
      transactions: txs,
      summary: { pemasukan, pengeluaran, saldo: pemasukan - pengeluaran },
      period,
    })
  })
)

router.post(
  '/transactions',
  requireRole('super_admin', 'petugas_keuangan'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        tanggal: z.string(),
        keterangan: z.string().min(1),
        kategori: z.string().min(1),
        tipe: z.enum(['pemasukan', 'pengeluaran']),
        jumlah: z.number().positive(),
      })
      .parse(req.body)
    const id = newId('t')
    await db.execute({
      sql: 'INSERT INTO transactions (id, tanggal, keterangan, kategori, tipe, jumlah) VALUES (?,?,?,?,?,?)',
      args: [id, body.tanggal, body.keterangan, body.kategori, body.tipe, body.jumlah],
    })
    const result = await db.execute({
      sql: 'SELECT * FROM transactions WHERE id = ?',
      args: [id],
    })
    res.status(201).json(mapTransaction(result.rows[0]))
  })
)

export default router
