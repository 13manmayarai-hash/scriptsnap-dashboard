-- Supports a fractional quota charge (used for the "Alternatives" hook
-- action, which now costs half a script generation instead of nothing) —
-- scripts_generated_month needs to hold values like 2.5, not just whole
-- integers.
ALTER TABLE public.users
  ALTER COLUMN scripts_generated_month TYPE numeric(10,1)
  USING scripts_generated_month::numeric(10,1);

-- Drop the old 2-arg signatures first — leaving both around would make a
-- 2-arg-style call (p_user_id, p_limit only) ambiguous between "the old
-- exact-arity function" and "the new function using p_amount's default",
-- since Postgres resolves overloads by signature, not just by name.
DROP FUNCTION IF EXISTS public.increment_script_usage(uuid, integer);
DROP FUNCTION IF EXISTS public.decrement_script_usage(uuid);

-- p_amount defaults to 1 so every existing caller (full script generation,
-- rewrite/shorten/expand/hook/tone-change) is unaffected — only the new
-- half-cost caller needs to pass p_amount explicitly.
CREATE OR REPLACE FUNCTION public.increment_script_usage(p_user_id UUID, p_limit INT, p_amount NUMERIC DEFAULT 1)
RETURNS TABLE(allowed BOOLEAN, new_count NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count NUMERIC;
  v_last_reset DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Cannot modify another user''s quota';
  END IF;

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
    SET scripts_generated_month = v_count + p_amount,
        last_reset_date = v_today
    WHERE id = p_user_id;

  RETURN QUERY SELECT true, v_count + p_amount;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_script_usage(p_user_id UUID, p_amount NUMERIC DEFAULT 1)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Cannot modify another user''s quota';
  END IF;

  UPDATE public.users
    SET scripts_generated_month = GREATEST(scripts_generated_month - p_amount, 0)
    WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_script_usage(uuid, integer, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decrement_script_usage(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_script_usage(uuid, integer, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_script_usage(uuid, numeric) TO authenticated;
