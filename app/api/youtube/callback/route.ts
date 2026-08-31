import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { google } from 'googleapis'
import { getYouTubeOAuthClient } from '@/lib/youtube/oauth'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const providerError = requestUrl.searchParams.get('error')
  const state = requestUrl.searchParams.get('state')
  const stateCookie = request.cookies.get('yt_oauth_state')?.value

  const redirectTo = (path: string) => {
    const response = NextResponse.redirect(new URL(path, requestUrl.origin))
    // Single-use regardless of outcome — never replayable.
    response.cookies.delete({ name: 'yt_oauth_state', path: '/api/youtube' })
    return response
  }

  if (providerError) {
    // User clicked "Cancel" on Google's consent screen, or Google denied it.
    return redirectTo('/dashboard/settings?youtube_error=denied')
  }

  // CSRF check — state is only ever an anti-replay nonce here, never used
  // to identify the user. The existing Supabase session cookie on this
  // same-origin request does that, below.
  if (!code || !state || !stateCookie || state !== stateCookie) {
    return redirectTo('/dashboard/settings?youtube_error=invalid_state')
  }

  const response = redirectTo('/dashboard/settings?youtube=connected')

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: Array<{ name: string; value: string; options?: any }>) => {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirectTo(`/auth/login?next=${encodeURIComponent('/dashboard/settings')}`)
  }

  try {
    const oauth2Client = getYouTubeOAuthClient(requestUrl.origin)
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })
    const channelRes = await youtube.channels.list({ part: ['snippet'], mine: true })
    const channel = channelRes.data.items?.[0]
    if (!channel?.id) throw new Error('No YouTube channel found for this Google account')

    const row: Record<string, unknown> = {
      user_id: user.id,
      youtube_channel_id: channel.id,
      youtube_channel_title: channel.snippet?.title || null,
      connected_at: new Date().toISOString(),
      needs_reconnect: false,
      cached_analytics_summary: null, // force a fresh sync on next use
      analytics_cached_at: null,
    }
    // Google only returns a refresh_token on a user's very first consent
    // for this client; a reconnect exchange can come back without one. Omit
    // the key entirely in that case so an upsert never nulls out a
    // previously-stored, still-valid token.
    if (tokens.refresh_token) {
      row.google_refresh_token = tokens.refresh_token
    } else {
      const { data: existing } = await supabase
        .from('youtube_connections')
        .select('google_refresh_token')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!existing?.google_refresh_token) {
        throw new Error('Google did not return a refresh token and none is stored — reconnect and grant access again')
      }
    }

    const { error: upsertError } = await supabase
      .from('youtube_connections')
      .upsert(row, { onConflict: 'user_id' })
    if (upsertError) throw upsertError

    return response
  } catch (err) {
    console.error('YouTube connect callback failed:', err)
    Sentry.captureException(err)
    return redirectTo('/dashboard/settings?youtube_error=connect_failed')
  }
}
