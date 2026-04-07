-- Set all existing NPCs to visible (they were visible before the visibility feature)
-- New NPCs default to hidden (is_visible_to_players = FALSE)
UPDATE chronicle_npcs SET is_visible_to_players = TRUE WHERE is_visible_to_players = FALSE;
