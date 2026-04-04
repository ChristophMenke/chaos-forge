-- Allow authenticated users to delete their own party loot log entries
CREATE POLICY "Owner can delete party log"
  ON party_loot_log FOR DELETE TO authenticated USING (auth.uid() = user_id);
