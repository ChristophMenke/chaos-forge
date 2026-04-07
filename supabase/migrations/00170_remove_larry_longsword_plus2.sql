-- Remove Longsword +2 from Larry (new)'s inventory
DELETE FROM public.character_equipment
WHERE character_id = (SELECT id FROM public.characters WHERE name = 'Larry (new)')
  AND weapon_id = (SELECT id FROM public.weapons WHERE name = 'Langschwert')
  AND hit_bonus = 2
  AND damage_bonus = 2;
