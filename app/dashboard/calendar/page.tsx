import { Calendar } from 'lucide-react'
import ComingSoon from '@/lib/components/ui/ComingSoon'

export default function CalendarPage() {
  return (
    <ComingSoon
      icon={Calendar}
      title="Calendar"
      description="Plan what you're posting and when, with scripts attached to each date — landing shortly."
    />
  )
}
