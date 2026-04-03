-- Fill in missing name_en for custom weapons and armor.
-- Sets name_en = name as fallback so localized() never falls back to German.

-- A) Custom weapons: name_en = name as fallback
UPDATE public.weapons
SET name_en = name
WHERE name_en IS NULL;

-- B) Custom armor: same
UPDATE public.armor
SET name_en = name
WHERE name_en IS NULL;

-- C) Normalize proficiency names: EN → DE canonical name
-- Only where a weapon with matching name_en exists
UPDATE public.character_weapon_proficiencies cwp
SET weapon_name = w.name
FROM public.weapons w
WHERE lower(cwp.weapon_name) = lower(w.name_en)
  AND lower(cwp.weapon_name) != lower(w.name);

-- D) Remove duplicates created by normalization
-- Keep the specialized version, or the older one if both are the same
DELETE FROM public.character_weapon_proficiencies a
USING public.character_weapon_proficiencies b
WHERE a.character_id = b.character_id
  AND lower(a.weapon_name) = lower(b.weapon_name)
  AND a.id != b.id
  AND (a.specialization = false OR a.id > b.id);
