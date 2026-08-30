-- Functions get EXECUTE granted to the PUBLIC pseudo-role by default on
-- creation in Postgres. The previous migration's "REVOKE EXECUTE ... FROM
-- anon" had no effect because anon still inherited access via PUBLIC.
-- Revoke from PUBLIC directly, then grant back only to authenticated
-- where appropriate.

REVOKE EXECUTE ON FUNCTION public.get_tone_stats(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_top_keywords(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_tone_stats(uuid, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_keyword_stats(uuid, text[], integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reset_monthly_scripts() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_tone_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_keywords(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_tone_stats(uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_keyword_stats(uuid, text[], integer) TO authenticated;
