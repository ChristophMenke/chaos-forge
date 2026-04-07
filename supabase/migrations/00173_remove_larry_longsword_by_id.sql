-- Remove Long Sword +2 from Larry's inventory using character UUID from URL
DELETE FROM public.character_equipment
WHERE character_id = '09ad6d65-f871-400b-9daa-5a9890bcc84b'
  AND weapon_id IS NOT NULL
  AND hit_bonus = 2
  AND damage_bonus = 2
  AND custom_label IS NULL;
