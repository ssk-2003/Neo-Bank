import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const goals = await prisma.goal.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ goals })
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const body = await request.json()
  const { name, targetAmount, deadline, category } = body

  const goal = await prisma.goal.create({
    data: {
      userId: user!.id,
      name,
      targetAmount,
      savedAmount: 0,
      deadline: deadline ? new Date(deadline) : null,
      category: category || 'OTHER',
    },
  })
  return NextResponse.json({ goal }, { status: 201 })
}
