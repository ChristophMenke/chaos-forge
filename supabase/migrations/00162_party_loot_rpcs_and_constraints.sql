-- Fix race conditions: atomic gold/inventory operations via RPCs
-- Fix missing constraints from 00161

-- ── Atomic Gold Operations ───────────────────────────────────────────────────

-- Add gold to party pool atomically
CREATE OR REPLACE FUNCTION add_party_gold(
  p_id uuid,
  p_pp integer, p_gp integer, p_ep integer, p_sp integer, p_cp integer
) RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE party_loot_gold SET
    pp = pp + p_pp, gp = gp + p_gp, ep = ep + p_ep,
    sp = sp + p_sp, cp = cp + p_cp,
    updated_by = auth.uid(), updated_at = now()
  WHERE id = p_id;
$$;

-- Deduct gold from party pool atomically (with sufficient-funds guard)
CREATE OR REPLACE FUNCTION deduct_party_gold(
  p_id uuid,
  p_pp integer, p_gp integer, p_ep integer, p_sp integer, p_cp integer
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  rows_affected integer;
BEGIN
  UPDATE party_loot_gold SET
    pp = pp - p_pp, gp = gp - p_gp, ep = ep - p_ep,
    sp = sp - p_sp, cp = cp - p_cp,
    updated_by = auth.uid(), updated_at = now()
  WHERE id = p_id
    AND pp >= p_pp AND gp >= p_gp AND ep >= p_ep
    AND sp >= p_sp AND cp >= p_cp;
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;

-- Add gold to character atomically
CREATE OR REPLACE FUNCTION add_character_gold(
  p_character_id uuid,
  p_pp integer, p_gp integer, p_ep integer, p_sp integer, p_cp integer
) RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE characters SET
    gold_pp = gold_pp + p_pp,
    gold_gp = gold_gp + p_gp,
    gold_ep = gold_ep + p_ep,
    gold_sp = gold_sp + p_sp,
    gold_cp = gold_cp + p_cp
  WHERE id = p_character_id;
$$;

-- ── Atomic Inventory Operation ───────────────────────────────────────────────

-- Increment inventory quantity atomically
CREATE OR REPLACE FUNCTION increment_inventory_quantity(
  p_inventory_id uuid,
  p_delta integer
) RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE character_inventory SET
    quantity = quantity + p_delta
  WHERE id = p_inventory_id;
$$;

-- ── Constraints ──────────────────────────────────────────────────────────────

ALTER TABLE party_loot_items ADD CONSTRAINT party_loot_items_quantity_positive CHECK (quantity > 0);

-- ── Updated-at Triggers ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_party_loot_gold_updated_at
  BEFORE UPDATE ON party_loot_gold
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_party_loot_items_updated_at
  BEFORE UPDATE ON party_loot_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
