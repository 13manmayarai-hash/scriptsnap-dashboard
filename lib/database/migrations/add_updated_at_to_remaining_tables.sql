-- calendar_entries, categories, and tone_presets were missing updated_at,
-- unlike every other user-owned table. Adds the column plus a trigger that
-- actually keeps it current on every UPDATE, rather than a column app code
-- would need to remember to set manually on every write path.

create extension if not exists moddatetime schema extensions;

alter table public.calendar_entries add column if not exists updated_at timestamp default now();
alter table public.categories add column if not exists updated_at timestamp default now();
alter table public.tone_presets add column if not exists updated_at timestamp default now();

drop trigger if exists set_updated_at on public.calendar_entries;
create trigger set_updated_at before update on public.calendar_entries
  for each row execute procedure extensions.moddatetime(updated_at);

drop trigger if exists set_updated_at on public.categories;
create trigger set_updated_at before update on public.categories
  for each row execute procedure extensions.moddatetime(updated_at);

drop trigger if exists set_updated_at on public.tone_presets;
create trigger set_updated_at before update on public.tone_presets
  for each row execute procedure extensions.moddatetime(updated_at);
