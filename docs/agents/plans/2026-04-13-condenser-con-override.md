---
date: 2026-04-13T09:23:21+00:00
git_commit: 757445feee0ec17c8528a5a5f521a73c839bda6b
branch: fix/condenser-con-override
topic: "Constitution Condenser Unequip-Bug fix"
tags: [plan, epic-items, hitpoints, forceStatOverrides, play-mode, character-sheet]
status: draft
---

# Constitution Condenser Unequip-Bug — Implementation Plan

## Overview

Zwei eigenständige Bugs rund um Sprockets Kondensator und generell `forceStatOverrides`:

1. **CON-Anzeige ignoriert `forceStatOverrides`** an zwei UI-Stellen (Manage-Stat-Grid + Play-Mode-Checks-Panel).
2. **HP-Clamping reduziert Current um den negativen Delta-Betrag** statt nur auf das neue Max zu clampen — wirkt wie Phantom-Damage beim Ablegen.

Ziel: Bugs beheben, HP-Clamping-Logik vereinheitlichen (reines Clamp auf Death-Threshold), Modified-Badge im Play-Mode auch für `forceStatOverrides` zeigen.

## Current State Analysis

Siehe Research-Doc `docs/agents/research/2026-04-13-condenser-con-override.md`. Kurzfassung:

- `getEpicEffects` füllt `forceStatOverrides.con = 5` korrekt wenn Kondensator unequipped (`epic-items.ts:222-230`).
- Drei Stat-Resolver-Varianten im Codebase; `play-checks-panel.tsx:eff()` + NWP-inline-Duplikat berücksichtigen `fo` nicht.
- `character-sheet.tsx:1241` zeigt `character.con` hartkodiert statt `effectiveCon`.
- HP-Berechnung in `play-mode.tsx:462` und `character-computed.ts:218` nutzt `hp_current + min(0, hpDelta)` mit unterschiedlichen Floors (Death-Threshold vs. `0`).

## Desired End State

Nach Fertigstellung:

- Kondensator ablegen: CON in Manage + Play-Mode zeigt **5** (mit Badge im Play-Mode, weil `isModified` korrekt erkennt: base=5, effective=5 → kein Override aktiv → kein Badge).
- Kondensator anlegen + funktionsfähig (L0): CON zeigt **18** mit Badge im Play-Mode (base=5, effective=18 → Override aktiv → Badge).
- HP: Vorher 34/34, Kondensator ab → Anzeige **12/12** (reines Clamp). Später wieder an → **12/34** (Clamp unverändert, da current ≤ newMax).
- HP-Floor überall einheitlich auf `getDeathThreshold(effectiveHpMax) = −effectiveHpMax`.

### UI Mockups

**Manage-Ansicht Stat-Grid (aktuell):**

```
┌──────────────────────────┐
│ CON                      │
│ 18                       │   ← hardcodiert base
│ HP: −3/Level             │   ← Modifier bereits aus effectiveCon=5
└──────────────────────────┘
```

**Manage-Ansicht Stat-Grid (ziel):**

```
┌──────────────────────────┐
│ CON                      │
│ 5                        │   ← effectiveCon
│ HP: −3/Level             │   ← konsistent
└──────────────────────────┘
```

**Play-Mode Checks-Panel (aktuell, Kondensator angelegt + aktiv):**

```
CON
18                 ← eff() ohne fo → zeigt base=5, obwohl Override auf 18 aktiv ist
  Health: 12
  Fitness: 15
```

**Play-Mode Checks-Panel (ziel, Kondensator angelegt + aktiv):**

```
CON  [modified]    ← Badge, weil fo.con=18 ≠ base=5
18
  Health: 12
  Fitness: 15
```

**HP-Bar (aktuell, nach Kondensator ab):**

```
Sprocket 'Fixit' Tanglewire   -10/12 [Unconscious]
```

**HP-Bar (ziel, nach Kondensator ab):**

```
Sprocket 'Fixit' Tanglewire   12/12
```

### Key Discoveries

- `epic-items.ts:240-259` Equip-Zweig legt `forceStatOverrides` fest, wenn das Item `simple_effects.base_<stat>` deklariert (authoritative stat). Das heißt: Kondensator setzt `fo.con` **sowohl equipped als auch unequipped** — der Unterschied ist der Zielwert (18 via `damage_levels[0].stat_overrides` vs 5 via `simple_effects.base_constitution`).
- `isModified` = `effective !== base` greift genau richtig für das User-Modell (Sprocket-Base-CON = 5, Override auf 18 = modifiziert).
- Overclock persistiert kein HP-Damage in DB — Option A ("reines Clamp") bedeutet Overclock-Ablauf reduziert HP **nicht** mehr. Bewusst akzeptiert.

## What We're NOT Doing

- Overclock-HP-Bookkeeping (Heal-per-Hour, Damage-beim-Ablauf) — separates Feature, aktuell nicht persistiert.
- `computeEffectiveMaxHp`-Helper in `hitpoints.ts` aufräumen/integrieren (wird aktuell nirgends aufgerufen, lassen wir liegen).
- `character-sheet.tsx` Modified-Badge im Manage-Stat-Grid — User möchte Badge explizit nur im Play-Mode. Manage zeigt nur den effektiven Wert.
- `epic-equipment-view.tsx` Before/After-Vergleich anfassen — funktioniert bereits korrekt mit `fo`.

## Implementation Approach

1. **TDD**: Failing Unit-Tests in `character-computed.test.ts` für reines Clamp + `play-checks-panel`-Ausweitung für `fo`.
2. **Engine-Fix**: `character-computed.ts` HP-Clamping umstellen.
3. **Play-Mode-Fix**: `play-mode.tsx` HP-Clamping auf gleiche Formel ziehen.
4. **UI-Fixes**: `character-sheet.tsx` Stat-Grid + `play-checks-panel.tsx` `eff`/`isModified`/inline-NWP.
5. **Manuelle Verifikation**: Sprocket-Testcharakter im Browser (Kondensator an/ab) + explorative playwright-cli-Runde.

## Architecture and Code Reuse

Neue Helper-Funktion in `src/lib/rules/hitpoints.ts` (wiederverwendbar für beide HP-Stellen):

```ts
/**
 * Clamp current HP when max HP changes (e.g. via CON-Override).
 * Pure cap: current is only lowered to fit the new max, never reduced
 * below the previous value. Death threshold = −newMax.
 */
export function clampHpCurrentToMax(storedCurrent: number, effectiveMax: number): number {
  const floor = getDeathThreshold(effectiveMax);
  return Math.max(floor, Math.min(storedCurrent, effectiveMax));
}
```

Betroffene Dateien:

```
src/lib/rules/
  hitpoints.ts                  # +clampHpCurrentToMax
  hitpoints.test.ts             # +Tests für neuen Helper
  character-computed.ts         # Delta-Damage entfernen, clampHpCurrentToMax nutzen
  character-computed.test.ts    # HP-Clamp-Tests für Kondensator-Szenario

src/components/
  character-sheet/character-sheet.tsx    # Stat-Grid: effective<Stat> statt character.<stat>
  play-mode/play-mode.tsx                # HP-Clamp via Helper
  play-mode/play-checks-panel.tsx        # eff()/isModified()/NWP-inline: fo mit einbeziehen
```

## Phase 1: Helper + Failing Tests (TDD)

### Overview

Neuen `clampHpCurrentToMax`-Helper schreiben (Rot → Grün später). Bestehende HP-Tests auf reines Clamp umstellen und neue Tests für Kondensator-Szenarien ergänzen.

### Changes Required:

#### [ ] 1. Helper in `hitpoints.ts`

**File**: `src/lib/rules/hitpoints.ts`
**Changes**: Export neuer Funktion `clampHpCurrentToMax(storedCurrent, effectiveMax): number`.

```ts
export function clampHpCurrentToMax(storedCurrent: number, effectiveMax: number): number {
  const floor = getDeathThreshold(effectiveMax);
  return Math.max(floor, Math.min(storedCurrent, effectiveMax));
}
```

#### [ ] 2. Unit-Tests für Helper

**File**: `src/lib/rules/hitpoints.test.ts`
**Changes**: Neue `describe`-Block für `clampHpCurrentToMax`. Tests: current ≤ max bleibt; current > max wird auf max geclampt; current < −max wird auf −max geclampt; current zwischen −max und 0 bleibt (Unconscious erlaubt).

#### [ ] 3. Failing Test für `computeCharacterCombatData` HP-Clamping

**File**: `src/lib/rules/character-computed.test.ts`
**Changes**: Test "Kondensator unequipped → HP wird auf new max geclampt, nicht reduziert" (Vor: hp_current=34, hp_max=34, CON=18 → Kondensator ab → effectiveCon=5 → erwartet: hpCurrent=12, hpMax=12). Plus Regression-Test: HP mit aktivem positiven CON-Override ändert current nicht nach unten.

### Success Criteria:

#### Automated Verification:

- [ ] `npx vitest run src/lib/rules/hitpoints.test.ts` neue Tests grün
- [ ] `npx vitest run src/lib/rules/character-computed.test.ts` neue Tests schlagen fehl (erwartet — rot-Phase)
- [ ] `npm run typecheck` grün

---

## Phase 2: Engine-Fix in `character-computed.ts`

### Overview

HP-Clamping von Delta-Damage auf reines Clamp umstellen. Floor auf Death-Threshold.

### Changes Required:

#### [ ] 1. HP-Berechnung in `computeCharacterCombatData`

**File**: `src/lib/rules/character-computed.ts`
**Changes**: Zeilen 217-218 ersetzen. Delta-Logik für `hpMax` bleibt, Current wird via Helper geclampt.

```ts
// vorher:
// const hpCurrent = Math.max(0, Math.min(character.hp_current + Math.min(0, hpDelta), hpMax));

// nachher:
import { clampHpCurrentToMax } from "./hitpoints";
...
const hpMax = Math.max(1, character.hp_max + hpDelta);
const hpCurrent = clampHpCurrentToMax(character.hp_current, hpMax);
```

### Success Criteria:

#### Automated Verification:

- [ ] `npx vitest run src/lib/rules/character-computed.test.ts` alle Tests grün (inkl. neue aus Phase 1)
- [ ] `npx vitest run src/lib/rules` — keine anderen HP-Regressionen
- [ ] `npm run typecheck` grün

---

## Phase 3: Play-Mode HP-Clamping angleichen

### Overview

`play-mode.tsx:462` dieselbe Logik geben wie in der Engine.

### Changes Required:

#### [ ] 1. HP-Clamp im Play-Mode

**File**: `src/components/play-mode/play-mode.tsx`
**Changes**: Zeilen 462-465 ersetzen. Import + Nutzung von `clampHpCurrentToMax`.

```ts
// vorher:
// const effectiveHpCurrent = Math.max(
//   getDeathThreshold(effectiveHpMax),
//   Math.min(character.hp_current + Math.min(0, hpDelta), effectiveHpMax)
// );

// nachher:
const effectiveHpCurrent = clampHpCurrentToMax(character.hp_current, effectiveHpMax);
```

Kommentar-Block Zeilen 459-461 entfernen (Delta-Damage-Erklärung obsolet).

### Success Criteria:

#### Automated Verification:

- [ ] `npm run typecheck` grün
- [ ] `npm test` komplette Suite grün (1564 Tests)

---

## Phase 4: UI-Fix A — Character-Sheet Stat-Grid

### Overview

Stat-Grid im Manage-View zeigt `character.<stat>` statt `effective<Stat>`. Zeile 1220–1265.

### Changes Required:

#### [ ] 1. Stat-Grid auf effective-Werte umstellen

**File**: `src/components/character-sheet/character-sheet.tsx`
**Changes**: Im Array ab Zeile 1220 die `value:`-Felder von `character.str/dex/con/int/wis/cha` auf die bereits berechneten `effectiveStr/effectiveDex/effectiveCon/effectiveInt/effectiveWis/effectiveCha` (Zeilen 264-269) umstellen.

```ts
{ key: "str", label: "STR", value: effectiveStr, mods: ... },
{ key: "dex", label: "DEX", value: effectiveDex, mods: ... },
{ key: "con", label: "CON", value: effectiveCon, mods: ... },
{ key: "int", label: "INT", value: effectiveInt, mods: ... },
{ key: "wis", label: "WIS", value: effectiveWis, mods: ... },
{ key: "cha", label: "CHA", value: effectiveCha, mods: ... },
```

### Success Criteria:

#### Automated Verification:

- [ ] `npm run typecheck` grün
- [ ] `npm run lint` grün
- [ ] `npm test` grün

#### Manual Verification:

- [ ] Sprocket (Kondensator angelegt, L0): Manage-Seite zeigt CON 18.
- [ ] Kondensator ablegen: Manage-Seite zeigt CON 5, HP-Mods aktualisieren konsistent.

---

## Phase 5: UI-Fix B — Play-Checks-Panel inkl. `forceStatOverrides`

### Overview

`eff()` + `isModified()` + inline-NWP-`effective()` in `play-checks-panel.tsx` müssen `forceStatOverrides` einbeziehen, mit `resolve`-Semantik wie in `character-computed.ts`.

### Changes Required:

#### [ ] 1. `eff()` und `isModified()` mit `fo` erweitern

**File**: `src/components/play-mode/play-checks-panel.tsx`
**Changes**: Ab Zeile 87-99.

```ts
const epic = epicEffects ?? defaultEpic;
const eo = epic.statOverrides;
const fo = epic.forceStatOverrides; // NEU
const mo = magicStatOverrides;
const mb = magicStatBonuses;

function eff(base: number, stat: StatKey): number {
  const resolved = fo[stat] ?? Math.max(base, eo[stat] ?? 0, mo[stat] ?? 0);
  return resolved + (mb[stat] ?? 0);
}

function isModified(base: number, stat: StatKey): boolean {
  return eff(base, stat) !== base;
}
```

#### [ ] 2. NWP-Checks inline auf gleichen Resolver

**File**: `src/components/play-mode/play-checks-panel.tsx`
**Changes**: `nwpChecks`-useMemo (Zeile ~252): `effective`-Funktion ersetzen durch dieselbe Formel; `fo` in der Closure und Dep-List ergänzen.

```ts
const nwpChecks = useMemo(() => {
  const effective = (base: number, stat: StatKey) =>
    (fo[stat] ?? Math.max(base, eo[stat] ?? 0, mo[stat] ?? 0)) + (mb[stat] ?? 0);
  ...
}, [nonweaponProficiencies, character, locale, fo, eo, mo, mb]);
```

### Success Criteria:

#### Automated Verification:

- [ ] `npm run typecheck` grün
- [ ] `npm run lint` grün (insb. `react-hooks/exhaustive-deps`)
- [ ] `npm test` grün

#### Manual Verification:

- [ ] Sprocket Play-Mode, Kondensator equipped + L0: CON-Feld zeigt 18 **mit Modified-Badge**.
- [ ] Kondensator ablegen: CON zeigt 5 **ohne Badge** (base=effective=5).
- [ ] CON-basierte NWPs (z.B. Stamina) haben Target-Nummer passend zu effektivem CON.

---

## Phase 6: Qualitätssicherung

### Overview

Phase-4-QA: explorativ testen, Regressionen ausschließen, axe-core-Checks wo sinnvoll.

### Changes Required:

#### [ ] 1. `npm run verify` voll grün

**File**: n/a
**Changes**: CI-Spiegel ausführen.

#### [ ] 2. Explorative manuelle Tests

**File**: n/a
**Changes**: playwright-cli-Runde über Sprocket (Manage + Play + GM-Dashboard), Kondensator equipped / damaged / unequipped. Zusätzlich: Charakter ohne Epic Items regressionslos.

### Success Criteria:

#### Automated Verification:

- [ ] `npm run verify` grün (format, lint, typecheck, test, build)

#### Manual Verification:

- [ ] Sprocket Kondensator ab/an: Manage + Play + GM-Dashboard zeigen konsistente CON-Werte.
- [ ] HP-Werte: 34/34 ↔ 12/12 symmetrisch ohne Phantom-Damage.
- [ ] Kein anderer Charakter betroffen (Smoke-Test auf Regressions-Charakter ohne Epic Items).
- [ ] Epic-Equipment-Seite Before/After-Diff weiter korrekt.
- [ ] axe-core clean auf Play-Mode-Checks-Panel.

---

## Testing Strategy

### Unit Tests

**`hitpoints.test.ts` — `clampHpCurrentToMax`:**

- current=34, max=12 → 12
- current=10, max=12 → 10
- current=−20, max=12 → −12 (Death-Threshold)
- current=−5, max=12 → −5 (Unconscious erlaubt)
- current=5, max=12 → 5 (unverändert)

**`character-computed.test.ts` — Kondensator-Szenarien:**

- Sprocket Szenario: hp_current=34, hp_max=34, con=18, Kondensator unequipped mit `base_constitution=5` → hpMax=12, hpCurrent=12.
- Kondensator equipped + L0: con=18 (bereits), `force_con=18` → hpMax + hpCurrent unverändert.
- CON↑ via buff (eo.con=20): hpMax steigt, hpCurrent bleibt (solange ≤ neues Max).
- Regression: Charakter ohne Epic Items → hpMax + hpCurrent = Stored.

### Integration Tests

Keine separaten Integration-Tests nötig. Bestehende E2E auf Play-Mode/Character-Sheet fangen grobe Regressionen.

### Manual Testing Steps

1. Sprocket Charakter öffnen (Manage). Kondensator ausrüsten, L0. CON sollte 18 anzeigen, HP 34/34.
2. Kondensator ablegen (Unequip). CON sollte 5 anzeigen, HP 12/12.
3. In Play-Mode wechseln, gleiche Kontrolle + Badge-Check.
4. GM-Dashboard öffnen, Sprocket in Party-Panel prüfen: HP 12/12, Status "Alive", keine Unconscious-Badge.
5. Kondensator wieder ausrüsten → Manage + Play + GM zeigen 18 + 34/34.
6. Regressionscharakter (ohne Epic Items): HP-Anzeige unverändert.

## Performance Considerations

Keine — nur Signatur- und Formeländerungen, keine neuen Allokationen oder Re-Renders.

## Migration Notes

Keine DB-Migration nötig. Persistenter State (`hp_current`, `hp_max`, `con`) bleibt unverändert. Änderung wirkt rein im Render-/Compute-Pfad.

**Rollout-Risiko:** Charaktere mit aktivem Overclock erleben nach Deployment einen HP-Sprung nach oben, falls Overclock vorher HP-Damage simuliert hat und `hp_current` in DB niedriger als Max war. Mitigation: Overclock ist kurzzeitig (durationHours), betroffenes Zeitfenster klein.

## References

- Research: `docs/agents/research/2026-04-13-condenser-con-override.md`
- Related: CLAUDE.md Abschnitt 19 (forceStatOverrides + asymmetrisches Clamping)
- Engine-Zentrale: `src/lib/rules/character-computed.ts`
- Helper-Heim: `src/lib/rules/hitpoints.ts`
