import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const loans = await prisma.loan.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ loans })
}

const loanSchema = z.object({
  amount: z.number().positive().min(1000, 'Minimum loan amount is $1,000').max(100000, 'Maximum loan amount is $100,000'),
  duration: z.number().int().min(3).max(60),
  purpose: z.string().min(3),
  employment: z.string().min(2),
  income: z.number().positive(),
})

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const body = await request.json()
  const data = loanSchema.parse(body)

  // Check for existing pending loan
  const pendingLoan = await prisma.loan.findFirst({
    where: { userId: user!.id, status: 'PENDING' },
  })
  if (pendingLoan) {
    return NextResponse.json({ error: 'You already have a pending loan application' }, { status: 409 })
  }

  const loan = await prisma.loan.create({
    data: {
      userId: user!.id,
      amount: data.amount,
      interestRate: 8.5,
      duration: data.duration,
      purpose: data.purpose,
      employment: data.employment,
      income: data.income,
      status: 'PENDING',
    },
  })

  await prisma.notification.create({
    data: {
      userId: user!.id,
      title: 'Loan Application Submitted',
      message: `Your loan application for $${data.amount.toLocaleString()} is under review. We'll notify you within 1-3 business days.`,
      type: 'INFO',
    },
  })

  return NextResponse.json({ loan, message: 'Loan application submitted successfully' }, { status: 201 })
}
