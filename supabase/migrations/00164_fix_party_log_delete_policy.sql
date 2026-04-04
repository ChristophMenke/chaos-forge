-- Fix: restrict delete to own entries only (was USING (true))
DROP POLICY IF EXISTS "Authenticated can delete party log" ON party_loot_log;
DROP POLICY IF EXISTS "Owner can delete party log" ON party_loot_log;

CREATE POLICY "Owner can delete party log"
  ON party_loot_log FOR DELETE TO authenticated USING (auth.uid() = user_id);
