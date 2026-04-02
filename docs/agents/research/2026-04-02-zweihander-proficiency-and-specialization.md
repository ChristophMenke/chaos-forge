---
date: "2026-04-02T20:10:07.312527+00:00"
git_commit: bebe32ad224f79fe4f427de90f6f661e81e22d9a
branch: fix/katrina-zweihander-specialization
topic: "Two-Handed Sword Proficiency Bug & Skills & Powers Specialization"
tags: [research, proficiency, specialization, combat, skills-and-powers]
status: complete
---

# Research: Two-Handed Sword Proficiency Bug & Skills & Powers Specialization

## Research Question

Lady Katrina has a Two-Handed Sword (Zweihänder) equipped and a weapon proficiency for it, but still receives a non-proficiency penalty in the combat panel. Additionally, the player used Character Points from Player's Option: Skills & Powers to give her weapon specialization on the Two-Handed Sword, which the system doesn't currently support for non-Fighter classes.

## Summary

Two issues were investigated:

1. **Proficiency matching bug**: The combat panel matches weapon proficiency names against `weapon.name` (the German DB column, e.g. `"Zweihänder"`), but proficiencies are stored using the **localized** name selected at creation time. If the proficiency was added while the UI was in English locale, it would be stored as `"Two-Handed Sword"`, which would never match `"Zweihänder"` — resulting in a false non-proficiency penalty. The same bug affects the equipment tab.

2. **Specialization restriction**: The `canSpecialize()` function only returns `true` for `classId === "fighter"`. The specialization checkbox is hidden for all other classes. There is no concept of Character Points or Skills & Powers in the codebase. Lady Katrina (presumably not a single-class Fighter) cannot currently be given weapon specialization through the UI.

## Detailed Findings

### 1. Weapon Name Storage and Matching

#### How weapon names are stored in the DB

The `weapons` table has two name columns:

- `name` — German name (e.g. `"Zweihänder"`) — primary column
- `name_en` — English name (e.g. `"Two-Handed Sword"`) — added in migration 00023

The `character_weapon_proficiencies` table stores a **plain text** `weapon_name` with no foreign key to the weapons table:

```sql
-- supabase/migrations/00010_proficiencies.sql:18-24
create table public.character_weapon_proficiencies (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references public.characters(id) on delete cascade not null,
  weapon_name text not null,
  specialization boolean not null default false,
  unique(character_id, weapon_name)
);
```

#### How proficiencies are added

When a user selects a weapon from the dropdown in the proficiency tab, the **localized** name is stored:

```typescript
// src/components/character-sheet/tab-proficiencies.tsx:574
setNewWeaponName(localized(weapon.name, weapon.name_en, locale));
```

This means:

- German locale → stores `"Zweihänder"`
- English locale → stores `"Two-Handed Sword"`

#### How proficiency matching works in the Combat Panel

The play-combat-panel builds a lookup map keyed by `weapon_name.toLowerCase()`:

```typescript
// src/components/play-mode/play-combat-panel.tsx:90-99
const profMap = useMemo(() => {
  const map = new Map<string, { proficient: boolean; specialized: boolean }>();
  for (const wp of weaponProficiencies) {
    map.set(wp.weapon_name.toLowerCase(), {
      proficient: true,
      specialized: wp.specialization,
    });
  }
  return map;
}, [weaponProficiencies]);
```

Then matches against `weapon.name` (always the German column):

```typescript
// src/components/play-mode/play-combat-panel.tsx:170
const prof = profMap.get(weapon.name.toLowerCase());
```

**Bug**: If `weapon_name` = `"Two-Handed Sword"` (English) and `weapon.name` = `"Zweihänder"` (German), the lookup returns `undefined` → character appears non-proficient.

The same matching pattern exists in tab-equipment.tsx:

```typescript
// src/components/character-sheet/tab-equipment.tsx:486-492
function getWeaponProficiencyPenalty(weaponName: string): number {
  const isProficient = weaponProficiencies.some(
    (wp) => wp.weapon_name.toLowerCase() === weaponName.toLowerCase()
  );
  if (isProficient) return 0;
  return getNonproficiencyPenalty(primaryClassGroup);
}
```

Here `weaponName` is passed as `weapon.name` (German), matched against stored `weapon_name` (potentially English).

### 2. Specialization System

#### Current implementation

`canSpecialize()` in `src/lib/rules/proficiencies.ts:54-56`:

```typescript
export function canSpecialize(classId: ClassId): boolean {
  return classId === "fighter";
}
```

This is used in the proficiency tab to control checkbox visibility:

```typescript
// src/components/character-sheet/tab-proficiencies.tsx:161
const showSpecialization = canSpecialize(classId as ClassId);
```

When `showSpecialization` is `false`, the specialization checkbox is hidden for both existing and new proficiencies.

#### Specialization effects on combat

Specialization affects attacks per round in `src/lib/rules/combat.ts:172-186`:

```typescript
export function getAttacksPerRound(
  classGroup: ClassGroup,
  level: number,
  isSpecialized: boolean = false
): string {
  if (classGroup !== "warrior") return "1";
  if (isSpecialized) {
    if (level >= 13) return "5/2";
    if (level >= 7) return "2";
    return "3/2";
  }
  // ...
}
```

Note: attacks per round bonus from specialization only applies to warriors. Non-warrior specialized characters (via S&P) would still get the +1 hit / +2 damage bonuses but NOT extra attacks.

#### Slot cost

Specialization costs 2 weapon proficiency slots (counted in tab-proficiencies.tsx):

```typescript
// src/components/character-sheet/tab-proficiencies.tsx:147-152
const usedWeaponSlots = weaponProficiencies.reduce(
  (sum, wp) => sum + (wp.specialization ? 2 : 1),
  0
);
```

#### Manual slot adjustments

The system already has a `weapon_slots_adj` field on the character that allows manually adjusting slot counts via +/− buttons. This is how "extra slots" from non-standard sources (like Character Points) can be accounted for.

### 3. Skills & Powers Character Points

There is **no** implementation of the Player's Option: Skills & Powers character point system in the codebase. No fields for character points, no point-based allocation UI, no S&P-specific rules.

The current system's `weapon_slots_adj` manual adjustment is the closest mechanism to account for extra proficiency slots from Character Points.

## Code References

- `src/lib/rules/proficiencies.ts:54-56` — `canSpecialize()` restricts to fighters only
- `src/components/play-mode/play-combat-panel.tsx:90-99` — profMap built from `weapon_name`
- `src/components/play-mode/play-combat-panel.tsx:170` — matching against `weapon.name` (German)
- `src/components/character-sheet/tab-proficiencies.tsx:574` — stores localized name
- `src/components/character-sheet/tab-proficiencies.tsx:161` — `showSpecialization` from `canSpecialize()`
- `src/components/character-sheet/tab-equipment.tsx:486-492` — same matching bug
- `src/lib/rules/combat.ts:172-186` — `getAttacksPerRound` with specialization
- `supabase/migrations/00010_proficiencies.sql:18-24` — proficiency table schema
- `supabase/migrations/00003_seed_data.sql:97` — Zweihänder weapon seed
- `supabase/migrations/00023_name_en_weapons_armor_nwp.sql:20` — English name mapping

## Architecture Documentation

### Proficiency data flow

1. Weapons table: `name` (DE) + `name_en` (EN)
2. Proficiency dropdown: shows `localized(name, name_en, locale)`, stores selected string as `weapon_name`
3. Combat matching: compares stored `weapon_name` against `weapon.name` (always German)
4. Mismatch when proficiency was stored in English locale

### Specialization data flow

1. `canSpecialize(classId)` → only `"fighter"` returns true
2. Controls UI visibility of specialization checkbox
3. `specialization` boolean stored in `character_weapon_proficiencies`
4. Read in combat panel via `profMap` and used for attacks-per-round calculation

## Open Questions

1. What class is Lady Katrina? (Not found in seed data — user-created character)
2. Was the proficiency added in English locale? (Would explain the matching failure)
3. Should the proficiency matching use both `name` and `name_en` for comparison?
4. For Skills & Powers specialization: should `canSpecialize()` be relaxed, or should there be a separate "forced specialization" mechanism?
