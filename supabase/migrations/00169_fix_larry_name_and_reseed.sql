-- Fix: Larry's character is named "Larry", not "Larry (new)"
-- Re-run all data seeding from migrations 00165, 00167 with correct name

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Epic Item: Klinge des Wassers (from 00165, was targeting wrong name)
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
  true, 0, 4,
  '{
    "0": { "description": "Basis: Die Klinge ruht.", "description_en": "Base: The blade rests.", "effects": [] },
    "1": { "description": "Stufe 3-4: +1 Schwert. 1×/Tag Water Walk.", "description_en": "Level 3-4: +1 sword. 1×/day Water Walk.", "effects": [] },
    "2": { "description": "Stufe 5-6: +2 Schwert. 3×/Tag Water Walk, 1×/Tag Water Breathing.", "description_en": "Level 5-6: +2 sword. 3×/day Water Walk, 1×/day Water Breathing.", "effects": [] },
    "3": { "description": "Stufe 7-8: +2 Schwert, +1d6 Kälteschaden. 3×/Tag Water Walk, 3×/Tag Water Breathing.", "description_en": "Level 7-8: +2 sword, +1d6 cold damage. 3×/day Water Walk, 3×/day Water Breathing.", "effects": ["cold_damage_1d6"] },
    "4": { "description": "Stufe 9-10: +3 Schwert, +1d6 Kälteschaden. Alle Fähigkeiten + 1×/Woche Cone of Cold (10d4+10).", "description_en": "Level 9-10: +3 sword, +1d6 cold damage. All abilities + 1×/week Cone of Cold (10d4+10).", "effects": ["cold_damage_1d6"] }
  }'::jsonb,
  '{
    "level_thresholds": [3, 5, 7, 9],
    "spell_abilities": [
      { "key": "water_walk", "name": "Water Walk", "name_en": "Water Walk", "unlock_level": 1, "usesPerDay": 1, "usesPerWeek": 0, "effect": "Der Träger kann auf Wasser laufen.", "effect_en": "The bearer can walk on water." },
      { "key": "water_walk_3", "name": "Water Walk", "name_en": "Water Walk", "unlock_level": 2, "usesPerDay": 3, "usesPerWeek": 0, "replaces": "water_walk", "effect": "Der Träger kann auf Wasser laufen.", "effect_en": "The bearer can walk on water." },
      { "key": "water_breathing", "name": "Water Breathing", "name_en": "Water Breathing", "unlock_level": 2, "usesPerDay": 1, "usesPerWeek": 0, "effect": "Der Träger kann unter Wasser atmen.", "effect_en": "The bearer can breathe underwater." },
      { "key": "water_breathing_3", "name": "Water Breathing", "name_en": "Water Breathing", "unlock_level": 3, "usesPerDay": 3, "usesPerWeek": 0, "replaces": "water_breathing", "effect": "Der Träger kann unter Wasser atmen.", "effect_en": "The bearer can breathe underwater." },
      { "key": "cone_of_cold", "name": "Cone of Cold", "name_en": "Cone of Cold", "unlock_level": 4, "usesPerDay": 0, "usesPerWeek": 1, "effect": "Kältekegel: 10d4+10 Schaden. RW gg. Zauber für halben Schaden.", "effect_en": "Cone of Cold: 10d4+10 damage. Save vs. Spell for half." }
    ]
  }'::jsonb,
  ''
FROM public.characters c
WHERE c.name = 'Larry'
  AND NOT EXISTS (SELECT 1 FROM public.epic_items ei WHERE ei.character_id = c.id AND ei.slug = 'klinge-des-wassers')
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. Equipment: Klinge des Wassers (Langschwert +3/+3)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.character_equipment (character_id, weapon_id, quantity, equipped, hit_bonus, damage_bonus, custom_label)
SELECT c.id, w.id, 1, true, 3, 3, 'Klinge des Wassers'
FROM public.characters c, public.weapons w
WHERE c.name = 'Larry' AND w.name = 'Langschwert'
  AND NOT EXISTS (SELECT 1 FROM public.character_equipment ce WHERE ce.character_id = c.id AND ce.custom_label = 'Klinge des Wassers')
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Weapon Proficiency: Langschwert mit Spezialisierung
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.character_weapon_proficiencies (character_id, weapon_name, specialization)
SELECT c.id, 'Langschwert', true
FROM public.characters c WHERE c.name = 'Larry'
  AND NOT EXISTS (SELECT 1 FROM public.character_weapon_proficiencies cwp WHERE cwp.character_id = c.id AND cwp.weapon_name = 'Langschwert')
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Equipment: Mittlerer Schild
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.character_equipment (character_id, armor_id, quantity, equipped, hit_bonus, damage_bonus)
SELECT c.id, a.id, 1, true, 0, 0
FROM public.characters c, public.armor a
WHERE c.name = 'Larry' AND a.name = 'Mittlerer Schild'
  AND NOT EXISTS (SELECT 1 FROM public.character_equipment ce JOIN public.armor ar ON ar.id = ce.armor_id WHERE ce.character_id = c.id AND ar.name = 'Mittlerer Schild')
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. Shield Proficiency: Mittlerer Schild
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.character_weapon_proficiencies (character_id, weapon_name, specialization)
SELECT c.id, 'Mittlerer Schild', false
FROM public.characters c WHERE c.name = 'Larry'
  AND NOT EXISTS (SELECT 1 FROM public.character_weapon_proficiencies cwp WHERE cwp.character_id = c.id AND cwp.weapon_name = 'Mittlerer Schild')
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. Traits + Disadvantages
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.characters SET
  traits = '[{"name":"Innerer Kompass","name_en":"Internal Compass","description":"+1 auf Navigation-Fertigkeitswürfe. Die Chance, sich zu verirren, ist um 5% reduziert.","description_en":"+1 bonus to Navigation proficiency checks, and the chance of being lost is reduced by 5%.","cost":3}]'::jsonb,
  disadvantages = '[{"name":"Farbenblind","name_en":"Colorblind","description":"Der Charakter sieht nur in Graustufen.","description_en":"Character sees only in shades of grey.","cost":3}]'::jsonb
WHERE name = 'Larry';
