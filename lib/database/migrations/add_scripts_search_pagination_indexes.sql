-- Library page previously fetched up to 200 rows per user and sorted/filtered
-- client-side. This adds what real server-side pagination + search needs:
-- a composite (user_id, sort-column) index per supported sort, and trigram
-- GIN indexes so `ilike '%term%'` on topic/title can actually use an index
-- instead of a sequential scan.

create extension if not exists pg_trgm with schema extensions;

create index if not exists idx_scripts_user_id_created_at
  on public.scripts (user_id, created_at desc);

create index if not exists idx_scripts_user_id_word_count
  on public.scripts (user_id, word_count desc);

create index if not exists idx_scripts_topic_trgm
  on public.scripts using gin (topic extensions.gin_trgm_ops);

create index if not exists idx_scripts_title_trgm
  on public.scripts using gin (title extensions.gin_trgm_ops);
