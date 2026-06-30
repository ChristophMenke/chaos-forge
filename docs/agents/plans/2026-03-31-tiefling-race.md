---
date: 2026-03-31T15:11:50.777372+00:00
git_commit: cf69d2cd94e9358ebcc9d70949785020a272a18d
branch: feat/priest-system
topic: "Tiefling-Rasse hinzufügen"
tags: [plan, races, tiefling, planescape]
status: draft
---

# Tiefling-Rasse Implementation Plan

## Overview

Tiefling als 9. Rasse in Chaos Forge hinzufügen. Rein Code-basierte Änderung (keine DB-Migration nötig, Rassen sind nicht in Supabase gespeichert). Quelle: Planescape Campaign Setting / Planewalker's Handbook.

## Current State Analysis

- 8 Rassen existieren: Human, Elf, Half-Elf, Dwarf, Gnome, Halfling, Half-Orc, Kobold
- `RaceId` union type in `types.ts:85-93`
- `RACES` Record in `races.ts:50-443` mit `RaceDefinition` Interface
- Zusätzliche Records: `STARTING_AGE` (L471), `HEIGHT_TABLE` (L543), `WEIGHT_TABLE` (L578)
- Tests in `races.test.ts` prüfen aktuell 8 Rassen (`getAllRaces().toHaveLength(8)`)

## Desired End State

- Tiefling wählbar im Charakter-Wizard als 9. Rasse
- Korrekte Attribut-Adjustments (INT +1, CHA -1)
- Alle Klassen erlaubt, keine Level-Limits
- Rassenfähigkeiten bilingual (DE/EN)
- Alle bestehenden Tests grün + neue Tiefling-Tests

## What We're NOT Doing

- Keine DB-Migration (Rassen sind rein im Code)
- Keine Planescape-spezifische Mechanik (z.B. Planar-Interaktionen)
- Keine Diebes-Fähigkeiten-Anpassungen (Quellenlage unsicher)

## Phase 1: Tiefling-Rasse implementieren

### Overview

Einzige Phase — kleine, fokussierte Änderung an 3 Dateien + i18n.

### Changes Required:

#### [x] 1. RaceId Type erweitern

**File**: `src/lib/rules/types.ts`
**Changes**: `"tiefling"` zur `RaceId` Union hinzufügen

#### [x] 2. RACES Record + Tabellen erweitern

**File**: `src/lib/rules/races.ts`
**Changes**: Neuer `tiefling` Eintrag in `RACES`, `STARTING_AGE`, `HEIGHT_TABLE`, `WEIGHT_TABLE`

```typescript
tiefling: {
  id: "tiefling",
  name: "Tiefling",
  name_en: "Tiefling",
  abilityAdjustments: { int: 1, cha: -1 },
  allowedClasses: ALL_CLASSES,
  levelLimits: {},
  multiclassOptions: [
    ["fighter", "mage"],
    ["fighter", "thief"],
    ["fighter", "cleric"],
    ["mage", "thief"],
    ["cleric", "thief"],
    ["cleric", "mage"],
  ],
  infravision: 60,
  baseMovement: 12,
  racialAbilities: [
    // Infravision 18m
    // Kälteresistenz (halber Schaden)
    // Feuerresistenz (halber Schaden)
    // Elektrizitätsresistenz (halber Schaden)
    // Dunkelheit 1x/Tag
    // -2 Reaktionsmalus
  ],
  defaultLanguages: ["Common", "Infernal"],
}
```

Startalter = wie Human. Größe/Gewicht = wie Human.

#### [x] 3. Unit Tests schreiben

**File**: `src/lib/rules/races.test.ts`
**Changes**: `getAllRaces().toHaveLength(9)` + Tiefling-spezifische Tests

#### [x] 4. i18n — nicht nötig (Rassennamen kommen aus races.ts)

**Files**: `messages/de.json`, `messages/en.json`
**Changes**: Prüfen ob Rassennamen über i18n geladen werden. Falls ja, Tiefling hinzufügen. Falls nein (Name kommt aus `races.ts`), kein Handlungsbedarf.

### Success Criteria:

#### Automated Verification:

- [ ] `npx vitest run src/lib/rules/races.test.ts` — alle Tests grün
- [ ] `npx vitest run` — alle 950+ Tests grün
- [ ] `npx tsc --noEmit` — keine Type-Errors
- [ ] `npm run format` — formatiert

#### Manual Verification:

- [ ] Charakter-Wizard: Tiefling als Rasse wählbar
- [ ] Attribut-Adjustments korrekt angewendet (INT +1, CHA -1)
- [ ] Alle Klassen wählbar
- [ ] Rassenfähigkeiten im Charakterbogen sichtbar

## Testing Strategy

### Unit Tests:

- `getAllRaces()` gibt 9 Rassen zurück
- Tiefling hat INT +1, CHA -1
- Tiefling kann alle 16 Klassen spielen
- Tiefling hat keine Level-Limits
- Tiefling hat 60ft Infravision
- Tiefling hat Bewegungsrate 12
- Tiefling hat 6 Multiclass-Optionen
- Startalter/Größe/Gewicht-Funktionen funktionieren für Tiefling

## References

- Research: `docs/agents/research/2026-03-31-tiefling-race.md`
- Planescape Campaign Setting (TSR 2600, 1994)
- The Planewalker's Handbook (TSR 2620, 1996)
- Vorlage: Kobold-Implementierung in `races.ts:401-442`
