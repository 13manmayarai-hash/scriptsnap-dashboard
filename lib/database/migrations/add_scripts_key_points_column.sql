-- key_points is generated alongside every script (see
-- app/api/generate-script/route.ts) but was never persisted, so it
-- silently vanished on reload/navigation instead of surviving with the
-- rest of the generation.
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS key_points jsonb DEFAULT '[]'::jsonb;
