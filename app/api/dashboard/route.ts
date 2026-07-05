import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const userAccounts = await prisma.account.findMany({
    where: { userId: user!.id },
    select: { id: true },
  })
  const accountIds = userAccounts.map((a) => a.id)

  const [
    accounts, recentTx, budgets, loans, notifications, goals, rewardPoints,
    monthlySpendRaw, monthlyIncomeRaw,
  ] = await Promise.all([
    prisma.account.findMany({ where: { userId: user!.id } }),
    prisma.transaction.findMany({
      where: { OR: [{ accountId: { in: accountIds } }, { senderId: user!.id }, { receiverId: user!.id }] },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        sender: { select: { firstName: true, lastName: true, avatar: true } },
        receiver: { select: { firstName: true, lastName: true, avatar: true } },
      },
    }),
    prisma.budget.findMany({ where: { userId: user!.id, month: now.getMonth() + 1, year: now.getFullYear() } }),
    prisma.loan.findMany({ where: { userId: user!.id }, orderBy: { createdAt: 'desc' }, take: 1 }),
    prisma.notification.findMany({ where: { userId: user!.id, read: false }, take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.goal.findMany({ where: { userId: user!.id, status: 'ACTIVE' }, take: 3 }),
    prisma.rewardPoints.findUnique({ where: { userId: user!.id } }),
    // This month spending
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { senderId: user!.id, type: { not: 'DEPOSIT' }, createdAt: { gte: thisMonthStart } },
    }),
    // This month income
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { receiverId: user!.id, createdAt: { gte: thisMonthStart } },
    }),
  ])

  // Category breakdown (last 30 days) - Standard Prisma GroupBy
  const categoryBreakdownRaw = await prisma.transaction.groupBy({
    by: ['category'],
    _sum: { amount: true },
    where: {
      senderId: user!.id,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  })
  const categoryBreakdown = categoryBreakdownRaw.map((c) => ({
    category: c.category,
    total: c._sum.amount || 0,
  }))

  // Spending trend (last 6 months) - Standard In-Memory Aggregation
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const trendTransactions = await prisma.transaction.findMany({
    where: {
      OR: [{ senderId: user!.id }, { receiverId: user!.id }],
      createdAt: { gte: sixMonthsAgo },
      status: 'COMPLETED',
    },
    select: { amount: true, type: true, senderId: true, receiverId: true, createdAt: true },
  })

  const monthlyMap: Record<string, { month: string; spending: number; income: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap[key] = { month: key, spending: 0, income: 0 }
  }

  for (const tx of trendTransactions) {
    const date = new Date(tx.createdAt)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (monthlyMap[key]) {
      if (tx.senderId === user!.id) {
        monthlyMap[key].spending += tx.amount
      }
      if (tx.receiverId === user!.id) {
        monthlyMap[key].income += tx.amount
      }
    }
  }
  const spendingTrend = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month))

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const monthlyExpenses = monthlySpendRaw._sum.amount || 0
  const monthlyIncome = monthlyIncomeRaw._sum.amount || 0
  const savings = totalBalance

  return NextResponse.json({
    summary: { totalBalance, monthlyIncome, monthlyExpenses, savings },
    accounts,
    recentTransactions: recentTx,
    budgets,
    latestLoan: loans[0] || null,
    notifications,
    goals,
    rewardPoints,
    charts: { categoryBreakdown, spendingTrend },
  })
}
