import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/auth.js'
import { db } from '../db/client.js'
import type { AuthedResident, Role } from '../types.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedResident
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const token = header.slice(7)
  try {
    const payload = verifyToken(token)
    const result = await db.execute({
      sql: 'SELECT id, role, nama, blok, lantai, nomor_unit, account_status FROM residents WHERE id = ?',
      args: [payload.sub],
    })
    const row = result.rows[0]
    if (!row) return res.status(401).json({ error: 'User not found' })
    if (row.account_status !== 'Aktif')
      return res.status(403).json({ error: 'Account not active' })
    req.user = {
      id: String(row.id),
      role: row.role as Role,
      nama: String(row.nama),
      blok: String(row.blok),
      lantai: String(row.lantai),
      nomor_unit: String(row.nomor_unit),
    }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden — role not permitted' })
    }
    next()
  }
}
