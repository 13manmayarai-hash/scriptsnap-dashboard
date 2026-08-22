import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — ScriptSnap',
  description: 'How ScriptSnap collects, uses, and protects your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-warm-bg" style={{ colorScheme: 'light' }}>
      <div className="mx-auto max-w-[760px] px-6 py-16 lg:px-0">
        <Link href="/" className="text-sm text-sage hover:underline">
          &larr; Back to ScriptSnap
        </Link>

        <h1 className="mt-6 text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.02em] text-[#20201E]">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-[#9C9686]">Last updated: August 21, 2026</p>

        <div className="prose-legal mt-10 space-y-8 text-[15px] leading-7 text-[#3A3934]">
          <p>
            This policy explains what ScriptSnap (&ldquo;we,&rdquo; &ldquo;us&rdquo;) collects when you use the app,
            why, who we share it with, and how you can export or delete it. It covers what the product
            actually does today &mdash; not generic boilerplate.
          </p>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">1. What we collect</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li><strong>Account information:</strong> your email address, and a password (stored as a secure hash by our authentication provider, Supabase &mdash; we never see or store it in plain text).</li>
              <li><strong>Content you create:</strong> script topics, generated scripts, context and keywords you provide, ideas, calendar entries, tone presets, categories, and script ratings.</li>
              <li><strong>YouTube channel data (only if you connect it):</strong> your channel ID and title, and a short cached summary of your channel&rsquo;s recent video performance (views, average watch time, subscriber gains) used to personalize script generation. Your Google access token is stored securely on our servers and is never sent to your browser or included in a data export.</li>
              <li><strong>Payment identifiers:</strong> order, payment, and customer IDs from Razorpay, our payment processor. We never see or store your card details &mdash; Razorpay handles that directly.</li>
              <li><strong>Subscription status:</strong> your current plan (Free, Basic, or Pro) and monthly usage count.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">2. How we use it</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>To generate scripts &mdash; your topic, context, keywords, and (if connected) channel performance summary are sent to Anthropic&rsquo;s Claude API to produce the script.</li>
              <li>To personalize output using your own tone presets and generation history.</li>
              <li>To process payments and manage your subscription via Razorpay.</li>
              <li>To pull your channel analytics, only if you&rsquo;ve connected your YouTube channel, via Google&rsquo;s YouTube Data and YouTube Analytics APIs.</li>
              <li>To enforce your plan&rsquo;s monthly script limit.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">3. Who we share it with</h2>
            <p className="mt-3">
              We use the following service providers (&ldquo;sub-processors&rdquo;) to run ScriptSnap. We don&rsquo;t sell
              your data to anyone.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li><strong>Anthropic</strong> &mdash; processes the text of your script requests to generate scripts.</li>
              <li><strong>Google</strong> &mdash; only if you connect your YouTube channel, to read your channel&rsquo;s public and owner-level analytics.</li>
              <li><strong>Razorpay</strong> &mdash; processes subscription payments.</li>
              <li><strong>Supabase</strong> &mdash; hosts our database and handles authentication.</li>
              <li><strong>Vercel</strong> &mdash; hosts the application itself.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">4. How long we keep it</h2>
            <p className="mt-3">
              We keep your data for as long as your account is active. If you delete your account, everything
              tied to it &mdash; scripts, ideas, calendar entries, tone presets, categories, and your YouTube
              connection &mdash; is permanently deleted, immediately and irreversibly.
            </p>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">5. Your rights</h2>
            <p className="mt-3">
              From <Link href="/dashboard/settings" className="text-sage hover:underline">Settings</Link>, you can:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li><strong>Export your data</strong> as a JSON file, at any time.</li>
              <li><strong>Delete your account</strong>, which permanently removes all of the above with no recovery option.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">6. Security</h2>
            <p className="mt-3">
              Passwords are hashed by Supabase Auth, never stored in plain text. Database access is scoped
              per-user with row-level security, so one account can never read another&rsquo;s data. Your YouTube
              access token is stored server-side only and is never exposed to your browser.
            </p>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">7. Changes to this policy</h2>
            <p className="mt-3">
              If this policy changes materially, we&rsquo;ll update the date above and, where required, notify you
              directly.
            </p>
          </section>

          <section>
            <h2 className="text-[19px] font-semibold text-[#20201E]">8. Contact</h2>
            <p className="mt-3">
              Questions about this policy or your data: [PLACEHOLDER: support contact email].<br />
              [PLACEHOLDER: business legal name and address].
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
