---
date: 2026-04-03T18:00:00+02:00
git_commit: eb91cf2
branch: perf/performance-audit
topic: "Full Performance Audit"
tags: [research, performance, frontend, backend, database]
status: complete
---

# Performance Audit — Chaos Forge

## Summary

Full-stack Performance-Audit der gesamten Chaos Forge Applikation. Drei parallele Analysen: Pages/Data Fetching, Heavy Components, DB/Rules Engine.

**Gesamtergebnis: 31 Findings**

| Severity   | Count |
| ---------- | ----- |
| Critical   | 7     |
| Major      | 14    |
| Minor      | 9     |
| Suggestion | 1     |

## Top 5 Prioritaeten (nach Impact)

### 1. Query-Waterfall auf Character Pages (Critical)

**Dateien:** `manage/page.tsx`, `play/page.tsx`, `print/page.tsx`

Die drei Hauptseiten fuehren 8-15 sequentielle DB-Queries aus die vollstaendig unabhaengig sind. Mit Supabase-Latenz (50-150ms/Query) kostet das 550ms-2s reine Wartezeit.

**Fix:** `Promise.all` — Character erst fuer `notFound()`-Guard, dann alle anderen parallel.

**Impact:** High — 50-70% Reduktion der Seitenladezeit

### 2. Fehlende DB-Indizes auf FK-Spalten (Critical)

**Datei:** Migrations

Keine Indizes auf `character_id` in Junction-Tables (`character_equipment`, `character_spells`, `character_weapon_proficiencies`, etc.). Jeder Join/WHERE auf `character_id` macht einen Full Table Scan.

**Fix:** Eine Migration mit CREATE INDEX fuer alle FK-Spalten.

**Impact:** High — betrifft jede einzelne Seite

### 3. `fetchAvailablePriestSpells` holt 3200 Zeilen + filtert in JS (Critical)

**Datei:** `src/lib/supabase/priest-spells.ts`

Paginiert durch die gesamte Spell-Tabelle (3200+ Zeilen in 3-4 Requests), holt `SELECT *` (inkl. Beschreibungen), filtert dann in JavaScript nach Sphaeren. Laeuft auch fuer Nicht-Priester-Charaktere.

**Fix:**

- Sphere+Level-Filter nach Supabase pushen
- `isPriestCaster()` Guard vor dem Aufruf
- Nur benoetigte Felder selektieren

**Impact:** High — eliminiert 3-4 Netzwerk-Roundtrips + MB an Daten

### 4. `react-markdown` Top-Level Import (Critical — Bundle Size)

**Datei:** `src/components/play-mode/play-spellbook-panel.tsx`

~45kB gzipped, geladen fuer jeden Play-Mode-Besuch, auch wenn nie eine Zauberbeschreibung geoeffnet wird.

**Fix:** `next/dynamic` mit `ssr: false`

**Impact:** High — 45kB weniger Initial-Bundle

### 5. 6 Ability-Modifier-Berechnungen ohne useMemo (Major)

**Datei:** `src/components/character-sheet/character-sheet.tsx`

Sechs `getXxxModifiers()` Aufrufe laufen bei jedem Render (jeder Tastendruck, jeder Dialog-Toggle). `play-mode.tsx` macht es bereits korrekt mit `useMemo`.

**Fix:** `useMemo` mit engen Dependency-Arrays

**Impact:** High — CharacterSheet ist die meistgerenderte Komponente

## Alle Findings nach Kategorie

### A. Data Fetching & Waterfall

| #   | Severity   | Datei                         | Problem                                                    |
| --- | ---------- | ----------------------------- | ---------------------------------------------------------- |
| A1  | Critical   | manage/page.tsx               | 13 sequentielle Queries → Promise.all                      |
| A2  | Critical   | play/page.tsx                 | 8 sequentielle Queries → Promise.all                       |
| A3  | Critical   | print/page.tsx                | 8 sequentielle Queries → Promise.all                       |
| A4  | Major      | play/page.tsx, print/page.tsx | fetchAvailablePriestSpells laeuft auch fuer Nicht-Priester |
| A5  | Major      | characters/page.tsx           | 2 unabhaengige Queries sequentiell                         |
| A6  | Major      | sessions/page.tsx             | 3 unabhaengige Queries sequentiell                         |
| A7  | Major      | manage/page.tsx               | allWeapons/allArmor SELECT \* statt spezifische Felder     |
| A8  | Major      | manage/page.tsx               | allNWPs/allGeneralItems eager statt lazy (Dialog-Daten)    |
| A9  | Major      | characters/page.tsx           | character_classes ohne character_id Filter                 |
| A10 | Major      | dashboard/page.tsx            | characters SELECT \* (74 Felder) statt ~13 fuer Cards      |
| A11 | Major      | sessions/page.tsx             | sessions SELECT \* ohne Pagination/Limit                   |
| A12 | Minor      | dashboard/page.tsx            | chronicle_quotes SELECT \* fuer random Pick                |
| A13 | Minor      | dashboard/page.tsx            | xp_history ohne Limit/Aggregation                          |
| A14 | Suggestion | layout.tsx                    | Volle i18n-Bundle an Client (next-intl Limitation)         |

### B. Database & Indizes

| #   | Severity | Datei            | Problem                                                   |
| --- | -------- | ---------------- | --------------------------------------------------------- |
| B1  | Critical | Migrations       | Keine Indizes auf character_id FK-Spalten                 |
| B2  | Major    | Migrations       | Kein Index auf spells(spell_type, sphere, level)          |
| B3  | Critical | priest-spells.ts | Volle 3200-Zeilen Tabelle in 3-4 paginierten Requests     |
| B4  | Major    | priest-spells.ts | SELECT \* holt Beschreibungen obwohl nur Metadaten noetig |
| B5  | Minor    | Migrations       | RLS Policies inkonsistent mit is_character_owner()        |

### C. React Rendering

| #   | Severity | Datei                 | Problem                                                 |
| --- | -------- | --------------------- | ------------------------------------------------------- |
| C1  | Major    | character-sheet.tsx   | 6 Ability-Modifier ohne useMemo                         |
| C2  | Major    | character-sheet.tsx   | update()/updateClassField() ohne useCallback            |
| C3  | Major    | tab-equipment.tsx     | filteredWeapons/filteredArmor ohne useMemo (500+ Items) |
| C4  | Minor    | tab-equipment.tsx     | activeClasses/classEntries doppelt berechnet            |
| C5  | Minor    | tab-equipment.tsx     | Inline IIFE fuer multiclass armor warnings              |
| C6  | Minor    | character-sheet.tsx   | Inline purse-Objekt fuer PayDialog                      |
| C7  | Minor    | play-mode.tsx         | overclockState Loop ohne useMemo                        |
| C8  | Minor    | play-combat-panel.tsx | renderWeaponCard als innere Funktion                    |
| C9  | Minor    | print-sheet.tsx       | spellsByLevel/preparedSpells ohne useMemo               |

### D. Bundle Size & Code Splitting

| #   | Severity | Datei                    | Problem                                                       |
| --- | -------- | ------------------------ | ------------------------------------------------------------- |
| D1  | Critical | play-spellbook-panel.tsx | react-markdown Top-Level Import (~45kB)                       |
| D2  | Major    | print-sheet.tsx          | "use client" auf gesamtem PrintSheet (nur Toolbar braucht es) |

### E. Algorithmen

| #   | Severity | Datei         | Problem                                            |
| --- | -------- | ------------- | -------------------------------------------------- |
| E1  | Major    | epic-items.ts | O(n²) Array.includes Dedup in getCumulativeEffects |
| E2  | Minor    | epic-items.ts | getAutoUnlockedLevel 3x pro Item aufgerufen        |
| E3  | Minor    | experience.ts | JSON.stringify fuer Saving Throws Vergleich        |

### F. Write Performance

| #   | Severity | Datei             | Problem                                          |
| --- | -------- | ----------------- | ------------------------------------------------ |
| F1  | Major    | xp-add-dialog.tsx | Sequentielle DB-Writes in for-Loop → Promise.all |

## Empfohlene Reihenfolge

**Quick Wins (1-2 Zeilen pro Fix):**

1. react-markdown dynamic import (D1)
2. isPriestCaster Guard (A4)
3. xp-add-dialog Promise.all (F1)

**Mittlerer Aufwand:** 4. Promise.all auf manage/play/print Pages (A1-A3) 5. useMemo fuer ability modifiers (C1) 6. useMemo fuer filteredWeapons/Armor (C3) 7. Felder-Projektion statt SELECT \* (A7, A10, A11)

**Migration:** 8. FK-Indizes Migration (B1) 9. Spell-Index (B2) 10. priest-spells Server-Side Filtering (B3)

**Refactoring:** 11. PrintSheet Server/Client Split (D2) 12. Lazy-Load allNWPs/allGeneralItems (A8)
