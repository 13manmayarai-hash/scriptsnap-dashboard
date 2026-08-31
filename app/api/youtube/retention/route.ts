import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getRetentionAnalysis } from '@/lib/youtube/retention'

// ?videoId= is required — no ownership check beyond what YouTube itself
// enforces (channel==MINE scoping in getRetentionAnalysis returns no rows
// for a videoId that isn't on the connected channel), same trust model as
// the existing /api/youtube/video-details and /performance routes.
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

  const { data: profile } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  if (profile?.subscription_tier !== 'pro') {
    return NextResponse.json({ tierAllowed: false })
  }

  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')
  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId' }, { status: 400 })
  }

  const { data: connection } = await supabase
    .from('youtube_connections')
    .select('youtube_channel_title, needs_reconnect')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!connection) {
    return NextResponse.json({ tierAllowed: true, connected: false })
  }

  if (connection.needs_reconnect) {
    return NextResponse.json({
      tierAllowed: true,
      connected: true,
      needsReconnect: true,
      channelTitle: connection.youtube_channel_title,
    })
  }

  const analysis = await getRetentionAnalysis(supabase, user.id, videoId, {
    forceRefresh: searchParams.get('refresh') === '1',
  })

  if (!analysis) {
    const { data: refreshed } = await supabase
      .from('youtube_connections')
      .select('needs_reconnect')
      .eq('user_id', user.id)
      .maybeSingle()
    return NextResponse.json({
      tierAllowed: true,
      connected: true,
      needsReconnect: refreshed?.needs_reconnect ?? false,
      error: refreshed?.needs_reconnect
        ? undefined
        : 'No retention data available for this video — it may not be on your connected channel yet, or may be too new/low-traffic for YouTube to have attributed data.',
    })
  }

  return NextResponse.json({
    tierAllowed: true,
    connected: true,
    needsReconnect: false,
    ...analysis,
  })
}
