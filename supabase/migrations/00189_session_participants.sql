-- Session participants: track which characters attended a session
CREATE TABLE session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, character_id)
);

CREATE INDEX idx_session_participants_session ON session_participants(session_id);
CREATE INDEX idx_session_participants_character ON session_participants(character_id);

ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants are visible to all authenticated users"
  ON session_participants FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can add session participants"
  ON session_participants FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can remove session participants"
  ON session_participants FOR DELETE
  USING (auth.role() = 'authenticated');

-- Add external participants and XP fields to sessions
ALTER TABLE sessions ADD COLUMN external_participants text[] NOT NULL DEFAULT '{}';
ALTER TABLE sessions ADD COLUMN xp_awarded integer;
