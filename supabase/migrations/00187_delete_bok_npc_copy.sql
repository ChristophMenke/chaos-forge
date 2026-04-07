-- Fix: "Bok (NPC)" Kopie löschen — wurde versehentlich über createNpcFromCharacter erstellt
-- Löscht die NPC-Kopie und alle zugehörigen Daten (FK CASCADE)
DELETE FROM characters
WHERE name = 'Bok (NPC)' AND is_npc = true;
