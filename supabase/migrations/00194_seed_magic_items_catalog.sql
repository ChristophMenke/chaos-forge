-- Migrate the 25 DMG magic items from general_items (category='magic') into the magic_items catalog.
-- These were seeded in 00191 but only into general_items, not the new magic_items table.

INSERT INTO magic_items (name, name_en, category, magic_effects, weight, source_book, is_custom)
SELECT
  gi.name,
  gi.name_en,
  CASE
    WHEN gi.name_en ILIKE '%ring%' THEN 'Ring'
    WHEN gi.name_en ILIKE '%potion%' THEN 'Potion'
    WHEN gi.name_en ILIKE '%cloak%' THEN 'Cloak'
    WHEN gi.name_en ILIKE '%boots%' THEN 'Boots'
    WHEN gi.name_en ILIKE '%amulet%' OR gi.name_en ILIKE '%periapt%' OR gi.name_en ILIKE '%necklace%' THEN 'Amulet'
    WHEN gi.name_en ILIKE '%bracers%' OR gi.name_en ILIKE '%gauntlets%' THEN 'Bracers'
    WHEN gi.name_en ILIKE '%girdle%' OR gi.name_en ILIKE '%belt%' THEN 'Belt'
    WHEN gi.name_en ILIKE '%rod%' THEN 'Rod'
    WHEN gi.name_en ILIKE '%wand%' THEN 'Wand'
    WHEN gi.name_en ILIKE '%bag%' THEN 'Wondrous'
    ELSE 'Wondrous'
  END AS category,
  '{}'::jsonb AS magic_effects,
  gi.weight,
  COALESCE(gi.source_book, 'DMG'),
  false
FROM general_items gi
WHERE gi.category = 'magic'
  AND NOT EXISTS (
    SELECT 1 FROM magic_items mi WHERE mi.name = gi.name
  );
