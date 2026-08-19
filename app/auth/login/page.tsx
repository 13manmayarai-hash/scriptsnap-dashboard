'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'
import PasswordInput from '@/lib/components/ui/PasswordInput'

// Only allow same-app relative paths (must start with a single `/`) so this
// can't be abused as an open redirect. Blocks both `//host` (protocol-
// relative) and a leading backslash (`/\host`) — browsers' URL parsers
// treat a leading backslash as equivalent to `/`, so `/\evil.com` would
// otherwise resolve to a cross-origin URL once passed through `new URL()`.
function getSafeRedirect(target: string | null): string {
  if (target && target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/\\')) {
    return target
  }
  return '/dashboard'
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = getSafeRedirect(searchParams.get('redirectTo'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Surfaces failures from the OAuth round trip (e.g. a provider error or a
  // failed code exchange redirected back here via ?error=...) that would
  // otherwise be invisible — the server-side code that detects them has no
  // other way to reach the user.
  const [error, setError] = useState(() => searchParams.get('error') || '')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      router.push(redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-warm-bg">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-3xl font-bold heading-serif mb-2">🎬 ScriptSnap</h1>
          <p className="text-ink-muted mb-8">AI YouTube Shorts Script Generator</p>

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-ink border border-warm-border font-semibold py-3 px-6 rounded-lg hover:bg-warm-surface-alt transition-colors mb-6 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-warm-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-warm-surface text-ink-muted">Or with email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium mb-2">Email</label>
              <input
                id="login-email"
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

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="login-password" className="block text-sm font-medium">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-sage hover:underline">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="login-password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {error && (
              <ErrorMessage>{error}</ErrorMessage>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-muted mt-6">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-sage hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
