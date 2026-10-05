---
date: 2026-10-05T10:42:06+00:00
git_commit: 261dcfde8e482e3598c97f216cdd347ad61a7884
branch: main
topic: "Temporäre Effekte und Zustände (Conditions) in AD&D 2e und in der App"
tags: [research, conditions, effects, combat, play-mode, gm-dashboard, rules]
status: complete
---

# Research: Temporäre Effekte und Zustände

## Research Question

Welche temporären Effekte und Zustände kennt AD&D 2e, mit welcher Dauer und mechanischen Auswirkung? Gemeint sind kritische Treffer aus _Player's Option: Combat & Tactics_, Bewusstlosigkeit, halbe Bewegung, Konzentrationsverlust, Zauber-Buffs und -Debuffs, Gifte, Krankheiten, Erschöpfung und Furcht. Und wie ist der heutige Code aufgebaut, an den sich ein Effekt-System anhängen müsste: Charakterdaten, `computeCharacterCombatData`, Play Mode, GM-Dashboard, Realtime und die Aggregation der Epic- und Magic-Item-Effekte?

## Summary

### Regelseite

AD&D 2e hat **keine zentrale Zustandsliste**, anders als 3e/5e. Zustände sind über PHB, DMG, _Combat & Tactics_ (C&T), _Spells & Magic_ (S&M) und das _Complete Fighter's Handbook_ (CFH) verstreut. Inhaltlich lassen sie sich in **fünf Wirkungsklassen** ordnen:

| Klasse                                | Typische Wirkung                                                       | Beispiele                                                                                                                               | Dauer-Einheit              |
| ------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **Kampfwerte-Modifikator**            | ±Angriff, ±Schaden, ±RK, ±Rettungswürfe, ±Initiative                   | Bless/Curse, Prayer, Chant, Aid, Slow, Faerie Fire, Protection from Evil, Emotion, Ray of Enfeeblement                                  | Kampfrunden                |
| **Bewegung/Aktionen**                 | ×½/⅓/⅔ Bewegung, ×2 bzw. ×½ Angriffe, keine Angriffe, keine Zauber     | Haste, Slow, Bein-Treffer (C&T), Stinking Cloud, Web, Entangle, Belastung                                                               | Runden bis Heilung         |
| **Handlungsunfähig**                  | Angriffe gegen ihn treffen automatisch bzw. mit +4, kann nicht handeln | bewusstlos, gelähmt, gehalten (Hold), schlafend, betäubt (stunned), liegend (prone), K.O.                                               | Runden, Turns, Stunden     |
| **Attributs-/Trefferpunkt-Änderung**  | Attribut gesetzt/gesenkt, temporäre TP, max. TP gedeckelt              | Strength, Ray of Enfeeblement (STR 5), Contagion (−2), schwächendes Gift (alle ½), Aid (+1W8 temp. TP), C&T-Wunden (max. TP 75/50/25 %) | Stunden, Tage, bis Heilung |
| **Fortlaufender Schaden / Zeitgeber** | X TP pro Runde/Turn, Rettungswurf zum Beenden                          | Blutung (C&T/S&M: 1W2/Turn, 1W2/Runde, 1W6×10 %/Runde), Sterben unter 0 TP (−1/Runde), Ertrinken                                        | pro Runde/Turn             |

**Dauer-Einheiten im Spiel:**

- Kampfrunde (~1 Min.)
- Turn (10 Runden)
- Stunde / Tag
- „bis geheilt“ (an eine Heilschwelle gebunden, z. B. Cure Serious Wounds)
- „permanent bis Zauber“, z. B. Blindness, Feeblemind
- „solange Konzentration“

**Kritische Treffer (C&T, System II)** erzeugen die reichsten Effekte. Auslöser ist eine natürliche 18 oder mehr, wenn gleichzeitig um 5 oder mehr getroffen wird. Daraus folgen:

- Trefferzone (W10: Beine, Bauch, Torso, Arme, Kopf)
- Schweregrad (W6 bis 2W8, abhängig vom Größenverhältnis Waffe zu Ziel)
- Wundgrad (Streifschuss, Getroffen, Verletzt, Gebrochen, Zertrümmert, Abgetrennt)

Die Folgen sind kombinierbar:

- −2 bzw. −4 auf Angriffe
- Bewegung ⅔, ½, ⅓ oder 0
- betäubt 1–1W6 Runden, geblendet 2W4 Runden
- niedergeschlagen, Waffe oder Schild fallen gelassen
- Blutung
- max. TP gedeckelt
- bewusstlos 1W4 Stunden
- Tod

Abfolge eines kritischen Treffers:

```
Kritischer Treffer (C&T)
 ├─ Trefferzone (W10) ─┐
 ├─ Schweregrad (W6…2W8, Größenvergleich)
 └─ Rettungswurf vs. Tod misslungen
        ▼
   Wundgrad → { Angriffs-Malus, Bewegungsfaktor, betäubt X Runden,
               Blutung, max-TP-Deckel, niedergeschlagen, Gegenstand fallen }
        ▼
   endet „bei Heilung“ (Schwelle: CLW / CSW / CCW / Regeneration)
```

### Codeseite

**Es gibt heute keinen persistierten Zustand für temporäre Effekte.** Was es gibt:

- **Abgeleiteter TP-Status** `alive | unconscious | dead` aus `hp_current` (`hitpoints.ts:75-94`).
- **„Overclock“ des Kondensators** als einziger zeitlich begrenzter, persistierter Effekt (in `epic_items.simple_effects`, läuft nicht automatisch ab).
- **Flüchtige Client-Zustände:** Gestaltwandlung, Fähigkeiten-Nutzungen, Priester-Casts.
- **Ein vollständiges In-Memory-Effektmodell** im Kampfsimulator (`ActiveEffect` mit `roundsRemaining`, AC-, THAC0- und Rettungswurf-Boni, held, hasted, slowed, feared …), das nicht persistiert wird.

Die abgeleiteten Kampfwerte entstehen an **drei Stellen** mit teils unterschiedlicher Logik:

- `character-computed.ts`: GM-Dashboard, Dashboard, Simulator
- `play-mode.tsx`: eigene Inline-Berechnung
- `play-checks-panel.tsx`: eigener Stat-Resolver

**Realtime:** Das GM-Dashboard abonniert `characters`-Updates, übernimmt aber nur `hp_current`/`hp_max`. Der Play Mode hat kein Realtime.

### Schlüsseldateien

```
src/lib/rules/
  character-computed.ts   # computeCharacterCombatData — GM, Dashboard, Simulator
  magic-items.ts          # getMagicItemEffects (MagicEffects-Aggregation, movementBonus ungenutzt)
  epic-items.ts           # getEpicEffects (statOverrides, thiefPenalties/-Bonuses, …)
  hitpoints.ts            # getHpStatus, getDeathThreshold (−maxHP, Hausregel)
  equipment.ts            # calculateAC (benannte Quellen), getMovementRate
src/lib/supabase/types.ts # CharacterRow, MagicEffects (150-208), EpicItemRow
src/lib/combat-simulator/
  types.ts                # ActiveEffect, CombatEntity.activeEffects, SimulationState.round
src/components/play-mode/
  play-mode.tsx           # Inline-Effektberechnung, updateCharacter, handleHpChange, handleRest
  play-hp-bar.tsx         # TP, Bewusstlos-/Tot-Badges, RK/THAC0
  play-combat-panel.tsx   # RK-Aufschlüsselung, Bewegung, Gestaltwandlung (Client-State)
  play-checks-panel.tsx   # Rettungswürfe, Attributsproben, Wahrnehmung, Diebesfertigkeiten
  play-overclock-banner.tsx # einziger Effekt-Countdown (Anzeige)
src/components/master/
  master-dashboard.tsx    # Realtime gm-hp-updates (nur TP), Polling-Fallback
  master-party-panel.tsx, master-character-card.tsx  # Status, RK, THAC0, Rettungswürfe
src/lib/notifications.ts  # createNotification (GM → Spieler möglich)
```

## Detailed Findings

### 1. Regelkatalog (mit Belegen)

**Trefferpunkt-Zustände**

- PHB-Kern: Bei 0 TP ist der Charakter tot (PHB:19398-19402).
- Optional, laut S&M und C&T:
  - Unter 0 TP verliert er 1 TP pro Runde, bei −10 stirbt er (S&M:16459, 16494; C&T [CT-02457]).
  - Bei genau 0 TP ist er 2W6 Turns bewusstlos.
  - Nach Stabilisierung bleibt er 24 h hilflos.
- Hausregel der App: Tod bei −maxHP (`getDeathThreshold`).
- Faustkampf-K.O.:
  - PHB: 0 TP durch Faustschläge = bewusstlos; „% K.O.“ = 1W10 Runden betäubt (PHB:17643-17659).
  - CFH: 2W6 Minuten bzw. Stunden (CFH:14596).
- Erste Hilfe (Heilkunde): +1W3 TP innerhalb einer Runde (PHB:10908). Natürliche Heilung: 1 bzw. 3 TP pro Tag (PHB:19324-19344).

**Kampfzustände (PHB Tab. 51, CFH, C&T)**

- **Gehalten/schlafend:** automatischer Treffer.
- **Betäubt/liegend:** Angreifer +4; liegend greift selbst mit −4 an.
- **Überrascht:** kein Geschicklichkeits-RK-Bonus, Angreifer +1.
- **Blind/Dunkelheit:** −4, mit Blind-fighting −2.
- **Unsichtbarer Gegner:** −4.
- **Sturmangriff:** +2 auf Treffer, +1 RK-Malus, kein Geschicklichkeits-Bonus, 1 Runde (PHB:17391).
- **Rückzug:** ⅓ Bewegung; Flucht erlaubt freie Angriffe.
- **Belastung:** −1 bis −4 auf Angriffe, +1 bis +3 RK (PHB:14343-14378).
- **Erschöpfung:** CON-Proben beim Laufen, bei Misserfolg Rast (PHB:21510-21570).
- **Niederschlagen (C&T):** Rettungswurf vs. Tod, sonst liegend. Aufstehen kostet eine halbe Bewegung oder einen Angriff.
- **Moral:** Spielercharaktere würfeln nie Moral (C&T). Furcht kommt über Zauber.

**Zauber (PHB, Auswahl mit Zahlen)**

| Zauber               | Wirkung                                          | Dauer                       |
| -------------------- | ------------------------------------------------ | --------------------------- |
| Bless/Curse          | ±1 Angriff, ±1 Moral/Rettung vs. Furcht          | 6 Runden                    |
| Chant/Prayer         | ±1 (zusammen ±2) Angriff, Schaden, Rettung       | Konzentration / 1 Rd./Stufe |
| Aid                  | wie Bless + 1W8 temp. TP                         | 1 + 1 Rd./Stufe             |
| Haste                | ×2 Bewegung und Angriffe                         | 3 + 1 Rd./Stufe             |
| Slow                 | ×½ Bewegung/Angriffe, +4 RK, −4 Angriff          | 3 + 1 Rd./Stufe             |
| Ray of Enfeeblement  | STR 5 bzw. −2 Angriff/−1 Schaden                 | 1 Rd./Stufe                 |
| Strength             | +1W4…1W8 STR                                     | 1 h/Stufe                   |
| Blindness            | −4 Angriff, Angreifer +4                         | permanent bis Bannen        |
| Deafness             | −1 Überraschung, 20 % Zauberpatzer               | permanent bis Bannen        |
| Fear / Cause Fear    | Flucht                                           | Stufe bzw. 1W4 Runden       |
| Hold Person/Monster  | kann sich nicht bewegen, auto-getroffen          | 2 Rd./Stufe                 |
| Sleep                | auto-getroffen                                   | 5 Rd./Stufe                 |
| Stinking Cloud       | Übelkeit, keine Angriffe                         | 1W4+1 Rd. nach Verlassen    |
| Web / Entangle       | festgehalten                                     | 2 Turns/Stufe bzw. 1 Turn   |
| Faerie Fire          | Angreifer +2/+1                                  | 4 Rd./Stufe                 |
| Protection from Evil | böse Angreifer −2, Rettung +2                    | 2 Rd./Stufe                 |
| Emotion              | z. B. Mut +1/+3/+5 TP, Hoffnung +2               | Konzentration               |
| Confusion            | W10-Verhalten pro Runde                          | 2 + 1 Rd./Stufe             |
| Bestow Curse         | Attribut 3, −4 Angriff/Rettung oder Fallenlassen | 1 Turn/Stufe                |
| Silence              | keine verbalen Zauber                            | 2 Rd./Stufe                 |
| Contagion            | STR, DEX, CHA −2, Angriff −2                     | bis Heilung                 |
| Feeblemind           | Intelligenz eines Kleinkinds                     | permanent                   |

**Gift, Krankheit, Entzug**

- **Gift:** lähmend 2W6 h; schwächend 1W3 Tage (alle Attribute ½, ½ Bewegung, keine Heilung) (PHB:19224-19300).
- **Energieentzug:** dauerhafter Stufenverlust (PHB:19120-19220). Kein temporärer Effekt im engeren Sinne.
- **Ertrinken und Ersticken:** CON-Proben mit kumulativem −2 (PHB:21861-21886).

**Konzentrationsverlust beim Zaubern**

- Wird der Zaubernde vor Vollendung getroffen oder misslingt ihm ein Rettungswurf, ist der Zauber verloren und aus dem Gedächtnis gelöscht (PHB:15228-15238, 17113-17130, 17199-17204).
- Optionales S&M-Talent _Concentration_ (S&M:6165-6185).

**Kritische Treffer**

- PHB: keine. Die natürliche 20 trifft, die natürliche 1 verfehlt (PHB:16350).
- DMG optional:
  - Natürliche 20 = Schadenswürfel doppelt, oder ein Extra-Angriff.
  - Patzer = kein Schaden, meist Verlust der nächsten Aktion [DMG-00435/00436].
- C&T System I: ab natürlicher 18 und Treffer um 5 oder mehr doppelte Würfel.
- C&T System II (Zonen, Schweregrad, Wundgrade), siehe Summary [CT-02708…02725]:
  - Wundgrade haben Heilschwellen.
  - Angriffs- und Bewegungsmali gelten bis zur Heilung.
  - Blutung: klein 1W2/Turn, groß 1W2/Runde, schwer 1W6×10 %/Runde.
- S&M: „Critical Strikes“ für Zauber, gleiche Wundgrade (S&M:15888-16496).
- CFH: Gezielte Schläge, „betäubt/nutzlos“ ab 25 % bzw. 50 % der max. TP in einem Schlag, keine Dauerverletzungen (CFH:11110+, 14057-14340).

**Lücken im Repo:** Der DMG und C&T liegen nicht unter `ressources/books/`. Belege dafür stammen aus dem Web-Spiegel der TSR _Core Rules 2.0 Expansion_ CD-ROM (discmaster.textfiles.com, Seiten `ct/dd02445-02725`, `dmg/dd00390-00502`).

### 2. Charakterdaten

- **Spalten in `characters`:**
  - `hp_current` (darf negativ sein), `hp_max`
  - Attribute plus 12 Unterwerte
  - `thief_*`, `notes`
  - JSONB: `spell_slots_adj`, `traits`, `disadvantages`
  - Flags: `is_active`, `is_npc`, `ignore_encumbrance`, `spell_points_used`
  - **Keine** Spalte für Zustände, Effekte oder Bewegung.
- **Realtime:** `characters` ist in der Publication (`00174`).
- **Schreibrechte:** RLS erlaubt Updates nur dem Owner (`00001:42-43`). Der GM schreibt über den Service-Client nach `checkGmSession()` (`master/actions.ts:66-95`).
- **`MagicEffects`** (`types.ts:150-208`) ist das vorhandene Vokabular für Modifikatoren:
  - Attribute, `stat_overrides`, `ac_bonus`, `attack_bonus`, `damage_bonus`, `save_*`
  - Diebesfertigkeiten, `perception_bonus`, `movement_bonus`
  - Magieresistenz, Resistenzen, Passive

### 3. Berechnung der Kampfwerte

- **`computeCharacterCombatData`** (`character-computed.ts:93-372`):
  - Eingaben: Charakter, Klassen, Ausrüstung, Epic-Items, Waffenfertigkeiten, Kampfstile.
  - Ausgaben: THAC0 (nur Klassenbasis), RK, Rettungswürfe, Wahrnehmung, Diebesfertigkeiten, TP, Epic- und Magic-Effekte, Primärwaffe.
  - Fehlende Ausgaben: Bewegung, Attributswerte und -modifikatoren.
- **Verknüpfungspunkte (Merge Points):**
  - Attribut-Resolver `force ?? max(base, epic, magic) + bonus` (`:147-164`)
  - `calculateAC` mit benannten Quellparametern (`:243-255`)
  - Rettungswurf-Boni (`:261-268`)
  - Diebesfertigkeiten (`:271-305`)
  - Gift-Malus aus Overclock (`:319-327`)
  - `attackBonus`/`damageBonus` aus Magic Items werden aggregiert, aber nicht gelesen.
- **Play Mode** berechnet dasselbe inline neu (`play-mode.tsx:256-547`), inklusive Overclock-CON-Override, den `character-computed.ts` nicht kennt.
  - Die Bewegung kommt aus `getMovementRate(12, encumbrance)` und ignoriert `movementBonus` (`:494-497`).
- **`play-checks-panel.tsx:102-108`** hat einen dritten Stat-Resolver.

### 4. Bestehende temporäre Zustände

- **Overclock:**
  - Zeitstempel `overclock_end_time` in `epic_items.simple_effects`, gesetzt in `damage-level-card.tsx:446,473` und persistiert über `epic-equipment-view.tsx:180-205`.
  - Das Banner (`play-overclock-banner.tsx`) zeigt einen Countdown, der Effekt läuft aber nicht ab.
- **Nur im Browser** (`useState`, nicht persistiert):
  - Gestaltwandlung (`play-combat-panel.tsx:110-111`)
  - Fähigkeiten-Nutzungen (`play-abilities-panel.tsx:32`)
  - Priester-Casts (`play-spellbook-panel.tsx:206`)
- **Rast:** `handleRest` (`play-mode.tsx:715-729`) setzt nur Zauber und Zauberpunkte zurück.
- **Kampfsimulator:** `ActiveEffect` mit `roundsRemaining` und Effekt-Flags (`combat-simulator/types.ts:43-74`), Initiative pro Runde, Rundenzähler. Alles nur im Speicher.

### 5. GM-Dashboard und Benachrichtigungen

- **`master-dashboard.tsx:212-289`:** Realtime-Kanal `gm-hp-updates` auf `characters` (UPDATE, gefiltert) übernimmt nur TP, mit Polling-Fallback alle 10 s.
- **Kampfwerte:** einmal serverseitig berechnet (`master/page.tsx:112`).
- **Party-Panel und Charakterkarte:** zeigen den „down“-Status, RK, THAC0, Rettungswürfe und Wahrnehmung.
- **Benachrichtigungen** (`src/lib/notifications.ts`, Tabelle `notifications`):
  - Jeder Authentifizierte darf einfügen, Realtime ist aktiv.
  - 12 Typen als TS-Union, kein DB-CHECK.
  - Die Glocke abonniert pro Nutzer.
- **Zeitbegriff:** Außerhalb des Simulators gibt es keine Runden-, Initiative- oder Spielzeitverfolgung.

## Code References

- `src/lib/rules/hitpoints.ts:75-94`: TP-Status (bewusstlos/tot)
- `src/lib/rules/character-computed.ts:93-372`: Kampfwerte-Berechnung, Merge Points `:147-164, 243-255, 261-268, 271-305, 319-327`
- `src/lib/rules/magic-items.ts:80-210`: Magic-Effekt-Aggregation (`movementBonus` `:204` ungenutzt)
- `src/lib/supabase/types.ts:150-208`: `MagicEffects`-Vokabular
- `src/components/play-mode/play-mode.tsx:256-547,649-729`: Inline-Berechnung, Persistenz, Rast
- `src/components/play-mode/play-overclock-banner.tsx:22-35`: Countdown
- `src/components/epic-equipment/damage-level-card.tsx:446,473`: Overclock-Start
- `src/lib/combat-simulator/types.ts:43-74,117,169-174`: `ActiveEffect`-Modell
- `src/components/master/master-dashboard.tsx:212-289`: Realtime/Polling für TP
- `src/lib/notifications.ts:1-24`: `createNotification`

## Architecture Documentation

- **Regeln** liegen als reine Funktionen in `src/lib/rules`. Zusatzeffekte kommen heute aus zwei Quellen: Epic-Items (`simple_effects`, Schwellen) und Magic Items (`magic_effects` auf `character_equipment`).
- **Abgeleitete Werte** werden zur Laufzeit berechnet, nicht gespeichert. Nur `hp_current`/`hp_max` sind Basiswerte, die der Play Mode zurückrechnet.
- **Schreibpfade:** Spieler schreiben direkt per Supabase-Client (RLS Owner), der GM über Server Actions mit Service-Client.

## Open Questions

- **Wer setzt Effekte?** Nur der Spieler, nur der GM, oder beide?
- **Dauer:** Wird sie in Runden mitgezählt (Rundenzähler in der Session), oder beendet man Effekte manuell? Gibt es Echtzeit-Abläufe wie beim Overclock?
- **Kritische Treffer:** Welches System nutzt die Gruppe (keins, DMG ×2, C&T System I/II, eigenes)? Davon hängt ab, ob die App Krit-Tabellen würfeln soll oder nur das Ergebnis als Effekt erfasst.
- **Umfang der Mechanik:** Sollen Effekte Werte automatisch verrechnen (THAC0, RK, Rettungswürfe, Bewegung, Attribute) oder zunächst nur als sichtbare Marker mit Beschreibung dienen?

## Follow-up Research 2026-10-05: Vollständiger Effekt-Katalog

User-Vorgaben:

- Effekte setzt **nur der Spieler** an seinem Charakter.
- Effekte werden **manuell beendet**, ohne Rundenzähler.
- Kritische Treffer: DMG + eigene Tabelle der Gruppe. Das Ergebnis wird als **Freitext** erfasst, die Tabelle selbst wird nicht abgebildet.
- Ausdrücklich gewünscht: temporärer Verlust von z. B. CHA und KON sowie erschwerte Rettungswürfe durch Auren.

Quellen:

- alle 353 Monstrous-Manual-Einträge (`ressources/compendium-snapshot/parsed.json`)
- ~4.600 Zauber aus PHB, WSC1–4, PSC1–3, ToM, S&M
- DMG und C&T (Web-Spiegel der TSR-CD-ROM)
- Book of Artifacts, Magic Encyclopedia, PHBR01/07/12/13/14, A&EG

### A. Ziel-Werte (was ein Effekt verändern kann)

| Ziel                                    | Belege (Auswahl)                                                                                                                                                                                                           | Häufigkeit                |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **STR**                                 | Shadow −1/Treffer (2W8 Turns), Ray of Enfeeblement STR 5, Troglodyt −1W6, Roper ½, Ring of Weakness −1/Turn, Strength +1W8, Rage 18/19                                                                                     | sehr häufig               |
| **DEX**                                 | Haunt −2/Treffer, Quasit −1 (kumulativ), Pain DEX 3, Cat's Grace +1W8, Ring of Clumsiness ½, Gauntlets of Fumbling −2                                                                                                      | häufig                    |
| **CON**                                 | Pernicon −1/Treffer (+1/Tag), Heucuva −1/Tag, Greater Mummy −1, Lifebane −1W6, Seizure −1W4, Improved Chill Touch −2, Schwimmen −1/h, Ring of Weakness, Identify (Zaubernder −8)                                           | mittel                    |
| **INT**                                 | Yellow Musk Creeper −1W4/Rd., Sirine INT 2, Robe of Powerlessness INT 3, Feeblemind                                                                                                                                        | selten                    |
| **WIS**                                 | Lamia −1 (dauerhaft), Devolutionary Warrior −2W6                                                                                                                                                                           | selten                    |
| **CHA**                                 | Mumienfäule −2/Monat, Greater Mummy −2, Contagion −2, Scourge −3, Irritation −1/Tag, Disfigure CHA 1, Friends +2W4, Glamer +2, Periapt of Foul Rotting −1/Woche                                                            | mittel                    |
| **Alle Attribute**                      | schwächendes Gift: alle ½ für 1W3 Tage; Alterung (Tab. 12)                                                                                                                                                                 | selten                    |
| **Rettungswürfe – alle**                | Prayer/Chant ±1 (±2 zusammen), Recitation ±2, Malison −1/−2, Bestow Curse −4, Glitterdust −4, Dragonfish −1/h (bis −4), Ring/Cloak of Protection +1…+5, Luckstone +1, Aura of Desolation −2                                | sehr häufig               |
| **Rettungswürfe – Kategorie/Bedingung** | Furcht-Auren (Drache, Lich, Pit Fiend −3 vs. Stab, Balor −6 vs. Zauber), Bless +1 vs. Furcht, Protection from Evil +2 vs. Böse, Resist Fire +3, Mind Fog −2 vs. Verzauberung, Magical Susceptibility −1 auf eine Kategorie | sehr häufig               |
| **Angriff (ETW0)**                      | Bless/Curse ±1, Slow −4, Blindheit −4, Drachenfurcht −2, Fatigue −2, Belastung −1…−4, Berserker +1, Contagion −2                                                                                                           | am häufigsten             |
| **Schaden**                             | Chant/Prayer ±1, Ray of Enfeeblement −1, Drachenfurcht −2, Emotion Mut +3, Berserker +3                                                                                                                                    | häufig                    |
| **RK**                                  | Slow +4 (schlechter), Glitterdust −4, Itching +4, Armor/Barkskin/Shield (RK auf X), Netz/Griff: kein GE-Bonus                                                                                                              | sehr häufig               |
| **Initiative**                          | Haste −2, Sadness +1, Hesitation +4, Tyrg-Geheul +2                                                                                                                                                                        | selten                    |
| **Bewegung**                            | Slow ×½, Haste ×2, Fatigue ×½, Stumble ×½, Netz/Griff 0, Hyäne −6, Ravager MV 12                                                                                                                                           | häufig                    |
| **Angriffe/Runde**                      | Haste ×2, Slow ×½, Loadstone ×½, Valiancy +1, Primal Fury, „keine Angriffe“ (Übelkeit, Stinking Cloud, Boots of Dancing)                                                                                                   | mittel                    |
| **Max./temporäre TP**                   | Aid +1W8, Emotion Mut +5, Rage +10, Primal Fury +4W4, Berserker +5 (danach weg), Pixie Dust −10 % max. TP, Energieentzug                                                                                                   | mittel                    |
| **Wahrnehmung/Proben**                  | Heat Exhaustion −2 auf Proben, Misfortune −1 kumulativ, Hunger −2 auf Attributs-/Fertigkeitsproben, Darkfire −4 auf INT/WIS/CHA-Proben                                                                                     | mittel                    |
| **Diebesfertigkeiten**                  | Thief's Lament −25 % (min. 5 %), Skulk +20 % Leise bewegen, über DEX indirekt                                                                                                                                              | selten                    |
| **Zaubern**                             | Silence/Curse of Tongues (keine verbalen), Deafness 20 % Patzer, Holy Word 50 %, Ring of Clumsiness, Death's Door (Zauber gelöscht)                                                                                        | häufig                    |
| **Magieresistenz**                      | Lower Resistance −(15 % + 1 %/Stufe)                                                                                                                                                                                       | selten                    |
| **Moral**                               | Bless +1, Emotion Hoffnung +2, Blade-Display −2 (Gegner); SC würfeln nie Moral                                                                                                                                             | selten                    |
| **Laufender Schaden**                   | Blutung (2 TP/Rd.), Säure 1W4/Rd., Feuer 1W6/Rd., Gift, Ertrinken                                                                                                                                                          | sehr häufig (nur Anzeige) |

### B. Arten der Änderung (Operationen)

| Operation                                              | Beispiele                                                                                                 | Abbildbar automatisch?                                              |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Delta ±N**                                           | fast alles                                                                                                | ja                                                                  |
| **Setzen auf N**                                       | STR 5/3/18/19, CHA 1, INT 2/3, RK 6/5/2                                                                   | ja (Attribute, RK)                                                  |
| **Faktor** (×2, ×½, ×⅓, ×⅔)                            | Haste/Slow, Gift, Roper, Bewegung                                                                         | ja (Attribute, Bewegung, Angriffe)                                  |
| **Prozent** (−25 %, 20 % Patzer)                       | Thief's Lament, Deafness, Holy Word                                                                       | ja (Diebesfertigkeiten), Patzer-Chance nur als Anzeige              |
| **Flag**                                               | kann nicht angreifen/zaubern, kein GE-Bonus auf RK, kein Schild, geblendet, gehalten, bewusstlos, liegend | Anzeige; „kein GE-Bonus“ ist automatisch verrechenbar               |
| **Bedingt** (vs. Furcht, vs. Böse, vs. Feuer, frontal) | Bless, Protection from Evil, Resist Fire, Shield                                                          | **nur als Hinweis** am Wert („+2 vs. Böse“), nicht in der Hauptzahl |
| **Temporäre TP** (verbrauchen sich zuerst)             | Aid, Emotion, Rage, Heroism                                                                               | eigener Puffer neben den TP                                         |
| **Zeitlich fortschreitend** (−1/Tag, +1/Tag)           | Mumienfäule, Heucuva, Ring of Weakness, Erholung                                                          | manuell (Wert im Effekt anpassen)                                   |
| **Schwellen** (0 STR = Tod, CON < 3 bewusstlos)        | Shadow, Pernicon, Yellow Musk                                                                             | als Warnhinweis                                                     |

### C. Stapelregeln (Regeltext)

- Gleichnamige Zauber stapeln nicht („Multiple bless spells are not cumulative“, Haste nicht mit sich selbst).
- Strength stapelt nicht mit anderer STR-Magie.
- Chant + Prayer = ±2.
- Paladin-Aura + Protection from Evil = −2, nicht −3.
- Nur der stärkste Schutzring zählt.
- Misfortune, Quasit, Drachenfisch, Gewaltmarsch und Schwimmen sind ausdrücklich kumulativ.
