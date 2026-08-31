-- Burst-abuse protection. The existing scripts_generated_month/quota RPCs
-- correctly cap total usage per calendar month, but nothing stops a single
-- user from firing requests back-to-back within that monthly allowance —
-- each one still triggers a real (billable) Anthropic and/or YouTube API
-- call. This adds a short fixed-window limiter, independent of the monthly
-- quota, applied per (user, route).
--
-- Deny-by-default like every other table here: RLS is enabled with no
-- policies, so it's unreachable directly over the REST API by anon or
-- authenticated roles — the only access path is the SECURITY DEFINER RPC
-- below, which runs as the table owner and is therefore not subject to RLS.
CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id UUID NOT NULL,
  route TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, route)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Fixed-window check-and-increment, same FOR UPDATE row-locking pattern as
-- increment_script_usage so concurrent requests from the same user can't
-- both read a pre-increment count and both pass.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_route TEXT,
  p_max_requests INT,
  p_window_seconds INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INT;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Cannot check another user''s rate limit';
  END IF;

  SELECT window_start, request_count INTO v_window_start, v_count
    FROM public.rate_limits
    WHERE user_id = p_user_id AND route = p_route
    FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.rate_limits (user_id, route, window_start, request_count)
    VALUES (p_user_id, p_route, now(), 1);
    RETURN true;
  END IF;

  IF now() - v_window_start > make_interval(secs => p_window_seconds) THEN
    UPDATE public.rate_limits
      SET window_start = now(), request_count = 1
      WHERE user_id = p_user_id AND route = p_route;
    RETURN true;
  END IF;

  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;

  UPDATE public.rate_limits
    SET request_count = request_count + 1
    WHERE user_id = p_user_id AND route = p_route;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, int, int) TO authenticated;
