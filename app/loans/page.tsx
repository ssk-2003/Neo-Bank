'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Landmark, ArrowRight, Calculator, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatCurrency, calculateEMI } from '@/lib/utils'
import { apiRequest } from '@/lib/store'
import { toast } from 'sonner'

interface Loan {
  id: string
  amount: number
  interestRate: number
  duration: number
  purpose: string
  employment: string
  income: number
  status: string
  notes?: string
  createdAt: string
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('10000')
  const [duration, setDuration] = useState('24')
  const [purpose, setPurpose] = useState('')
  const [employment, setEmployment] = useState('Full-time')
  const [income, setIncome] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiRequest('/api/loans')
      if (res?.ok) {
        const json = await res.json()
        setLoans(json.loans)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const calcEMIVal = calculateEMI(parseFloat(amount) || 0, 8.5, parseInt(duration) || 24)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!purpose) {
      toast.error('Please specify loan purpose')
      return
    }
    const incomeNum = parseFloat(income)
    if (!incomeNum || incomeNum <= 0) {
      toast.error('Please enter your monthly income')
      return
    }

    setSubmitting(true)
    try {
      const res = await apiRequest('/api/loans', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(amount),
          duration: parseInt(duration),
          purpose,
          employment,
          income: incomeNum,
        }),
      })

      const data = await res?.json()
      if (res?.ok) {
        toast.success('Loan application submitted successfully!')
        setPurpose('')
        setIncome('')
        load()
      } else {
        toast.error(data?.error || 'Application failed')
      }
    } catch {
      toast.error('Application failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#f0f4f0' }}>Loans & Financing</h1>
        <p className="text-sm" style={{ color: '#5a6e5a' }}>Apply for financing and calculate monthly installments instantly</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="neo-card p-6">
            <h2 className="font-semibold mb-6 flex items-center gap-2" style={{ color: '#f0f4f0' }}>
              <Calculator size={16} className="text-[var(--neo-green)]" /> EMI Calculator & Application
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>LOAN AMOUNT (USD)</label>
                  <input
                    type="number"
                    min="1000"
                    max="100000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="neo-input"
                  />
                  <p className="text-[10px] mt-1" style={{ color: '#5a6e5a' }}>Min: $1,000 / Max: $100,000</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>DURATION (MONTHS)</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="neo-input"
                    style={{ background: '#0a0d0a' }}
                  >
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                    <option value="24">24 Months</option>
                    <option value="36">36 Months</option>
                    <option value="48">48 Months</option>
                    <option value="60">60 Months</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>EMPLOYMENT TYPE</label>
                  <select
                    value={employment}
                    onChange={(e) => setEmployment(e.target.value)}
                    className="neo-input"
                    style={{ background: '#0a0d0a' }}
                  >
                    <option value="Full-time">Full-time Employee</option>
                    <option value="Part-time">Part-time Employee</option>
                    <option value="Self-employed">Self-employed / Business Owner</option>
                    <option value="Unemployed">Unemployed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>MONTHLY INCOME (USD)</label>
                  <input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="e.g. 5000"
                    required
                    className="neo-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>LOAN PURPOSE</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Home Renovation, Student Loans"
                  required
                  className="neo-input"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="neo-btn neo-btn-primary w-full"
                style={{ borderRadius: '12px', padding: '14px' }}
              >
                {submitting ? 'Submitting...' : 'Apply for Loan'}
              </button>
            </form>
          </div>

          {/* Active Loans list */}
          <div className="neo-card p-6">
            <h2 className="font-semibold mb-5" style={{ color: '#f0f4f0' }}>Your Applications</h2>
            {loading ? (
              <div className="skeleton h-20 rounded-xl" />
            ) : loans.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: '#3a4e3a' }}>No loan applications submitted</p>
            ) : (
              <div className="space-y-4">
                {loans.map((l) => (
                  <div
                    key={l.id}
                    className="p-4 rounded-xl flex items-center justify-between border"
                    style={{ background: '#111411', borderColor: '#1f271f' }}
                  >
                    <div>
                      <h4 className="font-semibold text-sm" style={{ color: '#d4e8d4' }}>{l.purpose}</h4>
                      <p className="text-xs" style={{ color: '#5a6e5a' }}>
                        {formatCurrency(l.amount)} @ {l.interestRate}% over {l.duration} months
                      </p>
                      {l.notes && <p className="text-[10px] mt-1" style={{ color: '#f87171' }}>Admin note: {l.notes}</p>}
                    </div>
                    <div className="text-right">
                      <span
                        className={`badge text-[10px] ${
                          l.status === 'APPROVED' ? 'badge-green' :
                          l.status === 'PENDING' ? 'badge-yellow' : 'badge-red'
                        }`}
                      >
                        {l.status}
                      </span>
                      <p className="text-[10px] mt-1" style={{ color: '#3a4e3a' }}>
                        Applied {new Date(l.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick calc side panel */}
        <div className="neo-card p-5 space-y-4">
          <h3 className="font-semibold text-sm" style={{ color: '#f0f4f0' }}>Installment Estimate</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span style={{ color: '#5a6e5a' }}>Estimated Interest APY:</span>
              <span className="font-semibold text-emerald-400">8.5% Fixed</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#5a6e5a' }}>Period:</span>
              <span className="font-semibold" style={{ color: '#f0f4f0' }}>{duration} months</span>
            </div>
            <div className="flex justify-between" style={{ borderTop: '1px solid #1f271f', paddingTop: '10px' }}>
              <span style={{ color: '#8fa08f' }}>Estimated Monthly EMI:</span>
              <span className="font-bold text-base text-emerald-400">{formatCurrency(calcEMIVal)}</span>
            </div>
          </div>
          <div className="rounded-xl p-3.5 flex items-start gap-2.5 bg-[#0d110d] border border-[#1f271f]">
            <AlertCircle size={15} className="mt-0.5" style={{ color: 'var(--neo-green)' }} />
            <p className="text-[10px] leading-relaxed" style={{ color: '#5a6e5a' }}>
              EMI amount is calculated on an amortized basis and includes compounding interest. Approval is subject to review by administrators.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
