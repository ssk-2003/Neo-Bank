import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unread') === 'true'

  const notifications = await prisma.notification.findMany({
    where: { userId: user!.id, ...(unreadOnly ? { read: false } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unreadCount = await prisma.notification.count({ where: { userId: user!.id, read: false } })
  return NextResponse.json({ notifications, unreadCount })
}

export async function PUT(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const body = await request.json()
  const { id, markAllRead } = body

  if (markAllRead) {
    await prisma.notification.updateMany({ where: { userId: user!.id }, data: { read: true } })
    return NextResponse.json({ message: 'All notifications marked as read' })
  }

  if (id) {
    const notification = await prisma.notification.findFirst({ where: { id, userId: user!.id } })
    if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const updated = await prisma.notification.update({ where: { id }, data: { read: true } })
    return NextResponse.json({ notification: updated })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}
