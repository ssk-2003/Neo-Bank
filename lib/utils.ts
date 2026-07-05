import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format currency */
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

/** Format date */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'relative' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (format === 'relative') {
    const diff = Date.now() - d.getTime()
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
  }
  if (format === 'long') {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Mask card number — show only last 4 digits */
export function maskCardNumber(cardNumber: string): string {
  const clean = cardNumber.replace(/\s/g, '')
  return `**** **** **** ${clean.slice(-4)}`
}

/** Generate a random account number */
export function generateAccountNumber(): string {
  return Math.random().toString().slice(2, 12).padStart(10, '0')
}

/** Calculate EMI for a loan */
export function calculateEMI(principal: number, ratePercent: number, months: number): number {
  const r = ratePercent / 100 / 12
  if (r === 0) return principal / months
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
  return Math.round(emi * 100) / 100
}

/** Get category color */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    FOOD: '#F59E0B',
    SHOPPING: '#8B5CF6',
    BILLS: '#EF4444',
    TRAVEL: '#3B82F6',
    EDUCATION: '#10B981',
    ENTERTAINMENT: '#EC4899',
    HEALTHCARE: '#14B8A6',
    SALARY: '#22C55E',
    OTHER: '#6B7280',
  }
  return colors[category] || '#6B7280'
}

/** Get category icon name (for lucide-react) */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    FOOD: 'UtensilsCrossed',
    SHOPPING: 'ShoppingBag',
    BILLS: 'FileText',
    TRAVEL: 'Plane',
    EDUCATION: 'GraduationCap',
    ENTERTAINMENT: 'Gamepad2',
    HEALTHCARE: 'Heart',
    SALARY: 'Briefcase',
    OTHER: 'Circle',
  }
  return icons[category] || 'Circle'
}

/** Get status badge color */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'text-green-400 bg-green-400/10',
    COMPLETED: 'text-green-400 bg-green-400/10',
    APPROVED: 'text-green-400 bg-green-400/10',
    PENDING: 'text-yellow-400 bg-yellow-400/10',
    FROZEN: 'text-blue-400 bg-blue-400/10',
    REJECTED: 'text-red-400 bg-red-400/10',
    CANCELLED: 'text-gray-400 bg-gray-400/10',
    FAILED: 'text-red-400 bg-red-400/10',
    CLOSED: 'text-gray-400 bg-gray-400/10',
    SUSPENDED: 'text-orange-400 bg-orange-400/10',
  }
  return colors[status] || 'text-gray-400 bg-gray-400/10'
}

/** Truncate text */
export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}...` : str
}

/** Get initials from name */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

/** Get tier color for rewards */
export function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    BRONZE: 'text-amber-600',
    SILVER: 'text-slate-400',
    GOLD: 'text-yellow-400',
    PLATINUM: 'text-cyan-400',
  }
  return colors[tier] || 'text-gray-400'
}
