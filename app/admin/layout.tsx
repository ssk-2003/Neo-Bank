'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getStoredUser } from '@/lib/store'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = getStoredUser()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else if (user.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [user, router])

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0d0a' }}>
        <div className="skeleton h-8 w-32 rounded" />
      </div>
    )
  }

  return <>{children}</>
}
