-- Monster narrative sections + sub-variant self-reference + no_appearing
--
-- Background:
--   The AD&D 2nd Edition Monstrous Manual structures each entry as a stat block
--   followed by three clearly delimited narrative sections: Combat,
--   Habitat/Society, and Ecology. Before this migration, those three sections
--   plus the introductory paragraph were collapsed into a single `description`
--   column, which made it impossible to surface them separately in the UI or
--   inject them cleanly into the Rulebook Chat context.
--
--   This migration is purely additive (with one exception: the never-populated
--   `description_en` column is dropped). Existing rows are preserved — the
--   legacy `description` text is copied into `intro_text` so the detail modal
--   does not render blank sections until the backfill in 00211 runs.
--
-- Companion research: docs/agents/research/2026-04-10-monster-data-completeness.md
-- Companion plan:     docs/agents/plans/2026-04-10-monster-data-completeness.md

BEGIN;

-- 1. Narrative section columns
ALTER TABLE monsters
  ADD COLUMN intro_text      TEXT,
  ADD COLUMN combat_tactics  TEXT,
  ADD COLUMN habitat_society TEXT,
  ADD COLUMN ecology         TEXT;

-- 2. "No. Appearing" field from the MM stat block
ALTER TABLE monsters
  ADD COLUMN no_appearing TEXT;

-- 3. Sub-variant self-reference
--    NULL variant_of_id   = parent row (default for all 176 existing seed monsters)
--    Non-NULL             = child variant pointing at its parent
--    ON DELETE CASCADE    = deleting a parent removes all its variants
ALTER TABLE monsters
  ADD COLUMN variant_of_id UUID REFERENCES monsters(id) ON DELETE CASCADE,
  ADD COLUMN variant_name  TEXT;

CREATE INDEX idx_monsters_variant_of_id ON monsters (variant_of_id);

-- 4. Safety-net copy: existing description → intro_text
--    Idempotent via WHERE intro_text IS NULL.
UPDATE monsters
   SET intro_text = description
 WHERE intro_text IS NULL;

-- 5. Remove the unused English description column.
--    `description_en` was added in migration 00179 but never populated by
--    any code path (no INSERT writes it, no scan prompt requests it). It has
--    been replaced by the compendium-snapshot JSON for bilingual reference
--    (see ressources/compendium-snapshot/).
ALTER TABLE monsters DROP COLUMN description_en;

COMMIT;
