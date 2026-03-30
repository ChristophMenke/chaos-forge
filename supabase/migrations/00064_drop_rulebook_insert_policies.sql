-- Remove overly permissive INSERT/UPDATE policies.
-- The embed script uses service_role key which bypasses RLS.
DROP POLICY IF EXISTS "Authenticated users can insert rulebook chunks" ON public.rulebook_chunks;
DROP POLICY IF EXISTS "Authenticated users can update rulebook chunks" ON public.rulebook_chunks;
