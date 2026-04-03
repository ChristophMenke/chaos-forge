-- last_accessed_at tracks when the owner last opened the character choice page.
-- Backfilled from updated_at for existing rows; new rows default to now() at insert time.

ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz NOT NULL DEFAULT now();

-- Backfill existing characters from updated_at (a reasonable proxy for last activity)
UPDATE public.characters SET last_accessed_at = updated_at;
