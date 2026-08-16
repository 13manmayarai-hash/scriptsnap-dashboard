-- public.users has RLS enabled but no policies, which means deny-all for
-- anon/authenticated roles. This silently broke the app's own write paths:
-- razorpay/verify's tier-upgrade UPDATE matched 0 rows (payment never
-- persisted), and generate-script's SELECT returned null (tier silently
-- fell back to 'free' even for paid users). Add owner-only policies
-- matching the pattern already used correctly on scripts/script_ratings.
-- CREATE POLICY has no IF NOT EXISTS in Postgres; this file documents what
-- was already applied directly to the live project via the Supabase MCP
-- (mirroring this session's convention for schema that predates in-repo
-- migration history) and is safe to run once against a fresh environment.
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
