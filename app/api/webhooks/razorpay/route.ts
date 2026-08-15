import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  // Initialize Supabase at request time, not build time
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')!

    // Verify webhook signature
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    shasum.update(body)
    const digest = shasum.digest('hex')

    if (digest !== signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const event = JSON.parse(body)

    // Handle different webhook events
    if (event.event === 'payment.authorized') {
      const { notes, id: payment_id } = event.payload.payment.entity

      // Update user subscription
      const { error } = await supabase
        .from('users')
        .update({
          subscription_tier: notes.tier,
          razorpay_payment_id: payment_id,
        })
        .eq('id', notes.user_id)

      if (error) {
        console.error('Webhook update error:', error)
        return NextResponse.json(
          { error: 'Database update failed' },
          { status: 500 }
        )
      }
    }

    if (event.event === 'subscription.paused') {
      const { customer_id } = event.payload.subscription.entity
      
      // Set tier back to free
      const { error } = await supabase
        .from('users')
        .update({ subscription_tier: 'free' })
        .eq('razorpay_customer_id', customer_id)

      if (error) {
        console.error('Webhook pause error:', error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
