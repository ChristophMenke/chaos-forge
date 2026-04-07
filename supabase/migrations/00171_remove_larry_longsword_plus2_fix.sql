-- Remove Long Sword +2 from Larry (new)'s inventory (weapon name is 'Long Sword')
DELETE FROM public.character_equipment
WHERE character_id = (SELECT id FROM public.characters WHERE name = 'Larry (new)')
  AND weapon_id = (SELECT id FROM public.weapons WHERE name = 'Long Sword')
  AND hit_bonus = 2
  AND damage_bonus = 2;
