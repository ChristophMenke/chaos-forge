-- Fix: Bok wurde fälschlicherweise als NPC markiert
-- Setzt is_npc zurück auf false und aktiviert den Charakter wieder
UPDATE characters
SET is_npc = false, is_active = true
WHERE name = 'Bok' AND is_npc = true;
