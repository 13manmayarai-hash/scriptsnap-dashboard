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
      // Step 1: Call backend to create Razorpay order
      const checkoutRes = await fetch('/api/razorpay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      const checkoutData = await checkoutRes.json()

      // Handle 401 - not authenticated
      if (checkoutRes.status === 401) {
        router.push('/auth/login')
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
            color: '#FFD700',
          },
          modal: {
            ondismiss: () => {
              setLoading(false)
            },
          },
        }

        // Step 5: Open Razorpay checkout
        const razorpay = new (window as any).Razorpay(options)
        razorpay.open()
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
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </>
  )
}
