'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/auth/reset-password')}`,
      })

      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-warm-bg">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-3xl font-bold heading-serif mb-2">🎬 ScriptSnap</h1>
          <p className="text-ink-muted mb-8">Reset your password</p>

          {sent ? (
            <div className="space-y-6">
              <div className="rounded-lg bg-soft-accent p-4 text-sm text-ink">
                If an account exists for <span className="font-medium">{email}</span>, we've sent a
                password reset link to that address. Check your inbox (and spam folder).
              </div>
              <Link href="/auth/login" className="block text-center text-sm text-sage hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium mb-2">Email</label>
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="input"
                    required
                  />
                </div>

                {error && <ErrorMessage>{error}</ErrorMessage>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <p className="text-center text-sm text-ink-muted mt-6">
                Remembered your password?{' '}
                <Link href="/auth/login" className="text-sage hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
