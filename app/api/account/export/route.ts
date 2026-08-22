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

  const [profile, scripts, scriptRatings, ideas, calendarEntries, tonePresets, categories, youtubeConnection] =
    await Promise.all([
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
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="scriptsnap-data-export.json"',
    },
  })
}
