-- increment_script_usage/decrement_script_usage are SECURITY DEFINER and
-- were EXECUTE-granted to PUBLIC/anon by default, meaning anyone holding
-- the public anon key could call them over the REST API
-- (/rest/v1/rpc/increment_script_usage) with an arbitrary p_user_id and
-- tamper with any user's monthly quota counter, no login required.
-- Restrict execution to authenticated users and add an ownership check
-- inside each function so a logged-in user can only ever affect their own
-- quota, matching the RLS ownership model used elsewhere.
REVOKE EXECUTE ON FUNCTION public.increment_script_usage(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decrement_script_usage(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_script_usage(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_script_usage(uuid) TO authenticated;

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
    SET scripts_generated_month = v_count + 1,
        last_reset_date = v_today
    WHERE id = p_user_id;

  RETURN QUERY SELECT true, v_count + 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_script_usage(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Cannot modify another user''s quota';
  END IF;

  UPDATE public.users
    SET scripts_generated_month = GREATEST(scripts_generated_month - 1, 0)
    WHERE id = p_user_id;
END;
$$;

-- handle_new_user (auth.users trigger) and rls_auto_enable (DDL event
-- trigger) are only meant to be invoked by their respective triggers, but
-- were still publicly callable via /rest/v1/rpc/*. Neither does anything
-- useful called directly, but there's no reason to leave trigger-only
-- functions in the public RPC surface.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
