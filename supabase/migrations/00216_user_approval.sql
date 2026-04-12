-- User Approval System
-- New users start as unapproved (read-only access).
-- Admin (christoph.menke@gmail.com) approves users via the approve_user RPC.
-- Helper function is_approved_user() is used in RLS policies (see 00217).

-- 1. Add is_approved column (default false for new users)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- 2. Backfill: all existing users are approved
UPDATE public.profiles SET is_approved = true;

-- 3. Helper function for RLS — STABLE + SECURITY DEFINER so it works inside policies
--    without infinite recursion and is well-cached per-query.
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_approved FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- 4. approve_user RPC — admin-only
CREATE OR REPLACE FUNCTION public.approve_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_email text;
BEGIN
  SELECT email INTO caller_email FROM public.profiles WHERE id = auth.uid();
  IF caller_email IS DISTINCT FROM 'christoph.menke@gmail.com' THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles SET is_approved = true WHERE id = target_user_id;

  -- Notify the approved user
  INSERT INTO public.notifications (user_id, type, details)
  VALUES (target_user_id, 'user_approved', '{}'::jsonb);
END;
$$;

-- 5. Update handle_new_user trigger:
--    - Explicitly set is_approved = false
--    - Insert a notification for the admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id uuid;
BEGIN
  INSERT INTO public.profiles (id, display_name, email, is_approved)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'Abenteurer'),
    new.email,
    false
  );

  -- Notify admin about new user registration
  SELECT id INTO admin_id
    FROM public.profiles
    WHERE email = 'christoph.menke@gmail.com'
    LIMIT 1;

  IF admin_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, details)
    VALUES (
      admin_id,
      'new_user_registered',
      jsonb_build_object(
        'user_email', new.email,
        'user_id', new.id::text
      )
    );
  END IF;

  RETURN new;
END;
$$;

-- 6. Grant execute on RPCs
GRANT EXECUTE ON FUNCTION public.is_approved_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_user(uuid) TO authenticated;
