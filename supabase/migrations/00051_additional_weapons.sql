-- Additional weapons from Complete Fighter's Handbook and other AD&D 2e sources

INSERT INTO public.weapons (name, name_en, damage_sm, damage_l, weapon_type, speed, weight, cost_gp, range_short, range_medium, range_long) VALUES
  ('Klauen-Handschuh', 'Glove Nail',         '1d4',   '1d4',   'melee',  2,  0.5,   3.0,  null, null, null),
  ('Kriegsfächer',     'War Fan',            '1d3',   '1d3',   'melee',  3,  0.5,   5.0,  null, null, null),
  ('Kama',             'Kama',               '1d4',   '1d4',   'melee',  4,  2.0,   3.0,  null, null, null),
  ('Sai',              'Sai',                '1d4',   '1d2',   'melee',  2,  1.0,   1.0,  null, null, null),
  ('Tonfa',            'Tonfa',              '1d4',   '1d3',   'melee',  3,  2.0,   1.0,  null, null, null),
  ('Chakram',          'Chakram',            '1d4',   '1d3',   'ranged', 4,  0.5,   5.0,  10, 20, 30),
  ('Lasso',            'Lasso',              '0',     '0',     'ranged',10,  3.0,   0.5,  10, 20, 30),
  ('Garotte',          'Garrote',            '1d4',   '1d4',   'melee',  2,  0.1,   1.0,  null, null, null),
  ('Degen',            'Rapier (Fencing)',   '1d6',   '1d8',   'melee',  4,  4.0,  15.0,  null, null, null),
  ('Knuckleduster',    'Cestus',             '1d4',   '1d3',   'melee',  2,  2.0,   1.0,  null, null, null),
  ('Wurfbeil',         'Francisca',          '1d6',   '1d4',   'ranged', 4,  3.0,   1.0,  10, 20, 30),
  ('Stilett',          'Stiletto',           '1d3',   '1d2',   'melee',  2,  0.5,   5.0,  null, null, null),
  ('Kampfstab (Bo)',   'Bo Stick',           '1d6',   '1d4',   'melee',  4,  4.0,   0.5,  null, null, null),
  ('Jo-Stab',          'Jo Stick',           '1d4',   '1d3',   'melee',  3,  2.0,   0.3,  null, null, null);
