'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, ArrowUpRight, ArrowDownRight, RefreshCw, FileDown } from 'lucide-react'
import { formatCurrency, formatDate, getCategoryColor, getStatusColor } from '@/lib/utils'
import { apiRequest } from '@/lib/store'
import { toast } from 'sonner'

interface Transaction {
  id: string
  amount: number
  type: string
  category: string
  description: string
  status: string
  createdAt: string
  reference?: string
  sender?: { firstName: string; lastName: string }
  receiver?: { firstName: string; lastName: string }
}

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({
        page: String(page),
        limit: '15',
        ...(search && { search }),
        ...(category && { category }),
        ...(type && { type }),
      })
      const res = await apiRequest(`/api/transactions?${q.toString()}`)
      if (res?.ok) {
        const json = await res.json()
        setTxs(json.transactions)
        setTotalPages(json.pagination.pages)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [page, category, type])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    load()
  }

  const exportCSV = () => {
    if (txs.length === 0) return
    const headers = ['ID', 'Date', 'Description', 'Category', 'Type', 'Amount', 'Status']
    const rows = txs.map((t) => [
      t.id,
      new Date(t.createdAt).toLocaleDateString(),
      t.description || t.category,
      t.category,
      t.type,
      t.amount,
      t.status,
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `neobank_transactions_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('CSV report generated!')
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#f0f4f0' }}>Transactions</h1>
          <p className="text-sm" style={{ color: '#5a6e5a' }}>View, track, and filter all accounts cashflows</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="neo-btn neo-btn-ghost text-sm flex items-center gap-2">
            <FileDown size={15} /> Export CSV
          </button>
          <button onClick={load} className="neo-btn neo-btn-ghost p-2.5" style={{ borderRadius: '10px' }}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="neo-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#3a4e3a' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="neo-input pl-9"
          />
        </form>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1) }}
            className="neo-input w-full md:w-40"
            style={{ background: '#0a0d0a' }}
          >
            <option value="">All Categories</option>
            <option value="FOOD">Food & Dining</option>
            <option value="SHOPPING">Shopping</option>
            <option value="BILLS">Bills & Utilities</option>
            <option value="TRAVEL">Travel</option>
            <option value="ENTERTAINMENT">Entertainment</option>
            <option value="HEALTHCARE">Healthcare</option>
            <option value="SALARY">Salary / Income</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1) }}
            className="neo-input w-full md:w-40"
            style={{ background: '#0a0d0a' }}
          >
            <option value="">All Types</option>
            <option value="TRANSFER">Transfer</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="PAYMENT">Payment</option>
            <option value="WITHDRAWAL">Withdrawal</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="neo-card overflow-hidden">
        {loading ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-12 rounded" />)}
          </div>
        ) : txs.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#3a4e3a' }}>
            <p className="text-lg font-semibold mb-1" style={{ color: '#f0f4f0' }}>No transactions found</p>
            <p className="text-sm">Try clearing filters or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="neo-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Category</th>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((tx) => {
                  const isIncoming = tx.type === 'DEPOSIT' || (tx.type === 'TRANSFER' && tx.receiver)
                  return (
                    <tr key={tx.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{ background: getCategoryColor(tx.category) + '15', color: getCategoryColor(tx.category) }}
                          >
                            {tx.category.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm" style={{ color: '#d4e8d4' }}>
                              {tx.description || tx.category}
                            </p>
                            <p className="text-xs" style={{ color: '#3a4e3a' }}>{tx.type}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs" style={{ color: '#8fa08f' }}>{tx.category}</span>
                      </td>
                      <td>
                        <code className="text-xs font-mono" style={{ color: '#3a4e3a' }}>
                          {tx.reference || tx.id.slice(0, 10).toUpperCase()}
                        </code>
                      </td>
                      <td>
                        <span className="text-sm" style={{ color: '#8fa08f' }}>
                          {formatDate(tx.createdAt, 'short')}
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold text-sm" style={{ color: isIncoming ? 'var(--neo-green)' : '#f0f4f0' }}>
                          {isIncoming ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge text-[10px] ${getStatusColor(tx.status)}`}>{tx.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="neo-btn neo-btn-ghost text-xs py-2"
          >
            Previous
          </button>
          <span className="text-xs" style={{ color: '#3a4e3a' }}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="neo-btn neo-btn-ghost text-xs py-2"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
