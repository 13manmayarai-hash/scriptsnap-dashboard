import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import * as Sentry from '@sentry/nextjs'

// Fails loudly if unset rather than silently falling back to the anon
// key. That fallback previously meant: if SUPABASE_SERVICE_ROLE_KEY were
// ever missing or misconfigured, this webhook would run under RLS with
// no authenticated session (no auth.uid()) -- the users table's
// ownership-scoped UPDATE policy would then block every write with zero
// rows affected, and .update() doesn't error on a zero-row match, so
// every real payment would silently stop granting tier upgrades with
// nothing in the logs pointing at why.
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for the Razorpay webhook to write past RLS')
}
const serviceRoleKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')!

    // Verify webhook signature. Razorpay signs webhook deliveries with a
    // dedicated Webhook Secret (configured separately in the Razorpay
    // Dashboard's Webhooks section) — this is NOT the same as the API
    // key_secret used to authenticate REST calls, so it needs its own
    // env var or every real webhook will fail verification.
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    shasum.update(body)
    const digest = shasum.digest('hex')

    // Constant-time comparison -- a plain !== leaks how many leading bytes
    // matched via response timing, which an attacker could use to forge a
    // valid signature byte-by-byte. Buffers must be equal length before
    // timingSafeEqual will even compare them.
    const digestBuffer = Buffer.from(digest, 'hex')
    const signatureBuffer = Buffer.from(signature || '', 'hex')
    const signaturesMatch =
      digestBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(digestBuffer, signatureBuffer)

    if (!signaturesMatch) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const event = JSON.parse(body)

    // subscription.paused (and the rest of the subscription.* family) is
    // deliberately not handled: checkout/route.ts creates a one-time
    // razorpay.orders.create() order, never a real Razorpay Subscription
    // object via razorpay.subscriptions.create() -- so Razorpay never
    // emits subscription.* events for this payment model in the first
    // place. A handler for it previously existed here but was dead code
    // twice over: unreachable (wrong event family for this app), and
    // broken even if it had been reachable (looked up users by
    // razorpay_customer_id, a column nothing in this codebase ever
    // writes to). Recurring-billing expiry is handled instead by
    // get_effective_tier's lazy check against next_billing_date --
    // see lib/tiers.ts.
    if (event.event === 'payment.authorized') {
      const { notes, id: payment_id } = event.payload.payment.entity

      // .select().maybeSingle() to detect a zero-row match, same
      // zero-row-update detection app/api/razorpay/verify/route.ts
      // already uses -- .update() alone doesn't error when the eq()
      // filter matches nothing, so a bad/missing notes.user_id would
      // otherwise silently grant nothing with no signal anywhere.
      const { data: updated, error } = await supabase
        .from('users')
        .update({
          subscription_tier: notes.tier,
          razorpay_payment_id: payment_id,
        })
        .eq('id', notes.user_id)
        .select()
        .maybeSingle()

      if (error || !updated) {
        console.error('Webhook update error:', error, 'notes.user_id:', notes.user_id)
        Sentry.captureException(error ?? new Error(`Webhook payment.authorized matched no user row for id ${notes.user_id}`))
        return NextResponse.json(
          { error: 'Database update failed' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
