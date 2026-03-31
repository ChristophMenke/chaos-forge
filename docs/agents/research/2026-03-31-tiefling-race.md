---
date: 2026-03-31T15:09:58.838049+00:00
git_commit: cf69d2cd94e9358ebcc9d70949785020a272a18d
branch: feat/priest-system
topic: "Tiefling-Rasse für AD&D 2nd Edition — Implementierungsdaten"
tags: [research, codebase, races, tiefling, planescape]
status: complete
---

# Research: Tiefling-Rasse für AD&D 2nd Edition

## Research Question

Alle Daten sammeln die nötig sind um Tiefling als neue Rasse in Chaos Forge zu implementieren. Quellen: PHBR10, Planescape Campaign Setting, Planewalker's Handbook.

## Summary

Tieflings stammen **nicht** aus PHBR10 (Complete Book of Humanoids), sondern aus den **Planescape**-Materialien (Campaign Setting 1994, Planewalker's Handbook 1996). Tieflings sind Nachkommen von Menschen und Fiends (Dämonen/Teufeln). Sie sind grundsätzlich menschenähnlich, aber mit deutlichen fiendischen Merkmalen.

Die Rasse ist in der bestehenden Codebase (`races.ts`, `types.ts`) **nicht vorhanden** und muss komplett neu implementiert werden.

## Detailed Findings

### Tiefling-Rassendaten (Planescape)

**Attribut-Adjustments:**

- INT +1
- CHA -1

**Erlaubte Klassen:** Alle (wie Menschen) — Fighter, Ranger, Paladin, Mage, alle Spezialisten, Cleric, Druid, Thief, Bard

**Level-Limits:** Keine (wie Menschen)

**Multiclass-Optionen:**

- Fighter/Mage
- Fighter/Thief
- Fighter/Cleric
- Mage/Thief
- Cleric/Thief
- Cleric/Mage

**Rassenfähigkeiten:**

1. **Infravision 60 Fuß (18 m)**
2. **Kälteresistenz:** Halber Schaden durch kältebasierte Angriffe
3. **Feuerresistenz:** Halber Schaden durch feuerbasierte Angriffe
4. **Elektrizitätsresistenz:** Halber Schaden durch elektrische Angriffe
5. **Dunkelheit, 4,5 m Radius:** Einmal pro Tag als angeborene Fähigkeit wirkbar
6. **-2 Reaktions-Malus:** Aufgrund ihres fiendischen Erbes (Reaktion von NPCs)

**Bewegungsrate:** 12

**Größe:** Mittel (M)

**Diebes-Fähigkeiten-Anpassungen:** Geringe Boni (+5% auf die meisten Fähigkeiten, Quelle variiert)

**Sprachen:** Common, Planare Handelssprache

**Startalter:** Wie Menschen (15-20 + Klassenmodifikator)

**Größe/Gewicht:** Wie Menschen (60+2d10 Zoll / 140+6d10 lbs)

### Bestehende Codebase

**types.ts (Zeile 85-93):** `RaceId` muss um `"tiefling"` erweitert werden.

**races.ts:** Enthält 8 Rassen. Tiefling muss als 9. Eintrag in `RACES` hinzugefügt werden. Folgende Stellen müssen erweitert werden:

- `RACES` Record (Zeile 50)
- `STARTING_AGE` Record (Zeile 471)
- `HEIGHT_TABLE` Record (Zeile 543)
- `WEIGHT_TABLE` Record (Zeile 578)

**Supabase `races` Tabelle:** Muss per Migration einen neuen Eintrag bekommen (falls Rassen in der DB gespeichert sind — zu prüfen).

### Vorlage für Implementierung (Kobold als Referenz)

Der Kobold (`races.ts:401-442`) ist die nächste Referenz, da er ebenfalls eine "Non-PHB"-Rasse ist:

- Eigene Ability Adjustments
- Eigene Multiclass-Options
- Eigene Racial Abilities mit DE/EN Übersetzungen
- Startalter, Größe, Gewicht

## Code References

- `src/lib/rules/types.ts:85-93` — RaceId type definition (muss um "tiefling" erweitert werden)
- `src/lib/rules/races.ts:50-443` — RACES Record (neuer Eintrag)
- `src/lib/rules/races.ts:471-520` — STARTING_AGE (neuer Eintrag)
- `src/lib/rules/races.ts:543-576` — HEIGHT_TABLE (neuer Eintrag)
- `src/lib/rules/races.ts:578-611` — WEIGHT_TABLE (neuer Eintrag)
- `src/lib/rules/races.ts:624-628` — getRacialSavingThrowBonus (prüfen ob Tiefling Boni braucht)

## Open Questions

1. **Planescape-Bücher nicht in Ressourcen:** Die Daten stammen aus Web-Recherche, nicht aus OCR-Texten. Die Diebes-Fähigkeiten-Anpassungen sind unsicher.
2. **Paladin:** Einige DMs erlauben Tiefling-Paladine, andere nicht. Da die Hausregel "nie blockieren, nur warnen" gilt, sollte Paladin erlaubt sein mit Warnung.
3. **Supabase-Migration:** Prüfen ob die `races`-Tabelle in der DB existiert oder ob Rassen nur im Code definiert sind.
