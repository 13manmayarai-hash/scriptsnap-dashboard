-- Cache for the Analytics page's YouTube Studio-style performance
-- dashboard (see lib/youtube/performance.ts) — daily trend data, top
-- videos, AI-written what's-working/not/suggestions, and competitor
-- videos all come from one refresh, so a single jsonb blob rather than
-- several tables, matching cached_trending_context/cached_analytics_summary.
ALTER TABLE public.youtube_connections
  ADD COLUMN IF NOT EXISTS cached_performance_context jsonb,
  ADD COLUMN IF NOT EXISTS performance_context_cached_at timestamptz;
