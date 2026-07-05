import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const settings = await prisma.settings.findUnique({ where: { userId: user!.id } })
  return NextResponse.json({ settings })
}

export async function PUT(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const body = await request.json()
  const {
    theme, language, currency, emailNotifications, pushNotifications,
    transferAlerts, loginAlerts, marketingEmails, twoFactorEnabled,
  } = body

  const settings = await prisma.settings.upsert({
    where: { userId: user!.id },
    update: {
      ...(theme !== undefined && { theme }),
      ...(language !== undefined && { language }),
      ...(currency !== undefined && { currency }),
      ...(emailNotifications !== undefined && { emailNotifications }),
      ...(pushNotifications !== undefined && { pushNotifications }),
      ...(transferAlerts !== undefined && { transferAlerts }),
      ...(loginAlerts !== undefined && { loginAlerts }),
      ...(marketingEmails !== undefined && { marketingEmails }),
      ...(twoFactorEnabled !== undefined && { twoFactorEnabled }),
    },
    create: { userId: user!.id, theme: theme || 'dark', language: language || 'en', currency: currency || 'USD' },
  })

  return NextResponse.json({ settings })
}
