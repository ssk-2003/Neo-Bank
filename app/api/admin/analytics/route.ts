import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request)
  if (response) return response

  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    totalUsers, totalAccounts, totalTransactions, pendingLoans, activeLoans,
    newUsersThisMonth, transactionsThisMonth, revenueThisMonth,
    recentTransactions,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.account.count(),
    prisma.transaction.count(),
    prisma.loan.count({ where: { status: 'PENDING' } }),
    prisma.loan.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.transaction.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: 'TRANSFER', createdAt: { gte: thisMonth } },
    }),
    prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        sender: { select: { firstName: true, lastName: true, email: true } },
        receiver: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
  ])

  // In-memory calculation for users registered per month (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const usersList = await prisma.user.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
  })

  const usersMap: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    usersMap[key] = 0
  }

  for (const u of usersList) {
    const date = new Date(u.createdAt)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (usersMap[key] !== undefined) {
      usersMap[key]++
    }
  }
  const usersByMonth = Object.entries(usersMap).map(([month, count]) => ({ month, count })).sort((a, b) => a.month.localeCompare(b.month))

  // In-memory calculation for transactions per day (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const transactionsList = await prisma.transaction.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { amount: true, createdAt: true },
  })

  const transMap: Record<string, { count: number; total: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    transMap[key] = { count: 0, total: 0 }
  }

  for (const t of transactionsList) {
    const key = new Date(t.createdAt).toISOString().split('T')[0]
    if (transMap[key] !== undefined) {
      transMap[key].count++
      transMap[key].total += t.amount
    }
  }
  const transactionsByDay = Object.entries(transMap).map(([day, val]) => ({
    day,
    count: val.count,
    total: val.total,
  })).sort((a, b) => a.day.localeCompare(b.day))

  return NextResponse.json({
    overview: {
      totalUsers,
      totalAccounts,
      totalTransactions,
      pendingLoans,
      activeLoans,
      newUsersThisMonth,
      transactionsThisMonth,
      systemRevenue: (revenueThisMonth._sum.amount || 0) * 0.001, // 0.1% fee simulation
    },
    charts: { usersByMonth, transactionsByDay },
    recentTransactions,
  })
}
