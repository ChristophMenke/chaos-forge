-- Fix missing English name for PHB spell "Unsichtbarkeit" (Invisibility)
UPDATE public.spells
SET name_en = 'Invisibility'
WHERE name = 'Unsichtbarkeit' AND spell_type = 'wizard' AND level = 2 AND name_en IS NULL;

-- Fix OCR artifact in Minor Creation description ("vol- ume" → "volume")
UPDATE public.spells
SET description = REPLACE(description, 'vol- ume', 'volume'),
    description_en = REPLACE(COALESCE(description_en, description), 'vol- ume', 'volume')
WHERE name_en = 'Minor Creation' AND spell_type = 'wizard';
