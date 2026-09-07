import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendChatMessage, clearChatHistory } from '@/lib/chat/assistant'
import { TIER_SCRIPT_LIMITS, CHAT_FREE_MESSAGES_PER_MONTH, getEffectiveTier } from '@/lib/tiers'
import { friendlyApiErrorMessage } from '@/lib/utils/apiErrors'
import { checkRateLimit } from '@/lib/utils/rateLimit'
import * as Sentry from '@sentry/nextjs'

const CHAT_HISTORY_LIMIT = 50

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const [{ data: messages, error }, { data: profile }, tier] = await Promise.all([
    supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(CHAT_HISTORY_LIMIT),
    supabase
      .from('users')
      .select('scripts_generated_month, chat_free_messages_used')
      .eq('id', user.id)
      .single(),
    getEffectiveTier(supabase, user.id),
  ])

  if (error) {
    return NextResponse.json({ error: 'Failed to load chat history' }, { status: 500 })
  }

  const usage = {
    freeUsed: profile?.chat_free_messages_used ?? 0,
    freeLimit: CHAT_FREE_MESSAGES_PER_MONTH,
    scriptsUsed: profile?.scripts_generated_month ?? 0,
    scriptLimit: TIER_SCRIPT_LIMITS[tier] ?? TIER_SCRIPT_LIMITS.free,
  }

  return NextResponse.json({ messages: (messages || []).slice().reverse(), usage })
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { error } = await clearChatHistory(supabase, user.id)
  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  // Hoisted so the catch block can refund a reserved quota slot if the
  // Anthropic call fails after the limit check passed.
  let supabase: ReturnType<typeof createClient> | null = null
  let userId: string | null = null
  let quotaReserved = false
  let usedFree = false
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
    const rateLimitOk = await checkRateLimit(supabase, {
      userId: user.id,
      route: 'chat',
      maxRequests: 20,
      windowSeconds: 60,
    })
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many messages — please wait a moment and try again.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const scriptId = typeof body.scriptId === 'string' ? body.scriptId : undefined
    const tonePresetId = typeof body.tonePresetId === 'string' ? body.tonePresetId : undefined
    if (!message) {
      return NextResponse.json({ error: 'Message is empty' }, { status: 400 })
    }

    // Ownership-scoped lookup -- a tonePresetId belonging to another user
    // simply resolves to no tone rather than leaking their preset text.
    let tone: { name: string; styleDescription: string } | undefined
    if (tonePresetId) {
      const { data: preset } = await supabase
        .from('tone_presets')
        .select('name, style_description')
        .eq('id', tonePresetId)
        .eq('user_id', user.id)
        .maybeSingle<{ name: string; style_description: string }>()
      if (preset) {
        tone = { name: preset.name, styleDescription: preset.style_description }
      }
    }

    const tier = await getEffectiveTier(supabase, user.id)
    const limit = TIER_SCRIPT_LIMITS[tier] ?? TIER_SCRIPT_LIMITS.free

    // Same atomic reserve-before-generating pattern used across every other
    // AI action in this app, but the first CHAT_FREE_MESSAGES_PER_MONTH
    // messages each month don't touch the script quota at all.
    const { data: usage, error: usageError } = await supabase
      .rpc('increment_chat_usage', {
        p_user_id: user.id,
        p_limit: limit,
        p_free_limit: CHAT_FREE_MESSAGES_PER_MONTH,
        p_amount: quotaAmount,
      })
      .single() as {
        data: { allowed: boolean; used_free: boolean; new_count: number; free_used: number } | null
        error: unknown
      }

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
    usedFree = usage.used_free

    const { reply, error, messageId } = await sendChatMessage(supabase, user.id, message, { scriptId, tone })
    if (!reply) {
      if (quotaReserved) {
        try { await supabase.rpc('decrement_chat_usage', { p_user_id: user.id, p_used_free: usedFree, p_amount: quotaAmount }) } catch {}
      }
      return NextResponse.json({ error: error || 'Failed to get a response' }, { status: 500 })
    }

    return NextResponse.json({
      reply,
      messageId,
      usage: {
        freeUsed: usage.free_used,
        freeLimit: CHAT_FREE_MESSAGES_PER_MONTH,
        scriptsUsed: usage.new_count,
        scriptLimit: limit,
      },
    })
  } catch (error) {
    if (quotaReserved && supabase && userId) {
      try { await supabase.rpc('decrement_chat_usage', { p_user_id: userId, p_used_free: usedFree, p_amount: quotaAmount }) } catch {}
    }
    console.error('Chat message failed:', error)
    Sentry.captureException(error)
    return NextResponse.json({ error: friendlyApiErrorMessage(error) }, { status: 500 })
  }
}
