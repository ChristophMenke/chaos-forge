-- Sprocket's Mix-and-Match Blades — Epic Equipment with blade_system type

INSERT INTO public.epic_items (
  character_id, slug, name, name_en, description, description_en, icon,
  equipped, damage_level, max_damage_level, damage_levels, simple_effects, notes
) VALUES (
  '294c567c-5abb-4b6e-bc24-8d5105981ccf',
  'mix-and-match-blades',
  'Mix-and-Match-Klingen',
  'Mix-and-Match Blades',
  'Ein Set kleiner, kunstvoll gearbeiteter Wurfmesser. Jede Klinge ist mit einem hohlen Kanal versehen, der mit einer alchemistischen Mixtur gefüllt werden kann.',
  'A set of small, intricately crafted throwing knives. Each blade has a hollow channel that can be filled with an alchemical mixture.',
  'swords',
  true,
  0,
  0,
  '{}',
  '{
    "type": "blade_system",
    "max_prepared": 4,
    "blades": [
      { "id": 1, "mixture": null, "status": "ready" },
      { "id": 2, "mixture": null, "status": "ready" },
      { "id": 3, "mixture": null, "status": "ready" },
      { "id": 4, "mixture": null, "status": "ready" }
    ],
    "mixtures": {
      "red": {
        "count": 5,
        "name": "Rauchbombe",
        "name_en": "Smoke Bomb",
        "color": "#ef4444",
        "effect": "Dichte rote Rauchwolke, behindert Sicht und lenkt Gegner ab.",
        "effect_en": "Dense red smoke cloud, obstructs vision and distracts enemies.",
        "duration": "1 Runde",
        "duration_en": "1 round"
      },
      "blue": {
        "count": 5,
        "name": "Gefrierbrand",
        "name_en": "Frostburn",
        "color": "#3b82f6",
        "effect": "Komprimierte Flüssigkeit, die bei Kontakt verdampft und einen Kälteschock erzeugt. Nimmt dem Ziel kurzzeitig die Luft.",
        "effect_en": "Compressed liquid that evaporates on contact, causing a cold shock. Briefly takes the target''s breath away.",
        "duration": "1 Runde",
        "duration_en": "1 round"
      },
      "green": {
        "count": 4,
        "name": "Blenden",
        "name_en": "Blinding Dye",
        "color": "#22c55e",
        "effect": "Klebriger, leuchtender Farbstoff, der die Sicht des Ziels massiv einschränkt oder es völlig blendet.",
        "effect_en": "Sticky, luminous dye that severely impairs the target''s vision or completely blinds it.",
        "duration": "1W4 Runden",
        "duration_en": "1d4 rounds"
      },
      "purple": {
        "count": 4,
        "name": "Narkose",
        "name_en": "Narcosis",
        "color": "#a855f7",
        "effect": "Schnell wirkendes Narkosemittel. Bei Treffer an ungeschützten Stellen versetzt es das Ziel in Benommenheit.",
        "effect_en": "Fast-acting narcotic. On hit to unprotected areas, renders the target dazed.",
        "duration": "1W4 Runden",
        "duration_en": "1d4 rounds"
      }
    }
  }'::jsonb,
  ''
);
