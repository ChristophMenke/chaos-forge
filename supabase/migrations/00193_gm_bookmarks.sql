-- GM Bookmarks for session preparation
-- Allows the GM to bookmark items, NPCs, and monsters for quick access

CREATE TABLE gm_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'weapon', 'armor', 'general_item', 'magic_item', 'npc', 'monster'
  )),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id)
);

ALTER TABLE gm_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gm_bookmarks_own" ON gm_bookmarks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_gm_bookmarks_user ON gm_bookmarks(user_id);
CREATE INDEX idx_gm_bookmarks_entity ON gm_bookmarks(entity_type, entity_id);
