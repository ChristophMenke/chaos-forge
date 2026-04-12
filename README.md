# Chaos Forge

Ein webbasierter Charakter-Manager und Session-Tracker für Advanced Dungeons & Dragons (AD&D) 2nd Edition, maßgeschneidert für die Rollenspielgruppe "Chaos RPG".

## Über das Projekt

Chaos Forge ersetzt umständliche Offline-Editoren aus den 90er Jahren durch eine moderne, mobile-freundliche Web-App. Der Fokus liegt auf Usability, strikter Einhaltung der komplexen 2e-Regeln, einer optimierten Druckausgabe für das Spielen am Tisch und einem innovativen Session-Log ("Die Chronik des Chaos").

## Features

- **Charakterbogen** — Vollständige Abbildung eines AD&D 2e Charakterbogens mit Attributen, Kampfwerten, Ausrüstung, Zaubern, Fertigkeiten und Diebesfähigkeiten
- **Multiclass & Dualclass** — Mehrklassen-System mit Junction-Table, THAC0/Rettungswurf-Optimierung
- **Kit-System** — 20 Kits aus den Complete Handbooks (Barbarian, Cavalier, Assassin, Witch etc.) mit Hit-Die-Override und Kit-Abilities
- **Player's Option Sub-Stats** — Optionale Muscle/Stamina/Aim/Balance/Health/Fitness Sub-Scores für alle 6 Attribute
- **Waffen-Spezialisierung** — Specialist-Kämpfer erhalten 3/2 Angriffe/Runde ab Level 1
- **Zauberbuch** — Eigenständige Gameplay-Seite zum Verwalten, Vorbereiten und Lernen von Zaubern (Wizard Slots + Priest Spell Points)
- **Druckansicht + Word-Export** — Optimiertes Print-Layout für den Spieltisch, exportierbar als .docx. Abschnitte ein-/ausblendbar und in der Reihenfolge anpassbar
- **Glassmorphism UI** — Modernes "Epic Dark Mode" Design mit klassenbasierten Akzentfarben (Warrior=Rot, Priest=Gold, Rogue=Blau, Wizard=Teal)
- **App Shell** — Desktop Left-Sidebar (Icons + Tooltips) + Mobile Bottom-Nav mit FAB, 3D-Tilt-Cards, Stagger-Reveal-Animationen
- **Character Cards** — Avatar-Breakout, leuchtende HP-Bar mit Pulse bei <25%, hexagonales Level-Badge, dynamischer Glow, Alignment-Anzeige
- **Aktive/Inaktive Charaktere** — Archivierung mit einklappbarer Sektion
- **Character Import** — OCR/Vision-Import via Claude API (Foto oder PDF), Zauber-Erkennung, magische Items, editierbare Review-UI
- **Character Sharing** — Öffentliche/private Sichtbarkeit + gezieltes Teilen mit Mitspielern
- **Epische Ausrüstung** — Generisches System für character-gebundene Items mit Effekten (Stat-Overrides, Thief-Penalties, Spell Failure, Schadensstufen, Gestaltwandlung, Spezialangriffe, Spell-Like Abilities, Auto-Unlock nach Charakterstufe)
- **Party-Inventar** — Gemeinsame Gruppenkasse (5 Münztypen), Item-Pool, Loot-Verteilung an Charaktere, Audit-Log, Gold-Abzug (Ausgaben/Diebstahl)
- **Traits & Disadvantages** — Player's Option: Skills & Powers Traits (angeborene Fähigkeiten) und Disadvantages (Nachteile) mit CP-Kosten, editierbar im Character Sheet
- **Shield Proficiency** — P.O: Skills & Powers Table 51 AC-Bonus nach Schildtyp (Buckler +1, Small +2, Medium +3, Large +3)
- **Priester-System** — Sphären-basiertes Zaubersystem (Priester sehen automatisch alle Zauber ihrer Sphären), Gottheit + Priesthood-Auswahl, 20+ Priesterschaften mit Granted Powers, Turn Undead Panel, Quellenbuch-Filter (DM entscheidet welche Bücher)
- **9 Rassen** — Inkl. Tiefling (Planescape) und Kobold. Rasse im Character Sheet änderbar mit automatischer Attribut-Adjustment-Anpassung
- **Fähigkeiten-Panel** — Rassenfähigkeiten + Priesthood Granted Powers im Play Mode mit "Nutzen"-Button und usesPerDay-Tracking
- **Magische Items** — Ringe, Amulette, Umhänge etc. mit Stat-Effekten (STR, DEX, AC etc.). Magische Waffen mit +1 bis +5 Bonus und Mengenangabe
- **Play Mode** — Session-optimierte Ansicht mit Kampf, Zaubern, Fähigkeiten, Prüfungen, Wahrnehmungswurf (Hausregel), Inventar, Geldbörse, Untote vertreiben, Gestaltwandlung, Spezialangriffe, Schild an-/ablegen
- **Dashboard** — Gruppen-Übersicht mit 8 Widgets (Zitat des Tages, Party-Übersicht mit Avataren, XP-Ranking, Tag-Wolke, NPCs, Session-Stats, Throwback)
- **Session-Chronik** — Timeline mit Tags (NPCs, Orte, Items, Quests), KI-Zusammenfassungen, Sprachnotizen
- **Komplettes Zauber-Compendium** — 3.200+ Zauber aus allen AD&D 2e Quellenbüchern (Wizard Spell Compendium Vol 1-4, Priest Spell Compendium Vol 1-3, Tome of Magic, Player's Option)
- **Source Book Tracking** — Jedes Item/Waffe/Zauber zeigt seine Quelle (PHB, WSC1-4, PSC1-3, ToM, etc.) mit Filter-Funktion
- **i18n** — Vollständige Lokalisierung Deutsch/Englisch (Cookie-basiert via next-intl)
- **Bilinguale Suche** — Zauber können in Deutsch und Englisch gefunden werden, unabhängig von Locale
- **Fertigkeiten** — NWP-Beschreibungen (PHB Chapter 5) beim Anklicken, Click-to-expand im Character Sheet und Play Mode
- **Metrisches System** — Automatische Konvertierung von imperialen Einheiten (Fuß, Yards, Meilen) zu metrisch in Zauber-Texten
- **Master of Chaos (GM-Dashboard)** — PIN-geschützter Spielleiter-Bereich mit:
  - **Council of Heroes** — Taktische Party-Übersicht mit Aggregat-Stats (Durchschnitts-HP, Bester AC/THAC0, Down-Warning), Hero-Cards mit klassenfarbigen Gradients, expandierbare Details für Saves + Thief Skills
  - **Treasury Vault** — Gold-Verteilung mit Multi-Select, Split-Party-Modus, Quick-Presets (+10/50/100/500/1000 GP), parallele Sends, Live-Totalwert
  - **Item-Management (CRUD)** — Edit/Delete für Waffen, Rüstungen, allgemeine Items UND magische Items (auch canonical PHB-Daten). Delete blockiert wenn Item im Inventar, zeigt betroffene Charaktere
  - **Monster-Management (CRUD + AI Import)** — Manuelle Eingabe oder KI-Import via Foto/PDF (Claude Vision), mit Precise-Mode (Sonnet-4) und client-seitiger Bildkompression (iPhone-Photos unter 3 MB)
  - **Combat Simulator** — Party vs. Opposition mit VS-Divider, Siegchance in %, Durchschnittsrunden, DPR-Breakdown, Kampf-Log
  - **Realtime HP** — Supabase Postgres-Changes für Live-HP der Party während der Session
  - **Bestiary + NPCs** — 400+ Monster aus dem Monstrous Manual (Compendium-Backfill mit Narrativ-Texten, Sub-Varianten, Treasure-Code-Legende) + Custom-NPC-Management
  - **Monster-Import-Pipeline** — 5-Schritt-Prozess (Snapshot → Parse → Backfill → Translate → Images), dokumentiert in `docs/monster-import.md`
  - **Rulebook Chat** — Eingebetteter KI-Chat für Regelfragen mit Quellenbuch-Filter
  - **Eigene Navigation** — Sidebar + Bottom-Nav, PWA-Manifest für Homescreen-Installation
- **Notifications** — Live-Notifications für Item/Gold-Transfer, XP-Vergabe etc. mit Delete-Funktion (einzeln + alle)
- **Avatar-Silhouetten** — Rassen-/Klassen-spezifische Silhouetten als Fallback wenn Character kein Avatar hat
- **Responsive Design** — Desktop Left-Sidebar, Mobile Bottom-Nav mit More-Menu, Glassmorphism Cards
- **Accessibility** — WCAG 2 AA geprüft via axe-core Playwright Tests, ARIA-konforme Dialoge, Screenreader-Labels
- **Regelwerk-Engine** — Reine TypeScript-Funktionen für alle PHB-Regeln + Player's Option

## Tech-Stack

- **Frontend/Backend:** Next.js 16 (App Router, TypeScript)
- **Datenbank & Auth:** Supabase (PostgreSQL + Row Level Security)
- **Styling:** Tailwind CSS v4 + shadcn/ui + Glassmorphism Design-System
- **i18n:** next-intl (Cookie-basiert, DE/EN) + `localized()` Utility für DB-Daten
- **Testing:** Vitest (1552 Unit-Tests), Playwright (120 E2E inkl. Responsive, A11y, Sidebar, XP-Management, GM-Dashboard, Master, Mobile)
- **Hosting:** Vercel (Free-Tier optimiert)
- **AI:** Anthropic Claude API (Character Import, Monster Import, Session Summaries) + Google Gemini (Imagen für Bild-Generierung)
- **Export:** `docx` Paket für Word-Export
- **Image Compression:** Canvas API client-seitig für iPhone-Fotos (vor Upload)

## Lokale Entwicklung

1. **Repository klonen**

   ```bash
   git clone https://github.com/ADnD-Chaos-Forge/chaos-forge.git
   cd chaos-forge
   ```

2. **Dependencies installieren**

   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**

   ```bash
   cp .env.local.example .env.local
   # Supabase-URL und Anon-Key eintragen
   ```

4. **Dev-Server starten**

   ```bash
   npm run dev
   ```

5. **Tests ausführen**

   ```bash
   npm test              # Unit-Tests (Vitest)
   npm run test:e2e      # E2E-Tests (Playwright)
   ```

6. **CI-Pipeline lokal spiegeln**
   ```bash
   npm run verify        # format:check + lint + typecheck + test + build
   ```
   Dieser Befehl entspricht 1:1 der CI und sollte vor jedem Push grün sein.

## Regelwerk-Spezifikation

Die Datei `src/lib/rules/spec/character-creation-rules.ts` katalogisiert alle AD&D 2e Charaktererstellungs-Regeln aus dem Player's Handbook mit eindeutigen IDs.

- Jede Regel hat eine ID (z.B. `ABILITY-001`, `RACE-003`, `COMBAT-002`)
- Jede Regel referenziert Implementierungs-Dateien, Funktionen und Test-Dateien
- `npm test` verifiziert automatisch, dass alle implementierten Regeln Tests haben

### Regelabdeckung

| Kategorie     | Implementiert | Partiell | Fehlend | Gesamt |
| ------------- | ------------- | -------- | ------- | ------ |
| Attribute     | 13            | 1        | 0       | 14     |
| Rassen        | 15            | 0        | 0       | 15     |
| Klassen       | 10            | 3        | 0       | 13     |
| Gesinnung     | 6             | 0        | 0       | 6      |
| Fertigkeiten  | 5             | 0        | 0       | 5      |
| Ausrüstung    | 4             | 0        | 0       | 4      |
| Magie         | 11            | 1        | 0       | 12     |
| Erfahrung     | 3             | 0        | 0       | 3      |
| Kampf         | 4             | 0        | 0       | 4      |
| Multiclass    | 5             | 0        | 0       | 5      |
| Diebesfähigk. | 4             | 0        | 0       | 4      |
| **Gesamt**    | **80**        | **5**    | **0**   | **85** |

## Projektstruktur

```
src/
  app/                    # Next.js App Router (Pages, Layouts)
    characters/[id]/      # Charakterbogen, Druckansicht, Zauberbuch, Play Mode, Epische Ausrüstung
    characters/new/       # Charakter-Erstellung (Auswahl + Wizard)
    characters/import/    # OCR/Vision-Import
    dashboard/            # Dashboard mit 8 Widgets (Zitat, NPCs, XP, Tags, Party-Übersicht, etc.)
    party/                # Party-Inventar & Loot-Verteilung (Gold + Items + Audit-Log)
    sessions/             # Chronik des Chaos (Session-Log)
  components/
    character-sheet/      # Tabs: Stats, Combat, Equipment, Spells, Proficiencies, Thief Skills
    character-card.tsx    # Glassmorphism Character Card (Avatar, HP-Bar, Level-Badge, Alignment)
    character-mode-nav.tsx # Mode-Navigation (Verwalten/Spielen/Episch)
    glass-card.tsx        # Wiederverwendbare Glass-Surface-Komponente
    hp-bar.tsx            # Leuchtende HP-Fortschrittsleiste
    level-badge.tsx       # Hexagonales Level-Badge
    epic-equipment/       # Epische Ausrüstung (Schadensstufen, Simple Items, Spell Abilities)
    party/                # Party-Inventar (Gold-Panel, Items-Panel, Log-Panel, Loot-Verteilung)
    play-mode/            # Play Mode (Kampf, Zauber, Fähigkeiten, Checks, Inventar, Geldbörse, Untote, Schild-Toggle)
    spellbook/            # Standalone Spellbook-Seite (Suche, Filter, Prepare, Learn)
    print-sheet/          # Druckansicht + Word-Export
    session/              # Session-Einträge + Sprachnotizen
    wizard/               # Character Wizard (8 Steps inkl. Kit + Priesthood)
    ui/                   # shadcn/ui Komponenten
  lib/
    rules/                # AD&D 2e Regelwerk-Engine (reine TypeScript-Logik)
      spec/               # Regelwerk-Spezifikation + Coverage-Meta-Test
      abilities.ts        # Attribut-Modifikator-Tabellen (STR 3-25, Sub-Stats)
      alignment.ts        # 9 Gesinnungen (DE/EN), Klassen-Restriktionen
      classes.ts          # 16 Klassen-Definitionen
      combat.ts           # THAC0, Rettungswürfe, Angriffe/Runde (inkl. Spezialisierung)
      equipment.ts        # RK-Berechnung, Belastung, Bewegungsrate, Shield Proficiency
      fighting-styles.ts  # 4 Kampfstile (Single-Weapon, Two-Hander, Weapon & Shield, Two-Weapon)
      epic-items.ts       # Epische Ausrüstung-Engine (Effekte, Auto-Unlock, Spell Abilities)
      experience.ts       # XP-Tabellen, Stufen-Berechnung
      kits.ts             # 20 Kit-Definitionen (Fighter, Thief, Wizard, Priest, Ranger, Bard)
      magic.ts            # Magie-Schulen, Priester-Sphären, Spezialisten
      multiclass.ts       # THAC0/Saves-Optimierung, Regeltreue-Check
      proficiencies.ts    # Waffen-/NWP-Slots, Spezialisierung
      races.ts            # 9 Rassen (inkl. Tiefling, Kobold), Attribut-Adj., Level-Limits
      priesthoods.ts      # 20+ Priesterschafts-Definitionen mit Sphären + Granted Powers
      turn-undead.ts      # Untote vertreiben/befehligen
      spellslots.ts       # Wizard Slots, Priest Slots/Bonus, Spell Points
      thief.ts            # Diebesfähigkeiten, Backstab-Multiplikator
      types.ts            # Zentrale Typdefinitionen
    supabase/             # Supabase Client-Helfer (client.ts, server.ts, middleware.ts)
    utils/                # Hilfsfunktionen
      class-colors.ts     # Klassengruppen-Akzentfarben
      localize.ts         # Locale-aware Text-Auswahl (DE/EN)
      source-books.ts     # Quellenbuch-Abkürzungen (PHB, AEG, etc.)
      docx-export.ts      # Word-Export Generator
      audio-recorder.ts   # MediaRecorder Wrapper für Sprachnotizen
      units.ts            # lbsToKg, feetToMeters
  test/                   # Vitest Setup, Smoke- & Regressionstests
e2e/                      # Playwright E2E-Tests (POM-Pattern)
  responsive-a11y.spec.ts # Mobile Responsive + WCAG 2 AA Tests
  pages/                  # Page Object Models
  helpers/                # Auth-Helper
messages/                 # i18n-Dateien (de.json, en.json)
supabase/
  migrations/             # 213 SQL-Migrationen (Schema + Seed-Daten + Spell Compendium + Epic Items + Priest + Party + Shield + Traits + Realtime + Gold RPC + Monsters + Notifications + Weapon Proficiency Split + Monster Narrative + Profiles)
ressources/
  books/                  # OCR-Texte der AD&D 2e Regelbücher
  compendium-snapshot/    # Monstrous Manual HTML-Snapshot + parsed/translated JSON
  monsters/               # Monstrous Manual PDF (Referenz für AI-Scan)
scripts/                  # Einmalige Daten-Pipeline-Scripts (Compendium-Backfill, Bild-Generierung)
docs/
  monster-import.md       # Monster-Import-Pipeline Dokumentation
```
