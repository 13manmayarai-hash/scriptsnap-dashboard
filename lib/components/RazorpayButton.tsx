'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RazorpayButtonProps {
  tier: 'basic' | 'pro'
  tierName: string
  ctaLabel?: string
  className?: string
}

export default function RazorpayButton({
  tier,
  tierName,
  ctaLabel = 'Upgrade',
  className,
}: RazorpayButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      // Step 1: Call backend to create Razorpay order
      const checkoutRes = await fetch('/api/razorpay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ tier }),
      })

      const checkoutData = await checkoutRes.json()

      // Handle 401 - not authenticated
      if (checkoutRes.status === 401) {
        router.push(`/auth/login?redirectTo=${encodeURIComponent('/pricing')}`)
        return
      }

      // Handle other errors
      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error || 'Failed to create order')
      }

      const { orderId, amount, currency, keyId } = checkoutData

      // Verify we have all required data
      if (!orderId || !keyId || !amount) {
        throw new Error('Invalid order data from server')
      }

      // Step 2: Load Razorpay checkout script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true

      script.onload = () => {
        // Step 3: Configure Razorpay options
        const options = {
          key: keyId,
          amount: Math.round(amount * 100), // Convert to paise
          currency: currency,
          name: 'ScriptSnap',
          description: `${tierName} Plan - ${amount} INR/month`,
          order_id: orderId,
          handler: async (response: any) => {
            // Step 4: Verify payment signature on backend
            try {
              const verifyRes = await fetch('/api/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                  razorpay_order_id: orderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  tier: tier,
                }),
              })

              if (verifyRes.ok) {
                // Payment successful!
                router.push('/dashboard?payment=success')
              } else {
                const errorData = await verifyRes.json()
                throw new Error(errorData.error || 'Verification failed')
              }
            } catch (verifyErr) {
              setError(
                verifyErr instanceof Error ? verifyErr.message : 'Verification failed'
              )
              setLoading(false)
            }
          },
          theme: {
            color: '#7A8B72',
          },
          modal: {
            ondismiss: () => {
              setLoading(false)
            },
          },
        }

        // Step 5: Open Razorpay checkout.
        // This callback runs after the outer try/catch's call stack has
        // already finished, so exceptions here (e.g. window.Razorpay not
        // actually available) would otherwise be uncatchable and leave the
        // button stuck on "Processing..." with no visible error.
        try {
          const razorpay = new (window as any).Razorpay(options)
          razorpay.open()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to open payment gateway')
          setLoading(false)
        }
      }

      script.onerror = () => {
        setError('Failed to load payment gateway')
        setLoading(false)
      }

      document.body.appendChild(script)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handlePayment}
        disabled={loading}
        className={className ?? 'flex items-center justify-center min-h-[44px] w-full bg-sage text-white font-semibold rounded md:rounded-lg hover:bg-sage-hover transition-colors disabled:opacity-50 px-0.5 sm:px-2 md:px-6 text-xs md:text-base leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-warm-bg'}
      >
        {loading ? '…' : ctaLabel}
      </button>
      {error && (
        <p className="text-error text-xs md:text-sm mt-1 md:mt-2 break-words" aria-live="polite">
          {error}
        </p>
      )}
    </>
  )
}
