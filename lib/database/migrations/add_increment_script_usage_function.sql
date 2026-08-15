-- Atomic quota check-and-increment. Replaces a read-then-write pattern in
-- app/api/generate-script/route.ts where two concurrent requests from the
-- same user could both read the same pre-increment count and both pass the
-- tier limit check before either wrote back. Locking the row with
-- `FOR UPDATE` serializes concurrent calls for the same user, so the check
-- and the increment happen atomically within one transaction.
CREATE OR REPLACE FUNCTION public.increment_script_usage(p_user_id UUID, p_limit INT)
RETURNS TABLE(allowed BOOLEAN, new_count INT)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_last_reset DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT scripts_generated_month, last_reset_date
    INTO v_count, v_last_reset
    FROM public.users
    WHERE id = p_user_id
    FOR UPDATE;

  IF v_last_reset IS NULL OR date_trunc('month', v_last_reset) <> date_trunc('month', v_today) THEN
    v_count := 0;
  END IF;

  IF v_count >= p_limit THEN
    RETURN QUERY SELECT false, v_count;
    RETURN;
  END IF;

  UPDATE public.users
    SET scripts_generated_month = v_count + 1,
        last_reset_date = v_today
    WHERE id = p_user_id;

  RETURN QUERY SELECT true, v_count + 1;
END;
$$;

-- Compensating decrement for when quota was reserved but the downstream
-- Anthropic call then failed, so a failed generation doesn't cost the user
-- a script from their monthly quota.
CREATE OR REPLACE FUNCTION public.decrement_script_usage(p_user_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.users
    SET scripts_generated_month = GREATEST(scripts_generated_month - 1, 0)
    WHERE id = p_user_id;
$$;
