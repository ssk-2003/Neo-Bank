import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, JWTPayload } from './jwt'

export { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken }
export type { JWTPayload }

/** Extract & verify token from Authorization header or cookie */
export function getTokenFromRequest(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  // Fall back to cookie
  const cookie = request.cookies.get('access_token')
  return cookie?.value || null
}

/** Get the authenticated user from a request — returns null if unauthenticated */
export async function getAuthUser(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) return null

    const payload = verifyAccessToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
    })
    return user
  } catch {
    return null
  }
}

/** Require authentication — returns user or 401 response */
export async function requireAuth(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  if (user.status === 'FROZEN') {
    return {
      user: null,
      response: NextResponse.json({ error: 'Account is frozen. Contact support.' }, { status: 403 }),
    }
  }
  return { user, response: null }
}

/** Require admin role */
export async function requireAdmin(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return { user: null, response }
  if (user!.role !== 'ADMIN') {
    return {
      user: null,
      response: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }),
    }
  }
  return { user, response: null }
}

/** Set auth cookies on a response */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): NextResponse {
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  })
  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })
  return response
}

/** Clear auth cookies */
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete('access_token')
  response.cookies.delete('refresh_token')
  return response
}
