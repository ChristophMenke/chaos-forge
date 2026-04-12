-- Skip tutorials for users that existed before this feature shipped.
-- New users (registered after this migration) will see the tutorials as intended.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS skip_tutorials boolean NOT NULL DEFAULT false;

-- Backfill: everyone present right now is considered "already knows the app".
UPDATE public.profiles SET skip_tutorials = true;
