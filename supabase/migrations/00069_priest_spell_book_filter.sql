-- Add source book filter for priest spells
-- allowed_spell_books: which source books the DM allows (null = all books)
-- spell_whitelist: individual spells from non-allowed books that are still permitted
ALTER TABLE public.characters ADD COLUMN allowed_spell_books text[] DEFAULT ARRAY['Player''s Handbook'];
ALTER TABLE public.characters ADD COLUMN spell_whitelist text[] DEFAULT ARRAY[]::text[];
