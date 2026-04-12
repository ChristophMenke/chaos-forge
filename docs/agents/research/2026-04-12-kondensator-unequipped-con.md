---
date: 2026-04-12T21:21:26.065085+00:00
git_commit: 1aa6b001cd51115426cfa95f8487eb8876b0f9a8
branch: fix/play-combat-i18n-namespace
topic: "Kondensator: CON fällt nicht auf 5 wenn abgelegt"
tags: [research, epic-items, stat-overrides, sprocket, kondensator]
status: complete
---

# Research: Kondensator CON-Fallback wenn abgelegt

## Research Question

Sprocket trägt den Konstitutions-Kondensator. Laut Hausregel/Item-Beschreibung fällt seine CON auf **5** wenn er den Kondensator ablegt. Aktuell macht das Ablegen keinen Unterschied — CON bleibt bei 18. Christoph will außerdem bestätigen dass die negativen Effekte der Schadensstufen kumulativ sind.

## Summary

**Bug:** `getEpicEffects()` überspringt `item.equipped === false` komplett (Zeile 184). Dadurch werden **keine** Stat-Overrides vom Kondensator angewendet wenn er abgelegt ist. Sprockets gespeicherter `characters.con = 18` reflektiert den "immer getragen"-Zustand und bleibt damit auch ohne Kondensator bei 18.

Das Item hat bereits die nötige Datenbasis: `simple_effects.base_con = 5`. Diese Info wird aktuell aber **nirgendwo als Stat-Override** genutzt — nur in der SimpleEpicCard als "excluded key" zum Nicht-Anzeigen.

**Kumulative Effekte:** Datenmodell ist OK. Der Kondensator hat kein `level_thresholds`, also fällt er in den "pick current level only"-Zweig von `getCumulativeEffects` (Zeile 131-137). Allerdings sind die Effekt-Listen in jeder Schadensstufe **manuell pre-cumuliert** (Level 6 enthält bereits alle Level-5-Effekte etc.). Diese Author-Cumulation funktioniert in der aktuellen Form. Keine Code-Änderung nötig — aber ein expliziter Test oder ein Refactor auf `level_thresholds` würde das formaler absichern.

## Detailed Findings

### Kondensator-Daten (DB: `epic_items`)

**Slug:** `constitution_condenser`
**Character:** Sprocket 'Fixit' Tanglewire (`294c567c-5abb-4b6e-bc24-8d5105981ccf`)
**Aktueller State:** `equipped: false`, `damage_level: 0`, `max_damage_level: 8`

**damage_levels (verkürzt):**

- 0: `{ con: 18, effects: [] }` — Voll funktional
- 1: `{ con: 17, effects: [] }`
- 2: `{ con: 16, effects: [] }`
- 3: `{ con: 15, effects: ["spell_failure_10"] }`
- 4: `{ con: 14, effects: ["spell_failure_10", "thief_penalty_10"] }`
- 5: `{ con: 12, effects: ["spell_failure_10", "thief_disabled", "electric_damage_1"] }`
- 6: `{ con: 10, effects: [..., "wild_magic_50"] }`
- 7: `{ con: 8, effects: [..., "save_vs_death"] }`
- 8: `{ con: 5, effects: ["thief_disabled", "device_offline"] }` — Totalausfall

**simple_effects:**

```json
{
  "base_con": 5,
  "fragility": { "base_chance": 50, "reduction_per_level": 2, ... },
  "overclock": { "con_override": 20, "duration_hours": 1, ... },
  "damage_trigger": "Jeder physische Rettungswurf: 50% Chance..."
}
```

Sprockets gespeicherte Attribute: `con: 18`, `con_health: 18`, `con_fitness: 18`, `str: 8`, etc.

### Current Epic-Effect-Logik

**Datei:** `src/lib/rules/epic-items.ts`

**Funktion `getEpicEffects(items, characterLevel?)` — Zeile 163:**

```typescript
for (const item of items) {
  if (!item.equipped) continue;  // ← ABGELEGTE ITEMS ÜBERSPRUNGEN
  const se = item.simple_effects as Record<string, unknown> | null;

  if (item.max_damage_level > 0) {
    const unlockedLevel = ...;
    const { effects, statOverrides } = getCumulativeEffects(item, unlockedLevel);
    Object.assign(result.statOverrides, statOverrides);
    ...
  }
}
```

Zeile 184: `if (!item.equipped) continue;` — alle Effekte eines abgelegten Items entfallen inkl. Stat-Overrides.

**`getCumulativeEffects(item, unlockedLevel)` — Zeile 125-157:**

- Wenn `simple_effects.level_thresholds` Array vorhanden: Sammelt effects + stat_overrides von Level 0 bis zum unlockedLevel (echte Cumulation)
- Ohne `level_thresholds`: Gibt nur den aktuellen Level zurück (`damage_levels[String(unlockedLevel)]`)

Der Kondensator hat KEIN `level_thresholds`, fällt also in den zweiten Zweig. Der Daten-Autor hat aber in jeder Level-Definition die kumulierten Effekte bereits eingetragen (mit expliziten Ersetzungen wie `thief_penalty_10` → `thief_disabled`).

### Wo `simple_effects.base_con` verwendet wird

Grep-Ergebnis:

- `src/components/epic-equipment/simple-epic-card.tsx:35` — in `EXCLUDED_KEYS` Liste, damit der Key nicht im Effekt-Badge-Raster angezeigt wird.

Das wars. Der Wert wird nirgendwo als Stat-Override appliziert.

### Verbraucher von `getEpicEffects`

- `src/components/play-mode/play-mode.tsx:248`
- `src/components/character-sheet/character-sheet.tsx:250`
- `src/components/print-sheet/print-sheet.tsx:92`
- `src/lib/utils/docx-export.ts:404`
- `src/lib/rules/character-computed.ts:133` (genutzt von GM Dashboard + Play Mode)

Alle bekommen `EpicEffects.statOverrides` und rechnen daraus die effektive CON. Ein einziger Fix in `getEpicEffects` reicht für alle.

### Wie Stat-Override angewendet wird

**`src/lib/rules/character-computed.ts:computeCharacterCombatData`** ruft `getEpicEffects` und überschreibt dann CON:

```typescript
const effectiveCon = epicEffects.statOverrides.con ?? character.con;
```

Dieses Pattern wird überall identisch genutzt: `statOverrides.X ?? character.X`.

Wenn der Kondensator abgelegt ist, `statOverrides.con` = undefined, also fällt es auf `character.con = 18`. **Hier kommt `base_con = 5` nie durch.**

## Code References

- `src/lib/rules/epic-items.ts:163-263` — `getEpicEffects` Hauptfunktion
- `src/lib/rules/epic-items.ts:184` — `if (!item.equipped) continue;` (das zu ändern)
- `src/lib/rules/epic-items.ts:125-157` — `getCumulativeEffects` (Cumulation-Logik)
- `src/lib/rules/character-computed.ts:133` — Haupt-Konsument
- `src/components/epic-equipment/simple-epic-card.tsx:35` — base_con als EXCLUDED_KEY
- DB: `epic_items` mit slug `constitution_condenser` (siehe Detailed Findings für Datenstruktur)

## Architecture Documentation

**Stat-Override-Semantik (aktuell):**

- Charakter hat Base-Stats in `characters.con` etc.
- Epic Items mit `damage_levels[level].stat_overrides` überschreiben beim Equippen
- `EpicEffects.statOverrides.X` gewinnt immer wenn gesetzt
- Sub-Stats (health, fitness, muscle etc.) werden über `scaleSubStat()` proportional hochskaliert

**Kondensator-Semantik (laut Item-Beschreibung):**

- Sprocket hat eine biologische CON von **5** (`simple_effects.base_con`)
- Kondensator **ersetzt** CON solange er getragen + funktional ist
- Bei Ablage → biologische CON 5 wird sichtbar
- Bei Schadensstufe 8 (Totalausfall) → auch sichtbar CON 5 (bleibt aber "getragen", Item hat `device_offline` Effekt)

**Was fehlt:** Semantik für "Item überschreibt Stat auch wenn ABGELEGT, mit einem anderen Wert". Das ist ein neuer Fall — die aktuelle Engine kennt nur "equipped = wirkt", "unequipped = keinerlei Effekt".

## Open Questions

1. Gilt die "base_con beim Ablegen"-Regel nur für den Kondensator oder generell für Items mit `simple_effects.base_con`? Aktuell hat nur der Kondensator diese Property — also ist die neue Logik faktisch Kondensator-spezifisch.
2. Muss `scaleSubStat` auch beim Ablegen greifen? CON=5 würde dann auch `con_health` und `con_fitness` auf ~5 runterskalieren. Vermutlich ja, konsistent mit Equipped-Verhalten.
3. HP-Bonus-Cap: Warriors bekommen CON-HP-Bonus bis +4, andere bis +2. Wenn Sprocket nur CON=5 hat, bekommt er HP-Malus (-2 pro Level). Das ist korrekt laut AD&D, aber es verändert den Current-HP-Wert (oder den Max-HP-Wert) des Charakters. Muss geklärt werden: berechnen wir HP neu oder lassen wir existierendes HP unangetastet? Der Max-HP-Wert ist in `characters.hp_max` gespeichert und wird nicht automatisch neuberechnet. Dieser Research dokumentiert das nur, keine Empfehlung.
