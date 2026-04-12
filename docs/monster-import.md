# Monster-Import-Pipeline

Dokumentation des einmaligen Backfill-Prozesses, mit dem alle 353 Monstrous-Manual-Monster (+ Monstrous Compendium I/II) in die Chaos Forge DB importiert, übersetzt und bebildert wurden.

## Übersicht

```
┌─────────────────────┐    ┌──────────────────┐    ┌──────────────────────┐
│ 1. Snapshot          │ →  │ 2. Parse          │ →  │ 3. Backfill          │
│ extract-compendium-  │    │ parse-compendium  │    │ backfill-monsters-   │
│ snapshot.ts          │    │ .ts               │    │ from-compendium.ts   │
│                      │    │                   │    │                      │
│ Shallow-Clone von    │    │ HTML → JSON       │    │ Match gegen          │
│ decheine/complete-   │    │ (Stat-Block +     │    │ bestehende 176       │
│ compendium, filtere  │    │ 4 Narrative-      │    │ Seed-Monster,        │
│ nach MM TSR-IDs,     │    │ Sektionen)        │    │ fehlende Felder      │
│ extrahiere HTML +    │    │                   │    │ ergänzen, neue       │
│ GIF-Bilder           │    │ Imperial→Metrisch │    │ Monster anlegen      │
└─────────────────────┘    │ via convertImpe-  │    │                      │
                            │ rialText()        │    │ --dry-run / --apply  │
                            └──────────────────┘    └──────────────────────┘
                                     ↓                        ↓
                            parsed.json              DB: monsters-Tabelle
                                     ↓
                    ┌──────────────────────┐    ┌──────────────────────┐
                    │ 4. Translate          │    │ 5. Images            │
                    │ translate-monster-    │    │ ingest-monster-      │
                    │ narrative.ts          │    │ images.ts +          │
                    │                      │    │ generate-missing-    │
                    │ Claude Sonnet 4 mit   │    │ monster-images.ts    │
                    │ AD&D-Fachbegriffs-   │    │                      │
                    │ Glossar, batcht 4    │    │ GIF → WebP Upload,   │
                    │ Sektionen pro        │    │ fehlende via Gemini  │
                    │ Monster              │    │ Imagen generieren    │
                    └──────────────────────┘    └──────────────────────┘
                             ↓                           ↓
                    translated.json              Supabase Storage:
                             ↓                   monster-images/{id}.webp
                    DB: monsters (DE Narrative)
```

## Schritt-für-Schritt

### 1. Compendium-Snapshot extrahieren

```bash
npx tsx scripts/extract-compendium-snapshot.ts
```

- Shallow-Clone von `github.com/decheine/complete-compendium`
- Filtert HTML-Dateien aus `harvester/cmm/` deren `<p class="tsr">`-Tag die Monstrous-Manual-Produkt-IDs enthält (TSR 2140, 2102, 2103)
- Kopiert `data/all_tsr.json` für den Buch-Lookup
- Output: `ressources/compendium-snapshot/mm/` (353 HTMLs + 325 GIFs)
- Committed im Repo (~20 MB)

### 2. HTML parsen

```bash
npx tsx scripts/parse-compendium.ts
```

- Liest alle HTML-Files aus `ressources/compendium-snapshot/mm/`
- Extrahiert pro Monster:
  - Alle Stat-Block-Felder (AC, HD, THAC0, Movement, etc.)
  - 4 Narrative-Sektionen: Intro, Combat, Habitat/Society, Ecology
  - Monster-Key (Dateiname → Lookup-ID)
- Konvertiert Imperial-Werte in Narrativ-Texten zu Metrisch via `convertImperialText()` aus `src/lib/utils/units.ts`
- Output: `ressources/compendium-snapshot/parsed.json`
- Deterministisch, testbar mit Fixture-HTML (`scripts/parse-compendium.test.ts`)

### 3. Merge & Backfill in DB

```bash
# Dry-Run: zeigt was passieren würde
npx tsx scripts/backfill-monsters-from-compendium.ts --dry-run

# Wirklich schreiben
npx tsx scripts/backfill-monsters-from-compendium.ts --apply
```

- Matcht die 176 bestehenden Seed-Monster über `name_en` gegen den `monster_key` aus parsed.json
- Manuelle Override-Map für Sonderfälle (z.B. "Beholder" → "beholder")
- Ergänzt fehlende Narrative-Spalten und `no_appearing`
- Legt neue Monster-Rows für MM-Monster an, die noch nicht existieren
- Deutsche Namen zunächst leer (`name = name_en`), Narrative englisch
- Diff-Report unter `ressources/compendium-snapshot/backfill-diff.md`

### 4. Narrative übersetzen

```bash
npx tsx scripts/translate-monster-narrative.ts
```

- Claude Sonnet 4 mit AD&D-Fachbegriffs-Glossar im System-Prompt (~40 Begriffe):
  - THAC0 → ETW0, Hit Dice → Trefferwürfel, Saving Throw → Rettungswurf
  - Backstab → Heimtücke, Turn Undead → Untote vertreiben
  - Alle Maßeinheiten metrisch (m, kg)
- Batcht 4 Sektionen (intro_text, combat_tactics, habitat_society, ecology) pro Monster
- Output: `ressources/compendium-snapshot/translated.json`
- Apply-Step committet in DB nach Review
- Testbar: `scripts/translate-monster-narrative.test.ts`

### 5. Monster-Bilder

```bash
# Schritt 5a: Compendium-GIFs importieren
npx tsx scripts/ingest-monster-images.ts

# Schritt 5b: Fehlende Bilder via Gemini Imagen generieren
npx tsx scripts/generate-missing-monster-images.ts
```

**5a — GIF-Import:**

- Matcht Compendium-GIFs gegen Monster in der DB via `monster_key`
- Konvertiert GIF → WebP (Client-Side via Canvas oder Sharp)
- Upload nach Supabase Storage: `monster-images/{monster_id}.webp`
- Report: `ressources/compendium-snapshot/image-ingest-report.md`

**5b — Fehlende Bilder generieren:**

- Für Monster ohne Bild nach dem GIF-Import
- Google Gemini Imagen 4 mit dem Monster-Intro-Text als Beschreibung
- Gleicher Upload-Pfad: `monster-images/{monster_id}.webp`
- Report: `ressources/compendium-snapshot/gemini-generation-report.md`

## Schema-Erweiterungen (Migration 00211+)

Neue Spalten auf `monsters`:

| Spalte            | Typ           | Beschreibung                                                 |
| ----------------- | ------------- | ------------------------------------------------------------ |
| `intro_text`      | TEXT          | Einleitender Beschreibungstext (ersetzt altes `description`) |
| `combat_tactics`  | TEXT          | Kampftaktiken und -besonderheiten                            |
| `habitat_society` | TEXT          | Lebensraum und Gesellschaftsstruktur                         |
| `ecology`         | TEXT          | Ökologische Rolle und Interaktionen                          |
| `no_appearing`    | TEXT          | Typische Gruppengröße (z.B. "2d4")                           |
| `variant_of_id`   | UUID FK(self) | Eltern-Monster bei Sub-Varianten (z.B. Orog → Orc)           |
| `variant_name`    | TEXT          | Name der Variante (z.B. "Orog")                              |

## AI-Import im GM-Dashboard

Neben dem einmaligen Backfill können Monster auch einzeln via AI importiert werden:

1. GM klickt "KI-Import (Foto/PDF)" im Bestiary-Panel
2. Optional: Settings-Cog aktiviert **Precise Mode** (Claude Sonnet statt Haiku — langsamer, genauer)
3. Upload von Foto/Scan/PDF einer Monster-Stat-Block-Seite
4. `/api/scan-monster` sendet Bilder an Claude Vision, bekommt `{ variants: ScannedMonsterVariant[] }` zurück
5. Bei 1 Variante: MonsterForm öffnet sich pre-filled
6. Bei mehreren Varianten (z.B. Orc + Orog auf einer Seite): MonsterVariantPicker zeigt alle, GM wählt aus
7. Ausgewählte Varianten werden als Monster-Rows angelegt, optional mit `variant_of_id`-Verknüpfung

## Verwandte Dateien

- Research: `docs/agents/research/2026-04-10-monster-data-completeness.md`
- Plan: `docs/agents/plans/2026-04-10-monster-data-completeness.md`
- Snapshot-README: `ressources/compendium-snapshot/README.md`
- Scan-Prompt: `src/lib/scan/monster-scan-prompt.ts`
- MonsterForm: `src/components/master/monster-form.tsx`
- MonsterVariantPicker: `src/components/master/monster-variant-picker.tsx`
- Bestiary-Panel: `src/components/master/master-bestiary-panel.tsx`
- Treasure-Codes: `src/lib/utils/treasure-codes.ts`
- Imperial→Metrisch: `src/lib/utils/units.ts` (`convertImperialText()`)
