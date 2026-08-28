import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import { TIER_SCRIPT_LIMITS, type SubscriptionTier } from '@/lib/tiers'
import { getCreatorAnalyticsContext } from '@/lib/youtube/analytics'
import { getRatingFeedback, formatRatingFeedback } from '@/lib/scripts/ratingFeedback'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const LANGUAGE_NAMES: Record<string, string> = {
  english: 'English',
  hindi: 'Hindi',
  tamil: 'Tamil',
  telugu: 'Telugu',
  hinglish: 'Hinglish (a natural mix of Hindi and English, written in Latin script, the way Indian creators actually speak it)',
}

interface GuidelineCheck {
  passed: boolean
  flags: Array<{ severity: 'info' | 'warning'; note: string }>
}

async function checkGuidelines(script: string): Promise<GuidelineCheck> {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 300,
      thinking: { type: 'disabled' },
      output_config: { effort: 'low' },
      messages: [
        {
          role: 'user',
          content: `Review this YouTube Shorts script for YouTube Community Guidelines and advertiser-friendly content risk (copyright mentions, restricted claims, demonetization-risk language). Respond with ONLY a JSON object, no other text: {"passed": boolean, "flags": [{"severity": "info"|"warning", "note": "short reason"}]}. Empty flags array if nothing to flag.

SCRIPT:
${script}`,
        },
      ],
    })

    const textBlock = message.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    )
    if (!textBlock) return { passed: true, flags: [] }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { passed: true, flags: [] }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      passed: typeof parsed.passed === 'boolean' ? parsed.passed : true,
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
    }
  } catch (err) {
    // The guideline check is a value-add, not a gate — a failure here
    // should never block a script the creator already paid quota for.
    console.error('Guideline check failed:', err)
    return { passed: true, flags: [] }
  }
}

export async function POST(request: NextRequest) {
  // Hoisted so the catch block can refund a reserved quota slot if
  // generation fails after the limit check passed
  let supabase: ReturnType<typeof createServerClient> | null = null
  let userId: string | null = null
  let quotaReserved = false

  try {
    // Get authenticated user
    const cookieStore = cookies()
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet: any[]) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    userId = authUser.id

    // Burst-abuse guard, independent of the monthly quota below — caps how
    // fast a single user can trigger billable Anthropic calls, regardless
    // of how much of their monthly allowance remains.
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      p_user_id: authUser.id,
      p_route: 'generate-script',
      p_max_requests: 5,
      p_window_seconds: 60,
    })
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many requests — please wait a moment before generating another script.' },
        { status: 429 }
      )
    }

    // Optional, never blocking — a YouTube API hiccup should never cost
    // the user a script they already reserved quota for. Reads a 24h
    // cache under the hood, so this is a cheap no-op for anyone who
    // hasn't connected a channel.
    let analyticsContext: { summary: string; channelTitle: string } | null = null
    try {
      analyticsContext = await getCreatorAnalyticsContext(supabase, authUser.id)
    } catch (err) {
      console.error('YouTube analytics context failed:', err)
    }

    // Same never-blocking treatment for the creator's own thumbs up/down
    // history on past scripts — a plain DB read, cheap even on failure.
    let ratingFeedback: string | null = null
    try {
      const feedback = await getRatingFeedback(supabase, authUser.id)
      if (feedback) ratingFeedback = formatRatingFeedback(feedback)
    } catch (err) {
      console.error('Rating feedback context failed:', err)
    }

    const { data: profile } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', authUser.id)
      .single()

    const tier = (profile?.subscription_tier as SubscriptionTier) || 'free'
    const limit = TIER_SCRIPT_LIMITS[tier] ?? TIER_SCRIPT_LIMITS.free

    // Atomically check-and-reserve quota before spending any Anthropic API
    // cost. This runs inside a single locked transaction on the DB side
    // (see increment_script_usage migration) so concurrent requests from
    // the same user can't both read the same pre-increment count and both
    // slip past the limit.
    const { data: usage, error: usageError } = await supabase
      .rpc('increment_script_usage', { p_user_id: authUser.id, p_limit: limit })
      .single()

    if (usageError || !usage) {
      throw new Error('Failed to check usage limit')
    }

    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: `You've used all ${limit} scripts included in your ${tier} plan this month. Upgrade to generate more.`,
        },
        { status: 403 }
      )
    }
    quotaReserved = true

    const body = await request.json()
    const { topic, duration, category, tone, toneStyleDescription, context, keywords, language } = body

    const durationSeconds = parseInt(duration) || 60
    const languageKey = typeof language === 'string' && LANGUAGE_NAMES[language] ? language : 'english'
    const languageName = LANGUAGE_NAMES[languageKey]

    // Build keywords list separately to avoid nested template literal issues
    const keywordsList = keywords && keywords.length > 0
      ? `KEY POINTS TO INCLUDE:\n${keywords.map((kw: string) => `- ${kw}`).join('\n')}\n`
      : ''

    // Build the prompt for Claude with personalization
    const prompt = `You are an expert YouTube Shorts script writer. Generate a compelling, engaging script for a ${durationSeconds}-second video.

TOPIC: ${topic}
CATEGORY: ${category}
TONE: ${tone}
DURATION: ${durationSeconds} seconds
${languageKey !== 'english' ? `\nOUTPUT LANGUAGE: Write the script in ${languageName}, not English.\n` : ''}
${context ? `VIDEO CONTEXT:\n${context}\n` : ''}
${keywordsList}
${analyticsContext ? `CREATOR PERFORMANCE CONTEXT (use this to inform hook style, pacing, and topic angle — this is the creator's own channel data):\n${analyticsContext.summary}\n` : ''}
${ratingFeedback ? `${ratingFeedback}\n` : ''}

TONE GUIDELINES:
${toneStyleDescription ? `- ${tone}: ${toneStyleDescription}` : `- If Meditative: Use calming language, ask reflective questions, create mindfulness
- If Balanced: Be informative and engaging without being extreme
- If Energetic: Use exclamation marks, build excitement, create urgency`}

REQUIREMENTS:
1. Script should be approximately ${Math.floor(durationSeconds * 2.5)} words (about 2-2.5 words per second) — keep to this word count closely, since the script needs to actually fit in ${durationSeconds} seconds when read aloud
2. Start with an attention-grabbing hook
3. Include multiple clear sections with timestamps
4. Make it sound natural when read aloud
5. Incorporate all the context and keywords provided
6. End with a strong call-to-action
${analyticsContext ? `7. Immediately after the script, on its own line prefixed exactly "STRATEGY:", write 1-2 short plain-text sentences (no markdown) explaining how this creator's channel performance data specifically shaped the script above.\n` : ''}8. After the script${analyticsContext ? ' and the STRATEGY line' : ''}, add ONE final line prefixed exactly "METADATA:" followed by ONLY a single-line, valid JSON object (no markdown, no code fences, no trailing commentary) with this exact shape:
{"title": "short punchy YouTube Shorts title under 60 characters — never a restatement of the full topic text", "description": "a 2-3 sentence YouTube description under 300 characters", "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4"], "alternativeTitles": [{"style": "Curious", "title": "..."}, {"style": "Energetic", "title": "..."}, {"style": "Educational", "title": "..."}, {"style": "Mysterious", "title": "..."}, {"style": "Question", "title": "..."}], "keyPoints": ["short key point 1", "short key point 2", "short key point 3"], "pinnedComment": "a short engaging pinned comment, optionally with one emoji"}

Generate the script now:`

    // Call Anthropic API
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      thinking: { type: 'disabled' },
      output_config: { effort: 'low' },
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const textBlock = message.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    )
    if (!textBlock) {
      throw new Error('No text content in Claude response')
    }
    let scriptContent = textBlock.text
    let analyticsStrategyNote: string | null = null

    // Pull the trailing "METADATA: {...}" block (title/description/
    // hashtags/etc, written by Claude alongside the script) back out so
    // the saved/returned script text stays clean. Falls back to the
    // template-based generation below on any parse failure — a malformed
    // JSON block should never block a script the creator already paid
    // quota for.
    interface AiMetadata {
      title?: string
      description?: string
      hashtags?: string[]
      alternativeTitles?: { style: string; title: string }[]
      keyPoints?: string[]
      pinnedComment?: string
    }
    let aiMetadata: AiMetadata | null = null
    const metadataMatch = scriptContent.match(/\n?METADATA:\s*(\{[\s\S]*\})\s*$/i)
    if (metadataMatch) {
      try {
        aiMetadata = JSON.parse(metadataMatch[1])
      } catch (err) {
        console.error('Metadata parse failed:', err)
      }
      scriptContent = scriptContent.slice(0, metadataMatch.index).trim()
    }

    if (analyticsContext) {
      // Pull the trailing "STRATEGY: ..." line (if present — Claude
      // instructed to add one only when analytics context was injected)
      // back out so the saved/returned script text stays clean.
      const strategyMatch = scriptContent.match(/\n?STRATEGY:\s*(.+)\s*$/i)
      if (strategyMatch) {
        analyticsStrategyNote = strategyMatch[1].trim()
        scriptContent = scriptContent.slice(0, strategyMatch.index).trim()
      }
    }

    const guidelineCheck = await checkGuidelines(scriptContent)

    // A short, safe stand-in for the topic wherever a template needs to
    // interpolate it — users often type a full descriptive sentence (or
    // several) as their "topic" rather than a two-word subject, and that
    // used to flow straight into "Discover ${topic}"-style templates,
    // producing titles/descriptions hundreds of characters long. Only
    // used as a fallback now (see aiMetadata below), but kept safe too.
    const shortTopic = topic.length > 60 ? `${topic.slice(0, 57).trim()}…` : topic

    // Claude writes real title/description/hashtags/etc alongside the
    // script now (see the METADATA: requirement in the prompt above) —
    // these template versions are only a fallback for when that JSON
    // block is missing or fails to parse, so generation never breaks.
    let description = `📍 Watch this ${durationSeconds}-second deep dive into ${shortTopic}\n`
    if (context) {
      description += `📝 Focus: ${context.split('\n')[0]}\n`
    }
    if (keywords && keywords.length > 0) {
      description += `🔑 Keywords: ${keywords.slice(0, 3).join(', ')}\n`
    }
    description += `🎯 Category: ${category}\n🎭 Tone: ${tone}\n✨ Perfect for YouTube Shorts\n\n`
    description += `Learn the fascinating details about ${shortTopic}.`

    const hashtagMap: Record<string, string[]> = {
      'Cultural & Historical': ['#Culture', '#History', '#Educational', '#Learning'],
      'Art & Design': ['#Art', '#Design', '#Creative', '#Inspiration'],
      'Science & Nature': ['#Science', '#Nature', '#Discovery', '#Knowledge'],
      'Fashion & Style': ['#Fashion', '#Style', '#Trending', '#Lifestyle'],
      'Food & Craft': ['#Food', '#Recipe', '#DIY', '#Cooking'],
      'Tech & Engineering': ['#Tech', '#Innovation', '#Engineering', '#Future'],
    }

    const alternativeTitles = [
      { style: 'Curious', title: `The Surprising Truth About ${shortTopic}` },
      { style: 'Energetic', title: `${shortTopic}?! THIS IS INSANE!` },
      { style: 'Educational', title: `Complete Guide to ${shortTopic}` },
      { style: 'Mysterious', title: `What You DON'T Know About ${shortTopic}` },
      { style: 'Mindful', title: `Understanding ${shortTopic}` },
    ]

    const keyPoints = [
      `${shortTopic} is more fascinating than most people realize`,
      context ? `Key focus: ${context.split('\n')[0]}` : `Understanding brings new perspective`,
      keywords && keywords.length > 0 ? `Core elements: ${keywords.slice(0, 2).join(', ')}` : `Multiple applications exist`,
    ]

    const pinnedComments = [
      `Which fact surprised you most? 👇`,
      `Share your thoughts below! 💬`,
      `What should we explore next? 🔔`,
      `LIKE and SUBSCRIBE for more! ✨`,
      `Tag someone who needs this! 👇`,
    ]

    const wordCount = scriptContent.split(' ').length

    // Prefer Claude's own metadata, field by field — a partial/malformed
    // block (e.g. hashtags missing but title present) still gets to use
    // whatever parsed correctly rather than discarding all of it.
    const title = (aiMetadata?.title?.trim() || `Discover ${shortTopic}`).slice(0, 100)
    const finalDescription = aiMetadata?.description?.trim() || description
    const hashtags = Array.isArray(aiMetadata?.hashtags) && aiMetadata.hashtags.length > 0
      ? aiMetadata.hashtags.filter((h) => typeof h === 'string')
      : hashtagMap[category] || ['#Shorts', '#YouTube', '#Learning']
    const finalAlternativeTitles = Array.isArray(aiMetadata?.alternativeTitles) && aiMetadata.alternativeTitles.length > 0
      ? aiMetadata.alternativeTitles.filter((t) => t && typeof t.title === 'string' && typeof t.style === 'string')
      : alternativeTitles
    const finalKeyPoints = Array.isArray(aiMetadata?.keyPoints) && aiMetadata.keyPoints.length > 0
      ? aiMetadata.keyPoints.filter((p) => typeof p === 'string')
      : keyPoints
    const pinnedComment = aiMetadata?.pinnedComment?.trim()
      || pinnedComments[Math.floor(Math.random() * pinnedComments.length)]

    // Persist the generation — previously this only ever lived in the
    // browser's localStorage, so it vanished on a new device and couldn't
    // back Recent Scripts, Categories, or search. A failure here shouldn't
    // lose the script the creator already paid quota for, so it's a
    // best-effort insert rather than a hard failure.
    let savedId: string | null = null
    try {
      const { data: inserted } = await supabase
        .from('scripts')
        .insert({
          user_id: authUser.id,
          topic,
          duration: durationSeconds,
          category,
          context: context || null,
          keywords: keywords || [],
          tone,
          language: languageKey,
          script: scriptContent,
          title,
          description: finalDescription,
          hashtags,
          pinned_comment: pinnedComment,
          alternative_titles: finalAlternativeTitles,
          word_count: wordCount,
          key_points: finalKeyPoints,
          is_series: false,
          guideline_passed: guidelineCheck.passed,
          guideline_flags: guidelineCheck.flags,
          used_analytics_context: !!analyticsContext,
          analytics_strategy_note: analyticsStrategyNote,
        })
        .select('id, created_at')
        .single()
      savedId = inserted?.id ?? null
    } catch (saveErr) {
      console.error('Failed to persist script:', saveErr)
    }

    return NextResponse.json({
      id: savedId || `script_${Date.now()}`,
      topic,
      duration: durationSeconds,
      category,
      tone,
      language: languageKey,
      context,
      keywords: keywords || [],
      title,
      script: scriptContent,
      description: finalDescription,
      hashtags,
      pinned_comment: pinnedComment,
      alternativeTitles: finalAlternativeTitles,
      word_count: wordCount,
      keyPoints: finalKeyPoints,
      created_at: new Date().toISOString(),
      is_series: false,
      guidelineCheck,
      usedAnalyticsContext: !!analyticsContext,
      analyticsStrategyNote,
    })
  } catch (error) {
    // A reserved quota slot that never produced a script shouldn't cost
    // the user a script from their monthly limit
    if (quotaReserved && supabase && userId) {
      try {
        await supabase.rpc('decrement_script_usage', { p_user_id: userId })
      } catch {}
    }
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate script' },
      { status: 500 }
    )
  }
}
