-- Add magic_effects JSONB and custom_label to party_loot_items
-- Enables magical items in the party loot pool (for GM distribution)

ALTER TABLE party_loot_items
  ADD COLUMN IF NOT EXISTS magic_effects JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS custom_label TEXT;
