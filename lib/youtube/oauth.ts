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
//
// `origin` is derived from the incoming request (e.g. `new URL(request.url).origin`)
// rather than a NEXT_PUBLIC_* env var — those get inlined at build time in
// Next.js, so a stale/missing value bakes a broken redirect_uri into the
// bundle until the next fresh build (this bit Razorpay's key earlier in
// this project for the same reason). Reading it from the request at
// runtime means it's always correct for whatever domain actually served
// the request, with nothing to keep in sync. Only the token-refresh path
// in lib/youtube/analytics.ts can omit it — redirect_uri isn't validated
// by Google for the refresh_token grant.
export function getYouTubeOAuthClient(origin?: string) {
  const redirectUri = origin ? `${origin}/api/youtube/callback` : undefined
  return new google.auth.OAuth2(
    process.env.GOOGLE_YOUTUBE_CLIENT_ID,
    process.env.GOOGLE_YOUTUBE_CLIENT_SECRET,
    redirectUri
  )
}
