---
date: 2026-04-10T17:09:06Z
git_commit: 555f33c10ad9cfc05dad97f164c06ebadd92d5a1
branch: feat/monster-data-completeness
topic: "Monster-Datenmodell vs. Monstrous Manual — Vollständigkeits-Audit"
tags: [research, monsters, bestiary, scan-monster, rulebook-chat, gm-dashboard]
status: complete
---

# Research: Monster-Datenmodell vs. Monstrous Manual — Vollständigkeits-Audit

## Research-Frage

Beim Import/Pflegen von Monstern aus dem offiziellen AD&D 2e Monstrous Manual gehen im Chaos-Forge-Bestiary Informationen verloren. Welche Felder/Strukturen des Monstrous-Manual-Stat-Blocks sind im aktuellen System **nicht vollständig abgebildet** — im DB-Schema, im AI-Import, im Manual-Form und im Rulebook-Chat?

## Zusammenfassung

Das `monsters`-Schema deckt 21 von 22 offiziellen Monstrous-Manual-Stat-Block-Feldern rudimentär ab, enthält aber drei strukturelle Lücken: (1) die **narrativen Abschnitte** „Combat", „Habitat/Society", „Ecology" werden in einer einzigen `description`-Spalte zusammengeklappt statt separat gespeichert, (2) es gibt keinen Mechanismus für **Sub-Varianten** (Orc+Orog, Crocodile+Giant Crocodile, Drachen nach Alter teilen sich im Buch einen Eintrag), und (3) das Feld **NO. APPEARING** fehlt vollständig. Zusätzlich bestehen Typ-Inkonsistenzen zwischen Scan-Prompt (`magic_resistance` als String „Nil"/„20%"), DB-Schema (`INTEGER`), und Form-State. Das manuelle Formular im Bestiary-Panel exponiert nur 15 von 30 MonsterRow-Feldern — die „Fluff"-Felder (climate/terrain, frequency, organization, activity_cycle, diet, intelligence, treasure, alignment, morale-Text, magic_resistance) sind über die UI nicht manuell editierbar, obwohl sie in DB + Scan-Prompt existieren. Der Rulebook-Chat fütter Claude mit einem schmalen Ausschnitt aus nur 11 Monster-Spalten und nutzt keine narrative Beschreibung, was dazu führt, dass der Chat zwar Kampfwerte, aber keine Ökologie-/Habitat-Fragen beantworten kann.

## Quellen gelesen

- `supabase/migrations/00179_monsters_table.sql` (Basis-Schema)
- `supabase/migrations/00181_seed_monsters_core.sql` (176 Seed-Monster, via Sub-Agent)
- `supabase/migrations/00184_monster_images.sql` (image_url + Storage-Bucket)
- `supabase/migrations/00199_monsters_crud.sql` (is_custom, created_by, Write-Policies)
- `src/lib/supabase/types.ts:510-546` (`MonsterRow` Interface)
- `src/app/api/scan-monster/route.ts` (Claude-Vision Prompt + JSON-Schema)
- `src/app/api/rulebook-chat/route.ts` (Monster-Kontext-Injection)
- `src/app/master/actions.ts:997-1194` (CRUD Server-Actions)
- `src/components/master/master-bestiary-panel.tsx:200-1599` (Inline-Form, Scan-Handler, Display)
- `ressources/monsters/Monstrous Manual.pdf` (Stichprobe S. 1-3 + 50-55, via Sub-Agent)

## Detaillierte Befunde

### 1. Datenmodell: `monsters` Tabelle

Migration `00179_monsters_table.sql:4-52` definiert das Schema. Nach 00184 + 00199 hat die Tabelle **34 Spalten**:

| Spalte                      | Typ                            | Quelle | Zweck                                                    |
| --------------------------- | ------------------------------ | ------ | -------------------------------------------------------- |
| `id`                        | `UUID PK`                      | 00179  | Primary Key                                              |
| `name`                      | `TEXT NOT NULL`                | 00179  | Deutscher Name                                           |
| `name_en`                   | `TEXT`                         | 00179  | Englischer Name                                          |
| `climate_terrain`           | `TEXT`                         | 00179  | MM-Feld „Climate/Terrain"                                |
| `frequency`                 | `TEXT DEFAULT 'common'`        | 00179  | MM-Feld „Frequency"                                      |
| `organization`              | `TEXT`                         | 00179  | MM-Feld „Organization"                                   |
| `activity_cycle`            | `TEXT`                         | 00179  | MM-Feld „Activity Cycle"                                 |
| `diet`                      | `TEXT`                         | 00179  | MM-Feld „Diet"                                           |
| `intelligence`              | `TEXT`                         | 00179  | MM-Feld „Intelligence" (Wort + Range)                    |
| `treasure`                  | `TEXT`                         | 00179  | MM-Feld „Treasure" (Code-String)                         |
| `alignment`                 | `TEXT`                         | 00179  | MM-Feld „Alignment"                                      |
| `ac`                        | `INTEGER NOT NULL`             | 00179  | Armor Class                                              |
| `movement`                  | `TEXT NOT NULL`                | 00179  | Bewegungs-String inkl. Modi                              |
| `hit_dice`                  | `TEXT NOT NULL`                | 00179  | HD-String („3+3", „1/2")                                 |
| `hit_dice_value`            | `NUMERIC NOT NULL`             | 00179  | Numerischer HD-Wert für Sortierung/Filter                |
| `thac0`                     | `INTEGER NOT NULL`             | 00179  | THAC0                                                    |
| `attacks_per_round`         | `TEXT NOT NULL DEFAULT '1'`    | 00179  | Anzahl Angriffe (Text!)                                  |
| `damage`                    | `TEXT NOT NULL`                | 00179  | Schaden-String                                           |
| `special_attacks`           | `TEXT`                         | 00179  | Special Attacks (Frei-Text)                              |
| `special_defenses`          | `TEXT`                         | 00179  | Special Defenses (Frei-Text)                             |
| `magic_resistance`          | `INTEGER DEFAULT 0`            | 00179  | MR in Prozent                                            |
| `size`                      | `TEXT CHECK IN (T/S/M/L/H/G)`  | 00179  | Size-Kategorie (ohne Text-Ergänzung!)                    |
| `morale`                    | `TEXT NOT NULL`                | 00179  | Moral-Text („Steady (11-12)")                            |
| `morale_value`              | `INTEGER NOT NULL`             | 00179  | Moral-Minimum                                            |
| `xp_value`                  | `INTEGER NOT NULL`             | 00179  | XP                                                       |
| `default_zone`              | `TEXT CHECK IN (melee/ranged)` | 00179  | Simulator-Feld: initiale Distanz                         |
| `has_ranged_attack`         | `BOOLEAN DEFAULT FALSE`        | 00179  | Simulator-Feld                                           |
| `typical_spells`            | `JSONB DEFAULT '[]'`           | 00179  | Spell-Namen für Simulator                                |
| `source_book`               | `TEXT DEFAULT 'MM'`            | 00179  | Quellenbuch                                              |
| `description`               | `TEXT`                         | 00179  | **Freitext — Einzelfeld für ALLE narrativen Abschnitte** |
| `description_en`            | `TEXT`                         | 00179  | Englische Version                                        |
| `image_url`                 | `TEXT`                         | 00184  | Monster-Bild                                             |
| `is_custom`                 | `BOOLEAN DEFAULT FALSE`        | 00199  | GM-angelegt vs Seed                                      |
| `created_by`                | `UUID → auth.users`            | 00199  | Ersteller                                                |
| `created_at` / `updated_at` | `TIMESTAMPTZ`                  | 00179  | Timestamps                                               |

Zusätzliche Indizes auf `name`, `name_en`, `hit_dice_value`, `xp_value`. RLS: SELECT für alle authentifizierten (00179), INSERT/UPDATE/DELETE für alle authentifizierten seit 00199 (GM verwendet effektiv Service-Role über `createServiceClient`).

### 2. TypeScript-Typ: `MonsterRow`

`src/lib/supabase/types.ts:510-546` spiegelt das Schema 1:1. Abweichungen zum Schema:

- `attacks_per_round` ist `string` (matcht TEXT-Spalte), wird aber im Form als `String(Number)` behandelt.
- `magic_resistance` ist `number` (matcht INTEGER), kollidiert aber mit dem Scan-Prompt, der String liefert (s.u.).
- `typical_spells` ist als `string[] | null` typisiert, obwohl Schema-Default `'[]'::jsonb NOT NULL` ist.

### 3. Scan-Monster API-Flow

`src/app/api/scan-monster/route.ts` akzeptiert bis zu 5 Dateien (JPG/PNG/WebP/GIF/PDF, max 10 MB einzeln, 20 MB aggregiert). Bilder werden via `sharp` auf 1568px reduziert, PDFs als `document`-Content-Block direkt an Claude übergeben. Modell: `claude-haiku-4-5-20251001` (default) oder `claude-sonnet-4-20250514` (preciseMode).

Der Prompt (Zeilen 144-191) verlangt genau dieses JSON-Schema:

```json
{
  "name", "name_en",
  "climate_terrain", "frequency", "organization", "activity_cycle",
  "diet", "intelligence", "treasure", "alignment",
  "ac", "movement", "hit_dice", "hit_dice_value", "thac0",
  "attacks_per_round", "damage",
  "special_attacks", "special_defenses", "magic_resistance",
  "size", "morale", "morale_value", "xp_value",
  "description",
  "has_ranged_attack", "typical_spells", "default_zone"
}
```

**Prompt-Gaps gegenüber MM:**

1. `magic_resistance` wird im Prompt-Beispiel als String `"Nil"` geliefert, Schema erwartet `INTEGER`. Bei Nicht-Nil („20%") müsste Claude den Prozentwert als Zahl zurückgeben — ist so nicht spezifiziert. → beim Insert fällt der Wert im Zweifel auf `null` bzw. provoziert Type-Error.
2. **Keine narrativen Sections**: Der Prompt sammelt alles in ein einzelnes `description`-Feld. Combat/Habitat/Ecology werden nicht getrennt extrahiert.
3. **Kein `no_appearing`** — Feld fehlt im Prompt UND im Schema.
4. **Kein `description_en`** — wird im Prompt nicht angefragt, obwohl Schema-Spalte existiert.
5. **Kein `source_book`** — Scan setzt default „Custom" (siehe `createMonsterGm:1096`) statt die im Scan erkennbare Buch-Info.
6. **Keine Sub-Varianten**: Bei Mehrspalten-Einträgen (Orc+Orog, Crocodile+Giant Crocodile) gibt der Prompt keine Anweisung, wie mehrere Stat-Blöcke zurückgegeben werden sollen — Claude muss eine Variante raten.
7. **Size-Parenthetical verloren**: MM schreibt „M (6' tall)". Prompt akzeptiert nur `size: "M"`, das Größen-Detail fällt weg.
8. **Morale-Text vs -Value**: `morale` als String + `morale_value` als Zahl ist im Prompt korrekt.

### 4. Manual Form im Bestiary-Panel

`src/components/master/master-bestiary-panel.tsx` enthält das gesamte Bestiary-UI als **einzige Datei** (1599 Zeilen). Es gibt **keine separaten Dialog-Komponenten**. Die Create-Form (Zeilen 330-627) exponiert folgende Felder manuell:

| Form-Feld                | DB-Spalte           | Typ                                    | Required |
| ------------------------ | ------------------- | -------------------------------------- | -------- |
| `monsterName`            | `name`              | text                                   | ja       |
| `monsterNameEn`          | `name_en`           | text                                   | nein     |
| `monsterAC`              | `ac`                | number                                 | ja       |
| `monsterTHAC0`           | `thac0`             | number                                 | ja       |
| `monsterHD`              | `hit_dice`          | text (+ auto-parse → `hit_dice_value`) | ja       |
| `monsterXP`              | `xp_value`          | number                                 | ja       |
| `monsterMovement`        | `movement`          | text                                   | nein     |
| `monsterAttacks`         | `attacks_per_round` | text                                   | nein     |
| `monsterDamage`          | `damage`            | text                                   | ja       |
| `monsterSize`            | `size`              | select T/S/M/L/H/G                     | ja       |
| `monsterMoralValue`      | `morale_value`      | number                                 | ja       |
| `monsterSpecialAttacks`  | `special_attacks`   | text                                   | nein     |
| `monsterSpecialDefenses` | `special_defenses`  | text                                   | nein     |
| `monsterDescription`     | `description`       | textarea                               | nein     |
| `monsterUploadImage`     | `image_url`         | file upload                            | nein     |

**Nicht manuell editierbar über die UI (aber im DB-Schema + Scan-Prompt vorhanden):**

`climate_terrain`, `frequency`, `organization`, `activity_cycle`, `diet`, `intelligence`, `treasure`, `alignment`, `morale` (der Text-Teil, nur `morale_value` ist editierbar), `magic_resistance`, `has_ranged_attack`, `default_zone`, `typical_spells`, `source_book`, `description_en`.

Diese Felder werden vom Scan-Handler (`handleAIImport:212-265`) automatisch in den Form-State gesetzt, sind dann aber für den GM **nicht mehr sichtbar oder korrigierbar**, weil kein Input gerendert wird. Ein Tippfehler/Halluzination im Scan kann also nicht mehr vom Menschen korrigiert werden.

`MonsterUpdatePayload` (`actions.ts:1111-1144`) erlaubt dagegen sehr wohl Updates auf alle „Fluff"-Felder — die Whitelist ist breit. Das heißt: **die Update-Aktion könnte die Felder setzen, aber das Form-UI bietet sie nicht an**.

### 5. Display im Bestiary-Panel

**MonsterCard (Grid)** (`master-bestiary-panel.tsx:879-1028`): Bild, Name, AC/HD/THAC0, XP, Size, MR %, Description-Preview (1 Zeile).

**MonsterListView (Tabelle)** (`:1032-1215`): Name, AC, HD, THAC0, Movement, Size, XP, Add-to-Combat-Button.

**MonsterDetailModal** (`:1219-1599`): Vollbild-Bild, AC/HD/THAC0/Movement, Attacks/Damage, Special Attacks/Defenses, `typical_spells`, UND eine „Secondary stat table" (`:1550-1562`), die alle Felder außerhalb der `PROMOTED_KEYS` (Zeilen 89-99) als Key/Value-Liste anzeigt — darunter climate/terrain, frequency, organization, activity_cycle, diet, intelligence, treasure, alignment, morale.

→ **Read-only** werden die Fluff-Felder also angezeigt, nur Create/Edit ist gesperrt. Der MonsterDetailModal zeigt die `description` als zusammenhängenden Block; Combat/Habitat/Ecology sind nicht als Abschnitte erkennbar (auch nicht in Seed-Daten — siehe unten).

### 6. Seed-Daten

`supabase/migrations/00181_seed_monsters_core.sql` seedet **176 Monster** (13 INSERT-Statements à ~11 Rows). Alle Kern-Felder inkl. climate/terrain, organization, activity_cycle, diet, intelligence, treasure, alignment sind befüllt. **Die `description`-Spalte enthält einen einzelnen Paragraphen** — keine Combat/Habitat/Ecology-Substruktur. Beispielrow Kobold (via Sub-Agent verifiziert):

```
climate_terrain: 'Jedes/Unterirdisch'
organization:    'Stamm'
activity_cycle:  'Nacht'
diet:            'Allesfresser'
intelligence:    'Durchschnittlich'
treasure:        'J,O'
alignment:       'LE'
description:     'Kleine, reptilienartige Humanoide, die in unterirdischen
                  Höhlen leben und für ihre tödlichen Fallen bekannt sind.'
```

Zwischen 00182 und 00209 gibt es **keine weiteren** Monster-Seed-Migrationen und keine Schema-Alter auf `monsters` außer den zwei genannten (00184, 00199).

### 7. Rulebook-Chat Monster-Kontext

`src/app/api/rulebook-chat/route.ts:96-147` injiziert Monster-Daten in den Claude-Prompt, wenn die User-Frage Monster-Namen enthält:

- **Matching-Logik**: Splittet Message an Whitespace/Kommata, nimmt Wörter ≥ 4 Zeichen, erste 5, baut OR-Filter `name.ilike.%w%,name_en.ilike.%w%` mit `limit(3)`.
- **Selektierte Spalten** (Zeile 110-113, 11 Felder): `name, name_en, ac, hit_dice, thac0, damage, special_attacks, special_defenses, magic_resistance, movement, xp_value`.
- **Fehlend im Chat-Kontext**: climate_terrain, frequency, organization, activity_cycle, diet, intelligence, treasure, alignment, size, morale, **description**, `attacks_per_round`.

Das System-Prompt (`route.ts:7-19`, Punkt 9) erwähnt „Wenn Monster/Kreaturen-Daten bereitgestellt werden, nutze diese für taktische Hinweise" — dem Modell fehlen aber schlicht die Daten für Lebensraum-, Gesellschafts- oder Ökologie-Fragen. Der gesamte narrative Block des Buchs erreicht Claude nie.

Das Matching ist außerdem sprachabhängig: Bei Suche nach „Kobold" auf Deutsch funktioniert es (passendes `name`), bei „Kobolds" scheitern das `ilike` am Plural-„s" nicht, aber z.B. „Banshees" matcht nichts, weil DB-Name „Banshee" hat und die Sub-Query trimmt kein Plural-S.

### 8. Gap-Analyse: MM-Feld → Chaos-Forge-Status

| MM-Feld                       | Schema | Scan-Prompt | Manual-Form        | Display (Detail) | Chat-Kontext | Anmerkung                                                           |
| ----------------------------- | ------ | ----------- | ------------------ | ---------------- | ------------ | ------------------------------------------------------------------- |
| Climate/Terrain               | ✅     | ✅          | ❌                 | ✅ ro            | ❌           | Nur über Scan setzbar                                               |
| Frequency                     | ✅     | ✅          | ❌                 | ✅ ro            | ❌           | DEFAULT 'common' — Fluff-Feld                                       |
| Organization                  | ✅     | ✅          | ❌                 | ✅ ro            | ❌           |                                                                     |
| Activity Cycle                | ✅     | ✅          | ❌                 | ✅ ro            | ❌           |                                                                     |
| Diet                          | ✅     | ✅          | ❌                 | ✅ ro            | ❌           |                                                                     |
| Intelligence                  | ✅     | ✅          | ❌                 | ✅ ro            | ❌           | TEXT-Freiform, keine strukturierte Range                            |
| Treasure                      | ✅     | ✅          | ❌                 | ✅ ro            | ❌           | Letter-Codes als String; keine Auflösung auf DMG-Tabelle            |
| Alignment                     | ✅     | ✅          | ❌                 | ✅ ro            | ❌           |                                                                     |
| **No. Appearing**             | ❌     | ❌          | ❌                 | ❌               | ❌           | **Feld fehlt komplett**                                             |
| Armor Class                   | ✅     | ✅          | ✅                 | ✅               | ✅           |                                                                     |
| Movement                      | ✅     | ✅          | ✅                 | ✅               | ✅           | String — keine Aufteilung nach Modus (walk/fly/swim)                |
| Hit Dice                      | ✅     | ✅          | ✅                 | ✅               | ✅           | `parseHitDiceValue()` bei manueller Eingabe                         |
| THAC0                         | ✅     | ✅          | ✅                 | ✅               | ✅           |                                                                     |
| No. of Attacks                | ✅     | ✅          | ✅                 | ✅               | ❌           | TEXT-Spalte, Scan liefert Number                                    |
| Damage/Attack                 | ✅     | ✅          | ✅                 | ✅               | ✅           |                                                                     |
| Special Attacks               | ✅     | ✅          | ✅                 | ✅               | ✅           |                                                                     |
| Special Defenses              | ✅     | ✅          | ✅                 | ✅               | ✅           |                                                                     |
| Magic Resistance              | ⚠️     | ⚠️          | ❌                 | ✅ ro            | ✅           | **Typ-Mismatch**: Schema `INTEGER`, Scan liefert String „Nil"/„20%" |
| Size                          | ✅     | ✅          | ✅                 | ✅               | ❌           | Nur Kategorie-Code, Parenthetical („6' tall") verloren              |
| Morale                        | ⚠️     | ✅          | nur `morale_value` | ✅ ro            | ❌           | Text nicht editierbar                                               |
| XP Value                      | ✅     | ✅          | ✅                 | ✅               | ✅           |                                                                     |
| **Einleitungstext**           | ⚠️     | ⚠️          | ✅                 | ✅               | ❌           | Teilt sich `description` mit Combat/Habitat/Ecology                 |
| **Combat (Sektion)**          | ❌     | ❌          | ❌                 | ❌               | ❌           | **Nicht strukturiert gespeichert**                                  |
| **Habitat/Society (Sektion)** | ❌     | ❌          | ❌                 | ❌               | ❌           | **Nicht strukturiert gespeichert**                                  |
| **Ecology (Sektion)**         | ❌     | ❌          | ❌                 | ❌               | ❌           | **Nicht strukturiert gespeichert**                                  |
| **Sub-Varianten**             | ❌     | ❌          | ❌                 | ❌               | ❌           | **Kein Mechanismus** — siehe Abschnitt 9                            |
| Source Book                   | ✅     | ❌          | ❌                 | ✅ ro            | ❌           | Scan setzt hart „Custom"                                            |
| description_en                | ✅     | ❌          | ❌                 | ✅ ro            | ❌           | Schema existiert, niemand füllt es                                  |

Legende: ✅ vorhanden, ❌ fehlt, ⚠️ teilweise/problematisch, „ro" = read-only (Display ja, Edit nein).

### 9. Sub-Varianten-Problem

Das Monstrous Manual fasst **im selben Eintrag** häufig mehrere verwandte Kreaturen zusammen:

- **Orc + Orog** (zwei Spalten nebeneinander, gemeinsamer Ökologie-/Society-Text)
- **Crocodile + Giant Crocodile** (via PDF-Stichprobe bestätigt, S. 50-55)
- **Crustacean: Giant Crab + Giant Crayfish**
- **Dragons nach Alter** (bis zu 12 Alters-Kategorien pro Drachenart)
- **Titan** (drei Kategorien je nach Macht — Image #5/6)

Aktueller Zustand: Jede Variante muss als **separate Row** in `monsters` angelegt werden. Es gibt:

- keine `parent_monster_id` Foreign Key
- keine `variant_name` Spalte
- keinen gemeinsamen Narrativ-Text, der für alle Varianten gilt
- keinen UI-Mechanismus, um Varianten einander zuzuordnen

Folgen: (a) Der Scan-Prompt muss sich für **eine** Variante entscheiden (oder halluziniert), weil das JSON-Schema genau eine Row liefert. (b) Ein GM, der Orc und Orog manuell anlegen will, pflegt den Ökologie-Text zweimal oder einmal und verliert ihn beim anderen. (c) Für Drachen müsste er 12 identische Kopien mit leicht unterschiedlichen Stats anlegen.

### 10. Typ-/Semantik-Inkonsistenzen

- `magic_resistance INTEGER DEFAULT 0` + Scan liefert String. Beim Insert (`actions.ts:1090`) wird `monsterData.magic_resistance || null` geschrieben — bei String „Nil" wäre das falsy, bei „20%" truthy aber für eine Integer-Spalte ungültig. Die Seed-Daten enthalten hier vermutlich `0` oder `NULL`, echte Werte nicht verifiziert.
- `attacks_per_round TEXT DEFAULT '1'` — Spalte ist TEXT, aber viele Monster haben nur eine Zahl. Scan-Prompt liefert Number, Form speichert wieder String via `String(data.attacks_per_round ?? 1)`.
- `typical_spells JSONB DEFAULT '[]' NOT NULL` im Schema, aber Type `string[] | null` im Interface — `null` ist eigentlich nicht möglich.
- `description` ist einzelnes TEXT — mit den MM-Narrativ-Sektionen als einzige Quelle wird dieses Feld semantisch überladen.

### 11. Bestehende Daten & Migrations-Risiken

**Was in der Produktions-DB liegen könnte** (kann nicht aus dem Repo abgeleitet werden, nur aus Seed-Migrations):

- 176 Seed-Monster mit befüllten Fluff-Feldern und **einzeiligen Beschreibungen**.
- Zusätzliche GM-angelegte Monster (`is_custom=true`, seit 00199) — unbekannte Zahl, unbekannter Pflegezustand.
- Hochgeladene Monster-Bilder im `monster-images` Storage-Bucket.

**Risiken für Schema-Änderungen:**

- Hinzufügen neuer Nullable-Spalten (`combat_tactics`, `habitat_society`, `ecology`, `no_appearing`, `variant_of_id`, `variant_name`) ist unkritisch, Defaults = NULL.
- Das Aufteilen der bestehenden `description`-Texte auf drei Sub-Sektionen ist **nicht automatisch migrierbar** — die Seed-Texte sind einzeilige Zusammenfassungen, kein strukturierter MM-Text. Eine Backfill-Strategie wäre nötig oder die Daten bleiben im Intro-Feld.
- Bestehende Scans landen weiterhin in `description` — nur der Scan-Prompt müsste erweitert werden, um Combat/Habitat/Ecology getrennt anzufragen.
- `magic_resistance`-Spaltentyp zu ändern (z.B. auf TEXT oder auf `NUMERIC NULL`) würde bestehende `0`-Defaults treffen. Alternative: Spalte lassen, Scan-Prompt auf Number zwingen.
- RLS-Policies (00199) erlauben bereits INSERT/UPDATE/DELETE für alle authentifizierten — neue Spalten erben das automatisch, kein RLS-Handling nötig.
- Der Rulebook-Chat selektiert aktuell `.select("name, name_en, ac, ...")` — eine Erweiterung um narrative Spalten ist rein additiv, bricht nichts.

### 12. Code-Flow: Scan → Speichern → Anzeige → Chat

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ GM lädt Bild/PDF│ ──▶ │ handleAIImport   │ ──▶ │ /api/scan-monster   │
│ im Bestiary-UI  │     │ (panel.tsx:212)  │     │ (route.ts:35)       │
└─────────────────┘     └──────────────────┘     └──────────┬──────────┘
                                                             │
                                             Claude Vision   │
                                             (Haiku/Sonnet)  ▼
                                                ┌─────────────────────┐
                                                │ JSON Response       │
                                                │ (28 Felder, keine   │
                                                │  narrative sections)│
                                                └──────────┬──────────┘
                                                           │
                                                           ▼
                                         ┌────────────────────────────┐
                                         │ setMonsterForm (panel:232) │
                                         │ — setzt aber nur 23 Felder │
                                         │   der MonsterRow           │
                                         └──────────────┬─────────────┘
                                                        │
                                                        ▼
                              ┌───────────────────────────────────────┐
                              │ Manual Form (Review) — rendert aber   │
                              │ nur 15 Felder; Fluff-Felder unsichtbar│
                              └──────────────┬────────────────────────┘
                                             │
                                             ▼
                                  ┌─────────────────────────┐
                                  │ createMonsterGm          │
                                  │ (actions.ts:1062)        │
                                  │ INSERT mit Whitelist →   │
                                  │ source_book='Custom'     │
                                  └──────────────┬───────────┘
                                                 │
                                                 ▼
                                      ┌──────────────────┐
                                      │ monsters table   │
                                      └────────┬─────────┘
                                               │
                             ┌─────────────────┼─────────────────┐
                             │                 │                 │
                             ▼                 ▼                 ▼
                   ┌──────────────┐   ┌────────────────┐  ┌──────────────┐
                   │ Grid Card    │   │ List View      │  │ Detail Modal │
                   │ (AC/HD/THAC0)│   │ (Kern-Stats)   │  │ (alle Felder │
                   │              │   │                │  │  read-only)  │
                   └──────────────┘   └────────────────┘  └──────────────┘

                             und parallel:

┌────────────────┐      ┌──────────────────────┐      ┌────────────────┐
│ User fragt     │ ──▶ │ /api/rulebook-chat   │ ──▶ │ embedQuery +   │
│ Chat: „Wie     │      │ (route.ts:36)        │      │ match_rulebook │
│ tauche ich auf │      │                      │      │ _chunks (RAG)  │
│ Kobold ein?"   │      └──────────┬───────────┘      └────────┬───────┘
└────────────────┘                 │                           │
                                   ▼                           ▼
                      ┌──────────────────────────┐    ┌────────────────┐
                      │ Monster-ilike-Search auf │    │ PDF-Chunks aus │
                      │ name/name_en (11 Felder, │    │ Regelbüchern   │
                      │ limit 3)                 │    │                │
                      └──────────┬───────────────┘    └────────┬───────┘
                                 │                             │
                                 └──────────────┬──────────────┘
                                                ▼
                                     ┌──────────────────────┐
                                     │ Claude Sonnet        │
                                     │ — sieht Stats + RAG- │
                                     │   Chunks, aber KEINE │
                                     │   description-Felder │
                                     └──────────────────────┘
```

## Code-Referenzen

- `supabase/migrations/00179_monsters_table.sql:4-52` — Schema-Definition
- `supabase/migrations/00181_seed_monsters_core.sql` — 176 Seed-Rows (einzeilige Descriptions)
- `supabase/migrations/00184_monster_images.sql:2-24` — image_url + Storage-Bucket + Policies
- `supabase/migrations/00199_monsters_crud.sql:2-26` — is_custom, created_by, Write-Policies
- `src/lib/supabase/types.ts:510-546` — `MonsterRow` Interface
- `src/app/api/scan-monster/route.ts:144-191` — Claude-Prompt JSON-Schema
- `src/app/api/scan-monster/route.ts:135` — Modellwahl (Haiku default, Sonnet in Precise Mode)
- `src/app/api/rulebook-chat/route.ts:96-147` — Monster-Kontext-Injection
- `src/app/api/rulebook-chat/route.ts:110-113` — 11-Felder-Select
- `src/app/master/actions.ts:1062-1107` — `createMonsterGm` Insert-Whitelist
- `src/app/master/actions.ts:1109-1144` — `MonsterUpdatePayload` Update-Whitelist (breiter als Create-Form!)
- `src/app/master/actions.ts:1146-1155` — `updateMonsterGm`
- `src/app/master/actions.ts:1188-1194` — `deleteMonsterGm`
- `src/app/master/actions.ts:999-1031` — `uploadMonsterImage`
- `src/components/master/master-bestiary-panel.tsx:212-265` — `handleAIImport` Form-State-Mapping (23 Felder)
- `src/components/master/master-bestiary-panel.tsx:342-627` — Inline Create-Form (15 Felder)
- `src/components/master/master-bestiary-panel.tsx:89-99` — `PROMOTED_KEYS` (Felder, die prominent im Detail-Modal erscheinen)
- `src/components/master/master-bestiary-panel.tsx:1219-1599` — `MonsterDetailModal` Display

## Offene Fragen an den User

1. **Narrative Sektionen getrennt oder zusammen?** Soll Combat/Habitat/Ecology als **drei separate Spalten** (`combat_tactics`, `habitat_society`, `ecology`) gespeichert werden, oder als **strukturiertes JSONB** mit freien Sektions-Keys (z.B. für Monster mit „Psionics Summary" o.ä.)? Drei Spalten sind einfacher, JSONB flexibler.
2. **Sub-Varianten-Modell**: (a) Eigene Tabelle `monster_variants` mit FK zu `monsters`, (b) Self-Reference `variant_of_id` + `variant_name` in derselben Tabelle, (c) ein Monster mit Array/JSONB von Stat-Blocks? Variante (b) ist am kleinsten, Variante (a) sauberster Normalisierung.
3. **Bilinguale Narrative**: Müssen Combat/Habitat/Ecology ebenfalls `_en` Varianten haben wie `description`? Bisher wird `description_en` im Code nie gefüllt — ist das Feld nur altlast oder echter Anforderung?
4. **Seed-Backfill**: Die 176 Seed-Monster haben einzeilige Descriptions. Sollen wir (a) diese bestehen lassen und nur neue Scans in die Sektions-Spalten schreiben, (b) die Seeds per Nachmigration aufwerten (viel Arbeit, evtl. via erneutem Scan des MM-PDFs?), oder (c) komplette Re-Seed von den wichtigsten Monstern?
5. **`no_appearing` aufnehmen?** Es ist eigentlich ein wichtiges GM-Feld („2d4 in Pack") — soll es neu eingeführt werden?
6. **`magic_resistance` Typ**: Umstellen auf TEXT (damit „Nil" echt gespeichert werden kann) oder bei INTEGER bleiben und Scan-Prompt strenger machen (0 für Nil, 20 für „20%")?
7. **Chat-Integration**: Soll der Rulebook-Chat bei Monster-Matches zusätzlich zur Stat-Zeile auch die narrativen Sektionen (Combat/Habitat/Ecology) mit-injizieren? Das Token-Budget ist 2048 max_tokens Output, aber Input-Context ist reichlich vorhanden.
8. **Scan-Prompt Sub-Varianten**: Akzeptieren wir, dass der Scan nur eine Variante pro Aufruf liefert, oder soll der Prompt ein Array zurückgeben dürfen und der GM wählt welche gespeichert werden?
9. **Manual-Form Erweiterung**: Sollen die Fluff-Felder (climate/terrain, frequency, organization, activity_cycle, diet, intelligence, treasure, alignment, morale-Text, magic_resistance) **im Create-Form** sichtbar werden, oder nur **im Edit-Modus**? (Ich habe keine dedizierte Edit-UI gefunden — ist Edit aktuell überhaupt aus dem Panel erreichbar?)
10. **Treasure-Codes auflösen?** MM nutzt DMG-Tabellen-Buchstaben („L, M, N (Q×10)"). Optional könnten wir ein Tooltip/Popover bauen, das die Buchstaben in tatsächliche Schatzverteilungen auflöst — wäre aber ein eigenes Feature (DMG-Tabellen müssten ebenfalls erfasst werden).

---

## Follow-up Research (2026-04-10, Nachmittag)

**Zusatzfragen des Users:**

1. Wie gehen wir mit den **bestehenden Daten** um, damit sie den neuen Vorgaben entsprechen?
2. Wie schaffen wir **einheitliche Monster-Bilder** vom Layout her?

### 13. Bestandsaufnahme der Monster-Bildpipeline

Im Repo existieren **drei parallele Bild-Quellen** für Monster — jede mit anderem visuellen Stil. Sie sind alle als `scripts/*.ts` untracked im git-Status:

#### 13.1 Pipeline A: Open5e-Download (`scripts/seed-monster-images.ts`)

- 110 handgepflegte DE→Slug-Mappings (`NAME_TO_SLUG`, Zeilen 20-136) für bekannte Monster.
- Lädt PNGs von `https://api.open5e.com/static/img/object_illustrations/open5e-illustrations/monsters/<slug>.png`.
- Nur Monster ohne `image_url` (Zeile 155).
- Upload nach `monster-images` Bucket als `${monsterId}.png`.
- **Stil-Problem**: Open5e-Illustrationen stammen aus verschiedenen CC-Lizenzen (mehrere Künstler, verschiedene Techniken, unterschiedliche Rahmen/Hintergründe, Portrait vs. Full-Body vs. Action-Pose). **Kein einheitlicher Look.**

#### 13.2 Pipeline B: Gemini-Generierung (`scripts/generate-monster-images.ts`)

- Modell: `gemini-3.1-flash-image-preview` (Zeile 52), **nicht** Imagen 4.0 wie der Rest der App (`src/lib/gemini/generate-image.ts:15` nutzt `imagen-4.0-generate-001`).
- Prompt-Builder (`buildPrompt`, Zeilen 22-47) kombiniert:
  - Size-Label („tiny"/„small"/„medium-sized"/„large"/„huge"/„gargantuan")
  - `description.slice(0, 150)` (also nur der Anfang der einzeiligen Seed-Beschreibung)
  - Stil-Keywords: „Classic AD&D 2nd Edition art style. Dark, atmospheric painting with dramatic lighting. Pen-and-ink with watercolor style. Square composition, centered subject. No text, no labels, no watermarks, no borders."
- Verarbeitet alle Monster, überschreibt vorhandene Bilder (`upsert: true`).
- Rate-Limit: 5s Pause, 60s bei 429.
- **Stil-Problem #1**: Keine feste Seed, daher variiert Gemini bei jedem Lauf in Komposition, Perspektive, Hintergrund und Farbstimmung.
- **Stil-Problem #2**: Kein post-processing via `sharp` — die Original-Gemini-Ausgabe kann verschiedene Aspect-Ratios, Ränder, Wasserzeichen-ähnliche Artefakte enthalten.
- **Hardcoded API-Key** in Zeile 15 — Security-Issue (sollte aus ENV kommen).
- **Stil-Problem #3**: Der Prompt nutzt nur die Kurzbeschreibung; bei den Seed-Monstern fehlt dadurch visueller Kontext.

#### 13.3 Pipeline C: SVG-Avatar-Fallback (`scripts/seed-monster-avatars.ts`)

- Rein generative SVGs: Buchstabe + Größen-Icon + hash-basierte HSL-Farbe.
- Wird als Fallback verwendet, wenn `image_url` fehlt oder aus Open5e stammt (Zeile 77: `m.image_url.includes("open5e")`).
- Upload als `${monsterId}.svg`.
- **Einheitlich in sich**, aber stilistisch komplett anders als Bild-Pipelines A/B — wirkt im Detail-Modal wie ein Platzhalter.

#### 13.4 Wie ist der aktuelle Bestand zusammengesetzt?

Ohne Live-DB-Zugriff lässt sich die exakte Verteilung nicht bestimmen, aber aus der Code-Logik folgt die wahrscheinliche Reihenfolge der Ausführung:

1. `seed-monster-images.ts` lief zuerst (setzt für ~110 Monster ein Open5e-PNG)
2. `seed-monster-avatars.ts` füllt die Lücken + ersetzt Open5e-Einträge (siehe `includes("open5e")` Filter)
3. `generate-monster-images.ts` läuft ad-hoc/manuell und überschreibt (upsert=true) die SVGs mit Gemini-Bildern

Erwartete Verteilung **im Storage-Bucket `monster-images`**:

- Mischung aus `.png` (Open5e) + `.svg` (Fallback) + `.png` (Gemini)
- Dateiname = `${monsterId}.<ext>` — **die Extension ist nicht konsistent**, d.h. ein Monster kann zwei Objekte haben (`abc123.png` und `abc123.svg`), je nachdem welches Script zuletzt lief.

#### 13.5 `monster-card.tsx` / `MonsterDetailModal`-Rendering

Im Display-Code (`master-bestiary-panel.tsx:879-1028`) wird `m.image_url` per `<img>` eingebunden. Es gibt keinen clientseitigen Layout-Normalizer (kein object-fit crop auf fixe Größe, keine einheitliche Border, keine Fallback-Farbe). Alles was der Storage liefert, wird 1:1 angezeigt.

### 14. Bestandsaufnahme der existierenden Monster-Daten

Ohne Live-DB-Zugriff lassen sich folgende Aussagen über `monsters`-Rows treffen:

**Seed-Anteil (deterministisch aus 00181_seed_monsters_core.sql):**

- **176 Monster** (Sub-Agent-Zählung)
- `is_custom = false` (Default vor 00199)
- `description`: **einzelner Satz oder kurzer Paragraph**, nie strukturiert
- `description_en`: **leer** (in 00181 nicht befüllt, in keinem Code je geschrieben)
- `source_book`: Default `'MM'`
- Fluff-Felder vollständig: climate_terrain, frequency, organization, activity_cycle, diet, intelligence, treasure, alignment — alles **auf Deutsch**, z.T. mit Abkürzungen wie „LE" für Alignment oder „J,O" für Treasure
- `typical_spells`: Default `'[]'::jsonb`
- `image_url`: wurde nachträglich durch eines der drei Scripts gesetzt — Verteilung offen

**Custom-Anteil (seit 00199, unbekannte Menge):**

- `is_custom = true`
- `source_book = 'Custom'` (siehe `createMonsterGm:1096`)
- `created_by = <auth.users.id>`
- Narrative-Qualität variabel: entweder (a) manuell eingetippt in die `description`-Textarea, (b) via AI-Import aus User-Bildern extrahiert, oder (c) leer
- Fluff-Felder: bei Scan befüllt, bei manueller Anlage leer (Form bietet sie nicht)
- Kann im Zweifel auch schon Sub-Varianten-Duplikate enthalten, die der GM zweimal angelegt hat

**Was wir wollen, dass da am Ende steht:**

- Getrennte Sektionen (intro, combat, habitat*society, ecology) — \_wenn* wir das als Datenmodell-Entscheidung treffen
- `no_appearing` korrekt gesetzt
- `source_book` bei Seed-Monstern weiterhin `'MM'`, aber bei Scan-Import künftig aus dem Prompt (nicht hart „Custom")
- Einheitliche Bildlayouts
- Sub-Variant-Relationen (wenn Entscheidung für Parent-Child-Modell fällt)

### 15. Handlungsoptionen für Daten-Backfill

Die folgenden Optionen sind **nicht exklusiv** — eine sinnvolle Lösung kombiniert mehrere.

#### Option A — Defensive Migration (nur Schema)

**Was passiert:** Neue Spalten `intro_text`, `combat_tactics`, `habitat_society`, `ecology`, `no_appearing` (+ ggf. `variant_of_id`, `variant_name`) werden als NULLABLE hinzugefügt. Die bestehende `description` bleibt unverändert.

**Migrationsschritt:**

```sql
ALTER TABLE monsters
  ADD COLUMN intro_text TEXT,
  ADD COLUMN combat_tactics TEXT,
  ADD COLUMN habitat_society TEXT,
  ADD COLUMN ecology TEXT,
  ADD COLUMN no_appearing TEXT;

-- Kopiere bestehende description in intro_text, damit Display nicht leer wird
UPDATE monsters SET intro_text = description WHERE intro_text IS NULL;
```

**Vorteile:**

- Risiko nahe null — additive Migration, idempotent, kein Datenverlust
- Bestehende UI (Detail-Modal zeigt `description`) bleibt funktionsfähig
- Neuer Scan-Prompt kann ab sofort getrennt in die neuen Felder schreiben

**Nachteile:**

- Die 176 Seed-Monster bleiben inhaltlich unverändert — sie haben weiterhin nur den einen einzeiligen Intro-Text, KEIN echtes Combat/Habitat/Ecology.
- GM sieht bei den Seed-Monstern in den neuen Sektionen nur Leere.

#### Option B — Batch-Reprocessing via Monstrous Manual PDF

**Was passiert:** Ein einmaliges Script scannt jeden der 176 Seed-Monster erneut, diesmal aus dem Original-PDF (`ressources/monsters/Monstrous Manual.pdf`), und füllt die neuen Felder.

**Implementations-Pfad:**

1. **Seitennummern-Index**: Ein Mapping `name → page_range` wird benötigt. Optionen:
   - (a) **Manuelles Mapping** (einmalig ~176 Einträge), weil MM alphabetisch ist — schneller als gedacht.
   - (b) **Automatisiertes Indexing**: Ein Pre-Script, das jeden PDF-Seite an Claude Haiku gibt („welche Monster stehen auf dieser Seite?") und einen Index baut. Kostet einmalig ~N Haiku-Calls (N = MM-Seitenzahl ~400), dann gecached.
2. **Re-Scan pro Monster**: Pro Monster die relevante(n) PDF-Seite(n) via Claude Vision extrahieren und in ein erweitertes JSON-Schema mit getrennten Feldern mappen. Nutzt denselben `/api/scan-monster`-Endpunkt (oder eine neue Script-Variante ohne HTTP-Wrapper).
3. **Merge-Strategie**: Das neue Scan-Ergebnis ersetzt nur Felder, die _vorher_ leer oder offensichtlich inkorrekt waren — bestehende `name`, `name_en`, `ac`, `hit_dice` etc. bleiben unangetastet (oder werden nur per Dry-Run-Diff-Report vorgeschlagen).
4. **Safety Net**: Ein Backup der `monsters`-Tabelle als JSON-Dump vor dem Lauf (analog zu `chaos-forge-backup-2026-04-07.sql`, den du schon hast).

**Vorteile:**

- Einmaliger, reproduzierbarer Prozess → alle Seed-Monster bekommen vollständige Sektionen in hoher Qualität
- PDF ist die gleiche Quelle, aus der die Seed-Daten ursprünglich stammen → inhaltlich konsistent
- Kann gleich alle anderen Lücken mitfüllen (description_en, `no_appearing`, genaueres `magic_resistance`, `size`-Parenthetical)

**Nachteile:**

- Aufwand: Das Seitennummern-Mapping ist die Kernarbeit. Option 1a ist ~2h manuelle Arbeit, 1b ist automatisierbar aber erfordert einen kleinen Indexing-Durchgang (dauert ~20 min Claude-Zeit + API-Kosten).
- LLM-Halluzinations-Risiko — Dry-Run mit Stichprobe-Review zwingend.
- Legal: Die Seed-Descriptions sind bereits kurze Paraphrasen — die neuen Sektions-Texte müssen ebenfalls paraphrasiert werden, keine wörtlichen MM-Zitate (vorhandenes Pattern, siehe 00181 Seed).

#### Option C — Lazy Backfill beim GM-Zugriff

**Was passiert:** Beim Öffnen eines Monster-Detail-Modals prüft die UI, ob narrative Sektionen fehlen, und bietet einen Button „Details aus Regelbuch nachladen". Der Button triggert den PDF-Scan für genau dieses eine Monster.

**Vorteile:**

- Null Vorab-Aufwand, keine Batch-Processing-Sessions
- GM entscheidet selbst, welche Monster aufgewertet werden (die wirklich gespielten zuerst)
- Kosten entstehen on-demand

**Nachteile:**

- Langfristig inkonsistenter Datenbestand
- Der Rulebook-Chat hat lange Zeit unvollständigen Kontext
- Seitennummern-Mapping brauchen wir trotzdem (ohne Page-Hint müsste Claude das ganze PDF durchsuchen → teuer/langsam)

#### Option D — Verwerfen & neu seedeen

**Was passiert:** Die 176 Seed-Monster werden per Migration gelöscht und ein neues 0021x-Seed aus einem frischen Bulk-PDF-Scan ersetzt sie.

**Vorteile:**

- Komplett sauberer Zustand, kein Merge-Code nötig
- Alle Monster haben dieselbe Datenqualität

**Nachteile:**

- **Zerstört** die Bilder-Zuordnung: image_url zeigt auf `${monsterId}.png`, neue Monster haben neue UUIDs → alle Bilder müssen neu zugeordnet werden (nach `name` joinen, dann image_url übertragen — machbar aber fummelig)
- Zerstört Bookmarks (`monster_bookmarks`-Tabelle, falls sie FK-referenzieren — muss geprüft werden)
- Zerstört etwaige Custom-Monster-Referenzen in Combat-Simulator-Historie
- Riskanter und irreversibler als B

#### Empfohlene Kombination (zur Diskussion, keine Plan-Entscheidung)

**A + B + manueller Review:**

1. Migration A (defensiv, sofort mergebar)
2. Script B mit Dry-Run-Modus (schreibt in Staging-Tabelle oder JSON-Dump)
3. GM reviewt Stichprobe von ~20 Monstern
4. Nach Freigabe: Commit der Staging-Daten in Production

Custom-Monster werden **nicht angefasst** — sie bleiben wie sie sind, der GM pflegt sie selbst über das neue Edit-Formular nach.

### 16. Handlungsoptionen für einheitliche Monster-Bilder

#### 16.1 Warum ist der aktuelle Bestand nicht einheitlich?

Zusammengefasst aus Abschnitt 13:

1. **Drei Pipelines**, drei visuelle Stile (Open5e, Gemini, SVG-Fallback)
2. Auch innerhalb Pipeline B schwankt Gemini-Output stark (keine Seed, keine Reference)
3. Kein Post-Processing (kein einheitliches Resize, kein konsistenter Hintergrund, kein Frame)
4. Dateiformat mixed (`.png` + `.svg`), Größen schwanken

#### 16.2 Option E — Einheitlicher Master-Prompt + Bulk-Regeneration

**Was passiert:** Ein neues Script ersetzt ALLE bestehenden Monster-Bilder durch Imagen-4.0-generierte Portraits mit identischen Stil-Parametern.

**Master-Stil (Vorschlag):**

- **Composition**: Square 1:1, exakt `1024×1024`, Subject centered, shoulders/torso oder Full-Body je nach Monster-Size
- **Background**: Einheitlich dunkel, matte schwarze oder tiefblaue Vignette, keine Landschaften oder Szenen (damit alle Monster wie Studio-Portraits wirken)
- **Lighting**: Dramatic side-light from upper-left, soft rim-light
- **Technique**: Painted digital art (kein Photorealistic, kein Anime, kein Line-Art-Only)
- **Palette**: Muted earth tones + single jewel accent (class/creature appropriate)
- **Frame**: Keine Bilderrahmen, keine Texte, keine Wasserzeichen, keine Ränder
- **Negative**: „no text, no labels, no borders, no frame, no watermarks, no UI elements"

**Prompt-Schema (Skizze):**

```
STYLE_MONSTER = "Dark fantasy creature portrait, painted digital art, classic
AD&D 2nd Edition illustration style, muted earth tones with single jewel
accent, dramatic side lighting from upper left, matte black vignette
background, square 1:1 composition, centered subject, no text, no labels,
no borders, no frame, no watermarks"

monsterPrompt(m) => `${STYLE_MONSTER}. ${sizeLabel} ${m.name_en ?? m.name}:
${m.intro_text.slice(0, 200)}. ${m.combat_tactics?.slice(0, 100) ?? ''}`
```

**Wichtige Bausteine:**

1. **Modell**: `imagen-4.0-generate-001` (wie `src/lib/gemini/generate-image.ts`) — liefert konsistentere Ergebnisse als Flash-Preview, bessere Control-Parameter
2. **Post-Processing**: Immer durch `sharp` → resize `1024×1024` cover, `.webp({ quality: 85 })` → garantiert gleiches Format, gleiche Größe, gleiche Extension
3. **Storage-Migration**: Alte `${id}.png` / `${id}.svg` löschen (`storage.remove`), neu als `${id}.webp` hochladen. Dadurch verschwinden Altlasten (Pipeline A/B/C-Residuen).
4. **Rate-Limit**: Imagen ist langsamer/teurer als Flash-Preview → 176 Monster × ~2s = ~6 min + ggf. Retry-Pausen. Kostenmäßig überschaubar (Imagen 4.0 ~$0.04/Bild → ~$7 für den ganzen Bestand).
5. **Kontext-Qualität**: **DIES SETZT AUF OPTION B AUF** — wenn wir erst die narrativen Sektionen haben, hat der Prompt mehr Kontext und die Ergebnisse sehen passender aus. Reihenfolge also: Daten-Backfill → Bild-Regeneration.

**Vorteile:**

- Einheitlicher Look über den gesamten Bestand
- Ein einziges Dateiformat/Größe → UI kann feste `object-fit: cover` Container zeichnen
- Altlasten (Open5e-Fremdstile, SVG-Platzhalter) verschwinden sauber
- Bei neuen GM-Monstern: gleicher Master-Prompt → automatisch passendes Bild

**Nachteile:**

- Kosten ~$7 einmalig + ~$0.04/neuem Monster
- Manche aktuelle Open5e-Bilder sind ggf. „besser" als was Imagen liefern wird (bekannte Kunstwerke) — aber Ziel ist ja Einheitlichkeit über Erkennbarkeit
- Bei gewollt coolen Bildern muss der GM Override-Upload haben (hat er: `uploadMonsterImage`)

#### 16.3 Option F — Nur Layout-Normalizer in der UI

**Was passiert:** Kein Script, stattdessen rendert die UI alle bestehenden Bilder durch einen einheitlichen Container: fixe Square-Box, `object-fit: cover`, gleicher dunkler Background-Blur hinter dem Bild, einheitlicher Frame-Overlay.

**Vorteile:**

- Null Kosten, null Scripts, null DB-Änderungen
- Reversibel (nur CSS)

**Nachteile:**

- **Behebt den Grund nicht**: Open5e-Bilder haben Cartoon-Stil, Gemini hat Aquarell-Stil, SVG-Fallbacks haben Icon-Stil — ein Frame-Overlay kann das nicht verbergen
- Die Mischung wirkt weiterhin unruhig, auch wenn der Rahmen einheitlich ist

#### 16.4 Option G — Kombination E + F + Upload-Guidelines

**Was passiert:**

1. Option E (Master-Prompt + Bulk-Regeneration) wird einmalig ausgeführt
2. Option F (UI-Container-Normalizer) wird als Safety-Net implementiert, damit auch manuell hochgeladene GM-Bilder halbwegs einheitlich wirken
3. Im Upload-Dialog erscheint eine Anzeige „Empfohlen: quadratisch, dunkler Hintergrund, painted Fantasy-Stil" + Auto-Sharp-Post-Processing (Crop to 1024×1024, Compress to WebP)
4. Für Custom-Monster gibt es einen Button „Bild aus Master-Stil generieren" direkt im Form

**Das ist die technisch vollständigste Lösung.**

### 17. Abhängigkeiten zwischen den Handlungsoptionen

```
┌─────────────────────────────────────────────────┐
│ Schema-Migration (Option A)                     │
│ neue Spalten + description→intro_text Copy      │
└────────────────────────┬────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│ Scan-Prompt erweitern                           │
│ (ins neue Schema mit getrennten Sektionen)      │
│ + magic_resistance als Number                   │
│ + source_book aus Quelle                        │
└────────────────────────┬────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
┌─────────────┐ ┌──────────────┐ ┌────────────────┐
│ Manual-Form │ │ Update-Form  │ │ Chat-Kontext   │
│ erweitern   │ │ als echter   │ │ um Narrative   │
│ (Fluff-     │ │ Edit-Dialog  │ │ erweitern      │
│  Felder)    │ │              │ │                │
└─────────────┘ └──────────────┘ └────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│ Batch-Reprocessing 176 Seed-Monster (Option B)  │
│ via Monstrous Manual PDF → füllt neue Spalten   │
└────────────────────────┬────────────────────────┘
                         │
                         ▼ (brauchen Kontext für bessere Bilder)
┌─────────────────────────────────────────────────┐
│ Bild-Bulk-Regeneration (Option E)               │
│ Master-Prompt + Imagen 4.0 + sharp → .webp      │
└────────────────────────┬────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│ UI-Layout-Normalizer (Option F)                 │
│ + Upload-Guidelines im GM-Form                  │
└─────────────────────────────────────────────────┘
```

### 18. Bestehende Daten: Migrations-Risiken im Detail

- **`description`-Kopie nach `intro_text`**: Risikoarm, solange `intro_text` vor dem Kopieren NULL ist. Idempotent machbar durch `WHERE intro_text IS NULL`.
- **Löschen alter Storage-Objekte** (bei Option E): Supabase-Storage-Deletes sind nicht transactional mit DB-Updates. Reihenfolge: (1) Neues Bild hochladen unter neuem Pfad, (2) DB-Row auf neue URL updaten, (3) alten Pfad löschen. Falls Schritt 3 fehlschlägt → Orphans im Storage (aufräumbar per nachgelagertem Cleanup-Script).
- **Parallele Custom-Monster des GM**: Alle Backfill-Scripts MÜSSEN nach `is_custom = false` filtern, sonst überschreiben sie GM-Arbeit.
- **`source_book`-Update**: Nur bei `is_custom = false` — bei Seed-Monstern weiterhin „MM", bei Custom-Monstern bleibt „Custom" oder wird aus Scan übernommen.
- **Sub-Varianten-Erkennung**: Wenn wir uns für Parent-Child-Relation entscheiden (Offene Frage #2), braucht das Backfill-Script eine Heuristik, um z.B. „Weißer Drache (Jung)" und „Weißer Drache (Erwachsen)" als Varianten derselben Basis-Kreatur zu erkennen. Kandidaten: regex auf Namensklammern, manuelles Mapping, oder LLM-unterstütztes Matching. **Risiko**: Fehlzuordnungen wären chaotisch rückgängig zu machen → lieber zunächst ohne automatisches Merging, GM macht das von Hand im neuen Edit-UI.
- **Bookmarks und Combat-Historie**: Unbekannte Dependencies. Vor Backfill prüfen: `SELECT table_name FROM information_schema.columns WHERE column_name LIKE '%monster_id%'`. Alle FK auf `monsters.id` dürfen beim Backfill nicht brechen — Option A/B/E lassen IDs unangetastet, daher safe. Option D ist das einzige Risiko (siehe 15.Option D).

### 19. Zusätzliche offene Fragen (Follow-up)

11. **Welche Backfill-Option für narrative Sektionen?** A (nur Migration), A+B (Migration + PDF-Reprocessing), A+C (Migration + Lazy), oder A+B+C (alles)?
12. **Manuelles vs. automatisiertes Seitennummern-Mapping für Option B?** 2h Handarbeit vs. ~20min LLM-Indexing mit Verifikation.
13. **Bild-Regeneration zeitnah oder erst später?** Entweder als Teil desselben Features mit-ausliefern, oder als eigener Folge-PR nach der Daten-Migration?
14. **Custom-Monster: einheitliches Bild automatisch generieren?** Soll der „Create Monster"-Button nach dem Speichern automatisch Imagen aufrufen (Kosten pro Monster ~$0.04), oder nur auf Knopfdruck?
15. **Alte Bilder löschen oder behalten?** Beim Bulk-Regenerate alten `${id}.png`/`${id}.svg` im Storage löschen (sauber) oder nur `image_url` in DB updaten und alte Files als Orphans lassen (sicherer bei Rollback)?
16. **Welches Zielformat?** `.webp` (kleiner, moderner) oder `.png` (universeller)? Die App lädt beides, `.webp` wäre ~50% kleiner → besser für Vercel-Bandbreite im Free-Tier.
17. **Wie behandeln wir Custom-Monster mit GM-Upload?** Nicht durch Regenerate anfassen (hat `is_custom=true` als Filter), aber durch den UI-Normalizer abdecken (Option F)?
18. **SVG-Fallbacks (`seed-monster-avatars.ts`) komplett abschaffen?** Sobald alle Monster ein echtes Bild haben, kann das Script weg — oder bleibt es als Notfall-Fallback für Bilder-Generate-Fehler?

---

## Getroffene Entscheidungen (2026-04-10, Abend)

Nach zwei Research-Iterationen und einer externen Quellen-Evaluation (completecompendium.com / decheine/complete-compendium) hat der User folgende Entscheidungen getroffen. Diese Entscheidungen sind bindend für die Plan-Phase.

### Globale Vorgaben

- **Metrisches System**: Alle Imports (Compendium-Parser, Scan-API, manuelle Form), gespeicherte Texte und Chat-Antworten verwenden durchgehend m, cm, km, kg. Imperial-Werte in Quelldaten werden bei der Extraktion konvertiert.
- **Primärquelle für Backfill**: `github.com/decheine/complete-compendium` — HTML-Snapshot wird lokal geparst. Das Monstrous-Manual-PDF bleibt als Referenz, wird aber nicht mehr per Claude Vision gescannt.
- **Rechtsprofil**: User akzeptiert Fair-Use-Profil (private Gruppe ≤10 Nutzer, nicht kommerziell, bestehendes Rechtsprofil bleibt gleich). Migrations-Header vermerkt die Herkunft.

### Datenmodell

| #   | Frage                  | Entscheidung                 | Konsequenz                                                                                                            |
| --- | ---------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | Narrative-Spalten      | **(a)** 4 dedizierte Spalten | `intro_text`, `combat_tactics`, `habitat_society`, `ecology`                                                          |
| 2   | Sub-Varianten          | **(b)** Self-Reference       | `variant_of_id UUID REFERENCES monsters(id)` + `variant_name TEXT`                                                    |
| 3   | Bilingual              | **(c)** Hybrid               | DB nur DE; EN-Originale als Snapshot-JSON in `ressources/compendium-snapshot/`; `description_en` aus Schema entfernen |
| 4   | `no_appearing`         | **(a)** Ja                   | Neue TEXT-Spalte                                                                                                      |
| 5   | `magic_resistance` Typ | **(a)** INTEGER bleibt       | Parser cast „Nil" → 0, „30%" → 30                                                                                     |
| 7   | `source_book`          | **(b)** Primärquelle         | Aus TSR-Produkt-ID-Lookup (Compendium) bzw. Scan-Erkennung; Fallback „Custom"; keine Multi-Book-Spalte                |

### Import & Backfill

| #   | Frage                  | Entscheidung                                            | Konsequenz                                                                                                                                              |
| --- | ---------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11  | Import-Scope           | **(a)** Matches + **alle Monster aus Monstrous Manual** | Parser filtert `<p class="tsr">` auf die MM-Produkt-ID; keine Annuals, keine anderen Settings-Bücher                                                    |
| 12  | Snapshot-Speicherung   | **(b)** Extrahierter Snapshot                           | `ressources/compendium-snapshot/` mit nur MM-HTMLs + `data/all_tsr.json`; ein `scripts/extract-compendium-snapshot.ts` baut ihn aus einem Shallow-Clone |
| 13  | Übersetzungsansatz     | **(b)** Claude Sonnet 4 + AD&D-Glossar                  | System-Prompt enthält ~40 Fachbegriffe (THAC0, Trefferwürfel, Rettungswurf, Heimtücke, Untote vertreiben, …) + Vorgabe metrische Einheiten              |
| 6   | Scan-API Sub-Varianten | **(b)** Array erlauben                                  | Claude liefert `{ variants: [...] }`, UI zeigt Auswahl, verknüpft per `variant_of_id` (unabhängig vom Compendium-Import)                                |

### UI / UX

| #   | Frage          | Entscheidung                      | Konsequenz                                                                                                           |
| --- | -------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 9   | Edit-UI        | **(c)** Gemeinsamer `MonsterForm` | Create + Edit teilen Component; Fluff- und Narrative-Felder in Collapsible „Erweiterte Details"                      |
| 10  | Treasure-Codes | **(b)** Statische Legende         | Lookup-Map ~25 Buchstaben → Kurzbeschreibung; Tooltip im Detail-Modal                                                |
| 8   | Chat-Kontext   | **(c)** Volle narrative Sektionen | Rulebook-Chat injiziert intro/combat/habitat/ecology (pro Sektion truncate auf ~800 Zeichen) zusätzlich zu den Stats |

### Bilder (separater Folge-PR)

| #   | Frage                    | Entscheidung                         | Konsequenz                                                                                    |
| --- | ------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------- |
| 14  | Timing                   | **(b)** Eigener Folge-PR             | PR 1 = Daten, PR 2 = Bilder (nach Merge von PR 1)                                             |
| 15  | Custom-Monster Auto-Bild | **(b)** Auf Knopfdruck               | Button „Bild generieren" im MonsterForm                                                       |
| 16  | Alte Storage-Objekte     | **(a)** Löschen                      | Sequence pro Monster: Upload neu → DB-URL update → altes Objekt `storage.remove`              |
| 17  | Format                   | **(b)** WebP                         | Konsistent mit `src/lib/gemini/generate-image.ts:29`                                          |
| 18a | Custom beim Bulk         | **(a)** Hart filtern                 | `WHERE is_custom = false`                                                                     |
| 18b | SVG-Fallback             | **(b)** Script weg, Component bleibt | `seed-monster-avatars.ts` löschen; Fallback als `<MonsterAvatarFallback />` in React erhalten |

### Hinfällig

- **Frage 12 (alt) — Seitennummern-Mapping für PDF**: entfällt komplett, da Compendium die Daten strukturiert liefert.
- **PDF-Reprocessing-Script via Claude Vision**: entfällt komplett, ersetzt durch lokalen HTML-Parser.
