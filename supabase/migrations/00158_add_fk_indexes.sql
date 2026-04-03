-- Performance: Add indexes on foreign key columns used in WHERE/JOIN clauses.
-- These junction tables are queried on every character page load.

CREATE INDEX IF NOT EXISTS idx_character_equipment_character_id
  ON public.character_equipment (character_id);

CREATE INDEX IF NOT EXISTS idx_character_spells_character_id
  ON public.character_spells (character_id);

CREATE INDEX IF NOT EXISTS idx_character_weapon_proficiencies_character_id
  ON public.character_weapon_proficiencies (character_id);

CREATE INDEX IF NOT EXISTS idx_character_nonweapon_proficiencies_character_id
  ON public.character_nonweapon_proficiencies (character_id);

CREATE INDEX IF NOT EXISTS idx_character_classes_character_id
  ON public.character_classes (character_id);

CREATE INDEX IF NOT EXISTS idx_character_inventory_character_id
  ON public.character_inventory (character_id);

CREATE INDEX IF NOT EXISTS idx_character_languages_character_id
  ON public.character_languages (character_id);

CREATE INDEX IF NOT EXISTS idx_character_fighting_styles_character_id
  ON public.character_fighting_styles (character_id);

CREATE INDEX IF NOT EXISTS idx_epic_items_character_id
  ON public.epic_items (character_id);

CREATE INDEX IF NOT EXISTS idx_xp_history_character_id
  ON public.xp_history (character_id);

CREATE INDEX IF NOT EXISTS idx_character_shares_shared_with
  ON public.character_shares (shared_with_user_id);

CREATE INDEX IF NOT EXISTS idx_session_entries_session_id
  ON public.session_entries (session_id);

-- Composite indexes for spell filtering (priest-spells.ts)
CREATE INDEX IF NOT EXISTS idx_spells_type_level
  ON public.spells (spell_type, level);

CREATE INDEX IF NOT EXISTS idx_spells_type_sphere
  ON public.spells (spell_type, sphere);
