-- Cleanup OCR artifacts in priest spell spheres
-- Normalize all sphere values to clean, canonical forms

-- Fix obvious OCR garbage
UPDATE public.spells SET sphere = 'animal' WHERE sphere = 'animal "';
UPDATE public.spells SET sphere = 'charm' WHERE sphere IN ('charm ?', 'charm tees');
UPDATE public.spells SET sphere = 'guardian' WHERE sphere = 'guardían';
UPDATE public.spells SET sphere = 'protection' WHERE sphere = 'protection p';

-- Normalize elemental sub-spheres (remove OCR trailing garbage)
UPDATE public.spells SET sphere = 'elemental air' WHERE sphere IN ('elemental air ке', 'elemental air or silt');
UPDATE public.spells SET sphere = 'elemental earth' WHERE sphere IN ('elemental earth >', 'elemental earth ru ua', 'elemental earth or silt');
UPDATE public.spells SET sphere = 'elemental water' WHERE sphere IN ('elemental water wie', 'elemental water кед', 'elemental water (lightning)');
UPDATE public.spells SET sphere = 'elemental sun' WHERE sphere = 'elemental sun whe';

-- Normalize elemental (all) → elemental
UPDATE public.spells SET sphere = 'elemental' WHERE sphere = 'elemental (all)';

-- Normalize earth → elemental earth
UPDATE public.spells SET sphere = 'elemental earth' WHERE sphere = 'earth';

-- Normalize ward → wards (canonical form)
UPDATE public.spells SET sphere = 'wards' WHERE sphere = 'ward';

-- special → leave as-is (1 spell, valid AD&D category)
