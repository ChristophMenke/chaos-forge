-- Add weapon stats to Mix-and-Match Blades (like throwing knives)
-- Stats based on Wurfmesser/Throwing Knife from PHB

UPDATE public.epic_items
SET simple_effects = simple_effects || '{
  "weapon_stats": {
    "damage_sm": "1d3",
    "damage_l": "1d2",
    "weapon_type": "ranged",
    "speed": 2,
    "weight": 0.5,
    "range_short": 10,
    "range_medium": 20,
    "range_long": 30
  }
}'::jsonb
WHERE slug = 'mix-and-match-blades';
