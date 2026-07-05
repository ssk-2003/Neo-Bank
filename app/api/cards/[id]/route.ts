import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(request)
  if (response) return response
  const { id } = await params

  const card = await prisma.card.findFirst({ where: { id, userId: user!.id } })
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

  const body = await request.json()
  const { status } = body

  const updated = await prisma.card.update({ where: { id }, data: { status } })

  const action = status === 'FROZEN' ? 'frozen' : status === 'ACTIVE' ? 'unfrozen' : 'cancelled'
  await prisma.notification.create({
    data: {
      userId: user!.id,
      title: `Card ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      message: `Your card ending in ${card.cardNumber.slice(-4)} has been ${action}.`,
      type: status === 'CANCELLED' ? 'WARNING' : 'INFO',
    },
  })

  return NextResponse.json({ card: updated })
}
