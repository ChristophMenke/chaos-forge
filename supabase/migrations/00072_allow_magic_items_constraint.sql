-- Fix: Allow magic items (no weapon_id, no armor_id, but custom_label set)
ALTER TABLE public.character_equipment DROP CONSTRAINT IF EXISTS equipment_type_check;
ALTER TABLE public.character_equipment ADD CONSTRAINT equipment_type_check CHECK (
  (weapon_id IS NOT NULL AND armor_id IS NULL) OR
  (weapon_id IS NULL AND armor_id IS NOT NULL) OR
  (weapon_id IS NULL AND armor_id IS NULL AND custom_label IS NOT NULL)
);
