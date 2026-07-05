import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(request)
  if (response) return response
  const { id } = await params

  const account = await prisma.account.findFirst({
    where: { id, userId: user!.id },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  return NextResponse.json({ account })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(request)
  if (response) return response
  const { id } = await params

  const account = await prisma.account.findFirst({ where: { id, userId: user!.id } })
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const body = await request.json()
  const { status } = body

  const updated = await prisma.account.update({
    where: { id },
    data: { status },
  })
  return NextResponse.json({ account: updated })
}
