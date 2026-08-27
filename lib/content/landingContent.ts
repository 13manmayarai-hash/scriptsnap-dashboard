// Marketing copy and structured data for the landing page, kept separate
// from presentation so content can change without touching component code.

export const NAV_LINKS = [
  { href: '#hero', label: 'Product' },
  { href: '/dashboard/templates', label: 'Templates' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#how-it-works', label: 'Resources' },
]

export const BENEFITS = [
  {
    title: 'Write faster',
    description: 'Turn rough ideas into structured scripts.',
  },
  {
    title: 'Sound like yourself',
    description: 'Keep your voice, tone and personality.',
  },
  {
    title: 'Create consistently',
    description: 'Plan ideas, write scripts and stay on track.',
  },
  {
    title: 'Get more watch time',
    description: 'Hooks that grab attention.',
  },
]

export const HOW_IT_WORKS_STEPS = [
  {
    num: 1,
    title: 'Drop in your idea',
    description: 'Tell ScriptSnap what you want to talk about.',
  },
  {
    num: 2,
    title: 'Shape the voice',
    description: 'Choose your tone, audience and format.',
  },
  {
    num: 3,
    title: 'Get a ready-to-edit script',
    description: 'Refine it with AI tools until it sounds like you.',
  },
]

export const VOICE_COMPARISON = {
  generic: {
    label: 'Generic AI output',
    text: 'Bamboo is a fast-growing plant that can reach great heights.',
    badge: 'Sounds like AI',
  },
  scriptsnap: {
    label: 'Your ScriptSnap voice',
    text: '“This plant can grow several feet in a single day. But here’s the scary part…”',
    badge: 'Sounds human',
  },
}

export const CREATOR_VOICE_TRAITS = [
  { label: 'Conversational', active: true },
  { label: 'Curious', active: true },
  { label: 'Fast-paced', active: true },
  { label: 'Minimal filler', active: true },
  { label: 'Strong hooks', active: true },
]

// Not backed by real product data yet — kept in one place, clearly
// separate from the live creator count (which IS real, see
// /api/public/creator-count), so this can be swapped for a genuine
// testimonial without touching SocialProof.tsx.
export const TESTIMONIAL = {
  quote: 'Finally, something that doesn’t make my videos sound robotic.',
  attribution: 'Creator',
  rating: 5,
}

export const PRICING_TIERS = [
  {
    name: 'Free',
    tier: 'free' as const,
    price: 0,
    features: ['Limited scripts', 'Basic tools', 'Standard templates'],
    cta: 'Start creating',
    highlighted: false,
  },
  {
    // Display label only — the underlying tier id stays 'basic' to match
    // the live Razorpay checkout route and DB tier values untouched.
    name: 'Creator',
    tier: 'basic' as const,
    price: 199,
    features: ['More scripts', 'Full AI tools', 'Creator Voice', 'Advanced hooks'],
    cta: 'Start creating',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Pro',
    tier: 'pro' as const,
    price: 499,
    features: ['Higher limits', 'Advanced analysis', 'Multiple voices', 'Priority generation'],
    cta: 'Go Pro',
    highlighted: false,
  },
]

export const FOOTER_LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: 'mailto:hello@saveitok.com', label: 'Contact' },
]
