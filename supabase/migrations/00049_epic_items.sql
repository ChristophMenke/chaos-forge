-- Epic Items: Character-bound items with damage progression and stat effects
CREATE TABLE public.epic_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  name_en text,
  description text NOT NULL DEFAULT '',
  description_en text,
  icon text NOT NULL DEFAULT 'sparkles',
  equipped boolean NOT NULL DEFAULT false,
  damage_level integer NOT NULL DEFAULT 0,
  max_damage_level integer NOT NULL DEFAULT 0,
  damage_levels jsonb NOT NULL DEFAULT '{}',
  simple_effects jsonb NOT NULL DEFAULT '{}',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT damage_level_range CHECK (damage_level >= 0 AND damage_level <= max_damage_level),
  UNIQUE(character_id, slug)
);

ALTER TABLE public.epic_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view epic items"
  ON public.epic_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Owner can insert epic items"
  ON public.epic_items FOR INSERT
  WITH CHECK (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

CREATE POLICY "Owner can update epic items"
  ON public.epic_items FOR UPDATE
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

CREATE POLICY "Owner can delete epic items"
  ON public.epic_items FOR DELETE
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));
