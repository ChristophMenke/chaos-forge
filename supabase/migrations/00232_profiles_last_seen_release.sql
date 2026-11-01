-- 1. Release notes: id of the newest release the user has dismissed (YYYY-MM-DD[-n]).
--    NULL = never dismissed anything. The app additionally only shows releases
--    published after the account's creation day (src/lib/release-notes), so no
--    backfill is needed: existing players see the next release, new players don't.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_release text;

-- 2. Security fix: the "Users can update their own profile" policy (00001) has no
--    column restriction, so any signed-in user could approve themselves
--    (is_approved) or impersonate the admin, whom approve_user() recognises by
--    profiles.email. Block those columns for direct client writes. SECURITY
--    DEFINER functions (approve_user, handle_new_user) run as their owner and the
--    service role is not 'authenticated', so both keep working.
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND (
       NEW.is_approved IS DISTINCT FROM OLD.is_approved
    OR NEW.email IS DISTINCT FROM OLD.email
    OR NEW.id IS DISTINCT FROM OLD.id
  ) THEN
    RAISE EXCEPTION 'protected profile column' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_columns ON public.profiles;
CREATE TRIGGER protect_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();
