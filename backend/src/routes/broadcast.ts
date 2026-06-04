import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapBroadcast } from '../utils/mappers.js'
import { newId } from '../utils/id.js'

const router = Router()
router.use(requireAuth)
router.use(requireRole('super_admin', 'pengelola'))

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const result = await db.execute(
      'SELECT * FROM broadcasts ORDER BY created_at DESC LIMIT 50'
    )
    res.json(result.rows.map(mapBroadcast))
  })
)

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        judul: z.string().min(1),
        pesan: z.string().min(1),
        targetType: z.enum(['Seluruh Warga', 'Blok', 'Lantai', 'Unit', 'Kelompok']),
        targetValue: z.string().optional(),
      })
      .parse(req.body)
    const id = newId('bc')
    await db.execute({
      sql: 'INSERT INTO broadcasts (id, sender_id, judul, pesan, target_type, target_value) VALUES (?,?,?,?,?,?)',
      args: [
        id,
        req.user!.id,
        body.judul,
        body.pesan,
        body.targetType,
        body.targetValue ?? null,
      ],
    })
    const result = await db.execute({
      sql: 'SELECT * FROM broadcasts WHERE id = ?',
      args: [id],
    })
    res.status(201).json(mapBroadcast(result.rows[0]))
  })
)

export default router
