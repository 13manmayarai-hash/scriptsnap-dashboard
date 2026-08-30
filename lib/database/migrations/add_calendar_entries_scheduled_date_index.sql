-- calendar_entries had no index covering scheduled_date, so every
-- ORDER BY scheduled_date (calendar page) and WHERE scheduled_date >= ...
-- (dashboard "upcoming content" widget) requires a sort/scan over all of
-- a user's rows. Composite on (user_id, scheduled_date) covers both the
-- existing user_id-only lookups and the date filtering/ordering in one
-- index.
CREATE INDEX IF NOT EXISTS idx_calendar_entries_user_id_scheduled_date
  ON public.calendar_entries (user_id, scheduled_date);
