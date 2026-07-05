import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { user, response } = await requireAdmin(request)
  if (response) return response

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role')
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (role) where.role = role
  if (status) where.status = status
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        avatar: true, role: true, status: true, emailVerified: true, createdAt: true,
        _count: { select: { accounts: true, sentTransactions: true, loans: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({ users, pagination: { total, page, limit, pages: Math.ceil(total / limit) } })
}

export async function PUT(request: NextRequest) {
  const { user: admin, response } = await requireAdmin(request)
  if (response) return response

  const body = await request.json()
  const { userId, status, role } = body

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  // Prevent self-modification
  if (userId === admin!.id) {
    return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(status !== undefined && { status }),
      ...(role !== undefined && { role }),
    },
    select: { id: true, firstName: true, lastName: true, email: true, status: true, role: true },
  })

  // Notify user of status change
  if (status) {
    await prisma.notification.create({
      data: {
        userId,
        title: status === 'FROZEN' ? 'Account Frozen' : 'Account Activated',
        message: status === 'FROZEN'
          ? 'Your account has been frozen by an administrator. Contact support.'
          : 'Your account has been reactivated.',
        type: status === 'FROZEN' ? 'WARNING' : 'SUCCESS',
      },
    })
  }

  return NextResponse.json({ user: updated })
}
