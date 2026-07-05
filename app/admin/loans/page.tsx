'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, FileText, Check, X, ArrowLeft, PiggyBank } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { apiRequest } from '@/lib/store'
import { toast } from 'sonner'

interface LoanApplication {
  id: string
  amount: number
  interestRate: number
  duration: number
  purpose: string
  employment: string
  income: number
  status: string
  createdAt: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
}

export default function AdminLoansPage() {
  const [loans, setLoans] = useState<LoanApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({})

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiRequest('/api/admin/loans')
      if (res?.ok) {
        const json = await res.json()
        setLoans(json.loans)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDecision = async (loanId: string, approve: boolean) => {
    const status = approve ? 'APPROVED' : 'REJECTED'
    const notes = decisionNotes[loanId] || ''
    try {
      const res = await apiRequest('/api/admin/loans', {
        method: 'PUT',
        body: JSON.stringify({ loanId, status, notes }),
      })
      if (res?.ok) {
        toast.success(`Application was successfully ${status.toLowerCase()}`)
        load()
      } else {
        const json = await res?.json()
        toast.error(json?.error || 'Failed to process decision')
      }
    } catch {
      toast.error('Failed to process decision')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back link */}
      <Link href="/admin" className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#5a6e5a' }}>
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#f0f4f0' }}>
            <PiggyBank size={24} className="text-emerald-400" /> Loan Underwriting
          </h1>
          <p className="text-sm" style={{ color: '#5a6e5a' }}>Review customer profiles, reported income, and underwriting loans</p>
        </div>
        <button onClick={load} className="neo-btn neo-btn-ghost p-2.5" style={{ borderRadius: '10px' }}>
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
          </div>
        ) : loans.length === 0 ? (
          <div className="neo-card p-12 text-center" style={{ color: '#3a4e3a' }}>
            <FileText size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-lg" style={{ color: '#f0f4f0' }}>All clear!</p>
            <p className="text-sm">There are no pending underwriting applications.</p>
          </div>
        ) : (
          loans.map((l) => (
            <motion.div
              key={l.id}
              layout
              className="neo-card p-6 flex flex-col md:flex-row justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">
                    {l.user.firstName} {l.user.lastName}
                  </h3>
                  <span className="text-xs" style={{ color: '#5a6e5a' }}>({l.user.email})</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-1.5 text-xs">
                  <div>
                    <span style={{ color: '#5a6e5a' }}>Requested:</span>
                    <p className="font-semibold text-white mt-0.5">{formatCurrency(l.amount)}</p>
                  </div>
                  <div>
                    <span style={{ color: '#5a6e5a' }}>Period / Rate:</span>
                    <p className="font-semibold text-white mt-0.5">{l.duration} mos @ {l.interestRate}%</p>
                  </div>
                  <div>
                    <span style={{ color: '#5a6e5a' }}>Reported Income:</span>
                    <p className="font-semibold mt-0.5 text-emerald-400">{formatCurrency(l.income)}/mo</p>
                  </div>
                  <div>
                    <span style={{ color: '#5a6e5a' }}>Purpose:</span>
                    <p className="font-semibold text-white mt-0.5 truncate max-w-[120px]">{l.purpose}</p>
                  </div>
                </div>
              </div>

              {/* Action column */}
              <div className="flex flex-col justify-between items-end gap-3 min-w-[200px]">
                <span
                  className={`badge text-xs ${
                    l.status === 'APPROVED' ? 'badge-green' :
                    l.status === 'PENDING' ? 'badge-yellow' : 'badge-red'
                  }`}
                >
                  {l.status}
                </span>

                {l.status === 'PENDING' && (
                  <div className="w-full space-y-2 text-right">
                    <input
                      type="text"
                      placeholder="Optional decision notes..."
                      value={decisionNotes[l.id] || ''}
                      onChange={(e) =>
                        setDecisionNotes((prev) => ({ ...prev, [l.id]: e.target.value }))
                      }
                      className="neo-input text-xs py-1.5 w-full text-right"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleDecision(l.id, false)}
                        className="neo-btn neo-btn-danger text-xs py-1.5 px-3 flex items-center gap-1"
                        style={{ borderRadius: '8px' }}
                      >
                        <X size={12} /> Reject
                      </button>
                      <button
                        onClick={() => handleDecision(l.id, true)}
                        className="neo-btn neo-btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                        style={{ borderRadius: '8px' }}
                      >
                        <Check size={12} /> Approve
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
