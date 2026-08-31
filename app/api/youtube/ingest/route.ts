import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ingestChannelTranscripts } from '@/lib/youtube/transcripts'
import * as Sentry from '@sentry/nextjs'

// Pulls the connected channel's latest videos' real captions into
// video_transcripts. Pro-gated (same tier as every other YouTube feature)
// and rate-limited since this makes several real YouTube API calls per
// invocation (captions.list + captions.download per video).
export async function POST(request: NextRequest) {
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

  const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
    p_user_id: user.id,
    p_route: 'youtube-ingest',
    p_max_requests: 3,
    p_window_seconds: 300,
  })
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: 'Too many requests — please wait a few minutes and try again.' },
      { status: 429 }
    )
  }

  try {
    const result = await ingestChannelTranscripts(supabase, user.id)
    return NextResponse.json({ tierAllowed: true, ...result })
  } catch (error) {
    console.error('YouTube ingest route failed:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: 'Could not ingest transcripts — try again in a moment.' }, { status: 500 })
  }
}
