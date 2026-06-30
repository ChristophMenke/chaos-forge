---
date: 2026-03-31T15:22:26.270458+00:00
git_commit: 8f01be3c4090486302fa9b9b0cf2ec053c67f787
branch: feat/tiefling-race
topic: "Rasse ändern + Fähigkeiten-Panel im Play Mode"
tags: [plan, races, play-mode, racial-abilities, granted-powers]
status: draft
---

# Rasse ändern + Fähigkeiten-Panel Implementation Plan

## Overview

Zwei Features auf dem Branch `feat/tiefling-race`:

1. **Rasse ändern**: Dropdown im Character Sheet Header, mit automatischer Attribut-Adjustment-Anpassung und Warnung
2. **Fähigkeiten-Panel**: Neues Panel im Play Mode für Rassenfähigkeiten + Priesthood Granted Powers mit usesPerDay-Tracking

## Current State Analysis

- Rasse ist read-only Badge im Header (`character-sheet.tsx:539`)
- Alignment hat ein editierbares Dropdown als Vorlage (`character-sheet.tsx:544-557`)
- `update()` akzeptiert `keyof CharacterRow` inkl. `race_id` (`character-sheet.tsx:307`)
- Play Mode hat 6 Panels, kein Fähigkeiten-Panel (`play-mode.tsx:146`)
- `ClassAbility` hat kein `usesPerDay` — `GrantedPower` hat es (`types.ts:189`)
- `getActivePowers(priesthoodId, level)` existiert (`priesthoods.ts:3839`)

## Desired End State

### UI Mockup: Character Sheet Header (Rasse editierbar)

```
[Avatar] CHARAKTERNAME
         [Tiefling ▼] [Kleriker] [Stufe: 9] [Neutral ▼] [Priester von Tempus]
```

Beim Wechsel → Confirm-Dialog:

```
┌─────────────────────────────────────────────┐
│ Rasse ändern                                │
│                                             │
│ ⚠ Attribut-Adjustments werden angepasst:   │
│                                             │
│ Alte Rasse (Mensch): Keine Adjustments      │
│ Neue Rasse (Tiefling): INT +1, CHA -1      │
│                                             │
│ Deine Attribute werden entsprechend         │
│ angepasst.                                  │
│                                             │
│              [Abbrechen] [Rasse ändern]     │
└─────────────────────────────────────────────┘
```

### UI Mockup: Play Mode Fähigkeiten-Panel

```
┌─ FÄHIGKEITEN ──────────────────────────────┐
│                                             │
│ ▸ Infravision (18 m)                       │
│   Tieflinge können im Dunkeln...           │
│                                             │
│ ▸ Kälteresistenz (halber Schaden)          │
│   Tieflinge erleiden nur halben...          │
│                                             │
│ ▸ Dunkelheit 1x/Tag         [Nutzen 0/1]  │
│   Einmal pro Tag als angeborene...          │
│                                             │
│ ── Gewährte Kräfte (Kriegspriester) ──     │
│                                             │
│ ▸ Berserkerrausch 1x/Tag    [Nutzen 0/1]  │
│   Der Priester kann einmal pro Tag...       │
│                                             │
└─────────────────────────────────────────────┘
```

## What We're NOT Doing

- Keine DB-Migration für usesPerDay-Tracking (lokal wie Priester-Slots)
- Keine Rassen-DB-Tabelle (Rassen bleiben rein im Code)
- Kein automatisches Wechseln von Klassen bei Rassenwechsel

## Architecture and Code Reuse

```
src/
  lib/rules/
    types.ts                    # ClassAbility um usesPerDay erweitern
    races.ts                    # racialAbilities mit usesPerDay (Tiefling Dunkelheit)
  components/
    character-sheet/
      character-sheet.tsx       # Race Dropdown + Confirm-Dialog
    play-mode/
      play-mode.tsx             # PanelId + "abilities" Panel einhängen
      play-abilities-panel.tsx  # NEU: Rassenfähigkeiten + Granted Powers
  messages/
    de.json / en.json           # i18n Keys
```

Wiederverwendung:

- `ConfirmDialog` Komponente existiert bereits (character-sheet.tsx Import)
- `GlassCard` für Panel-Wrapper (wie alle anderen Play Mode Panels)
- `getActivePowers()` aus priesthoods.ts für Granted Powers
- `localized()` für DE/EN-Texte

---

## Phase 1: Rasse ändern im Character Sheet

### Overview

Race Badge durch editierbares Dropdown ersetzen (für Owner). Beim Wechsel Confirm-Dialog mit Warnung + automatische Attribut-Adjustment-Anpassung.

### Changes Required:

#### [x] 1. ClassAbility Interface erweitern

**File**: `src/lib/rules/types.ts`
**Changes**: `usesPerDay?: number` zum ClassAbility Interface hinzufügen

#### [x] 2. Tiefling racialAbilities mit usesPerDay

**File**: `src/lib/rules/races.ts`
**Changes**: "Dunkelheit 1x/Tag" Eintrag bekommt `usesPerDay: 1`

#### [x] 3. i18n Keys für Rassenwechsel

**Files**: `messages/de.json`, `messages/en.json`
**Changes**: Keys für Confirm-Dialog + Fähigkeiten-Panel

#### [x] 4. Race Dropdown + Attribut-Adjustment-Logik

**File**: `src/components/character-sheet/character-sheet.tsx`
**Changes**:

- Race Badge → `<select>` für Owner (analog Alignment)
- `handleRaceChange(newRaceId)`: Confirm-Dialog → alte Adjustments rückgängig → neue anwenden → `update("race_id", newRaceId)` + Attribute updaten
- Neue Hilfsfunktion: `applyRaceChange(character, oldRaceId, newRaceId)` → berechnet neue Attributwerte

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — keine Type-Errors
- [ ] `npx vitest run` — alle Tests grün
- [ ] `npm run format` — formatiert

#### Manual Verification:

- [ ] Rasse im Character Sheet als Dropdown wählbar
- [ ] Confirm-Dialog erscheint mit Warnung vor Attribut-Änderung
- [ ] Attribute werden korrekt angepasst (z.B. Mensch→Tiefling: INT+1, CHA-1)
- [ ] Nach Reload sind neue Rasse + Attribute persistent

---

## Phase 2: Fähigkeiten-Panel im Play Mode

### Overview

Neues Panel "Fähigkeiten" im Play Mode. Zeigt Rassenfähigkeiten + Priesthood Granted Powers. Fähigkeiten mit `usesPerDay` haben "Nutzen"-Button mit lokalem Zähler (Reset bei Rasten).

### Changes Required:

#### [x] 5. PlayAbilitiesPanel Komponente

**File**: `src/components/play-mode/play-abilities-panel.tsx` (NEU)
**Changes**: Neue Komponente die:

- Rassenfähigkeiten aus `RACES[race_id].racialAbilities` lädt
- Granted Powers aus `getActivePowers(priesthoodId, level)` lädt
- Fähigkeiten mit `usesPerDay` haben "Nutzen" Button + lokalen Counter
- "Rasten" setzt Counter zurück (onRest Callback)
- Aufklappbare Details pro Fähigkeit

#### [x] 6. Play Mode Integration

**File**: `src/components/play-mode/play-mode.tsx`
**Changes**:

- `PanelId` um `"abilities"` erweitern
- Import PlayAbilitiesPanel
- Sichtbarkeitslogik: immer sichtbar wenn Rassenfähigkeiten oder Granted Powers vorhanden
- Desktop + Mobile Rendering (wie Turn Undead Panel)
- handleRest muss auch die Abilities zurücksetzen

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — keine Type-Errors
- [ ] `npx vitest run` — alle Tests grün
- [ ] `npm run format` — formatiert

#### Manual Verification:

- [ ] Panel "Fähigkeiten" im Play Mode sichtbar
- [ ] Rassenfähigkeiten korrekt angezeigt (Tiefling: 6 Fähigkeiten)
- [ ] "Dunkelheit 1x/Tag" hat Nutzen-Button, Zähler geht auf 1/1
- [ ] Rasten setzt Zähler zurück
- [ ] Priesthood Granted Powers werden angezeigt (z.B. War-Priester: Berserkerrausch)

---

## Testing Strategy

### Unit Tests:

- `ClassAbility` Interface akzeptiert `usesPerDay`
- Tiefling `racialAbilities` enthält Dunkelheit mit `usesPerDay: 1`
- Attribut-Adjustment-Berechnung: Mensch→Tiefling, Tiefling→Mensch, Elf→Tiefling

### Manual Testing:

1. Charakter "Pater Malachar" öffnen → Rasse auf Tiefling ändern → Attribut-Warnung prüfen
2. Play Mode öffnen → Fähigkeiten-Panel sichtbar → Dunkelheit nutzen → Rasten → Reset
3. Magier ohne Rassenfähigkeiten → Panel nur wenn nötig sichtbar

## References

- Research: `docs/agents/research/2026-03-31-race-change-and-racial-abilities-play.md`
- Alignment Dropdown Pattern: `character-sheet.tsx:544-557`
- Turn Undead Panel Pattern: `play-turn-undead-panel.tsx`
- Play Mode Panel Integration: `play-mode.tsx:529-551`
