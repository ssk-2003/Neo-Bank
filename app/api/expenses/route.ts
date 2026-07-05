import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  amount: z.number().positive('Amount must be positive').max(1000000),
  category: z.enum(['FOOD', 'SHOPPING', 'BILLS', 'TRAVEL', 'EDUCATION', 'ENTERTAINMENT', 'HEALTHCARE', 'OTHER']),
  date: z.string().optional(), // ISO date string
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null

  // Get user's account IDs
  const accounts = await prisma.account.findMany({
    where: { userId: user!.id },
    select: { id: true },
  })
  const accountIds = accounts.map((a) => a.id)

  const where: Record<string, unknown> = {
    accountId: { in: accountIds },
    type: 'PAYMENT',
    senderId: user!.id,
  }

  if (category) where.category = category

  if (month && year) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)
    where.createdAt = { gte: startDate, lte: endDate }
  }

  const expenses = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  // Category totals
  const allExpenses = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      type: 'PAYMENT',
      senderId: user!.id,
      ...(month && year
        ? {
            createdAt: {
              gte: new Date(year!, month! - 1, 1),
              lte: new Date(year!, month!, 0, 23, 59, 59),
            },
          }
        : {}),
    },
    select: { category: true, amount: true },
  })

  const categoryTotals: Record<string, number> = {}
  for (const e of allExpenses) {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
  }

  const total = allExpenses.reduce((sum, e) => sum + e.amount, 0)

  return NextResponse.json({ expenses, categoryTotals, total })
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  try {
    const body = await request.json()
    const data = expenseSchema.parse(body)

    // Get primary account
    const account = await prisma.account.findFirst({
      where: { userId: user!.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    })
    if (!account) {
      return NextResponse.json({ error: 'No active account found. Please create an account first.' }, { status: 400 })
    }

    const reference = 'EXP' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase()
    const createdAt = data.date ? new Date(data.date) : new Date()

    const expense = await prisma.transaction.create({
      data: {
        senderId: user!.id,
        accountId: account.id,
        amount: data.amount,
        type: 'PAYMENT',
        category: data.category,
        description: data.title + (data.notes ? ` — ${data.notes}` : ''),
        status: 'COMPLETED',
        reference,
        createdAt,
      },
    })

    // Update budget spent amount
    const now = createdAt
    await prisma.budget.updateMany({
      where: {
        userId: user!.id,
        category: data.category,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
      data: { spent: { increment: data.amount } },
    })

    return NextResponse.json({ expense, message: 'Expense logged successfully!' }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Expense error:', error)
    return NextResponse.json({ error: 'Failed to log expense' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const accounts = await prisma.account.findMany({ where: { userId: user!.id }, select: { id: true } })
  const accountIds = accounts.map((a) => a.id)

  const expense = await prisma.transaction.findFirst({
    where: { id, accountId: { in: accountIds }, type: 'PAYMENT' },
  })
  if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

  await prisma.transaction.delete({ where: { id } })
  return NextResponse.json({ message: 'Expense deleted' })
}
