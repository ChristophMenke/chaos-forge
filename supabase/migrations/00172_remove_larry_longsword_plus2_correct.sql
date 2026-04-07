-- Remove Long Sword +2 from Larry's inventory (character name is 'Larry')
DELETE FROM public.character_equipment
WHERE character_id = (SELECT id FROM public.characters WHERE name = 'Larry')
  AND weapon_id = (SELECT id FROM public.weapons WHERE name = 'Long Sword')
  AND hit_bonus = 2
  AND damage_bonus = 2;
