-- Fix RLS policies: restrict INSERT/DELETE to session creator only
DROP POLICY "Authenticated users can add session participants" ON session_participants;
DROP POLICY "Authenticated users can remove session participants" ON session_participants;

CREATE POLICY "Session creator can add session participants"
  ON session_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_id
        AND sessions.created_by = auth.uid()
    )
  );

CREATE POLICY "Session creator can remove session participants"
  ON session_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_id
        AND sessions.created_by = auth.uid()
    )
  );

-- Add CHECK constraint on xp_awarded
ALTER TABLE sessions ADD CONSTRAINT sessions_xp_awarded_positive CHECK (xp_awarded > 0);
