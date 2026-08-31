-- Feature C: the structured {title, targetWPM, blocks:[...]} shooting
-- script, generated on demand from an existing script's text rather than
-- replacing generate-script's own output shape (library, PDF export,
-- ratings, and everything else already depend on the plain-text script
-- column staying as-is).
alter table public.scripts
  add column if not exists structured_blocks jsonb;
