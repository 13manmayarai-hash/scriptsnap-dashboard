'use client'

import { useRouter } from 'next/navigation'
import {
  LayoutTemplate, ArrowRight, Rocket, GraduationCap, BookOpen,
  Star, MessageSquare, ListOrdered, Eye, Zap,
} from 'lucide-react'

const ACCENT_COLORS = [
  'bg-sage/15 text-sage',
  'bg-accent-slate/15 text-accent-slate',
  'bg-accent-plum/15 text-accent-plum',
  'bg-accent-ochre/15 text-accent-ochre',
  'bg-accent-clay/15 text-accent-clay',
  'bg-accent-teal/15 text-accent-teal',
  'bg-accent-umber/15 text-accent-umber',
]

const TEMPLATES = [
  {
    name: 'YouTube Short',
    description: 'A reliable general-purpose Shorts structure.',
    context: 'Structure: open with a hook in the first sentence, deliver the core idea in the middle, end with a punchy takeaway or call to action.',
    icon: Rocket,
  },
  {
    name: 'Educational',
    description: 'Teach one clear idea, fast.',
    context: 'Structure: state what the viewer will learn, explain it simply with one concrete example, end with why it matters.',
    icon: GraduationCap,
  },
  {
    name: 'Storytelling',
    description: 'A short narrative arc.',
    context: 'Structure: set up a situation, build tension or curiosity, resolve it with a satisfying or surprising ending.',
    icon: BookOpen,
  },
  {
    name: 'Product Review',
    description: 'Quick verdict format.',
    context: 'Structure: say what the product is, give one standout pro, one honest con, and a clear verdict.',
    icon: Star,
  },
  {
    name: 'Commentary',
    description: 'Your take on something.',
    context: 'Structure: state the topic, give your opinion clearly, back it up with one reason, invite disagreement in the comments.',
    icon: MessageSquare,
  },
  {
    name: 'Listicle',
    description: 'A countdown or list format.',
    context: 'Structure: introduce the list and its size, deliver each item briefly and punchily, end with the strongest or most surprising item.',
    icon: ListOrdered,
  },
  {
    name: 'Hook → Context → Reveal',
    description: 'Classic curiosity-gap structure.',
    context: 'Structure: open with an intriguing hook, give just enough context to build curiosity, deliver a satisfying reveal at the end.',
    icon: Eye,
  },
  {
    name: 'Problem → Tension → Solution',
    description: 'Pain-point framing.',
    context: 'Structure: state a relatable problem, build tension around why it matters, resolve with a clear solution or insight.',
    icon: Zap,
  },
]

export default function TemplatesPage() {
  const router = useRouter()

  const useTemplate = (context: string) => {
    router.push(`/dashboard/new?context=${encodeURIComponent(context)}`)
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-2 flex items-center gap-3">
        <LayoutTemplate size={24} aria-hidden="true" className="text-sage" />
        <h1 className="text-2xl font-bold heading-serif">Templates</h1>
      </div>
      <p className="mb-6 text-sm text-ink-muted">
        Pick a structure — it pre-fills the generator so you just add your topic.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TEMPLATES.map((template, i) => (
          <button
            key={template.name}
            onClick={() => useTemplate(template.context)}
            className="card-hover flex flex-col items-start text-left"
          >
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${ACCENT_COLORS[i % ACCENT_COLORS.length]}`}>
              <template.icon size={16} aria-hidden="true" />
            </div>
            <p className="mb-1 text-sm font-semibold text-ink">{template.name}</p>
            <p className="mb-3 text-xs text-ink-muted">{template.description}</p>
            <span className="mt-auto flex items-center gap-1 text-xs font-medium text-sage">
              Use template <ArrowRight size={13} aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
