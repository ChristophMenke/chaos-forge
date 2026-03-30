-- Add avatar support to NPCs
ALTER TABLE chronicle_npcs ADD COLUMN avatar_url text;

-- Storage bucket for NPC avatars (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('npc-avatars', 'npc-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public read npc avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'npc-avatars');

-- Authenticated users can upload
CREATE POLICY "Auth upload npc avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'npc-avatars');

-- Authenticated users can update
CREATE POLICY "Auth update npc avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'npc-avatars');

-- Authenticated users can delete
CREATE POLICY "Auth delete npc avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'npc-avatars');
