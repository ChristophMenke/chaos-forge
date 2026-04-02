-- ═══════════════════════════════════════════════════════════════════════════════
-- Epic Items: Nur für Owner und explizit geteilte Charaktere sichtbar
-- NICHT für öffentliche Charaktere (is_public) — Epic Items sind geheim
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Authenticated can view epic items" ON epic_items;

CREATE POLICY "Owner and shared can view epic items"
  ON epic_items FOR SELECT TO authenticated
  USING (
    character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
    OR character_id IN (
      SELECT character_id FROM character_shares WHERE shared_with_user_id = auth.uid()
    )
  );
