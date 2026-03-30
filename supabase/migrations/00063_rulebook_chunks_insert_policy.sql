-- Allow authenticated users to insert/update rulebook chunks (for embedding pipeline)
CREATE POLICY "Authenticated users can insert rulebook chunks"
  ON public.rulebook_chunks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rulebook chunks"
  ON public.rulebook_chunks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
