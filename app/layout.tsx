import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'NeoBank - Modern Digital Banking',
  description: 'A modern, premium digital banking platform with AI-powered financial insights, multi-account management, and real-time analytics.',
  keywords: 'digital banking, fintech, money transfer, loans, budgets, analytics',
  authors: [{ name: 'NeoBank' }],
  openGraph: {
    title: 'NeoBank - Modern Digital Banking',
    description: 'Premium digital banking for the modern world',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0f1623',
                border: '1px solid #1e2d45',
                color: '#e2e8f0',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
