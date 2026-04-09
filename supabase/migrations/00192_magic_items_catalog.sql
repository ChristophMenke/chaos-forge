-- Magic Items Catalog Table
-- Central registry for all magic items. Instances on characters/party reference this catalog.
-- Existing magic items in character_equipment (weapon_id=null, armor_id=null, custom_label NOT NULL)
-- and party_loot_items (magic_effects != '{}') will be backfilled.

CREATE TABLE magic_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  magic_effects JSONB NOT NULL DEFAULT '{}',
  weight NUMERIC(5,1) NOT NULL DEFAULT 0,
  source_book TEXT NOT NULL DEFAULT 'Custom',
  is_custom BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FKs on existing tables (nullable — legacy items may not have a catalog entry yet)
ALTER TABLE character_equipment ADD COLUMN IF NOT EXISTS magic_item_id UUID REFERENCES magic_items(id);
ALTER TABLE party_loot_items ADD COLUMN IF NOT EXISTS magic_item_id UUID REFERENCES magic_items(id);

-- RLS
ALTER TABLE magic_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "magic_items_select" ON magic_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "magic_items_insert" ON magic_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "magic_items_update" ON magic_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "magic_items_delete" ON magic_items FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_magic_items_name ON magic_items(name);
CREATE INDEX idx_magic_items_name_en ON magic_items(name_en);
CREATE INDEX idx_character_equipment_magic_item ON character_equipment(magic_item_id) WHERE magic_item_id IS NOT NULL;
CREATE INDEX idx_party_loot_items_magic_item ON party_loot_items(magic_item_id) WHERE magic_item_id IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER set_magic_items_updated_at
  BEFORE UPDATE ON magic_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Backfill: Create catalog entries from existing magic items in character_equipment
-- and link them back via magic_item_id
DO $$
DECLARE
  rec RECORD;
  catalog_id UUID;
BEGIN
  -- Backfill from character_equipment (magic items have weapon_id=null, armor_id=null, custom_label set)
  FOR rec IN
    SELECT DISTINCT custom_label, magic_effects
    FROM character_equipment
    WHERE weapon_id IS NULL AND armor_id IS NULL AND custom_label IS NOT NULL
  LOOP
    -- Extract category from custom_label pattern "Name (Category)"
    INSERT INTO magic_items (name, name_en, category, magic_effects, source_book, is_custom)
    VALUES (
      rec.custom_label,
      rec.custom_label,
      CASE
        WHEN rec.custom_label ~ '\(([^)]+)\)$'
        THEN (regexp_match(rec.custom_label, '\(([^)]+)\)$'))[1]
        ELSE NULL
      END,
      COALESCE(rec.magic_effects, '{}'),
      'Custom',
      true
    )
    RETURNING id INTO catalog_id;

    -- Link existing instances
    UPDATE character_equipment
    SET magic_item_id = catalog_id
    WHERE weapon_id IS NULL AND armor_id IS NULL
      AND custom_label = rec.custom_label
      AND magic_item_id IS NULL;
  END LOOP;

  -- Backfill from party_loot_items (magic items have non-empty magic_effects)
  FOR rec IN
    SELECT DISTINCT custom_label, custom_name, magic_effects
    FROM party_loot_items
    WHERE magic_effects IS NOT NULL AND magic_effects != '{}'::jsonb
      AND magic_item_id IS NULL
  LOOP
    INSERT INTO magic_items (name, name_en, category, magic_effects, source_book, is_custom)
    VALUES (
      COALESCE(rec.custom_label, rec.custom_name, 'Unknown Magic Item'),
      COALESCE(rec.custom_label, rec.custom_name, 'Unknown Magic Item'),
      NULL,
      COALESCE(rec.magic_effects, '{}'),
      'Custom',
      true
    )
    RETURNING id INTO catalog_id;

    UPDATE party_loot_items
    SET magic_item_id = catalog_id
    WHERE (custom_label = rec.custom_label OR custom_name = rec.custom_name)
      AND magic_effects = rec.magic_effects
      AND magic_item_id IS NULL;
  END LOOP;
END $$;
