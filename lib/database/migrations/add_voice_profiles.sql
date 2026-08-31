-- VoicePrint: a persistent per-creator voice profile, built from the
-- creator's own accumulated ScriptSnap scripts (not external YouTube
-- video transcripts — captions.download requires the youtube.force-ssl
-- scope, which is broader than this app's current youtube.readonly grant
-- and would force every already-connected user to reconnect. Using
-- already-owned script text needs no new OAuth scope at all).

create table if not exists public.voice_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  analysis_summary text not null,
  script_count_analyzed integer not null default 0,
  last_analyzed_at timestamp not null default now(),
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

alter table public.voice_profiles enable row level security;

drop policy if exists "Users can view own voice profile" on public.voice_profiles;
create policy "Users can view own voice profile"
  on public.voice_profiles for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own voice profile" on public.voice_profiles;
create policy "Users can insert own voice profile"
  on public.voice_profiles for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own voice profile" on public.voice_profiles;
create policy "Users can update own voice profile"
  on public.voice_profiles for update
  using ((select auth.uid()) = user_id);

drop trigger if exists set_updated_at on public.voice_profiles;
create trigger set_updated_at before update on public.voice_profiles
  for each row execute procedure extensions.moddatetime(updated_at);
