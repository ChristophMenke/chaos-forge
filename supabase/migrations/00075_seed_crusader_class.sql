-- Seed Crusader class (Player's Option: Spells & Magic)
INSERT INTO public.classes (id, name, class_group, hit_die, ability_requirements, prime_requisites, exceptional_strength)
VALUES (
  'crusader',
  'Kreuzritter',
  'priest',
  8,
  '{"wis": 9, "str": 12, "cha": 12}',
  ARRAY['wis', 'str'],
  false
)
ON CONFLICT (id) DO NOTHING;
