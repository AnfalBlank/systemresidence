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
