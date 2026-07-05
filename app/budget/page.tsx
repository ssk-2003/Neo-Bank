'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Target, Plus, RefreshCw, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { apiRequest } from '@/lib/store'
import { toast } from 'sonner'

interface Budget {
  id: string
  category: string
  limit: number
  spent: number
}

const CATEGORIES = ['FOOD', 'SHOPPING', 'BILLS', 'TRAVEL', 'EDUCATION', 'ENTERTAINMENT', 'HEALTHCARE', 'OTHER']

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('FOOD')
  const [limit, setLimit] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiRequest('/api/budgets')
      if (res?.ok) {
        const json = await res.json()
        setBudgets(json.budgets)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const limitNum = parseFloat(limit)
    if (!limitNum || limitNum <= 0) {
      toast.error('Please enter a valid budget limit')
      return
    }

    setSubmitting(true)
    try {
      const res = await apiRequest('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({ category, limit: limitNum }),
      })
      if (res?.ok) {
        toast.success(`Budget for ${category} updated!`)
        setLimit('')
        load()
      }
    } catch {
      toast.error('Failed to set budget')
    } finally {
      setSubmitting(false)
    }
  }

  const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#f0f4f0' }}>Budget Planner</h1>
          <p className="text-sm" style={{ color: '#5a6e5a' }}>Plan, manage, and monitor your monthly spending limits</p>
        </div>
        <button onClick={load} className="neo-btn neo-btn-ghost p-2.5" style={{ borderRadius: '10px' }}>
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Set Budget Form */}
        <div className="neo-card p-6">
          <h2 className="font-semibold mb-6 flex items-center gap-2" style={{ color: '#f0f4f0' }}>
            <Target size={16} className="text-[var(--neo-green)]" /> Configure Budget
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>CATEGORY</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="neo-input"
                style={{ background: '#0a0d0a' }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>MONTHLY LIMIT (USD)</label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="e.g. 500"
                required
                className="neo-input"
              />
            </div>

            <button
              id="set-budget-btn"
              type="submit"
              disabled={submitting}
              className="neo-btn neo-btn-primary w-full"
              style={{ borderRadius: '12px', padding: '14px' }}
            >
              {submitting ? 'Setting...' : 'Set Budget Limit'}
            </button>
          </form>

          {/* Overall summary inside left card */}
          {budgets.length > 0 && (
            <div className="mt-8 pt-6 space-y-4" style={{ borderTop: '1px solid #1f271f' }}>
              <h3 className="font-semibold text-xs" style={{ color: '#8fa08f' }}>OVERALL BUDGET SUMMARY</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: '#5a6e5a' }}>Total Limit:</span>
                  <span className="font-bold" style={{ color: '#f0f4f0' }}>{formatCurrency(totalLimit)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#5a6e5a' }}>Total Spent:</span>
                  <span className="font-bold" style={{ color: '#f0f4f0' }}>{formatCurrency(totalSpent)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#5a6e5a' }}>Remaining:</span>
                  <span className="font-bold text-emerald-400">
                    {formatCurrency(Math.max(totalLimit - totalSpent, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Budgets List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="neo-card p-6">
            <h2 className="font-semibold mb-6" style={{ color: '#f0f4f0' }}>Spending Categories</h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : budgets.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: '#3a4e3a' }}>No budgets configured. Use the form to plan limits.</p>
            ) : (
              <div className="space-y-6">
                {budgets.map((b) => {
                  const pct = Math.min((b.spent / b.limit) * 100, 100)
                  const over = b.spent > b.limit
                  return (
                    <motion.div key={b.id} layout className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <div>
                          <span className="font-semibold" style={{ color: '#d4e8d4' }}>{b.category}</span>
                          <span className="text-xs ml-2" style={{ color: '#5a6e5a' }}>
                            {pct.toFixed(0)}% used
                          </span>
                        </div>
                        <span className="font-mono text-xs" style={{ color: over ? '#f87171' : '#f0f4f0' }}>
                          {formatCurrency(b.spent)} of {formatCurrency(b.limit)}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className={`progress-fill ${over ? 'progress-fill-danger' : ''}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {over && (
                        <p className="text-[10px] flex items-center gap-1 mt-1" style={{ color: '#f87171' }}>
                          <AlertTriangle size={11} /> Over budget limit!
                        </p>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
