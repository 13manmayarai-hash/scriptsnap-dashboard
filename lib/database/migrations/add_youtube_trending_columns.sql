-- Cache for the Ideas page's "From your channel" / "Trending now"
-- suggestions (see lib/youtube/trending.ts) — same one-refresh-populates-
-- both-lists shape as cached_analytics_summary, so a single jsonb blob
-- rather than a separate table.
ALTER TABLE public.youtube_connections
  ADD COLUMN IF NOT EXISTS cached_trending_context jsonb,
  ADD COLUMN IF NOT EXISTS trending_context_cached_at timestamptz;
