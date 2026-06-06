import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapResident } from '../utils/mappers.js'
import { generateInvitationCode, generateUniqueUsername, newId } from '../utils/id.js'

const router = Router()

router.use(requireAuth)

// GET /residents — list all (admin/pengelola/petugas_keuangan)
router.get(
  '/',
  requireRole('super_admin', 'pengelola', 'petugas_keuangan'),
  asyncHandler(async (_req, res) => {
    const result = await db.execute(
      'SELECT * FROM residents ORDER BY blok, lantai, nomor_unit'
    )
    res.json(result.rows.map(mapResident))
  })
)

// POST /residents — create new resident + invitation code (admin/pengelola)
router.post(
  '/',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        nama: z.string().min(1),
        noHp: z.string().min(1),
        email: z.string().email().optional().or(z.literal('')),
        status: z.enum(['Pemilik', 'Penyewa', 'Keluarga']),
        blok: z.string().min(1),
        lantai: z.string().min(1),
        nomor: z.string().min(1),
        role: z
          .enum(['warga', 'pengelola', 'petugas_keuangan', 'petugas_keamanan', 'super_admin'])
          .default('warga'),
      })
      .parse(req.body)

    const id = newId('u')
    const code = generateInvitationCode()
    const username = await generateUniqueUsername(body.nama, body.blok, body.lantai, body.nomor)
    await db.execute({
      sql: `INSERT INTO residents (id, nama, username, no_hp, email, blok, lantai, nomor_unit, status, role, account_status, invitation_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Belum Aktivasi', ?)`,
      args: [
        id, body.nama, username, body.noHp, body.email || null,
        body.blok, body.lantai, body.nomor, body.status, body.role, code,
      ],
    })
    const result = await db.execute({ sql: 'SELECT * FROM residents WHERE id = ?', args: [id] })
    res.status(201).json(mapResident(result.rows[0]))
  })
)

// PATCH /residents/me — update own basic profile fields.
//
// IMPORTANT: This route MUST come before PATCH /:id, otherwise Express will
// match the parameterised route first and `:id="me"` will be denied by
// requireRole. Order matters.
//
// SECURITY: Schema does NOT accept `role` or `accountStatus`. `.strict()`
// rejects any extra fields. Do not add them without proper role-checking.
router.patch(
  '/me',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        nama: z.string().min(1).optional(),
        email: z.string().optional(),
        tanggalLahir: z.string().optional(),
        jenisKelamin: z.enum(['Laki-laki', 'Perempuan']).optional(),
      })
      .strict()
      .parse(req.body)
    const updates: string[] = []
    const args: (string | null)[] = []
    if (body.nama !== undefined) { updates.push('nama = ?'); args.push(body.nama) }
    if (body.email !== undefined) { updates.push('email = ?'); args.push(body.email || null) }
    if (body.tanggalLahir !== undefined) { updates.push('tanggal_lahir = ?'); args.push(body.tanggalLahir || null) }
    if (body.jenisKelamin !== undefined) { updates.push('jenis_kelamin = ?'); args.push(body.jenisKelamin) }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })
    updates.push('updated_at = unixepoch()')
    args.push(req.user!.id)
    await db.execute({
      sql: `UPDATE residents SET ${updates.join(', ')} WHERE id = ?`,
      args,
    })
    const result = await db.execute({
      sql: 'SELECT * FROM residents WHERE id = ?',
      args: [req.user!.id],
    })
    res.json(mapResident(result.rows[0]))
  })
)

// PATCH /residents/:id — admin/pengelola edit any resident.
// Role + accountStatus changes are restricted to super_admin to prevent
// privilege escalation by pengelola.
router.patch(
  '/:id',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    const id = req.params.id
    const body = z
      .object({
        nama: z.string().optional(),
        noHp: z.string().optional(),
        email: z.string().optional(),
        status: z.enum(['Pemilik', 'Penyewa', 'Keluarga']).optional(),
        accountStatus: z.enum(['Belum Aktivasi', 'Aktif', 'Nonaktif']).optional(),
        role: z
          .enum(['warga', 'pengelola', 'petugas_keuangan', 'petugas_keamanan', 'super_admin'])
          .optional(),
      })
      .parse(req.body)

    const isSuperAdmin = req.user!.role === 'super_admin'
    const isSelf = id === req.user!.id

    if (body.role !== undefined) {
      if (!isSuperAdmin) {
        return res.status(403).json({
          error: 'Hanya Super Admin yang dapat mengubah role pengguna.',
        })
      }
      if (isSelf) {
        return res.status(400).json({
          error: 'Tidak dapat mengubah role diri sendiri.',
        })
      }
    }
    if (body.accountStatus !== undefined && isSelf) {
      return res.status(400).json({
        error: 'Tidak dapat mengubah status akun diri sendiri.',
      })
    }

    const updates: string[] = []
    const args: (string | null)[] = []
    if (body.nama !== undefined) { updates.push('nama = ?'); args.push(body.nama) }
    if (body.noHp !== undefined) { updates.push('no_hp = ?'); args.push(body.noHp) }
    if (body.email !== undefined) { updates.push('email = ?'); args.push(body.email || null) }
    if (body.status !== undefined) { updates.push('status = ?'); args.push(body.status) }
    if (body.accountStatus !== undefined) { updates.push('account_status = ?'); args.push(body.accountStatus) }
    if (body.role !== undefined) { updates.push('role = ?'); args.push(body.role) }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })
    updates.push('updated_at = unixepoch()')
    args.push(id)
    await db.execute({
      sql: `UPDATE residents SET ${updates.join(', ')} WHERE id = ?`,
      args,
    })
    const result = await db.execute({
      sql: 'SELECT * FROM residents WHERE id = ?',
      args: [id],
    })
    res.json(mapResident(result.rows[0]))
  })
)

// POST /residents/:id/regenerate-code — generate new invitation code
router.post(
  '/:id/regenerate-code',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    const code = generateInvitationCode()
    await db.execute({
      sql: 'UPDATE residents SET invitation_code = ?, updated_at = unixepoch() WHERE id = ?',
      args: [code, req.params.id],
    })
    res.json({ invitationCode: code })
  })
)

// POST /residents/:id/reset-password — admin resets a warga's password.
// Returns the new temporary password so admin can share it. Only super_admin
// and pengelola may do this.
router.post(
  '/:id/reset-password',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        // Optional explicit password; if omitted a temp one is generated.
        newPassword: z.string().min(6).optional(),
      })
      .parse(req.body ?? {})

    const target = await db.execute({
      sql: 'SELECT id, nama, account_status FROM residents WHERE id = ?',
      args: [req.params.id],
    })
    const row = target.rows[0]
    if (!row) return res.status(404).json({ error: 'Warga tidak ditemukan' })

    // Generate a readable temp password if not provided
    const tempPassword =
      body.newPassword ?? `kstp${Math.floor(1000 + Math.random() * 9000)}`
    const { hashPassword } = await import('../utils/auth.js')
    const hash = await hashPassword(tempPassword)

    // If account was never activated, activating + setting password makes sense.
    const newStatus =
      row.account_status === 'Belum Aktivasi' ? 'Aktif' : row.account_status

    await db.execute({
      sql: 'UPDATE residents SET password_hash = ?, account_status = ?, updated_at = unixepoch() WHERE id = ?',
      args: [hash, newStatus, req.params.id],
    })

    res.json({
      ok: true,
      nama: String(row.nama),
      temporaryPassword: tempPassword,
      note: 'Bagikan password sementara ini ke warga. Sarankan segera ganti password setelah login.',
    })
  })
)

// DELETE /residents/:id — remove a resident (admin only, cannot delete self)
router.delete(
  '/:id',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri.' })
    }
    await db.execute({ sql: 'DELETE FROM residents WHERE id = ?', args: [req.params.id] })
    res.json({ ok: true })
  })
)

export default router
