import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendChatMessage } from '@/lib/chat/assistant'
import { TIER_SCRIPT_LIMITS, type SubscriptionTier } from '@/lib/tiers'
import { friendlyApiErrorMessage } from '@/lib/utils/apiErrors'
import * as Sentry from '@sentry/nextjs'

const CHAT_HISTORY_LIMIT = 50

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(CHAT_HISTORY_LIMIT)

  if (error) {
    return NextResponse.json({ error: 'Failed to load chat history' }, { status: 500 })
  }

  return NextResponse.json({ messages: (messages || []).slice().reverse() })
}

export async function POST(request: NextRequest) {
  // Hoisted so the catch block can refund a reserved quota slot if the
  // Anthropic call fails after the limit check passed.
  let supabase: ReturnType<typeof createClient> | null = null
  let userId: string | null = null
  let quotaReserved = false
  const quotaAmount = 0.25

  try {
    supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    userId = user.id

    // Chat is meant to feel snappy (back-and-forth turns), so a more
    // generous window than the heavier one-shot generation routes.
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_route: 'chat',
      p_max_requests: 20,
      p_window_seconds: 60,
    })
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many messages — please wait a moment and try again.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (!message) {
      return NextResponse.json({ error: 'Message is empty' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
    const tier = (profile?.subscription_tier as SubscriptionTier) || 'free'
    const limit = TIER_SCRIPT_LIMITS[tier] ?? TIER_SCRIPT_LIMITS.free

    // Same atomic reserve-before-generating pattern used across every other
    // AI action in this app — chat draws from the same monthly script
    // quota, at a fraction of a full generation's cost.
    const { data: usage, error: usageError } = await supabase
      .rpc('increment_script_usage', { p_user_id: user.id, p_limit: limit, p_amount: quotaAmount })
      .single() as { data: { allowed: boolean; new_count: number } | null; error: unknown }

    if (usageError || !usage) {
      return NextResponse.json({ error: 'Failed to check usage limit' }, { status: 500 })
    }
    if (!usage.allowed) {
      return NextResponse.json(
        { error: `You've used all ${limit} scripts included in your ${tier} plan this month. Upgrade to keep chatting.` },
        { status: 403 }
      )
    }
    quotaReserved = true

    const { reply, error } = await sendChatMessage(supabase, user.id, message)
    if (!reply) {
      if (quotaReserved) {
        try { await supabase.rpc('decrement_script_usage', { p_user_id: user.id, p_amount: quotaAmount }) } catch {}
      }
      return NextResponse.json({ error: error || 'Failed to get a response' }, { status: 500 })
    }

    return NextResponse.json({ reply })
  } catch (error) {
    if (quotaReserved && supabase && userId) {
      try { await supabase.rpc('decrement_script_usage', { p_user_id: userId, p_amount: quotaAmount }) } catch {}
    }
    console.error('Chat message failed:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: friendlyApiErrorMessage(error) }, { status: 500 })
  }
}
