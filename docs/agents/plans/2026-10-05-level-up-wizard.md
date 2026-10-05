---
date: 2026-10-05T11:04:30+00:00
git_commit: 261dcfde8e482e3598c97f216cdd347ad61a7884
branch: feat/level-up-wizard
topic: "Stufenaufstiegs-Assistent: TP-Wurf, Diebespunkte, Übersicht"
tags: [plan, level-up, hitpoints, experience, thief, character-sheet]
status: implemented
---

# Stufenaufstiegs-Assistent Implementation Plan

## Overview

Ein Stufenaufstieg passiert heute stillschweigend im XP-Dialog: Die Stufe wird gesetzt, TP und Diebespunkte bleiben unverändert. Wir bauen einen **Stufenaufstiegs-Assistenten**, der pro Stufe (und pro Klasse) drei Schritte durchläuft:

1. Er fragt das Ergebnis des **echten Trefferwürfels** ab und rechnet CON, Multiclass sowie feste TP nach PHB.
2. Er lässt Dieben und Barden ihre **Fertigkeitspunkte verteilen**.
3. Er zeigt eine **Übersicht aller Änderungen** und übernimmt sie anschließend.

Nebenbei werden zwei Regelfehler nach PHB korrigiert:

- Feste TP gibt es bei Schurken und Magiern erst ab Stufe 11.
- Schurken bekommen alle 4 Stufen einen neuen NWP-Slot.

## Current State Analysis

Grundlage: `docs/agents/research/2026-10-05-level-up.md`.

**XP-Dialog** (`xp-add-dialog.tsx:131-182`):

- Schreibt `character_classes.{xp_current, level}` und legt einen Eintrag in `xp_history` an.
- Die Stufe ergibt sich aus `previewXpGain` und kann mehrere Stufen auf einmal umfassen.
- Angezeigt wird nur ein Inline-Hinweis „Stufenaufstieg!“.

**TP:** `hitpoints.ts` hat keine Funktion für TP pro Stufe. `hp_max` wird nur manuell geändert. Trefferwürfel kommen aus `ClassDefinition.hitDie` bzw. `getEffectiveHitDie(base, kit)` (`kits.ts:2848`). Der CON-Bonus kommt aus `getConstitutionModifiers(...).hpAdj`, Cap über `getConBonusCap`.

**Diebesfertigkeiten:**

- `characters.thief_*` (7 Felder) enthält **Endwerte in %** und wird manuell gepflegt.
- `hasThiefSkills` gilt für Dieb und Barde.
- Ein Feld für Taschendiebstahl gibt es nicht.

**`characters.level`:** deprecated, steuert aber die Epic-Item-Schwellen (`character-computed.ts:133`, `play-mode.tsx:255`). Wird beim Aufstieg nicht aktualisiert.

**Diff-Bausteine:**

- `getNextLevelChanges` (`experience.ts:122-198`) deckt THAC0, ein Rettungswurf-Flag, Zauberplätze, Angriffe, Waffen-/NWP-Slots und Hinterhalt ab.
- Weitere Quellen:
  - `getSavingThrows(ForClass)`
  - `getPriestSpellPoints`/`getWizardSpellPoints`
  - `getTurnTarget` + `UNDEAD_TYPES` (`turn-undead.ts:44,90`)
  - `getActivePowers` (`priesthoods.ts:4005`)
  - `getAutoUnlockedLevel` (`epic-items.ts:145`)

**Regelfehler:**

- `getNonweaponProficiencySlots` (`proficiencies.ts:24-31`) rechnet für Schurken mit +1 alle 3 Stufen, laut PHB Tab. 34 alle 4.
- Spec `CLASS-011` nennt feste TP „nach Level 9“ für alle Gruppen.
- Die korrigierte NWP-Formel betrifft heute **Nowi (Dieb 8)** und **Sprocket (Dieb 7)**: je 5 → 4 Slots. Isolde (9) bleibt bei 5.

## Desired End State

**Auslösen:**

- Nach dem Eintragen von XP öffnet sich der Assistent automatisch, wenn mindestens eine Klasse eine neue Stufe erreicht hat.
- Wird er geschlossen, bleibt der Aufstieg **ausstehend**. Charakterbogen und Spielmodus zeigen dann „⬆ Stufenaufstieg verfügbar“ mit Knopf zum Fortsetzen.
- „Ausstehend“ wird aus XP > Stufe abgeleitet und nicht gespeichert.

**Ablauf:** Jeder Aufstieg ist **eine Stufe einer Klasse**. Mehrere Stufen oder Klassen laufen nacheinander.

**① Trefferpunkte:**

- Der Spieler gibt das Ergebnis seines echten Würfels ein (1…N).
- Die App rechnet CON-Bonus und den Kit-Trefferwürfel ein.
  - CON aus `getConstitutionModifiers(con, con_health, con_fitness).hpAdj`, also inklusive Fitness-Unterwert.
  - CON-Cap +4, wenn eine aktive Klasse Krieger ist, sonst +2 (PHB L7966-7971).
- Multiclass nach PHB L7975-7988: Würfel ÷ Anzahl Klassen (abgerundet, min. 1), CON-Bonus ebenfalls ÷ Anzahl (abgerundet), beides addiert, Gesamt min. 1.
- Ab Name-Level gibt es feste TP ohne Eingabe:
  - Krieger und Priester ab Stufe 10: +3 bzw. +2
  - Schurken und Magier ab Stufe 11: +2 bzw. +1
- Feste TP bei Multiclass werden ebenfalls geteilt (abgerundet, min. 1). Das PHB regelt das nicht ausdrücklich, es ist eine dokumentierte Annahme.
- Dual-Class nach vorhandenem Modell (`switch_level` an der Ursprungsklasse): keine TP, solange die neue Klasse ≤ `switch_level` ist. Teiler 1.
- Angezeigt und geschrieben wird der **gespeicherte** `hp_max`. Effektive Werte mit Epic-CON-Delta bleiben wie bisher eine Laufzeit-Ableitung.
- **Nur `hp_max` steigt**, `hp_current` bleibt unverändert.

**② Fertigkeitspunkte** (nur Dieb und Barde):

- Dieb: 30 Punkte auf alle 7 Fertigkeiten.
- Barde: 15 Punkte auf Klettern, Geräusche hören und Sprachen lesen.
- Grenzen: max. 15 pro Fertigkeit und Stufe, Endwert max. 95 %. Werte, die heute schon darüber liegen, bekommen nichts dazu.
- Nicht verteilte Punkte sind erlaubt, mit Hinweis: „X Punkte nicht verteilt (z. B. Taschendiebstahl, in der App nicht erfasst)“. Sonst würde der Assistent blockieren, sobald der Spielraum bis 95 % kleiner als die Punktzahl ist.

**③ Übersicht** mit vorher → nachher:

- THAC0, alle 5 Rettungswürfe, Angriffe/Runde
- Waffen- und NWP-Slots, Zauberplätze, Zauberpunkte, Hinterhalt
- Untote vertreiben (geänderte Einträge)
- Neue Granted Powers, freigeschaltete Epic-Item-Stufen
- Hinweise wie Gefolgsleute, Zauberbeginn für Ranger/Paladin, feste TP ab nächster Stufe

**④ Übernehmen** schreibt:

- `character_classes.level`
- (Basis der Epic-Freischaltung „vorher“ ist das bisher genutzte `characters.level`, „nachher“ die neue höchste aktive Klassenstufe. Dadurch erscheinen auch nachgeholte Freischaltungen in der Übersicht.)
- `characters.hp_max`
- `characters.level` = höchste aktive Klassenstufe
- die Diebeswerte

**Engine:** NWP-Slots für Schurken folgen PHB (3 + 1 alle 4 Stufen). Die Spec `CLASS-011` und `PROF-002` ist korrigiert.

## What We're NOT Doing

- Kein Würfeln durch die App, keine TP-Hausregeln.
- Keine automatische Vergabe neuer Waffen- oder NWP-Slots. Die Übersicht nennt sie, vergeben wird wie bisher im Charakterbogen.
- Kein Training und keine Begrenzung „eine Stufe pro Abenteuer“, keine Rassen-Stufengrenze (nur Hausregel-Warnungen, wie sonst auch).
- Keine Dual-Class-Wechsel-UI (`switch_level` bleibt ungenutzt).
- Kein Rückgängig-Machen eines Aufstiegs. Das manuelle Stufen-, TP- und Fertigkeitsfeld im Charakterbogen bleibt als Korrekturweg.
- Kit- und Klassenfähigkeiten in der Übersicht: Diese haben kein Stufenfeld (`ClassAbility`, `KitDefinition.abilities`). Gefolgsleute u. ä. kommen als feste Hinweise aus einer kleinen Tabelle.
- Kein Taschendiebstahl-Feld. Punkte dafür bleiben als „nicht verteilt“ stehen (siehe ②).
- Keine Vereinheitlichung der CON-Cap-Logik in `play-mode.tsx`/`epic-equipment-view.tsx` (dort Cap pro Klassengruppe). Der Aufstieg folgt dem PHB, die Abweichung wird in `CLAUDE.md` dokumentiert.
- Keine Benachrichtigung an den GM.

## UI Mockups

**Hinweis bei ausstehendem Aufstieg** (Charakterbogen-Kopf und Spielmodus unter der TP-Leiste):

```
┌──────────────────────────────────────────────────────────────┐
│ ⬆ Stufenaufstieg verfügbar: Dieb 9 → 10        [Jetzt aufsteigen] │
└──────────────────────────────────────────────────────────────┘
```

**Assistent, Schritt 1 (Würfelstufe):**

```
┌─ ⬆ Stufenaufstieg · Isolde · Dieb 9 → 10 ────── Schritt 1 / 3 ─┐
│  Trefferpunkte                                                   │
│  Wirf 1W6 und trage das Ergebnis ein:   [ 4 ]  (1–6)             │
│                                                                  │
│    Würfel            4                                           │
│    CON-Bonus (15)   +1                                           │
│    ─────────────────────                                         │
│    Neue TP          +5      Max. TP  31 → 36                     │
│                                                                  │
│                                   [Abbrechen]  [Weiter →]        │
└──────────────────────────────────────────────────────────────────┘
```

**Schritt 1 (feste TP, ab Stufe 11 Schurke):**

```
│  Trefferpunkte                                                   │
│  Ab Stufe 11 würfeln Schurken nicht mehr: +2 TP (ohne CON-Bonus) │
│  Max. TP  48 → 50                                                │
```

**Schritt 2 (Fertigkeitspunkte):**

```
┌─ ⬆ Stufenaufstieg · Isolde · Dieb 9 → 10 ────── Schritt 2 / 3 ─┐
│  Fertigkeitspunkte verteilen     Übrig: 0 / 30  (max. 15 je Wert) │
│   Schlösser öffnen        65 %  [−] +10 [+]  → 75 %              │
│   Fallen finden/entsch.   55 %  [−]  +5 [+]  → 60 %              │
│   Leise bewegen           80 %  [−] +15 [+]  → 95 %  (Maximum)   │
│   Im Schatten verstecken  70 %  [−]   0 [+]  → 70 %              │
│   …                                                              │
│                              [← Zurück]  [Weiter →] (aktiv bei 0)│
└──────────────────────────────────────────────────────────────────┘
```

**Schritt 3 (Übersicht):**

```
┌─ ⬆ Stufenaufstieg · Nowi · Dieb 8 → 9 ───────── Schritt 3 / 3 ─┐
│  Trefferpunkte        Max. 31 → 36 (+5)                          │
│  ETW0                 17 → 16                                    │
│  Rettungswürfe        Lähmung 12→11 · Gift 12→11 · Stab 10→9 …   │
│  Hinterhalt           ×3 → ×4                                    │
│  Fertigkeiten         Schlösser 65→75 · Fallen 55→60 · Leise 80→95│
│  NWP-Slots            4 → 5   (neuer Slot im Charakterbogen vergeben)│
│  Epic: Schattentänzer Stufe 4 freigeschaltet                     │
│                              [← Zurück]  [Aufstieg übernehmen]   │
└──────────────────────────────────────────────────────────────────┘
```

## Architecture and Code Reuse

```
XP-Dialog ──(nur xp_current)──► character_classes
     │
     └─► getPendingLevelUps(classes) ──► [ {classRowId, classId, fromLevel, toLevel=from+1}, … ]
                                              │
LevelUpDialog (pro Eintrag) ──────────────────┘
   ① getLevelUpHitPoints({…, dieRoll})          src/lib/rules/level-up.ts (rein, getestet)
   ② getLevelUpSkillPoints(classId) + validateSkillAllocation(...)
   ③ buildLevelUpSummary({character, classes, before, after, epicItems})
   ④ applyLevelUp(plan)  ──► character_classes.level, characters.{hp_max, level, thief_*}
```

- **Reuse:**
  - `getNextLevelChanges`-Logik: wird in `buildLevelUpSummary` aufgegangen bzw. erweitert. Der XP-Dialog nutzt weiter seine Vorschau.
  - `getThac0`, `getSavingThrowsForClass`, `getAttacksPerRound`, `getWeaponProficiencySlots`, `getNonweaponProficiencySlots`
  - `get*SpellSlots`, `getPriestSpellPoints`, `getWizardSpellPoints`
  - `getBackstabMultiplier`, `getTurnTarget`/`UNDEAD_TYPES`, `getActivePowers`, `getAutoUnlockedLevel`
  - `getEffectiveHitDie`, `getConstitutionModifiers`, `getConBonusCap`
  - `getLevelForXp`, `getHighestActiveClassLevel`
- **Neu:** `src/lib/rules/level-up.ts` als reines Modul, Teil der Regelwerk-Engine. Dazu Dialog-Komponenten unter `src/components/level-up/`.
- **Keine neue Library.**

Betroffene Dateien:

- `src/lib/rules/level-up.ts` (neu)
  - `getPendingLevelUps(classes): PendingLevelUp[]`
  - `getLevelUpHitPoints(input): LevelUpHitPoints` (`mode: "roll" | "fixed" | "none"`, `die`, `conBonus`, `divisor`, `gain`, `rollsThrough`)
  - `getLevelUpSkillPoints(classId): { points, maxPerSkill: 15, cap: 95, skills: ThiefSkillKey[] } | null`
  - `validateSkillAllocation(current, allocation, rules): { valid, remaining, errors }`
  - `buildLevelUpSummary(input): LevelUpChange[]`
  - `LEVEL_UP_NOTES` (Gefolgsleute, Ranger-/Paladin-Zauberbeginn …)
- `src/lib/rules/hitpoints.ts`: `getFixedHitPointsAfterNameLevel(group)` und `getHitDiceLevelCap(group)` (9 bzw. 10)
- `src/lib/rules/proficiencies.ts`: NWP-Formel pro Gruppe nach Tab. 34
- `src/lib/rules/spec/character-creation-rules.ts`: `CLASS-011`, `PROF-002` korrigieren, neue Regel-IDs `CLASS-014` (TP pro Stufe) und `THIEF-005` (Punkte pro Stufe)
- `src/lib/rules/index.ts`: Barrel-Export
- `src/lib/level-up/apply-level-up.ts` (neu): `applyLevelUp(supabase, plan)` als dünner I/O-Layer
- `src/components/level-up/`
  - `level-up-dialog.tsx` (Stepper)
  - `level-up-hp-step.tsx`
  - `level-up-skills-step.tsx`
  - `level-up-summary-step.tsx`
  - `pending-level-up-banner.tsx`
- `src/components/character-sheet/xp-add-dialog.tsx`: schreibt nur noch `xp_current` und meldet ausstehende Aufstiege an den Bogen
- `src/components/character-sheet/character-sheet.tsx`: Banner + Dialog einbinden, nach XP-Eintrag öffnen
- `src/components/play-mode/play-mode.tsx`: Banner + Dialog (am Spieltisch aufsteigen)
- `messages/de.json`, `messages/en.json`: Namespace `levelUp`
- `CLAUDE.md`: Kernfunktionen, Projektstruktur, Roadmap

## Performance Considerations

- Alle Berechnungen sind rein und klein.
- `applyLevelUp` macht zwei Updates parallel (`character_classes`, `characters`).
- Keine neuen Queries beim Seitenaufbau: Ausstehende Aufstiege werden aus den bereits geladenen Klassen abgeleitet.

## Migration Notes

- **Keine DB-Migration.**
- Bestehende Charaktere, deren XP schon über der Stufe liegt (z. B. weil manuell XP eingetragen wurde), sehen nach dem Deploy sofort „Stufenaufstieg verfügbar“. Das ist gewollt.
- Die NWP-Korrektur senkt die Slot-Anzeige bei Schurken auf bestimmten Stufen (heute Nowi und Sprocket: 5 → 4). Bereits vergebene Fertigkeiten bleiben erhalten, der Fertigkeiten-Tab zeigt die Übervergabe wie bisher als Warnung (keine Blockade, Hausregel).

---

## Phase 1: Regelwerk (TP, Punkte, Übersicht, Korrekturen)

Reine, vollständig getestete Engine-Funktionen ohne UI.

**Tasks**:

- [x] `hitpoints.ts`: `getHitDiceLevelCap(group)` (warrior/priest 9, rogue/wizard 10) und `getFixedHitPointsAfterNameLevel(group)` (3/2/2/1) ergänzen.
- [x] `multiclass.ts` `getEffectiveClassEntries(classes)`: Die Dual-Class-Logik aus `character-computed.ts:105-125` als Helfer extrahieren und `character-computed.ts` darauf umstellen (Verhalten unverändert).
- [x] `level-up.ts` `getLevelUpHitPoints`:
  ```ts
  getLevelUpHitPoints({
    classId, newLevel, kit, conHpAdj,          // hpAdj inkl. con_health/con_fitness
    classes,                                   // alle character_classes (Teiler, Krieger-Cap, Dual-Class)
    dieRoll,                                   // nur bei mode "roll"
  }): { mode: "roll"|"fixed"|"none"; die: number; conBonus: number; divisor: number; gain: number }
  ```
  - `none`: Dual-Class (eine Klasse hat `switch_level`), die aufsteigende Klasse ist die neue, und `newLevel <= switch_level`.
  - Teiler: 1 bei Dual-Class, sonst Anzahl aktiver Klassen.
  - `fixed`: wenn `newLevel > getHitDiceLevelCap(group)`. Gewinn = `max(1, floor(fixed / divisor))`.
  - `roll`: Gewinn = `max(1, max(1, floor(dieRoll / divisor)) + floor(cappedCon / divisor))`.
    - CON-Cap 4 bei einer aktiven Kriegerklasse, sonst 2; Mali ungekappt.
    - `die` = `getEffectiveHitDie(classDef.hitDie, kit)`.
  - `dieRoll` außerhalb 1…die führt zu einem Fehler.
- [x] `level-up.ts` `getPendingLevelUps(classes)`: Für jede aktive Klasse mit `getLevelForXp(classId, xp_current) > level` genau **einen** Eintrag `{fromLevel: level, toLevel: level + 1}` erzeugen. Stabil sortiert nach `created_at`, dann `id`, weil die Queries ohne ORDER BY laden.
- [x] `level-up.ts` `getLevelUpSkillPoints(classId)`:
  - Dieb: 30 Punkte, alle 7 Fertigkeiten.
  - Barde: 15 Punkte, `climbWalls`, `detectNoise`, `readLanguages`.
  - Sonst `null`.
  - Je 15 pro Fertigkeit, Endwert max. 95.
- [x] `level-up.ts` `validateSkillAllocation(current, allocation, rules)` liefert `{ valid, remaining, errors }`.
  - Fehler bei: mehr als 15 auf einer Fertigkeit, Endwert über 95, negativ, nicht erlaubte Fertigkeit, Summe größer als die Punkte.
  - Restpunkte > 0 sind gültig und werden nur als Hinweis geliefert.
- [x] `level-up.ts` `buildLevelUpSummary({ character, classes, classId, fromLevel, toLevel, epicItems })` liefert `LevelUpChange[]` mit `kind` und `before`/`after`:
  - `thac0` und `save` (je Kategorie, nur geänderte): über `getEffectiveClassEntries` → `getMulticlassThac0`/`getMulticlassSaves` mit den Klassen vorher/nachher. Damit ändert sich nur, was der Spieler auch tatsächlich sieht (Multiclass best-of, Dual-Class-Ruhephase).
  - `attacks`, `weaponSlots`, `nwpSlots`
  - `spellSlots`: inkl. `getRangerSpellSlots`/`getPaladinSpellSlots`, damit der Zauberbeginn von Ranger und Paladin automatisch erscheint
  - `spellPoints`, `backstab`
  - `turnUndead`: geänderte Einträge über `UNDEAD_TYPES` und `getTurnTarget(undeadType, level)`. Paladin über `getPaladinTurnLevel`; Priesterklassen nur, wenn `priesthoodHasTurnUndead`.
  - `grantedPower`: neu aktive über `getActivePowers(priesthood, …)`
  - `epicUnlock`: `getAutoUnlockedLevel` vorher mit `characters.level` (was die App bisher nutzt), nachher mit `getHighestActiveClassLevel(classesAfter, character.level)`
  - `note`: aus `LEVEL_UP_NOTES` für die neue Stufe (Gefolgsleute Kämpfer 9, Dieb 10, Ranger 10, Barde 9; Kleriker-Festung 9; feste TP ab nächster Stufe)
- [x] `proficiencies.ts` `getNonweaponProficiencySlots`: pro Gruppe nach PHB Tab. 34 (Krieger 3/3, Magier 4/3, Priester 4/3, Schurke 3/4); den Kommentar aktualisieren.
- [x] `spec/character-creation-rules.ts`:
  - `CLASS-011`: Szenario „Krieger/Priester ab 10, Schurke/Magier ab 11 feste TP“.
  - `PROF-002`: Schurke alle 4; Szenario „Rogue L4: 3 Slots, L5: 4 Slots“.
  - Neu: `CLASS-014` (TP pro Stufe inkl. Multiclass/Dual-Class) mit `implementationFiles`/`testFiles`. Die Rule-ID-Zeichenfolge muss in den Testdateien vorkommen (`coverage.test.ts:95-121`).
  - `THIEF-001` (enthält bereits „30 Punkte pro Level“) um `getLevelUpSkillPoints`/`validateSkillAllocation` und die Testdatei ergänzen, statt eine neue ID anzulegen.
- [x] `rules/index.ts`: Exporte ergänzen.

**Automated Verification**:

- [x] Unit `level-up.test.ts`, `getLevelUpHitPoints`:
  - Dieb 9→10 mit Wurf 4, CON 15 (+1): `roll`, +5. CON 16 (+2): +6.
  - Dieb 10→11: `fixed` +2, kein CON.
  - Krieger 9→10: `fixed` +3.
  - Krieger mit CON 18: +4 (Cap 4).
  - Magier mit CON 18: +2.
  - Kämpfer/Magier (2 Klassen), Magier-Aufstieg mit Wurf 3 und CON 18 (+4, Krieger-Cap): floor(3/2) + floor(4/2) = +3.
  - Wurf 1, CON +2, 2 Klassen: max(1, 0) + 1 = +2 (PHB-Mindestwert pro Würfel).
  - Kämpfer/Dieb Dieb-Aufstieg 10→11: `fixed`, floor(2/2) = +1.
  - `con_fitness` ändert den CON-Bonus (Fitness-Zeile statt CON-Zeile).
  - Wurf 1 mit CON −1: +1 (Minimum).
  - Kit mit `hitDieOverride` ändert `die`.
  - Dual-Class (Ursprung `switch_level` 5): neue Klasse 4→5 `none`; 5→6 `roll` mit Teiler 1.
  - Wurf 0 oder 7 bei W6 wirft.
- [x] Unit `getPendingLevelUps`:
  - XP knapp unter der Schwelle: leer.
  - Zwei Stufen XP-Vorsprung: ein Eintrag (from → from+1).
  - Zwei Klassen gleichzeitig: zwei Einträge.
  - Inaktive Klasse: ignoriert.
- [x] Unit `getLevelUpSkillPoints`/`validateSkillAllocation`:
  - Dieb 30, Barde 15 (3 Fertigkeiten), Kämpfer `null`.
  - 16 auf einer Fertigkeit, Endwert 96, Restpunkte ≠ 0, Barde auf Schlösser: jeweils Fehler.
  - Gültige Verteilung: `valid`.
  - Restpunkte > 0: `valid` mit `remaining`.
  - Fertigkeit schon bei 95: darf 0 bekommen, nicht mehr.
- [x] Unit `buildLevelUpSummary`:
  - Dieb 8→9: THAC0 17→16, Rettungswürfe geändert, Hinterhalt ×3→×4, NWP 4→5.
  - Dieb 9→10: keine Kampfwert-Änderung, Gefolgsleute-Hinweis.
  - Dual-Class in der Ruhephase: THAC0 nur aus der neuen Klasse.
  - Paladin 2→3: Untote-vertreiben-Einträge erscheinen. Ranger 7→8: Zauberplätze erscheinen.
  - Kleriker 6→7: Zauberplätze, Untote-vertreiben-Einträge, neue Granted Power (mit Fixture-Priesthood).
  - Epic-Item mit `level_thresholds` [3,5,7,9] bei 8→9: `epicUnlock`. Bei `characters.level` = 1 (veraltet) und 8→9: alle nachgeholten Stufen werden genannt.
  - Krieger 6→7: Angriffe 1 → 3/2.
- [x] Unit `proficiencies.test.ts`: Schurke L1/4/5/8/9 = 3/3/4/4/5; Krieger, Magier und Priester unverändert.
- [x] `getEffectiveClassEntries`-Test (Multiclass, Dual-Class ruhend/aktiv). Bestehende `character-computed`-Tests bleiben grün.
- [x] `coverage.test.ts` (Spec) ist grün mit den neuen Regel-IDs. Das `PROF-002`-Szenario „Rogue L4: 3 Slots“ ist angepasst.
- [x] `npm run verify` ist grün.

---

## Phase 2: Assistent und Anbindung

[Dependencies: **Phase 1**]

**Tasks**:

- [x] `src/lib/level-up/apply-level-up.ts`: `applyLevelUp(supabase, { classRowId, toLevel, characterId, hpMaxAfter, characterLevelAfter, thiefSkillUpdates })`. Parallel `character_classes.update({level})` und `characters.update({hp_max, level, ...thief_*})`, Fehler werden gesammelt zurückgegeben.
- [x] `level-up-hp-step.tsx`:
  - Ziffern-Eingabe 1…N mit `inputMode="numeric"` (Tablet) und Live-Rechnung.
  - Bei `fixed`/`none` nur ein Text, keine Eingabe.
- [x] `level-up-skills-step.tsx`:
  - Pro Fertigkeit: aktueller Wert, ±-Buttons (Schritt 5, Feinjustierung 1 per Eingabe), Vorschau.
  - Anzeige „Übrig X / N“.
  - Weiter nur ohne Fehler. Bei Restpunkten erscheint der Hinweis „nicht verteilt (z. B. Taschendiebstahl)“.
- [x] `level-up-summary-step.tsx`: Rendert `LevelUpChange[]` gruppiert (TP, Kampf, Rettungswürfe, Fertigkeiten, Magie, Freischaltungen, Hinweise) mit i18n.
- [x] `level-up-dialog.tsx`:
  - Stepper ①–③. Schritt ② entfällt ohne Punkte.
  - Titel „Stufenaufstieg · Name · Klasse X → Y“.
  - Bei mehreren ausstehenden Aufstiegen startet nach dem Übernehmen direkt der nächste („Weiter mit Stufe 11“).
  - Abbrechen jederzeit, ohne Änderung.
- [x] `pending-level-up-banner.tsx`: Zeigt den ersten ausstehenden Aufstieg und öffnet den Dialog. Nur für den Owner (`isOwner`); andere sehen nichts.
- [x] `character-sheet.tsx` `handleDeleteXpEntry` (`:665-708`): schreibt nur noch `xp_current`, kein `getLevelForXp`-Level mehr. Sonst würde das Löschen eines XP-Eintrags den Aufstieg ohne TP und Punkte auslösen oder Stufen absenken.
- [x] `xp-add-dialog.tsx`:
  - `handleApply` schreibt nur noch `xp_current` (keine `level`).
  - Die Vorschau „Stufenaufstieg!“ zeigt nur, wenn durch diesen Eintrag **zusätzlich** ein Aufstieg ausstehend wird. Basis ist `max(level, getLevelForXp(xp_current))`.
  - Der optimistische Update setzt nur XP.
  - Der Callback `onLevelUpPending()` ruft den Bogen, wenn `getPendingLevelUps` nicht leer ist.
  - Die Vorschau „Stufenaufstieg!“ bleibt.
- [x] `character-sheet.tsx`:
  - Banner unter dem Kopf.
  - `LevelUpDialog` mit Klassen, Charakter und Epic-Items.
  - Nach dem Übernehmen den lokalen State (`charClasses`, `character.hp_max`, `character.level`, `thief_*`) **mergen**. Das schützt vor dem Überschreiben durch `handleSave`, das alle Felder aus dem lokalen State schreibt (`:503-570`).
  - Nach dem XP-Eintrag automatisch öffnen.
- [x] `play-mode.tsx`: Banner unter der TP-Leiste und Dialog (Owner). Nach dem Übernehmen `character` optimistisch aktualisieren (`hp_max`, `level`, `thief_*`) und `router.refresh()`. `characterClasses` ist hier nur ein Prop.
- [x] `messages/de.json`, `messages/en.json`: Namespace `levelUpWizard` (Titel, Schritte, Würfel-Labels, Fehlertexte, Change-Labels, Hinweise). `sheet.levelUp` existiert bereits.

**Automated Verification**:

- [x] Unit `apply-level-up.test.ts`: Schreibt die richtigen Felder in beide Tabellen, gibt Fehler zurück statt zu werfen, und `characters.level` = höchste aktive Klassenstufe.
- [x] Unit `level-up-dialog.test.tsx`:
  - **Dieb:** Würfel 4 eingeben → „+5“, „31 → 36“. Weiter → Punkte verteilen (Weiter erst bei 0 übrig) → Übersicht enthält TP, Hinterhalt/NWP und Fertigkeiten. Übernehmen ruft `applyLevelUp` mit `hp_max` 36 und den neuen `thief_*`.
  - **Kämpfer:** Schritt ② entfällt.
  - **Schurke 10→11:** keine Würfeleingabe.
  - **Abbrechen:** kein `applyLevelUp`.
  - **Zwei ausstehende Aufstiege:** Nach dem ersten folgt der zweite.
- [x] Unit `pending-level-up-banner.test.tsx`: Sichtbar bei XP über der Schwelle, unsichtbar sonst und für Nicht-Owner.
- [x] Unit `xp-add-dialog.test.tsx` (neu): Apply schreibt `xp_current` ohne `level` und meldet einen ausstehenden Aufstieg. Bei bereits ausstehendem Aufstieg zeigt ein kleiner XP-Eintrag kein neues „Stufenaufstieg!“.
- [x] Unit `deductXpFromClasses` (`experience.test.ts`): Löschen eines XP-Eintrags ändert die Stufe nicht.
- [x] Optik geprüft (temporäre Vorschauseite, Playwright-Screenshots bei 800 px und 390 px, danach gelöscht): alle drei Schritte lesbar, kein Überlauf.
- [x] `npm run verify` ist grün.

**Manual Verification**:

- [ ] Charakterbogen eines Diebs:
  1. XP eintragen, die bis zur nächsten Stufe reichen. Der Assistent öffnet sich.
  2. Echten W6 werfen und eintragen. Die TP-Rechnung stimmt.
  3. 30 Punkte verteilen. Mehr als 15 pro Fertigkeit oder über 95 % ist nicht möglich.
  4. Die Übersicht prüfen und übernehmen. Stufe, Max. TP und Fertigkeiten sind im Bogen aktualisiert, die aktuellen TP unverändert.
- [ ] Assistent mittendrin schließen: Der Hinweis „Stufenaufstieg verfügbar“ erscheint im Bogen und im Spielmodus. Darüber fortsetzen.
- [ ] Kämpfer oder Kleriker: kein Punkte-Schritt. Die Übersicht zeigt THAC0, Rettungswürfe bzw. Zauberplätze und Untote vertreiben.
- [ ] Charakter mit Epic-Item-Schwellen (z. B. Isolde): Eine freigeschaltete Epic-Stufe erscheint in der Übersicht und ist danach im Bereich „Episch“ aktiv.
- [ ] Nowi oder Sprocket: Der Fertigkeiten-Tab zeigt 4 NWP-Slots (PHB-Korrektur).

---

## Abschluss

- [x] `CLAUDE.md`:
  - Hausregeln/Hinweis: CON-Cap beim Aufstieg nach PHB (Krieger-Cap für den ganzen Multiclass-Charakter) vs. Cap pro Klassengruppe bei der Epic-CON-Delta-Rechnung. Feste TP bei Multiclass werden geteilt (Annahme).
  - `getTurnTarget(undeadType, level)`: Argumentreihenfolge in der Doku korrigieren.
  - Kernfunktionen: Abschnitt „Stufenaufstieg“ (`getLevelUpHitPoints`, `getPendingLevelUps`, `getLevelUpSkillPoints`, `buildLevelUpSummary`)
  - Projektstruktur: `src/lib/rules/level-up.ts`, `src/lib/level-up/`, `src/components/level-up/`
  - Roadmap-Eintrag
- [x] Research-Dokument: Status-Notiz mit Verweis auf diesen Plan.

## References

- Research: `docs/agents/research/2026-10-05-level-up.md`
- PHB-Belege: TP L2165-2200, L4234/5164/5769/6816; Multiclass L7961-8012; Dual-Class L8119-8163; Dieb L6910-6921; Barde L7592-7595; Tab. 34 L9113-9200
- Diff-Muster: `src/lib/rules/experience.ts:122-198`
- Apply-Muster (I/O-Layer mit Fehler-Sammlung): `src/lib/scan/execute-apply-plan.ts`
