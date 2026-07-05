'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, RefreshCw, Star, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { apiRequest } from '@/lib/store'
import { toast } from 'sonner'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiRequest('/api/notifications')
      if (res?.ok) {
        const json = await res.json()
        setNotifs(json.notifications)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const markAllRead = async () => {
    try {
      const res = await apiRequest('/api/notifications', {
        method: 'PUT',
        body: JSON.stringify({ markAllRead: true }),
      })
      if (res?.ok) {
        toast.success('All notifications marked as read')
        load()
      }
    } catch {
      toast.error('Failed to update notifications')
    }
  }

  const markRead = async (id: string) => {
    try {
      const res = await apiRequest('/api/notifications', {
        method: 'PUT',
        body: JSON.stringify({ id }),
      })
      if (res?.ok) {
        load()
      }
    } catch {}
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#f0f4f0' }}>
            <Bell size={24} className="text-[var(--neo-green)]" /> Notifications
          </h1>
          <p className="text-sm" style={{ color: '#5a6e5a' }}>Stay updated with transfer alerts, security, and loans</p>
        </div>
        <div className="flex items-center gap-2">
          {notifs.some((n) => !n.read) && (
            <button onClick={markAllRead} className="neo-btn neo-btn-ghost text-xs py-2 flex items-center gap-1.5">
              <Check size={14} /> Mark all read
            </button>
          )}
          <button onClick={load} className="neo-btn neo-btn-ghost p-2 flex items-center justify-center" style={{ borderRadius: '10px', width: '36px', height: '36px' }}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="neo-card overflow-hidden p-2">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-20" style={{ color: '#3a4e3a' }}>
            <Bell size={36} className="mx-auto mb-2 opacity-35" />
            <p className="text-sm">Inbox clean! No new notifications.</p>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {notifs.map((n) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  onClick={() => !n.read && markRead(n.id)}
                  className="p-4 rounded-xl flex items-start gap-3 transition-colors select-none"
                  style={{
                    background: n.read ? 'transparent' : 'rgba(0, 230, 118, 0.03)',
                    cursor: n.read ? 'default' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 230, 118, 0.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(0, 230, 118, 0.03)'
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: n.type === 'SUCCESS' ? 'rgba(0,230,118,0.1)' : 'rgba(90, 110, 90, 0.1)',
                      color: n.type === 'SUCCESS' ? 'var(--neo-green)' : '#8fa08f',
                    }}
                  >
                    <Star size={14} fill={n.type === 'SUCCESS' ? 'var(--neo-green)' : 'transparent'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: '#f0f4f0' }}>{n.title}</p>
                      <span className="text-[10px] flex-shrink-0" style={{ color: '#3a4e3a' }}>
                        {formatDate(n.createdAt, 'relative')}
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#8fa08f' }}>{n.message}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--neo-green)', boxShadow: '0 0 6px var(--neo-green)' }} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
