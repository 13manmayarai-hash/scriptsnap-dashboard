import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

  const [
    profile,
    scripts,
    scriptRatings,
    ideas,
    calendarEntries,
    tonePresets,
    categories,
    youtubeConnection,
    voiceProfile,
    keywordPerformance,
    tonePerformance,
    videoTranscripts,
    chatMessages,
    apiUsage,
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('scripts').select('*').eq('user_id', user.id),
    supabase.from('script_ratings').select('*').eq('user_id', user.id),
    supabase.from('ideas').select('*').eq('user_id', user.id),
    supabase.from('calendar_entries').select('*').eq('user_id', user.id),
    supabase.from('tone_presets').select('*').eq('user_id', user.id),
    supabase.from('categories').select('*').eq('user_id', user.id),
    // google_refresh_token deliberately excluded — it's a live credential,
    // not "your data" in the export sense.
    supabase
      .from('youtube_connections')
      .select('youtube_channel_id, youtube_channel_title, connected_at, needs_reconnect')
      .eq('user_id', user.id)
      .maybeSingle(),
    // Everything below was missing from the original export — all of it
    // is content the creator generated or that was learned specifically
    // from their behavior, not internal bookkeeping (rate_limits is the
    // one table deliberately still excluded, same reasoning as the OAuth
    // token above: it's anti-abuse plumbing, not something the creator
    // created or would recognize as "their data").
    supabase.from('voice_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('keyword_performance').select('*').eq('user_id', user.id),
    supabase.from('tone_performance').select('*').eq('user_id', user.id),
    supabase.from('video_transcripts').select('*').eq('user_id', user.id),
    supabase.from('chat_messages').select('*').eq('user_id', user.id),
    supabase.from('api_usage').select('*').eq('user_id', user.id),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    account: profile.data,
    scripts: scripts.data || [],
    script_ratings: scriptRatings.data || [],
    ideas: ideas.data || [],
    calendar_entries: calendarEntries.data || [],
    tone_presets: tonePresets.data || [],
    categories: categories.data || [],
    youtube_connection: youtubeConnection.data || null,
    voice_profile: voiceProfile.data || null,
    keyword_performance: keywordPerformance.data || [],
    tone_performance: tonePerformance.data || [],
    video_transcripts: videoTranscripts.data || [],
    chat_messages: chatMessages.data || [],
    api_usage: apiUsage.data || [],
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="scriptsnap-data-export.json"',
    },
  })
}
