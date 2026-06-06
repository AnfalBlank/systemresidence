import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { errorHandler } from './middleware/error.js'
import authRouter from './routes/auth.js'
import residentsRouter from './routes/residents.js'
import announcementsRouter from './routes/announcements.js'
import obituariesRouter from './routes/obituaries.js'
import duesRouter from './routes/dues.js'
import financeRouter from './routes/finance.js'
import marketplaceRouter from './routes/marketplace.js'
import complaintsRouter from './routes/complaints.js'
import panicRouter from './routes/panic.js'
import visitorsRouter from './routes/visitors.js'
import feedRouter from './routes/feed.js'
import chatRouter from './routes/chat.js'
import eventsRouter from './routes/events.js'
import bookingRouter from './routes/booking.js'
import votingRouter from './routes/voting.js'
import crowdfundingRouter from './routes/crowdfunding.js'
import wasteBankRouter from './routes/wasteBank.js'
import skillRouter from './routes/skill.js'
import umkmRouter from './routes/umkm.js'
import broadcastRouter from './routes/broadcast.js'
import dashboardRouter from './routes/dashboard.js'
import notificationsRouter from './routes/notifications.js'
import settingsRouter from './routes/settings.js'

const app = express()

app.use(cors({ origin: config.corsOrigin, credentials: true }))
app.use(express.json({ limit: '2mb' }))

app.get('/health', (_req, res) => res.json({ ok: true, time: Date.now() }))

app.use('/api/auth', authRouter)
app.use('/api/residents', residentsRouter)
app.use('/api/announcements', announcementsRouter)
app.use('/api/obituaries', obituariesRouter)
app.use('/api/dues', duesRouter)
app.use('/api/finance', financeRouter)
app.use('/api/marketplace', marketplaceRouter)
app.use('/api/complaints', complaintsRouter)
app.use('/api/panic', panicRouter)
app.use('/api/visitors', visitorsRouter)
app.use('/api/feed', feedRouter)
app.use('/api/chat', chatRouter)
app.use('/api/events', eventsRouter)
app.use('/api/booking', bookingRouter)
app.use('/api/voting', votingRouter)
app.use('/api/crowdfunding', crowdfundingRouter)
app.use('/api/waste-bank', wasteBankRouter)
app.use('/api/skill', skillRouter)
app.use('/api/umkm', umkmRouter)
app.use('/api/broadcast', broadcastRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/settings', settingsRouter)

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`✓ KSTP Cakung backend listening on port ${config.port}`)
  console.log(`  Health: http://localhost:${config.port}/health`)
  console.log(`  CORS origin: ${config.corsOrigin}`)
})
