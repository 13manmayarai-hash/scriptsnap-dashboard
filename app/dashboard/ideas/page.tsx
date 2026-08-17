import { Lightbulb } from 'lucide-react'
import ComingSoon from '@/lib/components/ui/ComingSoon'

export default function IdeasPage() {
  return (
    <ComingSoon
      icon={Lightbulb}
      title="Ideas"
      description="A lightweight place to jot down Shorts ideas and turn them into scripts when you're ready — landing shortly."
    />
  )
}
