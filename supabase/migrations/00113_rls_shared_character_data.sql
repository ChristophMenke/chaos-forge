-- ═══════════════════════════════════════════════════════════════════════════════
-- Fix: SELECT-Policies für geteilte/öffentliche Charaktere
-- Bisher: Nur Owner konnte Equipment, Spells, Proficiencies, Sprachen lesen
-- Neu: Alle authentifizierten User können lesen (konsistent mit
--      character_classes, character_inventory, epic_items, character_fighting_styles)
-- INSERT/UPDATE/DELETE bleibt Owner-only
-- ═══════════════════════════════════════════════════════════════════════════════

-- character_equipment
DROP POLICY IF EXISTS "Users can view their own character equipment" ON character_equipment;
DROP POLICY IF EXISTS "Authenticated can view character equipment" ON character_equipment;
CREATE POLICY "Authenticated can view character equipment"
  ON character_equipment FOR SELECT TO authenticated USING (true);

-- character_spells
DROP POLICY IF EXISTS "Users can view their own character spells" ON character_spells;
DROP POLICY IF EXISTS "Authenticated can view character spells" ON character_spells;
CREATE POLICY "Authenticated can view character spells"
  ON character_spells FOR SELECT TO authenticated USING (true);

-- character_weapon_proficiencies
DROP POLICY IF EXISTS "Users can view their character weapon proficiencies" ON character_weapon_proficiencies;
DROP POLICY IF EXISTS "Authenticated can view character weapon proficiencies" ON character_weapon_proficiencies;
CREATE POLICY "Authenticated can view character weapon proficiencies"
  ON character_weapon_proficiencies FOR SELECT TO authenticated USING (true);

-- character_nonweapon_proficiencies
DROP POLICY IF EXISTS "Users can view their character NW proficiencies" ON character_nonweapon_proficiencies;
DROP POLICY IF EXISTS "Authenticated can view character NW proficiencies" ON character_nonweapon_proficiencies;
CREATE POLICY "Authenticated can view character NW proficiencies"
  ON character_nonweapon_proficiencies FOR SELECT TO authenticated USING (true);

-- character_languages
DROP POLICY IF EXISTS "Users can view their character languages" ON character_languages;
DROP POLICY IF EXISTS "Authenticated can view character languages" ON character_languages;
CREATE POLICY "Authenticated can view character languages"
  ON character_languages FOR SELECT TO authenticated USING (true);
