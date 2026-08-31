import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { analyzeVoiceProfile } from '@/lib/voiceprint/analyze'
import { friendlyApiErrorMessage } from '@/lib/utils/apiErrors'
import * as Sentry from '@sentry/nextjs'

// Builds/refreshes a creator's VoicePrint. Not gated by script-generation
// quota — this reads existing scripts and makes one small analysis call,
// same category as tone-presets/derive. Rate-limited for the same reason:
// it's a real billable Anthropic call an authenticated user could
// otherwise loop for free.
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

  const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
    p_user_id: user.id,
    p_route: 'voice-profile-analyze',
    p_max_requests: 5,
    p_window_seconds: 60,
  })
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: 'Too many requests — please wait a moment and try again.' },
      { status: 429 }
    )
  }

  try {
    const { profile, error } = await analyzeVoiceProfile(supabase, user.id)
    if (!profile) {
      return NextResponse.json({ error }, { status: 400 })
    }
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Voice profile analysis failed:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: friendlyApiErrorMessage(error) }, { status: 500 })
  }
}

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
    .from('voice_profiles')
    .select('analysis_summary, script_count_analyzed, last_analyzed_at')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ profile: profile || null })
}
