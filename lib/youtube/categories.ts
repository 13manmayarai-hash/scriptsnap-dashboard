// Plain data only, no server SDKs — safe to import from both server
// routes/lib code and client components (unlike lib/youtube/trending.ts,
// which pulls in googleapis + the Anthropic SDK).

export const CATEGORY_OPTIONS: { id: string; label: string }[] = [
  { id: '1', label: 'Film & Animation' },
  { id: '2', label: 'Autos & Vehicles' },
  { id: '10', label: 'Music' },
  { id: '15', label: 'Pets & Animals' },
  { id: '17', label: 'Sports' },
  { id: '19', label: 'Travel & Events' },
  { id: '20', label: 'Gaming' },
  { id: '22', label: 'People & Blogs' },
  { id: '23', label: 'Comedy' },
  { id: '24', label: 'Entertainment' },
  { id: '25', label: 'News & Politics' },
  { id: '26', label: 'Howto & Style' },
  { id: '27', label: 'Education' },
  { id: '28', label: 'Science & Technology' },
  { id: '29', label: 'Nonprofits & Activism' },
]

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((c) => [c.id, c.label])
)

// Curated, not exhaustive — this app's audience is Indian creators first,
// plus a few other large English/Hindi-adjacent-reach markets. A full
// ISO-3166 list would make the picker unusable.
export const REGION_OPTIONS: { code: string; label: string }[] = [
  { code: 'IN', label: 'India' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'PK', label: 'Pakistan' },
  { code: 'BD', label: 'Bangladesh' },
  { code: 'PH', label: 'Philippines' },
  { code: 'ID', label: 'Indonesia' },
  { code: 'NG', label: 'Nigeria' },
]
