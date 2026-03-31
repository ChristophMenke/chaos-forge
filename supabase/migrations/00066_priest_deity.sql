-- Add deity (free text) and priesthood (priesthood ID) columns to characters
ALTER TABLE public.characters ADD COLUMN deity text;
ALTER TABLE public.characters ADD COLUMN priesthood text;
