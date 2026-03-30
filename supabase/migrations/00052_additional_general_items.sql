-- Additional general items from PHB Table 44 (Equipment) and other AD&D 2e sources
-- Only items NOT already in the database

INSERT INTO public.general_items (name, name_en, weight, cost_gp, category) VALUES
  -- Clothing & Personal
  ('Wintermantel',           'Winter Cloak',          3.0,   0.5, 'clothing'),
  ('Regenumhang',            'Rain Cloak',            3.0,   0.8, 'clothing'),
  ('Stiefel (weich)',        'Boots (soft)',           3.0,   1.0, 'clothing'),
  ('Stiefel (hart)',         'Boots (hard)',           4.0,   1.5, 'clothing'),
  ('Reiterstiefel',          'Riding Boots',          4.0,   3.0, 'clothing'),
  ('Handschuhe',             'Gloves',                0.5,   1.0, 'clothing'),
  ('Hut/Kappe',              'Hat/Cap',               0.5,   0.1, 'clothing'),
  ('Gürtel',                 'Belt',                  0.5,   0.3, 'clothing'),
  ('Kleidung (einfach)',     'Clothing (common)',      3.0,   0.5, 'clothing'),
  ('Kleidung (fein)',        'Clothing (fine)',         3.0,   5.0, 'clothing'),
  ('Robe',                   'Robe',                  3.0,   3.0, 'clothing'),

  -- Containers
  ('Kiste (klein)',          'Chest (small)',         25.0,   1.0, 'container'),
  ('Kiste (groß)',           'Chest (large)',         50.0,   2.0, 'container'),
  ('Fass (klein)',           'Barrel (small)',        30.0,   2.0, 'container'),
  ('Korb (groß)',            'Basket (large)',         1.0,   0.3, 'container'),
  ('Kartentasche',           'Map/Scroll Case',        0.5,   0.8, 'container'),
  ('Flasche/Fläschchen',    'Vial/Bottle',            0.1,   0.1, 'container'),
  ('Wasserfass',             'Water Barrel',          50.0,   2.5, 'container'),
  ('Tragetasche',            'Shoulder Bag',           1.0,   0.5, 'container'),

  -- Light & Fire
  ('Fackeln (10)',           'Torches (10)',          10.0,   0.1, 'light'),
  ('Kerzen (10)',            'Candles (10)',            1.0,   0.1, 'light'),
  ('Ölflaschen (5)',         'Oil Flasks (5)',          5.0,   0.5, 'light'),
  ('Zunder',                 'Tinder',                 0.1,   0.01,'light'),
  ('Laterne (Sturm)',        'Lantern (weather)',       3.0,  15.0, 'light'),

  -- Food & Drink
  ('Trockenrationen (1 Tag)','Dry Rations (1 day)',    1.0,   0.5, 'food'),
  ('Frischrationen (1 Tag)', 'Fresh Rations (1 day)',  1.0,   0.3, 'food'),
  ('Bierkrug',               'Ale/Beer (mug)',         1.0,   0.01,'food'),
  ('Wein (Flasche)',         'Wine (bottle)',           2.0,   0.5, 'food'),
  ('Brot (Laib)',            'Bread (loaf)',            1.0,   0.01,'food'),
  ('Käse (Stück)',           'Cheese (wedge)',          0.5,   0.05,'food'),
  ('Fleisch (getrocknet)',   'Meat (dried, 1 lb)',      1.0,   0.5, 'food'),
  ('Futterbeutel (Pferd)',   'Horse Feed (1 day)',     10.0,   0.05,'food'),

  -- Adventuring Gear
  ('Brecheisen',             'Crowbar',                5.0,   1.0, 'equipment'),
  ('Schaufel',               'Shovel',                 8.0,   2.0, 'equipment'),
  ('Spitzhacke',             'Pick, Miner''s',        10.0,   3.0, 'equipment'),
  ('Hammer',                 'Hammer',                 2.0,   0.5, 'equipment'),
  ('Nägel (10)',             'Nails (10)',              0.5,   0.01,'equipment'),
  ('Seil, Klettern (50 Fuß)','Climbing Rope (50 ft)',  8.0,   1.5, 'equipment'),
  ('Angelhaken & Schnur',    'Fishhook & Line',         0.1,   0.1, 'equipment'),
  ('Kompass',                'Compass',                 0.5,  25.0, 'equipment'),
  ('Fernglas',               'Spyglass',                1.0, 100.0, 'equipment'),
  ('Lupe',                   'Magnifying Glass',        0.1,  50.0, 'equipment'),
  ('Sanduhr',                'Hourglass',               1.0,  25.0, 'equipment'),
  ('Kerzenlaterne',          'Candle Lantern',          1.0,   5.0, 'equipment'),
  ('Enterhaken & Seil',      'Grappling Hook & Rope', 12.0,   2.0, 'equipment'),
  ('Kletterausrüstung',     'Climbing Gear',           5.0,   5.0, 'equipment'),
  ('Fallen-Set',             'Trap Set',                2.0,  10.0, 'equipment'),
  ('Verkleidungs-Set',       'Disguise Kit',            3.0,  25.0, 'equipment'),
  ('Komponententasche',      'Component Pouch',          1.0,   5.0, 'equipment'),
  ('Pfeife',                 'Pipe',                    0.1,   0.5, 'equipment'),
  ('Tabak (Beutel)',         'Tobacco (pouch)',          0.5,   0.5, 'equipment'),
  ('Würfel (Paar)',         'Dice (pair)',              0.1,   0.1, 'equipment'),
  ('Spielkarten',            'Playing Cards',           0.1,   0.5, 'equipment'),

  -- Writing & Scholarly
  ('Feder & Tinte',          'Quill & Ink',             0.1,   1.0, 'writing'),
  ('Buch (leer)',            'Book (blank)',             3.0,  15.0, 'writing'),
  ('Schreibtafel & Griffel', 'Slate & Chalk',           1.0,   0.1, 'writing'),
  ('Papier (10 Blatt)',      'Paper (10 sheets)',        0.5,   2.0, 'writing'),

  -- Musical Instruments
  ('Flöte',                  'Flute',                   1.0,   5.0, 'instrument'),
  ('Laute',                  'Lute',                    5.0,  25.0, 'instrument'),
  ('Trommel',                'Drum',                    5.0,   5.0, 'instrument'),
  ('Horn',                   'Horn',                    2.0,  10.0, 'instrument'),
  ('Harfe (klein)',          'Harp (small)',             5.0,  50.0, 'instrument'),

  -- Transport & Animals
  ('Sattel (Reit-)',         'Saddle (riding)',         25.0,  10.0, 'transport'),
  ('Sattel (Pack-)',         'Saddle (pack)',           15.0,   5.0, 'transport'),
  ('Satteltaschen',          'Saddlebags',              7.0,   4.0, 'transport'),
  ('Zaumzeug',               'Bridle',                  3.0,   2.0, 'transport'),
  ('Handkarren',             'Cart (hand)',             50.0,  15.0, 'transport'),

  -- Religious & Alchemical
  ('Weihrauch (Beutel)',     'Incense (pouch)',          0.5,   1.0, 'religious'),
  ('Heiliges Wasser (5)',    'Holy Water (5 vials)',      2.5, 125.0, 'religious'),
  ('Knoblauch (Bund)',       'Garlic (bunch)',            0.5,   0.05,'religious'),
  ('Silberspiegel',          'Silver Mirror',             1.0,  20.0, 'religious'),
  ('Holzpflock (5)',         'Wooden Stake (5)',          2.0,   0.1, 'religious');
