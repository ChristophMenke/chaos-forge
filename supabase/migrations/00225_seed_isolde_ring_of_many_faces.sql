-- Epic Item für Isolde (Tiefling-Diebin, Spielerin Mascha): "Ring der vielen Gesichter" / "Ring of Many Faces"
-- Level-gestaffelt nach dem Muster der Klinge des Wassers (00169):
-- max_damage_level=4, level_thresholds=[3,5,7,9], Tier 0 = Basis (< L3).
-- Progressive spell_abilities: jede Stufe ersetzt (replaces) die vorige Verwandlungs-Fähigkeit.

INSERT INTO public.epic_items (
  character_id, slug, name, name_en, description, description_en, icon,
  equipped, damage_level, max_damage_level, damage_levels, simple_effects, notes
)
SELECT
  c.id,
  'ring-der-vielen-gesichter',
  'Ring der vielen Gesichter',
  'Ring of Many Faces',
  'Ein schlichter Ring, der seinem Träger erlaubt, Gestalt und Stimme zu verändern. Mit wachsender Erfahrung wird die Verwandlung immer mächtiger.',
  'A plain ring that lets its bearer change shape and voice. As experience grows, the transformation becomes ever more powerful.',
  'sparkles',
  true, 0, 4,
  '{
    "0": { "description": "Der Ring schlummert — seine Macht erwacht ab Stufe 3.", "description_en": "The ring lies dormant — its power awakens at level 3.", "effects": [] },
    "1": { "description": "Stufe 3-4: Alter Self 2×/Tag. Die Verwandlung hält an, bis die Form aufgegeben wird; die Stimme wird ebenfalls verändert.", "description_en": "Level 3-4: Alter Self 2×/day. The change lasts until the form is dropped; the voice is altered as well.", "effects": [] },
    "2": { "description": "Stufe 5-6: Change Self 2×/Tag. Die Verwandlung hält an, bis die Form aufgegeben wird; die Stimme wird ebenfalls verändert.", "description_en": "Level 5-6: Change Self 2×/day. The change lasts until the form is dropped; the voice is altered as well.", "effects": [] },
    "3": { "description": "Stufe 7-8: Change Self kann nun bestimmte, konkrete Personen imitieren.", "description_en": "Level 7-8: Change Self can now imitate specific people.", "effects": [] },
    "4": { "description": "Stufe 9-10: Polymorph Self 2×/Tag.", "description_en": "Level 9-10: Polymorph Self 2×/day.", "effects": [] }
  }'::jsonb,
  '{
    "level_thresholds": [3, 5, 7, 9],
    "spell_abilities": [
      { "key": "alter_self", "name": "Alter Self", "name_en": "Alter Self", "unlock_level": 1, "usesPerDay": 2, "usesPerWeek": 0, "effect": "Gestalt verändern. Dauer, bis die Form aufgegeben wird; die Stimme wird ebenfalls verändert.", "effect_en": "Change shape. Lasts until the form is dropped; the voice is altered as well." },
      { "key": "change_self", "name": "Change Self", "name_en": "Change Self", "unlock_level": 2, "usesPerDay": 2, "usesPerWeek": 0, "replaces": "alter_self", "effect": "Gestalt verändern. Dauer, bis die Form aufgegeben wird; die Stimme wird ebenfalls verändert.", "effect_en": "Change shape. Lasts until the form is dropped; the voice is altered as well." },
      { "key": "change_self_specific", "name": "Change Self (bestimmte Personen)", "name_en": "Change Self (specific people)", "unlock_level": 3, "usesPerDay": 2, "usesPerWeek": 0, "replaces": "change_self", "effect": "Change Self, das nun bestimmte, konkrete Personen imitieren kann.", "effect_en": "Change Self that can now imitate specific people." },
      { "key": "polymorph_self", "name": "Polymorph Self", "name_en": "Polymorph Self", "unlock_level": 4, "usesPerDay": 2, "usesPerWeek": 0, "replaces": "change_self_specific", "effect": "Sich selbst in nahezu jede Kreatur verwandeln.", "effect_en": "Transform yourself into nearly any creature." }
    ]
  }'::jsonb,
  ''
FROM public.characters c
WHERE c.name = 'Isolde'
  AND NOT EXISTS (SELECT 1 FROM public.epic_items ei WHERE ei.character_id = c.id AND ei.slug = 'ring-der-vielen-gesichter')
LIMIT 1;
