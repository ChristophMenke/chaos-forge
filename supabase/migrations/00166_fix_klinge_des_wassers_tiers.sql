-- Fix: Klinge des Wassers needs 5 tiers (0-4) not 4 (0-3)
-- Tier 0 = base (level < 3), Tier 1 = L3-4, Tier 2 = L5-6, Tier 3 = L7-8, Tier 4 = L9-10
-- With 4 thresholds [3,5,7,9], unlocked at level 9 = 4 → needs max_damage_level = 4

UPDATE public.epic_items
SET
  max_damage_level = 4,
  damage_levels = '{
    "0": {
      "description": "Basis: Die Klinge ruht. Ihre Geheimnisse sind noch verborgen.",
      "description_en": "Base: The blade rests. Its secrets are still hidden.",
      "effects": []
    },
    "1": {
      "description": "Stufe 3-4: +1 Schwert. 1×/Tag Water Walk.",
      "description_en": "Level 3-4: +1 sword. 1×/day Water Walk.",
      "effects": []
    },
    "2": {
      "description": "Stufe 5-6: +2 Schwert. 3×/Tag Water Walk, 1×/Tag Water Breathing.",
      "description_en": "Level 5-6: +2 sword. 3×/day Water Walk, 1×/day Water Breathing.",
      "effects": []
    },
    "3": {
      "description": "Stufe 7-8: +2 Schwert, +1d6 Kälteschaden. 3×/Tag Water Walk, 3×/Tag Water Breathing.",
      "description_en": "Level 7-8: +2 sword, +1d6 cold damage. 3×/day Water Walk, 3×/day Water Breathing.",
      "effects": ["cold_damage_1d6"]
    },
    "4": {
      "description": "Stufe 9-10: +3 Schwert, +1d6 Kälteschaden. 3×/Tag Water Walk, 3×/Tag Water Breathing, 1×/Woche Cone of Cold (10d4+10).",
      "description_en": "Level 9-10: +3 sword, +1d6 cold damage. 3×/day Water Walk, 3×/day Water Breathing, 1×/week Cone of Cold (10d4+10).",
      "effects": ["cold_damage_1d6"]
    }
  }'::jsonb,
  simple_effects = '{
    "level_thresholds": [3, 5, 7, 9],
    "spell_abilities": [
      {
        "key": "water_walk",
        "name": "Water Walk",
        "name_en": "Water Walk",
        "unlock_level": 1,
        "usesPerDay": 1,
        "usesPerWeek": 0,
        "effect": "Der Träger kann auf Wasser laufen, als wäre es fester Boden.",
        "effect_en": "The bearer can walk on water as if it were solid ground."
      },
      {
        "key": "water_walk_3",
        "name": "Water Walk",
        "name_en": "Water Walk",
        "unlock_level": 2,
        "usesPerDay": 3,
        "usesPerWeek": 0,
        "replaces": "water_walk",
        "effect": "Der Träger kann auf Wasser laufen, als wäre es fester Boden.",
        "effect_en": "The bearer can walk on water as if it were solid ground."
      },
      {
        "key": "water_breathing",
        "name": "Water Breathing",
        "name_en": "Water Breathing",
        "unlock_level": 2,
        "usesPerDay": 1,
        "usesPerWeek": 0,
        "effect": "Der Träger kann unter Wasser atmen.",
        "effect_en": "The bearer can breathe underwater."
      },
      {
        "key": "water_breathing_3",
        "name": "Water Breathing",
        "name_en": "Water Breathing",
        "unlock_level": 3,
        "usesPerDay": 3,
        "usesPerWeek": 0,
        "replaces": "water_breathing",
        "effect": "Der Träger kann unter Wasser atmen.",
        "effect_en": "The bearer can breathe underwater."
      },
      {
        "key": "cone_of_cold",
        "name": "Cone of Cold",
        "name_en": "Cone of Cold",
        "unlock_level": 4,
        "usesPerDay": 0,
        "usesPerWeek": 1,
        "effect": "Kältekegel: 10d4+10 Schaden. Rettungswurf gg. Zauber für halben Schaden.",
        "effect_en": "Cone of Cold: 10d4+10 damage. Save vs. Spell for half damage."
      }
    ]
  }'::jsonb
WHERE slug = 'klinge-des-wassers';
