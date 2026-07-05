'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, RefreshCw, Lock, Unlock, Shield, ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'
import { getStatusColor } from '@/lib/utils'
import { apiRequest } from '@/lib/store'
import { toast } from 'sonner'

interface UserRecord {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  status: string
  createdAt: string
  _count: { accounts: number; loans: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : ''
      const res = await apiRequest(`/api/admin/users${q}`)
      if (res?.ok) {
        const json = await res.json()
        setUsers(json.users)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    load()
  }

  const handleStatusChange = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE'
    try {
      const res = await apiRequest('/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify({ userId, status: nextStatus }),
      })
      if (res?.ok) {
        toast.success(`User status successfully updated to ${nextStatus}`)
        load()
      } else {
        const json = await res?.json()
        toast.error(json?.error || 'Failed to modify status')
      }
    } catch {
      toast.error('Failed to modify status')
    }
  }

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'CUSTOMER' ? 'ADMIN' : 'CUSTOMER'
    try {
      const res = await apiRequest('/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify({ userId, role: nextRole }),
      })
      if (res?.ok) {
        toast.success(`User role successfully changed to ${nextRole}`)
        load()
      }
    } catch {}
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back link */}
      <Link href="/admin" className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#5a6e5a' }}>
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#f0f4f0' }}>
            <Users size={24} className="text-emerald-400" /> Customer Management
          </h1>
          <p className="text-sm" style={{ color: '#5a6e5a' }}>Review customer profiles, accounts count, and freeze access privileges</p>
        </div>
        <button onClick={load} className="neo-btn neo-btn-ghost p-2.5" style={{ borderRadius: '10px' }}>
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Search Filter */}
      <div className="neo-card p-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#3a4e3a' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="neo-input pl-9"
          />
        </form>
      </div>

      {/* Users table */}
      <div className="neo-card overflow-hidden">
        {loading ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded" />)}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm py-12 text-center" style={{ color: '#3a4e3a' }}>No customers found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="neo-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Accounts</th>
                  <th>Applications</th>
                  <th>Joined Date</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="font-semibold" style={{ color: '#d4e8d4' }}>
                        {u.firstName} {u.lastName}
                      </span>
                    </td>
                    <td><span style={{ color: '#8fa08f' }}>{u.email}</span></td>
                    <td><span className="font-semibold text-white">{u._count.accounts}</span></td>
                    <td><span className="font-semibold text-white">{u._count.loans}</span></td>
                    <td>
                      <span className="text-xs" style={{ color: '#5a6e5a' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <span className="badge text-[10px] bg-emerald-500/10 text-emerald-400">{u.role}</span>
                    </td>
                    <td>
                      <span className={`badge text-[10px] ${getStatusColor(u.status)}`}>{u.status}</span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(u.id, u.status)}
                          className="neo-btn neo-btn-ghost text-[10px] py-1 px-2.5 flex items-center gap-1"
                        >
                          {u.status === 'ACTIVE' ? (
                            <><Lock size={12} /> Freeze</>
                          ) : (
                            <><Unlock size={12} /> Activate</>
                          )}
                        </button>
                        <button
                          onClick={() => handleRoleChange(u.id, u.role)}
                          className="neo-btn neo-btn-ghost text-[10px] py-1 px-2.5 flex items-center gap-1"
                        >
                          <Shield size={12} /> Prom/Dem
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
