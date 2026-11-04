-- Die Galerie des Chaos: Szenenbilder, die der GM im Master-Bereich hochlädt
-- und die alle Spieler unter /gallery sehen.
--
-- Schreiben darf nur der GM. Die GM-Rolle existiert aber nicht in der DB (PIN-
-- Cookie, siehe src/app/master/actions.ts) — deshalb gibt es KEINE Schreib-
-- Policies: alle Writes laufen über Server Actions mit dem Service-Client.
-- Uploads gehen über signierte Upload-URLs, die nur diese Actions ausstellen.

CREATE TABLE IF NOT EXISTS public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  image_path text NOT NULL,
  thumb_path text NOT NULL,
  width integer,
  height integer,
  sort_order integer NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gallery_images_title_length CHECK (title IS NULL OR char_length(title) <= 120),
  CONSTRAINT gallery_images_description_length
    CHECK (description IS NULL OR char_length(description) <= 2000),
  -- Eindeutig, damit ▲/▼ nie an Gleichständen hängen bleibt. DEFERRABLE, damit
  -- swap_gallery_order zwei Werte innerhalb einer Transaktion tauschen kann.
  CONSTRAINT gallery_images_sort_order_unique UNIQUE (sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE TRIGGER set_gallery_images_updated_at
  BEFORE UPDATE ON public.gallery_images
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Lesen für alle Angemeldeten, Schreiben nur über den Service-Client.

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gallery_images_select"
  ON public.gallery_images FOR SELECT
  TO authenticated
  USING (true);

-- ── Reihenfolge tauschen ─────────────────────────────────────────────────────
-- Atomar, damit ▲/▼ nie zwei Bilder mit derselben Position hinterlässt.

CREATE OR REPLACE FUNCTION public.swap_gallery_order(a uuid, b uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_a integer;
  order_b integer;
BEGIN
  SELECT sort_order INTO order_a FROM public.gallery_images WHERE id = a;
  SELECT sort_order INTO order_b FROM public.gallery_images WHERE id = b;
  IF order_a IS NULL OR order_b IS NULL THEN
    RAISE EXCEPTION 'gallery image not found';
  END IF;

  UPDATE public.gallery_images SET sort_order = order_b WHERE id = a;
  UPDATE public.gallery_images SET sort_order = order_a WHERE id = b;
END;
$$;

REVOKE ALL ON FUNCTION public.swap_gallery_order(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.swap_gallery_order(uuid, uuid) TO service_role;

-- ── Storage ──────────────────────────────────────────────────────────────────
-- Öffentlich lesbar über /object/public/ (wie alle Bild-Buckets der App).
-- Bewusst KEINE Policy auf storage.objects: Öffentliche Buckets brauchen für
-- den Abruf keine SELECT-Policy, und eine Policy ohne Rolle würde anonymes
-- Auflisten erlauben. Uploads autorisiert das signierte Token.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery-images', 'gallery-images', true, 5242880, ARRAY['image/webp'])
ON CONFLICT (id) DO NOTHING;
