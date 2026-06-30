---
date: 2026-03-31T07:14:38Z
git_commit: f28f0f3
branch: feat/multiclass-armor-warnings
topic: "Vollständiges Priester-System (Priesthoods, Turn Undead, Granted Powers)"
tags: [plan, priest, cleric, druid, priesthoods, turn-undead, granted-powers, ad&d-2e]
status: draft
---

# Vollständiges Priester-System — Implementation Plan

## Overview

Implementierung des vollständigen AD&D 2e Priester-Systems: Gottheit (Freitext) + 59 konfigurierbare Priesthoods (Priests of Specific Mythoi), Turn Undead Mechanik, Granted Powers System, und Bugfixes (Druid XP, Saving Throws, fehlende Kits). Priesthoods werden als Daten-Konfigurationen implementiert — die ClassIds `"cleric"` und `"druid"` bleiben unverändert. Jeder Priester kann zusätzlich eine Gottheit benennen (Freitext), die das Rollenspiel-Element darstellt, während das Priesthood die mechanische Konfiguration liefert.

## Current State Analysis

### Was existiert:

- 2 Priest Classes: Cleric + Druid mit korrekten Attributen (`classes.ts:400-479`)
- 16 Priest Spheres mit Major/Minor-Zugang (`magic.ts:56-109`)
- Spell Slots + Spell Points korrekt (`spellslots.ts:51-187`)
- 22 Priest Kits (11 Cleric, 11 Druid) (`kits.ts`)
- Spell Learning mit Sphere-Validierung (`spellslots.ts:278-327`)
- Character Wizard mit 7 Steps (Basics→Abilities→Race→Class→Kit→Combat→Summary)

### Was fehlt / kaputt ist:

- **Druid XP-Tabelle** Level 16-19 korrupt: `[..., 3500000, 500000, 1000000, 1500000, 2000000]` — Werte ab Index 14 sind falsch (`experience.ts:28-29`)
- **Druid +2 Save** vs. Fire/Electricity nicht implementiert (`combat.ts` hat keine klassenspezifischen Modifikatoren)
- **Turn Undead** nur Text-Beschreibung, keine Mechanik
- **Priesthoods** (Priests of Specific Mythoi) nicht implementiert — `getPriestSpheres()` kennt nur "cleric"/"druid"
- **Granted Powers** nicht implementiert
- 3 Druid Kits fehlen (Adviser, Beastfriend, Wanderer)

### Key Discoveries:

- `getPriestSpheres(classId)` in `magic.ts:88-97` hat einen einfachen switch mit nur 2 Cases — muss für Priesthood-Lookup erweitert werden
- `canLearnSpell()` in `spellslots.ts:312-318` prüft `cls.group === "priest"` und ruft `hasSphereAccess()` auf — wird automatisch funktionieren wenn `getPriestSpheres()` Priesthood-Sphären liefert
- `WizardState` in `wizard-types.ts` hat `kit: string | null` — Priesthood wird analog als `priesthood: string | null` hinzugefügt
- Character Wizard Steps in `wizard-types.ts:44-52` — neuer Step "Priesthood" wird nach "Kit" eingefügt (nur für Cleric-Klassen sichtbar)
- `getXpTable()` in `experience.ts:42-49` hat `XP_TABLES[classId]` — Priesthoods nutzen alle die Cleric-XP-Tabelle, keine Änderung nötig
- `getSavingThrows()` in `combat.ts:91-103` nutzt `ClassGroup` — Druid-Bonus muss als klassenspezifischer Modifier ergänzt werden
- Play Mode Panels in `src/components/play-mode/` nutzen `classGroups`/`classEntries` Props — Turn Undead Panel folgt dem gleichen Pattern

## Desired End State

Nach Abschluss:

1. Jeder Cleric kann eine **Gottheit** benennen (Freitext, z.B. "Tempus", "Lathander") und ein **Priesthood** wählen (z.B. "War", "Healing", "Agriculture"), das seine Sphären, Granted Powers, Waffen/Rüstungs-Empfehlungen und Alignment bestimmt. Druiden können ebenfalls eine Gottheit benennen (z.B. eine Naturgottheit), nutzen aber keine Priesthoods (eigene Mechanik).
2. **59 Priesthoods** aus dem Complete Priest's Handbook sind als Daten verfügbar
3. **Turn Undead** funktioniert als vollständige Mechanik im Play Mode (Tabelle, Würfel, Evil Command)
4. **Granted Powers** werden pro Priesthood angezeigt (Text + ausgewählte mechanische Effekte)
5. Alle **Bugfixes** behoben (Druid XP, Save-Bonus, fehlende Kits)
6. Priesthood-Auswahl im Character Wizard + Anzeige im Character Sheet
7. Sphären-Filter im Spellbook berücksichtigt das gewählte Priesthood

### Verifikation:

- Alle bestehenden Tests passieren weiterhin
- Neue Unit-Tests für Turn Undead, Priesthood-Sphären, Granted Powers
- Cleric ohne Priesthood verhält sich exakt wie bisher (Abwärtskompatibilität)
- Druid ist nicht von Priesthoods betroffen (eigene Mechanik)
- Spell Learning für Priesthood-Clerics filtert korrekt nach deren Sphären

## What We're NOT Doing

- **Druid Branches** (Arctic, Desert, etc.) — nicht relevant für die Gruppe
- **Druid Hierarchie** (Hierophant-Stufen) — Hausregel "keine Einschränkungen"
- **Gestaltwandel-UI** — separates Feature, nicht Teil dieses Plans
- **DB-Migration für Priesthoods** — Priesthoods werden als TypeScript-Daten gespeichert (wie Kits), nicht in der DB. Der `characters`-Eintrag bekommt nur ein `priesthood`-Feld
- **Waffen/Rüstungs-Enforcement** — nur Warnungen, nie Blockierung (Hausregel)
- **Custom Priesthoods** (DM-erstellbar) — die 59 vordefinierten reichen erstmal

## Implementation Approach

Priesthoods werden analog zum Kit-System implementiert — als TypeScript-Daten-Record mit einem Interface für die Konfiguration. Ein neuer Character-Wizard-Step "Priesthood" wird nach dem Kit-Step eingefügt (nur sichtbar wenn Cleric gewählt). Die Sphären-Logik wird so refactored, dass `getPriestSpheres()` zuerst das Priesthood prüft, bevor es auf den Cleric-Default zurückfällt.

## Architecture and Code Reuse

### Bestehendes Pattern: Kit-System

Das Kit-System (`kits.ts`) ist das architektonische Vorbild:

- `KitDefinition` Interface + `KITS: Record<string, KitDefinition>`
- `StepKit` Wizard-Komponente filtert nach `classId`
- `WizardState.kit: string | null`
- Kit-Auswahl in DB als `kit` Feld auf dem Character

Priesthoods folgen exakt dem gleichen Pattern.

### Bestehendes Pattern: Wizard Specialists

`SPECIALISTS[]` in `magic.ts` zeigt wie Klassen-Varianten-Konfigurationen als Daten-Array modelliert werden. Priesthoods sind das Priester-Äquivalent.

### Neues Pattern: Turn Undead

Neue Datei `turn-undead.ts` nach dem Muster von `combat.ts` (Tabellen + pure Functions).

### File Tree (betroffene Dateien)

```
src/lib/rules/
  types.ts                    # + PriesthoodId type, GrantedPower interface, UndeadType
  priesthoods.ts              # NEU: 59 PriesthoodDefinitions + Lookup-Functions
  turn-undead.ts              # NEU: Turn Undead Tabelle + Mechanik
  magic.ts                    # getPriestSpheres() refactored für Priesthood-Lookup
  experience.ts               # Druid XP-Tabelle Fix
  combat.ts                   # + getDruidSaveBonus(), + getSavingThrowsForClass()
  kits.ts                     # + 3 fehlende Druid-Kits
  index.ts                    # Barrel-Export für neue Module

src/components/wizard/
  wizard-types.ts             # + priesthood field in WizardState, + neuer Step
  character-wizard.tsx         # + StepPriesthood einbinden
  step-priesthood.tsx          # NEU: Priesthood-Auswahl (analog StepKit)

src/components/character-sheet/
  tab-spells.tsx              # Sphere-Filter berücksichtigt Priesthood
  tab-stats.tsx               # Granted Powers anzeigen (oder eigener Tab)

src/components/play-mode/
  play-turn-undead-panel.tsx   # NEU: Turn Undead UI
  play-mode.tsx               # + Turn Undead Panel einbinden

messages/
  de.json                     # i18n Keys für Priesthoods, Turn Undead, Granted Powers
  en.json                     # i18n Keys (EN)

supabase/migrations/
  XXXXX_priest_deity.sql       # ALTER TABLE characters ADD deity text, ADD priesthood text

src/app/characters/[id]/page.tsx  # Priesthood aus DB laden + an Components übergeben
```

## Phase 1: Bugfixes (Druid XP, Save-Bonus, fehlende Kits)

### Overview

Korrektur bekannter Bugs und Ergänzung fehlender Daten, die unabhängig vom Priesthood-System sind.

### Changes Required:

#### [x] 1. Druid XP-Tabelle korrigieren

**File**: `src/lib/rules/experience.ts`
**Changes**: Korrupte Werte ab Index 14 (Level 16+) reparieren

Die aktuelle Druid-Tabelle:

```typescript
// FEHLERHAFT:
druid: [2000, 4000, 7500, 12500, 20000, 35000, 60000, 90000, 125000, 200000, 300000, 750000, 1500000,
        3000000, 3500000, 500000, 1000000, 1500000, 2000000],
```

PHB Table 23 korrekte Druid-Werte:

```typescript
// KORREKT (PHB):
druid: [2000, 4000, 7500, 12500, 20000, 35000, 60000, 90000, 125000, 200000, 300000, 750000, 1500000,
        3000000, 3500000, 4000000, 4500000, 5000000, 5500000],
```

#### [x] 2. Druid +2 Saving Throw vs. Fire/Electricity

**File**: `src/lib/rules/combat.ts`
**Changes**: Neue Funktion für klassenspezifische Save-Modifikatoren

```typescript
import type { ClassId, ClassGroup, SavingThrows } from "./types";

/** Class-specific saving throw adjustments */
export function getClassSaveAdjustments(classId: ClassId): Partial<SavingThrows> {
  // PHB: Druids gain +2 to saving throws vs. fire or electrical attacks
  // These map to "breath" (breath weapon) and partially "spell" categories
  if (classId === "druid") {
    return { breath: -2 }; // negative = better (lower save needed)
  }
  return {};
}
```

#### [x] 3. Drei fehlende Druid-Kits

**File**: `src/lib/rules/kits.ts`
**Changes**: Adviser, Beastfriend, Wanderer hinzufügen (nach Pattern der bestehenden Druid-Kits)

```typescript
adviser_druid: {
  id: "adviser_druid",
  name: "Berater",
  name_en: "Adviser",
  classId: "druid",
  hitDieOverride: null,
  maxArmorAC: null,
  armorSpellFailure: null,
  abilities: [/* DE/EN */],
},
beastfriend: {
  id: "beastfriend",
  name: "Tierfreund",
  name_en: "Beastfriend",
  classId: "druid",
  // ...
},
wanderer_druid: {
  id: "wanderer_druid",
  name: "Wanderer",
  name_en: "Wanderer",
  classId: "druid",
  // ...
},
```

### Success Criteria:

#### Automated Verification:

- [x] Tests pass: `npm test`
- [x] Type checking passes: `npx tsc --noEmit`
- [x] Linting passes: `npm run lint`
- [x] New test: Druid XP Level 16 = 4.000.000 (nicht 500.000)
- [x] New test: Druid save adjustment returns `{ breath: -2 }`
- [x] New test: `getKitsForClass("druid")` enthält 14 Kits

---

## Phase 2: Priesthood-Datenmodell & Definitionen

### Overview

Das `PriesthoodDefinition` Interface, alle 59 Priesthood-Definitionen als Daten, und die nötigen Type-Erweiterungen.

### Changes Required:

#### [x] 1. Type-Erweiterungen

**File**: `src/lib/rules/types.ts`
**Changes**: PriesthoodId, GrantedPower, CombatRating types

```typescript
/** Priesthood identifiers for Priests of Specific Mythoi */
export type PriesthoodId = string; // flexible — 59 vordefinierte + future custom

/** Combat ability rating for priesthoods */
export type CombatRating = "good" | "medium" | "poor";

/** Granted Power definition */
export interface GrantedPower {
  id: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  level: number; // ab welcher Stufe verfügbar (1 = sofort)
  mechanical?: {
    type:
      | "turn_undead"
      | "command_undead"
      | "saving_throw_bonus"
      | "immunity"
      | "laying_on_hands"
      | "berserker_rage"
      | "soothing_word"
      | "charm"
      | "inspire_fear"
      | "detect"
      | "other";
    // Optional structured data for mechanical effects
    savingThrowBonus?: Partial<SavingThrows>;
    usesPerDay?: number;
  };
}
```

#### [x] 2. Priesthood-Definitionen

**File**: `src/lib/rules/priesthoods.ts` (NEU)
**Changes**: Alle 59 Priesthoods als Daten-Record

```typescript
import type { PriestSphere, SphereAccess, CombatRating, GrantedPower } from "./types";
import type { AlignmentId } from "./alignment";
import type { SphereMap } from "./magic";

export interface PriesthoodDefinition {
  id: string;
  name: string; // German
  name_en: string; // English
  deityAlignment: AlignmentId;
  priestAlignments: AlignmentId[];
  minAbilities: Partial<Record<"str" | "dex" | "con" | "int" | "wis" | "cha", number>>;
  spheres: SphereMap;
  grantedPowers: GrantedPower[];
  combatRating: CombatRating;
  allowedWeapons: string[]; // Weapon names (informational, not enforced)
  allowedArmor: string; // Text description (informational)
  source: string; // e.g. "PHBR03"
}

export const PRIESTHOODS: Record<string, PriesthoodDefinition> = {
  agriculture: {
    id: "agriculture",
    name: "Landwirtschaft",
    name_en: "Agriculture",
    deityAlignment: "true_neutral",
    priestAlignments: ["true_neutral", "neutral_good"],
    minAbilities: { wis: 11, con: 12 },
    spheres: {
      all: "major",
      creation: "major",
      divination: "major",
      plant: "major",
      summoning: "major",
      animal: "minor",
      healing: "minor",
      protection: "minor",
      sun: "minor",
      weather: "minor",
    },
    grantedPowers: [
      {
        id: "crop_analysis",
        name: "Ernteanalyse",
        name_en: "Crop Analysis",
        description: "Kann Nutzpflanzen identifizieren...",
        description_en: "Can identify domesticated crops...",
        level: 1,
        mechanical: { type: "detect" },
      },
      // ... weitere Powers
    ],
    combatRating: "poor",
    allowedWeapons: ["bill", "flail", "hand-throwing axe", "scythe", "sickle"],
    allowedArmor: "Non-metal armor and shields only",
    source: "PHBR03",
  },
  // ... 58 weitere Priesthoods
  war: {
    id: "war",
    name: "Krieg",
    name_en: "War",
    deityAlignment: "true_neutral",
    priestAlignments: ["neutral_evil", "true_neutral", "neutral_good"],
    minAbilities: { wis: 9, str: 13 },
    spheres: {
      combat: "major",
      healing: "major",
      necromantic: "minor",
      protection: "minor",
    },
    grantedPowers: [
      {
        id: "berserker_rage",
        name: "Berserkerraserei",
        name_en: "Incite Berserker Rage",
        description: "+2 auf Angriff und Schaden...",
        description_en: "+2 to attack and damage...",
        level: 1,
        mechanical: { type: "berserker_rage" },
      },
      {
        id: "inspire_fear",
        name: "Furcht einflößen",
        name_en: "Inspire Fear",
        description: "Wie der Wizard-Zauber Fear...",
        description_en: "Similar to the wizard spell Fear...",
        level: 5,
        mechanical: { type: "inspire_fear", usesPerDay: 2 },
      },
    ],
    combatRating: "good",
    allowedWeapons: [
      "battle axe",
      "bow",
      "dagger",
      "knife",
      "lance",
      "mace",
      "maul",
      "polearm",
      "spear",
      "sword",
      "warhammer",
    ],
    allowedArmor: "All armor and shields",
    source: "PHBR03",
  },
};

// Lookup functions
export function getPriesthood(id: string): PriesthoodDefinition | null;
export function getAllPriesthoods(): PriesthoodDefinition[];
export function getPriesthoodsForDisplay(locale: string): { id: string; label: string }[];
```

#### [x] 3. Barrel-Export

**File**: `src/lib/rules/index.ts`
**Changes**: Neue Module exportieren

### Success Criteria:

#### Automated Verification:

- [x] Tests pass: `npm test`
- [x] Type checking passes: `npx tsc --noEmit`
- [x] New test: `getAllPriesthoods()` returns 59+ entries (64 mit Race-Varianten)
- [x] New test: Each priesthood has valid spheres (only known PriestSphere values)
- [x] New test: Each priesthood has at least `wis` in minAbilities
- [x] New test: `getPriesthood("war")` returns correct sphere config
- [x] New test: `getPriesthood("agriculture")` returns 5 major + 5 minor spheres

---

## Phase 3: Sphären-Refactoring

### Overview

`getPriestSpheres()` wird erweitert, um Priesthood-basierte Sphären zu liefern. `canLearnSpell()` funktioniert automatisch, da es `hasSphereAccess()` nutzt, das auf `getPriestSpheres()` aufbaut.

### Changes Required:

#### [x] 1. getPriestSpheres() erweitern

**File**: `src/lib/rules/magic.ts`
**Changes**: Overload mit optionalem `priesthood` Parameter

```typescript
import { getPriesthood } from "./priesthoods";

// Bestehende Signatur bleibt abwärtskompatibel
export function getPriestSpheres(classId: ClassId, priesthoodId?: string | null): SphereMap {
  // Druid hat immer eigene Sphären (kein Priesthood)
  if (classId === "druid") return { ...DRUID_SPHERES };

  // Wenn Priesthood angegeben, dessen Sphären nutzen
  if (priesthoodId) {
    const priesthood = getPriesthood(priesthoodId);
    if (priesthood) return { ...priesthood.spheres };
  }

  // Fallback: Standard Cleric Sphären
  if (classId === "cleric") return { ...CLERIC_SPHERES };

  return {};
}

// hasSphereAccess() analog erweitern
export function hasSphereAccess(
  classId: ClassId,
  sphere: PriestSphere,
  accessLevel: SphereAccess,
  priesthoodId?: string | null
): boolean {
  const spheres = getPriestSpheres(classId, priesthoodId);
  // ... rest bleibt gleich
}
```

#### [x] 2. canLearnSpell() erweitern

**File**: `src/lib/rules/spellslots.ts`
**Changes**: Priesthood-Parameter durchreichen

```typescript
export function canLearnSpell(
  classId: ClassId,
  spellSchool: MagicSchool | undefined,
  spellSphere: PriestSphere | undefined,
  spellLevel: number,
  intScore: number,
  priesthoodId?: string | null
): SpellLearnResult {
  // ... priest spell checks nutzen hasSphereAccess(classId, sphere, level, priesthoodId)
}
```

#### [-] 3. UI-Sphere-Filter aktualisieren (→ Phase 8)

**File**: `src/components/character-sheet/tab-spells.tsx`
**Changes**: Priesthood-Sphären für Filter nutzen

Der Sphere-Filter muss die Sphären des Priesthoods anzeigen statt alle 16. Dazu wird `getPriestSpheres(classId, priesthoodId)` aufgerufen und nur Sphären mit Zugang angezeigt.

### Success Criteria:

#### Automated Verification:

- [x] Tests pass: `npm test`
- [x] Type checking passes: `npx tsc --noEmit`
- [x] New test: `getPriestSpheres("cleric", "war")` returns war spheres
- [x] New test: `getPriestSpheres("cleric", null)` returns standard cleric spheres (backwards-compat)
- [x] New test: `getPriestSpheres("druid", "war")` still returns druid spheres (druid ignores priesthood)
- [x] New test: `hasSphereAccess("cleric", "necromantic", "major", "war")` returns false (War has only minor)
- [x] Bestehende Tests: Alle alten `getPriestSpheres("cleric")` Tests passieren unverändert

---

## Phase 4: Turn Undead Mechanik

### Overview

Vollständige Turn Undead Implementierung nach PHB Table 61 als reine TypeScript-Logik.

### Changes Required:

#### [x] 1. Turn Undead Engine

**File**: `src/lib/rules/turn-undead.ts` (NEU)
**Changes**: Tabelle, Mechanik, Lookup-Funktionen

```typescript
export type UndeadType =
  | "skeleton"
  | "zombie"
  | "ghoul"
  | "shadow"
  | "wight"
  | "ghast"
  | "wraith"
  | "mummy"
  | "spectre"
  | "vampire"
  | "ghost"
  | "lich"
  | "special";

export type TurnResult = "no_effect" | "turn" | "destroy" | number; // number = target on d20

// PHB Table 61
const TURN_TABLE: Record<UndeadType, TurnResult[]> = {
  skeleton: [10, 7, 4, "turn", "turn", "destroy", "destroy", "destroy", "destroy", "destroy"],
  zombie: [13, 10, 7, 4, "turn", "destroy", "destroy", "destroy", "destroy", "destroy"],
  // ... alle Zeilen
};

export interface TurnAttemptResult {
  success: boolean;
  result: "turned" | "destroyed" | "commanded" | "failed";
  affectedHD: number; // 2d6
  targetNeeded: TurnResult;
}

export function getTurnTarget(undeadType: UndeadType, clericLevel: number): TurnResult;
export function resolveTurnAttempt(
  clericLevel: number,
  undeadType: UndeadType,
  d20Roll: number,
  turnedHDRoll: number, // 2d6
  isEvil: boolean
): TurnAttemptResult;

// Paladin support
export function getPaladinTurnLevel(paladinLevel: number): number; // level - 2
```

#### [x] 2. Type-Erweiterungen (in turn-undead.ts direkt definiert)

**File**: `src/lib/rules/types.ts`
**Changes**: UndeadType und TurnResult re-exportieren falls nötig

### Success Criteria:

#### Automated Verification:

- [x] Tests pass: `npm test` (30 tests)
- [x] Type checking passes: `npx tsc --noEmit`
- [x] New test: `getTurnTarget("skeleton", 1)` returns `10`
- [x] New test: `getTurnTarget("skeleton", 4)` returns `"T"` (auto-success)
- [x] New test: `getTurnTarget("skeleton", 6)` returns `"D"` (auto-destroy)
- [x] New test: `getTurnTarget("lich", 1)` returns `null`
- [x] New test: `resolveTurnAttempt(1, "skeleton", 12, 7, false)` — success (12 >= 10)
- [x] New test: `resolveTurnAttempt(1, "skeleton", 8, 7, false)` — fail (8 < 10)
- [x] New test: Evil cleric: `resolveTurnAttempt(4, "skeleton", 0, 7, true)` — "commanded" statt "turned"
- [x] New test: `getPaladinTurnLevel(5)` returns `3`
- [x] New test: `getPaladinTurnLevel(2)` returns `0` (can't turn yet)

---

## Phase 5: Granted Powers System

### Overview

Das `GrantedPower` Interface ist bereits in Phase 2 definiert. Hier wird die Integration implementiert: welche Powers mechanisch wirken und wie sie in der UI angezeigt werden.

### Changes Required:

#### [x] 1. Granted Power Lookup

**File**: `src/lib/rules/priesthoods.ts`
**Changes**: Funktionen zum Abfragen aktiver Powers basierend auf Level

```typescript
/** Returns granted powers available at the given level */
export function getActivePowers(priesthoodId: string, level: number): GrantedPower[];

/** Check if a priesthood grants Turn Undead */
export function priesthoodHasTurnUndead(priesthoodId: string): boolean;

/** Check if a priesthood grants Command Undead */
export function priesthoodHasCommandUndead(priesthoodId: string): boolean;

/** Get saving throw bonuses from priesthood granted powers */
export function getPriesthoodSaveBonus(priesthoodId: string, level: number): Partial<SavingThrows>;
```

#### [x] 2. Integration mit Saving Throws

**File**: `src/lib/rules/combat.ts`
**Changes**: `getSavingThrowsForClass()` erweitern für Priesthood-Boni

```typescript
/** Enhanced saving throws with class + priesthood modifiers */
export function getSavingThrowsForClass(
  classGroup: ClassGroup,
  classId: ClassId,
  level: number,
  priesthoodId?: string | null
): SavingThrows {
  const base = getSavingThrows(classGroup, level);
  // Apply druid bonus
  const druidAdj = getClassSaveAdjustments(classId);
  // Apply priesthood bonus
  const priesthoodAdj = priesthoodId ? getPriesthoodSaveBonus(priesthoodId, level) : {};
  // Combine (lower = better)
  return {
    paralyzation:
      base.paralyzation + (druidAdj.paralyzation ?? 0) + (priesthoodAdj.paralyzation ?? 0),
    rod: base.rod + (druidAdj.rod ?? 0) + (priesthoodAdj.rod ?? 0),
    // ...
  };
}
```

### Success Criteria:

#### Automated Verification:

- [x] Tests pass: `npm test` (928 total)
- [x] Type checking passes: `npx tsc --noEmit`
- [x] New test: `getActivePowers("war", 1)` returns berserker rage only
- [x] New test: `getActivePowers("war", 5)` returns berserker rage + inspire fear
- [x] New test: `priesthoodHasTurnUndead("community")` returns true
- [x] New test: `priesthoodHasTurnUndead("war")` returns false
- [x] New test: `priesthoodHasCommandUndead("death")` returns true

---

## Phase 6: DB-Migration & Character-Persistenz

### Overview

Priesthood-Feld zum Character hinzufügen und in der App durchreichen.

### Changes Required:

#### [x] 1. DB-Migration

**File**: `supabase/migrations/XXXXX_add_priesthood.sql` (NEU)

```sql
ALTER TABLE public.characters ADD COLUMN deity text;       -- Freitext: Name der Gottheit (z.B. "Tempus")
ALTER TABLE public.characters ADD COLUMN priesthood text;  -- Priesthood-ID (z.B. "war")
```

#### [x] 2. Character-Lade-Logik (auto via select("\*"))

**Files**: Character-Page und relevante Server-Komponenten
**Changes**: `priesthood` Feld aus DB laden und an Komponenten übergeben

#### [x] 3. Character-Speicher-Logik

**Files**: Character Wizard Save + Character Sheet Save
**Changes**: `priesthood` Feld beim Erstellen/Bearbeiten speichern

### Success Criteria:

#### Automated Verification:

- [ ] Migration ausführbar: `supabase db push`
- [ ] Type checking passes: `npx tsc --noEmit`

---

## Phase 7: Character Wizard — Priesthood-Auswahl

### Overview

Neuer Wizard-Step "Glaubensrichtung" nach dem Kit-Step, nur sichtbar wenn mindestens eine Cleric-Klasse gewählt ist.

### UI Mockup:

```
┌─────────────────────────────────────────────────┐
│ Schritt 6 von 8: Gottheit & Glaubensrichtung     │
│                                                   │
│ Gottheit (optional):                             │
│ ┌──────────────────────────────────────────────┐ │
│ │ Tempus                                       │ │
│ └──────────────────────────────────────────────┘ │
│ Name der Gottheit, der dein Priester dient.      │
│ Frei wählbar — abhängig von der Kampagnenwelt.   │
│                                                   │
│ ── Glaubensrichtung (nur Kleriker) ────────────  │
│                                                   │
│ Wähle die Glaubensrichtung deines Klerikers.     │
│ Dies bestimmt Sphären, Fähigkeiten und           │
│ Ausrüstungsempfehlungen.                         │
│                                                   │
│ ┌─ [●] Generischer Kleriker ──────────────────┐ │
│ │  Standard-Sphären nach PHB. Keine besondere  │ │
│ │  Glaubensrichtung.                           │ │
│ └──────────────────────────────────────────────┘ │
│                                                   │
│ ┌─ [ ] Krieg ──────────────────────────────────┐ │
│ │  Kampfrating: Gut                            │ │
│ │  Major: Kampf, Heilung                       │ │
│ │  Minor: Nekromantie, Schutz                  │ │
│ │  Powers: Berserkerraserei, Furcht (ab L5)    │ │
│ │  WIS 9, STR 13 empfohlen                    │ │
│ └──────────────────────────────────────────────┘ │
│                                                   │
│ ┌─ [ ] Heilung ────────────────────────────────┐ │
│ │  Kampfrating: Schlecht                       │ │
│ │  Major: Alle, Erschaffung, Erkenntnis, ...   │ │
│ │  Minor: Tier, Bezauberung, Wächter, ...      │ │
│ │  Powers: Giftimmunität, Handauflegen, ...    │ │
│ └──────────────────────────────────────────────┘ │
│                                                   │
│ [Suche: ________________]  [Filter: Alle ▾]     │
│                                                   │
│        [← Zurück]              [Weiter →]        │
└─────────────────────────────────────────────────┘
```

**Hinweis:** Der Gottheit-Freitext ist für alle Priest-Klassen sichtbar (Cleric + Druid). Die Priesthood-Auswahl erscheint nur für Clerics — Druiden haben ihre eigene fest definierte Sphären-Mechanik.

### Changes Required:

#### [x] 1. WizardState erweitern (bereits in Phase 6 erledigt)

**File**: `src/components/wizard/wizard-types.ts`
**Changes**: `priesthood` Feld + neuer Step

```typescript
export interface WizardState {
  // ... existing fields ...
  // Step 6: Deity & Priesthood (optional, für alle Priest-Klassen)
  deity: string; // Freitext: Name der Gottheit
  priesthood: string | null; // Priesthood-ID (nur für Cleric)
}

export const WIZARD_STEPS = [
  { id: "basics", label: "Grunddaten" },
  { id: "abilities", label: "Attribute" },
  { id: "race", label: "Rasse" },
  { id: "class", label: "Klasse" },
  { id: "kit", label: "Kit" },
  { id: "priesthood", label: "Glaubensrichtung" }, // NEU
  { id: "combat", label: "Kampfwerte" },
  { id: "summary", label: "Zusammenfassung" },
] as const;
```

#### [x] 2. StepPriesthood Komponente

**File**: `src/components/wizard/step-priesthood.tsx` (NEU)
**Changes**: Priesthood-Auswahl nach Kit-Pattern

- Nur angezeigt wenn `state.classIds.includes("cleric")`
- "Generischer Kleriker" als Default-Option (wie "Kein Kit")
- Alle 59 Priesthoods als Karten mit Sphären-Preview, Granted Powers, Combat Rating
- Suchfeld zum Filtern
- Ability-Requirement-Warnungen (nicht blockierend)
- Alignment-Warnungen

#### [x] 3. CharacterWizard einbinden

**File**: `src/components/wizard/character-wizard.tsx`
**Changes**: Step rendern + Skip-Logik wenn kein Cleric

#### [x] 4. i18n Keys

**Files**: `messages/de.json`, `messages/en.json`
**Changes**: Keys für Priesthood-Step, Labels, Beschreibungen

### Success Criteria:

#### Automated Verification:

- [ ] Tests pass: `npm test`
- [ ] Type checking passes: `npx tsc --noEmit`
- [ ] Linting passes: `npm run lint`

#### Manual Verification:

- [ ] Character Wizard: Bei Priest-Klasse (Cleric/Druid) erscheint Deity+Priesthood-Step
- [ ] Character Wizard: Gottheit-Freitext ist für Cleric UND Druid sichtbar
- [ ] Character Wizard: Priesthood-Auswahl erscheint nur für Cleric, nicht für Druid
- [ ] Character Wizard: Bei Nicht-Priest (z.B. Thief) wird der Step übersprungen
- [ ] Priesthood-Auswahl zeigt alle 59 Optionen + "Generisch"
- [ ] Suchfeld filtert Priesthoods korrekt
- [ ] Ability-Warnungen erscheinen bei nicht erfüllten Anforderungen
- [ ] Gottheit-Name wird in DB gespeichert und im Character Sheet angezeigt

---

## Phase 8: Character Sheet & Play Mode Integration

### Overview

Priesthood-Info im Character Sheet anzeigen, Granted Powers sichtbar machen, Turn Undead Panel im Play Mode.

### UI Mockup — Turn Undead Panel (Play Mode):

```
┌─────────────────────────────────────────┐
│ ☩ Untote vertreiben          Stufe: 5   │
│─────────────────────────────────────────│
│                                         │
│ Untoter:  [Skelett        ▾]           │
│ Benötigt: Automatisch vertrieben (T)    │
│                                         │
│ Betroffene TW:  [Würfeln: 2d6]  → 8    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Ergebnis: 8 TW an Skeletten        │ │
│ │ werden vertrieben!                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ── Referenztabelle ──                   │
│ Skelett:    T  │ Geist:     20          │
│ Zombie:     D  │ Mumie:     19          │
│ Ghul:       T  │ Gespenst:  16          │
│ Schatten:   T  │ Vampir:    13          │
│ Wight:      10 │ Lich:      --          │
└─────────────────────────────────────────┘
```

### Changes Required:

#### [x] 1. Turn Undead Panel

**File**: `src/components/play-mode/play-turn-undead-panel.tsx` (NEU)
**Changes**: Interaktives Turn Undead Panel

- Dropdown: Undead-Typ wählen
- Automatische Berechnung basierend auf Cleric-Level
- Würfel-Button für 2d6 (betroffene HD)
- Ergebnis-Anzeige (turned/destroyed/commanded/failed)
- Referenztabelle für den aktuellen Level
- Evil-Cleric-Modus: "Command" statt "Turn"
- Paladin-Support: Level -2

#### [x] 2. Play Mode Integration

**File**: `src/components/play-mode/play-mode.tsx`
**Changes**: Turn Undead Panel einbinden

Anzeige wenn:

- Character hat `classGroup === "priest"` und (Priesthood mit Turn Undead ODER generischer Cleric)
- ODER Character hat Paladin-Klasse (ab Level 3)

#### [ ] 3. Character Sheet — Priesthood-Info

**Files**: Character Sheet Komponenten
**Changes**: Priesthood-Name, Sphären, Granted Powers anzeigen

- Im Stats-Tab oder als eigener Abschnitt
- Priesthood-Name als Badge/Label
- Granted Powers Liste mit Level-Angabe
- Sphären-Übersicht (Major/Minor)
- Waffen/Rüstungs-Empfehlungen (als Info-Box, nicht als Warnung)

#### [ ] 4. Spell-Filter Priesthood-Integration

**File**: `src/components/character-sheet/tab-spells.tsx`
**Changes**: Sphere-Filter nutzt Priesthood-Sphären

- Nur verfügbare Sphären im Filter anzeigen
- "Minor"-Badge bei Minor-Sphären (max Level 3)
- Nicht-verfügbare Zauber ausgegraut oder nicht angezeigt

#### [ ] 5. i18n Keys

**Files**: `messages/de.json`, `messages/en.json`
**Changes**: Keys für Turn Undead Panel, Undead-Typen, Priesthood-Anzeige

### Success Criteria:

#### Automated Verification:

- [ ] Tests pass: `npm test`
- [ ] Type checking passes: `npx tsc --noEmit`
- [ ] Linting passes: `npm run lint`
- [ ] Formatting passes: `npm run format:check`

#### Manual Verification:

- [ ] Play Mode: Turn Undead Panel erscheint für Cleric-Charakter
- [ ] Play Mode: Turn Undead Panel erscheint NICHT für Druid
- [ ] Play Mode: Undead-Typ wählen → korrektes Ergebnis anzeigen
- [ ] Play Mode: 2d6 Würfeln → betroffene HD anzeigen
- [ ] Character Sheet: Gottheit-Name prominent angezeigt (z.B. "Priester des Tempus")
- [ ] Character Sheet: Priesthood-Name und Sphären sichtbar
- [ ] Character Sheet: Granted Powers mit Level-Info
- [ ] Spellbook: Sphere-Filter zeigt nur Priesthood-Sphären
- [ ] Spellbook: Zauber aus nicht-zugänglichen Sphären nicht lernbar

---

## Testing Strategy

### Unit Tests:

**Turn Undead (`turn-undead.test.ts`):**

- [ ] Alle 13 Undead-Typen × relevante Cleric-Level Kombinationen
- [ ] "T" (auto-turn) bei hohem Level
- [ ] "D" (auto-destroy) bei sehr hohem Level
- [ ] "no_effect" bei zu niedrigem Level
- [ ] Evil Cleric → "commanded" statt "turned"
- [ ] Paladin Level -2 Berechnung
- [ ] Edge Cases: Level 1 vs. Lich, Level 20 vs. Skeleton

**Priesthoods (`priesthoods.test.ts`):**

- [ ] Alle 59 Priesthoods haben gültige Sphären
- [ ] Alle Priesthoods haben mindestens WIS als Requirement
- [ ] Sphären-Lookup: War-Priest hat Combat major, Summoning nicht
- [ ] Healing-Priest hat 7 major + 6 minor Sphären
- [ ] `getActivePowers()` filtert nach Level korrekt
- [ ] `priesthoodHasTurnUndead()` für Community, Healing, Arts → true; für War, Death → false

**Sphären-Integration (`magic.test.ts` erweitert):**

- [ ] `getPriestSpheres()` abwärtskompatibel ohne Priesthood
- [ ] `getPriestSpheres()` mit Priesthood liefert korrekte Sphären
- [ ] Druid ignoriert Priesthood-Parameter
- [ ] `canLearnSpell()` mit Priesthood validiert korrekt

**Bugfixes:**

- [ ] Druid XP Level 16 = 4.000.000
- [ ] Druid XP Level 20 = 5.500.000
- [ ] Druid Save Adjustment: breath -2
- [ ] 14 Druid-Kits verfügbar (11 + 3 neue)

### Integration Tests:

- [ ] Character mit Priesthood erstellen → Priesthood in DB gespeichert
- [ ] Character laden → Priesthood korrekt geladen + Sphären angewendet
- [ ] Spell Learning mit Priesthood → nur zugängliche Sphären erlaubt

### Manual Testing Steps:

1. Neuen Cleric erstellen → Gottheit "Tempus" eingeben → Priesthood "War" wählen → verifizieren dass nur Combat/Healing Sphären im Spellbook erscheinen
2. Character Sheet: "Priester des Tempus" + "Krieg" Priesthood korrekt angezeigt
3. Bestehenden Cleric ohne Priesthood laden → alle Standard-Sphären weiterhin verfügbar, kein Gottheit-Name
4. Play Mode: Turn Undead Panel → Skeleton bei Level 5 → automatisch "T"
5. Play Mode: Turn Undead Panel → Lich bei Level 5 → "no effect"
6. Druid erstellen → Gottheit-Feld verfügbar, aber kein Priesthood-Step → Sphären unverändert
7. Fighter erstellen → kein Deity/Priesthood-Step sichtbar

## Performance Considerations

- 59 Priesthood-Definitionen als statisches TypeScript-Objekt — kein DB-Query nötig, Tree-Shaking möglich
- Turn Undead Tabelle als statisches Array — O(1) Lookup
- Sphere-Filter: `getPriestSpheres()` wird bei jedem Render aufgerufen — ist bereits O(1), keine Optimierung nötig

## Migration Notes

- **Abwärtskompatibilität:** Bestehende Charaktere haben `priesthood = null` → Standard-Cleric-Sphären (kein Breaking Change)
- **DB-Migration:** Einfaches `ALTER TABLE ADD COLUMN` — kein Datenverlust, keine Transformation nötig
- **Code-Migration:** `getPriestSpheres(classId)` ohne zweiten Parameter funktioniert wie bisher

## References

- Research: `docs/agents/research/2026-03-31-priest-class-analysis.md`
- PHB Priest Rules: `ressources/books/Players Handbook.txt` Lines 5712-6610
- PHB Turn Undead: `ressources/books/Players Handbook.txt` Lines 18765-18921
- PHBR03 Priesthoods: `ressources/books/TSR Inc - AD&D 2nd Edition - PHBR03 - The Complete Priest's Handbook_djvu.txt` Lines 6435-15565
- PHBR03 Granted Powers: Same file, Lines 3596-4600
- PHBR13 Missing Kits: `ressources/books/TSR Inc - AD&D 2nd Edition - PHBR13 - The Complete Druid's Handbook_djvu.txt` Lines 2543, 2771, 3981
- Existing Kit Pattern: `src/lib/rules/kits.ts`
- Existing Sphere System: `src/lib/rules/magic.ts`
