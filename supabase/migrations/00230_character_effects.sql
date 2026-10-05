-- Temporäre Effekte an Charakteren (Zauber, Monsterangriffe, Verletzungen,
-- Gift, Krankheit, Umwelt). Der Spieler pflegt sie selbst; die App verrechnet
-- die Auswirkungen in alle abgeleiteten Werte (src/lib/rules/temporary-effects.ts).
--
-- Beenden ist ein Soft-Delete (ended_at), kein DELETE: Realtime kann DELETEs
-- nicht nach character_id filtern — GM-Dashboard und weitere Tabs würden das
-- Ende eines Effekts sonst nicht mitbekommen. Nebenbei bleibt die Historie
-- für ein späteres Rückgängig/Wiederherstellen erhalten.

CREATE TABLE public.character_effects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 1000),
  duration_text text NOT NULL DEFAULT '' CHECK (char_length(duration_text) <= 80),
  preset_key text,
  -- [{ target, op: "delta"|"set"|"factor", value, condition? }] — Werte in Spielersicht (+ = Vorteil)
  modifiers jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(modifiers) = 'array'),
  -- ["stunned", "prone", ...]
  flags jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(flags) = 'array'),
  temp_hp_remaining integer NOT NULL DEFAULT 0 CHECK (temp_hp_remaining >= 0),
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE INDEX character_effects_active_idx
  ON public.character_effects (character_id, created_at)
  WHERE ended_at IS NULL;

ALTER TABLE public.character_effects ENABLE ROW LEVEL SECURITY;

-- Sichtbar, wer den Charakter sehen darf (eigene, geteilte, öffentliche):
-- die Unterabfrage läuft selbst unter der RLS von characters.
CREATE POLICY "Character viewers can read effects"
  ON public.character_effects FOR SELECT
  USING (character_id IN (SELECT id FROM public.characters));

CREATE POLICY "Owner can insert effects"
  ON public.character_effects FOR INSERT
  WITH CHECK (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

CREATE POLICY "Owner can update effects"
  ON public.character_effects FOR UPDATE
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()))
  WITH CHECK (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

CREATE POLICY "Owner can delete effects"
  ON public.character_effects FOR DELETE
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- Freigabe-Pflicht wie bei allen anderen schreibbaren Tabellen (siehe 00217).
CREATE TRIGGER enforce_approval_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.character_effects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_approval();

ALTER PUBLICATION supabase_realtime ADD TABLE public.character_effects;
