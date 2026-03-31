-- Add magic_effects JSONB field to character_equipment
-- Stores arbitrary stat modifiers for magic items (e.g., Belt of Strength: {"str": 19})
-- Format: {"str": 19, "hide_in_shadows": 10, "ac_bonus": -2}
ALTER TABLE public.character_equipment ADD COLUMN magic_effects jsonb DEFAULT '{}'::jsonb;
-- Add a label field for magic item names (e.g., "Belt of Giant Strength")
ALTER TABLE public.character_equipment ADD COLUMN custom_label text;
