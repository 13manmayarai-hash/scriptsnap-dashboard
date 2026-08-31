import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { getYouTubeOAuthClient, YOUTUBE_SCOPES } from '@/lib/youtube/oauth'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: any[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(
      new URL(`/auth/login?next=${encodeURIComponent('/api/youtube/connect')}`, requestUrl.origin)
    )
  }

  const { data: profile } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  if (profile?.subscription_tier !== 'pro') {
    return NextResponse.redirect(new URL('/dashboard/settings?youtube_error=upgrade_required', requestUrl.origin))
  }

  const state = randomUUID()
  const oauth2Client = getYouTubeOAuthClient(requestUrl.origin)
  const consentUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // required to receive a refresh_token
    prompt: 'consent', // required so a reconnect after revocation still yields one
    scope: YOUTUBE_SCOPES,
    state,
  })

  const response = NextResponse.redirect(consentUrl)
  response.cookies.set('yt_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/api/youtube',
  })
  return response
}
