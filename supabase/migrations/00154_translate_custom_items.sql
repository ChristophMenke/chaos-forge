-- Translate custom weapons and armor that were created with German names only.
-- Migration 00153 set name_en = name as fallback; this provides proper English translations.

-- Custom weapons
UPDATE public.weapons SET name_en = 'Throwing Dagger' WHERE name = 'Wurfdolch' AND name_en = 'Wurfdolch';
UPDATE public.weapons SET name_en = 'Claw Gauntlet' WHERE name = 'Klauen-Handschuh' AND name_en = 'Klauen-Handschuh';

-- Custom armor
UPDATE public.weapons SET name_en = 'Splint Mail' WHERE name = 'Armschiene des Schutzes' AND name_en = 'Armschiene des Schutzes';
UPDATE public.armor SET name_en = 'Splint Mail' WHERE name = 'Armschiene des Schutzes' AND name_en = 'Armschiene des Schutzes';

-- Also normalize the corresponding weapon proficiency names
-- (proficiencies should use the canonical DE name, but old data might have mixed versions)
UPDATE public.character_weapon_proficiencies SET weapon_name = 'Klauen-Handschuh'
WHERE weapon_name IN ('Claw Gauntlet', 'Glove nail', 'Glove Nail', 'Klauen-handschuh');
UPDATE public.character_weapon_proficiencies SET weapon_name = 'Wurfdolch'
WHERE weapon_name IN ('Throwing Dagger', 'Throwing dagger');
