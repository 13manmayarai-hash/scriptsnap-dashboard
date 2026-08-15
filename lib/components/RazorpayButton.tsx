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
      // Step 1: Create checkout order
      const checkoutRes = await fetch('/api/razorpay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      if (!checkoutRes.ok) {
        throw new Error('Failed to create payment order')
      }

      const { orderId, amount, currency, keyId } = await checkoutRes.json()

      // Step 2: Load Razorpay script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => {
        // Step 3: Open Razorpay payment modal
        const options = {
          key: keyId,
          amount: amount * 100, // Amount in paise
          currency: currency,
          name: 'ScriptSnap',
          description: `Upgrade to ${tierName} tier`,
          order_id: orderId,
          handler: async (response: any) => {
            // Step 4: Verify payment
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
              // Payment successful
              router.push('/dashboard?payment=success')
            } else {
              setError('Payment verification failed')
            }
          },
          prefill: {
            name: 'User',
            email: 'user@example.com',
          },
          theme: {
            color: '#FFD700',
          },
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      }
      document.body.appendChild(script)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Payment failed'
      )
    } finally {
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
