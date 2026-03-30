# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projektübersicht

**Chaos Forge** ist ein webbasierter Charakter-Manager und Session-Tracker für AD&D 2nd Edition, gebaut für die private Spielgruppe "Chaos RPG" (max. 10 Nutzer, sehr geringe parallele Nutzung).

**Oberstes Architekturziel:** Komplett im Free-Tier betreibbar (Hosting, Datenbank, Auth).

## Tech-Stack

- **Framework:** Next.js 16 (App Router) mit TypeScript
- **Datenbank & Auth:** Supabase (PostgreSQL + Row Level Security)
- **Styling:** Tailwind CSS v4 + shadcn/ui + Glassmorphism Design-System
- **i18n:** next-intl (Cookie-basiert, DE/EN) + `localized()` Utility für DB-Daten
- **Unit-/Integrationstests:** Vitest (755+ Tests)
- **E2E-Tests:** Playwright (Chromium, POM-Pattern, getByTestId, axe-core A11y)
- **Linting/Formatting:** ESLint (next config) + Prettier
- **Hosting:** Vercel (Free-Tier)
- **AI:** Anthropic Claude API (Character Import, Session Summaries)
- **Export:** `docx` + `file-saver` für Word-Export
- **UI-Theme:** Glassmorphism Dark Fantasy (Cinzel Headings, Geist Sans Body, klassenbasierte Akzentfarben, 3D-Tilt-Cards, Stagger-Reveal)
- **Navigation:** Desktop Left-Sidebar (Icons + Tooltips) + Mobile Bottom-Nav + FAB

## Befehle

| Befehl                 | Beschreibung                       |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Dev-Server starten (Turbopack)     |
| `npm run build`        | Production Build                   |
| `npm run lint`         | ESLint ausführen                   |
| `npm run format`       | Prettier: alle Dateien formatieren |
| `npm run format:check` | Prettier: Formatierung prüfen      |
| `npm test`             | Unit-Tests einmalig ausführen      |
| `npm run test:watch`   | Unit-Tests im Watch-Modus          |
| `npm run test:e2e`     | Playwright E2E-Tests ausführen     |
| `npm run test:e2e:ui`  | Playwright im UI-Modus             |

## Projektstruktur

```
src/
  app/                    # Next.js App Router (Pages, Layouts)
    characters/[id]/      # Charakterbogen, Druckansicht, Zauberbuch, Play Mode, Epische Ausrüstung
    characters/new/       # Charakter-Erstellung (Auswahl: Wizard oder Import)
    characters/import/    # OCR/Vision-Import (Claude API)
    dashboard/            # Dashboard mit 8 Widgets (Zitat, NPCs, XP, Tags, Party, etc.)
    sessions/             # Chronik des Chaos (Session-Log + Sprachnotizen)
  components/
    character-sheet/      # Tabs: Stats, Combat, Notes, Equipment, Spells, Thief Skills, Proficiencies
    character-card.tsx    # Glassmorphism Card (Avatar-Breakout, HP-Bar, Level-Badge, Alignment, Glow)
    character-mode-nav.tsx # Mode-Navigation (Verwalten/Spielen/Episch)
    glass-card.tsx        # Wiederverwendbare Glass-Surface-Komponente
    hp-bar.tsx            # Leuchtende HP-Fortschrittsleiste mit Klassen-Gradient
    level-badge.tsx       # Hexagonales Level-Badge (CSS clip-path)
    app-sidebar.tsx       # Desktop Left-Sidebar (Icons, Tooltips, Logout)
    app-nav.tsx           # Mobile Bottom-Nav + More-Menu
    epic-equipment/       # Epische Ausrüstung (Schadensstufen-Cards, Simple Items, Blade System)
    play-mode/            # Play Mode (Kampf, Zauber, Checks, Wahrnehmung, Inventar, Geldbörse, Gestaltwandlung)
    spellbook/            # Standalone Spellbook-Seite (Suche, Filter, Prepare, Learn, Source-Book-Filter)
    print-sheet/          # Druckansicht + Word-Export (.docx), Customization Panel
    session/              # Session-Einträge, Sprachnotizen (MediaRecorder)
    wizard/               # Character Wizard (7 Steps: Basics, Abilities, Race, Class, Kit, Combat, Summary)
    ui/                   # shadcn/ui Komponenten
  lib/
    rules/                # AD&D 2e Regelwerk-Engine (reine TypeScript-Logik)
      spec/               # Regelwerk-Spezifikation + Coverage-Meta-Test
      abilities.ts        # Attribut-Modifikator-Tabellen (STR 3-25 inkl. 18/xx, Sub-Stats)
      alignment.ts        # 9 Gesinnungen (DE/EN), Klassen-Restriktionen
      classes.ts          # 16 Klassen-Definitionen, Attribut-Anforderungen, Fähigkeiten
      combat.ts           # THAC0, Angriffswürfe, Rettungswürfe, Angriffe/Runde (inkl. Spezialisierung)
      epic-items.ts       # Epische Ausrüstung: Stat-Overrides, Thief-Penalties, Spell Failure, Perception, Shapeshift, Auto-Unlock
      equipment.ts        # RK-Berechnung, Belastung, Bewegungsrate
      experience.ts       # XP-Tabellen, Stufen-Berechnung
      hitpoints.ts        # HP-Berechnung, CON-Bonus-Cap (Warrior +4, andere +2)
      kits.ts             # 20 Kit-Definitionen (Fighter, Thief, Wizard, Priest, Ranger, Bard)
      magic.ts            # Magie-Schulen, Priester-Sphären, Spezialisten
      multiclass.ts       # THAC0/Saves-Optimierung, Regeltreue-Check, HP-Divisor
      proficiencies.ts    # Waffen-/NWP-Slots, Spezialisierung, Abzüge
      races.ts            # 7 Rassen, Attribut-Adj., Level-Limits, Infravision
      spellslots.ts       # Wizard Slots, Priest Slots/Bonus, Spell Points, canLearnSpell
      thief.ts            # Diebesfähigkeiten, Rassen-Adj., Backstab-Multiplikator
      types.ts            # Zentrale Typdefinitionen
      index.ts            # Barrel-Export
    supabase/             # Supabase Client-Helfer (client.ts, server.ts, middleware.ts)
    utils/                # Hilfsfunktionen
      class-colors.ts     # Klassengruppen-Akzentfarben (warrior/priest/rogue/wizard)
      localize.ts         # localized(de, en, locale) — Locale-aware Text-Auswahl
      source-books.ts     # Quellenbuch-Abkürzungen (PHB, WSC1-4, PSC1-3, ToM, PO:S&M, etc.)
      docx-export.ts      # Word-Export Generator (1:1 Print-Layout)
      audio-recorder.ts   # MediaRecorder Wrapper (Safari-kompatibel)
      units.ts            # lbsToKg(), feetToMeters(), convertImperialText()
      spell-display.ts    # spellRange(), spellArea(), spellDescription() — metrische Konvertierung
    hooks/                # Custom React Hooks
      use-print-preferences.ts # Print-Layout-Preferences pro Charakter (localStorage)
    print-config.ts       # Print-Section-IDs, Preferences-Typen, Persistence
  middleware.ts           # Next.js Middleware (Supabase Session-Refresh)
  test/                   # Vitest Setup, Smoke- & Regressionstests
e2e/                      # Playwright E2E-Tests
  responsive-a11y.spec.ts # Mobile Responsive, Desktop Sidebar, FAB + WCAG 2 AA (axe-core)
  pages/                  # Page Object Models (character-sheet, spellbook, login)
  helpers/                # Auth-Helper (Cookie-basierter Test-Login)
messages/                 # i18n-Dateien (de.json, en.json)
supabase/
  migrations/             # 59 SQL-Migrationen (Schema + Seed-Daten + Spell Compendium + Epic Items)
ressources/
  books/                  # OCR-Texte der AD&D 2e Regelbücher (metrisch konvertiert)
```

## Regelwerk-Engine (`src/lib/rules/`)

Die AD&D-Regeln sind als **reine TypeScript-Funktionen** implementiert (kein DB-Zugriff, kein Framework). Stammdaten (Rassen, Klassen, Waffen, Rüstungen, Zauber) liegen zusätzlich in Supabase.

### Kernfunktionen

**Attribute (mit Player's Option Sub-Stats):**

- `getStrengthModifiers(str, exceptional?, muscle?, stamina?)` — STR 3-25, inkl. 18/xx Ausnahmestärke
- `getDexterityModifiers(dex, aim?, balance?)` / `getConstitutionModifiers(con, health?, fitness?)`
- `getIntelligenceModifiers(int, knowledge?, reason?)` / `getWisdomModifiers(wis, intuition?, willpower?)`
- `getCharismaModifiers(cha, leadership?, appearance?)`

**Klassen, Rassen & Kits:**

- `getClass(classId)` / `getAllClasses()` / `getClassGroup(classId)` / `meetsAbilityRequirements(classId, abilities)`
- `getRace(raceId)` / `getAllRaces()` / `canPlayClass(raceId, classId)` / `getLevelLimit(raceId, classId)`
- `getKit(kitId)` / `getKitsForClass(classId)` / `getEffectiveHitDie(baseHitDie, kit)`

**Kampf:**

- `getThac0(classGroup, level)` / `getAttackRoll(thac0, targetAC)` / `getSavingThrows(classGroup, level)`
- `getAttacksPerRound(classGroup, level, isSpecialized?)` — Specialist: 3/2 ab L1
- `getAdjustedWeaponThac0(base, strHit, dexMissile, weaponType, profPenalty)` / `formatDamageWithBonus(base, strDmg)`

**Magie:**

- `getWizardSpellSlots(level)` / `getPriestSpellSlots(level)` / `getPriestBonusSlots(wisScore)`
- `getPriestSpellPoints(level)` / `getPriestBonusSpellPoints(wis)` / `getPriestSpellCost(spellLevel)`
- `canLearnSpell(classId, school?, sphere?, level, intScore)` / `getOppositionSchools(classId)` / `hasSphereAccess(classId, sphere, level)`

**Multiclass:**

- `getMulticlassThac0(classes)` / `getMulticlassSaves(classes)` / `getMulticlassHpDivisor(count)` / `isRuleCompliantMulticlass(raceId, classIds)` / `multiclassHasExceptionalStr(classIds)`

**Fertigkeiten & Ausrüstung:**

- `getWeaponProficiencySlots(classGroup, level)` / `getNonweaponProficiencySlots(classGroup, level)` / `canSpecialize(classId)`
- `calculateAC(armorAC, shield, dexAdj)` / `calculateEncumbrance(weight, strAllow)` / `getMovementRate(base, encumbrance)`

**Dieb:**

- `getBaseThiefSkills(level)` / `getRacialThiefAdjustments(raceId)` / `getBackstabMultiplier(level)` / `hasThiefSkills(classIds)`

**Epische Ausrüstung:**

- `getEpicEffects(items)` — Kombinierte Effekte aller angelegten Epic Items (Stat-Overrides, Thief-Penalties, Spell Failure, Wild Magic, Perception)
- `scaleSubStat(baseStat, baseSub, overrideStat)` — Sub-Stats proportional skalieren bei Stat-Override
- `applyThiefPenalty(baseValue, effects)` — Thief-Skill-Penalty anwenden
- `getConBonusCap(classGroup)` — CON-HP-Bonus-Cap (+2 Non-Warrior, +4 Warrior)

**Sonstiges:**

- `getAlignmentLabel(id, locale?)` / `getAllowedAlignments(classId)` / `ALL_ALIGNMENTS`
- `getXpForNextLevel(classId, level)` / `getXpThreshold(classId, level)`

### Locale-System für DB-Daten

DB-Daten (Waffen, Rüstungen, Zauber, NWPs, Rassen, Klassen) haben `name` (DE) + `name_en` (EN) Felder. In Komponenten immer `localized()` nutzen:

```typescript
import { localized } from "@/lib/utils/localize";
import { useLocale } from "next-intl";

const locale = useLocale();
// Statt: race.name
// Richtig: localized(race.name, race.name_en, locale)
```

### Zauber-Datenbank

Die DB enthält 3.200+ Zauber aus allen AD&D 2e Quellenbüchern:

- **374 PHB-Zauber** mit deutschen Namen (`name`) und englischen Namen (`name_en`)
- **2.857 weitere Zauber** aus Wizard Spell Compendium Vol 1-4, Priest Spell Compendium Vol 1-3, Tome of Magic, Player's Option: Spells & Magic — bei diesen sind `name` und `name_en` identisch (englisch)
- **Source Book Tracking:** `source_book` Feld zeigt die Quelle, `getBookAbbreviation()` für Kurzform in der UI
- **Bilinguale Suche:** Spellbook und Learn-Dialog durchsuchen immer beide Namensfelder (DE + EN)
- **Source Book Filter:** Dropdown zum Filtern nach Quellenbuch im Learn-Dialog

### Regelwerk-Spezifikation (`src/lib/rules/spec/`)

`character-creation-rules.ts` katalogisiert alle PHB-Regeln zur Charaktererstellung mit eindeutigen IDs. Bei neuen Regel-Implementierungen:

1. Regel in der Spec von `missing` auf `implemented` setzen
2. `implementationFiles` und `implementationFunctions` eintragen
3. `testFiles` und `scenarios` pflegen
4. `coverage.test.ts` verifiziert automatisch die Abdeckung

**Regel-ID-Schema:**

- `ABILITY-xxx` — Attribut-Tabellen und -Generierung
- `RACE-xxx` — Rassen-Definitionen und -Tabellen
- `CLASS-xxx` — Klassen, HP, Dual-Class
- `ALIGN-xxx` — Gesinnungs-Regeln
- `PROF-xxx` — Fertigkeiten
- `EQUIP-xxx` — Ausrüstung und Gold
- `MAGIC-xxx` — Magie-System
- `XP-xxx` — Erfahrungspunkte
- `COMBAT-xxx` — Kampfwerte
- `MULTI-xxx` — Multiclass-Regeln
- `THIEF-xxx` — Diebes-Fertigkeiten

## Design-System

### Glassmorphism

CSS-Klassen in `globals.css`:

- `.glass` — `backdrop-blur-xl`, transparenter Hintergrund
- `.glass-hover` — `translateY(-2px)` beim Hover
- `.glow-warrior/priest/rogue/wizard` — Klassenbasierte Akzentfarben (Border + Shadow)
- `.glow-neutral` — Gold-Glow für generische Karten
- `.hp-bar-warrior/priest/rogue/wizard` — Gradient-HP-Balken
- `.hex-badge` — Hexagonaler Clip-Path für Level-Badge

### Klassenfarben (`src/lib/utils/class-colors.ts`)

| Klassengruppe | Glow | Badge          | HP-Bar        |
| ------------- | ---- | -------------- | ------------- |
| Warrior       | Rot  | `bg-red-700`   | Rot-Gradient  |
| Priest        | Gold | `bg-amber-700` | Gold-Gradient |
| Rogue         | Blau | `bg-blue-700`  | Blau-Gradient |
| Wizard        | Teal | `bg-teal-700`  | Teal-Gradient |

## Hausregeln

Diese Abweichungen vom Standard-PHB gelten für die "Chaos RPG"-Gruppe:

- **Multiclass/Dualclass:** Alle Rassen dürfen ohne Einschränkungen Multi-/Dualclass wählen. Die Engine zeigt nur **Warnungen**, blockiert aber nie.
- **Metrisches System:** Die DB speichert imperiale Werte (lbs, ft), die UI zeigt metrisch (kg, m) via `lbsToKg()`/`feetToMeters()`.
- **Priester-Zauberpunkte:** Statt des Standard-Slot-Systems nutzen wir das Player's Option Spell Points System.
- **Keine Restriktionen:** Klassen-/Rassen-Kombinationen, NWP-Gruppen etc. werden nie blockiert — immer nur Warnhinweise.
- **Wahrnehmungswurf:** `floor((INT + WIS) / 2)` — Hausregel, angezeigt im Play Mode Checks-Panel.

## Supabase

- **Client-Helfer:** `src/lib/supabase/client.ts` (Browser), `server.ts` (Server Components), `middleware.ts` (Session-Refresh)
- **Env-Variablen:** `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (siehe `.env.local.example`)
- **RLS:** Alle Tabellen nutzen Row Level Security — SELECT für alle Authentifizierten, INSERT/UPDATE/DELETE nur für Owner
- **Storage:** `voice-notes` Bucket für Sprachnotizen, `avatars` für Character-Avatare
- **Migrationen:** 30 Migrationen unter `supabase/migrations/`, ausführen via `supabase db push`

## AD&D 2e Regelwerk-Spezifika

Das Datenmodell und die Regelwerk-Engine müssen folgende AD&D 2e Besonderheiten korrekt abbilden:

- **Attribute:** STR (inkl. 18/xx Ausnahmestärke für Krieger + Sub-Stats), DEX, CON, INT, WIS, CHA
- **Kampfsystem:** Absteigende Rüstungsklasse (RK/AC), ETW0 (THAC0), klassenspezifische Trefferwürfel, Rettungswürfe, Spezialisierung
- **Kits:** 20 Kits aus Complete Handbooks mit Hit-Die-Override und Abilities
- **Rassen & Klassen:** Inklusive Level-Caps pro Rasse/Klasse-Kombination
- **Magie:** Magier nutzen Schulen (inkl. Spezialisten), Priester nutzen Sphären (Haupt-/Nebenzugang)
- **Fertigkeiten:** Waffenfertigkeiten (inkl. Spezialisierung → Angriffe/Runde) und Allgemeine Fertigkeiten
- **Ausrüstung:** Gewicht/Belastung, Waffengeschwindigkeit, AC-Breakdown (Armor + Shield + DEX)
- **Source Books:** Jedes Item/Waffe/Zauber hat ein `source_book` Feld (PHB, AEG, ToM, etc.)

## Entwicklungs-Workflow (zwingend)

Für jedes neue Feature wird **immer ein neuer Branch** angelegt. Die Entwicklung durchläuft zwingend diese 4 Phasen in Reihenfolge:

### Phase 1: Requirements Engineering

Analysiere Anforderungen, sammle offene Fragen und Edge Cases, generiere Lösungsvorschläge mit Empfehlung. Betrachte auch immer die UI und UX in den Anforderungen! Versetze dich dazu in die Personas die die App nutzen werden. **Warte auf Freigabe durch den User, bevor Code geschrieben wird.**

### Phase 2: Implementierung

- Strikt nach **Test-Driven Development (TDD)** und **Clean Code**
- Tests gemäß Testpyramide: Unit > Integration > E2E
- Explorative Tests via `playwright-cli` durchführen; für jeden gefundenen Bug erst einen fehlschlagenden Test schreiben, dann beheben

### Phase 3: Code Review

Eigenen Code kritisch prüfen (Architektur, Lesbarkeit, Performance). Mängel beheben, bevor Phase 4 beginnt.

### Phase 4: Qualitätssicherung

Finaler explorativer Test mit etablierten Testing-Heuristiken und gezielten "Testing Touren".

## Roadmap-Überblick

1. **Projekt-Setup & Infrastruktur** — Repo, CI/CD, DB-Anbindung, Basis-Layout ✅
2. **AD&D Core-Regelwerk (Engine)** — Attribute, RK/THAC0, Magie, Seeding ✅
3. **Charakter-Management** — Charakterbogen, Erstellungs-Wizard, Avatar-Upload, Print-Layout, Kit-System ✅
4. **Die Chronik des Chaos (Session Log)** — Timeline, Tagging, Smart Summaries, Sprachnotizen ✅
5. **Advanced Features** — OCR/Vision-Import, Word-Export, Glassmorphism UI, Source Books ✅
6. **Play Mode & Epische Ausrüstung** — Session-optimierte Ansicht, Epic Items mit Effekten, Mode-Navigation ✅
7. **Dashboard Ausbau** — 8 Widgets (Zitat, NPCs, XP, Tags, Party, Session-Stats, Throwback) ✅
8. **Print/Export Customization** — Abschnitte ein-/ausblendbar, Reihenfolge änderbar, alle PHB-Modifier ✅
9. **Nächste Schritte** — DM-Dashboard, Kampagnen-Verwaltung, weitere Kits aus den Complete Handbooks
