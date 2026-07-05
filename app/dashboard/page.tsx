'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight,
  Bell, Target, Star, RefreshCw, Send, CreditCard, PiggyBank, Receipt
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate, getCategoryColor, getStatusColor, maskCardNumber } from '@/lib/utils'
import { apiRequest, getStoredUser } from '@/lib/store'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

interface DashboardData {
  summary: { totalBalance: number; monthlyIncome: number; monthlyExpenses: number; savings: number }
  accounts: Array<{ id: string; type: string; balance: number; currency: string; accountNumber: string; status: string }>
  recentTransactions: Array<{
    id: string; amount: number; type: string; category: string; description: string
    status: string; createdAt: string
    sender?: { firstName: string; lastName: string }
    receiver?: { firstName: string; lastName: string }
  }>
  budgets: Array<{ category: string; limit: number; spent: number }>
  goals: Array<{ name: string; targetAmount: number; savedAmount: number }>
  rewardPoints: { points: number; tier: string } | null
  charts: {
    categoryBreakdown: Array<{ category: string; total: number }>
    spendingTrend: Array<{ month: string; spending: number; income: number }>
  }
  notifications: Array<{ id: string; title: string; message: string; type: string; createdAt: string }>
}

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: '#00e676', SHOPPING: '#69ff9e', BILLS: '#00c853', TRAVEL: '#a3ffb0',
  ENTERTAINMENT: '#26ff85', HEALTHCARE: '#00e676', OTHER: '#1f271f',
}

function StatCard({ title, value, sub, icon: Icon, trend, color }: {
  title: string; value: string; sub?: string; icon: React.ElementType
  trend?: 'up' | 'down'; color?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(0,230,118,0.1)', color: color || 'var(--neo-green)' }}
        >
          <Icon size={18} />
        </div>
        {trend && (
          <span
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: trend === 'up' ? 'var(--neo-green)' : '#f87171' }}
          >
            {trend === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {trend === 'up' ? '+12%' : '-3%'}
          </span>
        )}
      </div>
      <p className="text-sm mb-1" style={{ color: '#5a6e5a' }}>{title}</p>
      <p className="text-2xl font-bold" style={{ color: '#f0f4f0' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#3a4e3a' }}>{sub}</p>}
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="skeleton h-10 w-10 rounded-xl mb-4" />
      <div className="skeleton h-3 w-24 rounded mb-2" />
      <div className="skeleton h-7 w-32 rounded" />
    </div>
  )
}

export default function DashboardPage() {
  const user = getStoredUser()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiRequest('/api/dashboard')
      if (res?.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm mb-1" style={{ color: '#5a6e5a' }}>{greeting},</p>
          <h1 className="text-2xl font-bold" style={{ color: '#f0f4f0' }}>
            {user?.firstName} {user?.lastName} 👋
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="neo-btn neo-btn-ghost text-sm p-2.5" style={{ borderRadius: '10px' }}>
            <RefreshCw size={15} />
          </button>
          <Link href="/transfer" className="neo-btn neo-btn-primary text-sm">
            <Send size={14} /> Send Money
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard title="Total Balance" value={formatCurrency(data?.summary.totalBalance || 0)} icon={Wallet} trend="up" />
            <StatCard title="Monthly Income" value={formatCurrency(data?.summary.monthlyIncome || 0)} icon={TrendingUp} trend="up" color="#69ff9e" />
            <StatCard title="Monthly Expenses" value={formatCurrency(data?.summary.monthlyExpenses || 0)} icon={TrendingDown} trend="down" color="#f87171" />
            <StatCard
              title="Reward Points"
              value={(data?.rewardPoints?.points || 0).toLocaleString()}
              sub={`${data?.rewardPoints?.tier || 'BRONZE'} tier`}
              icon={Star}
              color="#fbbf24"
            />
          </>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending trend chart */}
        <div className="lg:col-span-2 neo-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold" style={{ color: '#f0f4f0' }}>Spending Overview</h2>
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,230,118,0.1)', color: 'var(--neo-green)' }}>
              Last 6 months
            </span>
          </div>
          {loading ? (
            <div className="skeleton h-52 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={data?.charts.spendingTrend || []}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e676" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f271f" />
                <XAxis dataKey="month" tick={{ fill: '#3a4e3a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#3a4e3a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#111411', border: '1px solid #1f271f', borderRadius: 10, color: '#f0f4f0' }}
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                />
                <Area type="monotone" dataKey="income" stroke="#00e676" strokeWidth={2} fill="url(#incomeGrad)" name="Income" />
                <Area type="monotone" dataKey="spending" stroke="#f87171" strokeWidth={2} fill="url(#spendGrad)" name="Spending" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category breakdown */}
        <div className="neo-card p-6">
          <h2 className="font-semibold mb-5" style={{ color: '#f0f4f0' }}>Spending by Category</h2>
          {loading ? (
            <div className="skeleton h-52 rounded-xl" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={data?.charts.categoryBreakdown || []}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {(data?.charts.categoryBreakdown || []).map((entry, i) => (
                      <Cell key={i} fill={getCategoryColor(entry.category)} opacity={0.9} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#111411', border: '1px solid #1f271f', borderRadius: 10, color: '#f0f4f0' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {(data?.charts.categoryBreakdown || []).slice(0, 4).map((item) => (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: getCategoryColor(item.category) }} />
                      <span style={{ color: '#8fa08f' }}>{item.category}</span>
                    </div>
                    <span style={{ color: '#f0f4f0' }}>{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent transactions */}
        <div className="lg:col-span-2 neo-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold" style={{ color: '#f0f4f0' }}>Recent Transactions</h2>
            <Link href="/transactions" className="text-xs" style={{ color: 'var(--neo-green)' }}>
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton w-9 h-9 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-32 rounded" />
                    <div className="skeleton h-2.5 w-24 rounded" />
                  </div>
                  <div className="skeleton h-4 w-16 rounded" />
                </div>
              ))}
            </div>
          ) : data?.recentTransactions.length === 0 ? (
            <div className="text-center py-10" style={{ color: '#3a4e3a' }}>
              <Receipt size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {(data?.recentTransactions || []).map((tx) => {
                const isIncoming = tx.type === 'DEPOSIT' || (tx.type === 'TRANSFER' && tx.receiver)
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                    style={{ cursor: 'default' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,230,118,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: getCategoryColor(tx.category) + '18', color: getCategoryColor(tx.category) }}
                    >
                      {tx.category.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#d4e8d4' }}>
                        {tx.description || tx.category}
                      </p>
                      <p className="text-xs" style={{ color: '#3a4e3a' }}>
                        {formatDate(tx.createdAt, 'relative')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: isIncoming ? 'var(--neo-green)' : '#f0f4f0' }}
                      >
                        {isIncoming ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <span className={`badge text-xs ${getStatusColor(tx.status)}`}>{tx.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column: budgets + goals */}
        <div className="space-y-5">
          {/* Budget progress */}
          <div className="neo-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm" style={{ color: '#f0f4f0' }}>Budget This Month</h2>
              <Link href="/budget" className="text-xs" style={{ color: 'var(--neo-green)' }}>Manage →</Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-8 rounded" />)}
              </div>
            ) : (data?.budgets || []).length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: '#3a4e3a' }}>No budgets set</p>
            ) : (
              <div className="space-y-4">
                {(data?.budgets || []).slice(0, 4).map((b) => {
                  const pct = Math.min((b.spent / b.limit) * 100, 100)
                  const over = b.spent > b.limit
                  return (
                    <div key={b.category}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{ color: '#8fa08f' }}>{b.category}</span>
                        <span style={{ color: over ? '#f87171' : '#f0f4f0' }}>
                          {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className={`progress-fill ${over ? 'progress-fill-danger' : ''}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Goals */}
          <div className="neo-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm" style={{ color: '#f0f4f0' }}>Savings Goals</h2>
              <Link href="/profile" className="text-xs" style={{ color: 'var(--neo-green)' }}>View →</Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="skeleton h-10 rounded" />)}
              </div>
            ) : (data?.goals || []).length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: '#3a4e3a' }}>No goals yet</p>
            ) : (
              <div className="space-y-4">
                {(data?.goals || []).slice(0, 3).map((g) => {
                  const pct = Math.min((g.savedAmount / g.targetAmount) * 100, 100)
                  return (
                    <div key={g.name}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{ color: '#8fa08f' }}>{g.name}</span>
                        <span style={{ color: 'var(--neo-green)' }}>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#3a4e3a' }}>
                        {formatCurrency(g.savedAmount)} of {formatCurrency(g.targetAmount)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="neo-card p-5">
            <h2 className="font-semibold text-sm mb-4" style={{ color: '#f0f4f0' }}>Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/transfer', icon: Send, label: 'Transfer' },
                { href: '/cards', icon: CreditCard, label: 'Cards' },
                { href: '/loans', icon: PiggyBank, label: 'Loans' },
                { href: '/ai-assistant', icon: Target, label: 'AI Chat' },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl text-xs font-medium transition-all"
                  style={{ background: '#111411', color: '#8fa08f', border: '1px solid #1f271f' }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'rgba(0,230,118,0.08)'
                    el.style.color = 'var(--neo-green)'
                    el.style.borderColor = 'rgba(0,230,118,0.2)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = '#111411'
                    el.style.color = '#8fa08f'
                    el.style.borderColor = '#1f271f'
                  }}
                >
                  <a.icon size={18} />
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
