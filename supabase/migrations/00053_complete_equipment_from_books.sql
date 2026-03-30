-- Complete equipment from Arms and Equipment Guide (AEG), Complete Fighter's Handbook (PHBR01),
-- Complete Thief's Handbook (PHBR02), and other AD&D 2e sources.
-- Uses WHERE NOT EXISTS to avoid duplicates with existing entries.

-- ═══════════════════════════════════════════════════════════════════════════════
-- WEAPONS — Swords
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.weapons (name, name_en, damage_sm, damage_l, weapon_type, speed, weight, cost_gp, range_short, range_medium, range_long)
SELECT * FROM (VALUES
  ('Katana',             'Katana',             '1d10',  '1d12',  'melee',  4,  6.0, 100.0, null::int, null::int, null::int),
  ('Wakizashi',          'Wakizashi',          '1d8',   '1d8',   'melee',  3,  3.0,  50.0, null, null, null),
  ('Entermesser',        'Cutlass',            '1d6',   '1d8',   'melee',  5,  4.0,  12.0, null, null, null),
  ('Drusus',             'Drusus',             '1d6+1', '1d8+1', 'melee',  3,  3.0,  50.0, null, null, null),
  ('Säbel',              'Sabre',              '1d6+1', '1d8+1', 'melee',  4,  5.0,  17.0, null, null, null),
  ('Claymore',           'Claymore',           '2d4',   '2d8',   'melee',  9, 10.0,  25.0, null, null, null),
  ('Khopesh',            'Khopesh',            '2d4',   '1d6',   'melee',  9,  7.0,  10.0, null, null, null),
  ('Falchion',           'Falchion',           '1d6+1', '2d4',   'melee',  5,  8.0,  17.0, null, null, null),
  ('Parierdolch',        'Main-Gauche',        '1d4',   '1d3',   'melee',  2,  2.0,   3.0, null, null, null)
) AS v(name, name_en, damage_sm, damage_l, weapon_type, speed, weight, cost_gp, range_short, range_medium, range_long)
WHERE NOT EXISTS (SELECT 1 FROM public.weapons w WHERE LOWER(w.name_en) = LOWER(v.name_en));

-- ═══════════════════════════════════════════════════════════════════════════════
-- WEAPONS — Polearms
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.weapons (name, name_en, damage_sm, damage_l, weapon_type, speed, weight, cost_gp, range_short, range_medium, range_long)
SELECT * FROM (VALUES
  ('Bardiche',           'Bardiche',           '2d4',   '3d4',   'melee',  9, 12.0,   7.0, null::int, null::int, null::int),
  ('Bec de Corbin',      'Bec de Corbin',      '1d8',   '1d6',   'melee',  9, 10.0,   6.0, null, null, null),
  ('Bill-Guisarme',      'Bill-Guisarme',      '2d4',   '1d10',  'melee', 10, 15.0,   7.0, null, null, null),
  ('Fauchard',           'Fauchard',           '1d6',   '1d8',   'melee',  8,  7.0,   3.0, null, null, null),
  ('Fauchard-Fork',      'Fauchard-Fork',      '1d8',   '1d10',  'melee',  8,  8.0,   8.0, null, null, null),
  ('Gleve-Guisarme',     'Glaive-Guisarme',    '2d4',   '2d6',   'melee',  9, 10.0,  12.0, null, null, null),
  ('Guisarme-Voulge',    'Guisarme-Voulge',    '2d4',   '2d4',   'melee', 10, 15.0,   8.0, null, null, null),
  ('Hakenfauchard',      'Hook Fauchard',      '1d4',   '1d4',   'melee',  9,  8.0,  10.0, null, null, null),
  ('Luzernhammer',       'Lucern Hammer',      '2d4',   '1d6',   'melee',  9, 15.0,   7.0, null, null, null),
  ('Militärgabel',       'Military Fork',      '1d8',   '2d4',   'melee',  7,  7.0,   5.0, null, null, null),
  ('Partisane',          'Partisan',           '1d6',   '1d6+1', 'melee',  9,  8.0,  10.0, null, null, null),
  ('Ranseur',            'Ranseur',            '2d4',   '2d4',   'melee',  8,  7.0,   6.0, null, null, null),
  ('Spetum',             'Spetum',             '1d6+1', '2d4',   'melee',  8,  7.0,   5.0, null, null, null),
  ('Voulge',             'Voulge',             '2d4',   '2d4',   'melee', 10, 12.0,   5.0, null, null, null),
  ('Ahlpike',            'Awl Pike',           '1d6',   '1d12',  'melee', 13, 12.0,   3.0, null, null, null),
  ('Naginata',           'Naginata',           '1d8',   '1d10',  'melee',  7, 10.0,   8.0, null, null, null),
  ('Tetsubo',            'Tetsubo',            '1d8',   '1d8',   'melee',  7,  7.0,   2.0, null, null, null)
) AS v(name, name_en, damage_sm, damage_l, weapon_type, speed, weight, cost_gp, range_short, range_medium, range_long)
WHERE NOT EXISTS (SELECT 1 FROM public.weapons w WHERE LOWER(w.name_en) = LOWER(v.name_en));

-- ═══════════════════════════════════════════════════════════════════════════════
-- WEAPONS — Misc Melee + Ranged
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.weapons (name, name_en, damage_sm, damage_l, weapon_type, speed, weight, cost_gp, range_short, range_medium, range_long)
SELECT * FROM (VALUES
  ('Wurfspeer',          'Javelin',            '1d6',   '1d6',   'both',   4,  2.0,   0.5, 20::int, 40::int, 60::int),
  ('Harpune',            'Harpoon',            '2d4',   '2d6',   'both',   7,  6.0,  20.0, 10, 20, 30),
  ('Geißel',             'Scourge',            '1d4',   '1d2',   'melee',  5,  2.0,   1.0, null, null, null),
  ('Totschläger',        'Sap',                '1d2',   '1d2',   'melee',  2,  1.0,   0.1, null, null, null),
  ('Stabschleuder',      'Staff Sling',        '1d4+1', '1d6+1', 'ranged', 11, 2.0,   0.2, 30, 60, 90),
  ('Menschenfänger',     'Mancatcher',         '0',     '0',     'melee',  7,  8.0,  30.0, null, null, null),
  ('Handarmbrust',       'Hand Crossbow',      '1d3',   '1d2',   'ranged', 5,  3.0, 300.0, 20, 40, 60),
  ('Kette (Waffe)',      'Chain',              '1d4+1', '1d4',   'melee',  5,  3.0,   0.5, null, null, null),
  ('Belegstift',         'Belaying Pin',       '1d3',   '1d3',   'melee',  4,  2.0,   0.02, null, null, null),
  ('Daikyu',             'Daikyu',             '1d8',   '1d6',   'ranged', 7,  3.0, 100.0, 70, 140, 210),
  ('Messer',             'Knife',              '1d3',   '1d2',   'both',   2,  0.5,   0.5, 10, 20, 30),
  ('Parierdolch',        'Parrying Dagger',    '1d4',   '1d3',   'melee',  2,  1.0,   5.0, null, null, null),
  ('Knochendolch',       'Bone Dagger',        '1d2',   '1d2',   'melee',  2,  1.0,   0.1, null, null, null),
  ('Steindolch',         'Stone Dagger',       '1d3',   '1d2',   'melee',  2,  1.0,   0.2, null, null, null),
  ('Kletterdolch',       'Climbing Dagger',    '1d4',   '1d3',   'melee',  2,  1.0,   5.0, null, null, null),
  ('Rasierklingenring',  'Razor Ring',         '1d3',   '1d2',   'melee',  1,  0.1,   2.0, null, null, null),
  ('Stockdegen',         'Sword Stick',        '1d6',   '1d8',   'melee',  5,  4.0,  25.0, null, null, null)
) AS v(name, name_en, damage_sm, damage_l, weapon_type, speed, weight, cost_gp, range_short, range_medium, range_long)
WHERE NOT EXISTS (SELECT 1 FROM public.weapons w WHERE LOWER(w.name_en) = LOWER(v.name_en));

-- ═══════════════════════════════════════════════════════════════════════════════
-- ARMOR — from AEG
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.armor (name, name_en, ac, weight, cost_gp, max_movement)
SELECT * FROM (VALUES
  ('Brigantine',           'Brigandine Armor',     6,  35.0,  120.0,  9),
  ('Drow-Kettenhemd',      'Drow Chain Mail',      4,  25.0, 1500.0, 12),
  ('Zwergen-Plattenpanzer','Dwarven Plate Mail',   2,  40.0, 3000.0,  6)
) AS v(name, name_en, ac, weight, cost_gp, max_movement)
WHERE NOT EXISTS (SELECT 1 FROM public.armor a WHERE LOWER(a.name_en) = LOWER(v.name_en));

-- ═══════════════════════════════════════════════════════════════════════════════
-- GENERAL ITEMS — from Thief's Handbook + AEG
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.general_items (name, name_en, weight, cost_gp, category)
SELECT * FROM (VALUES
  ('Tarnanzug (dunkel)',    'Darksuit',               5.0,   30.0, 'clothing'),
  ('Waldanzug',             'Woodland Suit',          5.0,   35.0, 'clothing'),
  ('Schleichstiefel',       'Footpad''s Boots',       3.0,    8.0, 'clothing'),
  ('Hörrohr (Messing)',     'Listening Cone',         1.0,    2.0, 'equipment'),
  ('Waffenschwärze',        'Weaponblack',            0.1,    2.0, 'equipment'),
  ('Metallsäure (Flasche)', 'Acid, Metal-eating',     0.5,   50.0, 'equipment'),
  ('Metallsäge',            'Hacksaw',                1.0,    3.0, 'equipment'),
  ('Metallfeile',           'Metal File',             0.5,    0.5, 'equipment'),
  ('Drahtschneider',        'Wire Cutters',           0.5,    1.0, 'equipment'),
  ('Meißel-Set (3)',        'Chisels, set of 3',      1.0,    2.0, 'equipment'),
  ('Schlüssel-Set',         'Keymaking Set',          1.0,   50.0, 'equipment'),
  ('Skelettschlüssel',      'Skeleton Key',           0.1,   25.0, 'equipment'),
  ('Glasschneider',         'Glass Cutter',           0.5,   10.0, 'equipment'),
  ('Krähenfüße (10)',       'Caltrops (10)',           2.0,    1.0, 'equipment'),
  ('Murmeln (Beutel, 30)',  'Marbles (bag of 30)',     1.0,    0.2, 'equipment'),
  ('Blendpulver',           'Blinding Powder',         0.1,    5.0, 'equipment'),
  ('Hundepfeffer (Päckchen)','Dog Pepper',              0.1,    1.0, 'equipment'),
  ('Anissamen (Fläschchen)','Aniseed (vial)',          0.1,    1.0, 'equipment'),
  ('Katzenstink (Fläschchen)','Catstink (vial)',        0.1,    5.0, 'equipment'),
  ('Gezinkte Karten',       'Marked Cards',            0.1,    5.0, 'equipment'),
  ('Gezinkte Würfel (4)',  'Biased Dice (set of 4)',  0.1,    2.0, 'equipment'),
  ('Einbrechergeschirr',    'Housebreaker''s Harness', 3.0,   25.0, 'equipment'),
  ('Flaschenzug (leicht)',  'Block & Tackle (light)',  5.0,    8.0, 'equipment'),
  ('Flaschenzug (schwer)',  'Block & Tackle (heavy)',  10.0,  25.0, 'equipment'),
  ('Steigeisen (Paar)',     'Crampons',                2.0,    4.0, 'equipment'),
  ('Leuchtfeuerlaterne',    'Beacon Lantern',          5.0,  150.0, 'light'),
  ('Handlampe (verspiegelt)','Hand Lamp (silvered)',    1.0,    5.0, 'light'),
  ('Wachsblock',            'Wax Block',               1.0,    0.1, 'equipment'),
  ('Teerpappe',             'Tar Paper',               0.5,    0.1, 'equipment'),
  ('Lederriemen (Paar)',    'Leather Straps (pair)',    1.0,    0.3, 'equipment'),
  ('Armschlinge',           'Arm Sling',               0.5,   0.03, 'equipment'),
  ('Handwärmerlampe',       'Hand-Warming Lamp',        1.0,    3.0, 'equipment'),
  ('Trichter (klein)',      'Funnel (small)',           0.1,   0.03, 'equipment')
) AS v(name, name_en, weight, cost_gp, category)
WHERE NOT EXISTS (SELECT 1 FROM public.general_items g WHERE LOWER(g.name_en) = LOWER(v.name_en));
