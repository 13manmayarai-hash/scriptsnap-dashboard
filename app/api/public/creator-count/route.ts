import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Must stay dynamic — a static build would bake in whatever count existed
// at build time and never update, defeating the point of a live counter.
export const dynamic = 'force-dynamic'

// Public, unauthenticated, read-only — returns only an aggregate count
// (never row data), so it's safe to expose to the marketing homepage
// without going through RLS. Used to show a real, honestly-growing
// creator count instead of a hardcoded/fabricated one.
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return NextResponse.json({ count: count ?? 0 })
  } catch (err) {
    console.error('creator-count failed:', err)
    return NextResponse.json({ count: null })
  }
}
