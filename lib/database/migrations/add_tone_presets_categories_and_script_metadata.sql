-- Real persistence + the new dashboard features (Tone Presets, Categories,
-- language output, guideline check) all build on top of public.scripts,
-- which already existed but was never written to — generation only ever
-- saved to the browser's localStorage. This migration adds the columns
-- and tables those features need.

ALTER TABLE public.scripts
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'english',
  ADD COLUMN IF NOT EXISTS guideline_passed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS guideline_flags jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.tone_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  style_description text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tone_presets_user_id ON public.tone_presets (user_id);

ALTER TABLE public.tone_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tone presets"
  ON public.tone_presets FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own tone presets"
  ON public.tone_presets FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own tone presets"
  ON public.tone_presets FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own tone presets"
  ON public.tone_presets FOR DELETE
  USING ((select auth.uid()) = user_id);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories (user_id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
  ON public.categories FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own categories"
  ON public.categories FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own categories"
  ON public.categories FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own categories"
  ON public.categories FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Seeds a new user's tone presets and categories with the defaults the
-- app already shipped with, so existing behavior (3 tones, 6 categories)
-- keeps working the first time someone opens the new management pages —
-- without this, a brand new user would see empty lists.
CREATE OR REPLACE FUNCTION public.seed_defaults_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.tone_presets (user_id, name, style_description) VALUES
    (NEW.id, 'Meditative', 'Calming language, reflective questions, a sense of mindfulness.'),
    (NEW.id, 'Balanced', 'Informative and engaging without being extreme.'),
    (NEW.id, 'Energetic', 'Exclamation marks, building excitement, a sense of urgency.');

  INSERT INTO public.categories (user_id, name) VALUES
    (NEW.id, 'Cultural & Historical'),
    (NEW.id, 'Art & Design'),
    (NEW.id, 'Science & Nature'),
    (NEW.id, 'Fashion & Style'),
    (NEW.id, 'Food & Craft'),
    (NEW.id, 'Tech & Engineering');

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.seed_defaults_for_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_user_created_seed_defaults ON public.users;
CREATE TRIGGER on_user_created_seed_defaults
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.seed_defaults_for_new_user();
