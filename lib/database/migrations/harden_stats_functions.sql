-- Harden get_tone_stats/get_top_keywords/update_tone_stats/update_keyword_stats
-- with an explicit ownership check (matching the pattern already used for
-- increment_script_usage/check_rate_limit/get_script_stats), a fixed
-- search_path, and anon revoked. reset_monthly_scripts takes no user_id at
-- all and does a bulk UPDATE across every user's row, so it's revoked from
-- anon/authenticated entirely rather than ownership-checked — it's a
-- maintenance job, not something a client should ever call directly.

CREATE OR REPLACE FUNCTION public.get_tone_stats(p_user_id uuid)
RETURNS TABLE(tone text, avg_rating numeric, times_used integer)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT tp.tone, tp.avg_rating, tp.times_used
  FROM public.tone_performance tp
  WHERE tp.user_id = p_user_id
  ORDER BY tp.avg_rating DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_top_keywords(p_user_id uuid, limit_count integer DEFAULT 5)
RETURNS TABLE(keyword text, avg_rating numeric)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT kp.keyword, kp.avg_rating
  FROM public.keyword_performance kp
  WHERE kp.user_id = p_user_id AND kp.avg_rating >= 3.5
  ORDER BY kp.avg_rating DESC, kp.times_used DESC
  LIMIT limit_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_tone_stats(p_user_id uuid, p_tone text, p_rating integer)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.tone_performance (user_id, tone, avg_rating, times_used, last_used)
  VALUES (p_user_id, p_tone, p_rating, 1, NOW())
  ON CONFLICT (user_id, tone)
  DO UPDATE SET
    avg_rating = (tone_performance.avg_rating * tone_performance.times_used + p_rating) / (tone_performance.times_used + 1),
    times_used = tone_performance.times_used + 1,
    last_used = NOW();
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_keyword_stats(p_user_id uuid, p_keywords text[], p_rating integer)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  keyword TEXT;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  FOREACH keyword IN ARRAY p_keywords
  LOOP
    INSERT INTO public.keyword_performance (user_id, keyword, avg_rating, times_used, last_used)
    VALUES (p_user_id, keyword, p_rating, 1, NOW())
    ON CONFLICT (user_id, keyword)
    DO UPDATE SET
      avg_rating = (keyword_performance.avg_rating * keyword_performance.times_used + p_rating) / (keyword_performance.times_used + 1),
      times_used = keyword_performance.times_used + 1,
      last_used = NOW();
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_monthly_scripts()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.users
  SET scripts_generated_month = 0
  WHERE last_reset_date < CURRENT_DATE;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_tone_stats(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_top_keywords(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_tone_stats(uuid, text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_keyword_stats(uuid, text[], integer) FROM anon;

REVOKE EXECUTE ON FUNCTION public.reset_monthly_scripts() FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_tone_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_keywords(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_tone_stats(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_keyword_stats(uuid, text[], integer) TO authenticated;
