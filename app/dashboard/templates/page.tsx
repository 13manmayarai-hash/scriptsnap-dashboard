import { LayoutTemplate } from 'lucide-react'
import ComingSoon from '@/lib/components/ui/ComingSoon'

export default function TemplatesPage() {
  return (
    <ComingSoon
      icon={LayoutTemplate}
      title="Templates"
      description="Ready-made script structures (Hook → Context → Reveal, Problem → Tension → Solution, and more) you can start a script from — landing shortly."
    />
  )
}
