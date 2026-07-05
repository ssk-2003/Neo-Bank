'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Wallet, RefreshCw, Landmark, CheckCircle, Banknote, X, ArrowRight } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { apiRequest } from '@/lib/store'
import { toast } from 'sonner'

interface Account {
  id: string
  accountNumber: string
  type: string
  balance: number
  currency: string
  status: string
  createdAt: string
}

type Step = 'idle' | 'type' | 'fund' | 'done'

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000]

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  // Multi-step account creation state
  const [step, setStep] = useState<Step>('idle')
  const [newType, setNewType] = useState('CHECKING')
  const [createdAccount, setCreatedAccount] = useState<Account | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [creating, setCreating] = useState(false)
  const [depositing, setDepositing] = useState(false)

  // Deposit to existing account
  const [depositTarget, setDepositTarget] = useState<Account | null>(null)
  const [quickDepositAmount, setQuickDepositAmount] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiRequest('/api/accounts')
      if (res?.ok) {
        const json = await res.json()
        setAccounts(json.accounts)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Step 1: Create account with $0 balance
  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await apiRequest('/api/accounts', {
        method: 'POST',
        body: JSON.stringify({ type: newType }),
      })
      if (res?.ok) {
        const json = await res.json()
        setCreatedAccount(json.account)
        setStep('fund')
        toast.success('Account created! Now add some demo funds.')
      } else {
        const json = await res?.json()
        toast.error(json?.error || 'Failed to create account')
      }
    } catch {
      toast.error('Failed to create account')
    } finally {
      setCreating(false)
    }
  }

  // Step 2: Add demo money
  const handleDeposit = async (acct: Account, amount: string, onSuccess?: () => void) => {
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0 || amountNum > 100000) {
      toast.error('Enter a valid amount (max $100,000)')
      return
    }

    setDepositing(true)
    try {
      const res = await apiRequest('/api/deposit', {
        method: 'POST',
        body: JSON.stringify({ accountId: acct.id, amount: amountNum, description: 'Demo money added' }),
      })
      if (res?.ok) {
        const json = await res.json()
        toast.success(`$${amountNum.toLocaleString()} demo funds added! 🎉`)
        if (onSuccess) onSuccess()
        await load()
      } else {
        const json = await res?.json()
        toast.error(json?.error || 'Deposit failed')
      }
    } catch {
      toast.error('Deposit failed')
    } finally {
      setDepositing(false)
    }
  }

  const closeModal = () => {
    setStep('idle')
    setCreatedAccount(null)
    setDepositAmount('')
    setNewType('CHECKING')
  }

  const handleSkipFunding = () => {
    toast.info('Account created with $0. You can add funds anytime using the "Add Funds" button.')
    closeModal()
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#f0f4f0' }}>My Accounts</h1>
          <p className="text-sm" style={{ color: '#5a6e5a' }}>Manage and monitor your digital bank accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="neo-btn neo-btn-ghost p-2.5" style={{ borderRadius: '10px' }}>
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setStep('type')} className="neo-btn neo-btn-primary text-sm">
            <Plus size={15} /> Open New Account
          </button>
        </div>
      </div>

      {/* Account Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2].map((i) => (
            <div key={i} className="stat-card">
              <div className="skeleton h-10 w-10 rounded-xl mb-4" />
              <div className="skeleton h-4 w-28 rounded mb-2" />
              <div className="skeleton h-6 w-32 rounded" />
            </div>
          ))
        ) : accounts.length === 0 ? (
          <div className="col-span-full neo-card p-12 text-center" style={{ color: '#3a4e3a' }}>
            <Landmark size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-lg mb-1" style={{ color: '#f0f4f0' }}>No active accounts</p>
            <p className="text-sm mb-6 max-w-sm mx-auto">Open a checking or savings account to start banking with NeoBank.</p>
            <button onClick={() => setStep('type')} className="neo-btn neo-btn-primary text-sm">
              Open your first account
            </button>
          </div>
        ) : (
          accounts.map((acc, i) => (
            <motion.div
              key={acc.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="stat-card flex flex-col justify-between min-h-[200px]"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(0,230,118,0.1)', color: 'var(--neo-green)' }}
                  >
                    <Wallet size={18} />
                  </div>
                  <span className={`badge text-[10px] ${getStatusColor(acc.status)}`}>{acc.status}</span>
                </div>
                <p className="text-xs mb-0.5" style={{ color: '#3a4e3a' }}>
                  {acc.type} · •••• {acc.accountNumber.slice(-4)}
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#f0f4f0' }}>
                  {formatCurrency(acc.balance, acc.currency)}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-5 pt-4" style={{ borderTop: '1px solid #1f271f' }}>
                <button
                  onClick={() => {
                    setDepositTarget(acc)
                    setQuickDepositAmount('')
                  }}
                  className="neo-btn neo-btn-ghost text-xs py-1.5 flex-1"
                >
                  <Banknote size={13} /> Add Funds
                </button>
                <span className="text-[10px]" style={{ color: '#3a4e3a' }}>
                  {formatDate(acc.createdAt, 'short')}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ── STEP 1: Choose account type ── */}
      <AnimatePresence>
        {step === 'type' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="neo-card w-full max-w-md p-6 relative z-10"
            >
              <button onClick={closeModal} className="absolute top-4 right-4" style={{ color: '#3a4e3a' }}>
                <X size={18} />
              </button>
              <div className="mb-6">
                <p className="text-xs font-bold mb-1" style={{ color: 'var(--neo-green)' }}>STEP 1 OF 2</p>
                <h2 className="text-xl font-bold mb-1" style={{ color: '#f0f4f0' }}>Choose Account Type</h2>
                <p className="text-sm" style={{ color: '#5a6e5a' }}>Account starts at $0. You'll add demo funds in the next step.</p>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { value: 'CHECKING', label: 'Checking Account', desc: 'Day-to-day transactions & debit card' },
                  { value: 'SAVINGS', label: 'Savings Account', desc: '4.5% simulated APY accumulation' },
                  { value: 'BUSINESS', label: 'Business Account', desc: 'Corporate invoicing & payroll' },
                  { value: 'INVESTMENT', label: 'Investment Account', desc: 'Stock portfolio simulation' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setNewType(opt.value)}
                    className="w-full text-left p-4 rounded-xl border transition-all"
                    style={{
                      background: newType === opt.value ? 'rgba(0,230,118,0.08)' : '#111411',
                      borderColor: newType === opt.value ? 'var(--neo-green)' : '#1f271f',
                    }}
                  >
                    <p className="font-semibold text-sm" style={{ color: newType === opt.value ? 'var(--neo-green)' : '#f0f4f0' }}>
                      {opt.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#5a6e5a' }}>{opt.desc}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={handleCreate}
                disabled={creating}
                className="neo-btn neo-btn-primary w-full"
                style={{ borderRadius: '12px', padding: '14px' }}
              >
                {creating ? 'Creating...' : <><ArrowRight size={15} /> Create Account</>}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── STEP 2: Add demo money ── */}
      <AnimatePresence>
        {step === 'fund' && createdAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="neo-card w-full max-w-md p-6 relative z-10"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,230,118,0.15)', color: 'var(--neo-green)' }}>
                  <CheckCircle size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--neo-green)' }}>STEP 2 OF 2 · ACCOUNT CREATED</p>
                  <h2 className="text-xl font-bold" style={{ color: '#f0f4f0' }}>Add Demo Funds</h2>
                </div>
              </div>

              <div className="p-4 rounded-xl mb-6" style={{ background: '#111411', border: '1px solid #1f271f' }}>
                <p className="text-xs" style={{ color: '#5a6e5a' }}>{createdAccount.type} · •••• {createdAccount.accountNumber.slice(-4)}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: '#f0f4f0' }}>
                  {formatCurrency(createdAccount.balance)}
                  <span className="text-sm font-normal ml-2" style={{ color: '#5a6e5a' }}>current balance</span>
                </p>
              </div>

              <p className="text-xs font-semibold mb-3" style={{ color: '#8fa08f' }}>QUICK SELECT AMOUNT</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setDepositAmount(String(amt))}
                    className="p-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: depositAmount === String(amt) ? 'var(--neo-green)' : 'rgba(0,230,118,0.06)',
                      color: depositAmount === String(amt) ? '#050d05' : 'var(--neo-green)',
                      border: '1px solid',
                      borderColor: depositAmount === String(amt) ? 'var(--neo-green)' : '#1f271f',
                    }}
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>CUSTOM AMOUNT (USD)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 12500"
                  className="neo-input"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSkipFunding}
                  className="neo-btn neo-btn-ghost flex-1 text-sm"
                >
                  Skip for now
                </button>
                <button
                  onClick={() => handleDeposit(createdAccount, depositAmount, closeModal)}
                  disabled={depositing || !depositAmount}
                  className="neo-btn neo-btn-primary flex-1 text-sm"
                >
                  {depositing ? 'Adding...' : `Add $${parseFloat(depositAmount || '0').toLocaleString()}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Quick deposit to existing account ── */}
      <AnimatePresence>
        {depositTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDepositTarget(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="neo-card w-full max-w-md p-6 relative z-10"
            >
              <button onClick={() => setDepositTarget(null)} className="absolute top-4 right-4" style={{ color: '#3a4e3a' }}>
                <X size={18} />
              </button>

              <h2 className="text-xl font-bold mb-1" style={{ color: '#f0f4f0' }}>
                <Banknote size={20} className="inline mr-2 text-[var(--neo-green)]" />
                Add Demo Funds
              </h2>
              <p className="text-sm mb-5" style={{ color: '#5a6e5a' }}>
                Adding to {depositTarget.type} ···· {depositTarget.accountNumber.slice(-4)} 
                <span className="ml-2 font-semibold" style={{ color: 'var(--neo-green)' }}>
                  ({formatCurrency(depositTarget.balance)})
                </span>
              </p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setQuickDepositAmount(String(amt))}
                    className="p-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: quickDepositAmount === String(amt) ? 'var(--neo-green)' : 'rgba(0,230,118,0.06)',
                      color: quickDepositAmount === String(amt) ? '#050d05' : 'var(--neo-green)',
                      border: '1px solid',
                      borderColor: quickDepositAmount === String(amt) ? 'var(--neo-green)' : '#1f271f',
                    }}
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>CUSTOM AMOUNT</label>
                <input
                  type="number"
                  value={quickDepositAmount}
                  onChange={(e) => setQuickDepositAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  className="neo-input"
                />
              </div>

              <button
                onClick={() => handleDeposit(depositTarget, quickDepositAmount, () => {
                  setDepositTarget(null)
                  setQuickDepositAmount('')
                })}
                disabled={depositing || !quickDepositAmount}
                className="neo-btn neo-btn-primary w-full"
                style={{ borderRadius: '12px', padding: '14px' }}
              >
                {depositing
                  ? 'Adding funds...'
                  : `Add ${quickDepositAmount ? '$' + parseFloat(quickDepositAmount).toLocaleString() : 'Funds'}`}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
