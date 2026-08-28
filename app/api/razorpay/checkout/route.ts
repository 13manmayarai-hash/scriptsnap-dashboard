import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getRazorpayErrorMessage } from '@/lib/razorpay'

const Razorpay = require('razorpay')

const TIER_PRICES = {
  basic: { amount: 199, currency: 'INR' },
  pro: { amount: 499, currency: 'INR' },
}

export async function POST(request: NextRequest) {
  try {
    const { tier } = await request.json()

    // Validate tier
    if (!tier || !TIER_PRICES[tier as keyof typeof TIER_PRICES]) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Get authenticated user
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet: any[]) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Burst-abuse guard — stops a scripted loop from spamming Razorpay
    // order creation.
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_route: 'razorpay-checkout',
      p_max_requests: 10,
      p_window_seconds: 60,
    })
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many requests — please wait a moment and try again.' },
        { status: 429 }
      )
    }

    // RAZORPAY_KEY_ID deliberately has no NEXT_PUBLIC_ prefix even though
    // it ends up in the client's hands (via the JSON response below) — that
    // prefix makes Next.js statically inline the value into the compiled
    // bundle at build time, everywhere, including this server-only route.
    // A missing var set after the last build would then stay baked in as
    // undefined until a fresh build ran, regardless of later dashboard
    // changes. Plain server env vars are read fresh on every request.
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    // Get price for tier
    const priceInfo = TIER_PRICES[tier as keyof typeof TIER_PRICES]

    // Create order
    const order = await razorpay.orders.create({
      amount: priceInfo.amount * 100, // Convert to paise
      currency: priceInfo.currency,
      receipt: `order_${user.id}_${Date.now()}`,
      notes: {
        user_id: user.id,
        user_email: user.email,
        tier: tier,
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: priceInfo.amount,
      currency: priceInfo.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: getRazorpayErrorMessage(error, 'Failed to create order') },
      { status: 500 }
    )
  }
}
