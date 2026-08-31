'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'
import PasswordInput from '@/lib/components/ui/PasswordInput'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw error
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-warm-bg">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-3xl font-bold heading-serif mb-2">🎬 ScriptSnap</h1>
          <p className="text-ink-muted mb-8">Choose a new password</p>

          {done ? (
            <div className="rounded-lg bg-soft-accent p-4 text-sm text-ink">
              Password updated. Redirecting you to your dashboard…
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reset-password" className="block text-sm font-medium mb-2">New password</label>
                  <PasswordInput
                    id="reset-password"
                    name="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                  <p className="mt-1.5 text-xs text-ink-muted">At least 6 characters</p>
                </div>

                <div>
                  <label htmlFor="reset-password-confirm" className="block text-sm font-medium mb-2">Confirm new password</label>
                  <PasswordInput
                    id="reset-password-confirm"
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>

                {error && <ErrorMessage>{error}</ErrorMessage>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3"
                >
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>

              <p className="text-center text-sm text-ink-muted mt-6">
                <Link href="/auth/login" className="text-sage hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
