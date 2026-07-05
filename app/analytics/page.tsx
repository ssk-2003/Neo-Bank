'use client'

import { useEffect, useState } from 'react'
import { BarChart3, RefreshCw, Star } from 'lucide-react'
import { formatCurrency, getCategoryColor } from '@/lib/utils'
import { apiRequest } from '@/lib/store'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

interface AnalyticsData {
  summary: { totalBalance: number; monthlyIncome: number; monthlyExpenses: number; savings: number }
  charts: {
    categoryBreakdown: Array<{ category: string; total: number }>
    spendingTrend: Array<{ month: string; spending: number; income: number }>
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
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

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#f0f4f0' }}>Expense Analytics</h1>
          <p className="text-sm" style={{ color: '#5a6e5a' }}>Explore cashflow statistics, saving rates, and category proportions</p>
        </div>
        <button onClick={load} className="neo-btn neo-btn-ghost p-2.5" style={{ borderRadius: '10px' }}>
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Spending Trend */}
        <div className="lg:col-span-2 neo-card p-6">
          <h2 className="font-semibold mb-6" style={{ color: '#f0f4f0' }}>Income vs Expenses Trend</h2>
          {loading ? (
            <div className="skeleton h-64 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data?.charts.spendingTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f271f" />
                <XAxis dataKey="month" tick={{ fill: '#5a6e5a', fontSize: 11 }} />
                <YAxis tick={{ fill: '#5a6e5a', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: '#111411', border: '1px solid #1f271f', color: '#f0f4f0' }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="income" fill="var(--neo-green)" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="spending" fill="#f87171" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category breakdown (donut) */}
        <div className="neo-card p-6">
          <h2 className="font-semibold mb-6" style={{ color: '#f0f4f0' }}>Expense Proportions</h2>
          {loading ? (
            <div className="skeleton h-64 rounded-xl" />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data?.charts.categoryBreakdown || []}
                    dataKey="total"
                    nameKey="category"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {(data?.charts.categoryBreakdown || []).map((entry, i) => (
                      <Cell key={i} fill={getCategoryColor(entry.category)} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111411', border: '1px solid #1f271f', color: '#f0f4f0' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-2 mt-4">
                {(data?.charts.categoryBreakdown || []).slice(0, 5).map((entry) => (
                  <div key={entry.category} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: getCategoryColor(entry.category) }} />
                      <span style={{ color: '#8fa08f' }}>{entry.category}</span>
                    </div>
                    <span className="font-semibold" style={{ color: '#f0f4f0' }}>{formatCurrency(entry.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
