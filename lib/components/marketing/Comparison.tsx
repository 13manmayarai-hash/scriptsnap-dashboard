import { Check, X as XIcon } from 'lucide-react'
import { Reveal } from './Shared'

const COMPARE_COLUMNS = [
  {
    name: 'Generic AI writers',
    tag: "ChatGPT, Claude, vidIQ's free generator",
    featured: false,
    rows: [
      { yes: false, text: 'Re-explain your voice every session' },
      { yes: false, text: 'No YouTube policy risk-checking built in' },
      { yes: true, text: 'Free or cheap to try' },
      { yes: false, text: 'Not YouTube-Shorts-structured by default' },
    ],
  },
  {
    name: 'ScriptSnap',
    tag: 'Built for solo Shorts creators',
    featured: true,
    rows: [
      { yes: true, text: 'Trained on your own videos, learns further every session' },
      { yes: true, text: 'Built-in YouTube guideline risk check' },
      { yes: true, text: 'Regional language support — Hindi, Tamil, Telugu & more' },
      { yes: true, text: 'INR pricing, Razorpay billing, built for solo creators' },
    ],
  },
  {
    name: 'Agency brand-voice tools',
    tag: 'Jasper and similar',
    featured: false,
    rows: [
      { yes: true, text: 'Real brand-voice training' },
      { yes: false, text: 'Priced and packaged for agencies ($49/mo+)' },
      { yes: false, text: 'General marketing copy, not Shorts-native' },
      { yes: false, text: 'Built for teams, not a solo creator' },
    ],
  },
]

export default function Comparison() {
  return (
    <section className="border-t border-[#E2DFD6] bg-[#F1EFE8] py-20 sm:py-28">
      <div className="mx-auto max-w-[1380px] px-6 lg:px-10">
        <Reveal className="mx-auto mb-14 max-w-[660px] text-center">
          <h2 className="text-[clamp(28px,4vw,42px)] font-semibold tracking-[-0.02em] text-balance">
            Built for one creator&rsquo;s voice &mdash; not everyone&rsquo;s average
          </h2>
          <p className="mt-4 text-[16px] text-[#706E68]">
            Most AI writing tools either give you a generic template or price real personalization
            for an agency budget. ScriptSnap does neither.
          </p>
        </Reveal>
        <Reveal className="grid overflow-hidden rounded-[16px] border border-[#E0DDD3] md:grid-cols-3">
          {COMPARE_COLUMNS.map((col, i) => (
            <div
              key={col.name}
              className={`relative p-8 ${i < 2 ? 'border-b border-[#E0DDD3] md:border-b-0 md:border-r' : ''} ${
                col.featured ? 'bg-[#EFF1E8]' : 'bg-white'
              }`}
            >
              <h4 className="relative z-10 text-[16px] font-semibold">{col.name}</h4>
              <span className="relative z-10 mt-1 block text-[12px] text-[#9C9686]">{col.tag}</span>
              <ul className="relative z-10 mt-5 flex flex-col gap-3">
                {col.rows.map((row, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-[14px] text-[#4A4842]">
                    {row.yes ? (
                      <Check size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-[#5C7A52]" />
                    ) : (
                      <XIcon size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-[#B0796B]" />
                    )}
                    {row.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
