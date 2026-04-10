-- Add proficiency_name to weapons to separate display name from proficiency category
-- Default to name for backwards compat (seeded weapons have identical display/prof names)
ALTER TABLE weapons ADD COLUMN IF NOT EXISTS proficiency_name text;

-- Backfill: set proficiency_name to name for existing rows
UPDATE weapons SET proficiency_name = name WHERE proficiency_name IS NULL;
