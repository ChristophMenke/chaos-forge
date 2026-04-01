---
date: 2026-04-01T08:26:20.574717+00:00
git_commit: e92dbcbf0437c3e3bfe5239620090de1db04cc3c
branch: feat/polish-fixes
topic: "Crusader-Klasse aus Player's Option: Spells & Magic"
tags: [plan, classes, priesthoods, combat, crusader]
status: draft
---

# Crusader-Klasse Implementation Plan

## Overview

Die Klasse **Crusader** aus Player's Option: Spells & Magic wird als eigenständige Priester-Klasse zu Chaos Forge hinzugefügt. Der Crusader ist ein kampfstarker Priester mit Warrior-THAC0, allen Waffen/Rüstungen, eigenen Sphären (inkl. alignment-abhängig Law/Chaos), und speziellen Granted Powers (Lighten Load, Easy March). Er kann keine Untoten vertreiben.

## Current State Analysis

- 16 Klassen existieren, aufgeteilt in 4 Gruppen (warrior, priest, rogue, wizard)
- Priester-Klassen: Cleric und Druid
- `getThac0(classGroup, level)` nutzt nur ClassGroup — kein ClassId-Override möglich
- `getPriestSpheres(classId, priesthoodId)` hat hardcoded Branches für cleric, druid, ranger, paladin
- `isPriestCaster()` listet 4 IDs: cleric, druid, ranger, paladin
- `getXpTable()` mapped alle Wizard-Spezialisten auf mage, ansonsten per ClassId
- `ALL_CLASSES` in races.ts ist eine manuelle Liste aller 16 ClassIds
- `getMulticlassThac0()` in multiclass.ts ruft `getThac0(CLASSES[c.classId].group, c.level)` auf — ein Override in `getThac0` propagiert automatisch

## Desired End State

Ein Spieler kann im Character Wizard die Klasse "Kreuzritter/Crusader" wählen. Der Crusader:

- Erscheint in der Klassenauswahl mit korrekten Ability Requirements (WIS 9, STR 12, CHA 12)
- Hat Warrior-THAC0-Progression (1 pro Stufe) trotz group="priest"
- Nutzt Priester-Saving-Throws und Priester-Spell-Slots/Points
- Hat eigene Sphären (All, Combat, Guardian, Healing, War, Wards major; Necromantic, Protection minor; plus Law/Chaos je nach Alignment)
- Kann eine Priesthood wählen (überschreibt Sphären wie bei Cleric)
- Zeigt Granted Powers im Play Mode Abilities-Panel (Lighten Load ab Lvl 3, Easy March ab Lvl 7)
- Kann keine Untoten vertreiben
- Ist bei Human, Dwarf, Elf in allowedClasses; andere Rassen zeigen Warnung (Hausregel)

### Key Discoveries:

- `getThac0()` (`combat.ts:12`) nimmt nur ClassGroup — braucht optionalen `classId`-Parameter
- `getMulticlassThac0()` (`multiclass.ts:17`) ruft `getThac0` auf — Override propagiert automatisch
- `ALL_CLASSES` (`races.ts:20-37`) muss manuell erweitert werden (kein dynamischer Export)
- XP-Tabelle kann auf Cleric gemapped werden (analog Wizard-Spezialisten → mage)
- `getPriestSpheres()` (`magic.ts:96-116`) braucht neuen Branch + alignment-Parameter
- `PRIEST_CASTER_IDS` (`magic.ts:90`) muss erweitert werden
- DB-Tabelle `classes` hat Foreign Key von `character_classes` — Migration nötig

## What We're NOT Doing

- Keine Crusader-spezifischen Kits (PO:S&M definiert keine)
- Keine Waffen-/Rüstungsrestriktionen im Code (existiert generell nicht in Chaos Forge)
- Kein Turn Undead Override (Crusader hat group="priest", aber kein Turn Undead — Turn Undead im Play Mode ist bereits optional/priesthood-basiert)
- Keine neuen Priesthoods für den Crusader (nutzt bestehende)
- Keine Multiclass-Optionen für den Crusader (kann später ergänzt werden)

## Implementation Approach

3 Phasen: Regelwerk-Engine (Types, Classes, Combat, Magic, XP) → DB-Migration + Races → i18n. Die Engine-Phase ist TDD-getrieben mit Unit-Tests für jede neue Funktion. UI-Änderungen sind minimal, da der Wizard automatisch alle Klassen aus `getAllClasses()` rendert.

## Architecture and Code Reuse

**Bestehende Patterns:**

- ClassDefinition für Crusader analog zu Cleric (`classes.ts:400-435`)
- CRUSADER_SPHERES analog zu CLERIC_SPHERES/DRUID_SPHERES (`magic.ts:62-87`)
- XP-Mapping analog zu Wizard-Spezialisten (`experience.ts:47`)
- classAbilities mit usesPerDay analog zu Tiefling-Abilities (`races.ts`)

**THAC0-Override-Strategie:**
`getThac0(classGroup, level, classId?)` — optionaler dritter Parameter. Wenn `classId === "crusader"`, Warrior-Rate nutzen. Alle bestehenden Aufrufer ohne classId funktionieren weiterhin identisch. `getMulticlassThac0` muss den classId durchreichen.

```
src/lib/rules/
├── types.ts          ← "crusader" zu ClassId Union
├── classes.ts        ← Crusader ClassDefinition
├── combat.ts         ← getThac0() optionaler classId-Parameter
├── magic.ts          ← CRUSADER_SPHERES + getPriestSpheres() + isPriestCaster()
├── experience.ts     ← getXpTable() Crusader→Cleric Mapping
├── multiclass.ts     ← getMulticlassThac0() classId durchreichen
├── races.ts          ← ALL_CLASSES + allowedClasses für dwarf/elf
├── index.ts          ← (ggf. Re-Export)
├── combat.test.ts    ← Tests für Crusader-THAC0
├── magic.test.ts     ← Tests für Crusader-Sphären
├── experience.test.ts ← Tests für Crusader-XP
├── kits.test.ts      ← Test: keine Kits für Crusader
supabase/migrations/
├── 00075_seed_crusader_class.sql  ← INSERT INTO classes
messages/
├── de.json           ← Crusader-Translations
├── en.json           ← Crusader-Translations
```

---

## Phase 1: Regelwerk-Engine (Types, Classes, Combat, XP)

### Overview

ClassId erweitern, ClassDefinition anlegen, THAC0-Override implementieren, XP-Mapping. Alles TDD-getrieben.

### Changes Required:

#### [x] 1. ClassId Union erweitern

**File**: `src/lib/rules/types.ts:97-113`
**Changes**: `"crusader"` zur ClassId Union hinzufügen

```typescript
export type ClassId =
  | "fighter"
  // ... existing ...
  | "cleric"
  | "crusader" // ← NEU
  | "druid"
  | "thief"
  | "bard";
```

#### [x] 2. Crusader ClassDefinition

**File**: `src/lib/rules/classes.ts`
**Changes**: Neue ClassDefinition nach dem Cleric-Eintrag

```typescript
crusader: {
  id: "crusader",
  name: "Kreuzritter",
  name_en: "Crusader",
  group: "priest",
  hitDie: 8,
  abilityRequirements: { wis: 9, str: 12, cha: 12 },
  primeRequisites: ["wis", "str"],
  exceptionalStrength: false,
  classAbilities: [
    {
      name: "Krieger-ETW0-Progression",
      name_en: "Warrior THAC0 Progression",
      description: "Der ETW0 des Kreuzritters verbessert sich mit der Rate eines Kriegers (1 pro Stufe) statt der eines Priesters.",
      description_en: "The crusader's THAC0 improves at the warrior's rate of 1 per level instead of the priest's rate.",
    },
    {
      name: "Alle Waffen und Rüstungen",
      name_en: "All Weapons and Armor",
      description: "Kreuzritter dürfen jede Art von Waffe, Rüstung und Schild verwenden — anders als normale Priester, die auf stumpfe Waffen beschränkt sind.",
      description_en: "Crusaders may use any weapon, armor, and shield — unlike regular priests who are restricted to blunt weapons.",
    },
    {
      name: "Last erleichtern (ab Stufe 3)",
      name_en: "Lighten Load (from Level 3)",
      description: "Einmal pro Tag kann der Kreuzritter das Gewicht der Ausrüstung einer Gruppe für einen Tag halbieren.",
      description_en: "Once per day, the crusader can halve the weight of a party's equipment for one day.",
      usesPerDay: 1,
    },
    {
      name: "Eilmarsch (ab Stufe 7)",
      name_en: "Easy March (from Level 7)",
      description: "Einmal pro Woche kann der Kreuzritter einer kleinen Gruppe einen Gewaltmarsch ohne Erschöpfung ermöglichen.",
      description_en: "Once per week, the crusader can allow a small party to force march without accumulating fatigue.",
      usesPerDay: 1,
    },
    {
      name: "Kein Untote vertreiben",
      name_en: "No Turn Undead",
      description: "Kreuzritter können keine Untoten vertreiben oder befehligen. Stattdessen erhalten sie ihre Granted Powers.",
      description_en: "Crusaders cannot turn or command undead. Instead, they receive their granted powers.",
    },
  ],
},
```

#### [x] 3. THAC0-Override für Crusader

**File**: `src/lib/rules/combat.ts:12-31`
**Changes**: Optionalen `classId`-Parameter hinzufügen

```typescript
// Crusaders (PO:S&M) use warrior THAC0 despite being priest group
const WARRIOR_THAC0_CLASSES: ClassId[] = ["crusader"];

export function getThac0(classGroup: ClassGroup, level: number, classId?: ClassId): number {
  const effectiveGroup =
    classId && WARRIOR_THAC0_CLASSES.includes(classId) ? "warrior" : classGroup;
  // ... rest uses effectiveGroup statt classGroup
}
```

#### [x] 4. Multiclass THAC0 — classId durchreichen

**File**: `src/lib/rules/multiclass.ts:15-18`
**Changes**: classId an getThac0 übergeben

```typescript
export function getMulticlassThac0(classes: ClassEntry[]): number {
  if (classes.length === 0) return 20;
  return Math.min(...classes.map((c) => getThac0(CLASSES[c.classId].group, c.level, c.classId)));
}
```

#### [x] 5. XP-Tabelle: Crusader → Cleric

**File**: `src/lib/rules/experience.ts:42-50`
**Changes**: Crusader auf Cleric-Tabelle mappen

```typescript
function getXpTable(classId: ClassId): number[] {
  const cls = CLASSES[classId];
  if (!cls) return XP_TABLES.fighter;
  if (cls.group === "wizard") return XP_TABLES.mage;
  // Crusader uses cleric XP table (PO:S&M)
  if (classId === "crusader") return XP_TABLES.cleric;
  return XP_TABLES[classId] ?? XP_TABLES.fighter;
}
```

#### [x] 6. Unit-Tests: combat.test.ts

**File**: `src/lib/rules/combat.test.ts`
**Changes**: Tests für Crusader-THAC0

```typescript
describe("Crusader THAC0 (Warrior rate)", () => {
  it("L1 Crusader has THAC0 20 (warrior rate, not priest)", () => {
    expect(getThac0("priest", 1, "crusader")).toBe(20);
  });
  it("L5 Crusader has THAC0 16 (warrior: 21-5)", () => {
    expect(getThac0("priest", 5, "crusader")).toBe(16);
  });
  it("L10 Crusader has THAC0 11", () => {
    expect(getThac0("priest", 10, "crusader")).toBe(11);
  });
  it("regular priest still uses priest progression", () => {
    expect(getThac0("priest", 5)).toBe(18); // unchanged
  });
});
```

#### [x] 7. Unit-Tests: experience.test.ts

**File**: `src/lib/rules/experience.test.ts`
**Changes**: Tests für Crusader-XP

```typescript
describe("Crusader XP", () => {
  it("uses cleric XP table", () => {
    expect(getXpForNextLevel("crusader", 1)).toBe(1500);
    expect(getXpForNextLevel("crusader", 2)).toBe(3000);
  });
});
```

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — keine Type-Errors
- [ ] `npx vitest run` — alle Tests grün (inkl. neue)
- [ ] `npm run format`

---

## Phase 2: Sphären-System + Alignment-abhängige Sphären

### Overview

CRUSADER_SPHERES definieren, getPriestSpheres() erweitern mit alignment-Parameter, isPriestCaster() erweitern.

### Changes Required:

#### [x] 8. CRUSADER_SPHERES + getPriestSpheres + isPriestCaster

**File**: `src/lib/rules/magic.ts`
**Changes**:

```typescript
import type { AlignmentId } from "./alignment";

export const CRUSADER_SPHERES: SphereMap = {
  all: "major",
  combat: "major",
  guardian: "major",
  healing: "major",
  war: "major",
  wards: "major",
  necromantic: "minor",
  protection: "minor",
};

const PRIEST_CASTER_IDS: ClassId[] = ["cleric", "crusader", "druid", "ranger", "paladin"];

export function getPriestSpheres(
  classId: ClassId,
  priesthoodId?: string | null,
  alignment?: string | null // ← NEU: optional
): SphereMap {
  if (classId === "druid") return { ...DRUID_SPHERES };
  if (classId === "ranger") return { ...DRUID_SPHERES };
  if (classId === "paladin") return { ...CLERIC_SPHERES };

  // Crusader: own spheres + alignment-based law/chaos
  if (classId === "crusader") {
    if (priesthoodId) {
      const priesthood = getPriesthood(priesthoodId);
      if (priesthood) return { ...priesthood.spheres };
    }
    const spheres: SphereMap = { ...CRUSADER_SPHERES };
    if (alignment?.startsWith("lawful")) spheres.law = "major";
    else if (alignment?.startsWith("chaotic")) spheres.chaos = "major";
    return spheres;
  }

  // Cleric with priesthood
  if (priesthoodId) {
    const priesthood = getPriesthood(priesthoodId);
    if (priesthood) return { ...priesthood.spheres };
  }
  if (classId === "cleric") return { ...CLERIC_SPHERES };
  return {};
}
```

#### [x] 9. Alignment durchreichen an getPriestSpheres

Die Aufrufer von `getPriestSpheres` müssen das Alignment durchreichen. Die wichtigsten Stellen:

**Files**: `src/components/character-sheet/tab-spells.tsx`, `src/lib/supabase/priest-spells.ts`, `src/components/wizard/step-priesthood.tsx`
**Changes**: `alignment`-Parameter ergänzen wo verfügbar

**Hinweis**: Der dritte Parameter ist optional — bestehende Aufrufer ohne alignment funktionieren weiterhin (Crusader bekommt dann weder Law noch Chaos, was ein sinnvoller Fallback ist).

#### [x] 10. Unit-Tests: magic.test.ts

**File**: `src/lib/rules/magic.test.ts`
**Changes**:

```typescript
describe("Crusader spheres", () => {
  it("has base crusader spheres", () => {
    const spheres = getPriestSpheres("crusader");
    expect(spheres.combat).toBe("major");
    expect(spheres.war).toBe("major");
    expect(spheres.wards).toBe("major");
    expect(spheres.necromantic).toBe("minor");
    expect(spheres.charm).toBeUndefined(); // no charm access
  });
  it("lawful crusader gets law sphere", () => {
    const spheres = getPriestSpheres("crusader", null, "lawful_good");
    expect(spheres.law).toBe("major");
    expect(spheres.chaos).toBeUndefined();
  });
  it("chaotic crusader gets chaos sphere", () => {
    const spheres = getPriestSpheres("crusader", null, "chaotic_good");
    expect(spheres.chaos).toBe("major");
    expect(spheres.law).toBeUndefined();
  });
  it("priesthood overrides crusader default spheres", () => {
    const spheres = getPriestSpheres("crusader", "war");
    expect(spheres.war).toBe("major"); // from war priesthood
  });
  it("isPriestCaster includes crusader", () => {
    expect(isPriestCaster("crusader")).toBe(true);
  });
  it("getAvailablePriestSpells works for crusader", () => {
    const spells = [
      { id: "1", sphere: "combat", level: 1, spell_type: "priest" as const },
      { id: "2", sphere: "charm", level: 1, spell_type: "priest" as const },
    ];
    const result = getAvailablePriestSpells("crusader", 1, null, spells);
    expect(result).toHaveLength(1); // only combat, not charm
  });
});
```

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit`
- [ ] `npx vitest run`
- [ ] `npm run format`

---

## Phase 3: Rassen, DB-Migration, i18n

### Overview

Rassen-Integration (allowedClasses), DB-Migration, Translations.

### Changes Required:

#### [x] 11. Rassen: allowedClasses + ALL_CLASSES

**File**: `src/lib/rules/races.ts`
**Changes**:

- `ALL_CLASSES` Array: `"crusader"` hinzufügen (nach "cleric")
- `elf.allowedClasses`: `"crusader"` hinzufügen
- `dwarf.allowedClasses`: `"crusader"` hinzufügen
- Andere Rassen (gnome, halfling, half_orc): Crusader NICHT hinzufügen → Warnung im Wizard (Hausregel erlaubt es trotzdem)

#### [x] 12. DB-Migration

**File**: `supabase/migrations/00075_seed_crusader_class.sql`

```sql
-- Seed Crusader class
INSERT INTO public.classes (id, name, class_group, hit_die, ability_requirements, prime_requisites, exceptional_strength)
VALUES (
  'crusader',
  'Kreuzritter',
  'priest',
  8,
  '{"wis": 9, "str": 12, "cha": 12}',
  ARRAY['wis', 'str'],
  false
);
```

#### [x] 13. i18n: Translations (nicht nötig — Klassennamen aus classes.ts)

**Files**: `messages/de.json`, `messages/en.json`
**Changes**: Crusader-Label in den "classes"-Abschnitt (falls vorhanden) oder relevante Keys für den Wizard

#### [x] 14. Unit-Tests: races + kits

**File**: `src/lib/rules/kits.test.ts`
**Changes**:

```typescript
it("crusader has no kits", () => {
  expect(getKitsForClass("crusader")).toHaveLength(0);
});
```

**File**: `src/lib/rules/races.test.ts` (oder existierende Tests)

```typescript
it("human can play crusader", () => {
  expect(canPlayClass("human", "crusader")).toBe(true);
});
it("dwarf can play crusader", () => {
  expect(canPlayClass("dwarf", "crusader")).toBe(true);
});
it("elf can play crusader", () => {
  expect(canPlayClass("elf", "crusader")).toBe(true);
});
it("halfling cannot play crusader (warning only)", () => {
  expect(canPlayClass("halfling", "crusader")).toBe(false);
});
```

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit`
- [ ] `npx vitest run`
- [ ] `npm run format`
- [ ] `supabase db push` — Migration erfolgreich

#### Manual Verification:

- [ ] Character Wizard: Crusader erscheint in der Klassenauswahl mit korrekten Requirements
- [ ] Crusader-Charakter erstellen: Sphären-Zugang korrekt (All, Combat, Guardian, Healing, War, Wards major)
- [ ] Play Mode: THAC0 verbessert sich mit Warrior-Rate (z.B. Lvl 5 → THAC0 16, nicht 18)
- [ ] Play Mode: Abilities-Panel zeigt "Last erleichtern" und "Eilmarsch" (je nach Level)
- [ ] Zauber-Tab: Zeigt Crusader-Sphären-Zauber (nicht Cleric-Standard)
- [ ] Priesthood-Auswahl: Crusader kann Priesthood wählen, Sphären werden überschrieben

---

## Testing Strategy

### Unit Tests:

- Crusader THAC0: Warrior-Rate (L1=20, L5=16, L10=11, L20=1)
- Regular Priest THAC0 unverändert (Regression)
- Crusader XP: Cleric-Tabelle (L2=1500, L3=3000)
- Crusader Sphären: Base + Lawful=Law / Chaotic=Chaos
- Priesthood überschreibt Crusader-Sphären
- isPriestCaster("crusader") === true
- getAvailablePriestSpells für Crusader filtert korrekt
- canPlayClass: human/dwarf/elf → true, halfling → false
- getKitsForClass("crusader") → leer
- getMulticlassThac0 mit Crusader nutzt Warrior-Rate

### Manual Testing Steps:

1. Neuen Crusader-Charakter im Wizard erstellen (Human, Lawful Good)
2. Prüfen: THAC0 = 20, Sphären enthalten Law (major)
3. Charakter auf Level 5 setzen → THAC0 = 16 (nicht 18)
4. Zauber-Tab: Nur Crusader-Sphären-Zauber sichtbar
5. Play Mode: Abilities-Panel zeigt Crusader-Fähigkeiten
6. Zweiten Crusader erstellen (Chaotic Neutral) → Chaos statt Law Sphäre

## Migration Notes

- Migration `00075_seed_crusader_class.sql` fügt den Crusader in die `classes`-Tabelle ein
- Keine Character-Daten-Migration nötig (neue Klasse, keine Umstellung)
- Foreign Key in `character_classes` wird automatisch bedient

## References

- Research: `docs/agents/research/2026-03-31-crusader-class.md`
- PO:S&M Regeltext: `ressources/books/TSR Inc - AD&D 2nd Edition - Player's Option - Spells & Magic_djvu.txt:3699-3786`
- Cleric-Definition als Vorlage: `src/lib/rules/classes.ts:400-435`
- CLERIC_SPHERES als Vorlage: `src/lib/rules/magic.ts:62-77`
