import 'dotenv/config'

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

export const config = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  jwtSecret: required('JWT_SECRET'),
  tursoUrl: required('TURSO_DATABASE_URL'),
  tursoToken: required('TURSO_AUTH_TOKEN'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
}
