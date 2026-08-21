import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getTrendingContext } from '@/lib/youtube/trending'

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

  // Re-checked on every request, not just at connect time — a user can
  // downgrade after connecting while Pro, and their youtube_connections
  // row survives the downgrade.
  const { data: profile } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  if (profile?.subscription_tier !== 'pro') {
    return NextResponse.json({ tierAllowed: false })
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

  const { searchParams } = new URL(request.url)
  const context = await getTrendingContext(supabase, user.id, { forceRefresh: searchParams.get('refresh') === '1' })

  if (!context) {
    // A transient failure (network/5xx) leaves needs_reconnect untouched;
    // only a real revocation sets it — re-check the DB rather than assume.
    const { data: refreshed } = await supabase
      .from('youtube_connections')
      .select('needs_reconnect')
      .eq('user_id', user.id)
      .maybeSingle()
    return NextResponse.json({
      tierAllowed: true,
      connected: true,
      needsReconnect: refreshed?.needs_reconnect ?? false,
      channelTitle: connection.youtube_channel_title,
      error: refreshed?.needs_reconnect ? undefined : 'Could not load suggestions — try again in a moment.',
    })
  }

  return NextResponse.json({
    tierAllowed: true,
    connected: true,
    needsReconnect: false,
    channelTitle: connection.youtube_channel_title,
    ...context,
  })
}
