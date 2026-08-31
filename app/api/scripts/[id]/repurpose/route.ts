import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { repurposeScript, type RepurposePlatform } from '@/lib/scripts/repurpose'
import { TIER_SCRIPT_LIMITS, type SubscriptionTier } from '@/lib/tiers'
import { friendlyApiErrorMessage } from '@/lib/utils/apiErrors'
import * as Sentry from '@sentry/nextjs'

const VALID_PLATFORMS: RepurposePlatform[] = ['youtube_shorts', 'tiktok', 'instagram_reels']

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: script } = await supabase
    .from('scripts')
    .select('repurposed_variants')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!script) {
    return NextResponse.json({ error: 'Script not found' }, { status: 404 })
  }

  return NextResponse.json({ variants: script.repurposed_variants || null })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // Hoisted so the catch block can refund a reserved quota slot if
  // generation fails after the limit check passed.
  let supabase: ReturnType<typeof createClient> | null = null
  let userId: string | null = null
  let quotaReserved = false

  try {
    supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    userId = user.id

    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_route: 'script-repurpose',
      p_max_requests: 10,
      p_window_seconds: 60,
    })
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many requests — please wait a moment and try again.' },
        { status: 429 }
      )
    }

    const { data: existingScript } = await supabase
      .from('scripts')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existingScript) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const requestedPlatforms = Array.isArray(body.platforms)
      ? body.platforms.filter((p: unknown): p is RepurposePlatform => VALID_PLATFORMS.includes(p as RepurposePlatform))
      : []

    const { data: profile } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
    const tier = (profile?.subscription_tier as SubscriptionTier) || 'free'
    const limit = TIER_SCRIPT_LIMITS[tier] ?? TIER_SCRIPT_LIMITS.free

    // Same atomic reserve-before-generating pattern as generate-script and
    // the structured-script route — a real billable Anthropic call, so it
    // draws from the same monthly quota rather than being free/unlimited.
    const { data: usage, error: usageError } = await supabase
      .rpc('increment_script_usage', { p_user_id: user.id, p_limit: limit })
      .single() as { data: { allowed: boolean; new_count: number } | null; error: unknown }

    if (usageError || !usage) {
      return NextResponse.json({ error: 'Failed to check usage limit' }, { status: 500 })
    }
    if (!usage.allowed) {
      return NextResponse.json(
        { error: `You've used all ${limit} scripts included in your ${tier} plan this month. Upgrade to generate more.` },
        { status: 403 }
      )
    }
    quotaReserved = true

    const { variants, error } = await repurposeScript(supabase, user.id, params.id, requestedPlatforms)
    if (!variants) {
      if (quotaReserved) {
        try { await supabase.rpc('decrement_script_usage', { p_user_id: user.id }) } catch {}
      }
      return NextResponse.json({ error: error || 'Failed to generate repurposed variants' }, { status: 500 })
    }

    return NextResponse.json({ variants })
  } catch (error) {
    if (quotaReserved && supabase && userId) {
      try { await supabase.rpc('decrement_script_usage', { p_user_id: userId }) } catch {}
    }
    console.error('Script repurposing failed:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: friendlyApiErrorMessage(error) }, { status: 500 })
  }
}
