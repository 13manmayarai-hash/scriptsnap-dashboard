import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — ScriptSnap',
  description: 'The terms that govern your use of ScriptSnap.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-warm-bg" style={{ colorScheme: 'light' }}>
      <div className="mx-auto max-w-[760px] px-6 py-16 lg:px-0">
        <Link href="/" className="text-sm text-sage hover:underline">
          &larr; Back to ScriptSnap
        </Link>

        <h1 className="mt-6 text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.02em] text-[#20201E]">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-[#9C9686]">Last updated: August 21, 2026</p>

        <div className="prose-legal mt-10 space-y-8 text-[15px] leading-7 text-[#3A3934]">
          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">1. Acceptance of terms</h2>
            <p className="mt-3">
              By creating a ScriptSnap account or using the service, you agree to these terms and our{' '}
              <Link href="/privacy" className="text-sage hover:underline">Privacy Policy</Link>. If you don&rsquo;t agree,
              don&rsquo;t use ScriptSnap.
            </p>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">2. What ScriptSnap is</h2>
            <p className="mt-3">
              ScriptSnap generates YouTube Shorts scripts using AI, personalized to your topic, tone, and
              (optionally) your channel&rsquo;s own performance data. It&rsquo;s a writing tool &mdash; it doesn&rsquo;t publish
              anything on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">3. Your account</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>You&rsquo;re responsible for keeping your login credentials secure.</li>
              <li>One account per person. Don&rsquo;t create multiple accounts to get around monthly script limits.</li>
              <li>You must provide an accurate email address.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">4. Subscriptions & billing</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li><strong>Free</strong> &mdash; &#8377;0/month, 5 scripts.</li>
              <li><strong>Basic</strong> &mdash; &#8377;199/month, 50 scripts.</li>
              <li><strong>Pro</strong> &mdash; &#8377;499/month, 200 scripts, includes YouTube channel analytics.</li>
            </ul>
            <p className="mt-3">
              Subscriptions are billed monthly via Razorpay and renew automatically until cancelled. You can
              cancel anytime from Settings; you&rsquo;ll keep access through the end of the billing period you&rsquo;ve
              already paid for. [PLACEHOLDER: refund policy &mdash; e.g. whether partial-month refunds are offered].
            </p>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">5. Acceptable use</h2>
            <p className="mt-3">Don&rsquo;t use ScriptSnap to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Generate illegal, harassing, or deliberately harmful content.</li>
              <li>Attempt to circumvent your plan&rsquo;s monthly script limit.</li>
              <li>Access or attempt to access another user&rsquo;s account or data.</li>
              <li>Reverse-engineer or abuse the underlying AI or API integrations.</li>
            </ul>
            <p className="mt-3">We may suspend or terminate accounts that violate this.</p>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">6. Connecting your YouTube channel</h2>
            <p className="mt-3">
              Connecting your YouTube channel is entirely optional and grants ScriptSnap read-only access to
              your channel&rsquo;s analytics &mdash; we can never post, edit, or delete anything on your channel. You can
              disconnect at any time from Settings, which revokes our access immediately.
            </p>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">7. Ownership</h2>
            <p className="mt-3">
              You own the scripts and content ScriptSnap generates for you. ScriptSnap and its branding remain
              our property.
            </p>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">8. AI output isn&rsquo;t guaranteed</h2>
            <p className="mt-3">
              Generated scripts are AI output &mdash; review them before publishing. We don&rsquo;t guarantee accuracy,
              performance, or that a script complies with YouTube&rsquo;s policies for your specific video; the
              in-app guideline check is a helpful signal, not a guarantee.
            </p>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">9. Limitation of liability</h2>
            <p className="mt-3">
              ScriptSnap is provided &ldquo;as is,&rdquo; without warranties of any kind. To the extent permitted by law,
              we&rsquo;re not liable for indirect, incidental, or consequential damages arising from your use of the
              service.
            </p>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">10. Termination</h2>
            <p className="mt-3">
              You can delete your account at any time from Settings &mdash; this permanently removes all of your
              data. We may suspend or terminate accounts that violate section 5.
            </p>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">11. Governing law</h2>
            <p className="mt-3">[PLACEHOLDER: governing law / jurisdiction].</p>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">12. Contact</h2>
            <p className="mt-3">
              Questions about these terms: [PLACEHOLDER: support contact email].
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
