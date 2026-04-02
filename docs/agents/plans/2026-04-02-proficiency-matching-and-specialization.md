---
date: "2026-04-02T20:22:25.121865+00:00"
git_commit: bebe32ad224f79fe4f427de90f6f661e81e22d9a
branch: fix/katrina-zweihander-specialization
topic: "Proficiency-Matching-Bug & Spezialisierung für alle Klassen"
tags: [plan, proficiency, specialization, combat, bugfix]
status: draft
---

# Proficiency-Matching-Bug & Spezialisierung für alle Klassen

## Overview

Zwei Änderungen: (1) Bugfix für bilinguales Proficiency-Matching — Waffenfertigkeiten werden je nach Locale als DE oder EN gespeichert, aber nur gegen den deutschen Namen gematcht. (2) Spezialisierung für alle Klassen freischalten (Hausregel + Skills & Powers), mit Warnung bei Nicht-Kämpfern.

## Current State Analysis

### Bug: Proficiency-Matching

- `character_weapon_proficiencies.weapon_name` ist ein Plain-Text-Feld (kein FK)
- Beim Hinzufügen wird der **lokalisierte** Name gespeichert (`localized(weapon.name, weapon.name_en, locale)`)
- Beim Matching wird nur gegen `weapon.name` (immer Deutsch) verglichen
- Ergebnis: EN-gespeicherte Proficiencies matchen nie → falscher Malus

### Feature: Spezialisierung

- `canSpecialize()` gibt nur für `classId === "fighter"` `true` zurück
- Checkbox ist für alle anderen Klassen versteckt
- Kein Character Points / Skills & Powers System vorhanden
- Bestehender `weapon_slots_adj` Mechanismus kann extra Slot-Kosten abdecken

## Desired End State

1. Proficiency-Matching funktioniert unabhängig von der Sprache — sowohl DE als auch EN gespeicherte Namen matchen korrekt
2. Spezialisierung ist für alle Klassen verfügbar, mit einer Warnung bei Nicht-Kämpfern (analog zur Hausregel "nie blockieren, nur warnen")
3. Bestehende Tests laufen weiterhin, neue Tests decken bilinguale Matching-Fälle ab

## What We're NOT Doing

- Kein Character Points / Skills & Powers System implementieren
- Keine Migration der bestehenden `weapon_name` Daten (beides DE und EN soll funktionieren)
- Keine Änderung am `getAttacksPerRound` — Spezialisierungs-Bonus auf Angriffe/Runde bleibt nur für Warriors

## Implementation Approach

**Proficiency-Matching:** Die `profMap` im Combat Panel und die Matching-Funktionen im Equipment Tab so erweitern, dass sie gegen **beide** Namensfelder (`weapon.name` + `weapon.name_en`) prüfen. Da die Waffen-Objekte beide Felder haben, können wir beim Lookup beide Keys registrieren.

**Spezialisierung:** `canSpecialize()` gibt jetzt immer `true` zurück. Neue Funktion `isStandardSpecialization(classId)` für die Warnung. UI zeigt Checkbox immer, mit amber Hinweis für Nicht-Kämpfer.

## Architecture and Code Reuse

Betroffene Dateien:

```
src/lib/rules/proficiencies.ts          # canSpecialize → immer true, neue Warn-Funktion
src/lib/rules/proficiencies.test.ts     # Tests für canSpecialize + neue Funktion (NEU falls nötig)
src/components/play-mode/play-combat-panel.tsx  # profMap bilingual
src/components/character-sheet/tab-equipment.tsx # Matching bilingual
src/components/character-sheet/tab-proficiencies.tsx # Spezialisierung für alle + Warnung
messages/de.json                        # i18n Key für Warnung
messages/en.json                        # i18n Key für Warnung
```

## Phase 1: Proficiency-Matching Bugfix

### Overview

Matching-Logik so ändern, dass sowohl DE als auch EN Waffennamen erkannt werden.

### Changes Required:

#### [x] 1. Play Combat Panel — bilinguales profMap

**File**: `src/components/play-mode/play-combat-panel.tsx`
**Changes**: profMap gegen beide Namensfelder matchen

Statt nur `weapon.name.toLowerCase()` als Lookup-Key zu verwenden, prüfen wir beide:

```typescript
// Zeile 170: Matching erweitern
const prof =
  profMap.get(weapon.name.toLowerCase()) ?? profMap.get(weapon.name_en?.toLowerCase() ?? "");
```

#### [x] 2. Equipment Tab — bilinguales Matching

**File**: `src/components/character-sheet/tab-equipment.tsx`
**Changes**: `getWeaponProficiencyPenalty` und `getWeaponAttacksPerRound` gegen beide Namen matchen

```typescript
// getWeaponProficiencyPenalty: weaponName UND weaponNameEn prüfen
function getWeaponProficiencyPenalty(weaponName: string, weaponNameEn: string | null): number {
  const isProficient = weaponProficiencies.some((wp) => {
    const stored = wp.weapon_name.toLowerCase();
    return (
      stored === weaponName.toLowerCase() || (weaponNameEn && stored === weaponNameEn.toLowerCase())
    );
  });
  if (isProficient) return 0;
  return getNonproficiencyPenalty(primaryClassGroup);
}

// getWeaponAttacksPerRound: analog
function getWeaponAttacksPerRound(weaponName: string, weaponNameEn: string | null): string {
  const isSpecialized = weaponProficiencies.some((wp) => {
    const stored = wp.weapon_name.toLowerCase();
    return (
      (stored === weaponName.toLowerCase() ||
        (weaponNameEn && stored === weaponNameEn.toLowerCase())) &&
      wp.specialization
    );
  });
  return getAttacksPerRound(primaryClassGroup, primaryLevel, isSpecialized);
}

// Aufrufe anpassen: weapon.name_en mitgeben
const penalty = getWeaponProficiencyPenalty(weapon.name, weapon.name_en);
```

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — keine TypeScript-Fehler
- [ ] `npm test` — alle Tests grün
- [ ] `npm run lint` — keine neuen Fehler

---

## Phase 2: Spezialisierung für alle Klassen

### Overview

`canSpecialize()` für alle Klassen öffnen, UI-Warnung für Nicht-Kämpfer hinzufügen.

### Changes Required:

#### [x] 1. Rules Engine — canSpecialize öffnen

**File**: `src/lib/rules/proficiencies.ts`
**Changes**: `canSpecialize()` gibt immer `true` zurück. Neue Funktion für die Warnung.

```typescript
export function canSpecialize(_classId: ClassId): boolean {
  return true;
}

/** Standard-PHB-Spezialisierung ist nur für Fighter. Gibt true zurück wenn Warnung angezeigt werden soll. */
export function isNonStandardSpecialization(classId: ClassId): boolean {
  return classId !== "fighter";
}
```

#### [x] 2. Proficiency Tab — Warnung für Nicht-Kämpfer

**File**: `src/components/character-sheet/tab-proficiencies.tsx`
**Changes**: Spezialisierungs-Checkbox immer anzeigen, mit amber Warnung bei Nicht-Kämpfern.

```typescript
import { canSpecialize, isNonStandardSpecialization } from "@/lib/rules/proficiencies";

// showSpecialization ist jetzt immer true (canSpecialize gibt true zurück)
const showSpecialization = canSpecialize(classId as ClassId);
const showSpecWarning = isNonStandardSpecialization(classId as ClassId);

// Bei Checkbox: amber Warnung wenn showSpecWarning
{showSpecWarning && wp.specialization && (
  <span className="text-xs text-amber-400">{t("specNonFighterWarning")}</span>
)}
```

#### [x] 3. i18n Keys

**Files**: `messages/de.json`, `messages/en.json`

```json
// de.json (im "sheet" Namespace)
"specNonFighterWarning": "Spezialisierung normalerweise nur für Kämpfer (S&P)"

// en.json
"specNonFighterWarning": "Specialization normally for Fighters only (S&P)"
```

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — keine TypeScript-Fehler
- [ ] `npm test` — alle Tests grün
- [ ] `npm run lint` — keine neuen Fehler
- [ ] `npm run format` — Code formatiert

#### Manual Verification:

- [ ] Lady Katrina: Zweihänder zeigt keinen Malus mehr im Play Mode
- [ ] Lady Katrina: Spezialisierung kann gesetzt werden (Checkbox sichtbar)
- [ ] Nicht-Kämpfer: Amber-Warnung bei aktiver Spezialisierung
- [ ] Kämpfer (Fighter): Keine Warnung, Verhalten unverändert

---

## Testing Strategy

### Unit Tests:

- `canSpecialize()` gibt `true` für alle Klassen zurück
- `isNonStandardSpecialization()` gibt `true` für Nicht-Kämpfer, `false` für Fighter

### Manual Testing Steps:

1. Lady Katrina im Play Mode öffnen → Zweihänder ohne Malus
2. Lady Katrina Proficiency Tab → Spezialisierung-Checkbox sichtbar
3. Spezialisierung aktivieren → Amber-Warnung erscheint
4. Fighter-Charakter prüfen → Spezialisierung ohne Warnung

## References

- Research: `docs/agents/research/2026-04-02-zweihander-proficiency-and-specialization.md`
- Hausregel: "Keine Restriktionen — nie blockieren, nur warnen" (CLAUDE.md)
