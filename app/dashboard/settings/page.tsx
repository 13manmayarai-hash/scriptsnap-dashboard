'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SettingsIcon, Check, Mic2, Tags, CreditCard, ChevronRight } from 'lucide-react'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'

const QUICK_LINKS = [
  { href: '/dashboard/tone-presets', label: 'Tone & Voice presets', description: 'How the generator writes for you', icon: Mic2 },
  { href: '/dashboard/categories', label: 'Categories', description: 'Your custom content categories', icon: Tags },
  { href: '/dashboard/billing', label: 'Usage & Billing', description: 'Current plan and monthly usage', icon: CreditCard },
]

export default function SettingsPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email || '')
      setLoading(false)
    }
    load()
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError
      setSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-ink-muted">Loading settings…</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <SettingsIcon size={24} aria-hidden="true" className="text-sage" />
        <h1 className="text-2xl font-bold heading-serif">Settings</h1>
      </div>
      <p className="text-ink-muted text-sm mb-6">Your account details.</p>

      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-ink-muted mb-3">ACCOUNT</h2>
        <div>
          <p className="text-xs text-ink-muted">Email</p>
          <p className="text-ink font-medium">{email}</p>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-ink-muted mb-3">PERSONALIZATION</h2>
        <div className="divide-y divide-warm-border">
          {QUICK_LINKS.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-[44px] items-center gap-3 py-3 first:pt-0 last:pb-0 group"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-soft-accent text-sage">
                <Icon size={16} aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-ink">{label}</span>
                <span className="block text-xs text-ink-muted">{description}</span>
              </span>
              <ChevronRight size={16} aria-hidden="true" className="text-ink-faint group-hover:text-ink-muted" />
            </Link>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-ink-muted mb-3">CHANGE PASSWORD</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium mb-1">New password</label>
            <input
              id="new-password"
              name="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              disabled={saving}
              required
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">Confirm new password</label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              disabled={saving}
              required
            />
          </div>

          {error && (
            <ErrorMessage>{error}</ErrorMessage>
          )}
          {success && (
            <div className="bg-sage/10 border border-sage/40 rounded-lg p-3 flex items-center gap-2" aria-live="polite">
              <Check size={16} aria-hidden="true" className="text-sage" />
              <p className="text-sm text-ink">Password updated.</p>
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary px-6">
            {saving ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
