import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const cards = await prisma.card.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ cards })
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const body = await request.json()
  const { cardType = 'VISA' } = body

  const groups = Array.from({ length: 4 }, () => Math.floor(1000 + Math.random() * 9000))
  const cardNumber = groups.join(' ')
  const year = new Date().getFullYear() + Math.floor(Math.random() * 5) + 1
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')
  const expiry = `${month}/${String(year).slice(2)}`
  const cvv = String(Math.floor(100 + Math.random() * 900))

  const card = await prisma.card.create({
    data: {
      userId: user!.id,
      cardNumber,
      expiry,
      cvv,
      cardType,
      status: 'ACTIVE',
    },
  })

  await prisma.notification.create({
    data: {
      userId: user!.id,
      title: 'New Card Issued',
      message: `Your new ${cardType} card ending in ${cardNumber.slice(-4)} is ready to use.`,
      type: 'SUCCESS',
    },
  })

  return NextResponse.json({ card }, { status: 201 })
}
