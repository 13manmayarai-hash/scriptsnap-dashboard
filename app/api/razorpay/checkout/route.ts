import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const Razorpay = require('razorpay')

// Pricing tiers
const TIER_PRICES = {
  basic: { amount: 1000, currency: 'INR', name: 'Basic' }, // ₹10
  pro: { amount: 2500, currency: 'INR', name: 'Pro' }, // ₹25
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Razorpay here (at request time, not build time)
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const { tier } = await request.json()

    if (!tier || !TIER_PRICES[tier as keyof typeof TIER_PRICES]) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      )
    }

    // Get user from session
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: any[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const priceInfo = TIER_PRICES[tier as keyof typeof TIER_PRICES]

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: priceInfo.amount * 100, // Amount in paise
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
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
