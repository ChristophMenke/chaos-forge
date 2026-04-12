-- Heal legacy state: auth.users rows that never got a public.profiles row.
-- These slipped through the handle_new_user trigger (likely due to a historic
-- migration or failed insert). They appeared "invisible" to the approval system —
-- no banner, no admin notification, and the enforce_approval trigger would
-- evaluate is_approved=false (COALESCE fallback) but some older policies might
-- not block them consistently. This migration creates the missing profiles with
-- is_approved=false AND notifies the admin so they can approve or reject.

DO $$
DECLARE
  u record;
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id
    FROM public.profiles
    WHERE email = 'christoph.menke@gmail.com'
    LIMIT 1;

  FOR u IN
    SELECT id, email, email_confirmed_at, raw_user_meta_data
    FROM auth.users
    WHERE id NOT IN (SELECT id FROM public.profiles)
      AND email_confirmed_at IS NOT NULL
  LOOP
    INSERT INTO public.profiles (id, display_name, email, is_approved, skip_tutorials)
    VALUES (
      u.id,
      COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
      u.email,
      false,
      false
    );

    IF admin_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, details)
      VALUES (
        admin_id,
        'new_user_registered',
        jsonb_build_object('user_email', u.email, 'user_id', u.id::text)
      );
    END IF;
  END LOOP;
END $$;
