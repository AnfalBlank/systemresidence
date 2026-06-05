import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapVoting, mapVotingOption } from '../utils/mappers.js'
import { newId } from '../utils/id.js'
import { notifyMany, resolveTargetUsers } from '../utils/notify.js'

const router = Router()
router.use(requireAuth)

const unitKey = (req: { user?: { blok: string; lantai: string; nomor_unit: string } }) =>
  `${req.user!.blok}-${req.user!.lantai}-${req.user!.nomor_unit}`

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const uk = unitKey(req)
    const votingsResult = await db.execute(`
      SELECT v.*,
        (SELECT COUNT(*) FROM voting_ballots WHERE voting_id = v.id) as total_suara,
        (SELECT COUNT(*) FROM voting_ballots WHERE voting_id = v.id AND unit_key = '${uk.replace(/'/g, "''")}') as sudah_memilih
      FROM votings v ORDER BY v.created_at DESC
    `)
    const votings = votingsResult.rows.map(mapVoting)

    // Fetch options for all votings
    const optsResult = await db.execute(`
      SELECT o.*, (SELECT COUNT(*) FROM voting_ballots WHERE option_id = o.id) as suara
      FROM voting_options o
    `)
    const opts = optsResult.rows.reduce<Record<string, ReturnType<typeof mapVotingOption>[]>>(
      (acc, row) => {
        const vid = String(row.voting_id)
        if (!acc[vid]) acc[vid] = []
        acc[vid].push(mapVotingOption(row))
        return acc
      },
      {}
    )

    res.json(
      votings.map((v) => ({ ...v, opsi: opts[v.id] ?? [] }))
    )
  })
)

router.post(
  '/',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        judul: z.string().min(1),
        tipe: z.enum(['Pemilihan Ketua', 'Musyawarah', 'Persetujuan Program']),
        deskripsi: z.string().optional(),
        berakhir: z.string(),
        opsi: z.array(z.string().min(1)).min(2),
      })
      .parse(req.body)
    const id = newId('v')
    await db.execute({
      sql: 'INSERT INTO votings (id, judul, tipe, deskripsi, berakhir) VALUES (?,?,?,?,?)',
      args: [id, body.judul, body.tipe, body.deskripsi ?? '', body.berakhir],
    })
    for (const label of body.opsi) {
      await db.execute({
        sql: 'INSERT INTO voting_options (id, voting_id, label) VALUES (?,?,?)',
        args: [newId('vo'), id, label],
      })
    }
    const userIds = await resolveTargetUsers('Seluruh Warga')
    await notifyMany(userIds, {
      type: 'event',
      title: `Voting Baru: ${body.judul}`,
      message: `${body.tipe} · Berakhir ${body.berakhir}`,
      link: '/voting',
      entityId: id,
    })
    res.status(201).json({ id })
  })
)

// Cast vote — enforces 1 unit = 1 vote
router.post(
  '/:id/vote',
  asyncHandler(async (req, res) => {
    const { optionId } = z.object({ optionId: z.string() }).parse(req.body)
    const uk = unitKey(req)
    try {
      await db.execute({
        sql: 'INSERT INTO voting_ballots (id, voting_id, option_id, unit_key, resident_id) VALUES (?,?,?,?,?)',
        args: [newId('vb'), req.params.id, optionId, uk, req.user!.id],
      })
      res.json({ ok: true })
    } catch (err) {
      if (err instanceof Error && err.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'Unit Anda sudah memberikan suara.' })
      }
      throw err
    }
  })
)

router.patch(
  '/:id/close',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    await db.execute({
      sql: "UPDATE votings SET status = 'Selesai' WHERE id = ?",
      args: [req.params.id],
    })
    res.json({ ok: true })
  })
)

router.delete(
  '/:id',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    // ballots & options cascade via FK ON DELETE CASCADE
    await db.execute({ sql: 'DELETE FROM votings WHERE id = ?', args: [req.params.id] })
    res.json({ ok: true })
  })
)

export default router
