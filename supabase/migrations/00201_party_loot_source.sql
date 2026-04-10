-- Party Loot Ownership: Source character tracking + equipment metadata
--
-- Items in party_loot_items are now tied to the character they came from,
-- enabling proper ownership enforcement and audit trails. Equipment rows
-- (weapons/armor) preserve their full metadata so they round-trip cleanly
-- back to character_equipment when distributed.

ALTER TABLE party_loot_items
  ADD COLUMN source_character_id uuid REFERENCES characters(id) ON DELETE SET NULL,
  ADD COLUMN source_type text CHECK (source_type IN ('inventory', 'equipment')),
  ADD COLUMN source_row_id uuid,
  ADD COLUMN weapon_id uuid REFERENCES weapons(id) ON DELETE SET NULL,
  ADD COLUMN armor_id uuid REFERENCES armor(id) ON DELETE SET NULL,
  ADD COLUMN hit_bonus integer NOT NULL DEFAULT 0,
  ADD COLUMN damage_bonus integer NOT NULL DEFAULT 0;

CREATE INDEX party_loot_items_source_character_idx
  ON party_loot_items(source_character_id);

-- Restrict direct INSERT: only via SECURITY DEFINER RPC move_to_party_loot
-- (added in migration 00202). SECURITY DEFINER bypasses RLS, so clients
-- can no longer forge party_loot_items directly.
DROP POLICY IF EXISTS "Authenticated can insert party items" ON party_loot_items;
