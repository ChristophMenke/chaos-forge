-- Klinge des Wassers: Episches Langschwert für Larry (new)
-- 4 Stufen mit Auto-Unlock (Level 3/5/7/9)
-- Progressiv: +1→+3 Waffe, Kälteschaden ab Stufe 7, Zauber-Fähigkeiten

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Epic Item: Klinge des Wassers
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.epic_items (
  character_id, slug, name, name_en, description, description_en, icon,
  equipped, damage_level, max_damage_level, damage_levels, simple_effects, notes
)
SELECT
  c.id,
  'klinge-des-wassers',
  'Klinge des Wassers',
  'Blade of Water',
  'Die Klinge des Wassers ist eine von vier Klingen, die vor Jahrhunderten von einem mächtigen Elementarmagier der inneren Ebenen geschaffen wurde. Die Klinge selbst scheint aus gefrorenem Wasser oder Kristall zu bestehen. Ihr Inneres ist durchzogen von silbernen Fäden.',
  'The Blade of Water is one of four blades forged centuries ago by a powerful Elemental Mage of the Inner Planes. The blade itself appears to be made of frozen water or crystal. Its interior is laced with silver threads.',
  'swords',
  true,
  0, -- auto-calculated from character level
  3, -- max_damage_level = 4 tiers (0-3)
  '{
    "0": {
      "description": "Stufe 3-4: +1 Schwert. 1×/Tag Water Walk.",
      "description_en": "Level 3-4: +1 sword. 1×/day Water Walk.",
      "effects": []
    },
    "1": {
      "description": "Stufe 5-6: +2 Schwert. 3×/Tag Water Walk, 1×/Tag Water Breathing.",
      "description_en": "Level 5-6: +2 sword. 3×/day Water Walk, 1×/day Water Breathing.",
      "effects": []
    },
    "2": {
      "description": "Stufe 7-8: +2 Schwert, +1d6 Kälteschaden. 3×/Tag Water Walk, 3×/Tag Water Breathing.",
      "description_en": "Level 7-8: +2 sword, +1d6 cold damage. 3×/day Water Walk, 3×/day Water Breathing.",
      "effects": ["cold_damage_1d6"]
    },
    "3": {
      "description": "Stufe 9-10: +3 Schwert, +1d6 Kälteschaden. 3×/Tag Water Walk, 3×/Tag Water Breathing, 1×/Woche Cone of Cold (10d4+10).",
      "description_en": "Level 9-10: +3 sword, +1d6 cold damage. 3×/day Water Walk, 3×/day Water Breathing, 1×/week Cone of Cold (10d4+10).",
      "effects": ["cold_damage_1d6"]
    }
  }'::jsonb,
  '{
    "level_thresholds": [3, 5, 7, 9],
    "spell_abilities": [
      {
        "key": "water_walk",
        "name": "Water Walk",
        "name_en": "Water Walk",
        "unlock_level": 0,
        "usesPerDay": 1,
        "usesPerWeek": 0,
        "effect": "Der Träger kann auf Wasser laufen, als wäre es fester Boden.",
        "effect_en": "The bearer can walk on water as if it were solid ground."
      },
      {
        "key": "water_walk_3",
        "name": "Water Walk",
        "name_en": "Water Walk",
        "unlock_level": 1,
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
        "unlock_level": 1,
        "usesPerDay": 1,
        "usesPerWeek": 0,
        "effect": "Der Träger kann unter Wasser atmen.",
        "effect_en": "The bearer can breathe underwater."
      },
      {
        "key": "water_breathing_3",
        "name": "Water Breathing",
        "name_en": "Water Breathing",
        "unlock_level": 2,
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
        "unlock_level": 3,
        "usesPerDay": 0,
        "usesPerWeek": 1,
        "effect": "Kältekegel: 10d4+10 Schaden. Rettungswurf gg. Zauber für halben Schaden.",
        "effect_en": "Cone of Cold: 10d4+10 damage. Save vs. Spell for half damage."
      }
    ]
  }'::jsonb,
  ''
FROM public.characters c
WHERE c.name = 'Larry (new)'
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. Equipment: Langschwert mit +3/+3 und custom_label
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.character_equipment (character_id, weapon_id, quantity, equipped, hit_bonus, damage_bonus, custom_label)
SELECT c.id, w.id, 1, true, 3, 3, 'Klinge des Wassers'
FROM public.characters c, public.weapons w
WHERE c.name = 'Larry (new)' AND w.name = 'Langschwert'
  AND NOT EXISTS (
    SELECT 1 FROM public.character_equipment ce
    WHERE ce.character_id = c.id AND ce.custom_label = 'Klinge des Wassers'
  )
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Weapon Proficiency: Langschwert mit Spezialisierung
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.character_weapon_proficiencies (character_id, weapon_name, specialization)
SELECT c.id, 'Langschwert', true
FROM public.characters c
WHERE c.name = 'Larry (new)'
  AND NOT EXISTS (
    SELECT 1 FROM public.character_weapon_proficiencies cwp
    WHERE cwp.character_id = c.id AND cwp.weapon_name = 'Langschwert'
  )
LIMIT 1;
