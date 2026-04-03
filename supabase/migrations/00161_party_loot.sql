-- Party Loot: Shared gold pool, item pool, and audit log
-- Used by the /party page for loot distribution among characters

-- ── Party Gold Pool (singleton row, seeded below) ────────────────────────────

CREATE TABLE party_loot_gold (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pp integer NOT NULL DEFAULT 0,
  gp integer NOT NULL DEFAULT 0,
  ep integer NOT NULL DEFAULT 0,
  sp integer NOT NULL DEFAULT 0,
  cp integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE party_loot_gold ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view party gold"
  ON party_loot_gold FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert party gold"
  ON party_loot_gold FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update party gold"
  ON party_loot_gold FOR UPDATE TO authenticated USING (true);

-- Seed with one empty row
INSERT INTO party_loot_gold (pp, gp, ep, sp, cp) VALUES (0, 0, 0, 0, 0);

-- ── Party Item Pool ──────────────────────────────────────────────────────────

CREATE TABLE party_loot_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES general_items(id) ON DELETE SET NULL,
  custom_name text,
  quantity integer NOT NULL DEFAULT 1,
  notes text NOT NULL DEFAULT '',
  added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE party_loot_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view party items"
  ON party_loot_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert party items"
  ON party_loot_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = added_by);
CREATE POLICY "Authenticated can update party items"
  ON party_loot_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete party items"
  ON party_loot_items FOR DELETE TO authenticated USING (true);

-- ── Audit Log ────────────────────────────────────────────────────────────────

CREATE TABLE party_loot_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id uuid REFERENCES characters(id) ON DELETE SET NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE party_loot_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view party log"
  ON party_loot_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert party log"
  ON party_loot_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
