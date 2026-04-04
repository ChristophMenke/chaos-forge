---
date: "2026-04-04T09:16:11.260088+00:00"
git_commit: a883cff87c938f23ba5475085324398abdd1ad11
branch: feat/xp-tests-party-nav-log-delete
topic: "Epic Item System & Klinge des Wassers Implementation"
tags: [research, epic-items, weapons, character-equipment]
status: complete
---

# Research: Epic Item System & Klinge des Wassers Implementation

## Research Question

How does the epic items system work end-to-end, and what's needed to add "Klinge des Wassers" (Blade of Water) — a longsword epic item for character "Larry (new)" with 4 level-based tiers including weapon bonuses, cold damage, and spell-like abilities?

## Summary

The epic items system is mature with DB schema, auto-unlock by character level, cumulative effects, and full UI integration across character sheet, play mode, print sheet, and DOCX export. Existing items (Gor's Totem Warrior, Sprocket's Condenser) demonstrate the pattern for level-tiered items with `level_thresholds`, `shapeshift_forms`, and `special_attacks`. However, the system currently has **no mechanism for weapon combat bonuses (+hit/+damage)** or **spell-like abilities with uses-per-day/week** — these are new concepts that need to be added to both the data model and UI.

## Detailed Findings

### 1. Epic Items Database Schema

**File:** `supabase/migrations/00049_epic_items.sql`

```sql
CREATE TABLE public.epic_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  name_en text,
  description text NOT NULL DEFAULT '',
  description_en text,
  icon text NOT NULL DEFAULT 'sparkles',
  equipped boolean NOT NULL DEFAULT false,
  damage_level integer NOT NULL DEFAULT 0,     -- current level (auto-computed or manual)
  max_damage_level integer NOT NULL DEFAULT 0, -- number of tiers - 1
  damage_levels jsonb NOT NULL DEFAULT '{}',   -- per-level effects
  simple_effects jsonb NOT NULL DEFAULT '{}',  -- static effects + metadata
  notes text NOT NULL DEFAULT '',
  CONSTRAINT damage_level_range CHECK (damage_level >= 0 AND damage_level <= max_damage_level),
  UNIQUE(character_id, slug)
);
```

**RLS:** Owner CRUD + authenticated/shared SELECT (migration 00114)
**Latest migration number:** 00164

### 2. Auto-Unlock System (Level Thresholds)

**File:** `src/lib/rules/epic-items.ts:84-93`

```typescript
export function getAutoUnlockedLevel(item: EpicItemRow, characterLevel: number): number {
  const thresholds = se?.level_thresholds as number[] | undefined;
  if (!thresholds) return item.damage_level;
  let unlocked = 0;
  for (const t of thresholds) {
    if (characterLevel >= t) unlocked++;
  }
  return Math.min(unlocked, item.max_damage_level);
}
```

**Pattern:** `simple_effects.level_thresholds = [3, 5, 7, 9]` means:

- Level 0 effects: character level < 3
- Level 1 effects: character level >= 3 (index 0 in thresholds)
- Level 2 effects: character level >= 5
- Level 3 effects: character level >= 7
- Level 4 effects: character level >= 9

**Cumulative effects:** When `level_thresholds` exists, `getCumulativeEffects()` (line 113-145) aggregates all effects from level 0 up to current unlocked level, deduplicating effect strings.

### 3. Existing Damage Level Effects & Data Patterns

**Gor's Totem Warrior** (`supabase/migrations/00057_gor_epic_items_v2.sql`):

```json
{
  "damage_levels": {
    "0": { "description": "...", "effects": ["perception_bonus_2"] },
    "1": { "description": "...", "effects": ["perception_bonus_2"] },
    "2": { "description": "...", "effects": ["perception_bonus_2"] },
    "3": { "description": "...", "effects": ["perception_bonus_2"] }
  },
  "simple_effects": {
    "level_thresholds": [3, 5, 7, 9],
    "shapeshift_forms": [
      { "key": "wolf", "unlock_level": 1, "usesPerDay": 1, ... },
      { "key": "bear", "unlock_level": 2, "usesPerDay": 1, ... },
      { "key": "wolf_unlimited", "unlock_level": 3, "usesPerDay": -1, ... }
    ]
  }
}
```

**Gor's Tattoo** — uses `special_attacks` in `simple_effects`:

```json
{
  "simple_effects": {
    "level_thresholds": [3, 5, 7, 9],
    "special_attacks": [
      {
        "key": "wolf_strike",
        "unlock_level": 0,
        "usesPerDay": 1,
        "effect": "...",
        "effect_en": "..."
      },
      {
        "key": "bear_strike",
        "unlock_level": 3,
        "usesPerDay": 1,
        "effect": "...",
        "effect_en": "..."
      }
    ]
  }
}
```

### 4. Effect Processing in `getEpicEffects()` (line 151-247)

Currently recognized effect string patterns:

- `"spell_failure_10"` → `spellFailure = 10`
- `"wild_magic_50"` → `wildMagic = 50`
- `"thief_penalty_10"` → `thiefPenalty += 10`
- `"thief_disabled"` → `thiefDisabled = true`
- `"ac_bonus_N"` → `acBonus += N`
- `"perception_bonus_N"` → `perceptionBonus += N`
- `"str_override_N"` → `temporaryStrOverride = N`
- `"speak_with_animals"` → `passiveAbilities.push(...)`
- `"electric_damage_1"`, `"save_vs_death"`, `"device_offline"` → tracked in `miscEffects`

**NOT currently handled:**

- Weapon hit/damage bonuses (e.g., +1/+2/+3)
- Extra damage dice (e.g., +1d6 cold)
- Spell-like abilities with uses per day/week

### 5. UI Components

**Epic Equipment Page** (`src/app/characters/[id]/epic/page.tsx`):

- Server component fetches epic items, passes `character.level` (highest class level for multiclass)
- Renders `EpicEquipmentView` which dispatches to `DamageLevelCard`, `SimpleEpicCard`, or `BladeSystemCard`

**DamageLevelCard** (`src/components/epic-equipment/damage-level-card.tsx`):

- Shows current level with dots indicator
- Expandable all-levels table
- Current effect description + stat override badges + effect badges
- Equip/unequip toggle
- Manual +/- buttons when no auto-unlock; auto-display when level_thresholds present
- Overclock panel, repair info, fragility

**Play Mode Combat Panel** (`src/components/play-mode/play-combat-panel.tsx:611-763`):

- Renders `shapeshiftForms` as toggle buttons with AC/Mov/THAC0/attacks display
- Renders `specialAttacks` as use/available toggle cards with bilingual descriptions

**EpicIcon** (`src/components/epic-equipment/epic-icon.tsx`):

- Maps icon names to lucide-react components: `glasses`, `heart-pulse`, `sparkles`, `swords`, `paw-print`, `flame`
- Falls back to `Sparkles`

### 6. Weapon Equipment System

**Character Equipment** (`src/lib/supabase/types.ts:106-117`):

```typescript
export interface CharacterEquipmentRow {
  id: string;
  character_id: string;
  weapon_id: string | null; // FK to weapons table
  armor_id: string | null; // FK to armor table
  quantity: number;
  equipped: boolean;
  hit_bonus: number; // magic +hit
  damage_bonus: number; // magic +damage
  magic_effects: MagicEffects; // stat bonuses from magic items
  custom_label: string | null; // override display name
}
```

**Weapon Proficiency + Specialization** (`src/components/character-sheet/tab-equipment.tsx:505-551`):

- `getWeaponSpecialized()` checks `weaponProficiencies` for matching weapon + `specialization: true`
- Specialization gives: +1 hit, +2 damage, increased APR
- `resolveWeaponCombatData()` combines all modifiers for display

**Play Mode Weapon Display** (`src/components/play-mode/play-combat-panel.tsx:200-400`):

- Shows THAC0 (melee/ranged), damage with STR/spec bonuses, speed, APR
- Full THAC0 breakdown on expand
- Magic bonus (`eq.hit_bonus`, `eq.damage_bonus`) displayed separately

**Key insight:** The epic item weapon bonus (+1/+2/+3) should map to the `hit_bonus` and `damage_bonus` fields on `character_equipment`, since that's how magic weapon bonuses already work. But the epic item is NOT in the `character_equipment` table — it's in `epic_items`. So the weapon bonuses need to either:

1. Be stored as a regular `character_equipment` entry with `hit_bonus`/`damage_bonus` that gets updated when the epic level changes, OR
2. Be added as new fields in the `EpicEffects` interface and applied in combat calculations

### 7. Longsword in Database

**Seed data** (`supabase/migrations/00003_seed_data.sql:96`):

- German: "Langschwert", English: "Long Sword"
- damage_sm: "1d8", damage_l: "1d12", melee, speed 5, weight 4.0 lbs, cost 15 gp

**Proficiency normalization** (`supabase/migrations/00151_normalize_weapon_proficiency_names.sql:19-22`):

- "Sword, long" → "Langschwert"

### 8. Print Sheet & DOCX Export

**Print Sheet** (`src/components/print-sheet/print-sheet.tsx`):

- Accepts `epicItems?: EpicItemRow[]` prop (line 60)
- Computes `epicEffects = getEpicEffects(epicItems)` (line 87)
- Uses only `epicEffects.acBonus` currently (line 132, 660-664)
- Epic items NOT displayed as individual items in print sheet

**DOCX Export** (`src/lib/utils/docx-export.ts`):

- Same pattern: accepts `epicItems`, computes `epicEffects`, uses `acBonus` only (lines 299, 308, 841-845)
- Has localized labels: `epicAcBonus: "Episch" / "Epic"` (lines 177, 224)
- Epic items NOT listed individually in DOCX

### 9. Character "Larry (new)"

**Not in seed data** — Larry exists only as a real character in the production database, created by user "Cathi". From Playwright test artifacts:

- Level 9 Fighter
- Human
- Chaotic Good
- Has an avatar (recently copied from Larry)

**No existing epic items** for Larry found in migrations or seed data.

### 10. What Needs to Be Added for "Klinge des Wassers"

The Blade of Water requires new concepts not yet in the epic items system:

**A. Weapon Combat Bonuses (NEW)**

- +1/+2/+3 to hit and damage, varying by tier
- Need to flow into combat calculations (THAC0, damage display)
- Approach: Add `weapon_bonuses` to `simple_effects` with `hit_bonus` and `damage_bonus` per unlock level

**B. Extra Damage Dice (NEW)**

- +1d6 cold damage at tiers 3-4
- Not just a flat bonus — it's additional dice
- Approach: Add to `simple_effects` or per-level effects, display in weapon damage line

**C. Spell-Like Abilities (NEW)**

- Uses per day: Water Walk (1→3×/day), Water Breathing (1→3×/day)
- Uses per week: Cone of Cold (1×/week)
- Need UI for tracking uses (like special_attacks but for spells)
- Approach: Extend `special_attacks` pattern or add new `spell_abilities` array in `simple_effects`

**D. The Longsword as Equipment**

- Larry needs a "Langschwert" in `character_equipment` with the appropriate hit/damage bonuses
- Weapon proficiency "Langschwert" with `specialization: true` needed
- The hit/damage bonuses should be dynamic based on epic item level

**E. Display in Equipment Tab / Play Mode**

- Weapon bonuses from epic item should modify the longsword's combat stats
- Extra cold damage should show in damage line
- Spell-like abilities should appear in play mode (similar to special attacks)

**F. Display in Print Sheet / DOCX**

- Weapon with epic bonuses should show correctly
- Epic item abilities could optionally appear in notes/equipment section

## Code References

- `supabase/migrations/00049_epic_items.sql` — Schema definition
- `supabase/migrations/00057_gor_epic_items_v2.sql` — Best example of level-tiered epic item with auto-unlock
- `src/lib/supabase/types.ts:232-258` — EpicItemRow, DamageLevelEffect types
- `src/lib/rules/epic-items.ts:84-93` — Auto-unlock logic
- `src/lib/rules/epic-items.ts:113-145` — Cumulative effects aggregation
- `src/lib/rules/epic-items.ts:151-247` — Main getEpicEffects() function
- `src/components/epic-equipment/epic-equipment-view.tsx` — Main view, dispatches to card types
- `src/components/epic-equipment/damage-level-card.tsx` — Level-tiered item card
- `src/components/epic-equipment/epic-icon.tsx` — Icon mapper (needs `swords` icon)
- `src/app/characters/[id]/epic/page.tsx` — Server component, fetches items + character level
- `src/components/play-mode/play-combat-panel.tsx:611-763` — Shapeshift forms + special attacks UI
- `src/components/character-sheet/tab-equipment.tsx:528-551` — Weapon THAC0/damage calculations
- `src/components/print-sheet/print-sheet.tsx:60,87,132,660` — Epic effects in print
- `src/lib/utils/docx-export.ts:65,299,841` — Epic effects in DOCX

## Architecture Documentation

### Epic Items Data Flow

```
DB (epic_items table)
  → Server Component (fetches items + character level)
    → EpicEquipmentView (client, manages state)
      → DamageLevelCard (auto-unlock, effects display, equip toggle)
    → getEpicEffects() (aggregates all equipped items)
      → Character Sheet (AC bonus, spell failure, wild magic)
      → Play Mode (shapeshift, special attacks, thief penalties, perception)
      → Print Sheet (AC bonus only)
      → DOCX Export (AC bonus only)
```

### Effect System Architecture

```
damage_levels (JSONB):
  Per-level: { description, description_en, stat_overrides, effects[] }
  Effects are cumulative when level_thresholds exists

simple_effects (JSONB):
  level_thresholds: number[] → auto-unlock levels
  shapeshift_forms: [...] → with unlock_level per form
  special_attacks: [...] → with unlock_level per attack
  perception_bonus: number → flat bonus
  overclock: {...} → boost ability
  fragility: {...} → breakage chance
  repair_skill: string → repair info
```

## Open Questions

1. **Should the Klinge des Wassers be BOTH an epic item AND a character_equipment entry?** The weapon needs to appear in the regular weapon list with THAC0/damage calculations, but also have epic item management for level progression and spell-like abilities.

2. **How should dynamic weapon bonuses work?** When the epic level increases from +2 to +3, should the character_equipment `hit_bonus`/`damage_bonus` be automatically updated, or should the epic system overlay bonuses on top of the base weapon?

3. **Spell-like abilities pattern:** Should these reuse the `special_attacks` pattern (which already has uses-per-day tracking in the UI) or be a separate `spell_abilities` concept? The weekly Cone of Cold needs `usesPerWeek` which doesn't exist yet.

4. **Extra damage dice display:** Where should "+1d6 Kälteschaden" appear in the weapon card — as part of the damage line, or as a separate badge/label?
