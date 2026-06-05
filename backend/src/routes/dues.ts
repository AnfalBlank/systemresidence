import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapDues } from '../utils/mappers.js'
import { newId } from '../utils/id.js'

const router = Router()
router.use(requireAuth)

// Warga: list own dues
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await db.execute({
      sql: 'SELECT * FROM dues WHERE resident_id = ? ORDER BY jatuh_tempo DESC',
      args: [req.user!.id],
    })
    res.json(result.rows.map(mapDues))
  })
)

// Petugas keuangan / admin: list all dues with resident info
router.get(
  '/all',
  requireRole('super_admin', 'pengelola', 'petugas_keuangan'),
  asyncHandler(async (_req, res) => {
    const result = await db.execute(`
      SELECT d.*, r.nama as resident_nama, r.blok, r.lantai, r.nomor_unit
      FROM dues d
      JOIN residents r ON r.id = d.resident_id
      ORDER BY d.status = 'Menunggu Verifikasi' DESC, d.jatuh_tempo DESC
    `)
    res.json(
      result.rows.map((row) => ({
        ...mapDues(row),
        residentName: String(row.resident_nama),
        residentUnit: `${row.blok}-${row.lantai}-${row.nomor_unit}`,
      }))
    )
  })
)

// Mark "I have paid" — sets status to Menunggu Verifikasi
router.post(
  '/:id/pay',
  asyncHandler(async (req, res) => {
    const { method } = z
      .object({ method: z.enum(['transfer', 'qris']) })
      .parse(req.body)
    const result = await db.execute({
      sql: 'SELECT resident_id, status FROM dues WHERE id = ?',
      args: [req.params.id],
    })
    const row = result.rows[0]
    if (!row) return res.status(404).json({ error: 'Tagihan tidak ditemukan' })
    if (String(row.resident_id) !== req.user!.id) {
      return res.status(403).json({ error: 'Bukan tagihan Anda' })
    }
    if (row.status !== 'Belum Bayar') {
      return res.status(400).json({ error: 'Tagihan sudah dibayar/diverifikasi' })
    }
    await db.execute({
      sql: `UPDATE dues SET status = 'Menunggu Verifikasi', payment_method = ?, paid_at = unixepoch() WHERE id = ?`,
      args: [method, req.params.id],
    })
    const after = await db.execute({
      sql: 'SELECT * FROM dues WHERE id = ?',
      args: [req.params.id],
    })
    res.json(mapDues(after.rows[0]))
  })
)

// Petugas keuangan: verify payment → Lunas + create transaction
router.post(
  '/:id/verify',
  requireRole('super_admin', 'petugas_keuangan'),
  asyncHandler(async (req, res) => {
    const result = await db.execute({
      sql: `SELECT d.*, r.blok, r.lantai, r.nomor_unit FROM dues d JOIN residents r ON r.id = d.resident_id WHERE d.id = ?`,
      args: [req.params.id],
    })
    const row = result.rows[0]
    if (!row) return res.status(404).json({ error: 'Tagihan tidak ditemukan' })
    if (row.status !== 'Menunggu Verifikasi')
      return res.status(400).json({ error: 'Tagihan tidak menunggu verifikasi' })

    await db.execute({
      sql: `UPDATE dues SET status = 'Lunas', verified_by = ?, verified_at = unixepoch() WHERE id = ?`,
      args: [req.user!.id, req.params.id],
    })
    // Auto-record income transaction
    await db.execute({
      sql: `INSERT INTO transactions (id, tanggal, keterangan, kategori, tipe, jumlah) VALUES (?,?,?,?,?,?)`,
      args: [
        newId('t'),
        new Date().toISOString().slice(0, 10),
        `Iuran ${row.jenis} ${row.periode} (${row.blok}-${row.lantai}-${row.nomor_unit})`,
        'Iuran',
        'pemasukan',
        Number(row.jumlah),
      ],
    })
    const after = await db.execute({
      sql: 'SELECT * FROM dues WHERE id = ?',
      args: [req.params.id],
    })
    res.json(mapDues(after.rows[0]))
  })
)

// Petugas keuangan: reject payment → back to Belum Bayar
router.post(
  '/:id/reject',
  requireRole('super_admin', 'petugas_keuangan'),
  asyncHandler(async (req, res) => {
    await db.execute({
      sql: `UPDATE dues SET status = 'Belum Bayar', paid_at = NULL WHERE id = ?`,
      args: [req.params.id],
    })
    res.json({ ok: true })
  })
)

// Pengelola: create new dues for a resident
router.post(
  '/',
  requireRole('super_admin', 'pengelola', 'petugas_keuangan'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        residentId: z.string(),
        jenis: z.enum(['IPL', 'Kebersihan', 'Keamanan', 'Dana Sosial']),
        periode: z.string(),
        jumlah: z.number().positive(),
        jatuhTempo: z.string(),
      })
      .parse(req.body)
    const id = newId('d')
    await db.execute({
      sql: 'INSERT INTO dues (id, resident_id, jenis, periode, jumlah, jatuh_tempo) VALUES (?,?,?,?,?,?)',
      args: [id, body.residentId, body.jenis, body.periode, body.jumlah, body.jatuhTempo],
    })
    res.status(201).json({ id })
  })
)

// Pengelola: generate dues for ALL active warga at once
router.post(
  '/bulk',
  requireRole('super_admin', 'pengelola', 'petugas_keuangan'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        jenis: z.enum(['IPL', 'Kebersihan', 'Keamanan', 'Dana Sosial']),
        periode: z.string(),
        jumlah: z.number().positive(),
        jatuhTempo: z.string(),
      })
      .parse(req.body)

    const residents = await db.execute(
      "SELECT id FROM residents WHERE account_status != 'Nonaktif'"
    )
    let created = 0
    for (const r of residents.rows) {
      // Skip if a due of same jenis+periode already exists for this resident
      const existing = await db.execute({
        sql: 'SELECT 1 FROM dues WHERE resident_id = ? AND jenis = ? AND periode = ?',
        args: [String(r.id), body.jenis, body.periode],
      })
      if (existing.rows.length > 0) continue
      await db.execute({
        sql: 'INSERT INTO dues (id, resident_id, jenis, periode, jumlah, jatuh_tempo) VALUES (?,?,?,?,?,?)',
        args: [newId('d'), String(r.id), body.jenis, body.periode, body.jumlah, body.jatuhTempo],
      })
      created++
    }
    res.status(201).json({ created, total: residents.rows.length })
  })
)

// Delete a due (admin/keuangan — e.g. wrong bill)
router.delete(
  '/:id',
  requireRole('super_admin', 'pengelola', 'petugas_keuangan'),
  asyncHandler(async (req, res) => {
    await db.execute({ sql: 'DELETE FROM dues WHERE id = ?', args: [req.params.id] })
    res.json({ ok: true })
  })
)

export default router
