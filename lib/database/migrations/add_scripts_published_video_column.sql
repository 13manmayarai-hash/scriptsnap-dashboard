-- Lets a script be linked to the real YouTube video it was used for, so
-- the script workspace can show that video's real performance (retention,
-- CTR, views) next to whichever hook/script text was actually published —
-- closing the loop between "what we generated" and "how it did."
ALTER TABLE public.scripts
  ADD COLUMN IF NOT EXISTS published_video_id text;
