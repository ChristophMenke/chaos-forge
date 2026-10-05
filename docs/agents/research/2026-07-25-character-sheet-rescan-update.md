---
date: 2026-07-25T09:01:41+00:00
git_commit: 3294b768a0d0f62fcf62e2a429cf9ac20020502a
branch: feat/isolde-epic-items-shadowdancer-ring
topic: "Charakterbogen-Scan zum Aktualisieren eines bestehenden Charakters — Bestandsaufnahme Import-Flow, Datenmodell, Review-UI-Muster"
tags: [research, codebase, character-import, scan-character, supabase, review-ui]
status: complete
---

# Research: Charakterbogen-Scan zum Aktualisieren eines bestehenden Charakters

## Research Question

Wie funktioniert der bestehende Character-Import (OCR/Vision via Claude API, `/characters/import`, `/api/scan-character`)? Welche Datenstrukturen/Tabellen werden geschrieben? Welche vorhandenen Muster existieren im Code für einen Diff-/Änderungs-Review-Flow (Liste mit ab-/anwählbaren und editierbaren Änderungen)?

## Summary

Der bestehende Import ist ein **reiner Create-Flow ohne jeden Update-Pfad**. Er besteht aus genau zwei Dateien plus einem Validierungs-Helper:

- `src/app/api/scan-character/route.ts` — stateless Vision-Endpoint. Nimmt 1–5 Dateien (Bilder/PDF) per `FormData` entgegen, skaliert Bilder mit `sharp` auf max. 1568 px, schickt sie mit einem großen deutschen Prompt an die Anthropic Messages API und gibt `{ character: <extrahiertes JSON> }` zurück. Der Endpoint kennt **keine** `characterId` und liest **nichts** aus der Datenbank.
- `src/app/characters/import/page.tsx` — Client-Komponente. Enthält den kompletten Zustand (`scanned`), das Editier-Formular für alle Felder und in `handleCreate()` die gesamte Persistenz-Logik (7 Tabellen, Fuzzy-Matching gegen Waffen/Rüstungen/NWPs/Zauber).
- `src/app/characters/import/import-validation.ts` — reine Funktion `validateImportFiles()`, geteilt zwischen Client und Route.

Die Persistenz ist **client-seitig** über den Supabase-Browser-Client implementiert (RLS als Schutz), nicht über eine API-Route. `handleCreate()` ist eine ~360 Zeilen lange Funktion, die Insert-Logik und Matching-Logik vermischt; es gibt keine extrahierten, testbaren Matcher.

Für einen Diff-/Review-Flow existiert bisher **kein Baustein** im Code: keine Diff-Utility, kein generisches Change-Set-Modell. Das nächstliegende UI-Vorbild ist der `MonsterVariantPicker` (Checkbox-Liste mit `Set<number>`-Auswahl vor dem Import).

```
src/
  app/
    api/
      scan-character/route.ts          ← Vision-Endpoint (stateless, kein DB-Read)
    characters/
      import/
        page.tsx                       ← Upload + Edit-Formular + handleCreate() (Persistenz)
        import-validation.ts           ← validateImportFiles() (shared Client/Server)
        import-validation.test.ts
      new/page.tsx                     ← Einstieg: "Manuell" vs. "Importieren"
      [id]/
        page.tsx                       ← Modus-Auswahl (Manage/Play/Epic)
        manage/page.tsx                ← Server-Component: lädt Char + 12 Relationen parallel
    master/npcs/import/page.tsx        ← re-exportiert ImportCharacterPage mit isNpc
  components/
    character-sheet/character-sheet.tsx ← handleSave(): Update-Muster für characters + character_classes
    character-mode-nav.tsx              ← Manage/Play/Epic-Navigation
    master/monster-variant-picker.tsx   ← einziges vorhandenes „Auswahl vor Import"-UI
    approval-gate.tsx                   ← Client-Gate für Schreib-Aktionen
  lib/
    supabase/types.ts                   ← CharacterRow + alle Relations-Row-Typen
    navigation.ts                       ← NAV_ITEMS (enthält /characters/import)
messages/de.json, messages/en.json      ← Namespace "import"
```

Datenfluss heute:

```
[Dateien]
   │ FormData (files[], precise?)
   ▼
POST /api/scan-character ──► sharp resize ──► Anthropic Messages API
   │                                            (haiku-4-5 | sonnet-4-6)
   │ { character: {...} }
   ▼
import/page.tsx  setScanned(char)   ← Normalisierung (raceMap, equipment, classes)
   │ Nutzer editiert Felder im Formular
   ▼
handleCreate()   ── insert characters
                 ── insert character_classes[]
                 ── insert character_fighting_styles[]   (aus "Fighting Style ..."-Profs)
                 ── insert character_weapon_proficiencies[]
                 ── insert character_nonweapon_proficiencies[]  (Fuzzy-Match)
                 ── insert character_equipment[] | character_inventory[]  (Fuzzy-Match)
                 ── insert character_spells[]            (Fuzzy-Match, paginiert)
   ▼
router.push(`${basePath}/${data.id}/manage`)
```

## Detailed Findings

### Scan-Endpoint (`src/app/api/scan-character/route.ts`)

- **Auth:** `createClient()` (Server) + `supabase.auth.getUser()`; 401 ohne User (`route.ts:32-40`). **Kein** `is_approved`-Check — anders als `summarize-session` und `generate-session-image`, die einen 403 werfen (`src/app/api/summarize-session/route.ts:16-29`).
- **API-Key-Guard:** 503 wenn `ANTHROPIC_API_KEY` fehlt (`route.ts:42-48`).
- **Datei-Sammlung:** iteriert `formData.entries()` und akzeptiert die Keys `files` und `image` (`route.ts:55-60`). Validierung über `validateImportFiles()`, Fehlermeldungen sind hier **hartcodiert deutsch** in einer `Record<string,string>`-Map (`route.ts:64-74`).
- **Bildaufbereitung:** PDFs gehen als `document`-Block unverändert durch; Bilder werden per `sharp().rotate().resize(1568,1568,{fit:"inside"}).jpeg({quality:85})` verkleinert (`route.ts:85-103`).
- **Modell-Wahl:** `precise === "true"` → `claude-sonnet-4-6`, sonst `claude-haiku-4-5-20251001`, `max_tokens: 4096` (`route.ts:110-112`).
- **Prompt:** ein einziger deutscher Text-Block (`route.ts:120-186`) mit vollständigem JSON-Zielschema und Regeln:
  - Nur **maschinengedruckte** Werte, handschriftliche Korrekturen explizit ignorieren (`route.ts:123`) — für einen Update-Scan ist genau diese Regel inhaltlich relevant, weil Fortschritt auf Papier meist handschriftlich notiert wird.
  - Multi-File-Hinweis („Seiten zu einem Charakter kombinieren") bei > 1 Datei (`route.ts:125`).
  - Enum-Listen für `race`, `class`, `kit`, `alignment` stehen im Prompt **und** noch einmal dupliziert in der Client-Validierung (`page.tsx:267-284`, `page.tsx:303-324`).
  - `xp` = gedruckter „XP:"-Wert, nicht „Next Level:" (`route.ts:182`).
- **Antwort-Parsing:** Abbruch bei `stop_reason === "max_tokens"` (422), Regex `\{[\s\S]*\}` zum Herausschneiden des JSON, `JSON.parse` in try/catch (`route.ts:193-222`).

### Client-Seite (`src/app/characters/import/page.tsx`)

- **Props:** `{ basePath = "/characters", isNpc = false }` — dieselbe Komponente wird von `src/app/master/npcs/import/page.tsx:4` als NPC-Import wiederverwendet.
- **Typ `ScannedCharacter`** (`page.tsx:20-66`) ist die De-facto-Schnittstelle zwischen Route und UI. Sie ist **nur hier** definiert, nicht in einem geteilten Modul — die Route hat keinen Typ für ihr eigenes Ausgabeformat. Sie enthält Legacy-Felder (`class`, `level`, `xp`) neben dem Array `classes`.
- **State:** `filePreviews` (mit `URL.createObjectURL` + Revoke-Cleanup über Ref-Muster, `page.tsx:103-118`), `scanned`, `scanning`, `saving`, `error`, `preciseMode`.
- **Normalisierung nach dem Scan** (`page.tsx:194-235`): Subrassen-Mapping (`stout_halfling → halfling` etc.), Equipment als `string | {name,magicBonus}`, `classes[].level/xp` mit Fallback auf Legacy-Felder.
- **Editier-Formular:** vollständige Kontrolle über alle Felder — Name, Rasse (Select), Klassen-Liste (add/remove/level/xp), Kit, Alignment, Personendaten, 6 Attribute (clamp 3–18 in `onBlur`), Sub-Stats (nur sichtbar wenn mindestens einer ≠ null), HP, 4 Münzsorten, Waffenfertigkeiten (Name + `specialized`-Checkbox), NWPs, Ausrüstung (Name + `magicBonus`), Zauber (nach Stufe gruppiert). Alle Felder tragen `data-testid`-Attribute nach dem Schema `import-<feld>` bzw. `import-<liste>-<index>`.
- **`updateField()`** (`page.tsx:244-247`) ist der einzige Mutations-Pfad: flaches `setScanned({...scanned, [key]: value})`.

### Persistenz in `handleCreate()` (`page.tsx:249-609`)

Alles läuft über `createClient()` (Browser) — RLS ist die einzige Autorisierungsschicht. Reihenfolge:

1. **Whitelist-Validierung** von Klassen-IDs (`page.tsx:267-296`) und Kit (`page.tsx:303-325`) — beides hartcodierte Arrays, parallel zur Prompt-Definition.
2. **`characters` insert** (`page.tsx:327-371`): alle Skalarfelder; `height_cm` über `parseImperialHeight()` (`page.tsx:69-75`), `weight_kg` über `weight * 0.4536`; bei `isNpc` zusätzlich `is_npc/npc_visible_to_players/is_active`.
3. **`character_classes`** — ein Row pro Klasse (`page.tsx:380-391`).
4. **Fighting Styles**: Profs, deren Name mit `fighting style` beginnt, werden abgetrennt und per Substring-Heuristik auf `two_weapon | two_hander | weapon_and_shield | single_weapon` gemappt (`page.tsx:397-425`).
5. **`character_weapon_proficiencies`**: Name wird gegen `weapons.name`/`name_en` exakt (case-insensitive) normalisiert, sonst Rohname (`page.tsx:428-442`).
6. **`character_nonweapon_proficiencies`**: `nonweapon_proficiencies` wird komplett geladen; Präfix `native languages:` gestript, `common`/`native` übersprungen; Match über Gleichheit oder beidseitiges `includes` in DE und EN; Duplikatschutz über `Set` (`page.tsx:445-473`).
7. **Ausrüstung** (`page.tsx:476-545`): Name wird von `+N` und `xN` befreit, Menge aus `xN` gelesen. `matchesName()` (`page.tsx:495-506`) macht Substring-Match plus Token-Match (alle DB-Tokens > 2 Zeichen müssen im Scan-Namen vorkommen). Reihenfolge: Waffe → `character_equipment` mit `hit_bonus = damage_bonus = magicBonus`, `equipped: true`; sonst Rüstung → `character_equipment`, `equipped: true`; sonst → `character_inventory` mit `custom_name`. **Alle Inserts einzeln, sequenziell in der Schleife.**
8. **Zauber** (`page.tsx:548-602`): lädt **alle** Zauber paginiert in 1000er-Batches (DB hat 3.200+), matcht auf `level` **und** Namensähnlichkeit (beidseitiges `includes` in DE/EN), Duplikatschutz über `Set`, dann ein Bulk-Insert mit `prepared: false`.
9. `router.push(`${basePath}/${data.id}/manage`)`.

Fehlerbehandlung ist uneinheitlich: `characters`-Insert bricht ab, `character_classes` loggt nur auf die Konsole, alle weiteren Inserts ignorieren Fehler komplett.

### Zieldatenmodell

`characters` (Basis in `supabase/migrations/00004_character_full_schema.sql`, danach über ~20 Migrationen erweitert; Typ in `src/lib/supabase/types.ts:3-79`) trägt u. a.: `level`, `race_id`, `class_id`, `kit`, `alignment`, `xp_current`, 6 Attribute + `str_exceptional` + 12 Sub-Stats, `hp_current/hp_max`, 5 Münzfelder (`gold_pp/gp/ep/sp/cp` — **`gold_ep` wird vom Import nicht befüllt**), Personendaten, 7 `thief_*`-Felder, `deity`, `priesthood`, `traits`/`disadvantages` (JSONB), `*_slots_adj`, `spell_system`, `notes`, `is_active/is_npc/is_public`.

Relationstabellen:

| Tabelle                             | Schlüssel/Constraint                                                                                                                                                             | Migration                                      |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `character_classes`                 | `unique(character_id, class_id)`, Felder `level`, `xp_current`, `is_active`                                                                                                      | `00015_multiclass.sql:6`                       |
| `character_equipment`               | `weapon_id` **xor** `armor_id` (später gelockert für Magic Items), `quantity`, `equipped`, `hit_bonus`, `damage_bonus`, `magic_effects` (JSONB), `custom_label`, `magic_item_id` | `00004:24`, `00036`, `00070`, `00072`, `00192` |
| `character_inventory`               | `item_id` **oder** `custom_name`, `quantity`, `notes`                                                                                                                            | `00017_inventory.sql:30`                       |
| `character_spells`                  | PK `(character_id, spell_id)`, `prepared`, `expended`                                                                                                                            | `00004:39`                                     |
| `character_weapon_proficiencies`    | `unique(character_id, weapon_name)`, `specialization`                                                                                                                            | `00010:18`                                     |
| `character_nonweapon_proficiencies` | `unique(character_id, proficiency_id)`                                                                                                                                           | `00010:26`                                     |
| `character_fighting_styles`         | `unique(character_id, style_id)`, `slots_invested`                                                                                                                               | `00032:4`                                      |
| `character_languages`               | — (wird vom Import nicht bedient)                                                                                                                                                | —                                              |

Die `unique`-Constraints auf 4 der 7 Relationstabellen sind für einen Update-Flow direkt nutzbar (Upsert statt Insert); `character_equipment` und `character_inventory` haben **keine** natürliche Unique-Spalte — hier ist Identität nur über `id` oder Heuristik bestimmbar.

### Vorhandenes Update-Muster (`character-sheet.tsx`)

- Ladepfad: `src/app/characters/[id]/manage/page.tsx:47-112` holt Charakter + 12 Relationen in einem `Promise.all` und reicht alles als Props in `CharacterSheet`.
- `update(field, value)` (`character-sheet.tsx:431-438`) setzt lokalen State + `dirty`-Flag, gated über `isOwner`.
- `handleSave()` (`character-sheet.tsx:504-577`) schreibt ein flaches `.update({...})` mit ~45 explizit aufgezählten Feldern auf `characters` und danach pro Klasse ein `character_classes`-Update, dann `router.refresh()`.
- `confirmRaceChange()` (`character-sheet.tsx:440-461`) ist das einzige Beispiel im Code für „Änderung erst vorschlagen, dann bestätigt anwenden" — allerdings über einen Ad-hoc-`pendingRaceChange`-State, nicht über ein generisches Change-Modell.

### Vorhandenes Auswahl-UI (`monster-variant-picker.tsx`)

Der `MonsterVariantPicker` (`src/components/master/monster-variant-picker.tsx`) ist das nächste Vorbild für eine ab-/anwählbare Liste nach einem Scan:

- `useState<Set<number>>` mit allen Indizes vorausgewählt (`:34`), `toggle(i)` über Set-Kopie (`:39-46`).
- Jeder Eintrag ist ein `<label>` mit Checkbox + Titel + Stat-Zeile, `data-testid={`monster-variant-picker-item-${i}`}` (`:65-94`).
- Button-Label zeigt die Anzahl der Auswahl, disabled bei 0 (`:142-152`).
- Es ist reines Auswählen — **kein** Editieren der einzelnen Werte, und **kein** Vorher/Nachher-Vergleich.

### Querschnittsthemen

- **i18n:** Namespace `import` in `messages/de.json` / `messages/en.json` (44 Keys, s. o. gelistet). Alle UI-Strings der Import-Seite laufen über `useTranslations("import")`; die Fehlermeldungen der Route sind dagegen hartcodiert deutsch.
- **Approval:** `ApprovalGate` (`src/components/approval-gate.tsx`) versteckt/ersetzt Schreib-UI clientseitig; serverseitig prüfen einzelne Routen `profiles.is_approved` (Muster in `src/app/api/summarize-session/route.ts:16-29`). Zusätzlich greift der `enforce_approval`-BEFORE-Trigger auf u. a. `characters`, `character_equipment`, `character_spells`.
- **Einstiegspunkte zum Import:** `src/app/characters/new/page.tsx:33` (Karte „Charakterbogen importieren") und `src/lib/navigation.ts:33` (Sidebar-Eintrag `nav-import`). Ein charakterbezogener Einstieg existiert weder in `character-mode-nav.tsx` noch in `src/app/characters/[id]/page.tsx`.
- **Tests:** Unit-Test existiert nur für `import-validation.test.ts`. Für den Import gibt es **keinen** Komponenten- oder E2E-Test außer dem Auth-Redirect (`e2e/auth-redirect.spec.ts:39-40`). Page-Objects liegen unter `e2e/pages/` (u. a. `character-sheet.page.ts`), es gibt kein `import.page.ts`.

## Code References

- `src/app/api/scan-character/route.ts:32-48` — Auth + API-Key-Guards (kein Approval-Check)
- `src/app/api/scan-character/route.ts:55-74` — Datei-Sammlung aus `FormData`, hartcodierte deutsche Fehlertexte
- `src/app/api/scan-character/route.ts:85-112` — `sharp`-Resize und Modellwahl (`precise`)
- `src/app/api/scan-character/route.ts:120-186` — kompletter Extraktions-Prompt inkl. JSON-Zielschema
- `src/app/api/scan-character/route.ts:193-222` — Truncation-Guard, JSON-Extraktion, Response `{ character }`
- `src/app/characters/import/page.tsx:20-66` — Typ `ScannedCharacter` (Schnittstelle Route ↔ UI)
- `src/app/characters/import/page.tsx:166-242` — `handleScan()` inkl. Post-Scan-Normalisierung
- `src/app/characters/import/page.tsx:244-247` — `updateField()`
- `src/app/characters/import/page.tsx:249-609` — `handleCreate()`: Whitelists, 7 Tabellen, Fuzzy-Matching
- `src/app/characters/import/page.tsx:495-506` — `matchesName()` Token-Matching für Ausrüstung
- `src/app/characters/import/page.tsx:548-602` — paginierter Zauber-Load + Level-gebundenes Matching
- `src/app/characters/import/import-validation.ts:15-36` — `validateImportFiles()`
- `src/app/characters/[id]/manage/page.tsx:47-112` — paralleles Laden aller Charakter-Relationen
- `src/components/character-sheet/character-sheet.tsx:431-438` — `update()` mit `dirty`-Flag
- `src/components/character-sheet/character-sheet.tsx:440-461` — `confirmRaceChange()` (Pending-Change-Muster)
- `src/components/character-sheet/character-sheet.tsx:504-577` — `handleSave()` Update-Muster
- `src/components/master/monster-variant-picker.tsx:32-153` — Checkbox-Auswahl-UI nach Scan
- `src/components/approval-gate.tsx:25-53` — Client-Gate für Schreib-Aktionen
- `src/lib/supabase/types.ts:3-79` — `CharacterRow`
- `src/lib/supabase/types.ts:211-223` — `CharacterEquipmentRow`
- `src/lib/navigation.ts:29-36` — Sidebar-Eintrag `/characters/import`
- `supabase/migrations/00004_character_full_schema.sql:24-43` — `character_equipment`, `character_spells`
- `supabase/migrations/00010_proficiencies.sql:18-30` — Proficiency-Junction-Tabellen mit `unique`
- `supabase/migrations/00015_multiclass.sql:6-14` — `character_classes` mit `unique(character_id, class_id)`
- `supabase/migrations/00017_inventory.sql:30-38` — `character_inventory`
- `supabase/migrations/00032_fighting_styles.sql:4-10` — `character_fighting_styles`

## Architecture Documentation

Muster, die im aktuellen Code durchgängig verwendet werden:

- **Scan-Endpoints sind stateless.** Sowohl `scan-character` als auch `scan-monster` nehmen nur Dateien entgegen und geben extrahiertes JSON zurück; sie schreiben nie in die DB und lesen keinen bestehenden Datensatz.
- **Persistenz nach dem Scan passiert im Client** über den Supabase-Browser-Client; Autorisierung ausschließlich über RLS + `enforce_approval`-Trigger.
- **Fuzzy-Matching gegen Stammdaten** (Waffen, Rüstungen, NWPs, Zauber) ist inline in `handleCreate()` implementiert, nicht als eigenständige, testbare Funktionen.
- **Enum-Whitelists sind doppelt gepflegt** — einmal im Prompt (Server) und einmal als Array im Client.
- **Regelwerk-Logik lebt in `src/lib/rules/`** als reine Funktionen ohne DB-Zugriff und ist durchgängig unit-getestet; der Import-Pfad nutzt davon aktuell nur `ALL_ALIGNMENTS`/`getAlignmentLabel`.
- **UI-Konvention:** Glassmorphism-Container (`glass glow-neutral rounded-xl p-6`), `data-testid` auf jedem interaktiven Element, i18n über `useTranslations(<namespace>)`, Listen-Testids mit Index-Suffix.
- **Server-Components laden, Client-Components mutieren:** `manage/page.tsx` lädt per `Promise.all`, `CharacterSheet` hält den State und schreibt zurück.

## Nachtrag (2026-07-25, nach Umsetzung)

Die unten gelisteten offenen Punkte wurden vom Rescan-Feature (`docs/agents/plans/2026-07-25-character-sheet-rescan-update.md`) adressiert:

- **Entitäts-Identität bei wiederholtem Scan:** gelöst über Namens-Fuzzy-Match in `src/lib/scan/character-diff.ts` (`collectOwnedItems()` + `matchesName()`). Ein Treffer erzeugt eine Änderung, kein Treffer einen Neuzugang; fehlende Einträge werden nur als abgewählter Vorschlag gelistet, nie automatisch gelöscht.
- **Handschrift-Regel:** der Create-Prompt ignoriert Handschrift weiterhin. Der neue Update-Prompt (`CHARACTER_UPDATE_SCAN_PROMPT`) erfasst gedruckt und handschriftlich getrennt; bei Konflikt gewinnt die Handschrift, beide Werte bleiben in der UI sichtbar und umschaltbar.
- **`gold_ep`, `character_languages`, `deity`, `priesthood`, `traits`/`disadvantages`, `notes`:** alle im Update-Schema und im Diff abgedeckt. Der Create-Import erfasst sie unverändert nicht.
- **Fehlender `is_approved`-Check in `/api/scan-character`:** nachgerüstet, gilt für beide Modi.

Weiterhin offen: der Create-Import (`src/app/characters/import/page.tsx`) schreibt nach wie vor client-seitig in einer ~360-Zeilen-Funktion und hat keinen eigenen Komponenten- oder E2E-Test. Er nutzt jetzt immerhin die extrahierten, unit-getesteten Matcher aus `src/lib/scan/character-matching.ts`.

## Open Questions

- Es existiert **kein** Konzept für Entitäts-Identität bei wiederholtem Scan: `character_equipment`/`character_inventory` haben keine natürliche Unique-Spalte, `character_weapon_proficiencies` identifiziert über den (normalisierten) Namen. Wie Wiedererkennung „gleicher Gegenstand" beim zweiten Scan bestimmt werden soll, ist im Code nicht vorgezeichnet.
- Der Prompt verlangt explizit das Ignorieren handschriftlicher Einträge (`route.ts:123`); ob diese Regel für einen Update-Scan gelten soll, ist eine offene fachliche Frage.
- `gold_ep` (Elektrum) existiert in `characters` und in `handleSave()`, wird vom Scan-Schema aber nicht erfasst.
- `character_languages`, `deity`, `priesthood`, `traits`/`disadvantages` und `notes` werden vom Import nicht bedient, obwohl sie auf dem Charakterbogen stehen können.
- Für `/api/scan-character` fehlt der `is_approved`-Check, den vergleichbare KI-Routen haben.
