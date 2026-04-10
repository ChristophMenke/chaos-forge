-- Fix: give_character_gold_to_party returned TRUE even when the
-- party_loot_gold singleton row was missing (silent data loss).
-- Now raises 'party_gold_row_missing' if the UPDATE hits 0 rows.

CREATE OR REPLACE FUNCTION give_character_gold_to_party(
  p_character_id uuid,
  p_pp integer,
  p_gp integer,
  p_ep integer,
  p_sp integer,
  p_cp integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_pp < 0 OR p_gp < 0 OR p_ep < 0 OR p_sp < 0 OR p_cp < 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  IF p_pp = 0 AND p_gp = 0 AND p_ep = 0 AND p_sp = 0 AND p_cp = 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM characters
    WHERE id = p_character_id AND user_id = v_caller
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE characters
    SET gold_pp = gold_pp - p_pp,
        gold_gp = gold_gp - p_gp,
        gold_ep = gold_ep - p_ep,
        gold_sp = gold_sp - p_sp,
        gold_cp = gold_cp - p_cp
    WHERE id = p_character_id
      AND gold_pp >= p_pp
      AND gold_gp >= p_gp
      AND gold_ep >= p_ep
      AND gold_sp >= p_sp
      AND gold_cp >= p_cp;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient_character_gold';
  END IF;

  UPDATE party_loot_gold
    SET pp = pp + p_pp,
        gp = gp + p_gp,
        ep = ep + p_ep,
        sp = sp + p_sp,
        cp = cp + p_cp,
        updated_at = now(),
        updated_by = v_caller
    WHERE id IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'party_gold_row_missing';
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION give_character_gold_to_party(uuid, integer, integer, integer, integer, integer) TO authenticated;
