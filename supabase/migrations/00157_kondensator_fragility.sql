-- Add structured fragility data to Kondensator (replaces text-only damage_trigger)
UPDATE public.epic_items
SET simple_effects = simple_effects || '{
  "fragility": {
    "base_chance": 50,
    "reduction_per_level": 2,
    "trigger_de": "Physischer Rettungswurf",
    "trigger_en": "Physical saving throw"
  }
}'::jsonb
WHERE slug = 'constitution_condenser';
