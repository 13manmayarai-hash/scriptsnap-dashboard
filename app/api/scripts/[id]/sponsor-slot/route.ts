import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findSponsorSlot } from '@/lib/scripts/sponsorSlot'
import { TIER_SCRIPT_LIMITS, type SubscriptionTier } from '@/lib/tiers'
import { friendlyApiErrorMessage } from '@/lib/utils/apiErrors'
import * as Sentry from '@sentry/nextjs'

// Not persisted (see lib/scripts/sponsorSlot.ts) — POST only, no GET.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // Hoisted so the catch block can refund a reserved quota slot if
  // generation fails after the limit check passed.
  let supabase: ReturnType<typeof createClient> | null = null
  let userId: string | null = null
  let quotaReserved = false
  const quotaAmount = 0.5

  try {
    supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    userId = user.id

    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_route: 'script-sponsor-slot',
      p_max_requests: 10,
      p_window_seconds: 60,
    })
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many requests — please wait a moment and try again.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const sponsorBrief = typeof body.sponsorBrief === 'string' ? body.sponsorBrief.trim() : ''
    if (!sponsorBrief) {
      return NextResponse.json({ error: 'Describe the sponsor first.' }, { status: 400 })
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

    const { data: profile } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
    const tier = (profile?.subscription_tier as SubscriptionTier) || 'free'
    const limit = TIER_SCRIPT_LIMITS[tier] ?? TIER_SCRIPT_LIMITS.free

    const { data: usage, error: usageError } = await supabase
      .rpc('increment_script_usage', { p_user_id: user.id, p_limit: limit, p_amount: quotaAmount })
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

    const { suggestion, error } = await findSponsorSlot(supabase, user.id, params.id, sponsorBrief)
    if (!suggestion) {
      if (quotaReserved) {
        try { await supabase.rpc('decrement_script_usage', { p_user_id: user.id, p_amount: quotaAmount }) } catch {}
      }
      return NextResponse.json({ error: error || 'Failed to find a sponsor slot' }, { status: 500 })
    }

    return NextResponse.json({ suggestion })
  } catch (error) {
    if (quotaReserved && supabase && userId) {
      try { await supabase.rpc('decrement_script_usage', { p_user_id: userId, p_amount: quotaAmount }) } catch {}
    }
    console.error('Sponsor slot lookup failed:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: friendlyApiErrorMessage(error) }, { status: 500 })
  }
}
