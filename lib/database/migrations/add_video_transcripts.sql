-- Real YouTube caption-based transcripts (VoicePrint Feature A), separate
-- from voice_profiles (the Claude-summarized profile) and from scripts
-- (ScriptSnap's own generated text) — this is the raw per-video source
-- material captions.download returns, kept so VoicePrint can be rebuilt
-- from it without re-fetching every time.

create table if not exists public.video_transcripts (
  video_id text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  title text,
  transcript text not null,
  is_auto_generated boolean not null default false,
  video_duration_seconds integer,
  ingested_at timestamptz not null default now()
);

create index if not exists idx_video_transcripts_user_id
  on public.video_transcripts (user_id);

alter table public.video_transcripts enable row level security;

drop policy if exists "Users can view own video transcripts" on public.video_transcripts;
create policy "Users can view own video transcripts"
  on public.video_transcripts for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own video transcripts" on public.video_transcripts;
create policy "Users can insert own video transcripts"
  on public.video_transcripts for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own video transcripts" on public.video_transcripts;
create policy "Users can update own video transcripts"
  on public.video_transcripts for update
  using ((select auth.uid()) = user_id);
