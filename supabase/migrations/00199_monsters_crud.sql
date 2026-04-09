-- Add is_custom and created_by columns for GM-created monsters
ALTER TABLE monsters ADD COLUMN IF NOT EXISTS is_custom boolean NOT NULL DEFAULT false;
ALTER TABLE monsters ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Allow authenticated users to insert/update/delete monsters (GM uses service role anyway)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can insert monsters' AND tablename = 'monsters'
  ) THEN
    CREATE POLICY "Authenticated can insert monsters" ON monsters FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can update monsters' AND tablename = 'monsters'
  ) THEN
    CREATE POLICY "Authenticated can update monsters" ON monsters FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can delete monsters' AND tablename = 'monsters'
  ) THEN
    CREATE POLICY "Authenticated can delete monsters" ON monsters FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END
$$;
