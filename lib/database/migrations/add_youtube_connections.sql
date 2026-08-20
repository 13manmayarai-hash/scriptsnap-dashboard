-- One row per ScriptSnap user connecting their YouTube channel (separate,
-- optional step from login — see app/api/youtube/*). user_id is the
-- primary key directly rather than a separate uuid id, since the
-- relationship is strictly 1:1 (one channel connection per account) —
-- deviates from the id+indexed-user_id pattern used elsewhere in this
-- directory intentionally, so the upsert in the OAuth callback is a plain
-- ON CONFLICT (user_id) with no extra lookup.
CREATE TABLE IF NOT EXISTS public.youtube_connections (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  -- Plaintext, matching this app's existing pattern of no app-level
  -- encryption for sensitive values (Razorpay/Anthropic keys are also
  -- plain env vars) — protected here by RLS (only the owning user's own
  -- session can ever read/write their row) + Supabase infra access
  -- control, not by column encryption. Future hardening option: encrypt
  -- with pgcrypto (pgp_sym_encrypt) once this app adopts server-side
  -- secret management beyond env vars — not blocking for MVP.
  google_refresh_token text NOT NULL,
  youtube_channel_id text NOT NULL,
  youtube_channel_title text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  -- Set true when a stored refresh token stops working (user revoked
  -- access from their Google Account, or Google expired it) so the UI can
  -- prompt reconnect instead of the analytics fetch failing silently
  -- forever on every script generation.
  needs_reconnect boolean NOT NULL DEFAULT false,
  -- Analytics summary cache — channel performance doesn't change minute
  -- to minute, so generate-script reads this instead of calling the
  -- YouTube Data/Analytics APIs on every single request. Refreshed when
  -- stale (see lib/youtube/analytics.ts) or via "Sync now" in Settings.
  cached_analytics_summary text,
  analytics_cached_at timestamptz
);

ALTER TABLE public.youtube_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own youtube connection"
  ON public.youtube_connections FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own youtube connection"
  ON public.youtube_connections FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own youtube connection"
  ON public.youtube_connections FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own youtube connection"
  ON public.youtube_connections FOR DELETE
  USING ((select auth.uid()) = user_id);
