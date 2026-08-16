import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const providerError = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error')
  const next = getSafeRedirect(requestUrl.searchParams.get('next'))

  // The provider (or Supabase) can redirect back with an error instead of a
  // code — e.g. denied consent, a misconfigured provider. Without this
  // check, falling through with no `code` silently redirects to `next` with
  // no session at all, which looks like success until a later page bounces
  // the user back to login with no explanation.
  if (providerError) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(providerError)}`, requestUrl.origin)
    )
  }

  // Neither a code nor an error means something stripped the query string
  // before it reached us (a proxy, a redirect-URI mismatch) — without this
  // check we'd fall through to redirecting to `next` with no session ever
  // set, which looks like a successful login until the next authenticated
  // action 401s.
  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=missing_code', requestUrl.origin))
  }

  // Build the redirect response up front and write the session cookies
  // directly onto it, rather than mutating the ambient `cookies()` store
  // from `next/headers` and hoping it gets merged into a later-constructed
  // NextResponse.redirect(). This is the response that's actually sent to
  // the browser, so this is the only way to guarantee the Set-Cookie
  // headers land on it.
  const response = NextResponse.redirect(new URL(next, requestUrl.origin))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    await supabase.auth.exchangeCodeForSession(code)
  } catch (error) {
    console.error('Error exchanging code for session:', error)
    return NextResponse.redirect(new URL('/auth/login?error=invalid_code', requestUrl.origin))
  }

  // Redirect to the originally-intended destination after successful auth,
  // carrying the session cookies set above.
  return response
}
