'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Wallet, Mail, AlertCircle, Landmark, CheckCircle, Receipt, ArrowRight, ShieldCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { apiRequest } from '@/lib/store'
import { toast } from 'sonner'

interface Account {
  id: string
  accountNumber: string
  type: string
  balance: number
  currency: string
  status: string
}

export default function TransferPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [fromAccountId, setFromAccountId] = useState('')
  const [toEmail, setToEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('OTHER')
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)
  const [receipt, setReceipt] = useState<any | null>(null)

  useEffect(() => {
    const loadAccounts = async () => {
      setLoadingAccounts(true)
      try {
        const res = await apiRequest('/api/accounts')
        if (res?.ok) {
          const json = await res.json()
          setAccounts(json.accounts)
          if (json.accounts.length > 0) {
            setFromAccountId(json.accounts[0].id)
          }
        }
      } catch {}
      setLoadingAccounts(false)
    }
    loadAccounts()
  }, [])

  const selectedAccount = accounts.find((a) => a.id === fromAccountId)
  const amountNum = parseFloat(amount) || 0
  const rewardPointsEarned = Math.floor(amountNum / 10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAccount) {
      toast.error('Select a source account')
      return
    }
    if (amountNum <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    if (selectedAccount.balance < amountNum) {
      toast.error('Insufficient funds')
      return
    }

    setSending(true)
    try {
      const res = await apiRequest('/api/transfer', {
        method: 'POST',
        body: JSON.stringify({
          fromAccountId,
          toEmail,
          amount: amountNum,
          category,
          description,
        }),
      })

      const data = await res?.json()
      if (res?.ok) {
        toast.success('Transfer successful!')
        setReceipt(data)
        // Reset inputs
        setToEmail('')
        setAmount('')
        setDescription('')
        // Refresh balance
        const updatedAccounts = accounts.map((a) =>
          a.id === fromAccountId ? { ...a, balance: a.balance - amountNum } : a
        )
        setAccounts(updatedAccounts)
      } else {
        toast.error(data?.error || 'Transfer failed')
      }
    } catch {
      toast.error('Transfer failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#f0f4f0' }}>Transfer Money</h1>
        <p className="text-sm" style={{ color: '#5a6e5a' }}>Send money globally to any NeoBank user instantly</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Transfer form */}
        <div className="lg:col-span-2 neo-card p-6">
          <h2 className="font-semibold mb-6 flex items-center gap-2" style={{ color: '#f0f4f0' }}>
            <Send size={16} className="text-[var(--neo-green)]" /> Transaction Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* From Account */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>FROM ACCOUNT</label>
              {loadingAccounts ? (
                <div className="skeleton h-12 rounded-xl" />
              ) : (
                <div className="relative">
                  <Wallet size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#3a4e3a' }} />
                  <select
                    value={fromAccountId}
                    onChange={(e) => setFromAccountId(e.target.value)}
                    className="neo-input pl-10"
                    style={{ background: '#0a0d0a' }}
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.type} (•••• {acc.accountNumber.slice(-4)}) — Balance: {formatCurrency(acc.balance, acc.currency)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Recipient Email */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>RECIPIENT EMAIL</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#3a4e3a' }} />
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="neo-input pl-10"
                />
              </div>
            </div>

            {/* Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>AMOUNT (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="neo-input font-semibold"
                />
                {selectedAccount && amountNum > selectedAccount.balance && (
                  <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: '#f87171' }}>
                    <AlertCircle size={12} /> Exceeds available balance
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>CATEGORY</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="neo-input"
                  style={{ background: '#0a0d0a' }}
                >
                  <option value="OTHER">Other</option>
                  <option value="FOOD">Food & Dining</option>
                  <option value="SHOPPING">Shopping</option>
                  <option value="BILLS">Bills & Utilities</option>
                  <option value="TRAVEL">Travel / Fuel</option>
                  <option value="ENTERTAINMENT">Entertainment</option>
                  <option value="HEALTHCARE">Healthcare</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>DESCRIPTION (OPTIONAL)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Dinner split, invoice, etc."
                className="neo-input"
              />
            </div>

            {/* Submit */}
            <button
              id="send-transfer-btn"
              type="submit"
              disabled={sending || (selectedAccount ? amountNum > selectedAccount.balance : false)}
              className="neo-btn neo-btn-primary w-full"
              style={{ borderRadius: '12px', padding: '14px' }}
            >
              {sending ? 'Sending...' : 'Send Funds'}
            </button>
          </form>
        </div>

        {/* Info panel */}
        <div className="space-y-6">
          <div className="neo-card p-5 space-y-4">
            <h3 className="font-semibold text-sm" style={{ color: '#f0f4f0' }}>Transfer Summary</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span style={{ color: '#5a6e5a' }}>Send Amount:</span>
                <span className="font-semibold" style={{ color: '#f0f4f0' }}>{formatCurrency(amountNum)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#5a6e5a' }}>Network Fee:</span>
                <span className="font-semibold text-green-400">FREE</span>
              </div>
              <div className="flex justify-between" style={{ borderTop: '1px solid #1f271f', paddingTop: '8px' }}>
                <span style={{ color: '#8fa08f' }}>Total Debit:</span>
                <span className="font-bold text-sm" style={{ color: '#f0f4f0' }}>{formatCurrency(amountNum)}</span>
              </div>
            </div>
            {rewardPointsEarned > 0 && (
              <div
                className="rounded-xl p-3.5 flex items-center gap-3"
                style={{ background: 'rgba(0, 230, 118, 0.06)', border: '1px solid rgba(0, 230, 118, 0.15)' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px]"
                  style={{ background: 'var(--neo-green)', color: '#050d05' }}
                >
                  +{rewardPointsEarned}
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--neo-green)' }}>Points Reward</p>
                  <p className="text-[10px]" style={{ color: '#5a6e5a' }}>You will earn {rewardPointsEarned} points</p>
                </div>
              </div>
            )}
          </div>

          <div
            className="rounded-2xl p-5 flex items-start gap-3"
            style={{ background: 'rgba(0, 230, 118, 0.03)', border: '1px solid #1f271f' }}
          >
            <ShieldCheck size={18} className="mt-0.5" style={{ color: 'var(--neo-green)' }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: '#f0f4f0' }}>Secured Ledger</p>
              <p className="text-[11px] leading-relaxed mt-1" style={{ color: '#5a6e5a' }}>
                All transaction amounts are securely routed inside our demo ledger. Ensure the recipient email corresponds to a registered customer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {receipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setReceipt(null)} />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="neo-card w-full max-w-sm overflow-hidden relative z-10"
            >
              <div
                className="p-6 text-center text-white"
                style={{ background: 'linear-gradient(135deg, #0d2a17, #0a0d0a)' }}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={28} className="text-emerald-400" />
                </div>
                <h3 className="font-bold text-lg">Transaction Receipt</h3>
                <p className="text-xs opacity-50 mt-1">Reference: {receipt.reference}</p>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: '#5a6e5a' }}>Recipient:</span>
                  <span className="font-bold text-right" style={{ color: '#f0f4f0' }}>
                    {receipt.recipient?.name}<br />
                    <span className="font-normal opacity-50">{receipt.recipient?.email}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#5a6e5a' }}>Source Account:</span>
                  <span className="font-semibold" style={{ color: '#f0f4f0' }}>Checking Account</span>
                </div>
                <div className="flex justify-between" style={{ borderTop: '1px solid #1f271f', paddingTop: '10px' }}>
                  <span style={{ color: '#5a6e5a' }}>Amount Transferred:</span>
                  <span className="text-sm font-bold text-white">{formatCurrency(receipt.amount)}</span>
                </div>
              </div>

              <div className="p-4" style={{ background: '#111411', borderTop: '1px solid #1f271f' }}>
                <button onClick={() => setReceipt(null)} className="neo-btn neo-btn-primary w-full text-xs">
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
