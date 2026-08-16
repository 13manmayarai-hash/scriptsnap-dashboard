-- Supabase's performance advisor (auth_rls_initplan) flagged 8 policies
-- across public.users, public.scripts, and public.script_ratings that call
-- auth.uid() directly in the policy expression. Postgres re-evaluates a
-- bare function call once per row scanned under RLS; wrapping it in a
-- scalar subquery — (select auth.uid()) — lets the planner treat it as a
-- stable InitPlan evaluated once per query instead, which is Supabase's
-- documented fix (see references/security-rls-performance.md in the
-- supabase-postgres-best-practices skill). Functionally identical policies,
-- just faster at any real row count. CREATE POLICY has no OR REPLACE, so
-- each policy must be dropped and recreated.

DROP POLICY "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING ((select auth.uid()) = id);

DROP POLICY "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY "Users can view own scripts" ON public.scripts;
CREATE POLICY "Users can view own scripts"
  ON public.scripts FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY "Users can create scripts" ON public.scripts;
CREATE POLICY "Users can create scripts"
  ON public.scripts FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY "Users can update own scripts" ON public.scripts;
CREATE POLICY "Users can update own scripts"
  ON public.scripts FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY "Users can delete own scripts" ON public.scripts;
CREATE POLICY "Users can delete own scripts"
  ON public.scripts FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY "Users can view own ratings" ON public.script_ratings;
CREATE POLICY "Users can view own ratings"
  ON public.script_ratings FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY "Users can create ratings" ON public.script_ratings;
CREATE POLICY "Users can create ratings"
  ON public.script_ratings FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- Supabase's advisor also flagged script_ratings.script_id (a foreign key
-- to scripts.id) as an unindexed FK — Postgres does not auto-index FK
-- columns, so joins/deletes on this column would force a full table scan
-- as script_ratings grows.
CREATE INDEX IF NOT EXISTS idx_script_ratings_script_id
  ON public.script_ratings (script_id);
