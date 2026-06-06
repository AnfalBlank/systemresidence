import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { db } from './client.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Idempotent column additions for tables that may already exist with older schema.
async function safeAddColumn(table: string, column: string, ddl: string) {
  try {
    const info = await db.execute(`PRAGMA table_info(${table})`)
    const has = info.rows.some((r) => String(r.name) === column)
    if (!has) {
      await db.execute(`ALTER TABLE ${table} ADD COLUMN ${ddl}`)
      console.log(`  + Added ${table}.${column}`)
    }
  } catch (err) {
    console.error(`  ! Failed to ensure ${table}.${column}:`, err)
  }
}

async function migrate() {
  console.log('Running migrations…')
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')

  const cleaned = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')

  const statements = cleaned
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const stmt of statements) {
    try {
      await db.execute(stmt)
    } catch (err) {
      // Tolerate "no such column: username" while the older table is still
      // missing the column — we'll add it via safeAddColumn next, then create
      // the index afterwards.
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('no such column: username')) {
        console.log('  (deferring index creation until column exists)')
        continue
      }
      console.error('Failed statement:\n', stmt.slice(0, 200))
      throw err
    }
  }

  // Ensure new columns on pre-existing tables
  await safeAddColumn('residents', 'username', 'username TEXT')

  // Now safe to create the username indexes
  try {
    await db.execute(
      'CREATE INDEX IF NOT EXISTS idx_residents_username ON residents(username)'
    )
    await db.execute(
      'CREATE UNIQUE INDEX IF NOT EXISTS uniq_residents_username ON residents(username) WHERE username IS NOT NULL'
    )
  } catch (err) {
    console.error('  ! username indexes:', err)
  }

  // Seed default dues settings if not present
  const duesDefaults = [
    { jenis: 'IPL', enabled: 1, amount: 150000, due: 10, desc: 'Iuran Pemeliharaan Lingkungan' },
    { jenis: 'Kebersihan', enabled: 1, amount: 50000, due: 10, desc: 'Iuran kebersihan & pengangkutan sampah' },
    { jenis: 'Keamanan', enabled: 1, amount: 75000, due: 10, desc: 'Iuran keamanan & ronda' },
    { jenis: 'Dana Sosial', enabled: 1, amount: 25000, due: 10, desc: 'Dana sosial & kegiatan warga' },
  ]
  for (const d of duesDefaults) {
    await db.execute({
      sql: `INSERT INTO dues_settings (jenis, enabled, default_amount, due_day, deskripsi)
            VALUES (?,?,?,?,?) ON CONFLICT(jenis) DO NOTHING`,
      args: [d.jenis, d.enabled, d.amount, d.due, d.desc],
    })
  }

  // Seed default payment settings if not present
  const paymentDefaults: Record<string, string> = {
    bank_name: 'Bank BCA',
    bank_account_number: '1234567890',
    bank_account_holder: 'Kas KSTP Cakung',
    qris_image_url: '',
    payment_note: 'Transfer sesuai nominal lalu konfirmasi melalui aplikasi.',
  }
  for (const [key, value] of Object.entries(paymentDefaults)) {
    await db.execute({
      sql: `INSERT INTO app_settings (key, value) VALUES (?,?) ON CONFLICT(key) DO NOTHING`,
      args: [key, value],
    })
  }

  // Seed default expense categories
  const expenseCats = ['Operasional', 'Kebersihan', 'Keamanan', 'Utilitas', 'Perbaikan', 'Kegiatan', 'Lainnya']
  for (const nama of expenseCats) {
    await db.execute({
      sql: `INSERT INTO expense_categories (id, nama) VALUES (?,?) ON CONFLICT(nama) DO NOTHING`,
      args: [`ec-${nama.toLowerCase()}`, nama],
    })
  }

  console.log(`✓ Applied ${statements.length} statements + idempotent column checks + defaults.`)
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
