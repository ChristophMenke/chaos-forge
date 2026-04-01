-- Seed Monk and Shaman classes (Player's Option: Spells & Magic)
INSERT INTO public.classes (id, name, class_group, hit_die, ability_requirements, prime_requisites, exceptional_strength)
VALUES
  (
    'monk',
    'Mönch',
    'priest',
    8,
    '{"wis": 15, "int": 14, "con": 13}',
    ARRAY['wis', 'int'],
    false
  ),
  (
    'shaman',
    'Schamane',
    'priest',
    8,
    '{"wis": 12, "con": 12}',
    ARRAY['wis'],
    false
  )
ON CONFLICT (id) DO NOTHING;
