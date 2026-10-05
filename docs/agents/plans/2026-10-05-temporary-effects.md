---
date: 2026-10-05T12:04:45+00:00
git_commit: 261dcfde8e482e3598c97f216cdd347ad61a7884
branch: feat/temporary-effects
topic: "Temporäre Effekte: Zustände, Buffs, Debuffs, Verletzungen"
tags: [plan, effects, conditions, play-mode, character-sheet, gm-dashboard, supabase]
status: draft
---

# Temporäre Effekte Implementation Plan

## Overview

Spieler erfassen an ihrem Charakter temporäre Effekte aus Zaubern, Monsterangriffen, Verletzungen, Gift, Krankheit oder Umwelt. Jeder Effekt hat einen Namen, eine **Freitext-Notiz** (z. B. das Ergebnis der Krit-Tabelle), eine Dauer als Info-Text, beliebig viele **Auswirkungen** auf Werte (± / setzen / Faktor, optional mit Bedingung „gegen …“) und **Zustände** als Markierungen. Die App verrechnet die Auswirkungen automatisch. Bedingte Auswirkungen erscheinen als Hinweis am Wert, temporäre TP bilden einen Puffer, Effekte werden manuell beendet. Rund 30 Vorlagen aus dem Regelwerk füllen das Formular vor.

## Current State Analysis

Quelle: `docs/agents/research/2026-10-05-temporary-effects.md`, inkl. Follow-up-Katalog.

**Daten**

- Es gibt keinen persistierten Effekt-Zustand.
- `characters` liegt in der Realtime-Publication (`00174`).
- Sichtbarkeit von `characters`: eigene, geteilte und öffentliche Charaktere (`00025:35-39`). Epic-Items erben diese Sichtbarkeit (`00114`).
- Approval-Trigger werden direkt per `CREATE TRIGGER` gesetzt (Vorbild `00229_game_dates.sql:48-50`).

**Vier Attribut-Resolver** mit abweichendem Verhalten:

| Stelle                                                     | Cap 25 | Overclock-CON | CON-Unterwerte | CHA                  | Unterwert-Skalierung     |
| ---------------------------------------------------------- | ------ | ------------- | -------------- | -------------------- | ------------------------ |
| `character-computed.ts:147-164` (GM, Dashboard, Simulator) | ja     | nein          | keine          | wird nicht berechnet | bei Override             |
| `play-mode.tsx:285-294`                                    | nein   | ja            | ja             | ja                   | bei Override             |
| `play-checks-panel.tsx:102-108`                            | nein   | nein          | ja             | ja                   | bei `effective !== base` |
| `character-sheet.tsx:287-292`                              | nein   | nein          | ja             | ja                   | kein Magic-Bonus         |

**Modifikatortabellen:** `abilities.ts` liest `TABLE[x − 3]` ohne Schutz. Werte unter 3 ergeben `undefined` bzw. werfen (WIS, `abilities.ts:860`).

**Unterwerte** (z. B. `dex_balance`, `con_fitness`) überschreiben die Modifikatorzeile. Sie werden nur bei Item-Overrides mitskaliert (`scaleSubStat`, `epic-items.ts:378`).

**TP**

- `handleHpChange` (`play-mode.tsx:659-669`) rechnet effektive in gespeicherte TP um und klemmt auf `±hp_max`.
- `PlayHpBar` gibt nur absolute neue TP zurück (`onHpChange(newHp)`, `play-hp-bar.tsx:60-66`).
- Das Magic-Items-Panel nutzt `onHpChange` ebenfalls (`play-mode.tsx:993, 1100`).

**Anzeigen**

- THAC0 in der TP-Leiste (`play-mode.tsx:869`), auf der GM-Karte (`master-character-card.tsx:226`) und im Party-Aggregat (`master-party-panel.tsx:65`): jeweils Basis-THAC0.
- Die RK-Aufschlüsselung wird im Kampf-Panel separat gebaut (`play-combat-panel.tsx:123-195`).
- Wahrnehmung im Checks-Panel ist `floor((INT+WIS)/2)` (`:476`). Magieresistenz wird im Spielmodus nicht angezeigt.

**GM-Dashboard**

- Live-TP-Map mit Rohwerten (`master-dashboard.tsx:243-247`) überschreibt `combat.hpMax` (`master-character-card.tsx:76-77`).
- Der HP-Kanal hängt an `[partyData]` (`:289`).

**Weitere Aufrufer von `computeCharacterCombatData`:**

- `dashboard/page.tsx:663`
- `combat-simulator/adapters.ts:69-98`
- NPC-Seiten `master/npcs/[id]/play|manage`

**Konflikte:** PR #178 (Stufenaufstieg) ändert `play-mode.tsx` (direkt nach `<PlayHpBar>`), `character-sheet.tsx` (vor dem Kopf), `character-computed.ts` (`getEffectiveClassEntries`), `messages/*.json` (Ende der Datei) und `CLAUDE.md`.

## Desired End State

**Datenbank:** neue Tabelle `character_effects` (Soft-Delete über `ended_at`), RLS erbt die Sichtbarkeit von `characters`, Schreiben nur durch den Owner, Approval-Trigger, Realtime.

**Spielmodus:**

- Chips unter der TP-Leiste; „+ Effekt“ (Dialog); ✕ beendet einen Effekt; Klick öffnet Details und Bearbeiten.
- Alle Werte inklusive Effekte:
  - Attribute samt Modifikatoren (Unterwerte werden mitskaliert)
  - Rettungswürfe (alle bzw. eine Kategorie)
  - THAC0 in TP-Leiste und Kampf-Panel, Waffen-THAC0, Schaden
  - RK inkl. Aufschlüsselung
  - Bewegung, Angriffe pro Runde
  - Wahrnehmung, Attributsproben, Diebesfertigkeiten
  - Hinweis zum Zaubern (kann nicht zaubern / Patzer X %)
- Geänderte Werte zeigen ihre Herkunft („ETW0 16 → 15 (Segen +1)“).

**Bedingte Auswirkungen** (z. B. „gegen Böse“) erscheinen als Hinweis am Wert und fließen nicht in die Zahl ein.

**Temporäre TP:**

- eigener Puffer, angezeigt als „14/31 +6“
- Schaden verbraucht ihn zuerst (ältester Effekt zuerst)
- endet der Effekt, verfällt der Rest

**Charakterbogen:**

- Abschnitt „Temporäre Effekte“ mit derselben Verwaltung und „Rast: alle beenden“.
- Attribute, RK, THAC0 und Rettungswürfe zeigen das Badge „effektiv X“.
- Der Ausrüstungs-Tab bleibt bei der Basis-RK, als Verwaltungsansicht dokumentiert.

**Dashboard (Party-Übersicht) und GM-Dashboard:** Werte inkl. Effekte. Das GM-Dashboard zeigt zusätzlich Chips (nur lesen), temporäre TP auf der Karte und aktualisiert live, auch wenn ein Effekt endet.

**Warnungen** (nur Hinweise, keine Automatik):

- Schwellen: Attribut ≤ 0 „tödlich“, KON < 3 „bewusstlos“, sonst < 3 „handlungsunfähig“.
- Stapeln: doppelte Vorlage.

**Robustheit:** Attributwerte unter 3 bringen nichts zum Absturz. Für die Modifikator-Tabellen wird auf mindestens 3 geklemmt, angezeigt wird der echte Wert.

## What We're NOT Doing

- **Nur der Spieler setzt Effekte**, nicht der GM. NPC-Seiten im GM-Bereich bekommen keine Effekte; sie übergeben `effects=[]`.
- **Kein Rundenzähler**, keine automatische Dauer, keine automatische Erholung. „−1 pro Tag“ passt der Spieler im Effekt an.
- **Kein automatischer laufender Schaden.** Stattdessen Flag „laufender Schaden“ plus Notiz als Erinnerung.
- **Keine Krit-Tabellen**; das Ergebnis kommt als Freitext.
- **Ziel „Max. TP“ entfällt** (gegenüber dem Vorschlag):
  - Positive Erhöhungen (Aid, Heroismus, Emotion Mut) deckt der Puffer „temporäre TP“ ab, genau so beschreibt sie das Regelwerk.
  - Ein Max-TP-Deckel (Wunden, Pixie Dust) würde die gespeicherte TP-Umrechnung brechen und ist selten. Er kommt als Notiz.
  - Ein Ausbau später ist möglich.
- **Ziele „Magieresistenz“ und „Initiative“ entfallen.** Die App zeigt diese Werte nirgends an; beide gehören in die Notiz. Das Ziel „Zauberpatzer %“ bleibt als Hinweis im Zauber-Panel.
- **Gestaltwandlungs-Formen** (`play-combat-panel.tsx:456-476`) nutzen ihre eigenen Werte, Effekte wirken dort nicht. Das wird dokumentiert.
- **Kampfsimulator:** übernimmt keine Spieler-Effekte, um eine Doppelzählung mit den eigenen Simulator-Effekten zu vermeiden.
- **Druckansicht/DOCX:** bleiben ohne temporäre Effekte, weil ein Ausdruck eine stabile Referenz ist. Epic- und Magic-Boni enthalten sie weiterhin.
- **18/xx-Stärke:** Effekte auf STR ignorieren den Prozentwert, sobald STR ≠ 18 (dokumentiert und getestet).
- **Kein Undo/Redo.** Die Schreib-Ops sind aber gekapselt und liefern vorher/nachher (Memory `undo-redo-feature-wunsch`).

## UI Mockups

**Spielmodus:**

```
❤ Isolde   TP ██████░░ 14/31 +6     RK 4   ETW0 15
 [🦵 Krit: Bein gebrochen ✕] [✨ Segen ✕] [🛡 Hilfe ✕] [☠ Seuche ✕]  [+ Effekt]
 ⚠ CHA 2: unter 3 – handlungsunfähig (Hinweis)

 Kampf     ETW0 16 → 15  (Segen +1 · Bein −2 · Seuche −2 → −3 … )   Bewegung 12 → 6
 Proben    STR 15 · GES 14 · KON 12 · INT 10 · WEI 9 · CHA 4 → 2 (Seuche −2)
 Rettung   Gift 11 · Stab 9 · Versteinerung 10 · Odem 13 · Zauber 11 · +2 gegen Böse
```

**Effekt-Dialog:**

```
┌─ ✚ Effekt hinzufügen ─────────────────────────────────────────────┐
│ Vorlage: [ Eigener Effekt ▾ ]  (Zauber · Monster · Zustände · Verletzungen · Umwelt) │
│ Name:    [ Krit: Bein gebrochen                         ]         │
│ Notiz:   [ Krit-Tabelle Ergebnis 14 · heilt mit CSW     ]         │
│ Dauer:   [ bis geheilt ]  (nur Info)                              │
│ Auswirkungen                                                      │
│  [Bewegung      ▾] [Faktor ▾] [ ×½ ▾ ]                       [✕]  │
│  [Angriff       ▾] [±      ▾] [ −2 ]                         [✕]  │
│  [Rettungswürfe ▾] [±      ▾] [ −2 ] gegen: [ Furcht     ]   [✕]  │
│  + Auswirkung                                                     │
│ Zustände: ☐ bewusstlos ☐ betäubt ☐ liegend ☐ gehalten ☐ geblendet │
│   ☐ taub ☐ verängstigt ☐ kann nicht angreifen ☐ kann nicht zaubern│
│   ☐ kein GE-Bonus auf RK ☐ kein Schild ☐ laufender Schaden        │
│                                         [Abbrechen] [Hinzufügen]  │
└───────────────────────────────────────────────────────────────────┘
```

**Charakterbogen:**

```
Temporäre Effekte                                 [+ Effekt] [Rast: alle beenden]
 ☠ Seuche   CHA −2 · STR −2 · GES −2 · Angriff −2     bis Heilung     [Bearbeiten] [✕]
 ✨ Segen   Angriff +1 · Rettung gegen Furcht +1      6 Runden        [Bearbeiten] [✕]
```

**GM-Karte:** Chips unter dem Namen (ab 4 Chips als „+N“ zusammengefasst, mit Tooltip), TP mit „+N temp.“.

## Architecture and Code Reuse

```
character_effects (DB, Soft-Delete ended_at, RLS erbt characters, Realtime UPDATE)
        ▼
src/lib/rules/temporary-effects.ts          (rein, getestet)
  aggregateEffects(effects) ─► EffectSummary {abilities, savesAll, savesByCategory,
      conditionalNotes, attack, damage, acBonus, acSet, noDexAc, noShield,
      movementFactor, attacksFactor, noAttacks, tempHp, perception, abilityChecks,
      thiefSkills, spellFailure, cannotCast, flags, sources}
  consumeTempHp(effects, damage) / getThresholdWarnings / getStackingWarnings
        ▼
src/lib/rules/effective-stats.ts            (neu, ersetzt 4 Resolver)
  resolveEffectiveStats(character, {epic, magic, overclock?}, summary)
     ─► { values: {str…cha}, modified: {str…cha}, subStats: {…skaliert}, sources }
  abilityModifierScore(value) = clamp(value, 3, 25)   ← Schutz für TABLE[x−3]
        ▼
character-computed.ts · play-mode.tsx · play-checks-panel.tsx · character-sheet.tsx
```

**Wertsemantik:** Auswirkungen sind in **Spielersicht** gespeichert: +X ist immer ein Vorteil. Die Engine rechnet um, Rettungswürfe, THAC0 und RK sinken also bei einem Bonus.

**Operationen:**

| Operation | Erlaubt für                         | Bedeutung                                                                                       |
| --------- | ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `delta`   | alle Ziele                          | Bei Diebesfertigkeiten und Zauberpatzer in Prozentpunkten                                       |
| `set`     | Attribute, RK                       | RK `set` heißt „RK wird X“; Rüstung, GE-Bonus und Schild entfallen, Effekt-Deltas wirken danach |
| `factor`  | Attribute, Bewegung, Angriffe/Runde | Auswahl aus ×2, ×⅔, ×½, ×⅓, ×0                                                                  |

**Reihenfolge pro Attribut:**

1. Basis/Epic/Magic/Overclock (bestehende Logik, vereinheitlicht)
2. `set` (bei mehreren gewinnt der zuletzt angelegte)
3. `factor` (multipliziert, abgerundet)
4. `delta`
5. Begrenzung auf 0…25

Die Unterwerte werden bei Änderung über `scaleSubStat` mitskaliert.

**Entscheidung zur Vereinheitlichung:** Alle Pfade nutzen künftig Cap 25, Overclock-CON (dann auch im GM-Dashboard), CON-Unterwerte und CHA. Das ändert GM-Werte bei Kondensator-Trägern. Gewollt, das GM-Dashboard zeigt dann dieselben Werte wie der Spielmodus.

**Reuse:**

- `scaleSubStat`, `calculateAC` (erweitert), `getMovementRate`
- `useRealtimeRefresh` (Channel-Name mit `useId`-Suffix ergänzen)
- `@base-ui`-Dialog, `GlassCard`, i18n-Muster

Betroffene Dateien:

- `supabase/migrations/00230_character_effects.sql` (neu)
- `src/lib/supabase/types.ts`: `CharacterEffectRow`, `EffectModifier`, `EffectTarget`, `EffectOp`, `EffectFlag`
- `src/lib/rules/`
  - `temporary-effects.ts` (neu)
  - `effect-presets.ts` (neu)
  - `effective-stats.ts` (neu)
  - `equipment.ts` (`calculateAC`)
  - `character-computed.ts` (Parameter `effects`, `thac0Effective`, `effectSummary`)
  - `abilities.ts` (nur ein Schutz-Helfer)
- `src/lib/effects/effects-api.ts` (neu)
- `src/components/effects/`: `effect-chips.tsx`, `effect-dialog.tsx`, `modifier-row.tsx`, `effects-section.tsx`, `effect-warnings.tsx`
- `src/components/play-mode/`: `play-mode.tsx`, `play-hp-bar.tsx` (Props `tempHp`, `onDamage`), `play-combat-panel.tsx`, `play-checks-panel.tsx`, `play-spellbook-panel.tsx`
- `src/components/character-sheet/character-sheet.tsx`
- `src/components/master/`: `master-character-card.tsx`, `master-party-panel.tsx`, `master-dashboard.tsx`
- `src/app/`: `characters/[id]/play/page.tsx`, `characters/[id]/manage/page.tsx`, `master/page.tsx`, `dashboard/page.tsx`, `master/npcs/[id]/play|manage/page.tsx` (`effects=[]`)
- `src/lib/hooks/use-realtime-refresh.ts` (Instanz-Suffix)
- `messages/de.json`, `messages/en.json` (Namespace `effects`)
- `CLAUDE.md`

## Performance Considerations

- Ein zusätzlicher Query je Seite, in der bestehenden `Promise.all`-Welle (`character_id`, `ended_at is null`, indiziert).
- GM-Dashboard:
  - Effekt-Änderungen lösen über `useRealtimeRefresh` ein `router.refresh()` aus (debounced, nur im sichtbaren Tab).
  - Der HP-Kanal hängt künftig nur noch an den Charakter-IDs, nicht an `partyData`, damit ein Refresh ihn nicht neu aufbaut.

## Migration Notes

- Neue Tabelle, bestehende Daten bleiben unverändert. Rollback: Tabelle droppen.
- `supabase db push` erst nach dem Merge und mit ausdrücklicher Freigabe des Users (Produktiv-DB).
- **Reihenfolge:** Phase 1 ist weitgehend konfliktfrei. **Vor Phase 2** wird der Branch auf `main` gebracht, nachdem PR #178 gemergt ist. Die Effekt-Chips sitzen dann direkt unter dem Stufenaufstiegs-Banner.

---

## Phase 1: Datenmodell und Regelwerk

**Tasks**:

- [x] Migration `00230_character_effects.sql`:
  - Tabelle mit `id`, `character_id` (FK, cascade), `name` (1–80), `notes` (≤1000), `duration_text` (≤80), `preset_key`, `modifiers jsonb`, `flags jsonb`, `temp_hp_remaining int ≥0`, `created_by`, `created_at`, `ended_at timestamptz null`.
  - Index `(character_id) where ended_at is null`.
  - RLS:
    - SELECT `using (character_id in (select id from public.characters))`, erbt damit die Sichtbarkeit.
    - INSERT/UPDATE/DELETE `character_id in (select id from characters where user_id = auth.uid())`.
  - `CREATE TRIGGER enforce_approval_trigger … EXECUTE FUNCTION public.enforce_approval()` (wie `00229`).
  - `alter publication supabase_realtime add table public.character_effects`.
- [x] `types.ts`:
  - `EffectTarget`: str, dex, con, int, wis, cha, allAbilities, savesAll, saveParalyzation, saveRod, savePetrification, saveBreath, saveSpell, attack, damage, ac, movement, attacksPerRound, tempHp, perception, abilityChecks, thiefSkills, spellFailure
  - `EffectOp`: delta, set, factor
  - `EffectModifier { target, op, value, condition? }`
  - `EffectFlag`: unconscious, stunned, prone, held, blinded, deafened, frightened, nauseated, noAttacks, cannotCast, noDexAc, noShield, ongoingDamage, helpless
  - `CharacterEffectRow`
- [x] `abilities.ts`: Helfer `toModifierScore(value)` = clamp 3…25. Alle Aufrufer der `get*Modifiers` in den vier Pfaden nutzen ihn.
- [x] `temporary-effects.ts`:
  - `ALLOWED_OPS`, `validateModifier`
  - `aggregateEffects` mit `sources` (Effektname je Beitrag); bedingte Auswirkungen nur in `conditionalNotes`
  - `applyEffectsToAbility` (Reihenfolge wie oben)
  - `consumeTempHp(effects, damage) → { effects: [{id, temp_hp_remaining}], remainingDamage }` (ältester zuerst)
  - `getThresholdWarnings`, `getStackingWarnings`
- [x] `effective-stats.ts`: `resolveEffectiveStats(character, sources, summary)` vereinheitlicht die vier Resolver:
  - Cap 25, Overclock-CON als Force-Quelle, Magic-Bonus
  - Effekte nach der Reihenfolge oben
  - `modified` je Attribut
  - skalierte Unterwerte, wenn das Attribut von der Basis abweicht (Item oder Effekt)
- [x] `effect-presets.ts`: 37 Vorlagen in 5 Gruppen (dazu „Kühle Berührung“), mit `presetToDraft(preset, locale)`:
  - **Zauber:** Segen, Fluch, Gebet (Freund), Gebet (Feind), Gesang, Hilfe (Aid +1W8 temp. TP; Wert beim Anlegen eintragen), Hast, Verlangsamen, Schwächestrahl, Stärke, Katzenanmut, Seuche, Geißel, Blindheit, Taubheit, Feenfeuer, Schutz vor Bösem, Unheil (Bestow Curse), Emotion Mut, Emotion Hoffnung
  - **Monster:** Schatten-Berührung, Mumienfäule, Drachenfurcht, Ghul-Lähmung, Stinkwolke/Übelkeit
  - **Zustände:** bewusstlos, betäubt, liegend, gehalten/gelähmt, verängstigt
  - **Verletzungen:** Bein verletzt, Arm verletzt, Blutung
  - **Umwelt:** schwächendes Gift, Erschöpfung, Gewaltmarsch

  Jede Vorlage mit DE/EN, Gruppe, Icon, Quelle und Standard-Dauer.

- [x] `equipment.ts` `calculateAC` mit neuen optionalen Parametern:
  - `effectAcBonus` (Spielersicht)
  - `effectAcSet` (ersetzt Rüstung, GE und Schild; danach wirken Effekt-Deltas)
  - `noDexBonus`: entfernt nur einen GE-**Bonus**, ein Malus bleibt
  - `noShield`: entfernt Schild und Schildfertigkeit, **ohne** den Single-Weapon-Style-Bonus freizuschalten
- [x] `character-computed.ts`:
  - Parameter `effects = []`
  - `resolveEffectiveStats` statt Inline-Resolver
  - Rettungswürfe, RK, `thac0Effective` (Basis minus Angriffsbonus), Waffen-THAC0 und Diebesfertigkeiten inkl. Effekte
  - Neue Ausgaben `effectSummary` und `tempHp`

**Automated Verification**:

- [x] Unit `temporary-effects.test.ts`:
  - Operationen je Ziel; unerlaubte Operation wird abgewiesen.
  - Reihenfolge: STR 16 mit Gift ×½ und Seuche −2 ergibt 6.
  - Mehrere `set`: der zuletzt angelegte gewinnt.
  - Begrenzung 0…25.
  - `allAbilities` wirkt auf alle sechs.
  - `savesAll` vs. Kategorie; bedingt → nur Hinweis.
  - Bewegungsfaktor ×½·×½ = ×¼; `noAttacks` hat Vorrang.
  - `sources` nennt die Effekte.
  - Warnungen (CHA 2, KON 2, STR 0, doppelte Vorlage).
  - `consumeTempHp`: 10 Schaden auf 6 Puffer → 0 / Rest 4; ältester zuerst; ohne Puffer voller Schaden.
- [x] Unit `effective-stats.test.ts`:
  - Force, Epic, Magic-Override, Magic-Bonus, Overclock-CON, Cap 25.
  - Effekt senkt GES bei gesetztem `dex_balance` → skalierter Unterwert, der Modifikator ändert sich.
  - STR 18/xx mit Effekt → Prozentwert ignoriert.
- [x] Unit `abilities.test.ts`: `toModifierScore` sowie Modifikatoren für die Werte 0, 1 und 2, ohne Absturz (WIS inklusive).
- [x] Unit `effect-presets.test.ts`: Jede Vorlage ist gültig, mit DE/EN, Gruppe und Quelle.
- [x] Unit `equipment.test.ts`: `effectAcBonus`, `effectAcSet`, `noDexBonus` (Bonus weg, Malus bleibt), `noShield` (kein Single-Weapon-Bonus).
- [x] Unit `character-computed.test.ts` (+ `scaleAttacksPerRound` für Angriffe/Runde mit Faktor, z. B. 3/2 × ½ = 3/4):
  - Ohne Effekte unverändert für Charaktere ohne Overclock und ohne CON-Unterwerte (bestehende Tests).
  - Neu: Overclock-CON und `con_fitness` werden im GM-Pfad berücksichtigt (gewollte Änderung).
  - Segen → `thac0Effective` −1.
  - Seuche → Angriff −2, CHA −2.
  - Verlangsamen → RK 4 schlechter.
- [x] `npm run verify` ist grün.

---

## Phase 2: Effekte verwalten

[Dependencies: **Phase 1**; vorher Rebase auf `main` nach dem Merge von PR #178]

**Tasks**:

- [x] `effects-api.ts`: `createEffect`, `updateEffect`, `endEffect` (setzt `ended_at`), `endAllEffects`, `saveTempHp`. Rückgabe `{ ok, error, before?, after? }`; `user_not_approved` wird als eigener Fehler erkannt.
- [x] `modifier-row.tsx`:
  - Ziel-Select (gruppiert), nur erlaubte Operationen.
  - Faktor als Auswahl, Delta als Zahl.
  - Optional „gegen …“ (max. 40 Zeichen); entfernen.
- [x] `effect-dialog.tsx`:
  - Vorlagen nach Gruppen.
  - Name, Notiz, Dauer, Auswirkungen, Zustände.
  - Validierung; Anlegen und Bearbeiten.
  - `tempHp`-Wert setzt initial `temp_hp_remaining`.
- [x] `effect-chips.tsx`: Chips (Icon, Name, ✕ mit Bestätigung, Klick → Details), „+ Effekt“, Readonly-Variante mit „+N“-Zusammenfassung.
- [x] `effect-warnings.tsx`.
- [x] `effects-section.tsx` (Charakterbogen): Titel „Temporäre Effekte“, Liste mit Kurzfassung, Bearbeiten/Beenden, „Rast: alle beenden“.
- [x] `play/page.tsx`, `manage/page.tsx`: `character_effects` laden (aktiv, sortiert nach `created_at`). NPC-Seiten übergeben `[]`.
- [x] `play-mode.tsx`, `character-sheet.tsx`:
  - Effekte als State, Chips bzw. Abschnitt (nur Owner editierbar).
  - Realtime auf `character_effects` (UPDATE/INSERT; Beenden ist ein UPDATE), Channel mit `useId`-Suffix.
- [x] `play-hp-bar.tsx`:
  - Neue Props `tempHp` und `onDamage(amount)`. Schaden meldet den Betrag, Heilung weiter `onHpChange`.
  - Anzeige „+N“.
- [x] `play-mode.tsx`: `handleDamage(amount)` → `consumeTempHp` → `saveTempHp` für betroffene Effekte → Rest über die bestehende `handleHpChange`-Logik.
- [x] i18n `effects`.

**Automated Verification**:

- [x] Unit `effects-api.test.ts`:
  - Felder und Tabellen stimmen.
  - `endEffect` setzt `ended_at` statt zu löschen.
  - `endAllEffects` betrifft nur diesen Charakter.
  - Fehler, inkl. `user_not_approved`, werden zurückgegeben.
- [x] Unit `effect-dialog.test.tsx`:
  - Vorlage „Verlangsamen“ füllt Bewegung ×½, Angriffe ×½, Angriff −4, RK −4.
  - Eigener Effekt mit Notiz und bedingter Rettung.
  - Faktor auf Angriff ist nicht auswählbar.
  - Leerer Name blockiert.
- [x] Unit `effect-chips.test.tsx`: Beenden mit Bestätigung; Readonly ohne ✕/+, „+N“ ab 4 Effekten.
- [x] Unit `play-hp-bar.test.tsx`: „+6“ sichtbar; 8 Schaden → `onDamage(8)`.
- [x] Unit `use-character-effects.test.ts` (`absorbDamage`): Schaden verbraucht zuerst den Puffer, dann TP. State, Realtime, optimistisches Beenden und Kanal-Suffix stecken im gemeinsamen Hook `useCharacterEffects`; die Container sind `effects-bar.tsx` (Spielmodus) und `effects-section.tsx` (Charakterbogen). Bei NPCs ist der Bereich ausgeblendet.
- [x] Unit Realtime-Hook: ein UPDATE mit `ended_at` entfernt den Chip.
- [x] `npm run verify` ist grün.

**Manual Verification**:

- [ ] Spielmodus: „Segen“ anlegen. Eigener Effekt „Krit: Bein gebrochen“ mit Notiz, Bewegung ×½ und Angriff −2. Beide Chips erscheinen, die Details zeigen die Notiz.
- [ ] ✕ mit Bestätigung beendet einen Effekt. Ein zweiter offener Tab übernimmt das ohne Neuladen.
- [ ] „Hilfe“ mit 6 temp. TP → „+6“. 8 Schaden → Puffer weg, 2 TP abgezogen.
- [ ] Charakterbogen zeigt dieselben Effekte, „Rast: alle beenden“ leert die Liste.

---

## Phase 3: Werte verrechnen und anzeigen

[Dependencies: **Phase 1**, **Phase 2**]

**Tasks**:

- [ ] `play-mode.tsx`: `resolveEffectiveStats` + `aggregateEffects`.
  - Attribute und Modifikatoren (über `toModifierScore`)
  - Rettungswürfe
  - RK über die neuen `calculateAC`-Parameter
  - THAC0 in der TP-Leiste = effektiv
  - Angriff und Schaden an die Panels
  - Bewegung × Faktor
  - Temporäre TP
- [ ] `play-combat-panel.tsx`:
  - Angriffe/Runde × Faktor (Formatierung 1/2, 3/2 …); bei `noAttacks` „keine (Effekt)“.
  - THAC0 und Schaden pro Waffe.
  - RK-Aufschlüsselung: Effekt-Zeilen; bei `noDexBonus`/`noShield`/`effectAcSet` die betroffenen Zeilen ausblenden, damit die Summe stimmt.
- [ ] `play-checks-panel.tsx`:
  - Den eigenen Resolver entfernen; effektive Werte und Unterwerte kommen aus `play-mode`.
  - Rettungswürfe mit Herkunft und bedingten Hinweisen.
  - Attributsproben ± Effekt; Wahrnehmung (Hausregel-Basis) ± Effekt; Diebesfertigkeiten ± Punkte.
  - Ungenutzte Props `magicSaveBonuses`/`magicPerceptionBonus` entfernen bzw. konsistent machen.
- [ ] `play-spellbook-panel.tsx`: Hinweis „kann nicht zaubern“ bzw. „Zauberpatzer X %“.
- [ ] `effect-warnings.tsx` im Spielmodus mit den effektiven Attributen.
- [ ] `character-sheet.tsx`: eigenen Resolver durch `resolveEffectiveStats` ersetzen; Badges „effektiv X“ an Attributen, RK, THAC0 und Rettungswürfen.
- [ ] `master/page.tsx` und `dashboard/page.tsx`: Effekte der Charaktere laden und an `computeCharacterCombatData` übergeben. Der Simulator-Adapter übergibt nichts (dokumentiert).
- [ ] `master-character-card.tsx` und `master-party-panel.tsx`:
  - THAC0 = `thac0Effective`.
  - Live-TP kombiniert mit dem Delta `combat.hpMax − character.hp_max` und `tempHp`.
  - Readonly-Chips.
- [ ] `master-dashboard.tsx`:
  - `useRealtimeRefresh` auf `character_effects` (Filter auf die angezeigten Charaktere).
  - HP-Kanal hängt nur noch an den IDs.
- [ ] `use-realtime-refresh.ts`: Channel-Name mit Instanz-Suffix (#174).
- [ ] `CLAUDE.md`:
  - Abschnitt „Temporäre Effekte“: Tabelle/Soft-Delete, Spielersicht, Reihenfolge, Unterwerte, `toModifierScore`, bedingte Hinweise, temporäre TP, Ausnahmen (Gestaltwandlung, Simulator, Druck), vereinheitlichter Resolver
  - Projektstruktur, Roadmap

**Automated Verification**:

- [ ] Unit `play-checks-panel.test.tsx`: Mit Seuche zeigt die CHA-Probe den reduzierten Wert samt Herkunft; „+2 gegen Böse“ erscheint als Hinweis, die Zahl bleibt.
- [ ] Unit `play-combat-panel.test.tsx`:
  - Verlangsamen → Angriffe ½, RK-Aufschlüsselung mit „Verlangsamen“, Summe stimmt.
  - Stinkwolke → „keine (Effekt)“.
  - `noDexBonus` blendet die GE-Zeile aus.
- [ ] Unit `master-character-card.test.tsx`: Effektiver THAC0 und Live-TP mit Effekt-Delta und „+N temp.“.
- [ ] Unit `use-realtime-refresh.test.ts`: Zwei Instanzen erzeugen verschiedene Channel-Namen.
- [ ] Quelltext-Guard: `master/page.tsx` und `dashboard/page.tsx` übergeben Effekte; die NPC-Seiten übergeben `[]`.
- [ ] `npm run verify` ist grün.

**Manual Verification**:

- [ ] „Seuche“: CHA, STR und GES je −2, ETW0 2 schlechter (TP-Leiste und Kampf), Herkunft sichtbar. Nach Beenden ist alles wie vorher.
- [ ] „Verlangsamen“: Bewegung und Angriffe halbiert, RK 4 und ETW0 4 schlechter, RK-Aufschlüsselung schlüssig.
- [ ] „Schutz vor Bösem“: „+2 gegen Böse“ als Hinweis, Zahlen unverändert.
- [ ] „Schwächendes Gift“: alle Attribute halbiert. Fällt ein Wert unter 3, erscheint die Warnung, nichts stürzt ab.
- [ ] Zweimal „Segen“ → Stapel-Warnung.
- [ ] GM-Dashboard: Effekt anlegen und beenden erscheint ohne Neuladen; ETW0 und RK der Karte enthalten den Effekt; „+N temp.“ sichtbar.
- [ ] Tablet (800 px, Mobil und Automatisch): Chips umbrechen, Dialog ohne Überlauf.

---

## References

- Research: `docs/agents/research/2026-10-05-temporary-effects.md` (inkl. Follow-up-Katalog)
- Muster: Stufenaufstieg (PR #178), `useRealtimeRefresh`, `calculateAC`, `scaleSubStat`
- Simulator-Effektmodell: `src/lib/combat-simulator/types.ts:43-74`
