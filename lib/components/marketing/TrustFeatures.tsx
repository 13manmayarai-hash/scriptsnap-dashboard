import { RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react'
import { Reveal } from './Shared'

export default function TrustFeatures() {
  return (
    <section className="border-t border-[#E2DFD6] bg-[#F1EFE8] py-20 sm:py-28">
      <div className="mx-auto max-w-[1380px] px-6 lg:px-10">
        <Reveal className="mx-auto mb-14 max-w-[660px] text-center">
          <h2 className="text-[clamp(28px,4vw,42px)] font-semibold tracking-[-0.02em] text-balance">
            Built to keep getting better &mdash; and keep you covered
          </h2>
          <p className="mt-4 text-[16px] text-[#706E68]">
            A voice profile that keeps learning, and a real policy check before you publish.
          </p>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal className="rounded-[16px] border border-[#E0DDD3] bg-white p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[13px] bg-[#7A8B72] text-white">
              <RefreshCw size={22} aria-hidden="true" strokeWidth={2} />
            </div>
            <h3 className="text-[19px] font-semibold">Gets smarter every session</h3>
            <p className="mt-2 text-[14.5px] leading-6 text-[#706E68]">
              Every script you keep, edit, or regenerate refines your tone presets &mdash; a voice
              profile that fits your actual style better the more you use it.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              {[
                { label: 'Session 1', pct: 22 },
                { label: 'Session 6', pct: 61 },
                { label: 'Session 20', pct: 94 },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 text-[12px] text-[#9C9686]">
                  <span className="w-[70px] flex-shrink-0">{row.label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EAE7DD]">
                    <span className="block h-full rounded-full bg-[#7A8B72]" style={{ width: `${row.pct}%` }} />
                  </div>
                  <span className="w-8 flex-shrink-0 text-right font-medium text-[#5D5B55]">{row.pct}%</span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delayMs={100} className="rounded-[16px] border border-[#E0DDD3] bg-white p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[13px] bg-[#7A8B72] text-white">
              <ShieldCheck size={22} aria-hidden="true" strokeWidth={2} />
            </div>
            <h3 className="text-[19px] font-semibold">Checks YouTube guidelines before you post</h3>
            <p className="mt-2 text-[14.5px] leading-6 text-[#706E68]">
              Every script is scanned for monetization and policy risk &mdash; copyright mentions,
              restricted claims, advertiser-unfriendly language &mdash; so you catch it before YouTube does.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <div className="flex items-start gap-2.5 rounded-[10px] border border-[#CFE0C8] bg-[#EFF3EA] px-3.5 py-2.5 text-[13px] text-[#3A3934]">
                <ShieldCheck size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-[#5C7A52]" />
                No policy risks flagged in this script
              </div>
              <div className="flex items-start gap-2.5 rounded-[10px] border border-[#E9D9B8] bg-[#FBF3E4] px-3.5 py-2.5 text-[13px] text-[#3A3934]">
                <ShieldAlert size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-[#B8863A]" />
                Mentions a brand name — worth verifying usage rights
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
