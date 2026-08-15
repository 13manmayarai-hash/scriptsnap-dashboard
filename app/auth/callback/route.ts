import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// Only allow same-app relative paths (must start with a single `/`) so this
// can't be abused as an open redirect via a protocol-relative `//host` URL.
function getSafeRedirect(target: string | null): string {
  if (target && target.startsWith('/') && !target.startsWith('//')) {
    return target
  }
  return '/dashboard'
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = getSafeRedirect(requestUrl.searchParams.get('next'))

  // Build the redirect response up front and write the session cookies
  // directly onto it, rather than mutating the ambient `cookies()` store
  // from `next/headers` and hoping it gets merged into a later-constructed
  // NextResponse.redirect(). This is the response that's actually sent to
  // the browser, so this is the only way to guarantee the Set-Cookie
  // headers land on it.
  const response = NextResponse.redirect(new URL(next, requestUrl.origin))

  if (code) {
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
  }

  // Redirect to the originally-intended destination after successful auth,
  // carrying the session cookies set above.
  return response
}
