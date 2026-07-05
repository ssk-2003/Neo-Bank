'use client'

/**
 * Simple auth store using localStorage + React state
 * No external library needed — fully free
 */

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatar?: string
  role: 'CUSTOMER' | 'ADMIN'
  status: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: AuthUser, token: string) => void
  clearAuth: () => void
}

// We'll use a simple module-level store since zustand requires an extra install
// Instead, use Context + localStorage
let _user: AuthUser | null = null
let _token: string | null = null

if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('neobank_user')
    const storedToken = localStorage.getItem('neobank_token')
    if (stored) _user = JSON.parse(stored)
    if (storedToken) _token = storedToken
  } catch {}
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('neobank_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('neobank_token')
}

export function storeAuth(user: AuthUser, token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('neobank_user', JSON.stringify(user))
  localStorage.setItem('neobank_token', token)
}

export function clearAuth() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('neobank_user')
  localStorage.removeItem('neobank_token')
}

export async function apiRequest(url: string, options: RequestInit = {}) {
  const token = getStoredToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(url, { ...options, headers })

  // Auto-refresh on 401
  if (response.status === 401) {
    const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' })
    if (refreshRes.ok) {
      const { accessToken } = await refreshRes.json()
      localStorage.setItem('neobank_token', accessToken)
      headers['Authorization'] = `Bearer ${accessToken}`
      return fetch(url, { ...options, headers })
    } else {
      clearAuth()
      window.location.href = '/login'
    }
  }

  return response
}
