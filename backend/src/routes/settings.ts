import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import type { Row } from '@libsql/client'

const router = Router()
router.use(requireAuth)

function mapDuesSetting(row: Row) {
  return {
    jenis: String(row.jenis),
    enabled: Boolean(Number(row.enabled)),
    defaultAmount: Number(row.default_amount),
    dueDay: Number(row.due_day),
    deskripsi: row.deskripsi ? String(row.deskripsi) : '',
  }
}

// ---- Dues settings ----

// List all dues settings (any authenticated user can read; warga sees which are active)
router.get(
  '/dues',
  asyncHandler(async (_req, res) => {
    const result = await db.execute('SELECT * FROM dues_settings ORDER BY jenis')
    res.json(result.rows.map(mapDuesSetting))
  })
)

// Update a dues setting (admin/pengelola/keuangan)
router.patch(
  '/dues/:jenis',
  requireRole('super_admin', 'pengelola', 'petugas_keuangan'),
  asyncHandler(async (req, res) => {
    const jenis = req.params.jenis
    const valid = ['IPL', 'Kebersihan', 'Keamanan', 'Dana Sosial']
    if (!valid.includes(jenis)) {
      return res.status(400).json({ error: 'Jenis iuran tidak valid' })
    }
    const body = z
      .object({
        enabled: z.boolean().optional(),
        defaultAmount: z.number().int().nonnegative().optional(),
        dueDay: z.number().int().min(1).max(28).optional(),
        deskripsi: z.string().optional(),
      })
      .parse(req.body)

    const updates: string[] = []
    const args: (string | number)[] = []
    if (body.enabled !== undefined) { updates.push('enabled = ?'); args.push(body.enabled ? 1 : 0) }
    if (body.defaultAmount !== undefined) { updates.push('default_amount = ?'); args.push(body.defaultAmount) }
    if (body.dueDay !== undefined) { updates.push('due_day = ?'); args.push(body.dueDay) }
    if (body.deskripsi !== undefined) { updates.push('deskripsi = ?'); args.push(body.deskripsi) }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })
    updates.push('updated_at = unixepoch()')
    args.push(jenis)
    await db.execute({
      sql: `UPDATE dues_settings SET ${updates.join(', ')} WHERE jenis = ?`,
      args,
    })
    const result = await db.execute({ sql: 'SELECT * FROM dues_settings WHERE jenis = ?', args: [jenis] })
    res.json(mapDuesSetting(result.rows[0]))
  })
)

// ---- Payment settings ----

// Read payment config (any authenticated user — needed to display transfer/QRIS info)
router.get(
  '/payment',
  asyncHandler(async (_req, res) => {
    const result = await db.execute(
      "SELECT key, value FROM app_settings WHERE key IN ('bank_name','bank_account_number','bank_account_holder','qris_image_url','payment_note')"
    )
    const map: Record<string, string> = {}
    for (const row of result.rows) map[String(row.key)] = row.value ? String(row.value) : ''
    res.json({
      bankName: map.bank_name ?? '',
      bankAccountNumber: map.bank_account_number ?? '',
      bankAccountHolder: map.bank_account_holder ?? '',
      qrisImageUrl: map.qris_image_url ?? '',
      paymentNote: map.payment_note ?? '',
    })
  })
)

// Update payment config (admin/pengelola/keuangan)
router.patch(
  '/payment',
  requireRole('super_admin', 'pengelola', 'petugas_keuangan'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        bankName: z.string().optional(),
        bankAccountNumber: z.string().optional(),
        bankAccountHolder: z.string().optional(),
        qrisImageUrl: z.string().optional(),
        paymentNote: z.string().optional(),
      })
      .parse(req.body)

    const mapping: Record<string, string | undefined> = {
      bank_name: body.bankName,
      bank_account_number: body.bankAccountNumber,
      bank_account_holder: body.bankAccountHolder,
      qris_image_url: body.qrisImageUrl,
      payment_note: body.paymentNote,
    }
    for (const [key, value] of Object.entries(mapping)) {
      if (value !== undefined) {
        await db.execute({
          sql: `INSERT INTO app_settings (key, value, updated_at) VALUES (?,?, unixepoch())
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()`,
          args: [key, value],
        })
      }
    }
    res.json({ ok: true })
  })
)

// ---- Expense categories ----

router.get(
  '/expense-categories',
  asyncHandler(async (_req, res) => {
    const result = await db.execute('SELECT * FROM expense_categories ORDER BY nama')
    res.json(result.rows.map((r) => ({ id: String(r.id), nama: String(r.nama) })))
  })
)

router.post(
  '/expense-categories',
  requireRole('super_admin', 'pengelola', 'petugas_keuangan'),
  asyncHandler(async (req, res) => {
    const { nama } = z.object({ nama: z.string().min(1) }).parse(req.body)
    const id = `ec-${Date.now()}`
    try {
      await db.execute({
        sql: 'INSERT INTO expense_categories (id, nama) VALUES (?,?)',
        args: [id, nama.trim()],
      })
    } catch {
      return res.status(409).json({ error: 'Kategori sudah ada' })
    }
    res.status(201).json({ id, nama: nama.trim() })
  })
)

router.delete(
  '/expense-categories/:id',
  requireRole('super_admin', 'pengelola', 'petugas_keuangan'),
  asyncHandler(async (req, res) => {
    await db.execute({ sql: 'DELETE FROM expense_categories WHERE id = ?', args: [req.params.id] })
    res.json({ ok: true })
  })
)

export default router
