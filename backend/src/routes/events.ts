import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { mapEvent } from '../utils/mappers.js'
import { newId } from '../utils/id.js'

const router = Router()
router.use(requireAuth)

const selectEventSql = (uid: string) => `
  SELECT
    e.*,
    (SELECT COUNT(*) FROM event_rsvp WHERE event_id = e.id) as terdaftar,
    EXISTS(SELECT 1 FROM event_rsvp WHERE event_id = e.id AND resident_id = '${uid.replace(/'/g, "''")}') as rsvp
  FROM events e
`

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await db.execute(
      `${selectEventSql(req.user!.id)} ORDER BY e.tanggal ASC`
    )
    res.json(result.rows.map(mapEvent))
  })
)

router.post(
  '/',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        nama: z.string().min(1),
        tipe: z.enum(['Kerja Bakti', 'Bazar', 'Pengajian', 'Senam', 'Perlombaan']),
        deskripsi: z.string().optional(),
        tanggal: z.string(),
        waktu: z.string(),
        lokasi: z.string(),
        kuota: z.number().int().nonnegative(),
        foto: z.string().optional(),
      })
      .parse(req.body)
    const id = newId('e')
    await db.execute({
      sql: 'INSERT INTO events (id, nama, tipe, deskripsi, tanggal, waktu, lokasi, kuota, foto) VALUES (?,?,?,?,?,?,?,?,?)',
      args: [
        id,
        body.nama,
        body.tipe,
        body.deskripsi ?? '',
        body.tanggal,
        body.waktu,
        body.lokasi,
        body.kuota,
        body.foto ?? null,
      ],
    })
    res.status(201).json({ id })
  })
)

router.post(
  '/:id/rsvp',
  asyncHandler(async (req, res) => {
    const exists = await db.execute({
      sql: 'SELECT 1 FROM event_rsvp WHERE event_id = ? AND resident_id = ?',
      args: [req.params.id, req.user!.id],
    })
    if (exists.rows.length > 0) {
      await db.execute({
        sql: 'DELETE FROM event_rsvp WHERE event_id = ? AND resident_id = ?',
        args: [req.params.id, req.user!.id],
      })
      return res.json({ rsvp: false })
    }
    // Check kuota
    const eventResult = await db.execute({
      sql: 'SELECT kuota, (SELECT COUNT(*) FROM event_rsvp WHERE event_id = ?) as terdaftar FROM events WHERE id = ?',
      args: [req.params.id, req.params.id],
    })
    const event = eventResult.rows[0]
    if (!event) return res.status(404).json({ error: 'Event tidak ditemukan' })
    if (Number(event.terdaftar) >= Number(event.kuota)) {
      return res.status(400).json({ error: 'Kuota event sudah penuh' })
    }
    await db.execute({
      sql: 'INSERT INTO event_rsvp (event_id, resident_id) VALUES (?,?)',
      args: [req.params.id, req.user!.id],
    })
    res.json({ rsvp: true })
  })
)

// Mark attendance via QR scan
router.post(
  '/:id/attend',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    const { residentId } = z.object({ residentId: z.string() }).parse(req.body)
    await db.execute({
      sql: 'UPDATE event_rsvp SET attended = 1 WHERE event_id = ? AND resident_id = ?',
      args: [req.params.id, residentId],
    })
    res.json({ ok: true })
  })
)

router.patch(
  '/:id',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        nama: z.string().min(1).optional(),
        tipe: z.enum(['Kerja Bakti', 'Bazar', 'Pengajian', 'Senam', 'Perlombaan']).optional(),
        deskripsi: z.string().optional(),
        tanggal: z.string().optional(),
        waktu: z.string().optional(),
        lokasi: z.string().optional(),
        kuota: z.number().int().nonnegative().optional(),
        foto: z.string().optional(),
      })
      .parse(req.body)
    const updates: string[] = []
    const args: (string | number | null)[] = []
    if (body.nama !== undefined) { updates.push('nama = ?'); args.push(body.nama) }
    if (body.tipe !== undefined) { updates.push('tipe = ?'); args.push(body.tipe) }
    if (body.deskripsi !== undefined) { updates.push('deskripsi = ?'); args.push(body.deskripsi) }
    if (body.tanggal !== undefined) { updates.push('tanggal = ?'); args.push(body.tanggal) }
    if (body.waktu !== undefined) { updates.push('waktu = ?'); args.push(body.waktu) }
    if (body.lokasi !== undefined) { updates.push('lokasi = ?'); args.push(body.lokasi) }
    if (body.kuota !== undefined) { updates.push('kuota = ?'); args.push(body.kuota) }
    if (body.foto !== undefined) { updates.push('foto = ?'); args.push(body.foto || null) }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })
    args.push(req.params.id)
    await db.execute({ sql: `UPDATE events SET ${updates.join(', ')} WHERE id = ?`, args })
    res.json({ ok: true })
  })
)

router.delete(
  '/:id',
  requireRole('super_admin', 'pengelola'),
  asyncHandler(async (req, res) => {
    await db.execute({ sql: 'DELETE FROM events WHERE id = ?', args: [req.params.id] })
    res.json({ ok: true })
  })
)

export default router
