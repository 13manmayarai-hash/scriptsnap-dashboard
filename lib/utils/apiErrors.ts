import Anthropic from '@anthropic-ai/sdk'

// Turns a raw thrown error into a message that's safe and useful to show a
// user, instead of leaking an SDK's internal wording (stack-shaped strings,
// "ECONNRESET", provider-specific jargon) when Anthropic or Supabase is
// down or slow. Falls through to the original message for anything that
// isn't a recognized outage/network shape, since those are often genuinely
// useful ("Paste some of your writing first").
export function friendlyApiErrorMessage(error: unknown): string {
  if (error instanceof Anthropic.APIError) {
    if (error.status === 429) {
      return "We're getting a lot of requests right now — please wait a moment and try again."
    }
    if (error.status && error.status >= 500) {
      return 'Our AI generation service is temporarily unavailable — please try again in a moment.'
    }
  }

  const message = error instanceof Error ? error.message : ''
  const lower = message.toLowerCase()
  const looksLikeNetworkOutage =
    lower.includes('econnrefused') ||
    lower.includes('econnreset') ||
    lower.includes('fetch failed') ||
    lower.includes('etimedout') ||
    lower.includes('timeout') ||
    lower.includes('network')

  if (looksLikeNetworkOutage) {
    return "We're having trouble reaching one of our services — please try again in a moment."
  }

  return message || 'Something went wrong — please try again.'
}
