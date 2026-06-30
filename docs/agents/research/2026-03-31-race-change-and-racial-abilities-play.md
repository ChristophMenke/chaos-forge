---
date: 2026-03-31T15:19:21.081218+00:00
git_commit: 8f01be3c4090486302fa9b9b0cf2ec053c67f787
branch: feat/tiefling-race
topic: "Rasse ändern + Rassenfähigkeiten im Play Mode"
tags: [research, codebase, races, play-mode, racial-abilities]
status: complete
---

# Research: Rasse ändern + Rassenfähigkeiten im Play Mode

## Research Question

1. Wie kann die Rasse eines bestehenden Charakters geändert werden?
2. Wie können Rassenfähigkeiten (z.B. Tiefling "Dunkelheit 1x/Tag") im Play Mode angezeigt und genutzt werden?

## Summary

### 1. Rasse ändern

Die Rasse wird in `character.race_id` gespeichert (`CharacterRow`, types.ts:18) und im Character Sheet Header als **read-only Badge** angezeigt (character-sheet.tsx:539). Es gibt **kein Edit-Feld** — anders als z.B. Alignment, das ein `<select>` Dropdown hat (character-sheet.tsx:544-557).

Zum Vergleich: Die `update()` Funktion (character-sheet.tsx:307) akzeptiert jeden `keyof CharacterRow` und speichert via Supabase. Es wäre also technisch möglich, `race_id` über ein Dropdown zu ändern — die Funktion existiert bereits, nur das UI-Element fehlt.

**Auswirkungen einer Rassenänderung:**

- Attribut-Adjustments: Müssen nicht neu berechnet werden — die gespeicherten Attribute sind die finalen Werte (die Adjustments werden nur im Wizard beim Erstellen angewendet)
- Rassenfähigkeiten: Werden dynamisch aus `RACES[race_id].racialAbilities` geladen (character-sheet.tsx:1446-1462)
- Level-Limits: Werden dynamisch aus `RACES[race_id].levelLimits` berechnet
- Infravision/Bewegungsrate: Dynamisch aus der Rassen-Definition
- Klassen-Warnungen: Nicht regelkonform gewählte Klassen → Warnung (Hausregel: nie blockieren)

### 2. Rassenfähigkeiten im Play Mode

Im Play Mode gibt es **kein Panel für Rassenfähigkeiten**. Die 6 existierenden Panel-IDs sind:

- `combat` (immer sichtbar)
- `spellbook` (wenn Zauberwirker)
- `turnUndead` (wenn Kleriker/Paladin)
- `checks` (immer sichtbar)
- `inventory` (immer sichtbar)
- `coinPurse` (immer sichtbar)

**Priesthood Granted Powers** werden ebenfalls **nicht im Play Mode** angezeigt — nur Turn Undead hat ein eigenes Panel. Die `getActivePowers(priesthoodId, level)` Funktion existiert bereits (priesthoods.ts:3839), wird aber nur im Wizard-Step genutzt.

**Rassenfähigkeiten im Character Sheet (Verwalten):** Werden als aufklappbare Details-Sektion angezeigt (character-sheet.tsx:1446-1462) mit Name + Beschreibung in DE/EN. Rein informativ, kein Tracking.

**`usesPerDay` Tracking:** Das `GrantedPower`-Interface hat ein optionales `mechanical.usesPerDay` Feld (types.ts:189). Es gibt aber **keine DB-Spalte und keine UI** um die tatsächliche Nutzung pro Tag zu tracken. Für Rassenfähigkeiten existiert dieses Feld im `ClassAbility`-Interface nicht — dort gibt es nur `name`, `name_en`, `description`, `description_en`.

## Code References

- `src/lib/supabase/types.ts:18` — `race_id: string` auf CharacterRow
- `src/components/character-sheet/character-sheet.tsx:154` — Race lookup: `RACES[character.race_id]`
- `src/components/character-sheet/character-sheet.tsx:539` — Race Badge (read-only)
- `src/components/character-sheet/character-sheet.tsx:544-557` — Alignment Dropdown (Vorlage für Race-Dropdown)
- `src/components/character-sheet/character-sheet.tsx:307` — `update()` Funktion (akzeptiert `keyof CharacterRow`)
- `src/components/character-sheet/character-sheet.tsx:1446-1462` — Racial Abilities Anzeige
- `src/components/play-mode/play-mode.tsx:146` — PanelId Type (6 Panels)
- `src/components/play-mode/play-mode.tsx:529-551` — visiblePanels Array
- `src/components/play-mode/play-turn-undead-panel.tsx` — Turn Undead Panel (Referenz für Fähigkeits-Panel)
- `src/lib/rules/races.ts:16` — `racialAbilities: ClassAbility[]` auf RaceDefinition
- `src/lib/rules/priesthoods.ts:3839` — `getActivePowers()` (Granted Powers)
- `src/lib/rules/types.ts:193-199` — ClassAbility Interface (name, description, nur DE/EN)

## Architecture Documentation

### Bestehendes Pattern für Panels im Play Mode:

1. Panel-Typ in `PanelId` Union definieren (play-mode.tsx:146)
2. Sichtbarkeits-Logik berechnen (z.B. `showSpells`, `turnUndeadInfo.show`)
3. Panel-Eintrag in `panels` Array mit `id`, `label`, `icon`, `show` (play-mode.tsx:529-551)
4. Desktop: Panel-Komponente in 2-Spalten-Grid rendern (play-mode.tsx:596+)
5. Mobile: Panel-Komponente unter Pill-Navigation rendern (play-mode.tsx:680+)

### Bestehendes Pattern für editierbare Header-Felder:

- Owner sieht `<select>` oder `<input>`, Nicht-Owner sieht `<Badge>` (character-sheet.tsx:531-562)
- Änderung wird via `update(field, value)` an Supabase gesendet (character-sheet.tsx:307)
- `setDirty(true)` markiert ungespeicherte Änderungen

## Open Questions

1. Sollen Attribut-Adjustments bei Rassenwechsel automatisch angepasst werden? (z.B. Mensch→Tiefling: INT+1, CHA-1 anwenden?) Oder bleibt das manuell?
2. Soll das "Dunkelheit 1x/Tag"-Tracking persistent sein (DB) oder nur lokal im Play Mode (wie die Priester-Slot-Nutzung)?
3. Sollen Priesthood Granted Powers im gleichen neuen Panel erscheinen wie Rassenfähigkeiten?
