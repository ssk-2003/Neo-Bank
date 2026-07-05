'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Wallet, TrendingUp, CreditCard, Shield, Zap, ArrowRight,
  BarChart3, Send, Lock, CheckCircle, Star
} from 'lucide-react'

const features = [
  {
    icon: Wallet,
    title: 'Multiple accounts',
    desc: 'Checking, savings, business — organize your money the way you live.',
  },
  {
    icon: TrendingUp,
    title: 'Smart insights',
    desc: 'Real-time analytics show where every dollar goes, so you can plan ahead.',
  },
  {
    icon: CreditCard,
    title: 'Virtual cards',
    desc: 'Freeze, unfreeze, replace — total control over your cards, instantly.',
  },
]

const stats = [
  { label: 'Active users', value: '2M+' },
  { label: 'Countries', value: '48' },
  { label: 'Uptime', value: '99.9%' },
  { label: 'Avg. rating', value: '4.9★' },
]

const perks = [
  { icon: Zap, text: 'Instant transfers' },
  { icon: Shield, text: 'Bank-grade security' },
  { icon: BarChart3, text: 'AI financial insights' },
  { icon: Send, text: 'Global payments' },
  { icon: Lock, text: '2FA protection' },
  { icon: CheckCircle, text: 'Zero hidden fees' },
]

export default function LandingPage() {
  return (
    <div style={{ background: '#0a0d0a', minHeight: '100vh', color: '#f0f4f0' }}>
      {/* ===== NAVBAR ===== */}
      <header
        className="landing-nav fixed top-0 left-0 right-0 z-50"
        style={{ borderBottom: '1px solid rgba(31,39,31,0.6)' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'var(--neo-green)' }}
            >
              <Star size={16} fill="#050d05" color="#050d05" />
            </div>
            <span className="text-lg font-bold" style={{ color: '#f0f4f0' }}>NeoBank</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'Security', 'Pricing'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm transition-colors"
                style={{ color: '#8fa08f' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f0f4f0')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#8fa08f')}
              >
                {item}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium hidden md:block"
              style={{ color: '#8fa08f' }}
            >
              Sign in
            </Link>
            <Link href="/register" className="neo-btn neo-btn-primary text-sm px-5 py-2.5">
              Get started <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        style={{ paddingTop: '140px', paddingBottom: '80px', minHeight: '100vh' }}
      >
        {/* Background glows */}
        <div
          className="absolute"
          style={{
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '700px',
            height: '700px',
            background: 'radial-gradient(circle, rgba(0,230,118,0.09) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-sm"
          style={{
            background: 'rgba(0,230,118,0.07)',
            border: '1px solid rgba(0,230,118,0.2)',
            color: '#8fa08f',
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--neo-green)', boxShadow: '0 0 8px var(--neo-green)' }}
          />
          Demo · No real money involved
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-bold leading-tight mb-6"
          style={{ fontSize: 'clamp(42px, 7vw, 80px)', maxWidth: '780px' }}
        >
          Banking,{' '}
          <span className="gradient-green-text">reimagined</span>
          <br />
          for a modern life.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg mb-10 max-w-xl"
          style={{ color: '#6b7f6b', lineHeight: 1.7 }}
        >
          Send money in seconds, track every dollar, and grow your savings — with a{' '}
          <span style={{ color: 'var(--neo-green)' }}>beautifully simple app</span> that puts you in control.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-4 mb-20"
        >
          <Link
            href="/register"
            className="neo-btn neo-btn-primary"
            style={{ padding: '14px 28px', fontSize: '15px' }}
          >
            Open free account <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="neo-btn"
            style={{
              padding: '14px 28px',
              fontSize: '15px',
              background: 'transparent',
              color: '#f0f4f0',
              border: '1px solid rgba(240,244,240,0.12)',
              borderRadius: '999px',
            }}
          >
            Sign in
          </Link>
        </motion.div>

        {/* Virtual Card Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative w-full max-w-sm animate-float"
        >
          {/* Card glow */}
          <div
            className="absolute -inset-4 rounded-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(0,230,118,0.2) 0%, transparent 70%)',
              filter: 'blur(20px)',
            }}
          />

          {/* The card */}
          <div
            className="virtual-card virtual-card-green relative z-10"
            style={{ boxShadow: '0 24px 80px rgba(0,230,118,0.25)' }}
          >
            <div className="relative z-10">
              {/* Top row */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(5,13,5,0.65)', fontSize: '10px' }}>
                    NeoBank · Debit
                  </p>
                  <p className="font-bold text-lg" style={{ color: '#050d05' }}>Alex Morgan</p>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(5,13,5,0.12)' }}
                >
                  <Star size={18} fill="#050d05" color="#050d05" />
                </div>
              </div>

              {/* Card number */}
              <p
                className="font-mono mb-6 tracking-widest"
                style={{ fontSize: '17px', color: '#050d05', letterSpacing: '0.18em' }}
              >
                ••••  ••••  ••••  4242
              </p>

              {/* Bottom row */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'rgba(5,13,5,0.5)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Valid Thru
                  </p>
                  <p className="font-semibold" style={{ color: '#050d05' }}>12/29</p>
                </div>
                <p className="font-bold text-xl" style={{ color: '#050d05', letterSpacing: '0.05em' }}>VISA</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="px-6 pb-20" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="feature-card"
            >
              <div className="feature-icon">
                <f.icon size={20} />
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#f0f4f0' }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#5a6e5a' }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section
        className="px-6 py-16"
        style={{ borderTop: '1px solid #1f271f', borderBottom: '1px solid #1f271f' }}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-bold text-3xl mb-1 gradient-green-text">{s.value}</p>
              <p className="text-sm" style={{ color: '#5a6e5a' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PERKS ===== */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-bold text-4xl mb-4">
            Everything you need,{' '}
            <span className="gradient-green-text">nothing you don't</span>
          </h2>
          <p className="text-lg" style={{ color: '#5a6e5a' }}>
            Built for speed, security, and simplicity.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {perks.map((p, i) => (
            <motion.div
              key={p.text}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: '#111411', border: '1px solid #1f271f' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,230,118,0.1)', color: 'var(--neo-green)' }}
              >
                <p.icon size={16} />
              </div>
              <span className="text-sm font-medium" style={{ color: '#c8d8c8' }}>{p.text}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0d1f0d, #111a11)', border: '1px solid rgba(0,230,118,0.2)' }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(0,230,118,0.12), transparent 60%)',
              pointerEvents: 'none',
            }}
          />
          <h2 className="relative font-bold text-4xl mb-4">
            Ready to take control of{' '}
            <span className="gradient-green-text">your money?</span>
          </h2>
          <p className="relative text-lg mb-8" style={{ color: '#5a6e5a' }}>
            Join 2M+ users banking smarter. Free forever.
          </p>
          <div className="relative flex items-center justify-center gap-4">
            <Link href="/register" className="neo-btn neo-btn-primary" style={{ padding: '14px 32px', fontSize: '15px' }}>
              Open free account <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="text-sm font-medium" style={{ color: '#8fa08f' }}>
              Already have an account? Sign in →
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-8 text-center text-sm"
        style={{ borderTop: '1px solid #1f271f', color: '#3a4e3a' }}
      >
        © 2024 NeoBank · Portfolio demo · No real banking services
      </footer>
    </div>
  )
}
