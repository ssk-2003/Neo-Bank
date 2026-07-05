'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Trash2, RefreshCw, TrendingDown,
  ShoppingBag, Utensils, Zap, Plane, GraduationCap,
  Gamepad2, Heart, Circle, X, ChevronDown, Check,
  Calendar, StickyNote, DollarSign, PieChart,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { apiRequest } from '@/lib/store'
import { toast } from 'sonner'

interface Expense {
  id: string
  description: string
  category: string
  amount: number
  createdAt: string
  reference: string
}

const CATEGORIES = [
  { value: 'FOOD', label: 'Food & Dining', icon: Utensils, color: '#F59E0B' },
  { value: 'SHOPPING', label: 'Shopping', icon: ShoppingBag, color: '#8B5CF6' },
  { value: 'BILLS', label: 'Bills & Utilities', icon: Zap, color: '#EF4444' },
  { value: 'TRAVEL', label: 'Travel', icon: Plane, color: '#3B82F6' },
  { value: 'EDUCATION', label: 'Education', icon: GraduationCap, color: '#10B981' },
  { value: 'ENTERTAINMENT', label: 'Entertainment', icon: Gamepad2, color: '#EC4899' },
  { value: 'HEALTHCARE', label: 'Healthcare', icon: Heart, color: '#14B8A6' },
  { value: 'OTHER', label: 'Other', icon: Circle, color: '#6B7280' },
]

const catMap = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]))

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function ExpensesPage() {
  const now = new Date()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  // Add expense form state
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('FOOD')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        month: String(selectedMonth),
        year: String(selectedYear),
        ...(filterCat ? { category: filterCat } : {}),
      })
      const res = await apiRequest(`/api/expenses?${params}`)
      if (res?.ok) {
        const json = await res.json()
        setExpenses(json.expenses)
        setCategoryTotals(json.categoryTotals)
        setTotal(json.total)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [selectedMonth, selectedYear, filterCat])

  useEffect(() => {
    if (showForm) setTimeout(() => titleRef.current?.focus(), 100)
  }, [showForm])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(amount)
    if (!title.trim()) { toast.error('Enter expense title'); return }
    if (!amountNum || amountNum <= 0) { toast.error('Enter a valid amount'); return }

    setSaving(true)
    try {
      const res = await apiRequest('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), amount: amountNum, category, date, notes }),
      })
      if (res?.ok) {
        toast.success('Expense logged! 📝')
        setTitle('')
        setAmount('')
        setNotes('')
        setDate(new Date().toISOString().split('T')[0])
        setCategory('FOOD')
        setShowForm(false)
        load()
      } else {
        const json = await res?.json()
        toast.error(json?.error || 'Failed to log expense')
      }
    } catch {
      toast.error('Failed to log expense')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await apiRequest(`/api/expenses?id=${id}`, { method: 'DELETE' })
      if (res?.ok) {
        toast.success('Expense removed')
        load()
      }
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filtered = expenses.filter((e) =>
    e.description?.toLowerCase().includes(search.toLowerCase()) ||
    e.category?.toLowerCase().includes(search.toLowerCase())
  )

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#f0f4f0' }}>
            <TrendingDown size={22} className="text-[var(--neo-green)]" />
            Expense Tracker
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#5a6e5a' }}>
            Log and track every spending item easily
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="neo-btn neo-btn-ghost p-2.5" style={{ borderRadius: '10px' }}>
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="neo-btn neo-btn-primary text-sm"
          >
            <Plus size={15} /> Add Expense
          </button>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="neo-input w-auto pr-8 text-sm"
          style={{ background: '#111411', width: '140px' }}
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="neo-input w-auto text-sm"
          style={{ background: '#111411', width: '90px' }}
        >
          {[2023, 2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span className="text-sm font-semibold" style={{ color: '#8fa08f' }}>
          {filtered.length} entries · {formatCurrency(total)} total
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Summary cards */}
        <div className="space-y-4">
          {/* Total spend card */}
          <div
            className="neo-card p-5"
            style={{ background: 'linear-gradient(135deg, #0d1f0d, #111411)' }}
          >
            <p className="text-xs font-bold mb-1" style={{ color: '#5a6e5a' }}>TOTAL THIS PERIOD</p>
            <p className="text-3xl font-bold mb-2" style={{ color: '#f0f4f0' }}>
              {formatCurrency(total)}
            </p>
            {topCategory && (
              <p className="text-xs" style={{ color: '#5a6e5a' }}>
                Top: <span style={{ color: catMap[topCategory[0]]?.color }}>{catMap[topCategory[0]]?.label}</span> — {formatCurrency(topCategory[1])}
              </p>
            )}
          </div>

          {/* Category breakdown */}
          <div className="neo-card p-4">
            <p className="text-xs font-bold mb-3" style={{ color: '#5a6e5a' }}>BY CATEGORY</p>
            <div className="space-y-2.5">
              {CATEGORIES.map((cat) => {
                const amt = categoryTotals[cat.value] || 0
                const pct = total > 0 ? (amt / total) * 100 : 0
                if (amt === 0 && !filterCat) return null
                return (
                  <button
                    key={cat.value}
                    onClick={() => setFilterCat(filterCat === cat.value ? '' : cat.value)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <cat.icon size={13} style={{ color: cat.color }} />
                        <span className="text-xs" style={{ color: filterCat === cat.value ? cat.color : '#8fa08f' }}>
                          {cat.label}
                        </span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: '#f0f4f0' }}>
                        {formatCurrency(amt)}
                      </span>
                    </div>
                    <div className="progress-bar h-1.5">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: cat.color,
                          transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
                        }}
                      />
                    </div>
                  </button>
                )
              })}
              {Object.values(categoryTotals).every((v) => v === 0) && (
                <p className="text-xs text-center py-4" style={{ color: '#3a4e3a' }}>
                  No expenses logged this period
                </p>
              )}
            </div>
          </div>

          {/* Quick add shortcuts */}
          <div className="neo-card p-4">
            <p className="text-xs font-bold mb-3" style={{ color: '#5a6e5a' }}>QUICK ADD</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    setCategory(cat.value)
                    setShowForm(true)
                  }}
                  className="p-2.5 rounded-xl text-left transition-all"
                  style={{
                    background: `${cat.color}12`,
                    border: `1px solid ${cat.color}25`,
                  }}
                >
                  <cat.icon size={14} style={{ color: cat.color }} className="mb-1" />
                  <p className="text-[11px] font-medium" style={{ color: '#8fa08f' }}>{cat.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Expense list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="neo-card p-3 flex items-center gap-3">
            <Search size={15} style={{ color: '#3a4e3a' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses by name or category..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: '#f0f4f0' }}
            />
            {filterCat && (
              <button
                onClick={() => setFilterCat('')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: `${catMap[filterCat]?.color}20`, color: catMap[filterCat]?.color }}
              >
                {catMap[filterCat]?.label} <X size={10} />
              </button>
            )}
          </div>

          {/* Expense items */}
          <div className="neo-card overflow-hidden">
            {loading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <TrendingDown size={40} className="mx-auto mb-3 opacity-20" style={{ color: '#5a6e5a' }} />
                <p className="font-semibold" style={{ color: '#f0f4f0' }}>No expenses yet</p>
                <p className="text-sm mt-1 mb-5" style={{ color: '#3a4e3a' }}>
                  Start logging expenses to track your spending
                </p>
                <button onClick={() => setShowForm(true)} className="neo-btn neo-btn-primary text-sm">
                  <Plus size={14} /> Log First Expense
                </button>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#1f271f' }}>
                <AnimatePresence initial={false}>
                  {filtered.map((exp, i) => {
                    const cat = catMap[exp.category] || catMap['OTHER']
                    const Icon = cat.icon
                    // Extract title from description (before " — ")
                    const titlePart = exp.description?.split(' — ')[0] || exp.description || exp.category
                    const notesPart = exp.description?.includes(' — ')
                      ? exp.description.split(' — ').slice(1).join(' — ')
                      : null

                    return (
                      <motion.div
                        key={exp.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-[rgba(0,230,118,0.02)] transition-colors group"
                      >
                        {/* Category icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${cat.color}15`, color: cat.color }}
                        >
                          <Icon size={17} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: '#f0f4f0' }}>
                            {titlePart}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                              style={{ background: `${cat.color}18`, color: cat.color }}
                            >
                              {cat.label}
                            </span>
                            <span className="text-[11px]" style={{ color: '#3a4e3a' }}>
                              {formatDate(exp.createdAt, 'short')}
                            </span>
                            {notesPart && (
                              <span className="text-[11px] truncate" style={{ color: '#5a6e5a' }}>
                                · {notesPart}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold" style={{ color: '#f87171' }}>
                            -{formatCurrency(exp.amount)}
                          </p>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
                          style={{ color: '#f87171' }}
                          title="Delete expense"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Expense Modal ── */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="neo-card w-full max-w-lg p-6 relative z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#f0f4f0' }}>Log Expense</h2>
                  <p className="text-xs mt-0.5" style={{ color: '#5a6e5a' }}>Track a new spending item</p>
                </div>
                <button onClick={() => setShowForm(false)} style={{ color: '#3a4e3a' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>
                    EXPENSE TITLE *
                  </label>
                  <input
                    ref={titleRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Lunch at cafe, Electricity bill..."
                    className="neo-input"
                    required
                  />
                </div>

                {/* Amount + Date row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>
                      AMOUNT (USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#3a4e3a' }}>$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="neo-input pl-7 font-semibold"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>
                      DATE
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="neo-input"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                {/* Category chips */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>
                    CATEGORY
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className="p-2 rounded-xl flex flex-col items-center gap-1 transition-all text-center"
                        style={{
                          background: category === cat.value ? `${cat.color}20` : '#0d110d',
                          border: `1px solid ${category === cat.value ? cat.color : '#1f271f'}`,
                        }}
                      >
                        <cat.icon size={15} style={{ color: category === cat.value ? cat.color : '#3a4e3a' }} />
                        <span
                          className="text-[9px] font-semibold leading-tight"
                          style={{ color: category === cat.value ? cat.color : '#5a6e5a' }}
                        >
                          {cat.label.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>
                    NOTES (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any extra details..."
                    className="neo-input"
                  />
                </div>

                {/* Summary preview */}
                {title && parseFloat(amount) > 0 && (
                  <div
                    className="rounded-xl p-3 flex items-center gap-3"
                    style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)' }}
                  >
                    <Check size={16} className="text-[var(--neo-green)]" />
                    <p className="text-sm" style={{ color: '#8fa08f' }}>
                      Logging <span style={{ color: '#f0f4f0', fontWeight: 600 }}>{title}</span> as{' '}
                      <span style={{ color: catMap[category]?.color }}>{catMap[category]?.label}</span> —{' '}
                      <span style={{ color: '#f87171', fontWeight: 600 }}>{formatCurrency(parseFloat(amount) || 0)}</span>
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="neo-btn neo-btn-primary w-full"
                  style={{ borderRadius: '12px', padding: '14px' }}
                >
                  {saving ? 'Logging...' : <><Plus size={15} /> Log Expense</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
