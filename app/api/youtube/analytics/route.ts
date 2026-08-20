import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCreatorAnalyticsContext } from '@/lib/youtube/analytics'

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

  const { data: connection } = await supabase
    .from('youtube_connections')
    .select('youtube_channel_title, needs_reconnect')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!connection) {
    return NextResponse.json({ connected: false })
  }

  if (connection.needs_reconnect) {
    return NextResponse.json({ connected: true, needsReconnect: true, channelTitle: connection.youtube_channel_title })
  }

  // Explicit "Sync now" — bypass the cache so the founder can see the
  // freshest data feeding the prompt.
  const context = await getCreatorAnalyticsContext(supabase, user.id, { forceRefresh: true })

  if (!context) {
    // A transient failure (network/5xx) leaves needs_reconnect untouched;
    // only a real revocation sets it — re-check the DB rather than assume.
    const { data: refreshed } = await supabase
      .from('youtube_connections')
      .select('needs_reconnect')
      .eq('user_id', user.id)
      .maybeSingle()
    return NextResponse.json({
      connected: true,
      needsReconnect: refreshed?.needs_reconnect ?? false,
      channelTitle: connection.youtube_channel_title,
      error: refreshed?.needs_reconnect ? undefined : 'Sync failed — try again in a moment.',
    })
  }

  return NextResponse.json({
    connected: true,
    needsReconnect: false,
    channelTitle: context.channelTitle,
    summary: context.summary,
    cachedAt: new Date().toISOString(),
  })
}
