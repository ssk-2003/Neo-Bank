import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const transferSchema = z.object({
  fromAccountId: z.string(),
  toEmail: z.string().email('Invalid recipient email'),
  amount: z.number().positive('Amount must be positive').max(1000000, 'Amount too large'),
  category: z.string().default('OTHER'),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  try {
    const body = await request.json()
    const data = transferSchema.parse(body)

    // Validate sender account
    const senderAccount = await prisma.account.findFirst({
      where: { id: data.fromAccountId, userId: user!.id, status: 'ACTIVE' },
    })
    if (!senderAccount) {
      return NextResponse.json({ error: 'Sender account not found or inactive' }, { status: 404 })
    }

    // Check balance
    if (senderAccount.balance < data.amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Self-transfer check
    if (data.toEmail === user!.email) {
      return NextResponse.json({ error: 'Cannot transfer to yourself' }, { status: 400 })
    }

    // Find receiver
    const receiver = await prisma.user.findUnique({ where: { email: data.toEmail } })
    if (!receiver) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }
    if (receiver.status === 'FROZEN' || receiver.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'Recipient account is unavailable' }, { status: 400 })
    }

    // Find receiver's primary account
    const receiverAccount = await prisma.account.findFirst({
      where: { userId: receiver.id, status: 'ACTIVE', type: 'CHECKING' },
    })
    if (!receiverAccount) {
      return NextResponse.json({ error: 'Recipient has no active account' }, { status: 404 })
    }

    const reference = 'TXN' + Date.now() + Math.random().toString(36).slice(2, 8).toUpperCase()

    // Execute transfer in transaction
    await prisma.$transaction([
      prisma.account.update({
        where: { id: senderAccount.id },
        data: { balance: { decrement: data.amount } },
      }),
      prisma.account.update({
        where: { id: receiverAccount.id },
        data: { balance: { increment: data.amount } },
      }),
      prisma.transaction.create({
        data: {
          senderId: user!.id,
          receiverId: receiver.id,
          accountId: senderAccount.id,
          amount: data.amount,
          type: 'TRANSFER',
          category: data.category,
          description: data.description || `Transfer to ${receiver.firstName} ${receiver.lastName}`,
          status: 'COMPLETED',
          reference,
        },
      }),
      // Receiver transaction record
      prisma.transaction.create({
        data: {
          senderId: user!.id,
          receiverId: receiver.id,
          accountId: receiverAccount.id,
          amount: data.amount,
          type: 'TRANSFER',
          category: data.category,
          description: data.description || `Transfer from ${user!.firstName} ${user!.lastName}`,
          status: 'COMPLETED',
          reference: reference + '_R',
        },
      }),
      // Sender notification
      prisma.notification.create({
        data: {
          userId: user!.id,
          title: 'Transfer Successful',
          message: `You sent $${data.amount.toFixed(2)} to ${receiver.firstName} ${receiver.lastName}.`,
          type: 'SUCCESS',
        },
      }),
      // Receiver notification
      prisma.notification.create({
        data: {
          userId: receiver.id,
          title: 'Money Received',
          message: `You received $${data.amount.toFixed(2)} from ${user!.firstName} ${user!.lastName}.`,
          type: 'SUCCESS',
        },
      }),
    ])

    // Update reward points (1 point per $10 transferred)
    const pointsEarned = Math.floor(data.amount / 10)
    if (pointsEarned > 0) {
      await prisma.rewardPoints.upsert({
        where: { userId: user!.id },
        update: { points: { increment: pointsEarned }, totalEarned: { increment: pointsEarned } },
        create: { userId: user!.id, points: pointsEarned, totalEarned: pointsEarned },
      })
    }

    return NextResponse.json({
      message: 'Transfer successful',
      reference,
      amount: data.amount,
      recipient: { name: `${receiver.firstName} ${receiver.lastName}`, email: receiver.email },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Transfer error:', error)
    return NextResponse.json({ error: 'Transfer failed' }, { status: 500 })
  }
}
