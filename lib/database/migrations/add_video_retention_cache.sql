-- Per-video retention-curve cache for the retention-dip mapping feature.
-- Separate from youtube_connections' single cached_performance_context
-- blob because this is keyed per-video, not per-channel, and a creator
-- may want curves for several of their videos at once.

create table if not exists public.video_retention_cache (
  video_id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  video_duration_seconds integer,
  retention_curve jsonb not null,
  dips jsonb not null,
  cached_at timestamptz not null default now()
);

create index if not exists idx_video_retention_cache_user_id
  on public.video_retention_cache (user_id);

alter table public.video_retention_cache enable row level security;

drop policy if exists "Users can view own video retention cache" on public.video_retention_cache;
create policy "Users can view own video retention cache"
  on public.video_retention_cache for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own video retention cache" on public.video_retention_cache;
create policy "Users can insert own video retention cache"
  on public.video_retention_cache for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own video retention cache" on public.video_retention_cache;
create policy "Users can update own video retention cache"
  on public.video_retention_cache for update
  using ((select auth.uid()) = user_id);
