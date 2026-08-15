'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RazorpayButtonProps {
  tier: 'basic' | 'pro'
  tierName: string
}

export default function RazorpayButton({
  tier,
  tierName,
}: RazorpayButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      console.log('🎯 Starting payment flow for tier:', tier)

      // Step 1: Create checkout order
      console.log('📞 Calling /api/razorpay/checkout...')
      const checkoutRes = await fetch('/api/razorpay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      console.log('📊 Checkout response status:', checkoutRes.status)

      const data = await checkoutRes.json()
      console.log('📊 Checkout response data:', data)

      // Check if authentication failed
      if (checkoutRes.status === 401) {
        console.log('🔑 User not authenticated (401), redirecting to login...')
        router.push('/auth/login')
        return
      }

      // Check if order creation failed
      if (!checkoutRes.ok) {
        const errorMsg = data.details || data.error || 'Unknown error'
        console.error('❌ Order creation failed:', errorMsg)
        throw new Error(errorMsg)
      }

      // Step 2: Extract order details
      const { orderId, amount, currency, keyId } = data
      console.log('✅ Order created:', { orderId, amount, currency })

      if (!orderId || !keyId) {
        throw new Error('Missing orderId or keyId from server')
      }

      // Step 3: Load Razorpay script
      console.log('📦 Loading Razorpay script...')
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true

      script.onload = () => {
        console.log('✅ Razorpay script loaded')
        try {
          // Step 4: Open payment modal
          const options = {
            key: keyId,
            amount: amount * 100,
            currency: currency,
            name: 'ScriptSnap',
            description: `Upgrade to ${tierName} tier`,
            order_id: orderId,
            handler: async (response: any) => {
              console.log('💳 Payment handler called with:', response)

              // Step 5: Verify payment
              const verifyRes = await fetch('/api/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: orderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  tier: tier,
                }),
              })

              if (verifyRes.ok) {
                console.log('✅ Payment verified! Redirecting to dashboard...')
                router.push('/dashboard?payment=success')
              } else {
                console.error('❌ Verification failed')
                setError('Payment verification failed')
                setLoading(false)
              }
            },
            theme: { color: '#FFD700' },
          }

          console.log('🎯 Opening Razorpay checkout with options:', options)
          const rzp = new (window as any).Razorpay(options)
          rzp.open()
          setLoading(false)
        } catch (err) {
          console.error('❌ Error opening Razorpay:', err)
          setError(err instanceof Error ? err.message : 'Failed to open payment')
          setLoading(false)
        }
      }

      script.onerror = () => {
        console.error('❌ Failed to load Razorpay script')
        setError('Failed to load payment gateway')
        setLoading(false)
      }

      document.body.appendChild(script)
    } catch (err) {
      console.error('❌ Payment error:', err)
      setError(err instanceof Error ? err.message : 'Payment failed')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-brand-yellow text-brand-black font-semibold py-3 px-6 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Upgrade to ${tierName}`}
      </button>
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </>
  )
}
