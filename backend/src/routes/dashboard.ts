import { Router } from 'express'
import { db } from '../db/client.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import {
  mapAnnouncement,
  mapCampaign,
  mapComplaint,
  mapDues,
  mapEvent,
  mapObituary,
  mapProduct,
} from '../utils/mappers.js'

const router = Router()
router.use(requireAuth)

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const me = req.user!.id

    const [duesRes, annRes, obRes, evRes, cfRes, prodRes, complRes] =
      await Promise.all([
        db.execute({
          sql: 'SELECT * FROM dues WHERE resident_id = ? ORDER BY jatuh_tempo DESC LIMIT 10',
          args: [me],
        }),
        db.execute('SELECT * FROM announcements ORDER BY tanggal DESC LIMIT 1'),
        db.execute('SELECT * FROM obituaries ORDER BY tanggal DESC LIMIT 1'),
        db.execute(`
          SELECT e.*,
            (SELECT COUNT(*) FROM event_rsvp WHERE event_id = e.id) as terdaftar,
            0 as rsvp
          FROM events e WHERE e.tanggal >= date('now', '-1 day') ORDER BY e.tanggal ASC LIMIT 1
        `),
        db.execute(`
          SELECT c.*,
            COALESCE((SELECT SUM(jumlah) FROM donations WHERE campaign_id = c.id), 0) as terkumpul,
            (SELECT COUNT(*) FROM donations WHERE campaign_id = c.id) as donatur
          FROM campaigns c WHERE c.berakhir >= date('now') ORDER BY c.created_at DESC LIMIT 1
        `),
        db.execute(`
          SELECT p.*, r.nama as seller_nama, r.blok as seller_blok, r.lantai as seller_lantai, r.nomor_unit as seller_nomor
          FROM products p JOIN residents r ON r.id = p.seller_id
          ORDER BY p.created_at DESC LIMIT 4
        `),
        db.execute({
          sql: `SELECT c.*, r.nama as pelapor, r.blok, r.lantai, r.nomor_unit
                FROM complaints c JOIN residents r ON r.id = c.resident_id
                WHERE c.resident_id = ? AND c.status != 'Selesai'
                ORDER BY c.created_at DESC LIMIT 1`,
          args: [me],
        }),
      ])

    res.json({
      dues: duesRes.rows.map(mapDues),
      latestAnnouncement: annRes.rows[0] ? mapAnnouncement(annRes.rows[0]) : null,
      latestObituary: obRes.rows[0] ? mapObituary(obRes.rows[0]) : null,
      nextEvent: evRes.rows[0] ? mapEvent(evRes.rows[0]) : null,
      activeCampaign: cfRes.rows[0] ? mapCampaign(cfRes.rows[0]) : null,
      latestProducts: prodRes.rows.map(mapProduct),
      activeComplaint: complRes.rows[0] ? mapComplaint(complRes.rows[0]) : null,
    })
  })
)

export default router
