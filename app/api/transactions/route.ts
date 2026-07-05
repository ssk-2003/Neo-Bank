import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const category = searchParams.get('category')
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const skip = (page - 1) * limit

  // Get all account IDs for this user
  const userAccounts = await prisma.account.findMany({
    where: { userId: user!.id },
    select: { id: true },
  })
  const accountIds = userAccounts.map((a) => a.id)

  const where: Record<string, unknown> = {
    OR: [
      { accountId: { in: accountIds } },
      { senderId: user!.id },
      { receiverId: user!.id },
    ],
  }

  if (category) where.category = category
  if (type) where.type = type
  if (status) where.status = status
  if (search) where.description = { contains: search }
  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate) } : {}),
    }
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        sender: { select: { firstName: true, lastName: true, email: true, avatar: true } },
        receiver: { select: { firstName: true, lastName: true, email: true, avatar: true } },
        account: { select: { type: true, currency: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ])

  return NextResponse.json({
    transactions,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  })
}
