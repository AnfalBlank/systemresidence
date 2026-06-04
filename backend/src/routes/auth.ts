import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { hashPassword, signToken, verifyPassword } from '../utils/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { requireAuth } from '../middleware/auth.js'
import { mapResident } from '../utils/mappers.js'
import type { Role } from '../types.js'

const router = Router()

// POST /auth/lookup-code — verify invitation code, return resident data
router.post(
  '/lookup-code',
  asyncHandler(async (req, res) => {
    const { code } = z.object({ code: z.string().min(1) }).parse(req.body)
    const result = await db.execute({
      sql: 'SELECT * FROM residents WHERE invitation_code = ? LIMIT 1',
      args: [code.trim().toUpperCase()],
    })
    const row = result.rows[0]
    if (!row) return res.status(404).json({ error: 'Kode undangan tidak ditemukan.' })
    if (row.account_status === 'Aktif') {
      return res.status(409).json({
        error: 'Akun sudah aktif. Silakan masuk dengan password Anda.',
      })
    }
    res.json(mapResident(row))
  })
)

// POST /auth/activate — set password and activate account
router.post(
  '/activate',
  asyncHandler(async (req, res) => {
    const { code, password } = z
      .object({
        code: z.string().min(1),
        password: z.string().min(6, 'Password minimal 6 karakter'),
      })
      .parse(req.body)

    const result = await db.execute({
      sql: 'SELECT id, role, account_status FROM residents WHERE invitation_code = ?',
      args: [code.trim().toUpperCase()],
    })
    const row = result.rows[0]
    if (!row) return res.status(404).json({ error: 'Kode undangan tidak ditemukan.' })
    if (row.account_status === 'Aktif')
      return res.status(409).json({ error: 'Akun sudah aktif.' })

    const hash = await hashPassword(password)
    await db.execute({
      sql: 'UPDATE residents SET password_hash = ?, account_status = ?, updated_at = unixepoch() WHERE id = ?',
      args: [hash, 'Aktif', row.id],
    })

    const token = signToken({ sub: String(row.id), role: row.role as Role })

    // Return user data after activation
    const after = await db.execute({
      sql: 'SELECT * FROM residents WHERE id = ?',
      args: [row.id],
    })
    res.json({ token, user: mapResident(after.rows[0]) })
  })
)

// POST /auth/login — phone + password OR invitation code + password
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        identifier: z.string().min(1), // phone or invitation code
        password: z.string().min(1),
      })
      .parse(req.body)

    const result = await db.execute({
      sql: 'SELECT * FROM residents WHERE (no_hp = ? OR invitation_code = ?) LIMIT 1',
      args: [body.identifier, body.identifier.toUpperCase()],
    })
    const row = result.rows[0]
    if (!row || !row.password_hash) {
      return res.status(401).json({ error: 'Kredensial tidak valid.' })
    }
    if (row.account_status !== 'Aktif') {
      return res.status(403).json({ error: 'Akun belum aktif.' })
    }
    const ok = await verifyPassword(body.password, String(row.password_hash))
    if (!ok) return res.status(401).json({ error: 'Kredensial tidak valid.' })

    const token = signToken({ sub: String(row.id), role: row.role as Role })
    res.json({ token, user: mapResident(row) })
  })
)

// GET /auth/me — current user from token
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await db.execute({
      sql: 'SELECT * FROM residents WHERE id = ?',
      args: [req.user!.id],
    })
    res.json(mapResident(result.rows[0]))
  })
)

// POST /auth/change-password
router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = z
      .object({
        currentPassword: z.string().min(1).optional(),
        newPassword: z.string().min(6),
      })
      .parse(req.body)

    if (currentPassword) {
      const result = await db.execute({
        sql: 'SELECT password_hash FROM residents WHERE id = ?',
        args: [req.user!.id],
      })
      const ok = await verifyPassword(
        currentPassword,
        String(result.rows[0]?.password_hash ?? '')
      )
      if (!ok) return res.status(401).json({ error: 'Password lama salah.' })
    }

    const hash = await hashPassword(newPassword)
    await db.execute({
      sql: 'UPDATE residents SET password_hash = ?, updated_at = unixepoch() WHERE id = ?',
      args: [hash, req.user!.id],
    })
    res.json({ ok: true })
  })
)

export default router
