import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

/**
 * Rule-based AI Financial Assistant
 * Analyzes user's actual transaction data to give personalized advice.
 * No external API needed — completely free.
 */
export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth(request)
  if (response) return response

  const body = await request.json()
  const { message } = body

  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  // Fetch user financial data
  const [accounts, transactions, budgets, loans, goals, rewardPoints] = await Promise.all([
    prisma.account.findMany({ where: { userId: user!.id, status: 'ACTIVE' } }),
    prisma.transaction.findMany({
      where: {
        OR: [{ senderId: user!.id }, { receiverId: user!.id }],
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.budget.findMany({ where: { userId: user!.id } }),
    prisma.loan.findMany({ where: { userId: user!.id } }),
    prisma.goal.findMany({ where: { userId: user!.id, status: 'ACTIVE' } }),
    prisma.rewardPoints.findUnique({ where: { userId: user!.id } }),
  ])

  // Calculate financial metrics
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const spending = transactions.filter((t) => t.senderId === user!.id)
  const income = transactions.filter((t) => t.receiverId === user!.id)
  const totalSpent = spending.reduce((sum, t) => sum + t.amount, 0)
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)

  // Category breakdown
  const categorySpend: Record<string, number> = {}
  for (const t of spending) {
    categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amount
  }
  const topCategory = Object.entries(categorySpend).sort((a, b) => b[1] - a[1])[0]

  // Monthly data
  const now = new Date()
  const thisMonth = spending.filter((t) => new Date(t.createdAt).getMonth() === now.getMonth())
  const monthlySpend = thisMonth.reduce((sum, t) => sum + t.amount, 0)
  const monthlyIncome = income
    .filter((t) => new Date(t.createdAt).getMonth() === now.getMonth())
    .reduce((sum, t) => sum + t.amount, 0)

  // Over-budget categories
  const overBudget = budgets.filter((b) => b.spent > b.limit)
  const nearBudget = budgets.filter((b) => b.spent / b.limit > 0.85 && b.spent <= b.limit)

  // Savings rate
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0

  // Build context string for response generation
  const ctx = {
    totalBalance,
    totalSpent,
    totalIncome,
    monthlySpend,
    monthlyIncome,
    topCategory,
    categorySpend,
    overBudget,
    nearBudget,
    savingsRate,
    loans,
    goals,
    rewardPoints,
  }

  // Generate intelligent response based on message keywords
  const msg = message.toLowerCase()
  let reply = ''

  if (msg.includes('balance') || msg.includes('how much') || msg.includes('total')) {
    reply = `💰 **Your Current Financial Overview**\n\n` +
      `- **Total Balance**: $${totalBalance.toFixed(2)} across ${accounts.length} account(s)\n` +
      `- **This Month Spent**: $${monthlySpend.toFixed(2)}\n` +
      `- **This Month Income**: $${monthlyIncome.toFixed(2)}\n` +
      `- **Net This Month**: ${monthlyIncome >= monthlySpend ? '+' : ''}$${(monthlyIncome - monthlySpend).toFixed(2)}\n\n` +
      (totalBalance < 500 ? '⚠️ Your balance is getting low. Consider reducing non-essential spending.' :
        totalBalance > 10000 ? '✅ Great job keeping a healthy balance!' : '📊 Your balance looks healthy.')
  } else if (msg.includes('spend') || msg.includes('spent') || msg.includes('expense') || msg.includes('where')) {
    const lines = Object.entries(categorySpend)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => `  - **${cat}**: $${amt.toFixed(2)}`)
      .join('\n')
    reply = `📊 **Your Spending Breakdown (Last 90 Days)**\n\n${lines || 'No spending data available.'}\n\n` +
      (topCategory ? `🏆 Your biggest expense category is **${topCategory[0]}** at $${topCategory[1].toFixed(2)}.` : '')
  } else if (msg.includes('save') || msg.includes('saving') || msg.includes('cut')) {
    reply = `💡 **Personalized Savings Advice**\n\n` +
      `Your current savings rate is **${savingsRate.toFixed(1)}%**.\n\n` +
      `**Tips based on your spending:**\n`
    if (categorySpend['ENTERTAINMENT'] > 100) reply += `- 🎬 You spent $${categorySpend['ENTERTAINMENT']?.toFixed(2)} on entertainment. Consider the 50/30/20 rule.\n`
    if (categorySpend['FOOD'] > 400) reply += `- 🍔 Your food spending ($${categorySpend['FOOD']?.toFixed(2)}) is high. Meal prep can save 30-40%.\n`
    if (categorySpend['SHOPPING'] > 300) reply += `- 🛒 Shopping ($${categorySpend['SHOPPING']?.toFixed(2)}) — try a 24-hour rule before purchases.\n`
    if (overBudget.length > 0) reply += `- ⚠️ You've exceeded budget in: ${overBudget.map((b) => b.category).join(', ')}.\n`
    reply += `\n🎯 **Goal**: Try to reach a 20% savings rate. You're currently at ${savingsRate.toFixed(1)}%.`
  } else if (msg.includes('loan') || msg.includes('borrow') || msg.includes('debt')) {
    const activeLoans = loans.filter((l) => ['APPROVED', 'ACTIVE'].includes(l.status))
    const pendingLoans = loans.filter((l) => l.status === 'PENDING')
    reply = `🏦 **Loan Status**\n\n`
    if (activeLoans.length === 0 && pendingLoans.length === 0) {
      reply += `You have no active loans. Your debt-to-income ratio is excellent!\n\n`
      reply += `💡 If you need a loan, keep it below 30% of your monthly income.`
    } else {
      for (const l of activeLoans) {
        const emi = (l.amount * (l.interestRate / 100 / 12) * Math.pow(1 + l.interestRate / 100 / 12, l.duration)) /
          (Math.pow(1 + l.interestRate / 100 / 12, l.duration) - 1)
        reply += `- **${l.purpose}**: $${l.amount.toLocaleString()} @ ${l.interestRate}% for ${l.duration} months (EMI: ~$${emi.toFixed(2)})\n`
      }
      if (pendingLoans.length > 0) reply += `- ${pendingLoans.length} pending application(s) under review\n`
    }
  } else if (msg.includes('budget') || msg.includes('limit')) {
    reply = `📋 **Budget Status**\n\n`
    if (budgets.length === 0) {
      reply += `You haven't set up any budgets yet. Setting budgets is one of the best ways to control spending!\n\n`
      reply += `💡 Tip: Start with your top spending categories and set realistic limits.`
    } else {
      for (const b of budgets) {
        const pct = (b.spent / b.limit) * 100
        const bar = pct > 100 ? '🔴' : pct > 85 ? '🟡' : '🟢'
        reply += `${bar} **${b.category}**: $${b.spent.toFixed(2)} / $${b.limit.toFixed(2)} (${pct.toFixed(0)}%)\n`
      }
      if (overBudget.length > 0) reply += `\n⚠️ Over budget: ${overBudget.map((b) => b.category).join(', ')}`
    }
  } else if (msg.includes('goal') || msg.includes('target') || msg.includes('dream')) {
    reply = `🎯 **Savings Goals**\n\n`
    if (goals.length === 0) {
      reply += `You haven't set any savings goals yet. Goals help you stay motivated!\n\nTry setting a goal for an emergency fund, vacation, or a big purchase.`
    } else {
      for (const g of goals) {
        const pct = (g.savedAmount / g.targetAmount) * 100
        reply += `- **${g.name}**: $${g.savedAmount.toFixed(2)} / $${g.targetAmount.toFixed(2)} (${pct.toFixed(0)}%)\n`
        if (g.deadline) {
          const days = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
          if (days > 0) {
            const needed = (g.targetAmount - g.savedAmount) / (days / 30)
            reply += `  You need to save ~$${needed.toFixed(2)}/month to hit your deadline.\n`
          }
        }
      }
    }
  } else if (msg.includes('reward') || msg.includes('point') || msg.includes('cashback')) {
    reply = `⭐ **Reward Points**\n\n`
    if (!rewardPoints) {
      reply += `No reward points yet. Start transferring to earn points!`
    } else {
      reply += `- **Current Points**: ${rewardPoints.points.toLocaleString()} pts\n`
      reply += `- **Total Earned**: ${rewardPoints.totalEarned.toLocaleString()} pts\n`
      reply += `- **Tier**: ${rewardPoints.tier} 🏅\n\n`
      reply += `💡 You earn 1 point for every $10 transferred. Keep it up to reach ${
        rewardPoints.tier === 'BRONZE' ? 'Silver (2,000 pts)' :
        rewardPoints.tier === 'SILVER' ? 'Gold (5,000 pts)' :
        rewardPoints.tier === 'GOLD' ? 'Platinum (10,000 pts)' : 'the top tier!'
      }!`
    }
  } else if (msg.includes('advice') || msg.includes('help') || msg.includes('tip') || msg.includes('suggest')) {
    reply = `💼 **Personalized Financial Advice**\n\n`
    const tips = []
    if (savingsRate < 10) tips.push('📉 Your savings rate is below 10%. Aim for at least 20% using the 50/30/20 rule.')
    if (overBudget.length > 0) tips.push(`⚠️ You're over budget in ${overBudget.length} categories. Review and adjust.`)
    if (loans.some((l) => l.status === 'ACTIVE')) tips.push('💳 Pay off your loan EMIs on time to build a strong credit profile.')
    if (totalBalance < 1000) tips.push('🔐 Build an emergency fund of at least 3-6 months of expenses.')
    if (goals.length === 0) tips.push('🎯 Set savings goals to stay motivated and track progress.')
    if (categorySpend['FOOD'] > monthlyIncome * 0.3) tips.push('🍽️ Food spending is more than 30% of income. Meal planning can help.')
    if (tips.length === 0) tips.push('✅ Your finances look healthy! Keep maintaining your budget and savings rate.')
    reply += tips.join('\n\n')
  } else if (msg.includes('biggest') || msg.includes('most') || msg.includes('largest')) {
    if (topCategory) {
      reply = `📊 Your biggest expense is **${topCategory[0]}** at $${topCategory[1].toFixed(2)} over the last 90 days.\n\n`
      reply += `This represents ${((topCategory[1] / totalSpent) * 100).toFixed(1)}% of your total spending.\n\n`
      reply += getCategoryAdvice(topCategory[0])
    } else {
      reply = `No significant spending data found in the last 90 days.`
    }
  } else if (msg.includes('summarize') || msg.includes('summary') || msg.includes('overview')) {
    reply = `📈 **Financial Summary**\n\n`
    reply += `💰 **Total Balance**: $${totalBalance.toFixed(2)}\n`
    reply += `📤 **Total Spent (90d)**: $${totalSpent.toFixed(2)}\n`
    reply += `📥 **Total Income (90d)**: $${totalIncome.toFixed(2)}\n`
    reply += `💾 **Savings Rate**: ${savingsRate.toFixed(1)}%\n`
    reply += `🏦 **Active Loans**: ${loans.filter((l) => ['APPROVED', 'ACTIVE'].includes(l.status)).length}\n`
    reply += `🎯 **Active Goals**: ${goals.length}\n`
    reply += `⭐ **Reward Points**: ${rewardPoints?.points?.toLocaleString() || 0}\n\n`
    if (overBudget.length > 0) reply += `⚠️ Overspent in: ${overBudget.map((b) => b.category).join(', ')}\n`
    reply += `\n${getOverallAssessment(savingsRate, totalBalance, overBudget.length)}`
  } else {
    reply = `🤖 **NeoBank AI Assistant**\n\nI can help you with:\n\n` +
      `- 💰 "What's my balance?"\n` +
      `- 📊 "Where do I spend the most?"\n` +
      `- 💡 "How can I save money?"\n` +
      `- 🏦 "What's my loan status?"\n` +
      `- 📋 "Show my budget status"\n` +
      `- 🎯 "Tell me about my goals"\n` +
      `- ⭐ "How many reward points do I have?"\n` +
      `- 📈 "Summarize my finances"\n\n` +
      `Just ask me anything about your finances!`
  }

  return NextResponse.json({ reply, timestamp: new Date().toISOString() })
}

function getCategoryAdvice(category: string): string {
  const advice: Record<string, string> = {
    FOOD: '💡 Consider meal prepping, using grocery apps, or cooking at home more. This can save 30-40% on food costs.',
    SHOPPING: '💡 Try the 30-day rule: wait 30 days before any non-essential purchase. Unsubscribe from promotional emails.',
    BILLS: '💡 Review subscriptions you don\'t use. Bundle services and negotiate with providers for better rates.',
    TRAVEL: '💡 Book flights 6-8 weeks in advance, use incognito mode for searches, and consider travel credit cards.',
    ENTERTAINMENT: '💡 Share streaming subscriptions with family, look for free events in your city, set a monthly fun budget.',
    HEALTHCARE: '💡 Preventive care is cheaper than treatment. Use generic medications and in-network providers.',
    OTHER: '💡 Categorize these expenses to better understand and control your spending.',
  }
  return advice[category] || '💡 Track and categorize this spending to find savings opportunities.'
}

function getOverallAssessment(savingsRate: number, balance: number, overBudgetCount: number): string {
  if (savingsRate >= 20 && balance > 5000 && overBudgetCount === 0) {
    return '🌟 **Excellent!** Your finances are in great shape. Keep it up!'
  } else if (savingsRate >= 10 && balance > 1000) {
    return '👍 **Good.** You\'re on the right track. Small improvements in budgeting will make a big difference.'
  } else if (overBudgetCount > 2 || savingsRate < 5) {
    return '⚠️ **Needs Attention.** Focus on reducing overspending and building savings. Start with the biggest expense category.'
  }
  return '📊 **Fair.** There\'s room to improve. Set a budget for your top 3 spending categories and stick to it.'
}
