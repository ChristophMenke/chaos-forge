-- Spieltermine: gemeinsam gepflegte Liste der nächsten Rollenspielabende.
-- Löst die hart kodierte NEXT_SESSION_ISO-Konstante im Dashboard-Banner ab.
--
-- event_date ist bewusst ein reines Kalenderdatum (kein timestamptz): die Gruppe
-- sitzt in einer Zeitzone, und "Heute!"/"in 3 Tagen" darf nicht davon abhängen,
-- in welcher Region der Server gerade läuft.

CREATE TABLE IF NOT EXISTS public.game_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date date NOT NULL,
  title text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT game_dates_title_length CHECK (title IS NULL OR char_length(title) <= 120)
);

-- Der Dashboard-Banner fragt immer "kleinstes event_date >= heute".
CREATE INDEX IF NOT EXISTS idx_game_dates_event_date ON public.game_dates (event_date);

CREATE TRIGGER set_game_dates_updated_at
  BEFORE UPDATE ON public.game_dates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Termine sind Gruppen-Daten: jeder freigegebene Spieler darf sie pflegen
-- (gleiches Modell wie monsters/magic_items). created_by bleibt als Nachweis.

ALTER TABLE public.game_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read game dates"
  ON public.game_dates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert game dates"
  ON public.game_dates FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update game dates"
  ON public.game_dates FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete game dates"
  ON public.game_dates FOR DELETE
  USING (auth.role() = 'authenticated');

-- Freigabe-Pflicht wie bei allen anderen schreibbaren Tabellen (siehe 00217).
CREATE TRIGGER enforce_approval_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.game_dates
  FOR EACH ROW EXECUTE FUNCTION public.enforce_approval();

-- ── Benachrichtigungen ───────────────────────────────────────────────────────
-- Fan-out serverseitig statt im Client: notifications speichert eine Zeile pro
-- Empfänger, und ein Client müsste dafür erst alle Profile lesen und dann N
-- Inserts absetzen — nicht atomar. SECURITY DEFINER, weil die Funktion die
-- Empfängerliste aus profiles zieht.

CREATE OR REPLACE FUNCTION public.notify_game_date_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected public.game_dates%ROWTYPE;
  notification_type text;
  actor uuid := auth.uid();
BEGIN
  -- Kein eingeloggter Auslöser = System-Kontext (Migration, Seed, Service Role).
  -- Dafür will niemand eine Meldung in der Glocke haben.
  IF actor IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- E2E-Tests legen Termine an und wieder ab. Ohne diesen Filter würde jeder
  -- Testlauf die echte Spielgruppe anpingen (Tests laufen gegen dieselbe DB).
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = actor AND email LIKE '%@qa.chaosforge.test'
  ) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN
    -- Alte Termine wegzuräumen ist Hausputz, keine Absage — nur ein noch
    -- bevorstehender Termin ist eine Meldung wert.
    IF OLD.event_date < CURRENT_DATE THEN
      RETURN OLD;
    END IF;
    affected := OLD;
    notification_type := 'game_date_cancelled';
  ELSIF TG_OP = 'INSERT' THEN
    affected := NEW;
    notification_type := 'game_date_created';
  ELSE
    affected := NEW;
    -- Reines Nachschärfen des Titels ist keine Meldung wert; nur ein
    -- verschobenes Datum betrifft die Terminplanung der Gruppe.
    IF NEW.event_date = OLD.event_date THEN
      RETURN NEW;
    END IF;
    notification_type := 'game_date_changed';
  END IF;

  INSERT INTO public.notifications (user_id, type, details)
  SELECT
    p.id,
    notification_type,
    jsonb_build_object(
      'game_date_id', affected.id,
      'event_date', to_char(affected.event_date, 'YYYY-MM-DD'),
      'title', affected.title,
      'previous_event_date',
        CASE WHEN TG_OP = 'UPDATE' THEN to_char(OLD.event_date, 'YYYY-MM-DD') END
    )
  FROM public.profiles p
  WHERE p.is_approved = true
    AND p.id <> actor;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER notify_game_date_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.game_dates
  FOR EACH ROW EXECUTE FUNCTION public.notify_game_date_change();

-- Kein Seed: der bisher hart kodierte Termin (20.06.2026) liegt inzwischen in
-- der Vergangenheit und wuerde nur einen Alteintrag anlegen. Die Gruppe startet
-- mit einer leeren Liste und traegt den naechsten Abend selbst ein.
