-- Monster Compendium table for the GM Combat Simulator
-- Based on the AD&D 2e Monstrous Manual stat block format

CREATE TABLE monsters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,

  -- Monstrous Manual core stats
  climate_terrain TEXT,
  frequency TEXT DEFAULT 'common',
  organization TEXT,
  activity_cycle TEXT,
  diet TEXT,
  intelligence TEXT,
  treasure TEXT,
  alignment TEXT,

  -- Combat stats
  ac INTEGER NOT NULL,
  movement TEXT NOT NULL,
  hit_dice TEXT NOT NULL,
  hit_dice_value NUMERIC NOT NULL,
  thac0 INTEGER NOT NULL,
  attacks_per_round TEXT NOT NULL DEFAULT '1',
  damage TEXT NOT NULL,

  -- Special abilities
  special_attacks TEXT,
  special_defenses TEXT,
  magic_resistance INTEGER DEFAULT 0,

  -- Meta
  size TEXT NOT NULL CHECK (size IN ('T', 'S', 'M', 'L', 'H', 'G')),
  morale TEXT NOT NULL,
  morale_value INTEGER NOT NULL,
  xp_value INTEGER NOT NULL,

  -- Simulator fields
  default_zone TEXT DEFAULT 'melee' CHECK (default_zone IN ('melee', 'ranged')),
  has_ranged_attack BOOLEAN DEFAULT FALSE,
  typical_spells JSONB DEFAULT '[]'::jsonb,

  -- Source & description
  source_book TEXT DEFAULT 'MM',
  description TEXT,
  description_en TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_monsters_name ON monsters (name);
CREATE INDEX idx_monsters_name_en ON monsters (name_en);
CREATE INDEX idx_monsters_hd ON monsters (hit_dice_value);
CREATE INDEX idx_monsters_xp ON monsters (xp_value);

-- Updated_at trigger
CREATE TRIGGER set_monsters_updated_at
  BEFORE UPDATE ON monsters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: read for all authenticated users, write only via service role
ALTER TABLE monsters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read monsters"
  ON monsters FOR SELECT TO authenticated USING (true);
