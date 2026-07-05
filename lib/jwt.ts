// @ts-ignore
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'neobank-secret'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'neobank-refresh-secret'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

/** Sign a short-lived access token (15 minutes) */
export function signAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
}

/** Sign a long-lived refresh token (7 days) */
export function signRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

/** Verify access token */
export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

/** Verify refresh token */
export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload
}
