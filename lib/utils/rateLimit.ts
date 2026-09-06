import type { SupabaseClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

// Every route calling check_rate_limit only ever read `data`, never
// `error` -- so any transient failure of the RPC itself (not an actual
// rate-limit rejection) came back as `data: null`, which every call site's
// `if (!rateLimitOk)` treated identically to "over the limit". A user could
// hit a real backend hiccup on their very first request and see a
// misleading "Too many requests" message, with the real cause never logged
// anywhere. Fails open on a genuine RPC error (rate limiting is
// abuse-prevention, not a security boundary -- better to let a legitimate
// request through than block one on an infra blip) while still logging it
// so a real, persistent problem is visible.
export async function checkRateLimit(
  supabase: SupabaseClient,
  params: { userId: string; route: string; maxRequests: number; windowSeconds: number }
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_user_id: params.userId,
    p_route: params.route,
    p_max_requests: params.maxRequests,
    p_window_seconds: params.windowSeconds,
  })

  if (error) {
    console.error(`Rate limit check failed for route "${params.route}":`, error)
    Sentry.captureException(error)
    return true
  }

  return data === true
}
