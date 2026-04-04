---
date: "2026-04-04T10:58:58.315807+00:00"
git_commit: 288da8031fe5b0ce6f326c16409daa826c8228d3
branch: feat/epic-klinge-des-wassers
topic: "Shield Proficiency & AC Calculation Rules"
tags: [research, ac-calculation, shield, proficiency, equipment]
status: complete
---

# Research: Shield Proficiency & AC Calculation Rules

## Research Question

How is AC currently calculated, how are shields handled, and is Shield Proficiency (Player's Option: Skills & Powers) implemented? The user reports that Shield Proficiency AC bonus is not correctly calculated.

## Summary

The AC calculation system (`calculateAC()` in `equipment.ts`) treats shields as a simple boolean — any shield gives a flat -1 AC bonus regardless of shield type. There is **no Shield Proficiency concept** anywhere in the codebase. The P.O: S&P rules specify shield-type-specific AC bonuses (+1 to +3) for proficient characters, but this is not implemented. Additionally, the `is_shield` column in the `armor` table only marks "Schild" (Small Shield) — "Großer Schild" (Large Shield) and "Buckler" are not flagged, though `isShieldItem()` catches them by name matching.

## Detailed Findings

### 1. AC Calculation (`calculateAC()`)

**File:** `src/lib/rules/equipment.ts:35-77`

The function accepts `ACCalculationInput` with these AC-relevant fields:

- `equippedArmorAC` — armor's AC value (null = no armor)
- `shieldEquipped` — boolean, gives flat -1
- `dexDefenseAdj` — DEX/Balance defensive adjustment
- `magicACModifier` — magic item bonus (Bracers, Ring)
- `classGroups` — for unarmored bonus check (warrior/rogue)
- `encumbrance` — for unarmored bonus eligibility
- `isMagicalProtection` — Bracers/Ring still count as unarmored
- `epicAcBonus` — from epic items
- `singleWeaponStyleBonus` — Single-Weapon Style (0-2)

**Shield handling (line 53):**

```typescript
const shieldBonus = shieldEquipped ? -1 : 0;
```

This is a flat -1 for ANY shield. There is no differentiation by shield type or proficiency.

### 2. Shield Types in Database

**Seed data:**

| Name          | Name EN      | AC  | Weight | is_shield |
| ------------- | ------------ | --- | ------ | --------- |
| Schild        | Shield       | 9   | 5.0    | true      |
| Großer Schild | Large Shield | 8   | 10.0   | **false** |
| Buckler       | Buckler      | 9   | 3.0    | **false** |

**Issues:**

- Only "Schild" has `is_shield = true` (migration `00074_armor_is_shield.sql:5-7`)
- "Großer Schild" and "Buckler" are NOT flagged as shields in the DB
- However, `isShieldItem()` catches all three by name matching ("shield" substring)

### 3. Shield Detection: `isShieldItem()`

**File:** `src/lib/rules/equipment.ts:83-86`

```typescript
export function isShieldItem(name: string): boolean {
  const lower = name.toLowerCase();
  return lower === "schild" || lower === "shield" || lower.includes("shield");
}
```

This catches: "Schild", "Shield", "Großer Schild", "Large Shield", "Buckler" (no — Buckler doesn't contain "shield"). Wait — "Buckler" does NOT contain "shield", so `isShieldItem("Buckler")` returns `false`! This means Buckler is not treated as a shield by the AC calculation.

**Actually:** Let me verify — `"buckler".includes("shield")` → false. And `"buckler" === "schild"` → false. So **Buckler is NOT detected as a shield**.

### 4. Shield Proficiency — Not Implemented

- No references to `shield_proficiency`, `shieldProf`, or `Shield Proficiency` anywhere in the codebase
- Weapon proficiencies (`character_weapon_proficiencies` table) store weapon names, not shield types
- No shield-specific proficiency slot cost logic exists
- The `fighting_styles` table has "weapon_and_shield" style, but it provides shield-bash attacks, not AC bonuses

### 5. P.O: Skills & Powers Shield Proficiency Rules (from user's screenshot)

**Table 51: Shield Proficiency Effects:**
| Shield Type | AC Bonus | Attackers |
|------------|----------|-----------|
| Buckler | +1 | 1 |
| Small Shield | +2 | 2 |
| Medium Shield | +3 | 3 |
| Body Shield | +3/+4 vs missiles | 4 |

- Bonus is **in addition** to normal shield AC
- Warriors: 1 slot, all others: 2 Weapon Proficiency Slots
- Must be acquired for a **specific** shield type
- Only protects against frontal/shield-side attacks

### 6. Current AC Bonus Sources

All AC modifiers currently in the system:

1. **Base AC 10** (always)
2. **Armor AC** — replaces base (e.g., Chain Mail AC 5)
3. **Shield** — flat -1 (any shield, boolean)
4. **DEX Defense Adj** — from DEX/Balance sub-stat
5. **Magic AC Modifier** — Bracers, Ring of Protection (additive)
6. **Unarmored Bonus** — -2 for warrior/rogue, unencumbered, no armor/magical protection
7. **Single-Weapon Style** — -1 or -2 (only without shield)
8. **Epic AC Bonus** — from epic items (e.g., Totem Tattoo +2)

**Missing:** Shield Proficiency bonus (+1 to +3 depending on shield type)

### 7. AC Breakdown Display

**Play Mode** (`play-combat-panel.tsx:97-150`):
Shows each modifier as a labeled row. Shield shows as `t("shield")` with value `-1`.

**Print Sheet** (`print-sheet.tsx:636-666`):
Same breakdown, shows "Schild: -1".

**DOCX Export** (`docx-export.ts:808-848`):
Same pattern, "Schild: -1".

### 8. Fighting Styles Related to Shields

**Weapon & Shield Style** (`fighting-styles.ts:63-86`):

- 1 slot: Extra attack per round (shield-punch/parry only)
- 2 slots: Reduced penalties (0 weapon / -2 shield)
- Available to: warrior, priest
- Does NOT provide an AC bonus — purely offensive

**Single-Weapon Style** (`fighting-styles.ts:22-45`):

- Mutually exclusive with shield (bonus disabled when `shieldEquipped`)
- 1 slot: +1 AC, 2 slots: +2 AC

## Code References

- `src/lib/rules/equipment.ts:5-26` — ACCalculationInput interface
- `src/lib/rules/equipment.ts:35-77` — calculateAC() function
- `src/lib/rules/equipment.ts:83-86` — isShieldItem() detection
- `src/lib/rules/fighting-styles.ts:63-86` — Weapon & Shield fighting style
- `src/lib/rules/fighting-styles.ts:154-160` — getSingleWeaponStyleBonus()
- `src/components/play-mode/play-combat-panel.tsx:97-150` — AC breakdown rendering
- `src/components/print-sheet/print-sheet.tsx:636-666` — Print AC breakdown
- `src/lib/utils/docx-export.ts:808-848` — DOCX AC breakdown
- `supabase/migrations/00003_seed_data.sql:79` — Shield seed data
- `supabase/migrations/00012_extended_seed_data.sql:46-47` — Large Shield, Buckler seed data
- `supabase/migrations/00074_armor_is_shield.sql` — is_shield column (incomplete flagging)

## Architecture Documentation

### AC Data Flow

```
DB (armor table + is_shield column)
  → Server Component (fetches equipment, detects shield via isShieldItem())
    → calculateAC(shieldEquipped: boolean) → flat -1 bonus
    → Play Mode (AC breakdown display)
    → Print Sheet (AC breakdown)
    → DOCX Export (AC breakdown)
```

### Current Shield Detection

```
isShieldItem(name) → checks lowercase for "schild", "shield", or contains "shield"
  ✓ "Schild" / "Shield"
  ✓ "Großer Schild" / "Large Shield"
  ✗ "Buckler" (doesn't match!)
```

## Open Questions

1. Should Shield Proficiency be stored as a weapon proficiency (reusing `character_weapon_proficiencies`) or as a separate concept?
2. The "Anzahl Angreifer" (number of attackers) mechanic — should this be tracked or is it purely informational for the DM?
3. Should the Buckler detection bug in `isShieldItem()` be fixed as part of this work?
4. The `is_shield` column in armor table is incomplete — should it be updated to include all shield types?
5. Does Larry (new) have a specific shield type and Shield Proficiency?
