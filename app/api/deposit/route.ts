import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const depositSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  amount: z.number().positive('Amount must be positive').max(100000, 'Max deposit is $100,000'),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  try {
    const body = await request.json()
    const data = depositSchema.parse(body)

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: { id: data.accountId, userId: user!.id, status: 'ACTIVE' },
    })
    if (!account) {
      return NextResponse.json({ error: 'Account not found or inactive' }, { status: 404 })
    }

    const reference = 'DEP' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase()

    // Credit account and create transaction record
    const [updatedAccount] = await prisma.$transaction([
      prisma.account.update({
        where: { id: data.accountId },
        data: { balance: { increment: data.amount } },
      }),
      prisma.transaction.create({
        data: {
          accountId: data.accountId,
          receiverId: user!.id,
          amount: data.amount,
          type: 'DEPOSIT',
          category: 'OTHER',
          description: data.description || 'Demo Money Deposit',
          status: 'COMPLETED',
          reference,
        },
      }),
      prisma.notification.create({
        data: {
          userId: user!.id,
          title: 'Demo Money Added 💰',
          message: `$${data.amount.toLocaleString()} demo funds added to your account ending in ${account.accountNumber.slice(-4)}.`,
          type: 'SUCCESS',
        },
      }),
    ])

    return NextResponse.json({
      account: updatedAccount,
      reference,
      amount: data.amount,
      message: 'Demo funds added successfully!',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Deposit error:', error)
    return NextResponse.json({ error: 'Deposit failed' }, { status: 500 })
  }
}
