-- Add shield_type column to armor table for reliable shield type detection
-- instead of name-based heuristics

ALTER TABLE public.armor
  ADD COLUMN IF NOT EXISTS shield_type text DEFAULT NULL;

-- Set shield_type for all known shield types
UPDATE public.armor SET shield_type = 'small' WHERE lower(name) = 'schild';
UPDATE public.armor SET shield_type = 'small' WHERE lower(name) = 'kleiner schild';
UPDATE public.armor SET shield_type = 'buckler' WHERE lower(name) = 'buckler';
UPDATE public.armor SET shield_type = 'medium' WHERE lower(name) = 'mittlerer schild';
UPDATE public.armor SET shield_type = 'large' WHERE lower(name) = 'großer schild';

-- Also ensure is_shield is correct for all shields
UPDATE public.armor SET is_shield = true WHERE shield_type IS NOT NULL;
