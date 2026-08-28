-- Replaces the dashboard's previous pattern of pulling every script's
-- word_count/tone/category to the client just to compute a few aggregate
-- numbers (avg word count, most-used tone/category). Fine at a handful of
-- scripts, a real per-request cost once a creator has hundreds — this does
-- the aggregation in Postgres against the existing idx_scripts_user_id
-- index instead of transferring every row.
CREATE OR REPLACE FUNCTION public.get_script_stats(p_user_id UUID)
RETURNS TABLE(total_scripts INT, avg_word_count INT, top_tone TEXT, top_category TEXT)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Cannot read another user''s script stats';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::INT,
    COALESCE(ROUND(AVG(s.word_count))::INT, 0),
    MODE() WITHIN GROUP (ORDER BY s.tone) FILTER (WHERE s.tone IS NOT NULL),
    MODE() WITHIN GROUP (ORDER BY s.category) FILTER (WHERE s.category IS NOT NULL)
  FROM public.scripts s
  WHERE s.user_id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_script_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_script_stats(uuid) TO authenticated;
