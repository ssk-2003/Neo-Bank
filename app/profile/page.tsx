'use client'

import { useEffect, useState } from 'react'
import { User, Shield, Key, RefreshCw, Star, Save } from 'lucide-react'
import { getStoredUser, apiRequest } from '@/lib/store'
import { toast } from 'sonner'

export default function ProfilePage() {
  const user = getStoredUser()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const [currency, setCurrency] = useState('USD')
  const [emailNotif, setEmailNotif] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setPhone(user.phone || '')
    }

    const loadSettings = async () => {
      try {
        const res = await apiRequest('/api/settings')
        if (res?.ok) {
          const json = await res.json()
          if (json.settings) {
            setCurrency(json.settings.currency)
            setEmailNotif(json.settings.emailNotifications)
          }
        }
      } catch {}
    }
    loadSettings()
  }, [])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await apiRequest('/api/user', {
        method: 'PUT',
        body: JSON.stringify({ firstName, lastName, phone }),
      })
      if (res?.ok) {
        toast.success('Profile details updated!')
        // Update local store
        const data = await res.json()
        localStorage.setItem('neobank_user', JSON.stringify({ ...user, ...data.user }))
      }
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPassword(true)
    try {
      const res = await apiRequest('/api/user', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res?.ok) {
        toast.success('Password successfully modified!')
        setCurrentPassword('')
        setNewPassword('')
      } else {
        const json = await res?.json()
        toast.error(json?.error || 'Failed to update password')
      }
    } catch {
      toast.error('Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      const res = await apiRequest('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ currency, emailNotifications: emailNotif }),
      })
      if (res?.ok) {
        toast.success('Preferences updated!')
      }
    } catch {
      toast.error('Failed to update settings')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#f0f4f0' }}>Account Settings</h1>
        <p className="text-sm" style={{ color: '#5a6e5a' }}>Update your personal profile, credentials, and notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="neo-card p-6">
            <h2 className="font-semibold mb-6 flex items-center gap-2" style={{ color: '#f0f4f0' }}>
              <User size={16} className="text-[var(--neo-green)]" /> Profile Details
            </h2>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>FIRST NAME</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="neo-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>LAST NAME</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="neo-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>PHONE NUMBER</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1-555-0100"
                  className="neo-input"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="neo-btn neo-btn-primary"
                style={{ borderRadius: '10px' }}
              >
                <Save size={14} /> {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* Password Card */}
          <div className="neo-card p-6">
            <h2 className="font-semibold mb-6 flex items-center gap-2" style={{ color: '#f0f4f0' }}>
              <Key size={16} className="text-[var(--neo-green)]" /> Security Credentials
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>CURRENT PASSWORD</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="neo-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>NEW PASSWORD</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="neo-input"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="neo-btn neo-btn-primary"
                style={{ borderRadius: '10px' }}
              >
                <Save size={14} /> {savingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Preferences Side Card */}
        <div className="space-y-6">
          <div className="neo-card p-5">
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#f0f4f0' }}>Preferences</h3>
            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#8fa08f' }}>DEFAULT CURRENCY</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="neo-input"
                  style={{ background: '#0a0d0a' }}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs" style={{ color: '#8fa08f' }}>Email Notifications</span>
                <input
                  type="checkbox"
                  checked={emailNotif}
                  onChange={(e) => setEmailNotif(e.target.checked)}
                  className="rounded border-[#1f271f]"
                  style={{ accentColor: 'var(--neo-green)' }}
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="neo-btn neo-btn-ghost text-xs w-full py-2.5 mt-2"
                style={{ borderRadius: '10px' }}
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
