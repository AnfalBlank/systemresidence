import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.flatten().fieldErrors,
    })
  }
  if (err instanceof Error) {
    console.error('[error]', err.message, err.stack)
    return res.status(500).json({ error: err.message })
  }
  console.error('[error]', err)
  res.status(500).json({ error: 'Internal server error' })
}

// Async route wrapper to catch promise rejections
export const asyncHandler =
  <T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(fn: T) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next)
