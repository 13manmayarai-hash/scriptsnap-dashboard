-- The first 10 Ask AI messages each month are free (don't draw from the
-- monthly script quota) so a creator can try the chat feature without it
-- eating into their generation allowance. Tracked separately from
-- scripts_generated_month, reset on the same monthly rollover.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS chat_free_messages_used INT NOT NULL DEFAULT 0;

-- Chat-specific version of increment_script_usage: spends a free message
-- first (up to p_free_limit per month), and only once those are used up
-- does it fall back to charging the regular script quota (p_amount, same
-- 0.25-per-message cost already in use). Locks the row FOR UPDATE so
-- concurrent chat messages from the same user can't both observe the same
-- pre-increment free-message count.
CREATE OR REPLACE FUNCTION public.increment_chat_usage(
  p_user_id UUID,
  p_limit INT,
  p_free_limit INT DEFAULT 10,
  p_amount NUMERIC DEFAULT 0.25
)
RETURNS TABLE(allowed BOOLEAN, used_free BOOLEAN, new_count NUMERIC, free_used INT)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count NUMERIC;
  v_free_used INT;
  v_last_reset DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Cannot modify another user''s quota';
  END IF;

  SELECT scripts_generated_month, chat_free_messages_used, last_reset_date
    INTO v_count, v_free_used, v_last_reset
    FROM public.users
    WHERE id = p_user_id
    FOR UPDATE;

  IF v_last_reset IS NULL OR date_trunc('month', v_last_reset) <> date_trunc('month', v_today) THEN
    v_count := 0;
    v_free_used := 0;
  END IF;

  IF v_free_used < p_free_limit THEN
    UPDATE public.users
      SET chat_free_messages_used = v_free_used + 1,
          scripts_generated_month = v_count,
          last_reset_date = v_today
      WHERE id = p_user_id;
    RETURN QUERY SELECT true, true, v_count, v_free_used + 1;
    RETURN;
  END IF;

  IF v_count >= p_limit THEN
    RETURN QUERY SELECT false, false, v_count, v_free_used;
    RETURN;
  END IF;

  UPDATE public.users
    SET scripts_generated_month = v_count + p_amount,
        chat_free_messages_used = v_free_used,
        last_reset_date = v_today
    WHERE id = p_user_id;

  RETURN QUERY SELECT true, false, v_count + p_amount, v_free_used;
END;
$$;

-- Compensating refund for when a free-message or quota reservation was
-- taken but the downstream Anthropic call then failed.
CREATE OR REPLACE FUNCTION public.decrement_chat_usage(
  p_user_id UUID,
  p_used_free BOOLEAN,
  p_amount NUMERIC DEFAULT 0.25
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Cannot modify another user''s quota';
  END IF;

  IF p_used_free THEN
    UPDATE public.users
      SET chat_free_messages_used = GREATEST(chat_free_messages_used - 1, 0)
      WHERE id = p_user_id;
  ELSE
    UPDATE public.users
      SET scripts_generated_month = GREATEST(scripts_generated_month - p_amount, 0)
      WHERE id = p_user_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_chat_usage(uuid, integer, integer, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decrement_chat_usage(uuid, boolean, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_chat_usage(uuid, integer, integer, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_chat_usage(uuid, boolean, numeric) TO authenticated;
