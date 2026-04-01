-- Add is_shield boolean column to armor table
ALTER TABLE public.armor ADD COLUMN is_shield boolean NOT NULL DEFAULT false;

-- Mark existing shields
UPDATE public.armor SET is_shield = true
  WHERE lower(name) IN ('schild', 'shield')
     OR lower(name_en) IN ('shield');
