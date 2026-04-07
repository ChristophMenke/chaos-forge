-- Add image_url column to monsters table
ALTER TABLE monsters ADD COLUMN image_url TEXT;

-- Create storage bucket for monster images
INSERT INTO storage.buckets (id, name, public)
VALUES ('monster-images', 'monster-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, authenticated write
CREATE POLICY "Public read monster images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'monster-images');

CREATE POLICY "Authenticated upload monster images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'monster-images');

CREATE POLICY "Authenticated update monster images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'monster-images');

CREATE POLICY "Authenticated delete monster images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'monster-images');
