-- Add NPC flag to characters table so Advanced NPCs are full characters
-- with Manage/Play views, equipment, spells, etc.
ALTER TABLE characters
  ADD COLUMN is_npc BOOLEAN DEFAULT FALSE,
  ADD COLUMN npc_visible_to_players BOOLEAN DEFAULT FALSE;

-- Index for quick NPC lookups
CREATE INDEX idx_characters_is_npc ON characters (is_npc) WHERE is_npc = TRUE;
