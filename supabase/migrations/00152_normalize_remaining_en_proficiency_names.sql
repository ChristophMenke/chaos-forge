-- Normalize remaining EN-stored proficiency names to DE (primary name in weapons table).

UPDATE public.character_weapon_proficiencies SET weapon_name = 'Langbogen' WHERE weapon_name = 'Long bow';
UPDATE public.character_weapon_proficiencies SET weapon_name = 'Peitsche' WHERE weapon_name = 'Whip';
UPDATE public.character_weapon_proficiencies SET weapon_name = 'Kompositbogen (lang)' WHERE weapon_name = 'Composite long bow';
UPDATE public.character_weapon_proficiencies SET weapon_name = 'Kampfstab' WHERE weapon_name = 'Quarterstaff';
UPDATE public.character_weapon_proficiencies SET weapon_name = 'Klauen-Handschuh' WHERE weapon_name = 'Glove nail';
