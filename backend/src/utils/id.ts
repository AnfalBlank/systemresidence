import { randomUUID, randomBytes } from 'crypto'

export const newId = (prefix?: string): string => {
  const u = randomUUID()
  return prefix ? `${prefix}_${u}` : u
}

// Generate KSTP-XXXXXX style invitation codes
export function generateInvitationCode(): string {
  // 6-char base32-ish (avoiding ambiguous chars like 0/O/1/I)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(6)
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += chars[bytes[i] % chars.length]
  }
  return `KSTP-${out}`
}

export function generatePIN(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

// Build a username from name + block. Falls back with numeric suffix on collision.
// Format: <slug-of-first-2-name-tokens>-<blok><lantai><nomor>
// e.g. "Ahmad Fauzi" + B-04-12 → "ahmad.fauzi.b0412"
export function buildBaseUsername(nama: string, blok: string, lantai: string, nomor: string): string {
  const slug = nama
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('.')
  const unitPart = `${blok}${lantai}${nomor}`.toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${slug || 'user'}.${unitPart || 'x'}`
}

import { db } from '../db/client.js'

export async function generateUniqueUsername(
  nama: string, blok: string, lantai: string, nomor: string
): Promise<string> {
  const base = buildBaseUsername(nama, blok, lantai, nomor)
  // Try base; if taken, append .2, .3, ... until free.
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}.${i + 1}`
    const exists = await db.execute({
      sql: 'SELECT 1 FROM residents WHERE username = ? LIMIT 1',
      args: [candidate],
    })
    if (exists.rows.length === 0) return candidate
  }
  // Extreme fallback: append random suffix
  return `${base}.${Math.random().toString(36).slice(2, 6)}`
}
