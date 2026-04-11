---
date: 2026-04-10T17:58:00Z
git_commit: 555f33c10ad9cfc05dad97f164c06ebadd92d5a1
branch: feat/monster-data-completeness
topic: "Monster-Datenmodell-Vollständigkeit (PR 1: Daten, Chat, UI)"
tags: [plan, monsters, bestiary, scan-monster, rulebook-chat, gm-dashboard, compendium]
status: ready
---

# Monster-Datenmodell-Vollständigkeit — Implementierungsplan

## Overview

Das `monsters`-Schema deckt heute nur 21 von 22 Monstrous-Manual-Feldern ab, fasst alle narrativen Sektionen (Combat, Habitat/Society, Ecology) in einer einzigen `description`-Spalte zusammen, hat keinen Mechanismus für Sub-Varianten (Orc+Orog, Drachen nach Alter) und exponiert im Create-Form nur 15 von 30 Feldern. Es gibt keinen Edit-Dialog. Der Rulebook-Chat injiziert nur 11 Monster-Spalten ohne Narrativ.

Dieser PR behebt alle drei strukturellen Lücken, nutzt `decheine/complete-compendium` als strukturierte Quelle für einen einmaligen Backfill der Monstrous-Manual-Monster (Produkt-ID 2140), baut einen gemeinsamen `MonsterForm`-Component für Create + Edit, rüstet den Chat um volle narrative Sektionen auf und zieht **gleichzeitig auch die Monster-Bilder aus derselben Quelle** (als WebP konvertiert in den Supabase-Storage), wodurch das ehemals geplante PR 2 (AI-basierte Bild-Regeneration) entfällt und spürbare Imagen-Kosten gespart werden.

## Current State Analysis

**Schema** (`supabase/migrations/00179_monsters_table.sql:4-52`):

- 34 Spalten, `description` ist semantisch überladen (Intro + Combat + Habitat + Ecology in einem Feld)
- Keine `no_appearing` Spalte
- Kein `variant_of_id` oder `variant_name` für Sub-Varianten
- `description_en` existiert seit 00179, wurde aber nie befüllt (toter Code)
- `magic_resistance INTEGER DEFAULT 0` kollidiert mit Scan-Prompt, der String liefert

**Seed-Daten** (`supabase/migrations/00181_seed_monsters_core.sql`):

- 176 Monster mit deutschen Namen, Fluff-Feldern (alignment = „LE", treasure = „J,O" etc.) und einzeiligen `description`-Texten
- Keine narrative Sub-Struktur, keine Combat/Habitat/Ecology-Trennung

**Scan-API** (`src/app/api/scan-monster/route.ts:144-191`):

- Prompt liefert ein einzelnes Monster-JSON, kein Array
- `magic_resistance` wird als String „Nil"/„20%" zurückgegeben, beim Insert via `|| null` weggeworfen
- Keine narrativen Sektionen, kein `no_appearing`, kein `description_en`, `source_book` hart „Custom"
- Sub-Varianten werden halluziniert zu einer einzigen Variante zusammengeklappt

**Bestiary-Panel** (`src/components/master/master-bestiary-panel.tsx`, 1599 Zeilen inline):

- Einzelne Mega-Datei mit Inline-Form (Zeilen 330-627) — kein Component-Split
- **Kein Edit-Dialog**: `updateMonsterGm` existiert (`actions.ts:1146`), wird aber nirgends gerufen
- Scan-Halluzinationen sind nicht korrigierbar, weil Fluff-Felder im Form nicht gerendert werden

**Rulebook-Chat** (`src/app/api/rulebook-chat/route.ts:96-147`):

- Monster-Match per `ilike` auf 5 Wörter ≥ 4 Zeichen, `limit(3)`
- Select holt nur 11 Felder, **kein Narrativ**
- Chat kann Kampfwerte beantworten, aber keine Lebensraum-, Gesellschafts- oder Ökologiefragen

**Externe Datenquelle bestätigt**:

- `github.com/decheine/complete-compendium` — 2524 HTML-Dateien mit voller MM-Stat-Block-Struktur + benannten Narrative-Sektionen (`<b>Combat:</b>` / `<b>Habitat/Society:</b>` / `<b>Ecology:</b>`)
- `data/all_tsr.json` Eintrag `2140` identifiziert als „Monstrous Manual" (1995, Tim Beach)
- Filter-Strategie: HTML enthält `<p class="tsr">…, 2140, …</p>` → zählt als MM-Monster (z.B. Kenku: „2103, 2140, 2428")

## Desired End State

Nach dem Merge dieses PRs:

1. **Schema** hat `intro_text`, `combat_tactics`, `habitat_society`, `ecology`, `no_appearing`, `variant_of_id`, `variant_name`. `description_en` ist weg.

2. **Compendium-Snapshot** liegt versioniert unter `ressources/compendium-snapshot/` mit ~450 MM-HTML-Files + `all_tsr.json` + Parser-Output (`parsed.json`, `translated.json`).

3. **176 Seed-Monster** haben vollständig gefüllte narrative Sektionen (Deutsch, metrisch), ihre Stammfelder (name, description, Fluff-Spalten) bleiben unverändert.

4. **Neue MM-Monster** (etwa 250–350 zusätzlich) sind als Rows angelegt. `name = name_en` als Übergang, bis GM manuell deutsche Namen vergibt oder ein Override-Mapping ergänzt.

5. **`MonsterForm` Component** ist gemeinsame UI für Create + Edit, rendert alle 30+ Felder (Kern-Stats prominent, Fluff/Narrative in Collapsible „Erweiterte Details"), Sub-Varianten-Auswahl nach Scan, Edit-Button im Detail-Modal öffnet Modal mit demselben Component.

6. **Scan-API** liefert `{ variants: [...] }`, `magic_resistance` als Number, `source_book` aus Quelle, narrative Sektionen getrennt. Frontend-Consumer (`handleAIImport`) ist mit umgestellt.

7. **Rulebook-Chat** injiziert bei Monster-Matches Stats + die 4 narrativen Sektionen (jede auf ~800 Zeichen truncate).

8. **Treasure-Codes** haben Tooltip-Legende (statische Lookup-Map ~25 DMG-Buchstaben → deutsche Kurzbeschreibung).

9. **Monster-Bilder** sind einheitlicher als heute: für jeden MM-Monster mit verfügbarem GIF im Compendium liegt ein WebP im `monster-images` Storage-Bucket, alte Open5e-PNGs und SVG-Fallbacks sind ersetzt. Custom-Monster bleiben unberührt. Für Monster ohne Compendium-GIF rendert der React-SVG-Fallback.

10. `npm run verify` ist grün: Unit (Parser, Treasure-Codes, Glossar), Integration (Backfill gegen Test-DB), E2E (Bestiary Create/Edit, Scan-Varianten-Flow, Chat-Query).

### UI Mockups

**Heute — Bestiary Create-Form (Inline, 15 Felder):**

```
┌────────────────────────────────────────┐
│ + Create Monster               [▼]     │
├────────────────────────────────────────┤
│  [Manual] [AI Import]                  │
│                                        │
│  Name        [_________]               │
│  Name (EN)   [_________]               │
│  ┌──────┬──────┬──────┬──────┐         │
│  │ AC   │THAC0 │ HD   │ XP   │         │
│  │ [ ]  │ [ ]  │ [ ]  │ [ ]  │         │
│  └──────┴──────┴──────┴──────┘         │
│  Movement   [_____]  Attacks [_]       │
│  Damage     [_____]  Size    [▼]       │
│  Morale Value [___]                    │
│  Special Atk [_____________]           │
│  Special Def [_____________]           │
│  Description [_____________]           │
│  Upload Image [📁]                     │
│                      [Create]          │
└────────────────────────────────────────┘
```

**Neu — Gemeinsamer MonsterForm (Create + Edit, alle Felder):**

```
┌──────────────────────────────────────────────────────┐
│ [edit | create]: Monster bearbeiten / Monster anlegen│
├──────────────────────────────────────────────────────┤
│ Name (DE) [Kenku_________] Name (EN) [Kenku_______]  │
│                                                      │
│ ─── Kernwerte ───                                    │
│ ┌─────┬─────┬─────┬─────┬─────┬─────┐                │
│ │ AC  │THAC0│ HD  │ XP  │Size │Angr.│                │
│ │[ 5 ]│[var]│[2-5]│[var]│[ M ]│[ 3 ]│                │
│ └─────┴─────┴─────┴─────┴─────┴─────┘                │
│ Bewegung   [6, Fl 18 (D)_________________]           │
│ Schaden    [1-4/1-4/1-6 oder Waffe_______]           │
│ Spez. Ang. [_____________________________]           │
│ Spez. Ver. [Siehe unten__________________]           │
│ MR [30 %]  Moral [Elite (13)________] Wert [13]      │
│                                                      │
│ ▼ Erweiterte Details (Collapsible, Default offen im  │
│                       Edit, zu im Create)            │
│ ┌──────────────────────────────────────────────┐     │
│ │ Klima/Gelände      [Beliebig (Land)_______]  │     │
│ │ Häufigkeit         [Selten________________]  │     │
│ │ Organisation       [Clan__________________]  │     │
│ │ Aktivitätszyklus   [Beliebig______________]  │     │
│ │ Ernährung          [Allesfresser__________]  │     │
│ │ Intelligenz        [Durchschnittlich (8-10)] │     │
│ │ Schatz             [F_____________________]  │     │
│ │ Gesinnung          [Neutral_______________]  │     │
│ │ No. Appearing      [2-8___________________]  │     │
│ │ Quellenbuch        [Monstrous Manual______]  │     │
│ │                                              │     │
│ │ ─── Narrative ───                            │     │
│ │ Einleitung      [Textarea Mehrzeilig______]  │     │
│ │                 [___________________]        │     │
│ │                                              │     │
│ │ Kampf           [Textarea Mehrzeilig______]  │     │
│ │                 [___________________]        │     │
│ │                                              │     │
│ │ Lebensraum      [Textarea Mehrzeilig______]  │     │
│ │                 [___________________]        │     │
│ │                                              │     │
│ │ Ökologie        [Textarea Mehrzeilig______]  │     │
│ │                 [___________________]        │     │
│ │                                              │     │
│ │ ─── Variante von ───                         │     │
│ │ Parent-Monster  [Dropdown: Kein / Orc / …]   │     │
│ │ Varianten-Name  [z.B. „Orog"______________]  │     │
│ └──────────────────────────────────────────────┘     │
│                                                      │
│ [Abbrechen]                        [Speichern]       │
└──────────────────────────────────────────────────────┘
```

**Neu — Sub-Varianten-Picker nach Scan:**

```
┌───────────────────────────────────────────────┐
│ 2 Varianten im Bild erkannt                   │
├───────────────────────────────────────────────┤
│ Welche möchtest du anlegen?                   │
│                                               │
│ [✓] Orc          HD 1,   AC 10, THAC0 19      │
│ [✓] Orog         HD 3+3, AC 6,  THAC0 17      │
│                                               │
│ ○ Beide als eigenständige Monster             │
│ ◉ Orc als Parent, Orog als Variante           │
│                                               │
│               [Abbrechen]  [Importieren]      │
└───────────────────────────────────────────────┘
```

**Neu — Treasure-Code Tooltip im Detail-Modal:**

```
┌──────────────────┐
│ Schatz: F ⓘ      │  ← Tooltip-Trigger
└──────┬───────────┘
       │ Hover/Focus
       ▼
  ┌──────────────────────────────────────┐
  │ Schatzklassen                        │
  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
  │ F — Großer Hort: Edelsteine,         │
  │     Schmuck, Gegenstände, evtl.      │
  │     Tränke und Schriftrollen         │
  └──────────────────────────────────────┘
```

### Key Discoveries

- `src/lib/utils/units.ts:32-79` — `convertImperialText()` existiert bereits und konvertiert yards/feet/miles/pounds/inches bilingual. Parser nutzt das 1:1 für Narrative-Sektionen.
- `jsdom` ist schon als devDependency drin (`package.json:64`) — kein neues HTML-Parsing-Lib.
- `parseHitDiceValue()` wird in `master-bestiary-panel.tsx:463` benutzt. Muss im Parser wiederverwendet werden.
- `MonsterUpdatePayload` in `src/app/master/actions.ts:1111-1144` ist breite Whitelist — umfasst bereits alle Fluff-Felder, nur das UI nutzt sie nicht. Update-Pfad steht.
- MM-Produkt-ID = `2140` („Monstrous Manual", 1995, Tim Beach).
- Vitest `include` Pattern (`vitest.config.ts:10`) matcht nur `src/**/*.{test,spec}.{ts,tsx}` — muss für Parser-Tests unter `scripts/` erweitert werden.
- `createMonsterGm` in `actions.ts:1062-1107` setzt hart `source_book = "Custom"`, `is_custom = true` — muss Backfill-Script umgehen via direktem Supabase-Client mit expliziten Werten.
- `/api/rulebook-chat` selektiert aktuell 11 Felder (`route.ts:110-113`), keine RLS-Constraints.

## What We're NOT Doing

- **AI-basierte Bild-Regeneration via Imagen 4.0** — ersetzt durch direkten GIF→WebP-Transfer aus dem Compendium-Snapshot. Keine Imagen-Kosten, keine Master-Prompts, kein „Bild generieren"-Button im MonsterForm.
- **Farb- / Graustufen-Normalisierung der importierten Bilder** — Originalstil bleibt erhalten, nur Format-Konvertierung GIF → WebP.
- **Bulk-Import anderer Bücher** — nur MM (Produkt-ID 2140). Annuals 1–3 oder Settings-Bücher sind ein späterer Folge-Import
- **Full-Text-Search auf Narrative** — möglich, aber nicht Teil dieses PRs
- **DMG-Treasure-Table-Würfelintegration** — nur statische Legende, kein Würfeln
- **Intelligence als strukturierte Range** — bleibt TEXT-Freiform
- **Size-Parenthetical als strukturiertes Feld** — bleibt im Intro-Text
- **Movement nach Modi aufgeteilt** (walk/fly/swim) — bleibt String
- **Automatische Sub-Varianten-Erkennung beim Backfill** — Parent-Child wird nur manuell via UI oder explizite Override-Map gesetzt, nicht per Heuristik
- **Bilingual Narrative** in der DB (`_en`-Spalten) — nur Snapshot-JSON für Reproduzierbarkeit
- **Cross-Reference-Links** zwischen Monstern im UI — HTML-Links werden im Parser zu reinem Text gestrippt

## Implementation Approach

**Test-Driven Development** auf jeder Stufe: Tests zuerst schreiben (rote Phase), dann Implementation bis Grün, dann Refactor.

**Parallelisierung**: Nach Phase 1 (Schema) teilt sich die Arbeit in zwei Tracks:

- **Track Daten + Bilder**: Phase 2 → 3 → 4 → 5 → 5b → 9 (Snapshot → Parse → Translate → Backfill → Bild-Ingest → Chat)
- **Track UI**: Phase 6 → 7 → 8 (Scan-API → MonsterForm → Treasure-Tooltip)

**Dry-Run-Pattern**: Alle schreibenden Scripts haben einen `--dry-run`-Default und erst mit `--apply` oder `--emit-sql` werden Änderungen persistent. Insbesondere der Backfill erzeugt eine Migration-Datei, die committable und reviewbar ist.

**Idempotenz**: Jedes Script kann beliebig oft laufen, ohne doppelte Arbeit zu machen. Übersetzungs-Script cached per Hash, Backfill-Script prüft `IS NULL` vor UPDATE.

**Migrations-Strategie**: Zwei Migrations-Files:

- `00210_monster_narrative_sections.sql` — additiv, Schema-Only, sofort committable
- `00211_backfill_monsters_from_compendium.sql` — generiert aus dem Backfill-Script nach lokaler Review

**Bild-Ingest-Strategie**: Das Bild-Ingest-Script (Phase 5b) läuft nach der Datenmigration in der Dev-DB. Es überschreibt `image_url` der Seed-Monster und der neu angelegten MM-Monster direkt via Supabase-Storage und Service-Role-Client, **ohne** als SQL-Migration committed zu werden. Grund: Storage-Operationen sind nicht transactional mit DB-Migrationen, und die Zuordnung `monster_id → gif_path` braucht zur Laufzeit die UUIDs aus der gerade frisch befüllten `monsters`-Tabelle. Das Script ist idempotent, `is_custom = false` als harter Filter.

## Architecture and Code Reuse

**Wiederverwendete Utilities:**

- `src/lib/utils/units.ts:convertImperialText()` → Parser für Narrative-Konvertierung
- `src/lib/rules/...parseHitDiceValue()` → Parser für `hit_dice_value`
- `src/lib/supabase/service.ts:createServiceClient()` → Scripts für DB-Zugriff
- `src/lib/supabase/types.ts:MonsterRow` → Type für Parser-Output + Form
- `jsdom` (devDep) → HTML-Parsing im Parser-Script
- `@anthropic-ai/sdk` → Übersetzungs-Script
- `dotenv` → `.env.local` laden in Scripts (Pattern wie `scripts/generate-monster-images.ts:13`)

**Neue Module:**

- `scripts/extract-compendium-snapshot.ts` — einmaliger Extractor (HTMLs + GIFs + all_tsr.json)
- `scripts/parse-compendium.ts` + `scripts/parse-compendium.test.ts` — Parser mit Fixture-Tests
- `scripts/translate-monster-narrative.ts` — Claude-Sonnet-Übersetzer mit Glossar
- `scripts/backfill-monsters-from-compendium.ts` — Dry-Run + SQL-Emit
- `scripts/ingest-monster-images.ts` — GIF → WebP Transfer in Supabase-Storage
- `src/components/master/monster-form.tsx` — gemeinsamer Create/Edit-Component
- `src/components/master/monster-variant-picker.tsx` — Sub-Varianten-Auswahl
- `src/components/master/monster-avatar-fallback.tsx` — extrahierter SVG-Fallback als React-Component
- `src/lib/utils/treasure-codes.ts` — Lookup-Map + Parser
- `ressources/compendium-snapshot/` — committed Snapshot (HTMLs + GIFs + parsed + translated JSONs)

**Gelöschte Module** (in Phase 10):

- `scripts/generate-monster-images.ts` — obsolet (Imagen-Generierung ersetzt durch Compendium-Transfer)
- `scripts/seed-monster-images.ts` — obsolet (Open5e-Download ersetzt)
- `scripts/seed-monster-avatars.ts` — obsolet als Seed-Script, SVG-Logik wandert in React-Component

**Affected Files:**

```
supabase/migrations/
├── 00210_monster_narrative_sections.sql       [NEW - Schema]
└── 00211_backfill_monsters_from_compendium.sql [NEW - Backfill via Script]

src/lib/supabase/types.ts                      [MODIFY - MonsterRow + remove description_en]
src/app/master/actions.ts                      [MODIFY - Update+Create Whitelists erweitern]
src/app/api/scan-monster/route.ts              [MODIFY - Prompt umbauen auf variants[]]
src/app/api/rulebook-chat/route.ts             [MODIFY - Select + Kontext erweitern]
src/components/master/master-bestiary-panel.tsx [MODIFY - Inline-Form raus, MonsterForm rein, Edit-Button]

src/components/master/monster-form.tsx          [NEW - Create+Edit UI]
src/components/master/monster-variant-picker.tsx [NEW - Sub-Varianten-Auswahl]
src/components/master/monster-avatar-fallback.tsx [NEW - SVG-Fallback als React-Component]
src/lib/utils/treasure-codes.ts                 [NEW - Legende]
src/lib/utils/treasure-codes.test.ts            [NEW]

scripts/extract-compendium-snapshot.ts          [NEW]
scripts/parse-compendium.ts                     [NEW]
scripts/parse-compendium.test.ts                [NEW]
scripts/translate-monster-narrative.ts          [NEW]
scripts/backfill-monsters-from-compendium.ts    [NEW]
scripts/ingest-monster-images.ts                [NEW - GIF→WebP Transfer]
scripts/fixtures/kenku.html                     [NEW - Test-Fixture]

scripts/generate-monster-images.ts              [DELETE - obsolet]
scripts/seed-monster-images.ts                  [DELETE - obsolet]
scripts/seed-monster-avatars.ts                 [DELETE - obsolet]

vitest.config.ts                                [MODIFY - include scripts/**/*.test.ts]

ressources/compendium-snapshot/
├── README.md                                   [NEW - Herkunft, Copyright-Hinweis]
├── all_tsr.json                                [NEW - von upstream]
├── mm/
│   ├── *.html                                  [NEW - ~450 MM-HTML-Dateien]
│   └── img/*.gif                               [NEW - ~400 MM-Monster-Bilder]
├── parsed.json                                 [NEW - Parser-Output]
├── translated.json                             [NEW - Übersetzungs-Output]
└── image-ingest-report.md                      [NEW - Which monster got which image]

e2e/master.spec.ts                              [MODIFY - Neue Create/Edit-Flows]
e2e/rulebook-chat.spec.ts                       [MODIFY - Narrative-Check]
```

---

## Phase 1: Schema-Migration

### Overview

Additive Schema-Änderung: Neue Spalten für narrative Sektionen, `no_appearing`, Sub-Varianten-FK. `description_en` entfernen. `description` → `intro_text` kopieren. MonsterRow-Type und Update-Whitelist anpassen.

### Changes Required:

#### [x] 1.1 Migration `00210_monster_narrative_sections.sql`

**File**: `supabase/migrations/00210_monster_narrative_sections.sql`
**Changes**: Spalten hinzufügen, `description` kopieren, `description_en` droppen, Index auf `variant_of_id`.

```sql
-- Add narrative section columns
ALTER TABLE monsters
  ADD COLUMN intro_text       TEXT,
  ADD COLUMN combat_tactics   TEXT,
  ADD COLUMN habitat_society  TEXT,
  ADD COLUMN ecology          TEXT,
  ADD COLUMN no_appearing     TEXT;

-- Sub-variant self-reference (nullable: parent if NULL, child if set)
ALTER TABLE monsters
  ADD COLUMN variant_of_id UUID REFERENCES monsters(id) ON DELETE CASCADE,
  ADD COLUMN variant_name  TEXT;

CREATE INDEX idx_monsters_variant_of_id ON monsters (variant_of_id);

-- Copy existing description into intro_text as safety-net
UPDATE monsters SET intro_text = description WHERE intro_text IS NULL;

-- Drop unused English description column (never populated since 00179)
ALTER TABLE monsters DROP COLUMN description_en;
```

#### [x] 1.2 TypeScript `MonsterRow` Interface

**File**: `src/lib/supabase/types.ts:510-546`
**Changes**: Neue Felder ergänzen, `description_en` entfernen.

```typescript
export interface MonsterRow {
  // ... bestehende Felder ...
  description: string | null;
  // description_en entfernen
  intro_text: string | null;
  combat_tactics: string | null;
  habitat_society: string | null;
  ecology: string | null;
  no_appearing: string | null;
  variant_of_id: string | null;
  variant_name: string | null;
  // ... rest unverändert ...
}
```

#### [x] 1.3 `MonsterUpdatePayload` und `createMonsterGm` erweitern

**File**: `src/app/master/actions.ts:1062-1144`
**Changes**: Insert + Update Whitelists um neue Spalten erweitern. `source_book` darf nicht mehr hart auf „Custom" — bleibt aber Default für manuellen Create ohne Scan.

```typescript
type MonsterUpdatePayload = Partial<
  Pick<
    MonsterRow,
    | "name"
    | "name_en"
    | "ac"
    | "movement"
    | "hit_dice"
    | "hit_dice_value"
    | "thac0"
    | "attacks_per_round"
    | "damage"
    | "special_attacks"
    | "special_defenses"
    | "magic_resistance"
    | "size"
    | "morale"
    | "morale_value"
    | "xp_value"
    | "description"
    | "climate_terrain"
    | "frequency"
    | "organization"
    | "activity_cycle"
    | "diet"
    | "intelligence"
    | "treasure"
    | "alignment"
    | "has_ranged_attack"
    | "default_zone"
    | "typical_spells"
    | "source_book"
    // NEU:
    | "intro_text"
    | "combat_tactics"
    | "habitat_society"
    | "ecology"
    | "no_appearing"
    | "variant_of_id"
    | "variant_name"
  >
>;

// createMonsterGm (actions.ts:1062): neue Felder im Insert, source_book aus Payload
```

#### [x] 1.4 Migration lokal ausführen

**Command**: `supabase db push` (Dev-Datenbank)
**Verification**: `psql` oder Supabase-Dashboard: `\d monsters` zeigt neue Spalten.

### Success Criteria:

#### Automated Verification:

- [x] `npm run typecheck` — `MonsterRow` und alle Consumer compilen
- [x] `npm run lint` — Linter ist grün
- [x] `npm run build` — Next.js-Build grün (alle Type-Imports stimmen)
- [x] `npm test` — existierende Tests bleiben grün (46 Files, 1449 Tests)
- [x] `supabase db push` — Migration ohne Fehler durch

#### Manual Verification: none — internes Schema, kein User-facing Feature in dieser Phase.

---

## Phase 2: Compendium-Snapshot-Extraktion

### Overview

Einmaliges Script, das aus dem öffentlichen GitHub-Repo `decheine/complete-compendium` nur die HTML-Dateien extrahiert, die im `<p class="tsr">`-Tag die MM-Produkt-ID `2140` enthalten, **plus die zugehörigen GIF-Bilder** aus `static/images/monsters/img/<monster_key>.gif`, plus `data/all_tsr.json`, und alles committbar nach `ressources/compendium-snapshot/` schreibt.

### Changes Required:

#### [x] 2.1 Snapshot-Extraktor

**File**: `scripts/extract-compendium-snapshot.ts`
**Changes**: Neues CLI-Script.

```typescript
// Hoch-Level:
// 1. Shallow-Clone decheine/complete-compendium nach /tmp via simple-git oder `gh api` + download
// 2. Lese alle harvester/cmm/*.html Dateien
// 3. Filter: HTML enthält Pattern /2140/ in <p class="tsr">
// 4. Kopiere passende HTMLs nach ressources/compendium-snapshot/mm/
// 5. Für jeden passenden monster_key: prüfe ob static/images/monsters/img/<key>.gif existiert,
//    wenn ja kopiere nach ressources/compendium-snapshot/mm/img/<key>.gif
// 6. Kopiere data/all_tsr.json nach ressources/compendium-snapshot/all_tsr.json
// 7. Schreibe README.md mit Herkunft, Datum, Copyright-Hinweis, Commit-Hash des Upstream
// 8. Logging: "Extrahiert N Monster-HTMLs und M GIFs aus MM (Produkt-ID 2140)"
```

#### [x] 2.2 Script ausführen und Snapshot committen

**Command**: `npx tsx scripts/extract-compendium-snapshot.ts`
**Output**: `ressources/compendium-snapshot/{README.md, all_tsr.json, mm/*.html, mm/img/*.gif}`
**Verification**:

- Anzahl `.html`-Dateien in `mm/` liegt plausibel zwischen 350 und 500
- Anzahl `.gif`-Dateien in `mm/img/` liegt plausibel zwischen 300 und 450 (ca. 10–15 % Bilder fehlen upstream laut Compendium-README)
- Stichprobe: `ressources/compendium-snapshot/mm/kenku.html` und `mm/img/kenku.gif` existieren
- Gesamtgröße < 45 MB (HTMLs ~20 MB + GIFs ~20 MB)

#### [x] 2.3 README mit Copyright-Hinweis

**File**: `ressources/compendium-snapshot/README.md`
**Changes**: Herkunfts-Dokumentation.

```markdown
# Compendium-Snapshot (Monstrous Manual)

Dieser Snapshot wurde einmalig extrahiert aus:

- Upstream: github.com/decheine/complete-compendium
- Datum: <YYYY-MM-DD>
- Upstream-Commit: <sha>

Enthält die HTML-Stat-Block-Dateien und die dazugehörigen GIF-Illustrationen
für Monster aus dem Monstrous Manual (TSR-Produkt-ID 2140,
© Wizards of the Coast) plus die Buch-Lookup-Daten.

**Verwendungszweck**: Einmaliger Backfill-Import für die private Spielgruppe
"Chaos RPG" (≤ 10 Nutzer, nicht-kommerziell). Rechtsprofil entspricht der
bereits vorhandenen Nutzung von `ressources/monsters/Monstrous Manual.pdf`.

Siehe `docs/agents/research/2026-04-10-monster-data-completeness.md` für
vollständige Herkunfts- und Design-Dokumentation.
```

### Success Criteria:

#### Automated Verification:

- [x] Script läuft ohne Fehler durch: `npx tsx scripts/extract-compendium-snapshot.ts`
- [x] `ls ressources/compendium-snapshot/mm/*.html | wc -l` = 235 (Filter: 2140 + 2102 + 2103; ursprüngliche Plan-Schätzung 350–500 war zu hoch, tatsächlicher Stand 235 nach Scope-Erweiterung)
- [x] `ls ressources/compendium-snapshot/mm/img/*.gif | wc -l` = 214
- [x] `ressources/compendium-snapshot/README.md` existiert
- [x] `ressources/compendium-snapshot/all_tsr.json` ist gültiges JSON
- [x] Gesamtgröße des Snapshots unter 45 MB: `du -sh ressources/compendium-snapshot` = 9.5 MB
- [x] `git status` zeigt die neuen Dateien als untracked

#### Manual Verification: none — Entwickler-Tool.

---

## Phase 3: HTML-Parser (TDD)

### Overview

Deterministischer Parser, der die Snapshot-HTMLs einliest, alle Stat-Block-Felder und die vier narrativen Sektionen extrahiert, metrisch konvertiert und als strukturiertes JSON schreibt. Vollständig unit-getestet mit Fixture-HTML.

### Changes Required:

#### [x] 3.1 Vitest Config erweitern

**File**: `vitest.config.ts`
**Changes**: `include`-Pattern um `scripts/**/*.test.ts` erweitern (PD-2 Entscheidung).

```typescript
test: {
  environment: "jsdom",
  setupFiles: ["./src/test/setup.ts"],
  include: [
    "src/**/*.{test,spec}.{ts,tsx}",
    "scripts/**/*.test.ts",  // NEU
  ],
},
```

#### [x] 3.2 Test-Fixture

**File**: `scripts/fixtures/kenku.html`
**Changes**: Kopie der `ressources/compendium-snapshot/mm/kenku.html` als stabile Test-Fixture (Kenku hat genug Edge-Cases: Multi-Value-Zellen in THAC0/XP, Cross-Ref-Links, alle vier Narrative-Sektionen, Hit Dice als Range „2-5").

#### [x] 3.3 Parser-Tests (red phase)

**File**: `scripts/parse-compendium.test.ts`
**Changes**: Vollständige Test-Suite für `parseMonsterHtml()`.

```typescript
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { parseMonsterHtml } from "./parse-compendium";

describe("parseMonsterHtml", () => {
  const kenku = readFileSync("scripts/fixtures/kenku.html", "utf-8");

  it("extracts name from h1", () => {
    const m = parseMonsterHtml(kenku);
    expect(m.name_en).toBe("Kenku");
  });

  it("extracts all stat-block fields", () => {
    const m = parseMonsterHtml(kenku);
    expect(m.climate_terrain).toBe("Any land");
    expect(m.frequency).toBe("Uncommon");
    expect(m.organization).toBe("Clan");
    expect(m.no_appearing).toBe("2-8");
    expect(m.ac).toBe(5);
    expect(m.hit_dice).toBe("2-5");
    expect(m.size).toBe("M");
    // ...
  });

  it("parses magic_resistance percentage to integer", () => {
    expect(parseMonsterHtml(kenku).magic_resistance).toBe(30);
  });

  it("casts 'Nil' magic_resistance to 0", () => {
    const html = kenku.replace("<td>30%</td>", "<td>Nil</td>");
    expect(parseMonsterHtml(html).magic_resistance).toBe(0);
  });

  it("extracts combat_tactics section from <b>Combat:</b> paragraphs", () => {
    const m = parseMonsterHtml(kenku);
    expect(m.combat_tactics).toBeTruthy();
    expect(m.combat_tactics).not.toContain("<b>Combat:</b>");
  });

  it("extracts habitat_society section", () => {
    expect(parseMonsterHtml(kenku).habitat_society).toBeTruthy();
  });

  it("extracts ecology section", () => {
    expect(parseMonsterHtml(kenku).ecology).toBeTruthy();
  });

  it("converts imperial units in narrative text to metric", () => {
    const html = kenku.replace(
      "Kenku are bipedal",
      "Kenku are 5 feet tall and weigh 80 pounds. Kenku are bipedal"
    );
    const m = parseMonsterHtml(html);
    expect(m.intro_text).toContain("1,5 m");
    expect(m.intro_text).toContain("36,3 kg");
    expect(m.intro_text).not.toContain("5 feet");
  });

  it("strips HTML cross-reference links to plain text", () => {
    const m = parseMonsterHtml(kenku);
    // Anchor tags should become their text content
    expect(m.intro_text).not.toContain("<a href");
    expect(m.intro_text).toContain("birds"); // text of stripped link
  });

  it("extracts tsr product IDs", () => {
    const m = parseMonsterHtml(kenku);
    expect(m.tsr_codes).toContain("2140"); // MM
  });

  it("parses multi-value THAC0 cell into string", () => {
    expect(parseMonsterHtml(kenku).thac0).toBeTypeOf("number");
    // Multi-value wird als String-Suffix in hit_dice gespeichert oder als ersten Wert genommen
  });
});

describe("resolveSourceBook", () => {
  it("resolves MM product ID 2140 to 'Monstrous Manual'", () => {
    // ...
  });
});
```

#### [x] 3.4 Parser-Implementation (green phase)

**File**: `scripts/parse-compendium.ts`
**Changes**: Neue Datei mit exportierter `parseMonsterHtml()` und CLI-Runner.

```typescript
import { JSDOM } from "jsdom";
import { convertImperialText } from "@/lib/utils/units";
import { parseHitDiceValue } from "@/lib/rules/combat"; // oder wo es liegt
import type { MonsterRow } from "@/lib/supabase/types";
import { readFileSync, writeFileSync, readdirSync } from "fs";
import path from "path";

export interface ParsedMonster extends Omit<
  MonsterRow,
  "id" | "created_at" | "updated_at" | "image_url"
> {
  tsr_codes: string[];
  monster_key: string; // Filename ohne .html
}

const STAT_FIELD_MAP: Record<string, keyof ParsedMonster> = {
  "Climate/Terrain": "climate_terrain",
  Frequency: "frequency",
  Organization: "organization",
  "Activity Cycle": "activity_cycle",
  Diet: "diet",
  Intelligence: "intelligence",
  Treasure: "treasure",
  Alignment: "alignment",
  "No. Appearing": "no_appearing",
  // ...
};

const NARRATIVE_SECTIONS = ["Combat", "Habitat/Society", "Ecology"] as const;

function parseMagicResistance(value: string): number {
  if (!value || /nil/i.test(value)) return 0;
  const match = value.match(/(\d+)\s*%?/);
  return match ? parseInt(match[1], 10) : 0;
}

function parseAcValue(value: string): number {
  // Handle negative AC ("-2") and multi-value cells
  const match = value.match(/-?\d+/);
  return match ? parseInt(match[0], 10) : 10;
}

export function parseMonsterHtml(html: string): ParsedMonster {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // 1. Name
  const name_en = doc.querySelector("h1")?.textContent?.trim() ?? "";

  // 2. TSR codes
  const tsrP = doc.querySelector("p.tsr");
  const tsr_codes =
    tsrP?.textContent
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  // 3. Stat block table
  const rows = doc.querySelectorAll("table tr");
  const stats: Partial<ParsedMonster> = {};
  rows.forEach((row) => {
    const label = row.querySelector("th")?.textContent?.replace(":", "").trim();
    const value = row.querySelector("td")?.innerHTML ?? "";
    // ... map to stats based on STAT_FIELD_MAP, cast types
  });

  // 4. Narrative sections
  const paragraphs = Array.from(doc.querySelectorAll("p"));
  let currentSection: "intro" | "combat" | "habitat" | "ecology" = "intro";
  const sections = { intro: "", combat: "", habitat: "", ecology: "" };

  for (const p of paragraphs) {
    const bold = p.querySelector("b")?.textContent?.trim() ?? "";
    if (bold.startsWith("Combat")) {
      currentSection = "combat";
      // Strip leading "Combat:" from paragraph
    } else if (bold.startsWith("Habitat")) {
      currentSection = "habitat";
    } else if (bold.startsWith("Ecology")) {
      currentSection = "ecology";
    }
    // Append stripped text content (anchors become their text)
    sections[currentSection] += stripLinks(p) + "\n\n";
  }

  // 5. Apply metric conversion to all narrative text
  const intro_text = convertImperialText(sections.intro.trim());
  const combat_tactics = convertImperialText(sections.combat.trim());
  const habitat_society = convertImperialText(sections.habitat.trim());
  const ecology = convertImperialText(sections.ecology.trim());

  return {
    name: name_en, // Platzhalter — PD-3a, wird später übersetzt
    name_en,
    tsr_codes,
    monster_key: "", // wird vom Runner gesetzt
    intro_text,
    combat_tactics,
    habitat_society,
    ecology,
    ...stats,
    // ...
  } as ParsedMonster;
}

function stripLinks(el: Element): string {
  const clone = el.cloneNode(true) as Element;
  clone.querySelectorAll("a").forEach((a) => {
    const text = a.textContent ?? "";
    a.replaceWith(text);
  });
  clone.querySelectorAll("b").forEach((b) => b.remove()); // Remove section headers
  return clone.textContent?.trim() ?? "";
}

export function resolveSourceBook(
  tsrCodes: string[],
  tsrLookup: Record<string, { title: string }>
): string {
  // Primärquelle: erstes bekanntes Buch — MM hat Priorität
  if (tsrCodes.includes("2140")) return "Monstrous Manual";
  for (const code of tsrCodes) {
    if (tsrLookup[code]) return tsrLookup[code].title;
  }
  return "Unknown";
}

// CLI Runner
async function main() {
  const snapshotDir = "ressources/compendium-snapshot/mm";
  const tsrLookup = JSON.parse(
    readFileSync("ressources/compendium-snapshot/all_tsr.json", "utf-8")
  );
  const files = readdirSync(snapshotDir).filter((f) => f.endsWith(".html"));

  const monsters: ParsedMonster[] = [];
  for (const file of files) {
    const html = readFileSync(path.join(snapshotDir, file), "utf-8");
    try {
      const parsed = parseMonsterHtml(html);
      parsed.monster_key = file.replace(".html", "");
      parsed.source_book = resolveSourceBook(parsed.tsr_codes, tsrLookup);
      monsters.push(parsed);
    } catch (err) {
      console.error(`Failed to parse ${file}:`, err);
    }
  }

  writeFileSync("ressources/compendium-snapshot/parsed.json", JSON.stringify(monsters, null, 2));
  console.log(`Parsed ${monsters.length} monsters → parsed.json`);
}

// Only run main if invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
```

#### [x] 3.5 Parser-Ausführung

**Command**: `npx tsx scripts/parse-compendium.ts`
**Output**: `ressources/compendium-snapshot/parsed.json`

### Success Criteria:

#### Automated Verification:

- [x] `npm test -- parse-compendium` — alle 19 Parser-Tests grün
- [x] Kein Test verwendet `skip` oder `only`
- [x] `npx tsx scripts/parse-compendium.ts` durchläuft ohne Fehler (235 Monster)
- [x] `parsed.json` hat 235 Einträge (matcht `.html`-Files im Snapshot)
- [x] Stichprobe Kenku liefert alle vier Narrative-Sektionen befüllt, `source_book = "Monstrous Manual"`, `magic_resistance = 30`, `size = "M"`, `hit_dice = "2-5"`, `hit_dice_value = 2`
- [x] `npm run typecheck` grün
- [x] Narrative-Coverage: intro=235, combat=220, habitat=211, ecology=209
- [x] `convertImperialText()` um Range-Pattern (z.B. „150-200 pounds" → „68-90.7 kg") erweitert; Unit-Test-Suite von 35 auf 41 Tests gewachsen
- [x] Gesamter `npm run verify` grün: 48 Test-Files / 1481 Tests, Format + Lint + Typecheck + Build ✓

#### Manual Verification: none — Dev-Tool ohne User-Kontakt.

---

## Phase 4: Übersetzungs-Script

### Overview

Übersetzt die englischen Narrative-Sektionen und Monster-Namen aller `parsed.json`-Einträge ins Deutsche. Nutzt Claude Sonnet 4 mit einem strikten AD&D-Fachbegriffs-Glossar und der Vorgabe, metrische Einheiten beizubehalten (sind durch Phase 3 bereits metrisch, aber doppelt gemoppelt hält besser).

### Changes Required:

#### [-] 4.1 AD&D-Glossar + System-Prompt

**File**: `scripts/translate-monster-narrative.ts` (Teil 1)
**Changes**: Konstanten für Glossar und Prompt.

```typescript
const ADND_GLOSSARY = [
  { en: "Hit Dice (HD)", de: "Trefferwürfel (TW)" },
  { en: "Armor Class (AC)", de: "Rüstungsklasse (RK)" },
  { en: "THAC0", de: "ETW0" },
  { en: "Saving Throw", de: "Rettungswurf" },
  { en: "Backstab", de: "Heimtücke" },
  { en: "Turn Undead", de: "Untote vertreiben" },
  { en: "Magic Resistance", de: "Magieresistenz" },
  { en: "Morale", de: "Moral" },
  { en: "Alignment", de: "Gesinnung" },
  { en: "Lawful Good", de: "rechtschaffen gut" },
  { en: "Chaotic Evil", de: "chaotisch böse" },
  { en: "Neutral", de: "neutral" },
  { en: "Intelligence", de: "Intelligenz" },
  { en: "Wisdom", de: "Weisheit" },
  { en: "Strength", de: "Stärke" },
  { en: "Dexterity", de: "Geschicklichkeit" },
  { en: "Constitution", de: "Konstitution" },
  { en: "Charisma", de: "Charisma" },
  { en: "Cleric", de: "Priester" },
  { en: "Fighter", de: "Kämpfer" },
  { en: "Mage / Wizard", de: "Magier" },
  { en: "Thief", de: "Dieb" },
  { en: "Ranger", de: "Waldläufer" },
  { en: "Paladin", de: "Paladin" },
  { en: "Druid", de: "Druide" },
  { en: "Bard", de: "Barde" },
  { en: "level-drain", de: "Stufenentzug" },
  { en: "petrification", de: "Versteinerung" },
  { en: "paralysis", de: "Lähmung" },
  { en: "poison", de: "Gift" },
  { en: "spell-like ability", de: "zauberähnliche Fähigkeit" },
  { en: "infravision", de: "Infrasicht" },
  { en: "lawful", de: "rechtschaffen" },
  { en: "chaotic", de: "chaotisch" },
  { en: "treasure hoard", de: "Schatzhort" },
  { en: "encounter", de: "Begegnung" },
  { en: "lair", de: "Bau / Hort" },
  { en: "surprise", de: "Überraschung" },
  { en: "demihuman", de: "Halbmensch (Elf, Zwerg, Halbling, Gnom)" },
  { en: "humanoid", de: "Humanoide(r)" },
];

const SYSTEM_PROMPT = `Du bist ein präziser Fachübersetzer für Advanced Dungeons & Dragons 2nd Edition Regelwerks- und Kreaturentexte vom Englischen ins Deutsche.

STRIKTE REGELN:
1. Übersetze NUR, was im Eingabetext steht. Erfinde keine Regeln, Werte oder Details.
2. Nutze ausschließlich metrische Einheiten (m, km, kg, cm). Wandle imperiale Werte um, falls welche im Text stehen.
3. Fachterminologie folgt diesem Glossar (links Englisch, rechts Deutsch):
${ADND_GLOSSARY.map((g) => `   - ${g.en} → ${g.de}`).join("\n")}
4. Namen von Monstern, Ländern, und Eigennamen bleiben unverändert, es sei denn die deutsche Entsprechung ist etabliert (z.B. "White Dragon" → "Weißer Drache").
5. Schreibstil: sachlich, flüssig, keine Ironisierung. AD&D-Atmosphäre beibehalten.
6. Antwortformat: Reine deutsche Übersetzung, kein Kommentar, kein Markdown, keine Anführungszeichen drumherum.`;
```

#### [x] 4.2 Übersetzungs-Runner + Idempotenz

**File**: `scripts/translate-monster-narrative.ts` (Teil 2)
**Changes**: Batch-Loop + Hash-basierte Idempotenz.

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

interface TranslationRecord {
  monster_key: string;
  hash: string; // sha256 über Input-Sektionen
  name: string; // DE
  intro_text: string;
  combat_tactics: string;
  habitat_society: string;
  ecology: string;
}

function hashSections(sections: string[]): string {
  return crypto.createHash("sha256").update(sections.join("||")).digest("hex").slice(0, 16);
}

async function translateMonster(m: any): Promise<TranslationRecord> {
  const input = [
    `MONSTER NAME: ${m.name_en}`,
    "",
    `INTRO:\n${m.intro_text}`,
    "",
    `COMBAT:\n${m.combat_tactics}`,
    "",
    `HABITAT/SOCIETY:\n${m.habitat_society}`,
    "",
    `ECOLOGY:\n${m.ecology}`,
  ].join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Übersetze die folgenden Sektionen ins Deutsche. Antwortformat exakt so:

NAME:
<deutscher Name>

INTRO:
<Übersetzung>

COMBAT:
<Übersetzung>

HABITAT:
<Übersetzung>

ECOLOGY:
<Übersetzung>

---

${input}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  // Parse response into sections via regex
  return parseTranslationResponse(text, m.monster_key);
}

async function main() {
  const parsed = JSON.parse(readFileSync("ressources/compendium-snapshot/parsed.json", "utf-8"));
  const outputPath = "ressources/compendium-snapshot/translated.json";
  const existing: TranslationRecord[] = existsSync(outputPath)
    ? JSON.parse(readFileSync(outputPath, "utf-8"))
    : [];
  const existingByKey = new Map(existing.map((e) => [e.monster_key, e]));

  const results: TranslationRecord[] = [];
  let translated = 0;
  let cached = 0;

  for (const m of parsed) {
    const hash = hashSections([m.intro_text, m.combat_tactics, m.habitat_society, m.ecology]);
    const prev = existingByKey.get(m.monster_key);
    if (prev && prev.hash === hash) {
      results.push(prev);
      cached++;
      continue;
    }
    const record = await translateMonster(m);
    record.hash = hash;
    results.push(record);
    translated++;
    // Zwischenspeichern alle 20 Monster, damit nichts verloren geht
    if (translated % 20 === 0) {
      writeFileSync(outputPath, JSON.stringify(results, null, 2));
      console.log(`  Zwischenstand: ${translated} übersetzt, ${cached} cached`);
    }
    // Rate-Limit: ca. 1 Request/Sekunde
    await new Promise((r) => setTimeout(r, 1000));
  }

  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Fertig: ${translated} neu übersetzt, ${cached} aus Cache`);
}

main().catch(console.error);
```

#### [x] 4.3 Übersetzungs-Lauf + Stichproben-Review

**Command**: `npx tsx scripts/translate-monster-narrative.ts`
**Manual Step**: 5 zufällige Einträge aus `translated.json` lesen und prüfen:

- Fachbegriffe korrekt (z.B. „Hit Dice" → „Trefferwürfel")
- Keine imperial gebliebenen Maße
- Keine Halluzinationen (nichts erfunden, das nicht im Input war)

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsx scripts/translate-monster-narrative.ts` durchläuft ohne Fehler
- [ ] `translated.json` hat die gleiche Anzahl Einträge wie `parsed.json`
- [ ] Kein Eintrag hat leere `intro_text`/`combat_tactics`/`habitat_society`/`ecology`-Felder, falls der Input welche hatte
- [ ] Alle Einträge haben einen `hash`-Eintrag
- [ ] Zweiter Aufruf des Scripts meldet „0 neu übersetzt, N aus Cache"
- [ ] `grep -iE "\b(feet|pounds|miles|yards|inches)\b" ressources/compendium-snapshot/translated.json | wc -l` ergibt 0

#### Manual Verification:

- [ ] Stichprobe von 5 zufälligen Monstern: Glossar-Begriffe korrekt übersetzt, keine Halluzinationen
- [ ] Ein paar MM-Klassiker (Kobold, Orc, Drache) klingen natürlich auf Deutsch

---

## Phase 5: Backfill-Migration

### Overview

Script erzeugt aus `translated.json` eine deterministische SQL-Migration, die die 176 bestehenden Seed-Monster anreichert (nur leere Felder werden gefüllt) und neue MM-Monster als zusätzliche Rows anlegt. `is_custom = false` als harter Filter schützt GM-Arbeit. Deutsche Namen für neue Monster landen zunächst als Kopie des englischen Namens.

### Changes Required:

#### [x] 5.1 Backfill-Generator

**File**: `scripts/backfill-monsters-from-compendium.ts`
**Changes**: Neues Script, das entweder einen Dry-Run-Diff-Report erzeugt oder die Migration-Datei emittet.

```typescript
// Hoch-Level:
// 1. Lade translated.json
// 2. Lade existierende Monster aus der DB (nur is_custom=false)
// 3. Matching-Strategie:
//    - LOWER(name_en) == LOWER(monster_key) → Match
//    - Sonst: manuelle Override-Map (z.B. "Kenku" → "kenku")
// 4. Für Matches:
//    - UPDATE nur WHERE jeweiliges Feld IS NULL (intro_text, combat_tactics,
//      habitat_society, ecology, no_appearing)
//    - DE-Namen und bestehende description bleiben unverändert
//    - Wenn intro_text noch leer ist (trotz Migration-Copy), nehme translated intro_text
// 5. Für Misses:
//    - INSERT mit name=name_en, name_en gesetzt, source_book='Monstrous Manual',
//      is_custom=false, alle anderen Felder aus translated.json
// 6. Dry-Run (Default):
//    - Gibt Diff-Report als JSON + Markdown-Tabelle
//    - "Wird X Rows updaten, Y Rows neu anlegen"
// 7. --emit-sql:
//    - Schreibt supabase/migrations/00211_backfill_monsters_from_compendium.sql
//    - Header mit Timestamp, Herkunfts-Hinweis
//    - Gekapselt in BEGIN/COMMIT
// 8. --apply: schreibt direkt via Service-Role (Dev-Flow)

// Manual-Override-Map für Match-Edge-Cases
const NAME_OVERRIDES: Record<string, string> = {
  // deutsche Seed-Namen → monster_key
  Kobold: "kobold",
  Riesenspinne: "giant spider", // Beispiel, echt aus 00181 ziehen
  // ...
};
```

#### [x] 5.2 Dry-Run + Review

**Command**: `npx tsx scripts/backfill-monsters-from-compendium.ts`
**Output**: `ressources/compendium-snapshot/backfill-diff.md` + Console-Summary
**Manual Review**:

- Wie viele Updates vs Inserts?
- Sind Match-Fehler plausibel (z.B. exotische Namen)?
- Manuelle Override-Map ggf. erweitern, Script erneut laufen lassen

#### [x] 5.3 SQL-Migration emitten

**Command**: `npx tsx scripts/backfill-monsters-from-compendium.ts --emit-sql`
**Output**: `supabase/migrations/00211_backfill_monsters_from_compendium.sql`

```sql
-- Generated by scripts/backfill-monsters-from-compendium.ts on 2026-04-10
-- Source: ressources/compendium-snapshot/translated.json
-- Scope: MM monsters only (TSR product ID 2140)
-- Match strategy: LOWER(name_en) = monster_key + manual overrides

BEGIN;

-- Anreicherungen existierender Seed-Monster (176 Updates)
UPDATE monsters SET
  intro_text = COALESCE(intro_text, 'Kleine, reptilienartige Humanoide...'),
  combat_tactics = COALESCE(combat_tactics, 'Kobolde kämpfen aus dem Hinterhalt...'),
  habitat_society = COALESCE(habitat_society, 'Sie leben in unterirdischen Gängen...'),
  ecology = COALESCE(ecology, 'Kobolde sind allesfressende Aasfresser...'),
  no_appearing = COALESCE(no_appearing, '4-16')
WHERE name_en = 'Kobold' AND is_custom = false;

-- (... weitere Updates ...)

-- Neuanlage von MM-Monstern ohne bisherige Seed-Row
INSERT INTO monsters (
  name, name_en, source_book, is_custom,
  intro_text, combat_tactics, habitat_society, ecology, no_appearing,
  climate_terrain, frequency, organization, activity_cycle, diet,
  intelligence, treasure, alignment, ac, movement, hit_dice,
  hit_dice_value, thac0, attacks_per_round, damage, special_attacks,
  special_defenses, magic_resistance, size, morale, morale_value, xp_value
) VALUES
  ('Kenku', 'Kenku', 'Monstrous Manual', false,
   'Kenku sind aufrechtgehende, humanoide Vögel, die...',
   'Alle Kenku beherrschen die Fähigkeiten eines Diebs der 4. Stufe...',
   'Kenku sind eine verstohlene Rasse, die unter Menschen lebt...',
   'Domestizierte Kenku sind als Diener geschätzt...',
   '2-8',
   'Jedes Land', 'Selten', 'Clan', 'Beliebig', 'Allesfresser',
   'Durchschnittlich (8-10)', 'F', 'N', 5, '6, Fl 18 (D)', '2-5',
   3, 17, '3 or 1', '1d4/1d4/1d6 or by weapon', NULL, 'Siehe unten',
   30, 'M', 'Elite (13)', 13, 175);
-- (... weitere Inserts ...)

COMMIT;
```

#### [x] 5.4 Migration ausführen

**Command**: `supabase db push` (Dev-DB zuerst)
**Verification**: Spotcheck per SQL — `SELECT name, intro_text IS NOT NULL, combat_tactics IS NOT NULL FROM monsters WHERE name = 'Kobold'`

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsx scripts/backfill-monsters-from-compendium.ts` (Dry-Run) läuft ohne Fehler
- [ ] `npx tsx scripts/backfill-monsters-from-compendium.ts --emit-sql` erzeugt valide SQL-Datei
- [ ] `supabase db push` spielt 00211 erfolgreich ein
- [ ] Smoke-SQL: `SELECT COUNT(*) FROM monsters WHERE intro_text IS NOT NULL` ≥ 176
- [ ] Smoke-SQL: `SELECT COUNT(*) FROM monsters WHERE combat_tactics IS NOT NULL` ≥ 176
- [ ] Smoke-SQL: `SELECT COUNT(*) FROM monsters` liegt zwischen 350 und 550 (176 alt + 200–350 neu)
- [ ] Smoke-SQL: `SELECT COUNT(*) FROM monsters WHERE is_custom = true` UNCHANGED vor/nach Migration
- [ ] `npm run verify` grün

#### Manual Verification:

- [ ] Supabase-Dashboard: 5 Stichproben von angereicherten Seed-Monstern — DE-Namen unverändert, neue Narrative-Spalten deutsch und sinnvoll
- [ ] Supabase-Dashboard: 5 Stichproben von neu angelegten MM-Monstern — `name = name_en` (noch englisch), aber Narrative auf Deutsch, `source_book = 'Monstrous Manual'`

---

## Phase 5b: Monster-Bild-Ingest (GIF → WebP)

### Overview

Ersetzt die ehemals geplante AI-basierte Bild-Regeneration (PR 2) durch einen direkten Transfer der GIF-Bilder aus dem Compendium-Snapshot. Pro Monster-Row mit passendem `monster_key` wird das GIF zu WebP konvertiert, in den `monster-images` Storage-Bucket hochgeladen, `image_url` in der DB aktualisiert und das alte Storage-Objekt (falls vorhanden) entfernt. Custom-Monster sind hart gefiltert. Keine Original-Nachbearbeitung (keine Graustufen-Normalisierung, keine Crops).

### Changes Required:

#### [x] 5b.1 Ingest-Script

**File**: `scripts/ingest-monster-images.ts`
**Changes**: Neues CLI-Script.

```typescript
// Hoch-Level:
// 1. Lade ressources/compendium-snapshot/parsed.json (für monster_key → name_en Mapping)
// 2. SELECT * FROM monsters WHERE is_custom = false
// 3. Match-Strategie: LOWER(name_en) == monster_key (oder via Override-Map aus Phase 5)
// 4. Für jeden Match:
//    a. Prüfe ob ressources/compendium-snapshot/mm/img/<monster_key>.gif existiert
//    b. Wenn ja: Lese GIF, konvertiere mit sharp zu WebP (quality 85, keep aspect ratio)
//    c. Upload in Storage als monster-images/<monster_id>.webp (upsert: true)
//    d. Hole Public URL
//    e. UPDATE monsters SET image_url = <url> WHERE id = <monster_id>
//    f. Merke alte image_url (falls != neu) für Cleanup
// 5. Nach allen Updates: Cleanup-Loop — delete alte Storage-Objekte (*.png, *.svg) deren Pfad
//    nicht mehr in image_url referenziert ist
// 6. Schreibe ressources/compendium-snapshot/image-ingest-report.md:
//    - X Monster mit neuem WebP-Bild
//    - Y Monster ohne Compendium-GIF (Fallback auf React-SVG)
//    - Z Custom-Monster übersprungen
// 7. Idempotent: Re-Run ersetzt identische WebPs (upsert), kein Schaden
```

Verwendet `sharp` (bereits als Dependency) für die Konvertierung:

```typescript
import sharp from "sharp";

async function gifToWebp(gifPath: string): Promise<Buffer> {
  return sharp(gifPath, { animated: false }) // Nur erstes Frame bei animierten GIFs
    .webp({ quality: 85 })
    .toBuffer();
}
```

#### [x] 5b.2 Ingest-Tests

**File**: `scripts/ingest-monster-images.test.ts`
**Changes**: Unit-Tests für Match-Logik und GIF→WebP-Konvertierung.

```typescript
describe("ingest-monster-images", () => {
  it("converts a GIF to a valid WebP buffer", async () => {
    const gif = readFileSync("scripts/fixtures/kenku.gif");
    const webp = await gifToWebp(gif);
    expect(webp.subarray(8, 12).toString()).toBe("WEBP"); // Magic bytes
  });

  it("matches monster by lowercase name_en", () => {
    const monsters = [{ id: "1", name_en: "Kenku", is_custom: false }];
    const snapshotKeys = new Set(["kenku", "orc"]);
    expect(findMatch(monsters[0], snapshotKeys)).toBe("kenku");
  });

  it("skips custom monsters", () => {
    const monster = { id: "1", name_en: "Kenku", is_custom: true };
    expect(shouldProcess(monster)).toBe(false);
  });
});
```

Fixture `scripts/fixtures/kenku.gif` ist eine Kopie des tatsächlichen Compendium-GIFs für Kenku.

#### [x] 5b.3 Ingest-Lauf

**Command**: `npx tsx scripts/ingest-monster-images.ts`
**Output**: Console-Summary + `ressources/compendium-snapshot/image-ingest-report.md`
**Verification**:

- Supabase-Storage: stichprobenartig ein Monster öffnen, Image ist `.webp`
- DB-Check: `SELECT COUNT(*) FROM monsters WHERE image_url LIKE '%.webp%'` ≥ 300
- Custom-Monster-Check: `SELECT image_url FROM monsters WHERE is_custom = true` unverändert vor/nach Lauf

### Success Criteria:

#### Automated Verification:

- [ ] `npm test -- ingest-monster-images` grün
- [ ] `npx tsx scripts/ingest-monster-images.ts` läuft ohne Fehler durch
- [ ] `ressources/compendium-snapshot/image-ingest-report.md` existiert und ist lesbar
- [ ] Smoke-SQL: `SELECT COUNT(*) FROM monsters WHERE image_url LIKE '%.webp'` ≥ 300
- [ ] Smoke-SQL: Custom-Monster image_url unverändert (Test: SELECT vor + nach, diff)
- [ ] `npm run typecheck` grün

#### Manual Verification:

- [ ] Im Bestiary-Panel: Mindestens 10 Monster stichprobenartig ansehen — Bilder werden korrekt angezeigt, einheitlicher Look als vorher
- [ ] Monster ohne Compendium-GIF (z.B. manche Seed-Monster ohne Upstream-Bild): React-SVG-Fallback rendert korrekt
- [ ] Custom-Monster des GM haben weiterhin ihre Original-Uploads (ggf. vorher anlegen für Test)
- [ ] Gesamteindruck: Bestiary-Liste wirkt deutlich homogener

---

## Phase 6: Scan-API Umbau

### Overview

Der `/api/scan-monster`-Endpoint liefert ab jetzt `{ variants: [MonsterData] }` (auch bei Single-Variant-Fällen als Array mit einem Element), extrahiert narrative Sektionen getrennt, behandelt `magic_resistance` als Number, zieht `source_book` aus Quelle, und bittet Claude bei Mehrspalten-Stat-Blöcken um ein Array.

### Changes Required:

#### [x] 6.1 Scan-Prompt erweitern

**File**: `src/app/api/scan-monster/route.ts:144-191`
**Changes**: Neues JSON-Schema im Prompt.

```typescript
const PROMPT_TEXT = `Analyze this AD&D 2nd Edition monster stat block and extract ALL available values as JSON.
Reply ONLY with valid JSON, no other text.

If the stat block contains multiple parallel columns for different variants of the same creature
(e.g., Orc vs Orog, Young vs Adult Dragon), return ALL variants as an array.

Expected format:
{
  "variants": [
    {
      "name": "Monster Name (German if visible, otherwise English)",
      "name_en": "Monster Name (English)",
      "variant_name": null,   // or "Orog", "Adult", "Young" etc. for sub-variants
      "climate_terrain": "Any",
      "frequency": "Common",
      "organization": "Pack",
      "activity_cycle": "Any",
      "diet": "Omnivore",
      "intelligence": "Low (5-7)",
      "treasure": "Nil",
      "alignment": "Neutral",
      "no_appearing": "2d4",
      "ac": 7,
      "movement": "12",
      "hit_dice": "3+3",
      "hit_dice_value": 3,
      "thac0": 17,
      "attacks_per_round": "1",
      "damage": "1d8",
      "special_attacks": null,
      "special_defenses": null,
      "magic_resistance": 0,    // Number, 0 for "Nil", integer percent otherwise
      "size": "M",
      "morale": "Steady (11-12)",
      "morale_value": 11,
      "xp_value": 120,
      "intro_text": "One-paragraph description before the Combat section.",
      "combat_tactics": "Full text under the 'Combat' heading.",
      "habitat_society": "Full text under the 'Habitat/Society' heading.",
      "ecology": "Full text under the 'Ecology' heading.",
      "source_book": "Monstrous Manual",  // from page header/footer if visible
      "has_ranged_attack": false,
      "typical_spells": null,
      "default_zone": "melee"
    }
  ]
}

Notes:
- Always return an array, even for a single creature (then one element).
- "magic_resistance" is ALWAYS a number: 0 for "Nil", integer percent for "30%".
- "hit_dice" is the string as written ("3+3", "1/2", "4"); "hit_dice_value" is the numeric base.
- "size" must be T, S, M, L, H, or G.
- "morale_value" is the minimum of the range ("Steady (11-12)" → 11).
- If the Combat/Habitat/Ecology sections are not clearly delimited, put everything into intro_text and leave the others null.
- If "source_book" is not visible, use null.
- ALL lengths and weights in text fields must be in metric units (meters, kilograms). Convert feet/pounds in the original to metric before writing to the narrative fields.
- Translate German monster names to English for name_en if the source is German.`;
```

#### [x] 6.2 Typ-Casts im Insert-Pfad

**File**: `src/app/master/actions.ts:1062-1107`
**Changes**: `createMonsterGm` akzeptiert die neuen Felder, `source_book` kommt aus Payload.

```typescript
// Im Insert:
source_book: monsterData.source_book || "Custom",  // Fallback wenn Scan nichts liefert
intro_text: monsterData.intro_text || null,
combat_tactics: monsterData.combat_tactics || null,
habitat_society: monsterData.habitat_society || null,
ecology: monsterData.ecology || null,
no_appearing: monsterData.no_appearing || null,
variant_of_id: monsterData.variant_of_id || null,
variant_name: monsterData.variant_name || null,
```

#### [x] 6.3 Scan-API Test (Unit, mocked)

**File**: `src/app/api/scan-monster/route.test.ts`
**Changes**: Unit-Test mit Anthropic-SDK-Mock, der ein Multi-Variant-Array zurückgibt.

```typescript
// Test:
// 1. Mock Anthropic API response: { variants: [orc, orog] }
// 2. POST /api/scan-monster mit Dummy-File
// 3. Assert response.variants has 2 entries, each with numeric magic_resistance
```

### Success Criteria:

#### Automated Verification:

- [ ] `npm test -- scan-monster` grün
- [ ] `npm run typecheck` grün
- [ ] `npm run build` grün

#### Manual Verification:

- [ ] Scan-Endpoint mit Kenku-Bild via curl oder UI → Antwort enthält `variants[0]` mit `combat_tactics`, `habitat_society`, `ecology` gefüllt, `magic_resistance` als Number, `source_book` = "Monstrous Manual"
- [ ] Scan mit Orc+Orog-Seite → `variants` hat 2 Einträge

---

## Phase 7: MonsterForm + Sub-Varianten-UI

### Overview

Gemeinsamer Component für Create und Edit, ersetzt die 420-Zeilen-Inline-Form im Bestiary-Panel. Alle 30+ Felder verfügbar, Fluff und Narrative in einem Collapsible. Edit-Button im Detail-Modal. Neuer Sub-Varianten-Picker nach Scan.

### Changes Required:

#### [x] 7.1 MonsterForm Component

**File**: `src/components/master/monster-form.tsx`
**Changes**: Neuer Component.

```tsx
interface MonsterFormProps {
  mode: "create" | "edit";
  initial?: Partial<MonsterRow>;
  allMonsters: MonsterRow[]; // für variant_of_id Dropdown
  onSubmit: (data: Partial<MonsterRow>) => Promise<void>;
  onCancel: () => void;
}

export function MonsterForm({ mode, initial, allMonsters, onSubmit, onCancel }: MonsterFormProps) {
  const [form, setForm] = useState<Partial<MonsterRow>>(initial ?? DEFAULTS);
  const [advancedOpen, setAdvancedOpen] = useState(mode === "edit");

  // Kern-Stats (AC, THAC0, HD, XP, Size, Attacks, Movement, Damage,
  //              Special Attacks/Defenses, MR, Morale text+value)
  // + Collapsible "Erweiterte Details" mit:
  //   Fluff: climate_terrain, frequency, organization, activity_cycle, diet,
  //          intelligence, treasure, alignment, no_appearing, source_book
  //   Narrative: intro_text, combat_tactics, habitat_society, ecology (Textareas)
  //   Variante: variant_of_id (Dropdown aus allMonsters wo variant_of_id IS NULL),
  //             variant_name

  return (
    <form data-testid="monster-form" onSubmit={/* ... */}>
      {/* Kern-Stats Grid */}
      {/* Collapsible Erweiterte Details */}
      {/* Actions */}
    </form>
  );
}
```

#### [x] 7.2 Sub-Varianten-Picker

**File**: `src/components/master/monster-variant-picker.tsx`
**Changes**: Neuer Component für Post-Scan-Auswahl.

```tsx
interface VariantPickerProps {
  variants: Array<Partial<MonsterRow>>; // vom Scan
  onImport: (
    selected: Array<Partial<MonsterRow>>,
    parentStrategy: "separate" | "parent-child"
  ) => void;
  onCancel: () => void;
}

export function MonsterVariantPicker({ variants, onImport, onCancel }: VariantPickerProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set(variants.map((_, i) => i)));
  const [parentStrategy, setParentStrategy] = useState<"separate" | "parent-child">(
    variants.length > 1 ? "parent-child" : "separate"
  );

  return (
    <div data-testid="monster-variant-picker">
      {/* Liste mit Checkboxen: Name + Kern-Stats (HD, AC, THAC0) */}
      {/* Radio: Separate vs Parent/Child */}
      {/* Buttons: Import, Cancel */}
    </div>
  );
}
```

#### [x] 7.3 Bestiary-Panel refactoren

**File**: `src/components/master/master-bestiary-panel.tsx`
**Changes**:

- Inline-Form (Zeilen 330-627) komplett entfernen
- Create-Button öffnet Modal mit `<MonsterForm mode="create" />`
- `handleAIImport` neu verdrahten: Response ist jetzt `{ variants: [...] }` → öffnet `<MonsterVariantPicker>`
- Edit-Button im `MonsterDetailModal` (Zeilen 1219+) öffnet Modal mit `<MonsterForm mode="edit" initial={monster} />`
- `handleDelete` bleibt wie gehabt

#### [x] 7.4 data-testid-Audit

Alle neuen Form-Felder, Buttons und Dialoge bekommen `data-testid` nach Convention:

- `monster-form-name`, `monster-form-name-en`, `monster-form-ac`, …
- `monster-form-advanced-toggle`, `monster-form-advanced-section`
- `monster-form-intro-text`, `monster-form-combat-tactics`, …
- `monster-form-variant-of-id`, `monster-form-variant-name`
- `monster-form-submit`, `monster-form-cancel`
- `monster-variant-picker`, `monster-variant-picker-item-<i>`
- `monster-edit-button` (im Detail-Modal)

#### [x] 7.5 MonsterForm Unit-Test

**File**: `src/components/master/monster-form.test.tsx`
**Changes**: React Testing Library Tests für Form-Logik.

```typescript
// Tests:
// - Render mode="create" zeigt Defaults, Collapsible eingeklappt
// - Render mode="edit" mit initial Data füllt alle Felder, Collapsible aufgeklappt
// - Toggle advancedSection
// - Submit ruft onSubmit mit kompletten Daten (inkl. Narrative)
// - variant_of_id Dropdown enthält nur Parents (wo variant_of_id IS NULL)
```

### Success Criteria:

#### Automated Verification:

- [ ] `npm test -- monster-form` grün
- [ ] `npm run typecheck` grün
- [ ] `npm run lint` grün
- [ ] `npm run build` grün

#### Manual Verification:

- [ ] Im Bestiary-Panel: Create-Button öffnet neues Modal mit MonsterForm, Collapsible eingeklappt
- [ ] Form-Submit legt Monster korrekt an, inklusive Fluff- und Narrative-Feldern
- [ ] Edit-Button im Detail-Modal eines bestehenden Monsters öffnet MonsterForm mit allen Werten gefüllt, Collapsible aufgeklappt
- [ ] Änderungen werden gespeichert, Detail-Modal refreshed
- [ ] Scan eines Kenku-Bildes → direkt in MonsterForm (weil nur 1 Variante)
- [ ] Scan eines Orc+Orog-Bildes → VariantPicker erscheint, Auswahl funktioniert, Parent+Child werden angelegt

---

## Phase 8: Treasure-Codes-Legende

### Overview

Statische Lookup-Map für DMG-Treasure-Buchstaben, Tooltip-Integration im MonsterDetailModal.

### Changes Required:

#### [x] 8.1 Treasure-Codes Utility

**File**: `src/lib/utils/treasure-codes.ts`
**Changes**: Neue Utility.

```typescript
/**
 * Advanced Dungeons & Dragons 2nd Edition DMG-Schatzklassen.
 * Statische deutsche Kurzbeschreibungen der Treasure-Table-Codes.
 * Quelle paraphrasiert aus dem DMG (Wizards of the Coast).
 */
export const TREASURE_CODE_DESCRIPTIONS: Record<string, string> = {
  A: "Sehr großer Hort: viel Gold, Edelsteine, Schmuck, Gegenstände",
  B: "Mittlerer Hort: Gold, Silber, einige Edelsteine und Gegenstände",
  C: "Kleiner Hort: wenige Kupfer- und Silbermünzen, selten Gegenstände",
  D: "Mittlerer Hort mit mehr magischen Gegenständen",
  E: "Größerer Hort mit Fokus auf magische Schriftrollen und Tränke",
  F: "Großer Hort: Edelsteine, Schmuck, Gegenstände, evtl. Tränke und Schriftrollen",
  G: "Sehr großer Gold-Hort mit wenigen magischen Gegenständen",
  H: "Maximaler Hort: vergleichbar mit Drachenschätzen",
  I: "Einzelner sehr wertvoller Gegenstand: Edelstein, Stab oder Schmuck",
  // ... J-Z inkl. kleingeschriebene Personen-Codes (Hinweis: paraphrasiert aus DMG)
  J: "Wenige Kupfermünzen in der Tasche",
  K: "Wenige Silbermünzen",
  L: "Wenige Edelsteine",
  M: "Wenige Goldmünzen und Schmuck",
  N: "Wenige Schriftrollen",
  O: "Kupfer- und Silbermünzen",
  P: "Silber- und Goldmünzen",
  Q: "Edelsteine",
  R: "Schmuck, Edelsteine und Gold",
  S: "Tränke",
  T: "Schriftrollen",
  U: "Magische Gegenstände (Diverses)",
  V: "Stab oder Zauberstab",
  W: "Große Mengen Gold und wertvolle Gegenstände",
  X: "Magische Gegenstände (Waffen/Rüstung)",
  Y: "Seltene Magie (Artefakte-Niveau)",
  Z: "Kombinierter Hort aus mehreren Kategorien",
};

/**
 * Parst einen Treasure-String wie "L, M, N (Q×10), S" in einzelne Codes.
 */
export function parseTreasureCodes(
  treasure: string | null
): Array<{ code: string; description: string; note?: string }> {
  if (!treasure || treasure.trim().toLowerCase() === "nil") return [];

  // Split an Kommas, extrahiere einzelne Codes + optionale Modifikatoren wie "(Q×10)"
  const entries = treasure
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return entries.map((entry) => {
    const match = entry.match(/^([A-Za-z])(\s*\(.+\))?$/);
    const code = match?.[1]?.toUpperCase() ?? entry;
    const note = match?.[2]?.trim();
    const description = TREASURE_CODE_DESCRIPTIONS[code] ?? "Unbekannter Code";
    return { code, description, note };
  });
}
```

#### [x] 8.2 Treasure-Codes Tests

**File**: `src/lib/utils/treasure-codes.test.ts`
**Changes**: Vollständige Tests.

```typescript
describe("parseTreasureCodes", () => {
  it("returns empty array for null/nil", () => {
    expect(parseTreasureCodes(null)).toEqual([]);
    expect(parseTreasureCodes("Nil")).toEqual([]);
    expect(parseTreasureCodes("nil")).toEqual([]);
  });

  it("parses single code", () => {
    expect(parseTreasureCodes("F")).toHaveLength(1);
    expect(parseTreasureCodes("F")[0].code).toBe("F");
  });

  it("parses multiple codes", () => {
    const result = parseTreasureCodes("L, M, N");
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.code)).toEqual(["L", "M", "N"]);
  });

  it("preserves notes in parentheses", () => {
    const result = parseTreasureCodes("L, M, N (Q×10), S");
    expect(result[2].code).toBe("N");
    expect(result[2].note).toContain("(Q×10)");
  });

  it("maps F to the expected German description", () => {
    expect(parseTreasureCodes("F")[0].description).toContain("Großer Hort");
  });
});
```

#### [x] 8.3 Tooltip im MonsterDetailModal

**File**: `src/components/master/master-bestiary-panel.tsx` (MonsterDetailModal, Treasure-Zelle)
**Changes**: Treasure-Feld wird mit Tooltip versehen, der `parseTreasureCodes()` nutzt.

```tsx
// Im Detail-Modal bei der Treasure-Zeile:
{
  monster.treasure && (
    <div className="flex items-center gap-1">
      <span>{monster.treasure}</span>
      <Tooltip>
        <TooltipTrigger>
          <Info className="h-3 w-3 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            {parseTreasureCodes(monster.treasure).map(({ code, description, note }) => (
              <div key={code}>
                <strong>
                  {code}
                  {note && ` ${note}`}
                </strong>
                : {description}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
```

`data-testid="monster-treasure-tooltip"`.

### Success Criteria:

#### Automated Verification:

- [ ] `npm test -- treasure-codes` grün
- [ ] `npm run typecheck` grün
- [ ] `npm run lint` grün

#### Manual Verification:

- [ ] Im Detail-Modal eines Monsters mit Treasure-Code (z.B. Kenku „F") schwebt ein (i)-Icon neben dem Code
- [ ] Hover/Focus zeigt Tooltip mit deutscher Kurzbeschreibung
- [ ] Monster mit Multi-Code (z.B. „L, M, N") zeigt alle im Tooltip
- [ ] Monster mit „Nil" zeigt kein Tooltip

---

## Phase 9: Rulebook-Chat Narrative-Injection

### Overview

Der Chat-Endpoint selektiert ab jetzt auch die 4 Narrative-Spalten + `no_appearing`, truncated pro Sektion auf 800 Zeichen, und injiziert sie als strukturierten Markdown-Block in den Claude-Kontext.

### Changes Required:

#### [x] 9.1 Select-Liste erweitern

**File**: `src/app/api/rulebook-chat/route.ts:110-113`
**Changes**: Neue Spalten im Select.

```typescript
const matchedMonsters =
  words.length > 0
    ? (
        await service
          .from("monsters")
          .select(
            "name, name_en, ac, hit_dice, thac0, damage, " +
              "special_attacks, special_defenses, magic_resistance, movement, " +
              "xp_value, no_appearing, intro_text, combat_tactics, habitat_society, ecology"
          )
          .or(words.map((w) => `name.ilike.%${w}%,name_en.ilike.%${w}%`).join(","))
          .limit(3)
      ).data
    : null;
```

#### [x] 9.2 Kontext-Block umbauen

**File**: `src/app/api/rulebook-chat/route.ts:119-144`
**Changes**: Struktur-Block statt Einzeiler.

```typescript
const MAX_SECTION_LEN = 800;

function truncate(text: string | null, max: number = MAX_SECTION_LEN): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

if (matchedMonsters && matchedMonsters.length > 0) {
  monsterContext =
    "\n\n--- Monster-Daten (Monstrous Manual) ---\n" +
    matchedMonsters
      .map((m) => {
        const stats =
          `${m.name}${m.name_en ? ` (${m.name_en})` : ""}: ` +
          `RK ${m.ac}, TW ${m.hit_dice}, ETW0 ${m.thac0}, Schaden ${m.damage}, BW ${m.movement}` +
          (m.no_appearing ? `, Auftreten: ${m.no_appearing}` : "") +
          (m.special_attacks ? `, Spezialangriffe: ${m.special_attacks}` : "") +
          (m.special_defenses ? `, Spezialverteidigung: ${m.special_defenses}` : "") +
          (m.magic_resistance > 0 ? `, MR ${m.magic_resistance}%` : "") +
          `, EP ${m.xp_value}`;

        const narrative = [
          m.intro_text && `### Beschreibung\n${truncate(m.intro_text)}`,
          m.combat_tactics && `### Kampf\n${truncate(m.combat_tactics)}`,
          m.habitat_society && `### Lebensraum & Gesellschaft\n${truncate(m.habitat_society)}`,
          m.ecology && `### Ökologie\n${truncate(m.ecology)}`,
        ]
          .filter(Boolean)
          .join("\n\n");

        return stats + (narrative ? "\n\n" + narrative : "");
      })
      .join("\n\n---\n\n");
}
```

### Success Criteria:

#### Automated Verification:

- [ ] `npm run typecheck` grün
- [ ] `npm run lint` grün
- [ ] `npm run build` grün
- [ ] `npm test` grün (inkl. bestehender rulebook-chat-Tests)

#### Manual Verification:

- [ ] Chat-Frage „Wie lebt ein Kenku?" liefert eine Antwort mit Bezug auf Lebensraum-Text (nicht nur Stats)
- [ ] Chat-Frage „Wie bekämpfe ich einen Drachen?" liefert Antwort mit Bezug auf `combat_tactics`
- [ ] Antwortzeit bleibt < 10 s (keine merklichen Slowdowns durch größere Selects)
- [ ] Chat-Antwort nutzt metrische Einheiten (die im Narrative-Text ja sowieso metrisch sind)

---

## Phase 10: Test-Pyramide + Final Verify

### Overview

Test-Abdeckung vervollständigen, E2E-Tests für Bestiary-Create/Edit/Sub-Varianten-Flow und Rulebook-Chat schreiben, `npm run verify` final grün bekommen.

### Changes Required:

#### [ ] 10.1 E2E: Bestiary Create/Edit

**File**: `e2e/master.spec.ts` (bestehend erweitern)
**Changes**: Neue Tests.

```typescript
test("GM erstellt neues Monster via MonsterForm", async ({ page }) => {
  // Login als GM
  // Navigiere zu /master, klicke Bestiary-Tab
  // Klicke Create-Monster-Button
  // Fülle Kernwerte (Name, AC, HD, THAC0, XP, Size, Movement, Damage, Morale)
  // Toggle Advanced Collapsible
  // Fülle Climate/Terrain, Frequency, Alignment, no_appearing
  // Fülle Narrative: intro, combat, habitat, ecology
  // Submit
  // Assert: Monster erscheint in Liste, Detail-Modal zeigt alle Werte
});

test("GM editiert bestehendes Monster aus Detail-Modal", async ({ page }) => {
  // Erstelle Test-Monster via createMonsterGm API mit Prefix "QA_"
  // Öffne Detail-Modal
  // Klicke Edit-Button
  // Ändere intro_text
  // Submit
  // Assert: Detail-Modal zeigt neuen Text; DB-Check via API
});

test("GM wählt Sub-Varianten nach Scan (Mock)", async ({ page }) => {
  // Mock /api/scan-monster auf { variants: [mockOrc, mockOrog] }
  // Klicke AI-Import, upload dummy image
  // Warte auf VariantPicker
  // Wähle beide Varianten + parent-child Strategie
  // Import
  // Assert: 2 Monster erstellt, Orog hat variant_of_id = Orc.id
});
```

#### [ ] 10.2 E2E: Rulebook-Chat mit Monster-Narrative

**File**: `e2e/rulebook-chat.spec.ts` (bestehend erweitern)
**Changes**:

```typescript
test("Chat antwortet mit Narrative-Kontext auf Kenku-Frage", async ({ page }) => {
  // Login, navigiere zu Master > Chat (oder wo der Chat liegt)
  // Frage: "Wie verhalten sich Kenku im Kampf?"
  // Warte auf Response
  // Assert: Response enthält Hinweise auf 4th-level thief skills, scimitar, quarterstaff
  //          ODER mindestens einen Begriff aus combat_tactics (nicht ausgedacht)
});
```

#### [ ] 10.3 Integration: Backfill gegen Test-DB

**File**: `scripts/backfill-monsters-from-compendium.test.ts`
**Changes**: Integration-Test mit mock-DB oder Test-Fixture.

```typescript
describe("backfill merge logic", () => {
  it("matches existing seed monster by name_en and only updates empty fields", async () => {
    // Setup: Test-Seed mit "Kobold" (description gesetzt, narrative leer)
    // Run: backfill mit translated.json, die Kobold-Eintrag enthält
    // Assert: intro_text gesetzt, description unverändert, name unverändert
  });

  it("inserts new MM monster that doesn't exist yet", async () => {
    // Setup: Keine "Kenku"-Row
    // Run: backfill
    // Assert: neue Row mit name=name_en="Kenku", source_book="Monstrous Manual"
  });

  it("skips custom monsters (is_custom=true)", async () => {
    // Setup: custom Kobold mit is_custom=true
    // Run: backfill
    // Assert: custom Kobold unverändert
  });
});
```

#### [x] 10.4 Unit-Audit: Glossar-Konsistenz im Translate-Script

**File**: `scripts/translate-monster-narrative.test.ts`
**Changes**: Snapshot-Test für System-Prompt.

```typescript
it("system prompt contains all glossary entries", () => {
  expect(SYSTEM_PROMPT).toContain("Hit Dice (HD) → Trefferwürfel (TW)");
  expect(SYSTEM_PROMPT).toContain("THAC0 → ETW0");
  expect(SYSTEM_PROMPT).toContain("metrische Einheiten");
});

it("glossary has no duplicate English terms", () => {
  const enTerms = ADND_GLOSSARY.map((g) => g.en);
  expect(new Set(enTerms).size).toBe(enTerms.length);
});
```

#### [x] 10.5 Obsolete Image-Scripts löschen

**Files**: `scripts/generate-monster-images.ts`, `scripts/seed-monster-images.ts`, `scripts/seed-monster-avatars.ts`
**Changes**: Alle drei Scripts löschen (`git rm`). Funktionalität ist durch Phase 5b ersetzt. Der SVG-Fallback wird als React-Component `src/components/master/monster-avatar-fallback.tsx` neu erstellt (Logik 1:1 aus `seed-monster-avatars.ts` übernehmen, aber clientseitig gerendert statt in Storage hochgeladen).

Falls die Scripts in `package.json` über einen npm-Script gelinkt waren: Einträge mit entfernen.

#### [x] 10.6 MonsterAvatarFallback React-Component

**File**: `src/components/master/monster-avatar-fallback.tsx`
**Changes**: Neue React-Komponente, die aus `name` + `size` ein inline SVG rendert (kein Storage-Upload, keine Runtime-Generierung an anderer Stelle).

```tsx
interface MonsterAvatarFallbackProps {
  name: string;
  size: "T" | "S" | "M" | "L" | "H" | "G";
  className?: string;
}

export function MonsterAvatarFallback({ name, size, className }: MonsterAvatarFallbackProps) {
  // Hash-basierte HSL-Farben + Größen-Icon + Erster Buchstabe
  // (Logik aus seed-monster-avatars.ts übernommen)
  return <svg ...>...</svg>;
}
```

Bestiary-Panel-Display-Code (`master-bestiary-panel.tsx`) nutzt diese Component, wenn `monster.image_url` null/leer ist oder ein Ladefehler auftritt.

`data-testid="monster-avatar-fallback"`.

#### [x] 10.7 Final `npm run verify`

**Command**: `npm run verify`
**Verification**: Grün. Falls nicht: debuggen und beheben, bevor PR eröffnet wird.

### Success Criteria:

#### Automated Verification:

- [ ] `npm run verify` komplett grün (format:check, lint, typecheck, test, build)
- [ ] `npm run test:e2e` grün (Playwright)
- [ ] Alle Test-Dateien haben keine `.skip` oder `.only`
- [ ] Test-Coverage für Parser ≥ 80 % (Lines)

#### Manual Verification:

- [ ] Kompletter Smoke-Test-Durchlauf:
  - Login als GM → Bestiary → Create Monster → alle Felder + Narrative → Submit
  - Reload Seite → Monster erscheint in Liste und Detail-Modal
  - Edit → ändere ein Narrative-Feld → Submit → Reload → Änderung persistent
  - Delete → Monster weg
- [ ] Rulebook-Chat-Frage zu einem frisch backgefüllten Monster (z.B. Kenku): Antwort nutzt narrative Daten
- [ ] Scan mit Orc+Orog → VariantPicker → beide importieren
- [ ] Treasure-Tooltip bei Kenku zeigt „F — Großer Hort…"

---

## Testing Strategy

### Unit Tests

- Parser (`parse-compendium.test.ts`): Stat-Block-Extraction, Narrative-Extraction, metrische Konvertierung, Magic-Resistance-Cast, Cross-Ref-Strip, `resolveSourceBook`
- Treasure-Codes (`treasure-codes.test.ts`): Nil-Handling, Single-Code, Multi-Code, Note-Preservation, Unbekannter-Code-Fallback
- MonsterForm (`monster-form.test.tsx`): Create vs Edit Default-State, Collapsible-Toggle, Submit-Payload, variant_of_id Dropdown-Filter
- Translate-Script (`translate-monster-narrative.test.ts`): System-Prompt-Konsistenz, Glossar-Uniqueness
- Scan-API (`scan-monster/route.test.ts`): Multi-Variant-Response-Shape, magic_resistance als Number
- Image-Ingest (`ingest-monster-images.test.ts`): GIF→WebP-Konvertierung (Magic-Bytes-Check), Match-Logik nach `name_en`, Custom-Monster-Skip
- MonsterAvatarFallback (`monster-avatar-fallback.test.tsx`): Rendert für alle 6 Size-Kategorien, Farbe deterministisch aus Namen-Hash

### Integration Tests

- Backfill-Script (`backfill-monsters-from-compendium.test.ts`): Merge-Strategie, Custom-Filter, Name-Override-Map

### E2E Tests (Playwright)

- Bestiary Create-Flow mit Erweiterten Details
- Bestiary Edit-Flow aus Detail-Modal
- Scan-Import mit VariantPicker (2 Varianten, Parent-Child-Strategie)
- Rulebook-Chat-Frage mit Narrative-Kontext
- Treasure-Tooltip im Detail-Modal

### Manual Testing Steps

1. Login als GM, navigiere zu `/master`, Tab „Bestiary"
2. **Bild-Einheitlichkeit prüfen**: Scroll durch die Monster-Liste, visueller Gesamteindruck sollte einheitlicher sein als vorher (überwiegend klassische AD&D-2e-Illustrationen statt bunter Mix)
3. Klicke Create-Monster, Form-Modal öffnet sich mit eingeklapptem „Erweiterte Details"
4. Fülle Kernwerte (Name: „QA Test Monster", AC 5, HD 3+3, THAC0 17, XP 120, Size M, Damage 1d6, Morale Value 11)
5. Klappe „Erweiterte Details" auf, fülle Intelligence, Alignment, Treasure, no_appearing, alle 4 Narrative-Textareas
6. Submit, Monster erscheint in Liste (ohne Bild → SVG-Fallback sollte rendern)
7. Öffne Detail-Modal, Edit-Button klicken, MonsterForm öffnet mit allen Werten
8. Ändere `ecology`, Submit, Modal schließt, Liste aktualisiert
9. Öffne Detail-Modal erneut, prüfe ob `ecology` den neuen Text hat
10. Klicke Treasure-Tooltip-Icon, prüfe ob deutsche Beschreibung erscheint
11. Lösche Test-Monster
12. Lade ein Bild mit Orc+Orog (oder Mock via Dev-Tools), VariantPicker erscheint, wähle beide + Parent/Child, Import, prüfe DB
13. Öffne Rulebook-Chat, frage „Wie lebt ein Kobold?", Antwort sollte Lebensraum-Infos enthalten
14. Öffne ein frisch importiertes MM-Monster (z.B. Kenku): WebP-Bild aus Compendium wird angezeigt

## Performance Considerations

- **Chat-Kontext-Wachstum**: Bei 3 Monster-Matches × 4 Sektionen × 800 Zeichen = ~10 k Zeichen zusätzlicher Input. Claude Sonnet frisst das locker, Output-Tokens bleiben bei 2 048. Keine Slowdowns erwartet.
- **Backfill-Migration**: ca. 350–550 UPDATEs + INSERTs in einer Transaction. Auf Supabase-Free-Tier < 2 s.
- **Parser-Laufzeit**: ~450 HTML-Dateien à ~10 kB via jsdom → geschätzt < 10 s gesamt.
- **Übersetzungs-Script**: ~450 Monster × 1 s Rate-Limit + API-Latenz = geschätzt 15–20 min. Läuft als einmaliger Batch, Idempotenz sorgt für Resume.
- **Scan-API**: keine Performance-Änderung, Prompt ist etwas länger, Response-Shape anders, aber Token-Budget identisch.
- **MonsterForm-Render**: Collapsible verhindert initiales Rendern von ~15 zusätzlichen Feldern im Create-Mode.
- **Bild-Ingest (Phase 5b)**: ~400 GIFs × sharp-Konvertierung (~100 ms/Bild) + Storage-Upload (~300 ms/Bild Free-Tier) = geschätzt 3–5 min. Keine externen API-Kosten. Bandbreite: ca. 20 MB Download (GIFs sind schon lokal) + ca. 10 MB Upload (WebP ist kleiner).
- **Storage-Verbrauch**: ~10 MB WebP statt ~20 MB gemischte PNG+SVG → leicht reduziert im Free-Tier.

## Migration Notes

### Bestehende Daten

- **176 Seed-Monster** aus 00181: DE-Namen und `description` bleiben unverändert. `intro_text` wird in Phase 1 via Migration aus `description` kopiert. Phase 5 ergänzt narrative Sektionen nur WHERE IS NULL — GM-Pflegezustand wird respektiert.
- **Custom-Monster** (`is_custom = true`): Werden von Backfill-Script UND Bild-Ingest hart gefiltert, niemals überschrieben.
- **Bestehende Monster-Bilder** im `monster-images`-Storage: Für Seed-Monster werden alte Open5e-PNGs und SVG-Fallbacks in Phase 5b durch WebPs aus dem Compendium ersetzt (alte Storage-Objekte gelöscht). Custom-Monster-Uploads bleiben unangetastet.

### Rollback-Strategie

- Phase 1 Migration ist pure additive Schema-Änderung + `DROP COLUMN description_en` (toter Code). Rollback: `ALTER TABLE monsters DROP COLUMN intro_text, ...` + restore `description_en`.
- Phase 5 Migration ist eine Daten-Migration. Rollback: DB-Backup wiederherstellen (`chaos-forge-backup-2026-04-07.sql` als Baseline, vor dem PR ein neuer Backup).
- Phase 5b Bild-Ingest ist nicht transaktional. Rollback nur via DB-Backup (image_url-Spalte) + Storage-Backup. Vor dem Lauf: `SELECT id, image_url FROM monsters` als JSON-Dump in `ressources/compendium-snapshot/pre-ingest-image-urls.json` speichern, damit alte URLs im Notfall wiederherstellbar sind. Alte Storage-Objekte sind dann allerdings bereits gelöscht — ein vollständiger Rollback würde das DB-Backup + Storage-Snapshot von vor dem Lauf erfordern.
- Frontend-Änderungen sind reversibel via git-revert des PRs.

### Neue Umgebungen / CI

- `supabase db push` spielt Migrationen 00210 und 00211 deterministisch ein.
- Der Compendium-Snapshot ist committed (PD-4a), keine External-Fetches in CI.
- E2E-Tests benötigen keine neuen Secrets — nutzen vorhandenes Test-Auth-Setup.

## References

- Research-Bericht: `docs/agents/research/2026-04-10-monster-data-completeness.md`
- Aktuelles Schema: `supabase/migrations/00179_monsters_table.sql:4-52`
- Seed-Daten: `supabase/migrations/00181_seed_monsters_core.sql`
- Aktueller Scan-Prompt: `src/app/api/scan-monster/route.ts:144-191`
- Aktueller Chat-Kontext: `src/app/api/rulebook-chat/route.ts:96-147`
- Inline-Form: `src/components/master/master-bestiary-panel.tsx:330-627`
- Update-Whitelist: `src/app/master/actions.ts:1111-1144`
- Utility `convertImperialText`: `src/lib/utils/units.ts:32-79`
- Upstream-Datenquelle: `github.com/decheine/complete-compendium` (MM = TSR-Produkt-ID 2140)
- Bestehendes Pattern für Scripts: `scripts/generate-monster-images.ts`
