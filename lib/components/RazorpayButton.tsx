'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  const [needsLogin, setNeedsLogin] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    setError('')
    setNeedsLogin(false)

    try {
      const checkoutRes = await fetch('/api/razorpay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      const data = await checkoutRes.json()

      // If 401, show login prompt
      if (checkoutRes.status === 401) {
        setNeedsLogin(true)
        setLoading(false)
        return
      }

      if (!checkoutRes.ok) {
        throw new Error(data.details || data.error || 'Payment failed')
      }

      const { orderId, amount, currency, keyId } = data

      // Load Razorpay script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => {
        const options = {
          key: keyId,
          amount: amount * 100,
          currency: currency,
          name: 'ScriptSnap',
          description: `Upgrade to ${tierName} tier`,
          order_id: orderId,
          handler: async (response: any) => {
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
              router.push('/dashboard?payment=success')
            } else {
              setError('Payment verification failed')
            }
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
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  // If user needs to log in
  if (needsLogin) {
    return (
      <div>
        <Link
          href="/auth/login"
          className="block w-full bg-brand-yellow text-brand-black font-semibold py-3 px-6 rounded-lg text-center hover:bg-yellow-400 transition-colors"
        >
          Log In to Upgrade
        </Link>
        <p className="text-white/60 text-sm mt-2">
          You need to log in first to upgrade your plan
        </p>
      </div>
    )
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
