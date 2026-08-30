-- tone_performance and keyword_performance already exist live (created
-- directly in Supabase, predating this migrations folder -- captured here
-- as CREATE TABLE IF NOT EXISTS purely so a fresh environment provisioned
-- from these migrations alone would match reality). Both had RLS enabled
-- with zero policies, which is why the feature never worked end to end
-- even after the RPC ownership-check hardening in harden_stats_functions.sql
-- -- SECURITY INVOKER functions still run under RLS as the calling user.

CREATE TABLE IF NOT EXISTS public.tone_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tone text NOT NULL,
  avg_rating numeric,
  times_used integer DEFAULT 0,
  last_used timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE (user_id, tone)
);

CREATE TABLE IF NOT EXISTS public.keyword_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  avg_rating numeric,
  times_used integer DEFAULT 0,
  last_used timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE (user_id, keyword)
);

ALTER TABLE public.tone_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_performance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tone performance" ON public.tone_performance;
CREATE POLICY "Users can view own tone performance"
  ON public.tone_performance FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own tone performance" ON public.tone_performance;
CREATE POLICY "Users can insert own tone performance"
  ON public.tone_performance FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own tone performance" ON public.tone_performance;
CREATE POLICY "Users can update own tone performance"
  ON public.tone_performance FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own keyword performance" ON public.keyword_performance;
CREATE POLICY "Users can view own keyword performance"
  ON public.keyword_performance FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own keyword performance" ON public.keyword_performance;
CREATE POLICY "Users can insert own keyword performance"
  ON public.keyword_performance FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own keyword performance" ON public.keyword_performance;
CREATE POLICY "Users can update own keyword performance"
  ON public.keyword_performance FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
