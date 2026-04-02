-- Add overclock ability to Sprocket's Kondensator
UPDATE public.epic_items
SET simple_effects = simple_effects || '{
  "overclock": {
    "name": "Übertakten",
    "name_en": "Overclock",
    "duration_hours": 1,
    "requires_check": "Ingenieurskunst",
    "requires_check_en": "Engineering",
    "con_override": 20,
    "poison_save_penalty": 1,
    "heals_per_hour": 1,
    "description": "Übertaktet den Kondensator für 1 Stunde. KON wird auf 20 gesetzt, Rettungswurf gg. Gift +1 (schlechter), heilt 1 TP pro Stunde. Erfordert erfolgreichen Ingenieurskunst-Wurf.",
    "description_en": "Overclocks the Condenser for 1 hour. CON becomes 20, Save vs. Poison +1 (worse), heals 1 HP per hour. Requires a successful Engineering check."
  }
}'::jsonb
WHERE slug = 'constitution_condenser';
