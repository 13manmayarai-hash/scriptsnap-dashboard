import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import { TIER_SCRIPT_LIMITS, type SubscriptionTier } from '@/lib/tiers'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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
    const { topic, duration, category, tone, context, keywords } = body

    const durationSeconds = parseInt(duration) || 60

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

${context ? `VIDEO CONTEXT:\n${context}\n` : ''}
${keywordsList}

TONE GUIDELINES:
- If Meditative: Use calming language, ask reflective questions, create mindfulness
- If Balanced: Be informative and engaging without being extreme
- If Energetic: Use exclamation marks, build excitement, create urgency

REQUIREMENTS:
1. Script should be approximately ${Math.floor(durationSeconds * 2.5)} words (about 2-2.5 words per second)
2. Start with an attention-grabbing hook
3. Include multiple clear sections with timestamps
4. Make it sound natural when read aloud
5. Incorporate all the context and keywords provided
6. End with a strong call-to-action

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
    const scriptContent = textBlock.text

    // Generate description
    let description = `📍 Watch this ${durationSeconds}-second deep dive into ${topic}\n`
    if (context) {
      description += `📝 Focus: ${context.split('\n')[0]}\n`
    }
    if (keywords && keywords.length > 0) {
      description += `🔑 Keywords: ${keywords.slice(0, 3).join(', ')}\n`
    }
    description += `🎯 Category: ${category}\n🎭 Tone: ${tone}\n✨ Perfect for YouTube Shorts\n\n`
    description += `Learn the fascinating details about ${topic}.`

    // Generate hashtags
    const hashtagMap: Record<string, string[]> = {
      'Cultural & Historical': ['#Culture', '#History', '#Educational', '#Learning'],
      'Art & Design': ['#Art', '#Design', '#Creative', '#Inspiration'],
      'Science & Nature': ['#Science', '#Nature', '#Discovery', '#Knowledge'],
      'Fashion & Style': ['#Fashion', '#Style', '#Trending', '#Lifestyle'],
      'Food & Craft': ['#Food', '#Recipe', '#DIY', '#Cooking'],
      'Tech & Engineering': ['#Tech', '#Innovation', '#Engineering', '#Future'],
    }

    const hashtags = hashtagMap[category] || ['#Shorts', '#YouTube', '#Learning']

    // Generate alternative titles
    const alternativeTitles = [
      { style: 'Curious', title: `The Surprising Truth About ${topic}` },
      { style: 'Energetic', title: `${topic}?! THIS IS INSANE!` },
      { style: 'Educational', title: `Complete Guide to ${topic}` },
      { style: 'Mysterious', title: `What You DON'T Know About ${topic}` },
      { style: 'Mindful', title: `Understanding ${topic}` },
      { style: 'List', title: `5 Mind-Blowing Facts About ${topic}` },
      { style: 'Comparison', title: `${topic}: Then vs Now` },
      { style: 'Question', title: `Why Everyone Is Talking About ${topic}` },
      { style: 'Story', title: `How ${topic} Changed Everything` },
      { style: 'Quick Tip', title: `The ONE Thing You Need to Know About ${topic}` },
    ]

    // Generate key points
    const keyPoints = [
      `${topic} is more fascinating than most people realize`,
      context ? `Key focus: ${context.split('\n')[0]}` : `Understanding brings new perspective`,
      keywords && keywords.length > 0 ? `Core elements: ${keywords.slice(0, 2).join(', ')}` : `Multiple applications exist`,
      `Many beliefs about ${topic} are misconceptions`,
      `This is increasingly relevant today`,
    ]

    // Pinned comment
    const pinnedComments = [
      `Which fact surprised you most? 👇`,
      `Share your thoughts about ${topic}! 💬`,
      `What should we explore next? 🔔`,
      `LIKE and SUBSCRIBE for more! ✨`,
      `Tag someone who needs this! 👇`,
    ]

    return NextResponse.json({
      id: `script_${Date.now()}`,
      topic,
      duration: durationSeconds,
      category,
      tone,
      context,
      keywords: keywords || [],
      title: `Discover ${topic}`,
      script: scriptContent,
      description,
      hashtags,
      pinned_comment: pinnedComments[Math.floor(Math.random() * pinnedComments.length)],
      alternativeTitles,
      word_count: scriptContent.split(' ').length,
      keyPoints,
      created_at: new Date().toISOString(),
      is_series: false,
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
