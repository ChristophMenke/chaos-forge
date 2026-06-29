-- Public read-only sharing for single Chronik sessions.
--
-- A session can be made publicly viewable (without login) via a share link
-- at /share/sessions/<id>. The public page is served through the Service-Role
-- client and only ever reads sessions where is_public = true, so no anon RLS
-- policy is required and private sessions stay protected.

-- 1. Flag on sessions
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- 2. RPC to toggle the public flag.
--    The existing UPDATE policy on sessions only allows the creator to edit a
--    session. House rule: ANY approved user may share/unshare a session, so we
--    expose this single field via a SECURITY DEFINER function that checks
--    approval explicitly (and thereby bypasses the creator-only policy without
--    weakening the general edit rules).
CREATE OR REPLACE FUNCTION public.set_session_public(
  p_session_id uuid,
  p_is_public boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_user() THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  UPDATE public.sessions
    SET is_public = p_is_public,
        updated_at = now()
    WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'session not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN p_is_public;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_session_public(uuid, boolean) TO authenticated;
