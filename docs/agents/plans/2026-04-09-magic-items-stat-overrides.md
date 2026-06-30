---
date: 2026-04-09T12:43:42+00:00
git_commit: cc823168be2352a6a22674dff26b4306e5ac188c
branch: feature/play-mode-magic-items
topic: "Magic Items Stat-Overrides & Play Mode Integration"
tags: [plan, magic-items, stat-overrides, play-mode, bug-fix]
status: draft
---

# Magic Items Stat-Overrides & Play Mode Integration

## Overview

Das `MagicEffects`-System kennt nur additive Boni, aber AD&D 2e Items wie der Gürtel der Riesenstärke **setzen** Attribute auf feste Werte (Override). Zusätzlich zeigt das Checks-Panel im Play Mode Magic Item Effekte nicht an. Dieser Plan fügt `stat_overrides` zum MagicEffects-System hinzu, korrigiert die Seed-Daten und integriert alle Magic Item Effekte korrekt in die UI.

## Current State Analysis

### Betroffene Items (4 von 25 Seed-Items)

| Item                     | Aktuell (Bug)                      | Korrekt (AD&D)                                    |
| ------------------------ | ---------------------------------- | ------------------------------------------------- |
| Belt of Giant Strength   | `"str": 19` → wird als +19 addiert | `stat_overrides: {str: 19}`                       |
| Gauntlets of Ogre Power  | `"str": 18` → wird als +18 addiert | `stat_overrides: {str: 18, str_exceptional: 100}` |
| Gauntlets of Dexterity   | `"dex": 18` → wird als +18 addiert | `stat_overrides: {dex: 18}`                       |
| Potion of Giant Strength | `"str": 19` → wird als +19 addiert | `stat_overrides: {str: 19}`                       |

### UI-Bugs im Checks-Panel

- `play-checks-panel.tsx:95`: Zeigt nur `eo.str ?? character.str` — Magic Item Boni/Overrides fehlen
- `play-checks-panel.tsx:189`: Thief Skills nutzen nur `applyThiefPenalty()`, Magic Item Boni werden ignoriert
- `play-checks-panel.tsx:226-233`: NWP Checks nutzen nur Epic Overrides, keine Magic Items
- `play-mode.tsx:867-881`: Props `magicSaveBonuses` und `magicThiefBonuses` werden nicht an Checks-Panel übergeben

### Key Discoveries

- `src/lib/supabase/types.ts:144-199` — `MagicEffects` Interface hat kein `stat_overrides` Feld
- `src/lib/rules/magic-items.ts:30-57` — `AggregatedMagicEffects` hat nur `statBonuses` (additiv)
- `src/lib/rules/magic-items.ts:106-109` — Stats werden summiert statt Override-Logik
- `src/lib/rules/character-computed.ts:140-145` — Effective Stats: `(eo ?? base) + mb` — kein Magic Override
- `src/lib/rules/epic-items.ts:5-12` — `EpicStatOverrides` Interface als Vorbild für Magic Item Overrides
- `src/components/play-mode/play-checks-panel.tsx:21-37` — Props `magicSaveBonuses`, `magicThiefBonuses` sind definiert aber unused

## Desired End State

1. Magic Items können Attribute **setzen** (Override, z.B. STR=19) UND **addieren** (Bonus, z.B. STR+2)
2. Override-Priorität: `max(epicOverride, magicOverride, baseValue)` — höchster Wert gewinnt
3. Checks-Panel zeigt alle effektiven Attribute korrekt an (mit Magic Item Overrides/Boni)
4. Thief Skills und NWP Checks berücksichtigen Magic Item Effekte
5. Save Bonuses und Thief Bonuses werden an Checks-Panel Props übergeben
6. Seed-Daten korrekt mit `stat_overrides` statt additivem Missbrauch
7. Gauntlets of Ogre Power setzen `str_exceptional: 100` (= 18/00)

### UI Mockup: Checks-Panel Attribut-Anzeige

**Aktuell (nur Epic Overrides):**

```
┌──────────────────────────────┐
│ STR  8                       │  ← Base-Wert, kein Override sichtbar
│ DEX 15                       │
│ CON 12                       │
└──────────────────────────────┘
```

**Nachher (mit Magic Item Overrides):**

```
┌──────────────────────────────┐
│ STR 19  ✦                    │  ← Override durch Gürtel, ✦ = "modified" Indikator
│ DEX 15                       │
│ CON 12                       │
└──────────────────────────────┘
```

Visuell identisch zum bestehenden Epic Override Indikator (lila Highlight bei `modified: true`).

## What We're NOT Doing

- **Stacking-Regeln:** Ring + Cloak of Protection stacken (Hausregel: alles stackt)
- **Temporäre Effekte / Duration:** Tränke werden manuell equipped/unequipped, kein Timer
- **Bracers of Defense AC Override:** Bleibt additiv (`ac_bonus: -4`), funktioniert bereits korrekt
- **GM Dashboard Änderungen:** `computeCharacterCombatData` wird gefixt, GM Dashboard profitiert automatisch
- **Neue Magic Items:** Nur bestehende 4 Items korrigieren, keine neuen Items

## Implementation Approach

Bottom-up: Type → Rules Engine → Computed Data → UI → Seed-Daten. Jede Phase hat eigene Tests.

**Override-Priorisierung (AD&D-konform):**

```
effectiveStat = max(magicOverride, epicOverride, baseStat) + magicAdditiveBonus
```

Wenn mehrere Magic Items Overrides für den gleichen Stat haben: höchster Override gewinnt (`max`).

## Architecture and Code Reuse

Bestehende Patterns wiederverwenden:

- `EpicStatOverrides` Interface aus `epic-items.ts` als Vorbild für `MagicStatOverrides`
- `scaleSubStat()` aus `epic-items.ts` für Sub-Stat-Skalierung bei Magic Overrides
- `applyThiefPenalty()` bleibt wie ist, Magic Thief Boni kommen additiv dazu

```
Betroffene Dateien:

src/lib/supabase/types.ts              ← stat_overrides zu MagicEffects hinzufügen
src/lib/rules/magic-items.ts           ← Override-Aggregation + neues Feld in AggregatedMagicEffects
src/lib/rules/magic-items.test.ts      ← Tests für Override-Logik
src/lib/rules/character-computed.ts    ← effectiveStats mit Magic Overrides
src/lib/rules/character-computed.test.ts ← Tests für Override-Priorität
src/components/play-mode/play-mode.tsx ← effectiveStats mit Magic Overrides
src/components/play-mode/play-checks-panel.tsx ← UI: Overrides + Boni anzeigen, Thief Skills, NWPs
supabase/migrations/00197_fix_magic_item_stat_overrides.sql ← Seed-Daten korrigieren
```

## Phase 1: Type & Rules Engine — stat_overrides Support

### Overview

`MagicEffects` Interface um `stat_overrides` erweitern und `getMagicItemEffects()` um Override-Aggregation ergänzen. TDD: Tests zuerst.

### Changes Required:

#### [ ] 1. MagicEffects Interface erweitern

**File**: `src/lib/supabase/types.ts`
**Changes**: `stat_overrides` Feld hinzufügen

```typescript
export interface MagicEffects {
  // ... bestehende Felder bleiben ...

  // Stat Overrides (set attribute to fixed value, e.g. Belt of Giant Strength STR=19)
  // Uses max() when multiple items override same stat — highest wins
  stat_overrides?: Partial<Record<"str" | "dex" | "con" | "int" | "wis" | "cha", number>> & {
    str_exceptional?: number; // For Gauntlets of Ogre Power (18/00 = 100)
  };
}
```

#### [ ] 2. AggregatedMagicEffects um statOverrides erweitern

**File**: `src/lib/rules/magic-items.ts`
**Changes**: Neues Feld `statOverrides` im Result-Interface + Override-Aggregation in `getMagicItemEffects()`

```typescript
export interface AggregatedMagicEffects {
  // ... bestehende Felder ...
  /** Stat overrides from magic items (max wins when multiple items override same stat) */
  statOverrides: Partial<Record<"str" | "dex" | "con" | "int" | "wis" | "cha", number>>;
  /** Exceptional strength override (e.g. 100 = 18/00 from Gauntlets of Ogre Power) */
  strExceptionalOverride: number | null;
}
```

In `getMagicItemEffects()` die Override-Aggregation hinzufügen:

```typescript
// Stat overrides (max wins — AD&D: highest override takes precedence)
if (fx.stat_overrides) {
  for (const stat of ["str", "dex", "con", "int", "wis", "cha"] as const) {
    const val = fx.stat_overrides[stat];
    if (val != null) {
      result.statOverrides[stat] = Math.max(result.statOverrides[stat] ?? 0, val);
    }
  }
  if (fx.stat_overrides.str_exceptional != null) {
    result.strExceptionalOverride = Math.max(
      result.strExceptionalOverride ?? 0,
      fx.stat_overrides.str_exceptional
    );
  }
}
```

#### [ ] 3. Unit-Tests für Override-Logik

**File**: `src/lib/rules/magic-items.test.ts`
**Changes**: Neue Tests hinzufügen

Testfälle:

- `stat_overrides` werden korrekt aggregiert (einzelnes Item)
- Mehrere Items mit Overrides: höchster gewinnt (`max`)
- `str_exceptional` Override (Gauntlets of Ogre Power)
- Override + additive Boni gleichzeitig (verschiedene Stats)
- Unequipped Items mit Overrides werden ignoriert
- Depleted Items mit Overrides werden ignoriert
- `statOverrides` ist `{}` und `strExceptionalOverride` ist `null` wenn keine Overrides vorhanden

### Success Criteria:

#### Automated Verification:

- [ ] `npm test -- --run src/lib/rules/magic-items.test.ts` — alle Tests grün
- [ ] `npm run lint` — keine Fehler

---

## Phase 2: Effective Stats Integration

### Overview

`character-computed.ts` und `play-mode.tsx` um Magic Item Overrides erweitern. Priorität: `max(magicOverride, epicOverride, baseValue) + magicAdditiveBonus`.

### Changes Required:

#### [ ] 1. character-computed.ts — effectiveStats mit Magic Overrides

**File**: `src/lib/rules/character-computed.ts`
**Changes**: Zeile 140-145 anpassen

```typescript
// Effective stats: max(epicOverride, magicOverride, base) + magic additive bonuses (capped at 25)
const MAX_STAT = 25;
const mo = magicEffects.statOverrides;
const resolveOverride = (base: number, epic?: number, magic?: number): number =>
  Math.max(base, epic ?? 0, magic ?? 0);

const effectiveStr = Math.min(
  resolveOverride(character.str, eo.str, mo.str) + (mb.str ?? 0),
  MAX_STAT
);
const effectiveDex = Math.min(
  resolveOverride(character.dex, eo.dex, mo.dex) + (mb.dex ?? 0),
  MAX_STAT
);
const effectiveCon = Math.min(
  resolveOverride(character.con, eo.con, mo.con) + (mb.con ?? 0),
  MAX_STAT
);
const effectiveInt = Math.min(
  resolveOverride(character.int, eo.int, mo.int) + (mb.int ?? 0),
  MAX_STAT
);
const effectiveWis = Math.min(
  resolveOverride(character.wis, eo.wis, mo.wis) + (mb.wis ?? 0),
  MAX_STAT
);
```

Exceptional STR für Gauntlets of Ogre Power berücksichtigen:

```typescript
const strMods = getStrengthModifiers(
  effectiveStr,
  // Use magic str_exceptional override if magic item overrides STR
  mo.str != null && mo.str >= (eo.str ?? 0)
    ? (magicEffects.strExceptionalOverride ?? character.str_exceptional ?? undefined)
    : (character.str_exceptional ?? undefined),
  // Sub-stats: scale if any override is active
  eo.str != null || mo.str != null
    ? (scaleSubStat(character.str, character.str_muscle, effectiveStr) ?? undefined)
    : (character.str_muscle ?? undefined),
  eo.str != null || mo.str != null
    ? (scaleSubStat(character.str, character.str_stamina, effectiveStr) ?? undefined)
    : (character.str_stamina ?? undefined)
);
```

#### [ ] 2. play-mode.tsx — effectiveStats mit Magic Overrides

**File**: `src/components/play-mode/play-mode.tsx`
**Changes**: Zeile 266-279 anpassen — gleiche Logik wie character-computed.ts

```typescript
const eo = epicEffects.statOverrides;
const mo = magicEffects.statOverrides;
const resolveOverride = (base: number, epic?: number, magic?: number): number =>
  Math.max(base, epic ?? 0, magic ?? 0);

const effectiveStr = resolveOverride(character.str, eo.str, mo.str) + (mb.str ?? 0);
const effectiveDex = resolveOverride(character.dex, eo.dex, mo.dex) + (mb.dex ?? 0);
// ... analog für alle Stats
```

#### [ ] 3. Unit-Tests für character-computed.ts

**File**: `src/lib/rules/character-computed.test.ts`
**Changes**: Tests für Magic Item Override-Priorität

Testfälle:

- Magic Override allein: STR 8 mit Belt of Giant Strength → effectiveStr = 19
- Epic Override allein: bleibt wie bisher
- Magic + Epic Override: höchster gewinnt
- Magic Override < Base: Base gewinnt (max-Logik)
- Magic Override + additiver Bonus: Override + Bonus
- str_exceptional Override bei Gauntlets of Ogre Power

### Success Criteria:

#### Automated Verification:

- [ ] `npm test -- --run src/lib/rules/character-computed.test.ts` — alle Tests grün
- [ ] `npm test -- --run src/lib/rules/magic-items.test.ts` — weiterhin grün
- [ ] `npm run lint` — keine Fehler

---

## Phase 3: UI — Checks-Panel Integration

### Overview

Checks-Panel zeigt Magic Item Overrides/Boni bei Attributen, Thief Skills und NWP Checks an. Fehlende Props werden übergeben.

### Changes Required:

#### [ ] 1. play-checks-panel.tsx — Props erweitern + Attribut-Anzeige

**File**: `src/components/play-mode/play-checks-panel.tsx`
**Changes**: Neue Props für Magic Item Overrides + Attribut-Score-Berechnung anpassen

Neue Props:

```typescript
interface PlayChecksPanelProps {
  // ... bestehende Props ...
  magicStatOverrides?: Partial<Record<"str" | "dex" | "con" | "int" | "wis" | "cha", number>>;
  magicStatBonuses?: Partial<Record<"str" | "dex" | "con" | "int" | "wis" | "cha", number>>;
}
```

Attribut-Score-Berechnung (Zeile 91-180) anpassen:

```typescript
// resolveOverride: max(base, epicOverride, magicOverride) + magicAdditiveBonus
const resolveScore = (
  base: number,
  epicOv?: number,
  magicOv?: number,
  magicBonus?: number
): { score: number; modified: boolean } => {
  const override = Math.max(base, epicOv ?? 0, magicOv ?? 0);
  const score = override + (magicBonus ?? 0);
  const modified =
    (epicOv != null && epicOv > base) ||
    (magicOv != null && magicOv > base) ||
    (magicBonus != null && magicBonus !== 0);
  return { score, modified };
};

const abilities = useMemo(
  () => [
    {
      name: "STR",
      ...resolveScore(character.str, eo.str, mo.str, mb.str),
      subScores: [/* Sub-Stat-Logik mit scaleSubStat anpassen */],
    },
    // ... analog für alle 6 Attribute
  ],
  [character, ts, eo, mo, mb]
);
```

Sub-Stat-Logik: `scaleSubStat` nutzen wenn ein Override aktiv ist (egal ob Epic oder Magic).

#### [ ] 2. play-checks-panel.tsx — Thief Skills mit Magic Boni

**File**: `src/components/play-mode/play-checks-panel.tsx`
**Changes**: Zeile 182-222 — Magic Thief Boni anwenden

```typescript
const thiefSkills = useMemo(() => {
  if (!showThiefSkills) return [];
  const mt = magicThiefBonuses ?? {};
  return [
    {
      name: ts("pickLocks"),
      base: character.thief_pick_locks,
      value: applyThiefPenalty(character.thief_pick_locks, epic) + (mt.openLocks ?? 0),
    },
    // ... analog für alle 7 Skills
  ];
}, [showThiefSkills, character, ts, epic, magicThiefBonuses]);
```

#### [ ] 3. play-checks-panel.tsx — NWP Checks mit Magic Overrides

**File**: `src/components/play-mode/play-checks-panel.tsx`
**Changes**: Zeile 224-249 — `abilityMap` mit Magic Overrides/Boni berechnen

```typescript
const nwpChecks = useMemo(() => {
  const abilityMap: Record<string, number> = {
    str: Math.max(character.str, eo.str ?? 0, mo.str ?? 0) + (mb.str ?? 0),
    dex: Math.max(character.dex, eo.dex ?? 0, mo.dex ?? 0) + (mb.dex ?? 0),
    // ... analog für alle Stats
  };
  // Rest bleibt gleich
}, [nonweaponProficiencies, character, locale, eo, mo, mb]);
```

#### [ ] 4. play-mode.tsx — Fehlende Props übergeben

**File**: `src/components/play-mode/play-mode.tsx`
**Changes**: An beide PlayChecksPanel-Instanzen (Desktop Zeile 867, Mobile Zeile 986) die fehlenden Props übergeben:

```tsx
<PlayChecksPanel
  // ... bestehende Props ...
  magicSaveBonuses={magicEffects.saveBonuses}
  magicThiefBonuses={magicEffects.thiefSkillBonuses}
  magicStatOverrides={magicEffects.statOverrides}
  magicStatBonuses={magicEffects.statBonuses}
/>
```

### Success Criteria:

#### Automated Verification:

- [ ] `npm run lint` — keine Fehler
- [ ] `npm run build` — keine TypeScript-Fehler

#### Manual Verification:

- [ ] Play Mode öffnen mit Charakter der einen Gürtel der Riesenstärke (STR→19) equipped hat → STR zeigt 19 mit lila Highlight
- [ ] Thief Skills zeigen Magic Item Boni korrekt (z.B. Boots of Elvenkind +50% Move Silently)
- [ ] NWP Checks nutzen die modifizierten Attributwerte

---

## Phase 4: Seed-Daten Migration

### Overview

DB-Migration korrigiert die 4 betroffenen Items: `str`/`dex` Felder entfernen, `stat_overrides` hinzufügen. Backfill für bestehende character_equipment Einträge.

### Changes Required:

#### [ ] 1. DB-Migration erstellen

**File**: `supabase/migrations/00197_fix_magic_item_stat_overrides.sql`
**Changes**: 4 Items im Katalog und alle referenzierenden character_equipment Einträge korrigieren

```sql
-- Fix Belt of Giant Strength: str: 19 → stat_overrides.str: 19
UPDATE magic_items
SET magic_effects = jsonb_set(
  magic_effects #- '{str}',
  '{stat_overrides}',
  '{"str": 19}'
)
WHERE name_en = 'Belt of Giant Strength' AND is_custom = false;

-- Fix Gauntlets of Ogre Power: str: 18 → stat_overrides.str: 18, str_exceptional: 100
UPDATE magic_items
SET magic_effects = jsonb_set(
  magic_effects #- '{str}',
  '{stat_overrides}',
  '{"str": 18, "str_exceptional": 100}'
)
WHERE name_en = 'Gauntlets of Ogre Power' AND is_custom = false;

-- Fix Gauntlets of Dexterity: dex: 18 → stat_overrides.dex: 18
UPDATE magic_items
SET magic_effects = jsonb_set(
  magic_effects #- '{dex}',
  '{stat_overrides}',
  '{"dex": 18}'
)
WHERE name_en = 'Gauntlets of Dexterity' AND is_custom = false;

-- Fix Potion of Giant Strength: str: 19 → stat_overrides.str: 19
UPDATE magic_items
SET magic_effects = jsonb_set(
  magic_effects #- '{str}',
  '{stat_overrides}',
  '{"str": 19}'
)
WHERE name_en = 'Potion of Giant Strength' AND is_custom = false;

-- Backfill: Update character_equipment entries that reference these items
UPDATE character_equipment ce
SET magic_effects = mi.magic_effects
FROM magic_items mi
WHERE ce.magic_item_id = mi.id
  AND mi.name_en IN (
    'Belt of Giant Strength',
    'Gauntlets of Ogre Power',
    'Gauntlets of Dexterity',
    'Potion of Giant Strength'
  )
  AND mi.is_custom = false;
```

#### [ ] 2. Migration ausführen

```bash
npx supabase db push
```

### Success Criteria:

#### Automated Verification:

- [ ] Migration läuft ohne Fehler
- [ ] `npm run build` — keine Fehler

#### Manual Verification:

- [ ] Sprocket's Belt of Giant Strength: STR zeigt 19 im Play Mode
- [ ] Gauntlets of Ogre Power: STR zeigt 18 mit exceptional modifier
- [ ] Gauntlets of Dexterity: DEX zeigt 18

---

## Testing Strategy

### Unit Tests (Phase 1 + 2):

**magic-items.test.ts:**

- `stat_overrides` von einem Item korrekt aggregiert
- Mehrere Items mit Overrides: `max` gewinnt
- `str_exceptional` Override
- Overrides + additive Boni gleichzeitig (verschiedene Stats)
- Unequipped/depleted Items: Overrides ignoriert
- Leere/keine `stat_overrides`: Default-Werte
- Rückwärtskompatibilität: bestehende Tests bleiben grün

**character-computed.test.ts:**

- Magic Override allein: STR 8 → 19 (Belt of Giant Strength)
- Epic Override allein: bleibt wie bisher
- Magic + Epic: `max(19, 20)` = 20
- Override < Base: Base gewinnt
- Override + additiver Bonus: 19 + 2 = 21
- `str_exceptional` Override bei Gauntlets of Ogre Power
- HP-Delta bei CON Override

### Integration Tests:

- `npm run build` erfolgreich (TypeScript-Kompilierung)

### Manual Testing Steps:

1. Sprocket im Play Mode öffnen → STR zeigt 19 (Belt of Giant Strength equipped)
2. Belt of Giant Strength unequippen → STR fällt auf 8 zurück
3. Gauntlets of Ogre Power an anderem Charakter testen → STR 18/00
4. Ring of Protection +1 equipped → Saves zeigen Bonus, AC verbessert

## Performance Considerations

Keine relevanten Performance-Auswirkungen. Die Override-Logik ist O(n) über die equipped items (max 5-10 Items pro Charakter) und wird bereits im bestehenden `getMagicItemEffects()` Loop verarbeitet.

## Migration Notes

- Die DB-Migration (Phase 4) korrigiert sowohl den `magic_items` Katalog als auch alle `character_equipment` Einträge die diese Items referenzieren
- Custom Magic Items (user-created) sind nicht betroffen — nur die 4 DMG-Seed-Items
- Kein Breaking Change: Items ohne `stat_overrides` funktionieren wie bisher (rein additiv)

## References

- Research: `docs/agents/research/2026-04-09-magic-items-stat-overrides.md`
- Epic Items Override-Logik: `src/lib/rules/epic-items.ts:163-263`
- AD&D 2e DMG: Magical Items — Girdles & Gauntlets
