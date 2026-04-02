---
date: "2026-04-02T21:43:53.305333+00:00"
git_commit: d501c97fbf96bd5ccf3ab2bb5e69bfec068cc39c
branch: fix/katrina-zweihander-specialization
topic: "Weapon Combat Calculations Audit — THAC0, Damage, APR across all views"
tags: [research, combat, thac0, specialization, proficiency, crusader]
status: complete
---

# Research: Weapon Combat Calculations Audit

## Research Question

Trace the complete calculation path for THAC0, damage, and attacks-per-round for each weapon across all 4 views (play-combat-panel, tab-equipment, print-sheet, docx-export). Verify that specialization bonuses (+1 hit, +2 dmg) are correctly applied per-weapon, and that the Crusader house rules work properly.

## Summary

The audit reveals that **all 4 views correctly implement per-weapon specialization detection**. The `isSpecialized` flag is always derived from the specific weapon being rendered, not globally. However, **one issue was found in docx-export**: the APR column uses a global `attacksDisplay` value that does NOT vary per weapon and does NOT account for specialization.

## Expected Values for Lady Catrina (Level 11 Crusader, STR hitAdj +3, STR dmgAdj +5)

### Two-Handed Sword +3 (specialized: true)

- **THAC0**: 10 (base) - 3 (STR) - 1 (spec) - 3 (magic +3) = **3**
- **Damage S/M**: 1d10 + 5 (STR) + 2 (spec) + 3 (magic) = **1d10+10**
- **Damage L**: 3d6 + 5 (STR) + 2 (spec) + 3 (magic) = **3d6+10**
- **APR**: 3/2 (Crusader L11 warrior APR, NO spec APR bonus)

### Dagger +2 (specialized: false)

- **THAC0**: 10 (base) - 3 (STR) - 0 (no spec) - 2 (magic +2) = **5**
- **Damage S/M**: 1d4 + 5 (STR) + 0 (no spec) + 2 (magic) = **1d4+7**
- **Damage L**: 1d3 + 5 (STR) + 0 (no spec) + 2 (magic) = **1d3+7**
- **APR**: 3/2 (Crusader L11 warrior APR)

## Detailed Findings

### 1. Core Functions (src/lib/rules/combat.ts)

#### getAdjustedWeaponThac0 (line 197-212)

```
melee = baseThac0 - strHitAdj - proficiencyPenalty - weaponHitBonus
```

- Does NOT have a specialization parameter — spec bonus must be added to `strHitAdj` by callers
- All 4 views correctly add `specHitBonus` to `strHitAdj` before calling

#### formatDamageWithBonus (line 218-226)

```
total = strDmgAdj + weaponDmgBonus
result = baseDamage + total (if non-zero)
```

- Does NOT have a specialization parameter — spec bonus must be added to `strDmgAdj` by callers

#### getAttacksPerRound (line 172-186)

```
if (classGroup !== "warrior") return "1"
if (isSpecialized) → 3/2 (L1-6), 2 (L7-12), 5/2 (L13+)
else → 1 (L1-6), 3/2 (L7-12), 2 (L13+)
```

- Returns "1" for non-warrior groups unless overridden by caller

### 2. View-by-View Calculation Trace

#### View 1: play-combat-panel.tsx

**Proficiency detection** (line 163):

```typescript
const matchingProf = findWeaponProf(weaponProficiencies, weapon.name, weapon.name_en);
const isSpecialized = matchingProf?.specialization ?? false;
```

- ✅ Per-weapon: `matchingProf` is found for each `eq.weapon` individually

**Spec hit/dmg bonus** (line 169-170):

```typescript
const specHitBonus = isSpecialized ? 1 : 0;
const specDmgBonus = isSpecialized ? 2 : 0;
```

- ✅ Per-weapon: derived from per-weapon `isSpecialized`

**THAC0** (line 172-179):

```typescript
getAdjustedWeaponThac0(thac0, strMods.hitAdj + specHitBonus, ..., profPenalty, eq.hit_bonus)
```

- ✅ Correct: adds spec bonus to STR hit adj

**Damage** (line 181-190):

```typescript
formatDamageWithBonus(weapon.damage_sm, strMods.dmgAdj + specDmgBonus, eq.damage_bonus);
```

- ✅ Correct: adds spec bonus to STR dmg adj

**APR** (line 192-198):

```typescript
const isWarriorClass = warriorEntry ? getClassGroup(warriorEntry.classId) === "warrior" : false;
const apr = warriorEntry
  ? getAttacksPerRound("warrior", warriorEntry.level, isWarriorClass && isSpecialized)
  : "1";
```

- `warriorEntry` finds crusader (line 155-158: `getClassGroup(...) === "warrior" || ce.classId === "crusader"`)
- ✅ Crusader: `isWarriorClass` is `false` (crusader group is "priest"), so `isSpecialized` is always `false` for APR → base warrior APR (3/2 at L11)
- ✅ Fighter: `isWarriorClass` is `true`, so per-weapon `isSpecialized` flows through → spec APR bonus applies

#### View 2: tab-equipment.tsx

**Helper functions** (line 484-516):

```typescript
function getWeaponSpecialized(weaponName, weaponNameEn): boolean; // per-weapon
function getWeaponAttacksPerRound(weaponName, weaponNameEn): string; // per-weapon
function getWeaponProficiencyPenalty(weaponName, weaponNameEn): number; // per-weapon
function getWeaponThac0(weapon, hitBonus): { melee; ranged }; // per-weapon, includes spec hit bonus
```

- ✅ All helpers are per-weapon

**APR** (line 490-493):

```typescript
const specForApr =
  primaryClassGroup === "warrior" && getWeaponSpecialized(weaponName, weaponNameEn);
return getAttacksPerRound(aprClassGroup, primaryLevel, specForApr);
```

- `aprClassGroup` = "warrior" for crusader (line 482), but `primaryClassGroup` = "priest"
- ✅ Crusader: `specForApr` is `false` (primaryClassGroup is "priest") → base warrior APR
- ✅ Fighter: `specForApr` is per-weapon `isSpecialized` → spec APR bonus per weapon

**Desktop table damage** (line 1425-1431):

```typescript
const isSpec = getWeaponSpecialized(weapon.name, weapon.name_en);
const specDmgBonus = isSpec ? 2 : 0;
// ...
{
  formatDamageWithBonus(weapon.damage_sm, strDmgAdj + dmgBonus + specDmgBonus);
}
```

- ✅ Per-weapon spec damage bonus

**Mobile cards damage** (line 1467-1473):

```typescript
const isSpec = getWeaponSpecialized(weapon.name, weapon.name_en);
const specDmgBonus = isSpec ? 2 : 0;
// ...
{
  formatDamageWithBonus(weapon.damage_sm, strDmgAdj + dmgBonus + specDmgBonus);
}
```

- ✅ Per-weapon spec damage bonus

#### View 3: print-sheet.tsx

**Per-weapon calculation** (line 691-725):

```typescript
const matchingProf = findWeaponProf(weaponProficiencies, weapon.name, weapon.name_en);
const isSpecialized = matchingProf?.specialization ?? false;
const specHitBonus = isSpecialized ? 1 : 0;
const specDmgBonus = isSpecialized ? 2 : 0;
```

- ✅ Per-weapon proficiency + specialization

**APR** (line 707-711):

```typescript
const specForApr = weaponClassGroup === "warrior" && isSpecialized;
const weaponApr = getAttacksPerRound(aprGroup, weaponLevel, specForApr);
```

- ✅ Same logic as other views: crusader gets base warrior APR, fighter gets spec APR

**THAC0 + Damage** (line 718-761):

- ✅ Correctly applies `specHitBonus` and `specDmgBonus` per-weapon

#### View 4: docx-export.ts

**Per-weapon THAC0 + Damage** (line 885-934):

```typescript
const matchingProf = findWeaponProf(weaponProficiencies, weapon.name, weapon.name_en);
const isSpecialized = matchingProf?.specialization ?? false;
const specHitBonus = isSpecialized ? 1 : 0;
const specDmgBonus = isSpecialized ? 2 : 0;
```

- ✅ Per-weapon proficiency + specialization for THAC0 and Damage

**APR** (line 947):

```typescript
cell(attacksDisplay, { ... })
```

- ⚠️ `attacksDisplay` is a GLOBAL value computed at line 255-264:
  ```typescript
  const attacksDisplay = classEntries.map((ce) => {
    const group = CLASSES[ce.classId]?.group ?? "warrior";
    const aprGroup = ce.classId === "crusader" ? "warrior" : group;
    return getAttacksPerRound(aprGroup, ce.level);
  }).filter(...).join(" / ");
  ```
- ⚠️ This does NOT account for per-weapon specialization
- ⚠️ Shows the same APR value for ALL weapons in the export
- For a Level 11 Crusader: `getAttacksPerRound("warrior", 11)` → "3/2" (correct base, but same for all weapons)
- For a Fighter with one specialized weapon: would show base APR for all weapons, missing the spec bonus on the specialized weapon

### 3. House Rules Summary (as implemented)

| Rule                             | Implementation                                                    | Files                                                      |
| -------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| Crusader warrior THAC0           | `WARRIOR_THAC0_CLASSES` array in combat.ts:13                     | combat.ts                                                  |
| Crusader warrior APR by level    | `warriorEntry` includes crusader; `aprClassGroup = "warrior"`     | play-combat-panel, tab-equipment, print-sheet, docx-export |
| Crusader NO spec APR bonus       | `specForApr` gated by `primaryClassGroup === "warrior"`           | play-combat-panel, tab-equipment, print-sheet              |
| All classes can specialize (S&P) | `canSpecialize()` returns `true`                                  | proficiencies.ts                                           |
| Spec +1 hit, +2 damage           | Added to `strHitAdj`/`strDmgAdj` per-weapon where `isSpecialized` | All 4 views                                                |

## Code References

- `src/lib/rules/combat.ts:13` — WARRIOR_THAC0_CLASSES array (crusader)
- `src/lib/rules/combat.ts:172-186` — getAttacksPerRound function
- `src/lib/rules/combat.ts:197-212` — getAdjustedWeaponThac0 function
- `src/lib/rules/combat.ts:218-226` — formatDamageWithBonus function
- `src/lib/utils/proficiency-match.ts:1-25` — matchesWeaponProf + findWeaponProf
- `src/components/play-mode/play-combat-panel.tsx:154-198` — Play Mode weapon rendering
- `src/components/character-sheet/tab-equipment.tsx:474-516` — Equipment Tab helpers
- `src/components/character-sheet/tab-equipment.tsx:1327-1445` — Desktop weapon table
- `src/components/character-sheet/tab-equipment.tsx:1462-1577` — Mobile weapon cards
- `src/components/print-sheet/print-sheet.tsx:687-784` — Print weapon table
- `src/lib/utils/docx-export.ts:255-264` — Global attacksDisplay (NOT per-weapon)
- `src/lib/utils/docx-export.ts:883-950` — Word export weapon table

## Open Questions

1. Should `docx-export.ts` have per-weapon APR? Currently it shows the same APR for all weapons. For a Fighter with one specialized and one non-specialized weapon, the APR column would be incorrect for one of them.
