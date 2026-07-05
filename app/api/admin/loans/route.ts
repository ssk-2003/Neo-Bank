import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request)
  if (response) return response

  const loans = await prisma.loan.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
    },
  })
  return NextResponse.json({ loans })
}

export async function PUT(request: NextRequest) {
  const { response } = await requireAdmin(request)
  if (response) return response

  const body = await request.json()
  const { loanId, status, notes } = body

  if (!loanId || !status) return NextResponse.json({ error: 'loanId and status required' }, { status: 400 })

  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { user: { select: { firstName: true, lastName: true } } },
  })
  if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 })

  const updated = await prisma.loan.update({
    where: { id: loanId },
    data: { status, ...(notes && { notes }) },
  })

  // If approved, credit loan amount to user's account
  if (status === 'APPROVED' || status === 'ACTIVE') {
    const account = await prisma.account.findFirst({ where: { userId: loan.userId, status: 'ACTIVE' } })
    if (account) {
      await prisma.account.update({ where: { id: account.id }, data: { balance: { increment: loan.amount } } })
      await prisma.transaction.create({
        data: {
          accountId: account.id,
          receiverId: loan.userId,
          amount: loan.amount,
          type: 'DEPOSIT',
          category: 'OTHER',
          description: `Loan disbursement - ${loan.purpose}`,
          status: 'COMPLETED',
          reference: 'LOAN' + Date.now(),
        },
      })
    }
  }

  // Notify user
  const notifMap: Record<string, { title: string; message: string; type: string }> = {
    APPROVED: { title: 'Loan Approved! 🎉', message: `Your loan of $${loan.amount.toLocaleString()} has been approved and disbursed to your account.`, type: 'SUCCESS' },
    ACTIVE: { title: 'Loan Disbursed', message: `Your loan of $${loan.amount.toLocaleString()} is now active.`, type: 'SUCCESS' },
    REJECTED: { title: 'Loan Application Rejected', message: notes || 'Your loan application was not approved. Contact support for details.', type: 'ERROR' },
  }

  const notif = notifMap[status]
  if (notif) {
    await prisma.notification.create({ data: { userId: loan.userId, ...notif } })
  }

  return NextResponse.json({ loan: updated })
}
