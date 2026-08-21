import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const response = NextResponse.json({ success: true })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: any[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Best-effort: return the YouTube grant to Google before the row that
  // holds the token disappears in the cascade below. A failure here
  // shouldn't block account deletion.
  const { data: connection } = await supabase
    .from('youtube_connections')
    .select('google_refresh_token')
    .eq('user_id', user.id)
    .maybeSingle()

  if (connection?.google_refresh_token) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(connection.google_refresh_token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    } catch (err) {
      console.error('YouTube token revoke failed during account deletion:', err)
    }
  }

  // auth.users.id -> public.users.id -> every owned table are all
  // ON DELETE CASCADE (verified directly against the live schema), so
  // deleting the auth user alone correctly removes everything.
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { error: deleteError } = await serviceClient.auth.admin.deleteUser(user.id)
  if (deleteError) {
    console.error('Account deletion failed:', deleteError)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }

  // The session's underlying user no longer exists at this point, so the
  // server-side logout call itself may error — the cookie-clearing side
  // effect (via setAll above) is what actually matters here, and a
  // deleted account shouldn't fail the response over a logout call.
  try {
    await supabase.auth.signOut()
  } catch (err) {
    console.error('Sign-out after account deletion failed:', err)
  }
  return response
}
