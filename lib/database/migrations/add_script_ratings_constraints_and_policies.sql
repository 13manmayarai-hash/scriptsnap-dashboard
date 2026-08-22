-- script_ratings existed with SELECT/INSERT policies only (see
-- optimize_rls_policies_and_indexes.sql) but no way for a user to change
-- or clear their own rating, and no constraint stopping duplicate rows for
-- the same script_id/user_id pair. Adding what the thumbs up/down UI needs:
-- a upsert-able unique key, a value check, and owner UPDATE/DELETE policies.

ALTER TABLE public.script_ratings
  ADD CONSTRAINT script_ratings_script_user_unique UNIQUE (script_id, user_id);

ALTER TABLE public.script_ratings
  ADD CONSTRAINT script_ratings_rating_check CHECK (rating IN (-1, 1));

CREATE POLICY "Users can update own ratings"
  ON public.script_ratings FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own ratings"
  ON public.script_ratings FOR DELETE
  USING ((select auth.uid()) = user_id);
