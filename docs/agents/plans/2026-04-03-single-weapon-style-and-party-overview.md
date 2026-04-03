---
date: "2026-04-03T21:34:34.891706+00:00"
git_commit: c02731648294846b4b0896031dd63d3216ab0f35
branch: feat/single-weapon-style-and-party-overview
topic: "Single-Weapon Style AC Bonus & Dashboard Party Overview"
tags: [plan, combat, dashboard, fighting-styles, ac-calculation]
status: draft
---

# Single-Weapon Style AC Bonus & Dashboard Party Overview

## Overview

Zwei unabhängige Features:

1. **Single-Weapon Style AC Bonus**: Der AC-Bonus aus dem Kampfstil "Einhandkampf" (1 Slot = +1 AC, 2 Slots = +2 AC) muss in die AC-Berechnung einfließen — aktuell werden Fighting Styles zwar gespeichert, aber der AC-Bonus wird nirgends angewendet.

2. **Dashboard Party Overview**: Das "Party Composition" Widget (zeigt nur 4 Klassengruppen-Zähler) wird durch eine interaktive Übersicht aller aktiven Charaktere ersetzt, mit Statistiken und Links zu jedem Charakter.

## Current State Analysis

### Feature 1: Single-Weapon Style

- **Fighting Styles existieren** in `src/lib/rules/fighting-styles.ts` mit `single_weapon` Definition
- **DB-Tabelle** `character_fighting_styles` existiert (migration 00032)
- **AC-Berechnung** in `src/lib/rules/equipment.ts` hat KEINEN Parameter für Single-Weapon Style
- **Play Mode** (`play-mode.tsx`) fetcht KEINE Fighting Styles und übergibt sie NICHT an PlayCombatPanel
- **Character Sheet** hat Fighting Styles State, nutzt ihn aber nicht für AC
- **Print Sheet** hat Fighting Styles Prop, nutzt ihn aber nicht für AC
- **Voraussetzungen laut Regel**: Einhandwaffe equipped, KEIN Schild, KEINE Zweitwaffe, freie Hand

### Feature 2: Dashboard Party Overview

- **Party Composition** Widget zeigt nur `{ warrior: N, priest: N, rogue: N, wizard: N }` in einem 2x2 Grid
- **Nur eigene Charaktere** werden gefetcht (`user_id = user.id`)
- **CharacterCard** Komponente existiert, ist aber groß mit Avatar-Breakout → zu groß für Dashboard-Widget
- **DM-Anforderung**: Alle aktiven Charaktere aller Spieler sehen, mit Stats und Schnellnavigation

## Desired End State

### Feature 1

- `calculateAC()` berücksichtigt Single-Weapon Style Bonus
- AC Breakdown zeigt "Einhandkampf +1/+2" als eigene Zeile
- Play Mode, Character Sheet und Print Sheet nutzen den Bonus
- Unit Tests für die neue AC-Logik

### Feature 2

- Dashboard zeigt kompaktes Character-Übersicht-Widget statt Klassengruppen-Zähler
- Alle aktiven Charaktere (aller User) mit: Avatar, Name, Rasse, Klasse/Level, HP-Bar
- Jeder Charakter ist anklickbar → navigiert zu `/characters/{id}`
- Klassengruppen-Glow auf jeder Zeile
- Responsive: 1 Spalte mobil, 2 Spalten Desktop

## What We're NOT Doing

- Keine Validation ob der Charakter die Voraussetzungen für Single-Weapon Style erfüllt (freie Hand, kein Schild) — das ist "nur warnen, nie blockieren" gemäß Hausregel
- Keine Fighting Style Effekte für Two-Hander, Weapon & Shield, oder Two-Weapon Style — nur Single-Weapon AC
- Keine neue DB-Migration — alles existiert schon
- Kein neues Widget-Component-File für Party Overview — direkt in dashboard/page.tsx

## Architecture and Code Reuse

```
src/lib/rules/
  equipment.ts          — ACCalculationInput um singleWeaponStyleBonus erweitern
  fighting-styles.ts    — getSingleWeaponStyleBonus() Hilfsfunktion hinzufügen

src/components/play-mode/
  play-mode.tsx         — Fighting Styles fetchen & an AC-Berechnung übergeben
  play-combat-panel.tsx — AC Breakdown um Single-Weapon Style erweitern

src/components/character-sheet/
  character-sheet.tsx   — AC-Berechnung um Fighting Style Bonus erweitern

src/components/print-sheet/
  print-sheet.tsx       — AC-Berechnung um Fighting Style Bonus erweitern

src/lib/utils/
  docx-export.ts        — AC-Berechnung um Fighting Style Bonus erweitern

src/app/dashboard/
  page.tsx              — Party Composition Widget ersetzen durch Party Overview

messages/
  de.json, en.json      — Neue i18n-Keys
```

## Phase 1: Single-Weapon Style AC Bonus (Regelwerk + Berechnung)

### Overview

AC-Berechnung um den Single-Weapon Style Bonus erweitern.

### Changes Required:

#### [ ] 1. Hilfsfunktion in fighting-styles.ts

**File**: `src/lib/rules/fighting-styles.ts`
**Changes**: `getSingleWeaponStyleBonus()` hinzufügen

```typescript
export function getSingleWeaponStyleBonus(
  fightingStyles: { style_id: string; slots_invested: number }[]
): number {
  const sws = fightingStyles.find((fs) => fs.style_id === "single_weapon");
  if (!sws) return 0;
  return sws.slots_invested; // 1 slot = 1, 2 slots = 2
}
```

#### [ ] 2. ACCalculationInput erweitern

**File**: `src/lib/rules/equipment.ts`
**Changes**: `singleWeaponStyleBonus` Parameter hinzufügen

```typescript
interface ACCalculationInput {
  // ... existing fields ...
  /** Single-Weapon Style AC bonus (1 or 2) */
  singleWeaponStyleBonus?: number;
}
```

In `calculateAC()`:

```typescript
const singleWeaponBonus = singleWeaponStyleBonus ?? 0;
return (
  baseAC +
  shieldBonus +
  dexDefenseAdj +
  magicACModifier +
  unarmoredBonus -
  epicAcBonus -
  singleWeaponBonus
);
```

#### [ ] 3. Unit Tests

**File**: `src/lib/rules/equipment.test.ts`
**Changes**: Tests für Single-Weapon Style AC Bonus

- Basis: 1 Slot → AC -1
- Maximum: 2 Slots → AC -2
- Kombination mit Rüstung, DEX, etc.

**File**: `src/lib/rules/fighting-styles.test.ts`
**Changes**: Tests für `getSingleWeaponStyleBonus()`

### Success Criteria:

#### Automated Verification:

- [ ] `npx vitest run src/lib/rules/equipment.test.ts` — Neue Tests grün
- [ ] `npx vitest run src/lib/rules/fighting-styles.test.ts` — Neue Tests grün
- [ ] `npx tsc --noEmit` — Keine TypeScript-Fehler

---

## Phase 2: Single-Weapon Style in UI integrieren

### Overview

Den AC Bonus in Play Mode, Character Sheet, Print Sheet und DOCX-Export einbauen.

### Changes Required:

#### [ ] 1. Play Mode: Fighting Styles fetchen

**File**: `src/app/characters/[id]/play/page.tsx`
**Changes**: `character_fighting_styles` Query hinzufügen

**File**: `src/components/play-mode/play-mode.tsx`
**Changes**:

- `fightingStyles` Prop hinzufügen
- `getSingleWeaponStyleBonus()` importieren
- `singleWeaponStyleBonus` an `calculateAC()` übergeben

#### [ ] 2. Play Combat Panel: AC Breakdown

**File**: `src/components/play-mode/play-combat-panel.tsx`
**Changes**:

- `fightingStyles` Prop hinzufügen
- AC Breakdown um Single-Weapon Style Zeile erweitern

#### [ ] 3. Character Sheet: AC-Berechnung

**File**: `src/components/character-sheet/character-sheet.tsx`
**Changes**: `singleWeaponStyleBonus` an `calculateAC()` übergeben (fightingStylesState ist bereits vorhanden)

#### [ ] 4. Print Sheet + DOCX: AC-Berechnung

**File**: `src/components/print-sheet/print-sheet.tsx`
**Changes**: `singleWeaponStyleBonus` an `calculateAC()` übergeben (fightingStyles Prop existiert bereits)

**File**: `src/lib/utils/docx-export.ts`
**Changes**: `singleWeaponStyleBonus` an `calculateAC()` übergeben (fightingStyles Param existiert bereits)

#### [ ] 5. i18n-Keys

**Files**: `messages/de.json`, `messages/en.json`
**Changes**: Key für AC Breakdown Label

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — Keine TypeScript-Fehler
- [ ] `npx vitest run` — Alle Tests grün

---

## Phase 3: Dashboard Party Overview

### Overview

Party Composition Widget durch interaktive Charakter-Übersicht ersetzen.

### Changes Required:

#### [ ] 1. Dashboard Query erweitern

**File**: `src/app/dashboard/page.tsx`
**Changes**:

- Zusätzliche Query: Alle aktiven Charaktere (ohne `user_id` Filter) für Party Overview
- Query: `supabase.from("characters").select("*").eq("is_active", true).order("name")`

#### [ ] 2. Party Overview Widget

**File**: `src/app/dashboard/page.tsx`
**Changes**: Party Composition Widget (Zeilen 273-295) ersetzen durch:

- Kompakte Charakter-Zeilen mit: Avatar (24px), Name, Rasse, Klasse+Level, HP-Bar
- Jede Zeile als Link zu `/characters/{id}`
- Klassengruppen-basierte Glow-Border
- data-testid auf jedem Element

```
┌─────────────────────────────────────────┐
│ PARTY OVERVIEW                          │
│                                         │
│ 🟢 [Avatar] Sprocket                   │
│    Gnome · Illusionist 5     HP ████░ 80%│
│                                         │
│ 🔴 [Avatar] Berris                     │
│    Human · Fighter 7         HP █████ 95%│
│                                         │
│ 🔵 [Avatar] Lia                        │
│    Elf · Thief 6             HP ███░░ 60%│
│                                         │
│ 🟡 [Avatar] Aldric                     │
│    Human · Cleric 5          HP █████100%│
└─────────────────────────────────────────┘
```

#### [ ] 3. i18n-Keys

**Files**: `messages/de.json`, `messages/en.json`
**Changes**:

- `dashboard.partyOverview` → "Party-Übersicht" / "Party Overview"
- Ggf. `dashboard.noActiveCharacters`

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — Keine TypeScript-Fehler
- [ ] `npx vitest run` — Alle Tests grün

---

## Phase 4: E2E Tests & Qualitätssicherung

### Changes Required:

#### [ ] 1. E2E Test für Dashboard Party Overview

**File**: `e2e/dashboard.spec.ts` (oder vorhandene Datei erweitern)
**Changes**: Test dass Party Overview Widget sichtbar ist und Character-Links funktionieren

#### [ ] 2. Bestehende E2E Tests

- [ ] `npx playwright test` — Alle bestehenden Tests grün

### Success Criteria:

#### Automated Verification:

- [ ] `npx playwright test` — Alle E2E-Tests grün
- [ ] `npm run lint` — Keine Linting-Fehler
- [ ] `npm run format:check` — Formatierung OK

## Testing Strategy

### Unit Tests:

- `getSingleWeaponStyleBonus()`: 0 Slots → 0, 1 Slot → 1, 2 Slots → 2, kein Style → 0
- `calculateAC()` mit `singleWeaponStyleBonus`: Basis + Kombinationen
- Keine Regression bestehender AC-Tests

### E2E Tests:

- Dashboard Party Overview Widget sichtbar
- Character-Links navigieren korrekt
