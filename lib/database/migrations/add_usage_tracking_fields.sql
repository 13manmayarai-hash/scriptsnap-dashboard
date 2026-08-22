-- Document the usage-tracking columns on `users` that already exist on the
-- live database but were never captured in a checked-in migration
-- (added out-of-band before this migration history existed). Written as
-- ADD COLUMN IF NOT EXISTS so it's a no-op against the current live schema
-- and only matters for a fresh environment provisioned from these files.
ALTER TABLE users ADD COLUMN IF NOT EXISTS scripts_generated_month INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;
