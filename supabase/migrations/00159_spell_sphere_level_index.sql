-- Composite partial index for priest spell queries (priest-spells.ts).
-- Covers .eq("spell_type", "priest").in("sphere", ...).lte("level", ...) filter chain.

CREATE INDEX IF NOT EXISTS idx_spells_priest_sphere_level
  ON public.spells (sphere, level)
  WHERE spell_type = 'priest';
