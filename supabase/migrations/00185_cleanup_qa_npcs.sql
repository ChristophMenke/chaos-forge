-- Cleanup: Remove QA test NPCs from chronicle_npcs
DELETE FROM chronicle_npcs WHERE name ILIKE 'QA %';
