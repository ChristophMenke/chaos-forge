-- Seed 25 typical AD&D 2e Magic Items into general_items for party loot and GM reference
INSERT INTO general_items (name, name_en, weight, cost_gp, category, source_book, is_custom)
VALUES
  -- Rings
  ('Ring des Schutzes +1', 'Ring of Protection +1', 0, 0, 'magic', 'DMG', false),
  ('Ring der Unsichtbarkeit', 'Ring of Invisibility', 0, 0, 'magic', 'DMG', false),
  ('Ring der Feuerresistenz', 'Ring of Fire Resistance', 0, 0, 'magic', 'DMG', false),
  -- Potions
  ('Trank der Heilung', 'Potion of Healing', 0.5, 300, 'magic', 'DMG', false),
  ('Trank der Extra-Heilung', 'Potion of Extra-Healing', 0.5, 800, 'magic', 'DMG', false),
  ('Trank der Riesenstärke', 'Potion of Giant Strength', 0.5, 1000, 'magic', 'DMG', false),
  ('Trank der Geschwindigkeit', 'Potion of Speed', 0.5, 500, 'magic', 'DMG', false),
  ('Trank der Unsichtbarkeit', 'Potion of Invisibility', 0.5, 500, 'magic', 'DMG', false),
  -- Cloaks
  ('Umhang des Schutzes +1', 'Cloak of Protection +1', 1, 0, 'magic', 'DMG', false),
  ('Umhang der Verdrängung', 'Cloak of Displacement', 1, 0, 'magic', 'DMG', false),
  ('Elfenumhang', 'Cloak of Elvenkind', 1, 0, 'magic', 'DMG', false),
  -- Boots
  ('Elfenstiefel', 'Boots of Elvenkind', 1, 0, 'magic', 'DMG', false),
  ('Stiefel der Geschwindigkeit', 'Boots of Speed', 1, 0, 'magic', 'DMG', false),
  ('Stiefel des Fliegens', 'Boots of Flying', 1, 0, 'magic', 'DMG', false),
  -- Amulets & Necklaces
  ('Amulett des Schutzes vor Untoten', 'Amulet of Proof Against Detection and Location', 0.5, 0, 'magic', 'DMG', false),
  ('Periapt der Gesundheit', 'Periapt of Health', 0, 0, 'magic', 'DMG', false),
  ('Halskette der Feuerbälle', 'Necklace of Fireballs', 0.5, 0, 'magic', 'DMG', false),
  -- Bracers & Gauntlets
  ('Armschienen der Verteidigung RK 6', 'Bracers of Defense AC 6', 1, 0, 'magic', 'DMG', false),
  ('Handschuhe der Geschicklichkeit', 'Gauntlets of Dexterity', 1, 0, 'magic', 'DMG', false),
  ('Handschuhe der Ogerstärke', 'Gauntlets of Ogre Power', 2, 0, 'magic', 'DMG', false),
  -- Belts & Girdles
  ('Gürtel der Zwergenstärke', 'Girdle of Dwarvenkind', 2, 0, 'magic', 'DMG', false),
  ('Gürtel der Riesenstärke', 'Belt of Giant Strength', 2, 0, 'magic', 'DMG', false),
  -- Wands & Rods
  ('Stab der Heilung', 'Rod of Healing', 3, 0, 'magic', 'DMG', false),
  ('Zauberstab der Magie-Geschosse', 'Wand of Magic Missiles', 1, 0, 'magic', 'DMG', false),
  -- Miscellaneous
  ('Tasche des Haltens', 'Bag of Holding', 15, 0, 'magic', 'DMG', false)
ON CONFLICT DO NOTHING;
