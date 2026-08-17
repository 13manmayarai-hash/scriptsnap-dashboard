-- Phase 5 of the UI refactor: real Ideas and Calendar features, replacing
-- the "coming soon" placeholder pages. Both follow the same owner-only RLS
-- pattern already used on scripts/tone_presets/categories.

CREATE TABLE IF NOT EXISTS public.ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'used')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON public.ideas (user_id);

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ideas"
  ON public.ideas FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own ideas"
  ON public.ideas FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own ideas"
  ON public.ideas FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own ideas"
  ON public.ideas FOR DELETE
  USING ((select auth.uid()) = user_id);


CREATE TABLE IF NOT EXISTS public.calendar_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  script_id uuid REFERENCES public.scripts(id) ON DELETE SET NULL,
  title text NOT NULL,
  scheduled_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_entries_user_id ON public.calendar_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_script_id ON public.calendar_entries (script_id);

ALTER TABLE public.calendar_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar entries"
  ON public.calendar_entries FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own calendar entries"
  ON public.calendar_entries FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own calendar entries"
  ON public.calendar_entries FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own calendar entries"
  ON public.calendar_entries FOR DELETE
  USING ((select auth.uid()) = user_id);
