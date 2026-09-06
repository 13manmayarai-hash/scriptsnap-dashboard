import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { analyzeVoiceProfile } from '@/lib/voiceprint/analyze'
import { friendlyApiErrorMessage } from '@/lib/utils/apiErrors'
import { checkRateLimit } from '@/lib/utils/rateLimit'
import * as Sentry from '@sentry/nextjs'

// Builds/refreshes a creator's VoicePrint. Not gated by script-generation
// quota -- a voice profile is a slow-changing snapshot of writing style,
// not something that needs rebuilding per-request. Previously rate-limited
// at 5/60s on the reasoning that this was "the same category as
// tone-presets/derive" -- it isn't: that route sends a short user-pasted
// sample (max_tokens 200), this sends up to 12,000 characters of real
// transcript/script corpus (max_tokens 500) with no monthly cap either
// way, so 5/60s allowed an unbounded loop of a meaningfully more
// expensive call. Tightened to a real cooldown instead: profiles don't
// need rebuilding more than a few times an hour even while iterating.
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

  const rateLimitOk = await checkRateLimit(supabase, {
    userId: user.id,
    route: 'voice-profile-analyze',
    maxRequests: 3,
    windowSeconds: 3600,
  })
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: 'Voice profile was just rebuilt — try again in a bit. Writing style rarely changes minute to minute.' },
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
    .select('analysis_summary, script_count_analyzed, last_analyzed_at, source, avg_wpm, avg_sentence_length, vocabulary_richness, top_catchphrases')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ profile: profile || null })
}
