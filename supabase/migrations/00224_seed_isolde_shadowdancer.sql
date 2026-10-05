-- Epic Item für Isolde (Tiefling-Diebin, Spielerin Mascha): "Schattentänzer" / "Shadowdancer"
-- Level-gestaffelt nach dem Muster der Klinge des Wassers (00169):
-- max_damage_level=4, level_thresholds=[3,5,7,9], Tier 0 = Basis (< L3).
-- Auto-Unlock aus dem Charakterlevel; damage_level bleibt 0 (wird applikationsseitig berechnet).

INSERT INTO public.epic_items (
  character_id, slug, name, name_en, description, description_en, icon,
  equipped, damage_level, max_damage_level, damage_levels, simple_effects, notes
)
SELECT
  c.id,
  'schattentaenzer',
  'Schattentänzer',
  'Shadowdancer',
  'Ein uraltes Artefakt, das seinen Träger mit den Schatten verschmelzen lässt. Seine Macht wächst mit der Erfahrung des Trägers.',
  'An ancient artifact that lets its bearer meld with the shadows. Its power grows with the bearer''s experience.',
  'sparkles',
  true, 0, 4,
  '{
    "0": { "description": "Das Artefakt schlummert — seine Macht erwacht ab Stufe 3.", "description_en": "The artifact lies dormant — its power awakens at level 3.", "effects": [] },
    "1": { "description": "Stufe 3-4: 3×/Tag im Schatten verschwinden (Wurf trotzdem erforderlich), auch wenn der Träger beobachtet wird.", "description_en": "Level 3-4: 3×/day vanish into shadows (a check is still required), even when observed.", "effects": [] },
    "2": { "description": "Stufe 5-6: +10% auf Im Schatten verstecken und Leise bewegen. Ist ein Rettungswurf nötig, um Schaden auszuweichen, verliert der Träger bei Erfolg keine HP, bei Misserfolg nur die Hälfte.", "description_en": "Level 5-6: +10% to Hide in Shadows and Move Silently. When a saving throw is needed to avoid damage, the bearer takes no HP loss on success and only half on failure.", "effects": ["thief_bonus_hide_10", "thief_bonus_move_10"] },
    "3": { "description": "Stufe 7-8: 3×/Tag durch die Schatten reisen (Maximaldistanz 300 m, +20 m/Stufe). Der Träger kann jederzeit in die Schatten treten und sich so verstecken.", "description_en": "Level 7-8: 3×/day travel through the shadows (max distance 300 m, +20 m/level). The bearer can step into the shadows at any time to hide.", "effects": ["thief_bonus_hide_10", "thief_bonus_move_10"] },
    "4": { "description": "Stufe 9-10: Bei Nacht oder Dunkelheit kann der Träger beliebig oft durch die Schatten reisen.", "description_en": "Level 9-10: At night or in darkness the bearer can travel through the shadows without limit.", "effects": ["thief_bonus_hide_10", "thief_bonus_move_10"] }
  }'::jsonb,
  '{
    "level_thresholds": [3, 5, 7, 9],
    "spell_abilities": [
      { "key": "shadow_meld", "name": "Schattenverschmelzung", "name_en": "Shadow Meld", "unlock_level": 1, "usesPerDay": 3, "usesPerWeek": 0, "effect": "Im Schatten verschwinden (Wurf trotzdem erforderlich), auch wenn beobachtet.", "effect_en": "Vanish into shadows (a check is still required), even when observed." },
      { "key": "shadow_travel", "name": "Schattenreise", "name_en": "Shadow Travel", "unlock_level": 3, "usesPerDay": 3, "usesPerWeek": 0, "effect": "Durch die Schatten reisen (max. 300 m, +20 m/Stufe). Jederzeit in die Schatten treten und sich verstecken.", "effect_en": "Travel through the shadows (max 300 m, +20 m/level). Step into the shadows at any time to hide." },
      { "key": "shadow_travel_unlimited", "name": "Schattenreise (unbegrenzt)", "name_en": "Shadow Travel (unlimited)", "unlock_level": 4, "usesPerDay": -1, "usesPerWeek": 0, "replaces": "shadow_travel", "effect": "Bei Nacht oder Dunkelheit beliebig oft durch die Schatten reisen.", "effect_en": "At night or in darkness, travel through the shadows without limit." }
    ]
  }'::jsonb,
  ''
FROM public.characters c
WHERE c.name = 'Isolde'
  AND NOT EXISTS (SELECT 1 FROM public.epic_items ei WHERE ei.character_id = c.id AND ei.slug = 'schattentaenzer')
LIMIT 1;
