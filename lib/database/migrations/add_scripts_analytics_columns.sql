-- Records whether a script's generation was tuned using the creator's
-- stored YouTube channel analytics, and Claude's short natural-language
-- explanation of how — surfaced in the script workspace UI. Both default
-- to "not used" so existing rows and users without a YouTube connection
-- are unaffected.
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS used_analytics_context boolean NOT NULL DEFAULT false;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS analytics_strategy_note text;
