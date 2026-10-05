---
date: 2026-07-25T09:08:42+00:00
git_commit: 3294b768a0d0f62fcf62e2a429cf9ac20020502a
branch: feat/isolde-epic-items-shadowdancer-ring
topic: "Charakterbogen-Scan zum Aktualisieren eines bestehenden Charakters (Rescan + Review-Liste)"
tags: [plan, character-import, scan-character, rescan, diff-engine, review-ui]
status: in-progress
---

# Charakterbogen-Rescan mit Änderungs-Review Implementation Plan

## Overview

Ein zweiter Scan-Pfad, der einen **bestehenden** Charakter als Referenz nimmt, den Bogen erneut per Claude Vision liest und die Differenz als kuratierbare Liste anbietet: jede erkannte Änderung ist einzeln ab-/anwählbar und im Wert editierbar, bevor sie geschrieben wird.

Der bestehende Import (`/characters/import`) bleibt als Create-Flow **funktional unverändert**; er erbt lediglich die extrahierten, dann erstmals getesteten Matching- und Prompt-Bausteine.

## Current State Analysis

Aus `docs/agents/research/2026-07-25-character-sheet-rescan-update.md`:

- `/api/scan-character` ist stateless: kennt keine `characterId`, liest nichts aus der DB, Prompt und Zielschema liegen inline im Route-Handler (`route.ts:120-186`).
- Die gesamte Persistenz steckt in `handleCreate()` (`src/app/characters/import/page.tsx:249-609`) — ~360 Zeilen, die Insert- und Fuzzy-Matching-Logik vermischen. Nichts davon ist als testbare Funktion extrahiert; Testabdeckung gibt es nur für `validateImportFiles()`.
- Der Typ `ScannedCharacter` (`page.tsx:20-66`) ist die De-facto-Schnittstelle zwischen Route und UI, existiert aber nur clientseitig — die Route hat keinen Typ für ihre eigene Ausgabe.
- Enum-Whitelists sind doppelt gepflegt: im Prompt (`route.ts:172-175`) und als Arrays im Client (`page.tsx:267-284`, `:303-324`).
- Für Diff/Review existiert kein Baustein. Nächstes UI-Vorbild: `MonsterVariantPicker` (`src/components/master/monster-variant-picker.tsx`) — Checkbox-Auswahl mit `Set<number>`, aber ohne Editierbarkeit und ohne Vorher/Nachher.
- Vorbild für saubere Prompt-Extraktion existiert bereits: `src/lib/scan/monster-scan-prompt.ts` (Typen + Prompt-Konstante + `parseScanResponse()`) mit Integritätstest `monster-scan-prompt.test.ts`.
- `/api/scan-character` fehlt als einziger KI-Route der `is_approved`-Check (Muster: `src/app/api/summarize-session/route.ts:16-29`).

Unique-Constraints, die den Update-Pfad tragen:

| Tabelle                             | Unique-Key                       | Update-Strategie                            |
| ----------------------------------- | -------------------------------- | ------------------------------------------- |
| `character_classes`                 | `(character_id, class_id)`       | Upsert                                      |
| `character_weapon_proficiencies`    | `(character_id, weapon_name)`    | Upsert                                      |
| `character_nonweapon_proficiencies` | `(character_id, proficiency_id)` | Upsert                                      |
| `character_fighting_styles`         | `(character_id, style_id)`       | Upsert                                      |
| `character_languages`               | `(character_id, language_name)`  | Upsert                                      |
| `character_spells`                  | PK `(character_id, spell_id)`    | Upsert                                      |
| `character_equipment`               | **keiner**                       | Fuzzy-Match über Namen → `id`, sonst Insert |
| `character_inventory`               | **keiner**                       | Fuzzy-Match über Namen → `id`, sonst Insert |

## Desired End State

Ein Nutzer öffnet seinen Charakterbogen, klickt im Header auf „Bogen scannen", lädt Fotos des aktualisierten Papierbogens hoch und sieht eine nach Kategorien gruppierte Änderungsliste. Änderungen, die er behalten will, sind bereits angehakt; riskante Vorschläge (Entfernungen, aktuelle TP, Stammdaten, Notizen) sind sichtbar, aber abgewählt. Jeder Zielwert ist direkt in der Zeile editierbar. Wo der Bogen gedruckt und handschriftlich widersprüchliche Werte zeigt, steht der handschriftliche Wert zur Übernahme bereit und beide Werte sind sichtbar. Ein Klick auf „Übernehmen" schreibt genau die ausgewählten Änderungen und leitet auf den Charakterbogen weiter.

## What We're NOT Doing

- Keine Änderung am Verhalten des bestehenden Create-Imports (nur Extraktion geteilter Bausteine — Verhalten bleibt identisch).
- Kein automatisches Löschen von Daten. Entfernungen sind immer nur Vorschläge und starten abgewählt.
- Keine Regelwerk-Neuberechnung nach dem Scan (kein Nachrechnen von HP aus Level/CON, keine THAC0-Ableitung) — die Werte vom Bogen werden übernommen, die Engine berechnet Abgeleitetes wie bisher zur Laufzeit.
- Keine Epic Items, keine `magic_effects`, keine Avatare aus dem Scan.
- Keine Änderungs-Historie/Undo. Wer zurück will, nutzt den bestehenden Charakterbogen.
- Kein Rescan für NPCs in dieser Iteration (die Architektur bleibt aber `basePath`-fähig).
- Keine echte DB-Transaktion (Supabase-JS bietet sie ohne RPC nicht) — stattdessen Fehler-Sammlung mit Bericht.

## UI Mockups

**Einstieg — Charakterbogen-Header (heute → neu):**

```
heute:  [ Teilen ]  [ Druckansicht ]              [ Inaktiv ]  [ ⋯ ]
neu:    [ Teilen ]  [ Druckansicht ]  [ Bogen scannen ]  [ Inaktiv ]  [ ⋯ ]
                                       └─ ScanLine-Icon, nur für Owner,
                                          in ApprovalGate gewrappt
```

**Schritt 1 — Upload** (`/characters/[id]/rescan`), Layout und Dropzone identisch zum bestehenden Import:

```
┌──────────────────────────────────────────────────────────────┐
│  Bogen scannen — Thalia Sturmwind                            │
│  Lade Fotos des aktuellen Bogens hoch. Erkannte Änderungen   │
│  kannst du danach einzeln prüfen.                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │        Klicke hier um Fotos oder PDFs auszuwählen      │  │
│  │              Bis zu 15 Dateien (je max. 10 MB)         │  │
│  └────────────────────────────────────────────────────────┘  │
│  ℹ Vorgefundene Inkonsistenz: `MAX_FILE_COUNT = 15`          │
│    (import-validation.ts:1), aber `import.dropzoneHint` und  │
│    die Route-Fehlermeldung (route.ts:66) sagen „5". Der      │
│    neue Namespace nennt 15; die alten Texte werden in        │
│    Phase 3 mitkorrigiert.                                    │
│  ☐ Präziser Scan (genauer bei handschriftlichen Bögen)       │
│                                    [ Änderungen ermitteln ]  │
└──────────────────────────────────────────────────────────────┘
```

**Schritt 2 — Review-Liste:**

```
┌─ Erkannte Änderungen ───────────────── 12 gefunden · 6 ausgewählt ─┐
│  [ Alle ] [ Keine ]                                               │
├───────────────────────────────────────────────────────────────────┤
│ ▾ Kernwerte                                             4         │
│   ☑ Stufe (Dieb)        3  →  [ 4        ]        ✎ handschr.     │
│   ☑ XP (Dieb)       5.500  →  [ 9.200    ]        ✎ handschr.     │
│      ⚠ gedruckt 5.500 · handschriftlich 9.200   [ gedruckt nehmen]│
│   ☑ Max. TP            24  →  [ 29       ]        ⌨ gedruckt      │
│   ☐ Akt. TP            18  →  [ 22       ]        ⌨ gedruckt      │
│      ℹ Wird im Spielmodus gepflegt und ist dort meist aktueller.  │
│                                                                   │
│ ▾ Listen                                                6         │
│   ☑ + Langschwert +1                  neu         ⌨ gedruckt      │
│   ☑ + Zauber: Unsichtbarkeit (2)      neu         ✎ handschr.     │
│   ☑ ~ Heiltrank            2 Stk  →  [ 4 ]        ✎ handschr.     │
│   ☐ − Fackel (3 Stk)   im Bogen nicht mehr gefunden               │
│                                                                   │
│ ▸ Stammdaten                                            2         │
│ ▸ Weitere Felder                                        0         │
├───────────────────────────────────────────────────────────────────┤
│ [ Neue Dateien ]                       [ 6 Änderungen übernehmen ]│
└───────────────────────────────────────────────────────────────────┘
```

Zeilen-Semantik: `+` Neuzugang, `~` Wert-Änderung, `−` Entfernungs-Vorschlag. `⌨` = gedruckt, `✎` = handschriftlich.

**Schritt 3 — Ergebnis:** Weiterleitung auf `/characters/[id]/manage`. Bei Teilfehlern bleibt die Seite stehen und zeigt, welche Änderungen nicht geschrieben werden konnten.

## Architecture and Code Reuse

Kern der Architektur: **eine reine, unit-testbare Pipeline**, an deren Enden nur dünne I/O-Schichten hängen.

```
  Dateien ──► /api/scan-character?mode=update
                  │  (sharp + Anthropic + CHARACTER_UPDATE_SCAN_PROMPT)
                  ▼
           ScannedUpdatePayload { printed, handwritten }
                  │
   CharacterSnapshot (aus DB, wie manage/page.tsx lädt)
                  │
                  ▼
        buildChangeSet(snapshot, payload)      ← rein, character-diff.ts
                  │
           ScanChange[]  (Kategorie, Kind, Quelle, Konflikt, defaultSelected)
                  │
        Nutzer wählt ab/an + editiert Werte    ← UI-State
                  │
                  ▼
        buildApplyPlan(changes, snapshot)      ← rein, character-apply.ts
                  │
           ApplyOperation[]  ({table, op, match, values})
                  │
                  ▼
        executeApplyPlan(supabase, ops)        ← dünn, ~40 Zeilen
```

**Wiederverwendung / Extraktion aus `import/page.tsx`** (DRY, und der Import bekommt dadurch erstmals Testabdeckung):

- `matchesName()` (`page.tsx:495-506`) → `character-matching.ts`
- `parseImperialHeight()` (`page.tsx:69-75`) → `character-matching.ts`
- Race-Alias-Map (`page.tsx:196-209`) → `character-matching.ts`
- Klassen-Whitelist (`page.tsx:267-284`) und Kit-Whitelist (`page.tsx:303-324`) → `character-matching.ts`
- Fighting-Style-Heuristik (`page.tsx:407-417`) → `character-matching.ts`
- NWP-Normalisierung (`page.tsx:451-463`) und Zauber-Matching (`page.tsx:575-587`) → `character-matching.ts`

**Prompt-Design für gedruckt vs. handschriftlich.** Skalare Felder werden in zwei Blöcke getrennt, Listeneinträge tragen ihre Herkunft am Eintrag (eine Liste lässt sich nicht sinnvoll in zwei Blöcke spalten — ein Item ist entweder da oder nicht):

```jsonc
{
  "printed": { "level": 3, "hpMax": 24 /* vollständiges Schema, wie heute */ },
  "handwritten": { "level": 4 }, // NUR abweichende/ergänzte Felder
  "equipment": [{ "name": "Langschwert +1", "magicBonus": 1, "source": "printed" }],
  "spells": [{ "name": "Invisibility", "level": 2, "source": "handwritten" }],
}
```

`printed` bleibt damit strukturgleich zum heutigen Create-Schema — der Create-Prompt kann dieselbe Feldliste referenzieren.

**Zentrale Typen** (`character-scan-prompt.ts`):

```ts
export type ValueSource = "printed" | "handwritten";
export interface ScannedCharacterFields {
  /* heutiges ScannedCharacter, ohne Listen */
}
export interface ScannedListItem {
  source: ValueSource;
}
export interface ScannedUpdatePayload {
  printed: ScannedCharacterFields;
  handwritten: Partial<ScannedCharacterFields>;
  equipment: (EquipmentItem & ScannedListItem)[];
  spells: (SpellItem & ScannedListItem)[];
  weaponProficiencies: (WeaponProf & ScannedListItem)[];
  nwps: (NwpItem & ScannedListItem)[];
  languages: (LanguageItem & ScannedListItem)[];
}
```

**Prompt ist nicht rein statisch.** Anders als `MONSTER_SCAN_PROMPT` interpoliert der Charakter-Prompt einen Multi-File-Hinweis (`route.ts:125`). Das Modul exportiert deshalb die statischen Teile als Konstanten (für die Integritätstests) **und** einen Builder:

```ts
export const CHARACTER_SCAN_PROMPT: string; // statischer Create-Teil
export const CHARACTER_UPDATE_SCAN_PROMPT: string; // statischer Update-Teil
export const MULTI_FILE_HINT: string;
export function buildCharacterScanPrompt(opts: {
  mode: "create" | "update";
  isMultiFile: boolean;
}): string;
```

**Change-Modell** (`character-diff.ts`):

```ts
export type ChangeCategory = "core" | "lists" | "identity" | "extended";
export type ChangeKind = "scalar" | "list-add" | "list-update" | "list-remove";

export interface ScanChange {
  id: string; // stabil, z.B. "core:level:thief" — React-Key + Test-Selektor
  category: ChangeCategory;
  kind: ChangeKind;
  labelKey: string; // i18n-Key im Namespace "rescan"
  labelParams?: Record<string, string | number>;
  currentValue: unknown; // Stand in der DB
  proposedValue: unknown; // Vorschlag aus dem Scan
  source: ValueSource;
  conflict?: { printed: unknown; handwritten: unknown };
  defaultSelected: boolean;
  noteKey?: string; // Hinweiszeile, z.B. "hpCurrentPlayModeHint"
  target: ChangeTarget; // wohin geschrieben wird (Tabelle + Match)
}

/** Wohin eine Änderung geschrieben wird. Eine Change-Zeile kann mehrere
 *  Tabellen bedienen (siehe Level/XP-Sonderfall unten). */
export interface ChangeTarget {
  writes: Array<{
    table: string;
    field?: string; // bei kind === "scalar"
    rowId?: string; // getroffene Zeile bei list-update/list-remove
    matchKey?: Record<string, string>; // für Upsert-Tabellen, z.B. { class_id: "thief" }
  }>;
}

/** Was die UI an buildApplyPlan() zurückgibt. */
export interface SelectedChange extends ScanChange {
  selected: boolean;
  editedValue?: unknown; // vom Nutzer überschriebener Zielwert; gewinnt über proposedValue
}

/** Eine ausführbare DB-Operation. Bewusst datenhaltig statt Callback,
 *  damit der Plan ohne Supabase-Client assertbar ist. */
export interface ApplyOperation {
  table: string;
  op: "update" | "insert" | "upsert" | "delete";
  onConflict?: string; // für upsert, z.B. "character_id,class_id"
  match?: Record<string, string>;
  values?: Record<string, unknown>;
}
```

`CharacterSnapshot` (der DB-Stand, gegen den gediffed wird) und `MatchCatalogs` (Stammdaten für das Fuzzy-Matching: Waffen, Rüstungen, NWPs, Zauber) werden ebenfalls in `character-diff.ts` definiert und aus den bestehenden Row-Typen in `src/lib/supabase/types.ts` zusammengesetzt.

**Default-Selektion** (Nutzer-Entscheidung, in `character-diff.ts` als Tabelle kodiert):

| Bedingung                                                                        | `defaultSelected` |
| -------------------------------------------------------------------------------- | ----------------- |
| `kind === "list-remove"`                                                         | `false`           |
| Feld `hp_current`                                                                | `false`           |
| `category === "identity"` (Name, Rasse, Klassen-Zusammensetzung, Kit, Gesinnung) | `false`           |
| Feld `notes`                                                                     | `false`           |
| alles Übrige                                                                     | `true`            |

**Konflikt-Auflösung:** Weichen `printed` und `handwritten` für ein Feld ab, entsteht **eine** Change-Zeile mit `source: "handwritten"`, `proposedValue` = handschriftlicher Wert und gefülltem `conflict`. Die UI zeigt beide Werte und einen Umschalter.

**Kategorien-Zuordnung:**

| Kategorie  | Felder                                                                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core`     | `characters.level`/`xp_current`, `character_classes.level`/`xp_current`, `hp_max`, `hp_current`, 6 Attribute + `str_exceptional` + 12 Sub-Stats, `gold_pp/gp/ep/sp/cp` |
| `lists`    | Ausrüstung, Inventar, Zauber, Waffenfertigkeiten, NWPs, Fighting Styles, Sprachen                                                                                      |
| `identity` | `name`, `race_id`, Klassen-Zusammensetzung (Hinzufügen/Entfernen einer Klasse), `kit`, `alignment`                                                                     |
| `extended` | `player_name`, `age`, `gender`, `height_cm`, `weight_kg`, `deity`, `priesthood`, `traits`, `disadvantages`, `notes`                                                    |

**Level/XP-Sonderfall:** `characters.level` und `characters.xp_current` sind Denormalisierungen der primären Klasse (der Import setzt sie aus `resolvedClasses[0]`, `page.tsx:298-300`). Eine Level-Änderung der primären Klasse erzeugt **eine** Change-Zeile, deren `target` beide Tabellen bedient — nicht zwei Zeilen für denselben fachlichen Sachverhalt.

**Betroffene Dateien:**

- `src/lib/scan/`
  - `character-scan-prompt.ts` — **neu**: Typen, `CHARACTER_SCAN_PROMPT` (aus Route extrahiert), `CHARACTER_UPDATE_SCAN_PROMPT`, `parseUpdateScanResponse()`
  - `character-scan-prompt.test.ts` — **neu**: Prompt-Integrität + Parser
  - `character-matching.ts` — **neu**: `matchesName()`, `parseImperialHeight()`, `normalizeRaceId()`, `VALID_CLASS_IDS`, `VALID_KIT_IDS`, `resolveFightingStyleId()`, `normalizeNwpName()`, `matchSpell()`
  - `character-matching.test.ts` — **neu**
  - `character-diff.ts` — **neu**: `buildChangeSet(snapshot, payload): ScanChange[]`
  - `character-diff.test.ts` — **neu**
  - `character-apply.ts` — **neu**: `buildApplyPlan(changes, snapshot): ApplyOperation[]`
  - `character-apply.test.ts` — **neu**
  - `execute-apply-plan.ts` — **neu**: dünner I/O-Layer, `executeApplyPlan(supabase, ops): Promise<ApplyResult>`; gruppiert nach Tabelle, sammelt Fehler statt sie zu verschlucken
- `src/app/api/scan-character/route.ts` — Prompt-Import statt Inline-Literal, `mode`-Parameter, `is_approved`-Check
- `src/app/characters/import/page.tsx` — nutzt extrahierte Matcher (Verhalten unverändert)
- `src/app/characters/[id]/rescan/page.tsx` — **neu**: Server Component, lädt `CharacterSnapshot`
- `src/components/character-rescan/`
  - `rescan-view.tsx` — **neu**: Upload → Scan → Review → Apply (Client)
  - `change-list.tsx` — **neu**: gruppierte Liste, Alle/Keine, Zähler
  - `change-row.tsx` — **neu**: Checkbox + Editor + Quelle + Konflikt-Umschalter
  - `change-list.test.tsx` — **neu**
- `src/components/character-sheet/character-sheet.tsx` — Header-Button „Bogen scannen"
- `messages/de.json`, `messages/en.json` — Namespace `rescan`
- `e2e/character-rescan.spec.ts` — **neu**
- `e2e/pages/rescan.page.ts` — **neu**: Page Object
- `CLAUDE.md` — Projektstruktur + Roadmap

## Performance Considerations

- **Zauber-Katalog:** Das heutige Matching lädt alle 3.200+ Zauber in 1000er-Batches (`page.tsx:550-566`). Beim Rescan wird nur geladen, wenn der Scan überhaupt Zauber liefert, und nur einmal pro Scan (Ergebnis wird an `buildChangeSet` übergeben, nicht in der Schleife nachgeladen).
- **Inserts:** Der Create-Import macht pro Ausrüstungsteil einen einzelnen sequenziellen Insert (`page.tsx:479-544`). `executeApplyPlan()` gruppiert Operationen nach Tabelle und Typ und schickt Bulk-Upserts — bei 20 Änderungen ein Bruchteil der Roundtrips.
- **Snapshot-Laden:** `rescan/page.tsx` lädt dieselben Relationen wie `manage/page.tsx` in einem `Promise.all` (Muster: `manage/page.tsx:47-112`), aber ohne die für den Diff irrelevanten (`xp_history`, `sessions`, `epic_items`).
- **Token-Kosten:** Der Update-Prompt ist länger als der Create-Prompt (zwei Blöcke + `source` pro Listeneintrag). `max_tokens` steigt von 4096 auf 8192, da die Antwort im Update-Modus strukturell größer ist; der `stop_reason === "max_tokens"`-Guard (`route.ts:196-201`) bleibt als Netz.

## Migration Notes

Keine DB-Migration nötig — alle Zieltabellen und Spalten existieren.

Eine bewusste Verhaltensänderung am Bestand: `/api/scan-character` bekommt den `is_approved`-Check, den vergleichbare KI-Routen bereits haben. Nicht freigegebene Nutzer konnten bisher scannen (und API-Tokens verbrauchen), scheiterten aber ohnehin spätestens am `enforce_approval`-Trigger beim Insert. Der Check schließt diese Lücke für Create **und** Update.

---

## Phase 1: Scan-Fundament — Prompt-Modul, Matcher-Extraktion, Route

Extrahiert die verstreuten Prompt- und Matching-Bausteine in testbare Module und erweitert die Route um den Update-Modus. Der Create-Import verhält sich danach exakt wie vorher, ist aber erstmals durch Tests abgedeckt.

**Tasks**:

- [x] `src/lib/scan/character-matching.test.ts` anlegen — Tests zuerst: `matchesName()` (Substring, Token-Match „Axe, hand/throwing" ↔ „Hand Axe", Nicht-Treffer), `parseImperialHeight()` (`5'10"`, `5 ft 10 in`, Müll → 0), `normalizeRaceId()` (`stout_halfling` → `halfling`, unbekannt → unverändert), `resolveFightingStyleId()` (alle 4 Stile + `null`), `normalizeNwpName()` (`Native Languages:`-Präfix, `common`/`native` → übersprungen), `matchSpell()` (Level muss übereinstimmen, DE/EN, beidseitiges `includes`)
- [x] `src/lib/scan/character-matching.ts` implementieren — reine Funktionen, 1:1 aus `import/page.tsx` übernommen, plus `VALID_CLASS_IDS` / `VALID_KIT_IDS` / `RACE_ALIAS_MAP` als exportierte Konstanten
- [x] `src/app/characters/import/page.tsx` auf die extrahierten Funktionen umstellen — lokale Kopien löschen, Verhalten unverändert
- [x] `src/lib/scan/character-scan-prompt.test.ts` anlegen — Prompt-Integrität analog `monster-scan-prompt.test.ts:4-40`: `CHARACTER_UPDATE_SCAN_PROMPT` enthält `"printed"`/`"handwritten"`, fordert `source` pro Listeneintrag, deckt `goldEp`, `languages`, `deity`, `priesthood`, `traits`, `disadvantages`, `notes` ab, verbietet das Ignorieren von Handschrift; `parseUpdateScanResponse()` strippt ```json-Fences, wirft bei ungültigem JSON, ergänzt fehlende Listen als leere Arrays, toleriert fehlendes `handwritten`
- [x] `src/lib/scan/character-scan-prompt.ts` implementieren — Typen (`ValueSource`, `ScannedCharacterFields`, `ScannedUpdatePayload`), `CHARACTER_SCAN_PROMPT` (wortgleich aus `route.ts:120-186`), `CHARACTER_UPDATE_SCAN_PROMPT`, `parseUpdateScanResponse()`
- [x] `src/app/api/scan-character/route.ts` erweitern — Prompt-Konstanten importieren statt inline; `mode`-Feld aus `FormData` (`"create"` default, `"update"`); im Update-Modus `max_tokens: 8192`; `is_approved`-Check nach dem Auth-Guard (Muster `summarize-session/route.ts:16-29`)
  ```ts
  const mode = formData.get("mode") === "update" ? "update" : "create";
  const prompt = mode === "update" ? CHARACTER_UPDATE_SCAN_PROMPT : CHARACTER_SCAN_PROMPT;
  ```

**Automated Verification**:

- [x] `character-matching.test.ts` (Unit) passes
- [x] `character-scan-prompt.test.ts` (Unit) passes
- [x] `import-validation.test.ts` (Unit) passes weiterhin
- [x] `npm run verify` passes

---

## Phase 2: Diff- & Apply-Engine

Dependencies: **Phase 1**

Das Herzstück: zwei reine Module ohne DB- und ohne React-Abhängigkeit. Beide sind vollständig unit-testbar und tragen die gesamte Fachlogik des Features.

**Tasks**:

- [x] `src/lib/scan/character-diff.test.ts` anlegen — Tests zuerst:
  - identischer Wert erzeugt **keine** Change-Zeile
  - skalare Abweichung erzeugt genau eine Zeile mit korrekter `category`
  - `printed` ≠ `handwritten` → eine Zeile, `source: "handwritten"`, `conflict` gefüllt, `proposedValue` = handschriftlicher Wert
  - nur `printed` vorhanden → `source: "printed"`, kein `conflict`
  - `defaultSelected`-Tabelle: `list-remove` false, `hp_current` false, `identity` false, `notes` false, Rest true
  - Ausrüstung: Fuzzy-Treffer → `list-update` mit `currentValue`/`proposedValue` der Menge; kein Treffer → `list-add`; DB-Eintrag ohne Scan-Entsprechung → `list-remove`
  - Zauber: Match nur bei identischer Stufe; bereits bekannter Zauber erzeugt keine Zeile
  - Level der primären Klasse erzeugt **eine** Zeile, deren `target` `characters` und `character_classes` bedient
  - leerer Scan (nichts erkannt) → leeres `ScanChange[]`, kein Crash
  - `null`/fehlende Felder im Payload werden übersprungen, nicht als „Wert gelöscht" interpretiert
- [x] `src/lib/scan/character-diff.ts` implementieren — `buildChangeSet(snapshot: CharacterSnapshot, payload: ScannedUpdatePayload, catalogs: MatchCatalogs): ScanChange[]`; `catalogs` enthält die für Matching nötigen Stammdaten (Waffen, Rüstungen, NWPs, Zauber), damit das Modul DB-frei bleibt
- [x] `src/lib/scan/character-apply.test.ts` anlegen — Tests zuerst:
  - nur ausgewählte Changes landen im Plan
  - vom Nutzer editierter Wert gewinnt über den Scan-Vorschlag
  - Tabellen mit Unique-Constraint → `upsert` mit korrektem `onConflict`
  - `character_equipment`/`character_inventory` → `update` bei getroffener `id`, sonst `insert`
  - `list-remove` → `delete` mit korrekter `id`
  - Level-Change der primären Klasse → zwei Operationen (`characters` + `character_classes`) aus einer Change-Zeile
  - Operationen sind nach Tabelle gruppiert (Bulk statt Einzel-Roundtrips)
  - leere Auswahl → leerer Plan
- [x] `src/lib/scan/character-apply.ts` implementieren — `buildApplyPlan(changes: SelectedChange[], snapshot: CharacterSnapshot): ApplyOperation[]`, rein und DB-frei
- [x] `src/lib/scan/execute-apply-plan.ts` implementieren — `executeApplyPlan(supabase, ops)`: gruppiert Operationen nach `(table, op)` zu Bulk-Calls, sammelt Fehler in `ApplyResult { applied: number; failed: FailedOperation[] }` statt sie wie der Create-Import (`import/page.tsx:387-390`) auf die Konsole zu loggen

**Automated Verification**:

- [x] `character-diff.test.ts` (Unit) passes
- [x] `character-apply.test.ts` (Unit) passes
- [x] `npm run verify` passes

---

## Phase 3: UI — Rescan-Seite, Review-Liste, Einstieg

Dependencies: **Phase 2**

Erst hier wird das Feature für den Nutzer sichtbar. Die UI ist bewusst dünn: sie hält Auswahl- und Editier-State und ruft die Module aus Phase 2.

**Tasks**:

- [x] `messages/de.json` + `messages/en.json` — `import.dropzoneHint` und die hartcodierte Route-Meldung `tooManyFiles` (`route.ts:66`) auf die tatsächliche Grenze 15 korrigieren (heute steht dort „5", während `MAX_FILE_COUNT = 15` gilt)
- [x] `messages/de.json` + `messages/en.json` — Namespace `rescan` anlegen: Titel/Beschreibung, Dropzone (Wiederverwendung der `import`-Keys wo wortgleich), Kategorie-Überschriften (`categoryCore`/`categoryLists`/`categoryIdentity`/`categoryExtended`), Aktionen (`selectAll`, `selectNone`, `applyChanges` mit `{count}`), Quellen-Labels (`sourcePrinted`, `sourceHandwritten`), Konflikt (`conflictHint`, `useprinted`), Hinweise (`hpCurrentPlayModeHint`, `removeHint`), Zustände (`noChanges`, `applying`, `applyFailed` mit `{count}`), sowie Feld-Labels für alle diff-fähigen Felder
- [x] `src/components/character-rescan/change-list.test.tsx` anlegen — Tests zuerst (Muster: `monster-form.test.tsx:1-16`, `next-intl` gemockt): rendert Gruppen mit Zählern; nur `defaultSelected`-Zeilen sind initial angehakt; Toggle ändert den Auswahl-Zähler; „Alle"/„Keine" wirken auf alle Gruppen; Editieren eines Werts ändert den übergebenen Change; Konflikt-Umschalter tauscht `proposedValue` auf den gedruckten Wert; Apply-Button ist bei 0 Auswahl disabled und trägt die Anzahl im Label; leeres Change-Set zeigt `noChanges`
- [x] `src/components/character-rescan/change-row.tsx` implementieren — Checkbox, Label, `currentValue → Editor`, Quellen-Badge (`⌨`/`✎`), Konflikt-Zeile mit Umschalter, optionale Hinweiszeile; `data-testid={`rescan-change-${change.id}`}` plus `-checkbox`/`-input`/`-conflict-toggle`
- [x] `src/components/character-rescan/change-list.tsx` implementieren — Gruppierung nach `category` (aufklappbar, `core` und `lists` initial offen), Kopfzeile mit „N gefunden · M ausgewählt", Alle/Keine, Apply-Button
- [x] `src/app/characters/[id]/rescan/page.tsx` implementieren — Server Component: `requireAuth()`, Charakter laden, `notFound()` wenn nicht vorhanden, Redirect auf `/manage` wenn nicht Owner (Muster: `[id]/page.tsx:30-33`), NPC-Redirect (Muster: `manage/page.tsx:42-45`), Relationen per `Promise.all` als `CharacterSnapshot`
- [x] `src/components/character-rescan/rescan-view.tsx` implementieren — Client: Datei-Upload mit `validateImportFiles()` und dem `URL.createObjectURL`-Cleanup-Muster (`import/page.tsx:103-118`), Scan-Call mit `mode=update`, Stammdaten-Nachladen nur wenn der Scan die jeweilige Liste liefert, `buildChangeSet()`, Auswahl-/Editier-State, `buildApplyPlan()` + `executeApplyPlan()`, `router.push(`/characters/${id}/manage`)`; Teilfehler werden gesammelt und über `applyFailed` angezeigt statt still verschluckt
- [x] `src/components/character-sheet/character-sheet.tsx` — Header-Button „Bogen scannen" (`ScanLine`-Icon aus lucide-react) neben Drucken, nur für `isOwner`, in `ApprovalGate` gewrappt, `data-testid="sheet-rescan-button"`, Link auf `${basePath}/${character.id}/rescan`

**Automated Verification**:

- [x] `change-list.test.tsx` (Komponente) passes
- [x] `npm run verify` passes
- [x] `messages/de.json` und `messages/en.json` haben identische Schlüsselmengen im Namespace `rescan`

**Manual Verification**:

- [ ] Kompletter Happy Path mit einem echten Bogen
  1. Charakterbogen öffnen, „Bogen scannen" klicken
  2. Foto eines Bogens mit handschriftlich korrigierter Stufe/XP hochladen, „Änderungen ermitteln"
  3. Prüfen: Stufe/XP erscheinen unter „Kernwerte" mit `✎`-Badge und Konflikt-Zeile
  4. Prüfen: Entfernungs-Vorschläge, akt. TP, Stammdaten und Notizen sind sichtbar, aber **nicht** angehakt
  5. Einen Wert direkt in der Zeile ändern, eine Zeile abwählen, „Übernehmen"
  6. Auf dem Charakterbogen prüfen: genau die ausgewählten Änderungen sind da, der editierte Wert ist der gespeicherte, die abgewählte Änderung fehlt
- [ ] Bogen ohne Änderungen hochladen → „Keine Änderungen erkannt", kein Apply-Button
- [ ] Ansicht auf 375 px Breite prüfen: Zeilen brechen lesbar um, Editorfelder bleiben bedienbar, keine horizontale Scrollleiste

---

## Phase 4: QA & Dokumentation

Dependencies: **Phase 3**

**Tasks**:

- [x] `e2e/pages/rescan.page.ts` anlegen — Page Object nach dem Muster von `e2e/pages/character-sheet.page.ts`
- [x] `e2e/character-rescan.spec.ts` anlegen — Scan-Response mit `page.route("**/api/scan-character*", ...)` mocken (Muster: `e2e/rulebook-chat.spec.ts:46`), damit der Test deterministisch und ohne API-Kosten läuft. Fälle: Änderungsliste erscheint mit korrekten Default-Häkchen; Abwählen reduziert den Zähler; „Übernehmen" schreibt und leitet auf `/manage` weiter; der geschriebene Wert steht danach im Bogen; Scan ohne Änderungen zeigt `noChanges`; `/characters/[id]/rescan` ohne Login leitet auf `/login` (Muster: `e2e/auth-redirect.spec.ts:39-40`)
- [x] Explorativer Test mit `playwright-cli` gemäß CLAUDE.md Phase 4 — für jeden gefundenen Bug zuerst einen fehlschlagenden Test, dann den Fix
- [x] `CLAUDE.md` aktualisieren — Projektstruktur (`characters/[id]/rescan/`, `components/character-rescan/`, `lib/scan/character-*.ts`), Roadmap-Punkt 20 „Charakterbogen-Rescan", Testzahlen in Tech-Stack
- [x] `docs/agents/research/2026-07-25-character-sheet-rescan-update.md` — Status-Vermerk, dass die dort gelisteten offenen Punkte (fehlender `is_approved`-Check, `gold_ep`, Sprachen, Gottheit/Priesterschaft, Traits, Notizen) durch dieses Feature adressiert wurden

**Automated Verification**:

- [x] `e2e/character-rescan.spec.ts` (E2E) passes
- [x] `npm run test:e2e` passes vollständig (keine Regression in den bestehenden 120+ Tests)
- [x] `npm run verify` passes

**Manual Verification**:

- [ ] Nicht freigegebener Nutzer sieht den „Bogen scannen"-Button nicht und erhält beim direkten Aufruf von `/api/scan-character` einen 403
- [ ] Bestehender Create-Import (`/characters/new` → Importieren) funktioniert unverändert — insbesondere Ausrüstungs-, NWP- und Zauber-Matching nach der Extraktion in Phase 1

---

## References

- Research: `docs/agents/research/2026-07-25-character-sheet-rescan-update.md`
- Prompt-Modul-Vorbild: `src/lib/scan/monster-scan-prompt.ts`, Integritätstest `src/lib/scan/monster-scan-prompt.test.ts:4-40`
- Auswahl-UI-Vorbild: `src/components/master/monster-variant-picker.tsx:32-153`
- Zu extrahierende Logik: `src/app/characters/import/page.tsx:69-75`, `:196-209`, `:267-324`, `:407-417`, `:451-463`, `:495-506`, `:575-587`
- Update-Muster: `src/components/character-sheet/character-sheet.tsx:504-577`
- Snapshot-Ladepfad: `src/app/characters/[id]/manage/page.tsx:47-112`
- Approval-Check-Muster: `src/app/api/summarize-session/route.ts:16-29`
- Komponententest-Muster: `src/components/master/monster-form.test.tsx:1-16`
- E2E-Mocking-Muster: `e2e/rulebook-chat.spec.ts:46`
