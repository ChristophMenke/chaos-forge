-- Enforce approval for all write operations via BEFORE INSERT/UPDATE/DELETE triggers.
-- This is cleaner than rewriting every RLS policy and also catches SECURITY DEFINER
-- RPC calls that would otherwise bypass RLS.
--
-- We intentionally allow notifications and profile self-updates even for unapproved
-- users (so they can receive the "user_approved" notification and the system can
-- create notifications via triggers).

-- Single enforcement function used by all approval triggers
CREATE OR REPLACE FUNCTION public.enforce_approval()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- auth.uid() is NULL when the call comes from a non-authenticated context
  -- (e.g. SECURITY DEFINER triggers on auth.users). We let those pass — the
  -- client-originated writes are always authenticated.
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF NOT public.is_approved_user() THEN
    RAISE EXCEPTION 'user_not_approved'
      USING HINT = 'Du musst erst von einem Admin freigeschaltet werden.',
            ERRCODE = '42501';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach the trigger to every write-accessible table.
-- Using DO block so we can loop and keep the migration DRY.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'characters',
    'character_equipment',
    'character_spells',
    'character_weapon_proficiencies',
    'character_nonweapon_proficiencies',
    'character_languages',
    'epic_items',
    'fighting_styles',
    'xp_history',
    'chronicle_npcs',
    'chronicle_quotes',
    'chronicle_quote_reactions',
    'sessions',
    'session_entries',
    'session_participants',
    'tags',
    'session_tags',
    'party_loot_gold',
    'party_loot_items',
    'party_loot_log',
    'monsters',
    'magic_items',
    'character_shares',
    'gm_bookmarks'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Only proceed if the table actually exists (safe for partial historical state)
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format(
        'DROP TRIGGER IF EXISTS enforce_approval_trigger ON public.%I;', t
      );
      EXECUTE format(
        'CREATE TRIGGER enforce_approval_trigger
           BEFORE INSERT OR UPDATE OR DELETE ON public.%I
           FOR EACH ROW EXECUTE FUNCTION public.enforce_approval();',
        t
      );
    END IF;
  END LOOP;
END $$;

-- Note: notifications and profiles tables intentionally excluded:
--  * notifications: system must be able to insert user_approved / new_user_registered for unapproved users
--  * profiles: self-updates (display_name, avatar, last_login_at) should work immediately
