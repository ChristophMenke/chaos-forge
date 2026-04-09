-- Fix magic items that should use stat_overrides instead of additive bonuses.
-- AD&D 2e: Belt of Giant Strength SETS STR to 19, not +19.
-- Moves str/dex from top-level (additive) to stat_overrides (override).

-- Belt of Giant Strength: str: 19 → stat_overrides.str: 19
UPDATE magic_items
SET magic_effects = jsonb_set(
  magic_effects #- '{str}',
  '{stat_overrides}',
  '{"str": 19}'
)
WHERE name_en = 'Belt of Giant Strength' AND is_custom = false;

-- Gauntlets of Ogre Power: str: 18 → stat_overrides.str: 18, str_exceptional: 100 (= 18/00)
UPDATE magic_items
SET magic_effects = jsonb_set(
  magic_effects #- '{str}',
  '{stat_overrides}',
  '{"str": 18, "str_exceptional": 100}'
)
WHERE name_en = 'Gauntlets of Ogre Power' AND is_custom = false;

-- Gauntlets of Dexterity: dex: 18 → stat_overrides.dex: 18
UPDATE magic_items
SET magic_effects = jsonb_set(
  magic_effects #- '{dex}',
  '{stat_overrides}',
  '{"dex": 18}'
)
WHERE name_en = 'Gauntlets of Dexterity' AND is_custom = false;

-- Potion of Giant Strength: str: 19 → stat_overrides.str: 19
UPDATE magic_items
SET magic_effects = jsonb_set(
  magic_effects #- '{str}',
  '{stat_overrides}',
  '{"str": 19}'
)
WHERE name_en = 'Potion of Giant Strength' AND is_custom = false;

-- Backfill: Update character_equipment entries that reference these catalog items
UPDATE character_equipment ce
SET magic_effects = mi.magic_effects
FROM magic_items mi
WHERE ce.magic_item_id = mi.id
  AND mi.name_en IN (
    'Belt of Giant Strength',
    'Gauntlets of Ogre Power',
    'Gauntlets of Dexterity',
    'Potion of Giant Strength'
  )
  AND mi.is_custom = false;
