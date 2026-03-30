-- Gor's Epic Items V2 — Mechanisch wirksam mit Auto-Unlock + Shapeshift + Special Attacks
-- Replaces the text-only items from migration 00056

-- Delete old items first
DELETE FROM public.epic_items
WHERE slug IN ('totem-warrior', 'tattoo-totem-krieger')
  AND character_id IN (SELECT id FROM public.characters WHERE name ILIKE '%Gor%');

-- ═══════════════════════════════════════════════════════════════════════════════
-- Item 1: Totem Warrior (Gestaltwandlung + Sinne)
-- Cumulative: each level adds to previous abilities
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
  'Die Kräfte des Totem-Kriegers erwachen mit wachsender Stufe. Geschärfte Sinne und Gestaltwandlung.',
  'The Totem Warrior''s powers awaken with growing level. Heightened senses and shapeshifting.',
  'paw-print',
  true,
  0, -- will be auto-calculated from character level
  3, -- max_damage_level = 4 tiers (0-3)
  '{
    "0": {
      "description": "Stufe 3-4: Ausgeprägter Geruchssinn (+2 auf Riechen). Tracking-Fähigkeit gratis.",
      "description_en": "Level 3-4: Heightened sense of smell (+2 scent). Free Tracking proficiency.",
      "stat_overrides": {},
      "effects": ["perception_bonus_2"]
    },
    "1": {
      "description": "Stufe 5-6: Wolfsverwandlung 1×/Tag (Willenskraftwurf).",
      "description_en": "Level 5-6: Wolf shape 1×/day (Willpower check).",
      "stat_overrides": {},
      "effects": ["perception_bonus_2"]
    },
    "2": {
      "description": "Stufe 7-8: Bärenverwandlung 1×/Tag (Willenskraftwurf).",
      "description_en": "Level 7-8: Bear shape 1×/day (Willpower check).",
      "stat_overrides": {},
      "effects": ["perception_bonus_2"]
    },
    "3": {
      "description": "Stufe 9-10: Wolfsverwandlung unbegrenzt häufig.",
      "description_en": "Level 9-10: Wolf shape unlimited.",
      "stat_overrides": {},
      "effects": ["perception_bonus_2"]
    }
  }'::jsonb,
  '{
    "level_thresholds": [3, 5, 7, 9],
    "shapeshift_forms": [
      {
        "key": "wolf",
        "name": "Wolf",
        "name_en": "Wolf",
        "baseAC": 6,
        "attacks": "1 Biss, 2d4 Schaden",
        "attacks_en": "1 Bite, 2d4 damage",
        "movement": 20,
        "usesPerDay": 1,
        "unlock_level": 1,
        "requiresCheck": "Willenskraftwurf",
        "requiresCheck_en": "Willpower check"
      },
      {
        "key": "bear",
        "name": "Bär",
        "name_en": "Bear",
        "baseAC": 6,
        "attacks": "2 Tatzen 1d6 + 1 Biss 1d8",
        "attacks_en": "2 Claws 1d6 + 1 Bite 1d8",
        "movement": 12,
        "usesPerDay": 1,
        "unlock_level": 2,
        "requiresCheck": "Willenskraftwurf",
        "requiresCheck_en": "Willpower check",
        "hugRule": "Bei Treffer 18+: Umklammerung +2d8 Schaden",
        "hugRule_en": "On hit 18+: Bear hug +2d8 damage"
      },
      {
        "key": "wolf_unlimited",
        "name": "Wolf (unbegrenzt)",
        "name_en": "Wolf (unlimited)",
        "baseAC": 6,
        "attacks": "1 Biss, 2d4 Schaden",
        "attacks_en": "1 Bite, 2d4 damage",
        "movement": 20,
        "usesPerDay": -1,
        "unlock_level": 3,
        "requiresCheck": "Willenskraftwurf",
        "requiresCheck_en": "Willpower check"
      }
    ]
  }'::jsonb,
  ''
FROM public.characters c
WHERE c.name ILIKE '%Gor%'
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Item 2: Tattoo des Totem Kriegers
-- Cumulative: each level adds to previous abilities
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
  'Ein schamanistisches Meisterwerk. Es wechselt sein Aussehen mit der inneren Kraft des Trägers.',
  'A shamanistic masterwork. Its appearance changes with the inner strength of the bearer.',
  'flame',
  true,
  0,
  3,
  '{
    "0": {
      "description": "Stufe 3-4: \"Schlag des Wolfes\" 1×/Tag.",
      "description_en": "Level 3-4: \"Strike of the Wolf\" 1×/day.",
      "stat_overrides": {},
      "effects": []
    },
    "1": {
      "description": "Stufe 5-6: AC Bonus +2 (tierische Reflexe).",
      "description_en": "Level 5-6: AC Bonus +2 (animal reflexes).",
      "stat_overrides": {},
      "effects": ["ac_bonus_2"]
    },
    "2": {
      "description": "Stufe 7-8: Stärke auf 20 (1 Kampf/Tag). Wahrnehmung +2.",
      "description_en": "Level 7-8: STR to 20 (1 combat/day). Perception +2.",
      "stat_overrides": {},
      "effects": ["ac_bonus_2", "str_override_20", "perception_bonus_2"]
    },
    "3": {
      "description": "Stufe 9-10: Mit Tieren reden. \"Schlag des Bären\" 1×/Tag.",
      "description_en": "Level 9-10: Speak with animals. \"Strike of the Bear\" 1×/day.",
      "stat_overrides": {},
      "effects": ["ac_bonus_2", "str_override_20", "perception_bonus_2", "speak_with_animals"]
    }
  }'::jsonb,
  '{
    "level_thresholds": [3, 5, 7, 9],
    "special_attacks": [
      {
        "key": "wolf_strike",
        "name": "Schlag des Wolfes",
        "name_en": "Strike of the Wolf",
        "usesPerDay": 1,
        "unlock_level": 0,
        "effect": "Muss nur treffen → automatisch kritischer Treffer. Bei Miss: trifft trotzdem mit maximalem Schaden.",
        "effect_en": "Only needs to hit → automatic critical hit. On miss: still hits with maximum damage."
      },
      {
        "key": "bear_strike",
        "name": "Schlag des Bären",
        "name_en": "Strike of the Bear",
        "usesPerDay": 1,
        "unlock_level": 3,
        "effect": "Trifft automatisch kritisch mit maximalem Schaden.",
        "effect_en": "Automatically hits critically with maximum damage."
      }
    ]
  }'::jsonb,
  ''
FROM public.characters c
WHERE c.name ILIKE '%Gor%'
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Add Tracking NWP to Gor (if not already present)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.character_nonweapon_proficiencies (character_id, proficiency_id)
SELECT c.id, 'tracking'
FROM public.characters c
WHERE c.name ILIKE '%Gor%'
  AND NOT EXISTS (
    SELECT 1 FROM public.character_nonweapon_proficiencies cnp
    WHERE cnp.character_id = c.id AND cnp.proficiency_id = 'tracking'
  )
LIMIT 1;
