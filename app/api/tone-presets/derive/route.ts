import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// First-run onboarding: turns a pasted sample of a creator's own writing
// (past scripts, captions, or just a description of how they talk) into a
// real tone preset in one small Claude call — the fastest path from
// "brand new account" to a generation that already sounds like them,
// instead of picking one of the three generic defaults. Not gated by
// quota — this is a lightweight setup action, not a script generation.
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

  // Burst-abuse guard — this triggers a real Anthropic call and isn't
  // gated by quota (see comment above), so without this an authenticated
  // user could loop it for unbounded billable spend.
  const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
    p_user_id: user.id,
    p_route: 'tone-presets-derive',
    p_max_requests: 10,
    p_window_seconds: 60,
  })
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: 'Too many requests — please wait a moment and try again.' },
      { status: 429 }
    )
  }

  const body = await request.json()
  const sampleText = typeof body?.sampleText === 'string' ? body.sampleText.trim() : ''
  if (!sampleText) {
    return NextResponse.json({ error: 'Paste some of your writing first' }, { status: 400 })
  }
  if (sampleText.length < 30) {
    return NextResponse.json({ error: "That's a bit short to get a read on your voice — paste a bit more." }, { status: 400 })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 200,
      thinking: { type: 'disabled' },
      output_config: { effort: 'low' },
      messages: [
        {
          role: 'user',
          content: `Here is a sample of a YouTube Shorts creator's own writing (past scripts, captions, or a description of how they talk). Identify their voice as a reusable tone preset. Respond with ONLY a JSON object, no other text: {"name": "a short 1-3 word name for this tone (e.g. 'Warm Storyteller', 'Punchy & Direct')", "style_description": "1-2 sentences describing the specific stylistic traits a script writer should follow to sound like this creator — word choice, pacing, sentence length, energy level, any recurring habits"}

SAMPLE:
${sampleText.slice(0, 4000)}`,
        },
      ],
    })
    const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    const match = textBlock?.text.match(/\{[\s\S]*\}/)
    const parsed = match ? JSON.parse(match[0]) : null

    if (!parsed || typeof parsed.name !== 'string' || typeof parsed.style_description !== 'string') {
      return NextResponse.json({ error: "Couldn't read a clear style from that — try pasting a longer sample." }, { status: 502 })
    }

    const { data: inserted, error: insertError } = await supabase
      .from('tone_presets')
      .insert({ user_id: user.id, name: parsed.name.trim().slice(0, 60), style_description: parsed.style_description.trim() })
      .select('id, name, style_description')
      .single()

    if (insertError || !inserted) {
      return NextResponse.json({ error: 'Found your style, but failed to save it — try again.' }, { status: 500 })
    }

    return NextResponse.json({ preset: inserted })
  } catch (error) {
    console.error('Tone derivation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not analyze your voice' },
      { status: 500 }
    )
  }
}
