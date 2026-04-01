-- Add dual-class support to character_classes
-- switch_level: the level at which the character abandoned this class
-- When NOT NULL, this class is the "original" class in a dual-class setup
ALTER TABLE public.character_classes
ADD COLUMN IF NOT EXISTS switch_level integer DEFAULT NULL;

COMMENT ON COLUMN public.character_classes.switch_level IS
  'Dual-class: level at which the character switched away from this class. NULL = active class.';
