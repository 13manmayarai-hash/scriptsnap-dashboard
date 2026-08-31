-- Multi-format repurposer: platform-tailored variants of an existing
-- script (YouTube Shorts / TikTok / Instagram Reels), stored alongside
-- the original plain-text script rather than replacing it.
alter table public.scripts
  add column if not exists repurposed_variants jsonb;
