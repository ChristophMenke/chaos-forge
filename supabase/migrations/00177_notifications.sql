-- Notification system for item/gold distribution alerts
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  type text NOT NULL,
  -- type values:
  --   'gm_item_received'     — GM pushed item
  --   'gm_gold_received'     — GM sent gold
  --   'party_item_received'  — Party loot distributed
  --   'party_gold_received'  — Party gold distributed
  --   'trade_item_received'  — Another character sent item
  --   'trade_gold_received'  — Another character sent gold
  details jsonb NOT NULL DEFAULT '{}',
  -- details examples:
  --   { "item_name": "Longsword +1", "quantity": 1, "from_character": "Gor" }
  --   { "pp": 0, "gp": 50, "ep": 0, "sp": 0, "cp": 0, "from_character": "Gor" }
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read)
  WHERE is_read = false;
CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
