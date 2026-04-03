-- Normalize weapon proficiency names to match the weapons table (DE primary name).
-- These mismatches were caused by import using non-standard English naming conventions.

-- "Axe, battle" → "Streitaxt" (Battle Axe)
UPDATE public.character_weapon_proficiencies
SET weapon_name = 'Streitaxt'
WHERE weapon_name = 'Axe, battle';

-- "Crossbow, light" → "Leichte Armbrust" (Light Crossbow)
UPDATE public.character_weapon_proficiencies
SET weapon_name = 'Leichte Armbrust'
WHERE weapon_name = 'Crossbow, light';

-- "Sword, short" → "Kurzschwert" (Short Sword)
UPDATE public.character_weapon_proficiencies
SET weapon_name = 'Kurzschwert'
WHERE weapon_name = 'Sword, short';

-- "Sword, long" → "Langschwert" (Long Sword)
UPDATE public.character_weapon_proficiencies
SET weapon_name = 'Langschwert'
WHERE weapon_name = 'Sword, long';

-- "Axe, hand/throwing" → "Wurfaxt" (Throwing Axe)
UPDATE public.character_weapon_proficiencies
SET weapon_name = 'Wurfaxt'
WHERE weapon_name = 'Axe, hand/throwing';

-- "Two-Handed Sword" → "Zweihänder" (stored as EN name)
UPDATE public.character_weapon_proficiencies
SET weapon_name = 'Zweihänder'
WHERE weapon_name = 'Two-Handed Sword';

-- "Dagger" → "Dolch" (stored as EN name)
UPDATE public.character_weapon_proficiencies
SET weapon_name = 'Dolch'
WHERE weapon_name = 'Dagger';

-- "Javelin" → "Wurfspeer" (stored as EN name)
UPDATE public.character_weapon_proficiencies
SET weapon_name = 'Wurfspeer'
WHERE weapon_name = 'Javelin';

-- Remove non-weapon entries that were incorrectly added as weapon proficiencies
DELETE FROM public.character_weapon_proficiencies
WHERE weapon_name = 'Shield (medium)';

DELETE FROM public.character_weapon_proficiencies
WHERE weapon_name = 'Composite armor, three-quarter plate';
