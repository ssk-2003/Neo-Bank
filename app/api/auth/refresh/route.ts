import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, signAccessToken, signRefreshToken, setAuthCookies } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value
    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
    }

    const payload = verifyRefreshToken(refreshToken)
    const newAccessToken = signAccessToken({ userId: payload.userId, email: payload.email, role: payload.role })
    const newRefreshToken = signRefreshToken({ userId: payload.userId, email: payload.email, role: payload.role })

    const response = NextResponse.json({ accessToken: newAccessToken, message: 'Tokens refreshed' })
    return setAuthCookies(response, newAccessToken, newRefreshToken)
  } catch {
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 })
  }
}
