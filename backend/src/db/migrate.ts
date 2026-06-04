import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { db } from './client.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function migrate() {
  console.log('Running migrations…')
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')

  // Strip comment lines first, then split on semicolons that end statements
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
      console.error('Failed statement:\n', stmt.slice(0, 200))
      throw err
    }
  }
  console.log(`✓ Applied ${statements.length} statements.`)
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
