'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SettingsIcon, Check, Mic2, Tags, CreditCard, ChevronRight, Youtube, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'

interface YouTubeConnection {
  youtube_channel_title: string | null
  connected_at: string
  needs_reconnect: boolean
}

const YOUTUBE_ERROR_MESSAGES: Record<string, string> = {
  upgrade_required: 'Connecting a YouTube channel is a Pro feature.',
  denied: 'YouTube connection was cancelled.',
  invalid_state: "Couldn't verify that request — please try connecting again.",
  connect_failed: "Couldn't connect your YouTube channel. Please try again.",
}

const QUICK_LINKS = [
  { href: '/dashboard/tone-presets', label: 'Tone & Voice presets', description: 'How the generator writes for you', icon: Mic2 },
  { href: '/dashboard/categories', label: 'Categories', description: 'Your custom content categories', icon: Tags },
  { href: '/dashboard/billing', label: 'Usage & Billing', description: 'Current plan and monthly usage', icon: CreditCard },
]

export default function SettingsPage() {
  const [email, setEmail] = useState('')
  const [tier, setTier] = useState<string>('free')
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [youtubeConnection, setYoutubeConnection] = useState<YouTubeConnection | null>(null)
  const [youtubeLoading, setYoutubeLoading] = useState(true)
  const [youtubeBanner, setYoutubeBanner] = useState('')
  const [youtubeBannerIsError, setYoutubeBannerIsError] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncSummary, setSyncSummary] = useState('')
  const [disconnecting, setDisconnecting] = useState(false)

  const loadYoutubeConnection = async (userId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('youtube_connections')
      .select('youtube_channel_title, connected_at, needs_reconnect')
      .eq('user_id', userId)
      .maybeSingle<YouTubeConnection>()
    setYoutubeConnection(data)
    setYoutubeLoading(false)
  }

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email || '')

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('subscription_tier')
          .eq('id', user.id)
          .single()
        setTier(profile?.subscription_tier || 'free')
        await loadYoutubeConnection(user.id)
      } else {
        setYoutubeLoading(false)
      }
      setLoading(false)
    }
    load()

    const params = new URLSearchParams(window.location.search)
    const connected = params.get('youtube')
    const youtubeError = params.get('youtube_error')
    if (connected === 'connected') {
      setYoutubeBanner('YouTube channel connected.')
      setYoutubeBannerIsError(false)
    } else if (youtubeError) {
      setYoutubeBanner(YOUTUBE_ERROR_MESSAGES[youtubeError] || 'Something went wrong connecting YouTube.')
      setYoutubeBannerIsError(true)
    }
    if (connected || youtubeError) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handleSyncNow = async () => {
    setSyncing(true)
    setSyncSummary('')
    try {
      const res = await fetch('/api/youtube/analytics', { credentials: 'same-origin' })
      const data = await res.json()
      if (data.needsReconnect) {
        setYoutubeConnection((prev) => (prev ? { ...prev, needs_reconnect: true } : prev))
      } else if (data.summary) {
        setSyncSummary(data.summary)
      } else if (data.error) {
        setYoutubeBanner(data.error)
        setYoutubeBannerIsError(true)
      }
    } catch {
      setYoutubeBanner('Sync failed — try again in a moment.')
      setYoutubeBannerIsError(true)
    } finally {
      setSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect your YouTube channel? Future scripts will stop using your channel analytics.')) return
    setDisconnecting(true)
    try {
      await fetch('/api/youtube/disconnect', { method: 'POST', credentials: 'same-origin' })
      setYoutubeConnection(null)
      setSyncSummary('')
    } catch {
      setYoutubeBanner("Couldn't disconnect — try again in a moment.")
      setYoutubeBannerIsError(true)
    } finally {
      setDisconnecting(false)
    }
  }

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

      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-ink-muted mb-3">YOUTUBE ANALYTICS</h2>

        {youtubeBanner && (
          youtubeBannerIsError ? (
            <ErrorMessage className="mb-3">{youtubeBanner}</ErrorMessage>
          ) : (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-sage/40 bg-sage/10 p-3" aria-live="polite">
              <Check size={16} aria-hidden="true" className="text-sage" />
              <p className="text-sm text-ink">{youtubeBanner}</p>
            </div>
          )
        )}

        {youtubeLoading ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : tier !== 'pro' ? (
          <div>
            <p className="mb-3 text-sm text-ink-muted">
              Connect your YouTube channel so scripts are tuned using your own performance data — a Pro feature.
            </p>
            <Link href="/pricing" className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm">
              <Youtube size={16} aria-hidden="true" />
              Upgrade to Pro
            </Link>
          </div>
        ) : !youtubeConnection ? (
          <div>
            <p className="mb-3 text-sm text-ink-muted">
              Connect your YouTube channel so scripts are tuned toward what has actually performed well on your videos.
            </p>
            <a href="/api/youtube/connect" className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">
              <Youtube size={16} aria-hidden="true" />
              Connect YouTube channel
            </a>
          </div>
        ) : youtubeConnection.needs_reconnect ? (
          <div>
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-400/50 bg-amber-50 p-3">
              <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-amber-600" />
              <p className="text-sm text-ink">
                Your YouTube access needs to be reconnected — access may have been revoked from your Google account.
              </p>
            </div>
            <a href="/api/youtube/connect" className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">
              <Youtube size={16} aria-hidden="true" />
              Reconnect YouTube channel
            </a>
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-soft-accent text-sage">
                <Youtube size={16} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">{youtubeConnection.youtube_channel_title || 'Connected channel'}</p>
                <p className="text-xs text-ink-muted">
                  Connected {new Date(youtubeConnection.connected_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs"
              >
                {syncing ? (
                  <Loader2 size={14} aria-hidden="true" className="animate-spin" />
                ) : (
                  <RefreshCw size={14} aria-hidden="true" />
                )}
                Sync now
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="btn-secondary px-3 py-2 text-xs text-error hover:text-error-hover"
              >
                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </div>

            {syncSummary && (
              <div className="mt-3 whitespace-pre-wrap rounded-lg border border-warm-border bg-warm-surface-alt p-3 text-xs text-ink-muted">
                {syncSummary}
              </div>
            )}
          </div>
        )}
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
