-- Thumbs up/down on individual Ask AI replies, same owner-only RLS shape
-- and upsert-able unique key as script_ratings (see
-- add_script_ratings_constraints_and_policies.sql) -- one rating per
-- (message, user), toggle-able via upsert/delete from the client.
CREATE TABLE IF NOT EXISTS public.chat_message_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chat_message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_message_ratings_message_id ON public.chat_message_ratings (chat_message_id);

ALTER TABLE public.chat_message_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat message ratings"
  ON public.chat_message_ratings FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own chat message ratings"
  ON public.chat_message_ratings FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own chat message ratings"
  ON public.chat_message_ratings FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own chat message ratings"
  ON public.chat_message_ratings FOR DELETE
  USING ((select auth.uid()) = user_id);
