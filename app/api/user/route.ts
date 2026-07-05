import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const fullUser = await prisma.user.findUnique({
    where: { id: user!.id },
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true,
      role: true, status: true, emailVerified: true, twoFactorEnabled: true,
      referralCode: true, referredBy: true, createdAt: true,
      rewardPoints: true,
      settings: true,
      _count: { select: { accounts: true, loans: true, cards: true } },
    },
  })

  return NextResponse.json({ user: fullUser })
}

const updateSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const body = await request.json()

  // Handle password change
  if (body.currentPassword && body.newPassword) {
    const fullUser = await prisma.user.findUnique({ where: { id: user!.id } })
    const match = await bcrypt.compare(body.currentPassword, fullUser!.password)
    if (!match) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })

    const schema = z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/)
    schema.parse(body.newPassword)

    const hashed = await bcrypt.hash(body.newPassword, 12)
    await prisma.user.update({ where: { id: user!.id }, data: { password: hashed } })

    await prisma.notification.create({
      data: { userId: user!.id, title: 'Password Changed', message: 'Your password was changed successfully.', type: 'INFO' },
    })
    return NextResponse.json({ message: 'Password updated successfully' })
  }

  const data = updateSchema.parse(body)
  const updated = await prisma.user.update({
    where: { id: user!.id },
    data,
    select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true, role: true },
  })
  return NextResponse.json({ user: updated })
}
