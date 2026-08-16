import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { getRazorpayErrorMessage } from '@/lib/razorpay'

const Razorpay = require('razorpay')

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = await request.json()

    // Verify Razorpay signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`)
    const digest = hmac.digest('hex')

    if (digest !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Read the tier from the order Razorpay itself created, never from the
    // client request body — the HMAC signature only covers order_id and
    // payment_id, not tier, so a client-supplied tier could be swapped
    // (e.g. pay for Basic, claim Pro) without this.
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
    const order = await razorpay.orders.fetch(razorpay_order_id)
    const tier = order.notes?.tier

    if (tier !== 'basic' && tier !== 'pro') {
      return NextResponse.json({ error: 'Invalid order' }, { status: 400 })
    }

    // Get user
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

    // Order/payment IDs and their signature aren't secret to the paying
    // browser once Razorpay's checkout handler returns them — without this
    // check, replaying someone else's real (order_id, payment_id,
    // signature) triple would upgrade the replaying user's own account
    // using a payment they never made.
    if (order.notes?.user_id !== user.id) {
      return NextResponse.json({ error: 'Order does not belong to this user' }, { status: 403 })
    }

    // Update subscription
    const nextBillingDate = new Date()
    nextBillingDate.setDate(nextBillingDate.getDate() + 30)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_tier: tier,
        razorpay_payment_id,
        razorpay_order_id,
        next_billing_date: nextBillingDate.toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { error: getRazorpayErrorMessage(error, 'Verification failed') },
      { status: 500 }
    )
  }
}
