'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, CreditCard, ArrowLeftRight, Receipt, PiggyBank,
  BarChart3, Bell, Bot, Settings, LogOut, ChevronLeft,
  Wallet, Target, Menu, X, Shield, Star, TrendingDown,
} from 'lucide-react'
import { getStoredUser, clearAuth } from '@/lib/store'
import { toast } from 'sonner'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/accounts', icon: Wallet, label: 'Accounts' },
  { href: '/transactions', icon: Receipt, label: 'Transactions' },
  { href: '/expenses', icon: TrendingDown, label: 'Expenses' },
  { href: '/transfer', icon: ArrowLeftRight, label: 'Transfer' },
  { href: '/cards', icon: CreditCard, label: 'Cards' },
  { href: '/loans', icon: PiggyBank, label: 'Loans' },
  { href: '/budget', icon: Target, label: 'Budget' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/ai-assistant', icon: Bot, label: 'AI Assistant' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = getStoredUser()

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    clearAuth()
    toast.success('Logged out successfully')
    router.push('/login')
  }

  const initials = user
    ? `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}`.toUpperCase()
    : 'U'

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: '#0a0d0a',
        borderRight: '1px solid #1f271f',
        width: mobile ? '260px' : collapsed ? '72px' : '240px',
        transition: 'width 0.3s ease',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 flex-shrink-0"
        style={{ borderBottom: '1px solid #1f271f', minHeight: '72px' }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--neo-green)' }}
        >
          <Star size={16} fill="#050d05" color="#050d05" />
        </div>
        {(!collapsed || mobile) && (
          <span className="text-lg font-bold whitespace-nowrap" style={{ color: '#f0f4f0' }}>
            NeoBank
          </span>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1 rounded-lg"
            style={{ color: '#3a4e3a' }}
          >
            <ChevronLeft
              size={16}
              style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}
            />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="sidebar-link"
              style={{
                background: active ? 'rgba(0,230,118,0.1)' : 'transparent',
                color: active ? 'var(--neo-green)' : '#5a6e5a',
                justifyContent: collapsed && !mobile ? 'center' : 'flex-start',
              }}
              title={collapsed && !mobile ? item.label : ''}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {(!collapsed || mobile) && <span className="whitespace-nowrap">{item.label}</span>}
              {active && (!collapsed || mobile) && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--neo-green)' }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 space-y-1 flex-shrink-0" style={{ borderTop: '1px solid #1f271f' }}>
        {user?.role === 'ADMIN' && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className="sidebar-link"
            style={{
              color: '#a3e6a3',
              justifyContent: collapsed && !mobile ? 'center' : 'flex-start',
            }}
          >
            <Shield size={18} className="flex-shrink-0" />
            {(!collapsed || mobile) && <span>Admin Panel</span>}
          </Link>
        )}
        <Link
          href="/profile"
          onClick={() => setMobileOpen(false)}
          className="sidebar-link"
          style={{
            background: pathname === '/profile' ? 'rgba(0,230,118,0.1)' : 'transparent',
            color: pathname === '/profile' ? 'var(--neo-green)' : '#5a6e5a',
            justifyContent: collapsed && !mobile ? 'center' : 'flex-start',
          }}
        >
          <Settings size={18} className="flex-shrink-0" />
          {(!collapsed || mobile) && <span>Settings</span>}
        </Link>

        {/* User chip */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl mt-2"
          style={{ background: '#111411' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
            style={{ background: 'var(--neo-green)', color: '#050d05' }}
          >
            {initials}
          </div>
          {(!collapsed || mobile) && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#f0f4f0' }}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs truncate" style={{ color: '#3a4e3a' }}>{user?.role}</p>
              </div>
              <button onClick={handleLogout} style={{ color: '#3a4e3a' }} title="Logout">
                <LogOut size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0d0a' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.7)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
            >
              <div className="relative h-full">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="absolute top-4 right-3 z-10 p-1"
                  style={{ color: '#5a6e5a' }}
                >
                  <X size={18} />
                </button>
                <SidebarContent mobile />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div
          className="flex items-center gap-3 px-4 py-4 lg:hidden flex-shrink-0"
          style={{ borderBottom: '1px solid #1f271f', background: '#0a0d0a' }}
        >
          <button onClick={() => setMobileOpen(true)} style={{ color: '#5a6e5a' }}>
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--neo-green)' }}>
              <Star size={13} fill="#050d05" color="#050d05" />
            </div>
            <span className="font-bold" style={{ color: '#f0f4f0' }}>NeoBank</span>
          </div>
        </div>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8" style={{ background: '#0a0d0a' }}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
