import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

type TransformAction = 'rewrite' | 'shorten' | 'expand' | 'tone' | 'hook'

const TRANSFORM_INSTRUCTIONS: Record<TransformAction, (tone?: string) => string> = {
  rewrite: () => 'Rewrite this YouTube Shorts script to read better while keeping the same topic, structure, and length.',
  shorten: () => 'Shorten this YouTube Shorts script by roughly 25% while keeping the core message and hook intact.',
  expand: () => 'Expand this YouTube Shorts script with a bit more detail and texture, roughly 25% longer, without losing pacing.',
  tone: (tone) => `Rewrite this YouTube Shorts script in a ${tone || 'different'} tone, keeping the same topic and structure.`,
  hook: () => 'Rewrite ONLY the opening hook (first 1-2 sentences) of this YouTube Shorts script to be more attention-grabbing, then continue with the rest of the script unchanged.',
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: script } = await supabase
      .from('scripts')
      .select('id, script, user_id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action, text, tone } = body as { action: string; text: string; tone?: string }

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }

    if (action === 'alternatives') {
      const message = await client.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 400,
        thinking: { type: 'disabled' },
        output_config: { effort: 'low' },
        messages: [
          {
            role: 'user',
            content: `Give 3 alternative opening hooks (first 1-2 sentences) for this YouTube Shorts script, each a different angle. Respond with ONLY a JSON array of 3 strings, no other text.

SCRIPT:
${text}`,
          },
        ],
      })
      const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
      const match = textBlock?.text.match(/\[[\s\S]*\]/)
      const alternatives = match ? JSON.parse(match[0]) : []
      return NextResponse.json({ alternatives })
    }

    if (action === 'analyze') {
      const message = await client.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 500,
        thinking: { type: 'disabled' },
        output_config: { effort: 'low' },
        messages: [
          {
            role: 'user',
            content: `Analyze this YouTube Shorts script. Respond with ONLY a JSON object, no other text: {"score": number 0-100, "tone": "short phrase", "audience": "short phrase describing likely viewer", "readability": "Easy"|"Medium"|"Complex", "hookStrength": "Weak"|"Decent"|"Strong", "suggestions": ["short actionable suggestion", ...up to 3]}

SCRIPT:
${text}`,
          },
        ],
      })
      const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
      const match = textBlock?.text.match(/\{[\s\S]*\}/)
      const analysis = match ? JSON.parse(match[0]) : null
      if (!analysis) {
        return NextResponse.json({ error: 'Could not analyze script' }, { status: 502 })
      }
      return NextResponse.json({ analysis })
    }

    if (action in TRANSFORM_INSTRUCTIONS) {
      const instruction = TRANSFORM_INSTRUCTIONS[action as TransformAction](tone)
      const message = await client.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 600,
        thinking: { type: 'disabled' },
        output_config: { effort: 'low' },
        messages: [
          {
            role: 'user',
            content: `${instruction} Respond with ONLY the new script text, no preamble, no quotes, no markdown.

SCRIPT:
${text}`,
          },
        ],
      })
      const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
      const result = textBlock?.text.trim()
      if (!result) {
        return NextResponse.json({ error: 'AI action failed' }, { status: 502 })
      }
      return NextResponse.json({ result })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Script action failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI action failed' },
      { status: 500 }
    )
  }
}
