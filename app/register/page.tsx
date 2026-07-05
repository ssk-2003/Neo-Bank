'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Eye, EyeOff, User, Mail, Phone, Lock, Sparkles, CheckCircle2 } from 'lucide-react'
import { storeAuth } from '@/lib/store'

const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      })
      const contentType = res.headers.get('content-type') || ''
      const data = contentType.includes('application/json') ? await res.json() : null

      if (!res.ok) {
        const errorMsg = data?.detail || data?.error || 'Registration failed'
        throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Registration failed')
      }

      storeAuth(data.user, data.accessToken)
      toast.success('Account created! Welcome to NeoBank 🎉')
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#080c14' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="flex items-center gap-2 mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
          >
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">NeoBank</span>
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">Create account</h2>
        <p style={{ color: '#64748b' }} className="mb-8">
          Join thousands of users managing money smarter
        </p>

        <div
          className="rounded-2xl p-8"
          style={{ background: '#0f1623', border: '1px solid #1e2d45' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                  First Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                  <input
                    id="firstName"
                    type="text"
                    value={form.firstName}
                    onChange={(e) => update('firstName', e.target.value)}
                    placeholder="Alice"
                    required
                    className="neo-input pl-9 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                  Last Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                  <input
                    id="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={(e) => update('lastName', e.target.value)}
                    placeholder="Johnson"
                    required
                    className="neo-input pl-9 text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="neo-input pl-9 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                Phone <span style={{ color: '#475569' }}>(optional)</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+1-555-0000"
                  className="neo-input pl-9 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="••••••••"
                  required
                  className="neo-input pl-9 pr-9 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#475569' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Password strength */}
              {form.password && (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {passwordRules.map((rule) => {
                    const ok = rule.test(form.password)
                    return (
                      <div key={rule.label} className="flex items-center gap-1.5">
                        <CheckCircle2
                          size={12}
                          style={{ color: ok ? '#10b981' : '#334155' }}
                        />
                        <span className="text-xs" style={{ color: ok ? '#10b981' : '#475569' }}>
                          {rule.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  required
                  className="neo-input pl-9 text-sm"
                  style={{
                    borderColor: form.confirmPassword && form.password !== form.confirmPassword
                      ? '#ef4444' : undefined,
                  }}
                />
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs mt-1" style={{ color: '#ef4444' }}>Passwords do not match</p>
              )}
            </div>

            <button
              id="register-btn"
              type="submit"
              disabled={loading}
              className="neo-btn neo-btn-primary w-full mt-2"
              style={{ padding: '13px 20px', fontSize: '15px' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: '#475569' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#60a5fa' }} className="font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
