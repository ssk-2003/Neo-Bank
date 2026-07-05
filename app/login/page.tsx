'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Star } from 'lucide-react'
import { storeAuth } from '@/lib/store'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const contentType = res.headers.get('content-type') || ''
      const data = contentType.includes('application/json') ? await res.json() : null

      if (!res.ok) {
        const errorMsg = data?.detail || data?.error || 'Login failed'
        throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Login failed')
      }
      storeAuth(data.user, data.accessToken)
      toast.success(`Welcome back, ${data.user.firstName}!`)
      router.push(data.user.role === 'ADMIN' ? '/admin' : '/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role: 'customer' | 'admin') => {
    setEmail(role === 'admin' ? 'admin@neobank.com' : 'alice@example.com')
    setPassword('Password123!')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#0a0d0a' }}
    >
      {/* Background glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(0,230,118,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: '#5a6e5a' }}
      >
        <ArrowLeft size={15} />
        Back to home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md px-6"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'var(--neo-green)' }}
          >
            <Star size={16} fill="#050d05" color="#050d05" />
          </div>
          <span className="text-lg font-bold" style={{ color: '#f0f4f0' }}>NeoBank</span>
        </div>

        <h2 className="text-3xl font-bold mb-2" style={{ color: '#f0f4f0' }}>Welcome back</h2>
        <p className="mb-8" style={{ color: '#5a6e5a' }}>Sign in to your account to continue</p>

        {/* Demo shortcuts */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)' }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--neo-green)' }}>
            Try a demo account
          </p>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => fillDemo('customer')}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
              style={{ background: 'rgba(0,230,118,0.12)', color: 'var(--neo-green)', border: '1px solid rgba(0,230,118,0.2)' }}
            >
              Customer
            </button>
            <button
              onClick={() => fillDemo('admin')}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
              style={{ background: 'rgba(0,230,118,0.06)', color: '#8fa08f', border: '1px solid rgba(0,230,118,0.1)' }}
            >
              Admin
            </button>
          </div>
          <p className="text-xs" style={{ color: '#3a4e3a' }}>
            Password: <span className="font-mono" style={{ color: '#5a6e5a' }}>Password123!</span>
          </p>
        </div>

        {/* Form */}
        <div
          className="rounded-2xl p-7"
          style={{ background: '#111411', border: '1px solid #1f271f' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#8fa08f' }}>
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#3a4e3a' }} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="neo-input pl-10"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium" style={{ color: '#8fa08f' }}>Password</label>
                <Link href="/forgot-password" className="text-xs" style={{ color: 'var(--neo-green)' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#3a4e3a' }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="neo-input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: '#3a4e3a' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="neo-btn neo-btn-primary w-full mt-2"
              style={{ padding: '13px 20px', fontSize: '15px', borderRadius: '12px' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: '#3a4e3a' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'var(--neo-green)' }} className="font-medium">
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
