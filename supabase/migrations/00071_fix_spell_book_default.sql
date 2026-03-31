-- Fix: Default NULL means "all books allowed" — DM opts-in to restrict.
-- The previous default ARRAY['Player''s Handbook'] silently hid non-PHB spells.
ALTER TABLE public.characters ALTER COLUMN allowed_spell_books SET DEFAULT NULL;
UPDATE public.characters SET allowed_spell_books = NULL WHERE allowed_spell_books = ARRAY['Player''s Handbook'];
