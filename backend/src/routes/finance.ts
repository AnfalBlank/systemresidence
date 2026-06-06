import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapTransaction } from '../utils/mappers.js'
import { newId } from '../utils/id.js'

const router = Router()
router.use(requireAuth)

// Compute all-time cash balance
async function totalBalance(): Promise<number> {
  const r = await db.execute(
    `SELECT
       COALESCE(SUM(CASE WHEN tipe='pemasukan' THEN jumlah ELSE -jumlah END), 0) as saldo
     FROM transactions`
  )
  return Number(r.rows[0]?.saldo ?? 0)
}

router.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    const period = z
      .enum(['Bulanan', 'Tahunan', 'Semua'])
      .default('Bulanan')
      .parse(req.query.period ?? 'Bulanan')

    const now = new Date()
    let rows
    if (period === 'Semua') {
      const r = await db.execute(
        'SELECT * FROM transactions ORDER BY tanggal DESC, created_at DESC'
      )
      rows = r.rows
    } else {
      const prefix =
        period === 'Bulanan'
          ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
          : String(now.getFullYear())
      const r = await db.execute({
        sql: 'SELECT * FROM transactions WHERE tanggal LIKE ? ORDER BY tanggal DESC, created_at DESC',
        args: [prefix + '%'],
      })
      rows = r.rows
    }

    const txs = rows.map(mapTransaction)
    const pemasukan = txs.filter((t) => t.tipe === 'pemasukan').reduce((s, t) => s + t.jumlah, 0)
    const pengeluaran = txs.filter((t) => t.tipe === 'pengeluaran').reduce((s, t) => s + t.jumlah, 0)
    res.json({
      transactions: txs,
      // periodIncome/periodExpense are for the selected period; saldoKas is all-time
      summary: {
        pemasukan,
        pengeluaran,
        saldo: pemasukan - pengeluaran,
        saldoKas: await totalBalance(),
      },
      period,
    })
  })
)

// Create any transaction (income or expense)
router.post(
  '/transactions',
  requireRole('super_admin', 'pengelola', 'petugas_keuangan'),
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

    // Guard: do not allow expense that exceeds available cash balance
    if (body.tipe === 'pengeluaran') {
      const saldo = await totalBalance()
      if (body.jumlah > saldo) {
        return res.status(400).json({
          error: `Pengeluaran (Rp${body.jumlah.toLocaleString('id-ID')}) melebihi saldo kas (Rp${saldo.toLocaleString('id-ID')}).`,
        })
      }
    }

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

// Dedicated expense ("penggunaan kas") shortcut — always pengeluaran
router.post(
  '/expenses',
  requireRole('super_admin', 'pengelola', 'petugas_keuangan'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        tanggal: z.string(),
        keterangan: z.string().min(1),
        kategori: z.string().min(1),
        jumlah: z.number().positive(),
      })
      .parse(req.body)

    const saldo = await totalBalance()
    if (body.jumlah > saldo) {
      return res.status(400).json({
        error: `Pengeluaran (Rp${body.jumlah.toLocaleString('id-ID')}) melebihi saldo kas (Rp${saldo.toLocaleString('id-ID')}).`,
      })
    }

    const id = newId('t')
    await db.execute({
      sql: "INSERT INTO transactions (id, tanggal, keterangan, kategori, tipe, jumlah) VALUES (?,?,?,?,'pengeluaran',?)",
      args: [id, body.tanggal, body.keterangan, body.kategori, body.jumlah],
    })
    const result = await db.execute({ sql: 'SELECT * FROM transactions WHERE id = ?', args: [id] })
    res.status(201).json({ ...mapTransaction(result.rows[0]), saldoKas: await totalBalance() })
  })
)

// Delete a transaction (correction)
router.delete(
  '/transactions/:id',
  requireRole('super_admin', 'petugas_keuangan'),
  asyncHandler(async (req, res) => {
    await db.execute({ sql: 'DELETE FROM transactions WHERE id = ?', args: [req.params.id] })
    res.json({ ok: true })
  })
)

export default router
