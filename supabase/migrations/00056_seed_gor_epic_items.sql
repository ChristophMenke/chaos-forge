-- Gor's Epic Items: Totem Warrior abilities + Tattoo des Totem Kriegers
-- Uses dynamic character_id lookup by name

-- ═══════════════════════════════════════════════════════════════════════════════
-- Item 1: Totem Warrior (Gestaltwandlung)
-- Lvl 3-4: Geruchssinn +2, Tracking gratis
-- Lvl 5-6: Wolfsverwandlung 1x/Tag
-- Lvl 7-8: Bärenverwandlung 1x/Tag
-- Lvl 9-10: Wolfsverwandlung unbegrenzt
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.epic_items (
  character_id, slug, name, name_en, description, description_en, icon,
  equipped, damage_level, max_damage_level, damage_levels, simple_effects, notes
)
SELECT
  c.id,
  'totem-warrior',
  'Totem Warrior',
  'Totem Warrior',
  'Die Kräfte des Totem-Kriegers erwachen mit wachsender Stufe. Gestaltwandlung und geschärfte Sinne.',
  'The Totem Warrior''s powers awaken with growing level. Shapeshifting and heightened senses.',
  'paw-print',
  true,
  0,
  3,
  '{
    "0": {
      "description": "Lvl 3-4: Ausgeprägter Geruchssinn (+2 auf Riechen). Tracking-Fähigkeit gratis.",
      "description_en": "Lvl 3-4: Heightened sense of smell (+2 to scent checks). Tracking proficiency for free.",
      "stat_overrides": {},
      "effects": ["scent_bonus_2", "free_tracking"]
    },
    "1": {
      "description": "Lvl 5-6: Wolfsverwandlung 1x/Tag (Willenskraftwurf). Wolfsform: HP wie Charakter, AC 6 − DEX-Bonus, THAC0 wie Charakter, 1 Biss 2d4 Schaden, Mov 20.",
      "description_en": "Lvl 5-6: Wolf shape 1x/day (Willpower check). Wolf form: HP as character, AC 6 − DEX bonus, THAC0 as character, 1 bite 2d4 damage, Mov 20.",
      "stat_overrides": {},
      "effects": ["scent_bonus_2", "free_tracking", "wolf_shape_1_day"]
    },
    "2": {
      "description": "Lvl 7-8: Bärenverwandlung 1x/Tag (Willenskraftwurf). Bärenform: HP wie Charakter, AC 6 − DEX-Bonus, THAC0 wie Charakter, 2 Tatzen 1d6 (bei 18+ Treffer: +2d8 Hug) + 1 Biss 1d8.",
      "description_en": "Lvl 7-8: Bear shape 1x/day (Willpower check). Bear form: HP as character, AC 6 − DEX bonus, THAC0 as character, 2 claws 1d6 (on 18+ hit: +2d8 hug) + 1 bite 1d8.",
      "stat_overrides": {},
      "effects": ["scent_bonus_2", "free_tracking", "wolf_shape_1_day", "bear_shape_1_day"]
    },
    "3": {
      "description": "Lvl 9-10: Wolfsverwandlung unbegrenzt häufig.",
      "description_en": "Lvl 9-10: Wolf shape unlimited times per day.",
      "stat_overrides": {},
      "effects": ["scent_bonus_2", "free_tracking", "wolf_shape_unlimited", "bear_shape_1_day"]
    }
  }'::jsonb,
  '{
    "progression_type": "level_unlock",
    "unlock_levels": "Stufe 3-4 / 5-6 / 7-8 / 9-10",
    "unlock_levels_en": "Level 3-4 / 5-6 / 7-8 / 9-10"
  }'::jsonb,
  ''
FROM public.characters c
WHERE c.name ILIKE '%Gor%'
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Item 2: Tattoo des Totem Kriegers
-- Lvl 3-4: "Schlag des Wolfes" 1x/Tag — auto-kritisch, bei Miss trotzdem max Schaden
-- Lvl 5-6: AC Bonus +2 (tierische Reflexe)
-- Lvl 7-8: STR 20 für 1 Kampf/Tag + Wahrnehmung +2
-- Lvl 9-10: Mit Tieren reden + "Schlag des Bären" 1x/Tag (auto krit + max Schaden)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.epic_items (
  character_id, slug, name, name_en, description, description_en, icon,
  equipped, damage_level, max_damage_level, damage_levels, simple_effects, notes
)
SELECT
  c.id,
  'tattoo-totem-krieger',
  'Tattoo des Totem Kriegers',
  'Tattoo of the Totem Warrior',
  'Ein schamanistisches Meisterwerk. Es wechselt sein Aussehen mit der inneren Kraft des Trägers. Je stärker die Seele, desto mächtiger das Tier, das es zeigt.',
  'A shamanistic masterwork. Its appearance changes with the inner strength of the bearer. The stronger the soul, the more powerful the animal it displays.',
  'flame',
  true,
  0,
  3,
  '{
    "0": {
      "description": "Lvl 3-4: \"Schlag des Wolfes\" 1x/Tag — muss nur treffen, ist automatisch ein kritischer Treffer. Bei Miss trifft er trotzdem mit maximalem Schaden.",
      "description_en": "Lvl 3-4: \"Strike of the Wolf\" 1x/day — only needs to hit, automatically a critical hit. On miss, still hits with maximum damage.",
      "stat_overrides": {},
      "effects": ["wolf_strike_1_day"]
    },
    "1": {
      "description": "Lvl 5-6: AC Bonus von 2 aufgrund tierischer Reflexe.",
      "description_en": "Lvl 5-6: AC bonus of 2 due to animal reflexes.",
      "stat_overrides": {},
      "effects": ["wolf_strike_1_day", "ac_bonus_2"]
    },
    "2": {
      "description": "Lvl 7-8: Einen Kampf lang kann der Charakter 1x/Tag seine Stärke auf 20 erhöhen. Permanenter Bonus von +2 auf alle Wahrnehmungswürfe.",
      "description_en": "Lvl 7-8: For one combat, the character can raise STR to 20 once per day. Permanent +2 bonus to all perception checks.",
      "stat_overrides": {},
      "effects": ["wolf_strike_1_day", "ac_bonus_2", "str_20_1_combat_day", "perception_bonus_2"]
    },
    "3": {
      "description": "Lvl 9-10: Fähigkeit mit Tieren zu reden. \"Schlag des Bären\" 1x/Tag — trifft automatisch kritisch mit maximalem Schaden.",
      "description_en": "Lvl 9-10: Ability to speak with animals. \"Strike of the Bear\" 1x/day — automatically hits critically with maximum damage.",
      "stat_overrides": {},
      "effects": ["wolf_strike_1_day", "ac_bonus_2", "str_20_1_combat_day", "perception_bonus_2", "speak_with_animals", "bear_strike_1_day"]
    }
  }'::jsonb,
  '{
    "progression_type": "level_unlock",
    "unlock_levels": "Stufe 3-4 / 5-6 / 7-8 / 9-10",
    "unlock_levels_en": "Level 3-4 / 5-6 / 7-8 / 9-10"
  }'::jsonb,
  ''
FROM public.characters c
WHERE c.name ILIKE '%Gor%'
LIMIT 1;
