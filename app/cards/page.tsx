'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CreditCard, Lock, Unlock, RefreshCw, Eye, EyeOff, Star } from 'lucide-react'
import { formatCurrency, maskCardNumber } from '@/lib/utils'
import { apiRequest } from '@/lib/store'
import { toast } from 'sonner'

interface Card {
  id: string
  cardNumber: string
  expiry: string
  cvv: string
  cardType: string
  status: string
  createdAt: string
}

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [showCVV, setShowCVV] = useState<Record<string, boolean>>({})
  const [issuing, setIssuing] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiRequest('/api/cards')
      if (res?.ok) {
        const json = await res.json()
        setCards(json.cards)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleStatusChange = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE'
    try {
      const res = await apiRequest(`/api/cards/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      })
      if (res?.ok) {
        toast.success(`Card successfully ${nextStatus === 'FROZEN' ? 'frozen' : 'unfrozen'}`)
        load()
      }
    } catch {
      toast.error('Failed to update card status')
    }
  }

  const issueCard = async (type: string) => {
    setIssuing(true)
    try {
      const res = await apiRequest('/api/cards', {
        method: 'POST',
        body: JSON.stringify({ cardType: type }),
      })
      if (res?.ok) {
        toast.success('New virtual card generated!')
        load()
      }
    } catch {
      toast.error('Failed to issue card')
    } finally {
      setIssuing(false)
    }
  }

  const toggleCVV = (id: string) => {
    setShowCVV((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#f0f4f0' }}>My Cards</h1>
          <p className="text-sm" style={{ color: '#5a6e5a' }}>Manage virtual debit cards and security settings</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="neo-btn neo-btn-ghost p-2.5" style={{ borderRadius: '10px' }}>
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => issueCard('VISA')}
            disabled={issuing}
            className="neo-btn neo-btn-primary text-sm"
          >
            <Plus size={15} /> Generate Card
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          [1].map((i) => <div key={i} className="skeleton h-52 rounded-2xl" />)
        ) : cards.length === 0 ? (
          <div className="col-span-full neo-card p-12 text-center" style={{ color: '#3a4e3a' }}>
            <CreditCard size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-lg mb-1" style={{ color: '#f0f4f0' }}>No cards issued</p>
            <p className="text-sm mb-6 max-w-xs mx-auto">Generate a virtual Visa or Mastercard instantly to use for e-commerce.</p>
            <button onClick={() => issueCard('VISA')} className="neo-btn neo-btn-primary text-sm">
              Issue free card
            </button>
          </div>
        ) : (
          cards.map((card, i) => {
            const frozen = card.status === 'FROZEN'
            const cancelled = card.status === 'CANCELLED'
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="space-y-4"
              >
                {/* 3D virtual card layout */}
                <div
                  className={`virtual-card ${frozen ? 'virtual-card-dark' : 'virtual-card-green'} relative overflow-hidden`}
                  style={{
                    filter: frozen ? 'grayscale(0.8) opacity(0.85)' : undefined,
                    boxShadow: frozen ? 'none' : '0 20px 48px rgba(0, 230, 118, 0.18)',
                  }}
                >
                  {/* Frosted glass overlay for frozen */}
                  {frozen && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-10 flex items-center justify-center">
                      <div className="flex items-center gap-2 bg-[#0a0d0a] border border-[#1f271f] px-4 py-2 rounded-full shadow-lg">
                        <Lock size={14} className="text-gray-400" />
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Frozen</span>
                      </div>
                    </div>
                  )}

                  <div className="relative z-10">
                    {/* Top Row */}
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p
                          className="text-[10px] uppercase font-bold tracking-widest"
                          style={{ color: frozen ? '#8fa08f' : 'rgba(5,13,5,0.65)' }}
                        >
                          NeoBank · Virtual
                        </p>
                        <p className="font-bold text-lg mt-0.5" style={{ color: frozen ? '#f0f4f0' : '#050d05' }}>
                          Debit Card
                        </p>
                      </div>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: frozen ? 'rgba(255,255,255,0.06)' : 'rgba(5,13,5,0.1)' }}
                      >
                        <Star size={18} fill={frozen ? '#f0f4f0' : '#050d05'} color={frozen ? '#f0f4f0' : '#050d05'} />
                      </div>
                    </div>

                    {/* Card Number */}
                    <p
                      className="font-mono text-xl tracking-widest mb-6"
                      style={{ color: frozen ? '#f0f4f0' : '#050d05', wordSpacing: '4px' }}
                    >
                      {card.cardNumber}
                    </p>

                    {/* Bottom Row */}
                    <div className="flex items-end justify-between">
                      <div className="flex gap-8">
                        <div>
                          <p
                            className="text-[9px] uppercase tracking-wider mb-0.5"
                            style={{ color: frozen ? '#5a6e5a' : 'rgba(5,13,5,0.5)' }}
                          >
                            Expiry
                          </p>
                          <p className="font-semibold text-sm" style={{ color: frozen ? '#f0f4f0' : '#050d05' }}>
                            {card.expiry}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-[9px] uppercase tracking-wider mb-0.5"
                            style={{ color: frozen ? '#5a6e5a' : 'rgba(5,13,5,0.5)' }}
                          >
                            CVV
                          </p>
                          <p className="font-semibold text-sm" style={{ color: frozen ? '#f0f4f0' : '#050d05' }}>
                            {showCVV[card.id] ? card.cvv : '•••'}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-lg" style={{ color: frozen ? '#f0f4f0' : '#050d05' }}>
                        {card.cardType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleCVV(card.id)}
                    disabled={frozen}
                    className="neo-btn neo-btn-ghost text-xs py-2 flex-1"
                  >
                    {showCVV[card.id] ? <EyeOff size={14} /> : <Eye size={14} />} View CVV
                  </button>
                  <button
                    onClick={() => handleStatusChange(card.id, card.status)}
                    className={`neo-btn text-xs py-2 flex-1 ${frozen ? 'neo-btn-primary' : 'neo-btn-danger'}`}
                  >
                    {frozen ? <Unlock size={14} /> : <Lock size={14} />} {frozen ? 'Unfreeze' : 'Freeze'}
                  </button>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
