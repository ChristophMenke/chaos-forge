-- Track last successful login per user in profiles.
--
-- Adds a last_login_at column and a trigger on auth.sessions INSERT that
-- keeps it in sync. Token refresh does NOT create new session rows, so
-- this captures actual login events only — not arbitrary activity.
--
-- Backfilled from auth.users.last_sign_in_at for existing profiles.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- Backfill from auth.users for existing profiles
UPDATE public.profiles p
  SET last_login_at = u.last_sign_in_at
  FROM auth.users u
  WHERE p.id = u.id
    AND u.last_sign_in_at IS NOT NULL;

-- Trigger function: fires on every new auth.sessions row (= new login)
CREATE OR REPLACE FUNCTION public.handle_auth_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
    SET last_login_at = NEW.created_at
    WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_session_created ON auth.sessions;

CREATE TRIGGER on_auth_session_created
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_session();
