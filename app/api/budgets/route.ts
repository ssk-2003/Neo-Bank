import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const now = new Date()
  const budgets = await prisma.budget.findMany({
    where: { userId: user!.id, month: now.getMonth() + 1, year: now.getFullYear() },
    orderBy: { category: 'asc' },
  })
  return NextResponse.json({ budgets })
}

const budgetSchema = z.object({
  category: z.enum(['FOOD', 'SHOPPING', 'BILLS', 'TRAVEL', 'EDUCATION', 'ENTERTAINMENT', 'HEALTHCARE', 'OTHER']),
  limit: z.number().positive(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().optional(),
})

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const body = await request.json()
  const data = budgetSchema.parse(body)
  const now = new Date()
  const month = data.month || now.getMonth() + 1
  const year = data.year || now.getFullYear()

  const budget = await prisma.budget.upsert({
    where: { userId_category_month_year: { userId: user!.id, category: data.category, month, year } },
    update: { limit: data.limit },
    create: { userId: user!.id, category: data.category, limit: data.limit, spent: 0, month, year },
  })

  return NextResponse.json({ budget }, { status: 201 })
}
