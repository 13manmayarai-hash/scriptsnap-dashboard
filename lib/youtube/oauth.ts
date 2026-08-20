import { google } from 'googleapis'

// Read-only scopes only — this feature never needs to modify anything on
// the creator's channel, just read performance data to inform generation.
export const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
]

// Separate Google Cloud OAuth client from Supabase's login-with-Google —
// see .env.example for why. Built fresh per call rather than as a module
// singleton so each request gets its own credential state.
export function getYouTubeOAuthClient() {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/youtube/callback`
  return new google.auth.OAuth2(
    process.env.GOOGLE_YOUTUBE_CLIENT_ID,
    process.env.GOOGLE_YOUTUBE_CLIENT_SECRET,
    redirectUri
  )
}
