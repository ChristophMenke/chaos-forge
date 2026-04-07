-- Enhance chronicle_npcs with Normal/Advanced tiers and player visibility

ALTER TABLE chronicle_npcs
  ADD COLUMN tier TEXT DEFAULT 'normal' CHECK (tier IN ('normal', 'advanced')),
  ADD COLUMN is_visible_to_players BOOLEAN DEFAULT FALSE,
  -- Advanced tier fields (nullable, only populated when tier = 'advanced')
  ADD COLUMN race_id TEXT,
  ADD COLUMN class_ids TEXT[] DEFAULT '{}',
  ADD COLUMN level INTEGER,
  ADD COLUMN str INTEGER,
  ADD COLUMN dex INTEGER,
  ADD COLUMN con INTEGER,
  ADD COLUMN "int" INTEGER,
  ADD COLUMN wis INTEGER,
  ADD COLUMN cha INTEGER,
  ADD COLUMN hp_current INTEGER,
  ADD COLUMN hp_max INTEGER,
  ADD COLUMN ac INTEGER,
  ADD COLUMN thac0 INTEGER,
  ADD COLUMN equipment_notes TEXT,
  ADD COLUMN spell_notes TEXT,
  ADD COLUMN notes TEXT DEFAULT '';
