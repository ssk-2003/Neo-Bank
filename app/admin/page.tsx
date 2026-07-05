'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Landmark, Users, ArrowUpRight, TrendingUp, RefreshCw, FileText, Check, X, ShieldAlert } from 'lucide-react'
import { formatCurrency, getStatusColor } from '@/lib/utils'
import { apiRequest } from '@/lib/store'
import { toast } from 'sonner'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface AdminStats {
  overview: {
    totalUsers: number
    totalAccounts: number
    totalTransactions: number
    pendingLoans: number
    activeLoans: number
    newUsersThisMonth: number
    transactionsThisMonth: number
    systemRevenue: number
  }
  charts: {
    usersByMonth: Array<{ month: string; count: number }>
    transactionsByDay: Array<{ day: string; count: number; total: number }>
  }
  recentTransactions: Array<{
    id: string; amount: number; type: string; category: string; description: string
    status: string; createdAt: string
    sender?: { firstName: string; lastName: string; email: string }
    receiver?: { firstName: string; lastName: string; email: string }
  }>
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiRequest('/api/admin/analytics')
      if (res?.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#f0f4f0' }}>
            <ShieldAlert size={24} className="text-emerald-400" /> Admin Console
          </h1>
          <p className="text-sm" style={{ color: '#5a6e5a' }}>System overview, transaction activity, and user metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="neo-btn neo-btn-ghost p-2.5" style={{ borderRadius: '10px' }}>
            <RefreshCw size={15} />
          </button>
          <Link href="/dashboard" className="neo-btn neo-btn-ghost text-xs py-2">
            Exit Admin Panel
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card">
              <div className="skeleton h-8 w-8 rounded-xl mb-4" />
              <div className="skeleton h-3 w-20 rounded mb-1" />
              <div className="skeleton h-6 w-24 rounded" />
            </div>
          ))
        ) : (
          <>
            <div className="stat-card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 mb-4">
                <Users size={16} />
              </div>
              <p className="text-xs" style={{ color: '#5a6e5a' }}>Total Customers</p>
              <p className="text-xl font-bold mt-1" style={{ color: '#f0f4f0' }}>{data?.overview.totalUsers}</p>
            </div>

            <div className="stat-card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 mb-4">
                <Landmark size={16} />
              </div>
              <p className="text-xs" style={{ color: '#5a6e5a' }}>Total Accounts</p>
              <p className="text-xl font-bold mt-1" style={{ color: '#f0f4f0' }}>{data?.overview.totalAccounts}</p>
            </div>

            <div className="stat-card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 mb-4">
                <FileText size={16} />
              </div>
              <p className="text-xs" style={{ color: '#5a6e5a' }}>Pending Loans</p>
              <p className="text-xl font-bold mt-1" style={{ color: '#f0f4f0' }}>{data?.overview.pendingLoans}</p>
            </div>

            <div className="stat-card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 mb-4">
                <TrendingUp size={16} />
              </div>
              <p className="text-xs" style={{ color: '#5a6e5a' }}>Demo System Fee Revenue</p>
              <p className="text-xl font-bold mt-1 text-emerald-400">{formatCurrency(data?.overview.systemRevenue || 0)}</p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation cards for admin features */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/users"
              className="neo-card p-6 flex flex-col justify-between hover:border-emerald-500/30 group"
            >
              <div>
                <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors">
                  Customer Management
                </h3>
                <p className="text-xs mt-1" style={{ color: '#5a6e5a' }}>
                  Search users, reset passwords, freeze or activate accounts.
                </p>
              </div>
              <span className="text-xs mt-6 flex items-center gap-1 text-emerald-400 font-semibold">
                Access List <ArrowUpRight size={13} />
              </span>
            </Link>

            <Link
              href="/admin/loans"
              className="neo-card p-6 flex flex-col justify-between hover:border-emerald-500/30 group"
            >
              <div>
                <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors">
                  Loan Underwriting
                </h3>
                <p className="text-xs mt-1" style={{ color: '#5a6e5a' }}>
                  Review personal details, approve credit lines, or record underwriting denials.
                </p>
              </div>
              <span className="text-xs mt-6 flex items-center gap-1 text-emerald-400 font-semibold">
                Review applications <ArrowUpRight size={13} />
              </span>
            </Link>
          </div>

          {/* Daily transaction activity chart */}
          <div className="neo-card p-6">
            <h3 className="font-semibold mb-6" style={{ color: '#f0f4f0' }}>Daily Ledger Volume</h3>
            {loading ? (
              <div className="skeleton h-52 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data?.charts.transactionsByDay || []}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e676" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f271f" />
                  <XAxis dataKey="day" tick={{ fill: '#5a6e5a', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#5a6e5a', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#111411', border: '1px solid #1f271f', color: '#f0f4f0' }} />
                  <Area type="monotone" dataKey="total" stroke="var(--neo-green)" strokeWidth={2} fill="url(#volGrad)" name="Ledger Volume ($)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Ledger logs */}
        <div className="neo-card p-5 space-y-4">
          <h3 className="font-semibold text-sm" style={{ color: '#f0f4f0' }}>Ledger Activity Stream</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded" />)}
            </div>
          ) : (data?.recentTransactions || []).length === 0 ? (
            <p className="text-xs text-center py-6 text-gray-500">No transactions recorded</p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {(data?.recentTransactions || []).map((t) => (
                <div key={t.id} className="p-2.5 rounded-lg text-xs space-y-1 bg-black/20 border border-[#1f271f]">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-300">{t.description || t.category}</span>
                    <span className="font-bold text-white">{formatCurrency(t.amount)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]" style={{ color: '#5a6e5a' }}>
                    <span>{t.sender ? `${t.sender.firstName} → ${t.receiver ? t.receiver.firstName : 'Cash'}` : 'Deposit'}</span>
                    <span>{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
