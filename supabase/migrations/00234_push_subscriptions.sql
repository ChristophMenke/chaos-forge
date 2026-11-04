-- Push-Benachrichtigungen aufs Handy (Web Push, VAPID).
--
-- Jede Zeile in notifications erzeugt zusätzlich einen Push an alle Geräte des
-- Empfängers, die ihn in den Einstellungen eingeschaltet haben — egal ob die
-- Zeile aus dem Browser, einer Server Action oder einem DB-Trigger kommt.
--
-- Ablauf: AFTER-INSERT-Trigger → pg_net (asynchron, blockiert den Insert nicht)
-- → POST /api/push/dispatch mit { notification_id } und Header x-push-secret.
-- Die Route lädt die Notification selbst und verschickt per web-push.
--
-- URL und Secret liegen in Supabase Vault, nicht im Repo. Einmalig anlegen:
--   select vault.create_secret('https://adnd-chaos-forge.vercel.app/api/push/dispatch', 'push_dispatch_url');
--   select vault.create_secret('<PUSH_WEBHOOK_SECRET aus Vercel>', 'push_dispatch_secret');
-- Fehlt einer der Einträge (z. B. lokal), passiert nichts.

-- ── Abos ─────────────────────────────────────────────────────────────────────
-- Ein Abo gilt pro Browser/Gerät. locale bestimmt die Sprache des Push-Texts.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  locale text NOT NULL DEFAULT 'de' CHECK (locale IN ('de', 'en')),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions (user_id);

-- Writes laufen über /api/push/subscribe mit dem Service-Client (nach getUser()).
-- Die Policies sind nur das Sicherheitsnetz: jeder sieht/löscht nur eigene Abos.
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_select_own"
  ON public.push_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "push_subscriptions_delete_own"
  ON public.push_subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── Webhook ──────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.dispatch_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  dispatch_url text;
  dispatch_secret text;
BEGIN
  -- Ohne Abo kein Request — die meisten Spieler haben Push nicht eingeschaltet.
  IF NOT EXISTS (SELECT 1 FROM public.push_subscriptions WHERE user_id = NEW.user_id) THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO dispatch_url
    FROM vault.decrypted_secrets WHERE name = 'push_dispatch_url';
  SELECT decrypted_secret INTO dispatch_secret
    FROM vault.decrypted_secrets WHERE name = 'push_dispatch_secret';
  IF dispatch_url IS NULL OR dispatch_secret IS NULL THEN
    RETURN NEW;
  END IF;

  -- 10 s, weil die Vercel-Funktion nach einer Pause kalt startet.
  PERFORM net.http_post(
    url := dispatch_url,
    body := jsonb_build_object('notification_id', NEW.id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', dispatch_secret
    ),
    timeout_milliseconds := 10000
  );

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.dispatch_push_notification() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER dispatch_push_notification_trigger
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_push_notification();
