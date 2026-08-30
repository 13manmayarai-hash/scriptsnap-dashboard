import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import * as Sentry from '@sentry/nextjs'

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

  const { data: connection } = await supabase
    .from('youtube_connections')
    .select('google_refresh_token')
    .eq('user_id', user.id)
    .maybeSingle()

  if (connection?.google_refresh_token) {
    // Best-effort — a failure to revoke on Google's side shouldn't block
    // the user from disconnecting locally; they can still revoke it
    // themselves from their Google Account's connected-apps settings.
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(connection.google_refresh_token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    } catch (err) {
      console.error('YouTube token revoke failed:', err)
      Sentry.captureException(err)
    }
  }

  await supabase.from('youtube_connections').delete().eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
