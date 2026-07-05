import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const accounts = await prisma.account.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ accounts })
}

const createAccountSchema = z.object({
  type: z.enum(['CHECKING', 'SAVINGS', 'BUSINESS', 'INVESTMENT']),
  currency: z.string().default('USD'),
})

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const body = await request.json()
  const data = createAccountSchema.parse(body)

  const accountNumber = Math.random().toString().slice(2, 12).padStart(10, '0')
  const account = await prisma.account.create({
    data: {
      userId: user!.id,
      accountNumber,
      type: data.type,
      balance: 0,
      currency: data.currency,
      status: 'ACTIVE',
    },
  })

  await prisma.notification.create({
    data: {
      userId: user!.id,
      title: 'New Account Created',
      message: `Your ${data.type.toLowerCase()} account ending in ${accountNumber.slice(-4)} has been created.`,
      type: 'SUCCESS',
    },
  })

  return NextResponse.json({ account }, { status: 201 })
}
