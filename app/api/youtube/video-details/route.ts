import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getVideoDetails } from '@/lib/youtube/video-details'
import { getEffectiveTier } from '@/lib/tiers'

export async function GET(request: NextRequest) {
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
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const tier = await getEffectiveTier(supabase, user.id)
  if (tier !== 'pro') {
    return NextResponse.json({ error: 'Pro tier required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')
  const source = searchParams.get('source')

  if (!videoId || (source !== 'own' && source !== 'trending')) {
    return NextResponse.json({ error: 'Missing or invalid videoId/source' }, { status: 400 })
  }

  const { data: connection } = await supabase
    .from('youtube_connections')
    .select('needs_reconnect')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!connection) {
    return NextResponse.json({ connected: false })
  }
  if (connection.needs_reconnect) {
    return NextResponse.json({ connected: true, needsReconnect: true })
  }

  // getVideoDetails calls Claude for the AI hypothesis note and has no
  // cache at all (deliberately -- it's an explicit-click, per-video
  // fetch, not a page-load cost) -- but with no cache there was also no
  // rate limit, so nothing stopped rapid repeated clicks (or a scripted
  // session) from generating unbounded billable calls.
  const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
    p_user_id: user.id,
    p_route: 'youtube-video-details',
    p_max_requests: 10,
    p_window_seconds: 60,
  })
  if (!rateLimitOk) {
    return NextResponse.json({ connected: true, error: 'Too many requests — please wait a moment and try again.' })
  }

  const details = await getVideoDetails(supabase, user.id, { videoId, source })

  if (!details) {
    const { data: refreshed } = await supabase
      .from('youtube_connections')
      .select('needs_reconnect')
      .eq('user_id', user.id)
      .maybeSingle()
    return NextResponse.json({
      connected: true,
      needsReconnect: refreshed?.needs_reconnect ?? false,
      error: refreshed?.needs_reconnect ? undefined : 'Could not load this video\'s breakdown — try again in a moment.',
    })
  }

  return NextResponse.json({ connected: true, needsReconnect: false, ...details })
}
