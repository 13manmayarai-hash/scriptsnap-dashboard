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
      // Call checkout API
      const checkoutRes = await fetch('/api/razorpay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      const data = await checkoutRes.json()

      // Check response status
      if (!checkoutRes.ok) {
        // If 401, user not logged in
        if (checkoutRes.status === 401) {
          setError('Please log in first to upgrade')
          setLoading(false)
          return
        }
        throw new Error(data.details || data.error || 'Payment failed')
      }

      const { orderId, amount, currency, keyId } = data

      // Check if Razorpay keys are present
      if (!keyId) {
        throw new Error('Payment gateway not configured')
      }

      // Load Razorpay script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      
      script.onload = () => {
        try {
          const options = {
            key: keyId,
            amount: amount * 100,
            currency: currency,
            name: 'ScriptSnap',
            description: `Upgrade to ${tierName} tier`,
            order_id: orderId,
            handler: async (response: any) => {
              // Verify payment
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
                // Payment success - redirect to dashboard
                router.push('/dashboard?payment=success')
              } else {
                setError('Payment verification failed')
                setLoading(false)
              }
            },
            theme: {
              color: '#FFD700',
            },
          }

          const rzp = new (window as any).Razorpay(options)
          rzp.open()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to open payment')
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
