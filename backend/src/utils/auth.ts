import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import type { Role } from '../types.js'

export interface JwtPayload {
  sub: string // resident id
  role: Role
}

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10)
export const verifyPassword = (plain: string, hash: string) =>
  bcrypt.compare(plain, hash)

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload
}
