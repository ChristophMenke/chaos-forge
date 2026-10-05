---
date: "2026-07-30T14:18:05.890118+00:00"
git_commit: 23263cce96bc2a1177d2abd526b6556c52650bca
branch: feat/character-sheet-rescan
topic: "Epic Items für Nowi: Tricksters Choice & Netherese Blooded"
tags: [plan, epic-items, spell-points, play-mode, nowi]
status: draft
---

# Epic Items für Nowi: Tricksters Choice & Netherese Blooded — Implementierungsplan

## Overview

Nowi Tarja (Elf, Magier L9 / Dieb L7, `character_id` `58299456-112f-4455-8b12-60d7ed258150`) bekommt zwei neue Epic Items: **Tricksters Choice** (silberner W6, 3×/Tag Portal zu einem levelabhängigen extradimensionalen Raum) und **Netherese Blooded** (Magier-Bonus-Spellpoints + levelabhängige Zauber-Sonderfähigkeiten). Grundlage ist das Research-Dokument `docs/agents/research/2026-07-30-nowi-epic-items-tricksters-choice-netherese-blooded.md`.

## Current State Analysis

- Das Epic-Items-System (`src/lib/rules/epic-items.ts`) unterstützt bereits levelgestaffelte Items via `simple_effects.level_thresholds` und `spell_abilities[]` (inkl. `usesPerDay`/`usesPerWeek`, `replaces`-Ketten) — passt 1:1 auf **Tricksters Choice**, das ohne Code-Änderung rein als Content-Migration umsetzbar ist.
- Nowis `spell_system` steht auf `"slots"`; das vorhandene Wizard-Spellpoints-System (`src/lib/rules/spellslots.ts`, Player's Option Tables 17-19) ist vollständig implementiert, aber inaktiv für sie.
- `EpicEffects` (`src/lib/rules/epic-items.ts:61-96`) kennt keine Felder für Bonus-Spellpoints oder Ressourcen-Konvertierung — das braucht **Netherese Blooded**.
- Play Mode (`play-spellbook-panel.tsx`) berechnet `totalPoints`/`pointsRemaining` bereits aus `character.int`/`character.spell_points_used`; `play-mode.tsx` hat mit `updateCharacter()` einen etablierten generischen DB-Write-Helfer und mit `handleCastSpell`/`handleRest` das Muster für Spellpoints-Mutationen.
- Die Epic-Equipment-Seite (`damage-level-card.tsx`) trackt Spell-Ability-Nutzung nur als **lokalen, nicht persistierten** UI-Zustand (`useState`, kein Supabase-Write) — für eine echte Ressourcen-Konvertierung (HP↓/SP↑, dauerhaft) ungeeignet.

## Desired End State

- Nowi hat zwei neue, sichtbare Epic Items auf `/characters/58299456.../epic`, beide auf Tier "Lvl9-10" (ihre effektive Stufe 9).
- Ihr `spell_system` ist `"points"`; Play Mode zeigt Spellpoints statt Slots, inklusive der zusätzlichen 18 Bonus-Punkte (Stufe 9 × 2) aus Netherese Blooded.
- Im Spellbook-Panel kann sie (nur weil Tier "Lvl9-10" freigeschaltet ist) TP in Spellpoints umwandeln (1 TP = 2 SP) über einen Button.
- Tricksters Choice erscheint mit der aktuellen Tier-Beschreibung ("Haus, 20 Personen, unsichtbarer Diener, Nahrung") und einer 3×/Tag-Portal-Fähigkeit (bestehendes `spellAbilities`-UI, kein Code-Aufwand).
- Die niedrigeren Netherese-Blooded-Stufen (Lvl3-4/5-6/7-8) sind als reiner Beschreibungstext sichtbar (inkl. vollständiger Magick-Kostentabelle bei Lvl7-8), aber nicht UI-automatisiert.

## What We're NOT Doing

- Keine UI-Automatisierung für "freier Zauber" (Lvl3-4), "Zauber maximieren" (Lvl5-6) oder "Zauber steigern" (Lvl7-8) — diese Stufen sind bei Nowis aktueller Stufe (9) nicht aktiv (Entscheidung: nur höchste Stufe gilt) und würden zusätzlich ein bisher nicht existierendes "spontanes Wirken"-Feature voraussetzen.
- Keine Automatisierung der reduzierten Kosten für "freie Stufe-1-Zauber" (4 SP statt 5) aus der Lvl9-10-Stufe — dafür gibt es aktuell keinen UI-Pfad (spontanes Wirken existiert nicht), bleibt als Text in der Item-Beschreibung dokumentiert.
- Keine Erweiterung der Icon-Map — beide Items nutzen den `sparkles`-Fallback.
- Keine Änderungen an `tab-spells.tsx` (Charakterbogen-Ansicht) — dort ist `epicEffects` aktuell grundsätzlich nicht verdrahtet (auch AC-Bonus etc. nicht), das bleibt konsistent zum Bestand. Die neuen Effekte wirken nur in Play Mode.
- Keine Erzwingung der "nur Magier"-Einschränkung im Code — reiner Hinweistext, da Nowi ohnehin Magierin ist und es dafür keinen bestehenden Enforcement-Mechanismus gibt.
- Keine Änderungen an Print Sheet/DOCX-Export — dort werden Epic Items grundsätzlich nur über `acBonus` berücksichtigt (bestehendes Verhalten für alle Items).

## Architecture and Code Reuse

```
supabase/migrations/00226_seed_nowi_epic_items.sql (NEU — umnummeriert von 00222, siehe Phase 3)
  → epic_items (2 neue Zeilen für Nowi)
  → characters.spell_system = 'points' (Update für Nowi)

src/lib/rules/epic-items.ts
  EpicEffects  — + bonusSpellPoints: number, + hpToSpConversion: {ratio: number} | null
  getEpicEffects()  — neue Verarbeitung für simple_effects.spell_points_bonus_multiplier (unconditional,
                       analog perception_bonus) und simple_effects.hp_to_sp_conversion (tier-gated,
                       analog shapeshift_forms/special_attacks)

src/components/play-mode/play-mode.tsx
  + handleConvertHpToSp(hpAmount: number) — nutzt bestehendes updateCharacter()
  PlaySpellbookPanel-Aufrufe (Zeile 904, 1028) — neue Props: epicBonusSpellPoints, hpToSpConversion, onConvertHpToSp

src/components/play-mode/play-spellbook-panel.tsx
  totalPoints — + epicBonusSpellPoints addieren
  + Abschnitt "TP in SP umwandeln" (Button), sichtbar wenn isPointsMode && hpToSpConversion vorhanden

messages/de.json, messages/en.json
  epic-Namespace: neue Keys für Umwandeln-Button + Bonus-Hinweis
```

Wiederverwendete Muster (keine Neuerfindung):

- `level_thresholds` + `getAutoUnlockedLevel()` für beide Items (bestehendes Tier-System).
- `spell_abilities[]` + `getUnlockedSpellAbilities()` für Tricksters Choice (identisch zu "Klinge des Wassers").
- `updateCharacter()` (play-mode.tsx:640) als einziger DB-Schreibpfad für Charakterfelder in Play Mode — die Konvertierung nutzt exakt diesen Helfer, keinen neuen.
- Namens-Subquery-Migrationsmuster (`WHERE c.name = 'Nowi Tarja'`) identisch zu allen bisherigen Epic-Item-Migrationen.

## UI Mockups

**Play Mode Spellbook Panel — neuer Abschnitt (nur bei aktivem Netherese-Blooded-Tier 4):**

```
┌─────────────────────────────────────────┐
│  Zauberpunkte übrig                      │
│           42                             │
│           / 132                          │
├─────────────────────────────────────────┤
│  ✨ Netherese Blooded                    │
│  Trefferpunkte in Spellpoints umwandeln  │
│  1 TP → 2 SP                             │
│                        [ Umwandeln ]     │
└─────────────────────────────────────────┘
```

Der Button reduziert `hp_current` um 1 und erhöht die verfügbaren Punkte um 2 pro Klick; deaktiviert bei `hp_current <= 1` oder `readOnly`.

## Migration Notes

Die Migration ist additiv (INSERT + ein gezieltes UPDATE auf `spell_system` für genau Nowis `character_id` via Namens-Subquery) und idempotent via `NOT EXISTS`-Guard auf `(character_id, slug)` bzw. Bedingung auf den aktuellen `spell_system`-Wert. Kein Rollback-Bedarf über das normale Migrations-Down hinaus.

## Phase 1: Rule-Engine-Erweiterung (`epic-items.ts`)

**Tasks**:

- [x] `src/lib/rules/epic-items.ts`: `EpicEffects`-Interface um `bonusSpellPoints: number` und `hpToSpConversion: { ratio: number } | null` erweitern.
- [x] `getEpicEffects()`: Ergebnis-Objekt-Initialisierung um `bonusSpellPoints: 0` und `hpToSpConversion: null` ergänzen.
- [x] `getEpicEffects()`: im bestehenden unconditional "Simple effects"-Block (läuft für jedes ausgerüstete Item, tier oder nicht — analog `perception_bonus`) folgende Logik ergänzen:
  ```ts
  const spMultiplier = se?.spell_points_bonus_multiplier;
  if (typeof spMultiplier === "number" && characterLevel != null) {
    result.bonusSpellPoints += spMultiplier * characterLevel;
  }
  ```
  **Design-Entscheidung (bewusst, nicht an Item-Tier gekoppelt):** Die Vorlage beschreibt den Bonus-SP-Satz ("Der Charakter erhält seine aktuelle Stufe ×2 an zusätzlichen Spellpoints") als Basiseffekt, der unabhängig von den vier levelgestaffelten Sonderfähigkeiten gilt — er steht im Originaltext VOR den Lvl-Bändern, nicht als Teil davon. Deshalb wird er absichtlich im unconditional Block platziert (greift ab Ausrüsten sofort, unabhängig vom `level_thresholds`-Tier des Items) statt im getierten Block. Das gilt auch dann, wenn Netherese Blooded selbst `max_damage_level > 0` hat und damit zusätzlich den getierten Block durchläuft — beide Blöcke laufen unabhängig voneinander für dasselbe Item.
- [x] `getEpicEffects()`: im getierten Block (`if (item.max_damage_level > 0)`, dort wo `unlockedLevel` bereits berechnet ist, analog `special_attacks`-Parsing) folgende Logik ergänzen:
  ```ts
  const conv = se?.hp_to_sp_conversion as { unlock_level: number; ratio: number } | undefined;
  if (conv && conv.unlock_level <= unlockedLevel && !result.hpToSpConversion) {
    result.hpToSpConversion = { ratio: conv.ratio };
  }
  ```
- [x] `src/lib/rules/epic-items.test.ts`: neue `describe`-Blöcke mit Test-Fixture (analog `makeBladeOfWater`) für ein Item mit `spell_points_bonus_multiplier` und `hp_to_sp_conversion`.

**Automated Verification**:

- [x] `epic-items.test.ts` neue Tests: `bonusSpellPoints` skaliert korrekt mit `characterLevel` (z. B. Level 9 × Multiplikator 2 = 18), bleibt 0 ohne `characterLevel`-Parameter, bleibt 0 wenn Item nicht ausgerüstet.
- [x] `epic-items.test.ts` neue Tests: `hpToSpConversion` ist `null` unterhalb des `unlock_level`-Tiers, gesetzt mit korrektem `ratio` ab dem Tier, bleibt `null` wenn Item nicht ausgerüstet, kombiniert korrekt mit anderen Items (kein Überschreiben durch ein zweites Item ohne Conversion).
- [x] Bestehende Tests in `epic-items.test.ts` bleiben grün (keine Regression an `statOverrides`, `spellAbilities`, etc.) — 58/58 Tests grün.
- [x] `npm run typecheck` passes (nach Fix des `EpicEffects`-Stubs in `play-checks-panel.tsx:69-88`, der ebenfalls die neuen Pflichtfelder brauchte — im Plan nicht vorgesehen, aber notwendige Folgeänderung derselben Interface-Erweiterung).
- [x] `npm test` passes.

---

## Phase 2: Play-Mode-Verdrahtung

Dependencies: **Phase 1**

**Tasks**:

- [x] `src/components/play-mode/play-mode.tsx`: `handleConvertHpToSp(hpAmount: number)` Callback ergänzt (neben `handleCastSpell`/`handleRest`), das `spell_points_used` um `hpAmount * epicEffects.hpToSpConversion!.ratio` verringert und `hp_current` direkt um `hpAmount` reduziert (`character.hp_current - hpAmount`, **kein** `Math.max(1, ...)`-Clamp). Ausführbarkeit ausschließlich über die UI-Vorbedingung gesteuert, via bestehendem `updateCharacter()`.
- [x] `play-mode.tsx`: beide `<PlaySpellbookPanel>`-Aufrufe (Zeile 925, 1052) um Props `epicBonusSpellPoints={epicEffects.bonusSpellPoints}`, `hpToSpConversion={epicEffects.hpToSpConversion}`, `onConvertHpToSp={handleConvertHpToSp}` ergänzt.
- [x] `src/components/play-mode/play-spellbook-panel.tsx`: Props-Interface um `epicBonusSpellPoints?: number`, `hpToSpConversion?: { ratio: number } | null`, `onConvertHpToSp?: (hpAmount: number) => void` erweitert (Defaults `0`/`null`/`undefined`).
- [x] `play-spellbook-panel.tsx`: `totalPoints`-Berechnung um `+ epicBonusSpellPoints` in beiden Zweigen (`isWizard`, `isPriest`) ergänzt; Dependency-Array aktualisiert.
- [x] `play-spellbook-panel.tsx`: neuer Abschnitt unterhalb der Punkte-Anzeige rendert (nur `isPointsMode && hpToSpConversion != null && !readOnly`), Button ruft `onConvertHpToSp?.(1)` auf; `disabled`, wenn `character.hp_current <= 1`.
- [x] `messages/de.json` + `messages/en.json`: neue Keys im `epic`-Namespace (`hpToSpConversion`, `hpToSpConversionRatio`, `hpToSpConvertButton`) mit Platzhalter für `ratio`.

**Automated Verification**:

- [x] `npm run typecheck` passes.
- [x] `npm run lint` passes (für alle in dieser Phase geänderten Dateien einzeln geprüft; die 35 vorbestehenden Fehler im ungetrackten `scripts/spell-cards/`-Verzeichnis sind nicht Teil dieser Änderung).
- [x] `npm run build` passes.
- [x] `npm test` passes — 1773/1773 Tests grün.

**Manual Verification**:

- [ ] Play Mode für Nowi öffnen (nach Phase 3 / mit Test-Daten): Spellpoints-Anzeige zeigt `132` als Gesamtsumme (114 Basis + 18 Bonus), nicht `114`.
  1. `/characters/58299456-112f-4455-8b12-60d7ed258150/play` öffnen (oder lokal äquivalenten Testcharakter mit gleichem Setup)
  2. Spellbook-Panel prüfen: Punkte-Gesamtwert korrekt
- [ ] "TP in SP umwandeln"-Button funktioniert und aktualisiert beide Werte sichtbar.
  1. Button klicken
  2. HP-Anzeige sinkt um 1, verfügbare Spellpoints steigen um 2
  3. Seite neu laden → Werte bleiben persistiert
- [ ] Button ist deaktiviert, sobald `hp_current <= 1` — auch wenn die HP zuvor durch Kampfschaden bereits negativ waren (kein fälschliches "Hochheilen" auf 1).
  1. HP über das HP-Panel auf 1 oder niedriger setzen
  2. Zum Spellbook-Panel wechseln → "TP in SP umwandeln"-Button ist ausgegraut/deaktiviert

---

## Phase 3: Content-Migration (SQL)

Dependencies: **Phase 1**, **Phase 2**

**Tasks**:

- [x] `supabase/migrations/00226_seed_nowi_epic_items.sql` angelegt (umbenannt von der ursprünglich geplanten `00222` — die Remote-DB hatte bereits Migrationen bis `00225` angewendet, die lokal in diesem Branch nicht existieren, vermutlich aus dem noch offenen PR `feat/isolde-epic-items-shadowdancer-ring`; `00226` ist der nächste lokal UND remote freie Nummer):
  - `UPDATE characters SET spell_system = 'points' WHERE name = 'Nowi Tarja' AND spell_system = 'slots';`
  - `INSERT INTO epic_items (...) SELECT c.id, 'tricksters-choice', 'Tricksters Choice', 'Tricksters Choice', ... FROM characters c WHERE c.name = 'Nowi Tarja' AND NOT EXISTS (SELECT 1 FROM epic_items WHERE character_id = c.id AND slug = 'tricksters-choice');`
    - `icon: 'sparkles'`, `max_damage_level: 4`, `damage_level: 0`
    - `damage_levels`: 5 Einträge ("0" Vor-Freischaltung, "1" Truhe 50 kg, "2" Truhe 150 kg, "3" Hütte 6 Personen + unsichtbarer Diener, "4" Haus 20 Personen + unsichtbarer Diener + Nahrung — DE+EN Text)
    - `simple_effects`: `{ "level_thresholds": [3,5,7,9], "spell_abilities": [{ "key": "portal", "name": "Portal", "name_en": "Portal", "unlock_level": 0, "usesPerDay": 3, "usesPerWeek": 0, "effect": "Öffnet ein Portal zum aktuell freigeschalteten Extradimensionalraum (siehe Stufenbeschreibung).", "effect_en": "Opens a portal to the currently unlocked extradimensional space (see tier description)." }] }`
  - `INSERT INTO epic_items (...) SELECT c.id, 'netherese-blooded', 'Netherese Blooded', 'Netherese Blooded', ... FROM characters c WHERE c.name = 'Nowi Tarja' AND NOT EXISTS (SELECT 1 FROM epic_items WHERE character_id = c.id AND slug = 'netherese-blooded');`
    - `icon: 'sparkles'`, `max_damage_level: 4`, `damage_level: 0`
    - `damage_levels`: 5 Einträge, Tier "3" (Lvl7-8) enthält die vollständige Magick-Kostentabelle als Text (Spelllevel 1-9, Spalten Fixed/Free-Powered-Fixed/Powered-Free — Werte 4/8/12, 6/12/18, 10/20/30, 15/30/45, 22/44/66, 30/60/90, 40/80/120, 50/100/150, 60/120/180; Zeile 1 Mitte per arithmetischer Konsistenz zu den übrigen Zeilen als `8` transkribiert, nicht das mehrdeutig durchgestrichene handschriftliche Original — Korrektur bei Bedarf einfach nachträglich am Text)
    - `notes`: Hinweis "Nur nutzbar für Magier" (Nowi ist Magierin, keine Enforcement nötig)
    - `simple_effects`: `{ "level_thresholds": [3,5,7,9], "spell_points_bonus_multiplier": 2, "hp_to_sp_conversion": { "unlock_level": 4, "ratio": 2 } }`
- [x] Migration gegen die Live-DB angewendet. **Abweichung vom Plan:** `supabase db push` verweigerte den Push (Dry-Run brach ab), weil die Remote-Migrationshistorie von der lokalen abweicht (Isolde-Items 00222-00225 bereits remote vorhanden, lokal nicht). Da diese fremde History nicht angetastet werden sollte (weder `migration repair --status reverted` noch `db pull`, um keine ungewollte Vermischung mit dem unmerged Isolde-PR zu erzeugen — Nutzerentscheidung eingeholt), wurde die Migration stattdessen direkt via `supabase db query --linked -f supabase/migrations/00226_seed_nowi_epic_items.sql` ausgeführt — umgeht die CLI-Migrationsbuchhaltung vollständig, wendet aber exakt dasselbe SQL an. Dank `NOT EXISTS`-Guards bleibt die Datei trotzdem idempotent und kann später bei einer regulären `db push` (nach Bereinigung der History) gefahrlos erneut durchlaufen, ohne Duplikate zu erzeugen.
- [x] Ergebnis per Ad-hoc-Query verifiziert (Node-Script mit Service-Role-Key, analog Research-Phase).

**Automated Verification**:

- [x] Migration wendet fehlerfrei an (`supabase db query --linked`, keine Fehlerausgabe).
- [x] Ad-hoc-Query bestätigt: 2 neue Zeilen in `epic_items` für Nowis `character_id` (`tricksters-choice`, `netherese-blooded`, je 5 Tiers, `equipped: true`), `characters.spell_system = 'points'` für Nowi (`spell_points_used: 0`).

**Manual Verification**:

- [ ] Epic-Equipment-Seite zeigt beide Items korrekt auf Tier "Lvl9-10".
  1. `/characters/58299456-112f-4455-8b12-60d7ed258150/epic` öffnen
  2. Tricksters Choice: Tier-Text "Haus, 20 Personen, unsichtbarer Diener, Nahrung" sichtbar, Spell-Ability "Portal" mit "3× pro Tag"-Badge sichtbar
  3. Netherese Blooded: Tier-Text für Lvl9-10 sichtbar (TP→SP + günstige Lvl1-Zauber), aufgeklappte "Alle Stufen"-Tabelle zeigt auch Lvl3-4/5-6/7-8-Texte inkl. Magick-Tabelle

---

## References

- `docs/agents/research/2026-07-30-nowi-epic-items-tricksters-choice-netherese-blooded.md` — vollständige Recherche
- `supabase/migrations/00165_seed_larry_klinge_des_wassers.sql` — Referenz-Migration für `spell_abilities` + Namens-Subquery-Pattern
- `src/lib/rules/epic-items.ts:201-327` — `getEpicEffects()`, Ansatzpunkt für neue Felder
- `src/components/play-mode/play-mode.tsx:640-720` — `updateCharacter`, `handleCastSpell`, `handleRest` als Vorbild für `handleConvertHpToSp`
- `src/components/play-mode/play-spellbook-panel.tsx:108-119` — `totalPoints`/`pointsRemaining`-Berechnung
