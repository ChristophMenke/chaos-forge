---
date: 2026-10-06T12:13:45+00:00
git_commit: 1e1db9f366cff207fbfb62a58f183a5cf0724f55
branch: feat/sprocket-overclock-crafting
topic: "Sprockets Kondensator (Übertakten, Schadensstufen, Reparatur, Kupferelixier) und Mix-and-Match-Klingen (Mixturen, Herstellen)"
tags: [research, codebase, epic-items, kondensator, overclock, blades, crafting, undo, play-mode]
status: complete
---

# Research: Sprockets Kondensator und Mix-and-Match-Klingen

## Research Question

Wie funktionieren heute Übertakten (Overclock), Schadensstufen und Reparatur-Info des Kondensators, das Kupferelixier, der Mixturen-Vorrat und „Herstellen“ der Klingen, die Schreibpfade inkl. Undo-Aufzeichnung, NWP-Zielwerte, die Münzbörse (`calculatePayment`) und das Datenladen der Epic- und Play-Seiten? Grundlage für das Feature „Übertakten mit Ingenieurskunst-Wurf + Kühlungswurf, Reparatur mit Kupferelixier, Herstellung mit Komponenten-Checkliste“.

## Summary

Beide Gegenstände sind Zeilen in `epic_items` (Sprocket, `character_id 294c567c-…`). Ihr veränderlicher Zustand liegt komplett im JSONB `simple_effects`; die Schadensstufe in der Spalte `damage_level`.

- **Übertakten:** `simple_effects.overclock` beschreibt die Fähigkeit (CON 20, RW Gift +1, 1 TP/h, `duration_hours: 1`, `requires_check: "Ingenieurskunst"`). Der Laufzustand ist `overclock_active` + `overclock_end_time` (Epoch-ms). Aktiviert wird nur auf der Epic-Seite per Knopf ohne Wurf; ein Echtzeit-Timer beendet die Übertaktung nach 1 h (nicht aufgezeichnet als Undo-Schritt). Der Play Mode zeigt nur ein Banner (read-only). Heilung pro Stunde wird nur angezeigt, nicht verrechnet.
- **Wirkung:** `getEpicEffects` liefert `overclockAbility` (null bei `device_offline`). `resolveEffectiveStats` ersetzt CON durch `conOverride`, wenn `overclockActive`. Play Mode und `computeCharacterCombatData` (Dashboard, GM) lesen `overclock_active` selbst aus den Items.
- **Schadensstufen/Reparatur:** −/+ Stepper auf der Karte → `handleDamageLevelChange` (schreibt `damage_level`, gleicht `hp_current` über `persistHpAfterConChange` ab, ein Undo-Schritt). Reparatur und Kupferelixier sind nur Info-Text (`repair_skill`, `elixir_bonus: 4`, `elixir_cost_gp: 100`); es gibt keinen Elixier-Zähler.
- **Mixturen:** `simple_effects.mixtures[key].count`; „Herstellen“ erhöht `count` um 1 ohne Bedingungen. Bestücken senkt `count` um 1 (`loadBlade`).
- **Schreibpfad Epic-Seite:** `updateSimpleEffects(itemId, newEffects, label)` – optimistisch, Rollback + Toast bei Fehler, ein Undo-Schritt `rowUpdate("epic_items", …simple_effects)`.
- **Play Mode** hält `epicItems` nur als Prop, schreibt nie in `epic_items`; Charakter-Writes laufen über `updateCharacter` → `RowChange`, aufgezeichnet über `recordChanges`.

```
src/
  lib/rules/
    epic-items.ts          OverclockAbility, getEpicEffects (overclock parse), getFragility*
    effective-stats.ts     resolveEffectiveStats: CON → conOverride bei overclockActive
    character-computed.ts  computeCharacterCombatData: liest overclock_active, Gift-Malus
    blades.ts              Blade/MixtureInfo/BladeSystemData + load/throw/collect/lose/forge
    equipment.ts           CoinPurse, calculatePayment, purseTotalInCP
  components/epic-equipment/
    epic-equipment-view.tsx  State, updateSimpleEffects, handleDamageLevelChange, handleOverclockToggle, persistHpAfterConChange
    damage-level-card.tsx    Stepper, Fragility, OverclockPanel (Timer), Repair-Info
    blade-system-card.tsx    Klingen + Mixtur-Vorrat + „Herstellen“
  components/play-mode/
    play-mode.tsx            overclockState aus Props, hpDelta, updateCharacter, handleHpChange, handleCoinChange
    play-overclock-banner.tsx  read-only Banner mit Countdown
    play-checks-panel.tsx    NWP-Zielwerte (Attribut + Modifikator + Effekte)
  app/characters/[id]/
    epic/page.tsx  lädt characters (Teilspalten), character_classes, share, epic_items
    play/page.tsx  lädt characters(*), …, NWPs mit Join, epic_items, effects
  test/undo-coverage.test.ts  Schreibstellen ⇒ Aufzeichnung, Labels in messages
supabase/migrations/
  00050 (Kondensator), 00054 (Klingen), 00058 (Waffenwerte), 00150 (overclock), 00157 (fragility)
```

```
Epic-Seite                                  Play Mode
──────────                                  ─────────
OverclockPanel ──onToggle──▶ handleOverclockToggle      epicItems (Prop)
  (Timer läuft ab → expired, kein Undo)        │              │
        ▼                                      ▼              ▼
updateSimpleEffects ──▶ epic_items.simple_effects ──▶ overclockState → overclockEffective
                                                     → resolveEffectiveStats (CON 20)
                                                     → poisonSavePenalty
                                                     → PlayOverclockBanner (read-only)
```

## Detailed Findings

### Datenmodell und Seeds

- `EpicItemRow` (`src/lib/supabase/types.ts:350-367`): `damage_level`, `max_damage_level`, `damage_levels: Record<string, DamageLevelEffect>`, `simple_effects: Record<string, unknown>`.
- Kondensator `constitution_condenser` (`supabase/migrations/00050_seed_sprocket_epic_items.sql`): Stufen 0–8 mit `stat_overrides.con` 18→5, Effekte (`spell_failure_10`, `thief_penalty_10`, `thief_disabled`, `electric_damage_1`, `wild_magic_50`, `save_vs_death`, `device_offline` auf 8). `simple_effects`: `repair_skill` Ingenieurskunst/Engineering, `repair_time` 10 Minuten, `elixir_cost_gp: 100`, `elixir_bonus: 4`, `base_con: 5`, `damage_trigger` (Text).
- `00150_kondensator_overclock.sql`: `simple_effects.overclock = { name, name_en, duration_hours: 1, requires_check(_en), con_override: 20, poison_save_penalty: 1, heals_per_hour: 1, description(_en) }` (Text nennt „für 1 Stunde“).
- `00157_kondensator_fragility.sql`: `simple_effects.fragility = { base_chance: 50, reduction_per_level: 2, trigger_de/en }`.
- Klingen `mix-and-match-blades` (`00054_seed_sprocket_blades.sql`): `type: "blade_system"`, `max_prepared: 4`, `blades[]`, `mixtures` red (Rauchbombe, 5), blue (Gefrierbrand, 5), green (Blenden, 4), purple (Narkose, 4) mit `name/_en, color, effect/_en, duration/_en`. `00058` ergänzt `weapon_stats`.
- Höchste Migration: `00230_character_effects.sql`; Schema `NNNNN_snake_case.sql`.
- NWP „Ingenieurskunst“: `00010_proficiencies.sql:134` → `('engineering', 'Ingenieurskunst', 'int', -3, 'wizard', 2)`; `name_en = 'Engineering'` (`00023`).

### Regel-Engine

- `OverclockAbility` (`src/lib/rules/epic-items.ts:39-50`): `durationHours, requiresCheck(_en), conOverride, poisonSavePenalty, healsPerHour, description(_en)`.
- `getEpicEffects` (`epic-items.ts:325-360`): erster ausgerüsteter Gegenstand mit `simple_effects.overclock` wird Kandidat; nach der Schleife nur übernommen, wenn kein Item `device_offline` liefert.
- `getFragilityChance`/`getFragilityInfo` (`epic-items.ts:421-445`): `max(0, base − reduction × level)`.
- `resolveEffectiveStats` (`src/lib/rules/effective-stats.ts:41-42, 78-79`): `sources.overclockActive && epicEffects.overclockAbility` → CON = `conOverride`.
- `computeCharacterCombatData` (`src/lib/rules/character-computed.ts:134-151, 291-295`): `overclockActive` = irgendein ausgerüstetes Item mit `simple_effects.overclock_active === true` (Endzeit wird nicht gelesen); Gift-Malus aus `overclockAbility`. Aufrufer: `src/app/dashboard/page.tsx:679`, `src/app/master/page.tsx:122,136`.
- `blades.ts`: reine Transformationen `loadBlade` (count −1), `throwBlade`, `collectBlade`, `loseBlade`, `forgeBlade`; Typen `MixtureInfo { count, name, name_en, color, effect, effect_en, duration, duration_en }`, `BladeSystemData`.
- `equipment.ts:234-308`: `CoinPurse {pp,gp,ep,sp,cp}`, `COIN_VALUES_IN_CP = {pp:500, gp:100, ep:50, sp:10, cp:1}`, `calculatePayment(purse, costInCP) → {success, remaining, shortfall}` (größte Münzen zuerst, Wechselgeld in kleinere Münzen).

### Epic-Seite

- `src/app/characters/[id]/epic/page.tsx`: lädt `characters` mit `id, name, avatar_url, user_id, level, con, con_health, con_fitness, hp_max, hp_current` (keine `gold_*`, keine Attribute außer CON), `character_classes`, Share, `epic_items`. Keine NWPs.
- `EpicEquipmentView` (`src/components/epic-equipment/epic-equipment-view.tsx`):
  - State `items`, `hpCurrent`; `useUndoSync` patcht `epic_items` (Liste) und `characters.hp_current`.
  - `persistHpAfterConChange(newItems)` (:107-158): vergleicht effektive CON vor/nach (`forceStatOverrides.con ?? statOverrides.con ?? character.con`), berechnet effektive Max-TP über `computeHpDelta` und schreibt `hp_current = min(sichtbar vorher, effektives Max nachher)`; gibt `RowChange | null` zurück.
  - `handleToggleEquip`, `handleDamageLevelChange` (:192-222): optimistisch, Rollback, danach `persistHpAfterConChange`, ein `record` mit Item- und ggf. HP-Änderung. Label `damageLevel {name, level}`.
  - `updateSimpleEffects(itemId, newEffects, label|null)` (:225-263): optimistisch, Rollback + `toast.error(t("saveError"))`, `record` nur mit Label.
  - `handleOverclockToggle(itemId, active, endTime, expired)` (:265-281): setzt `overclock_active`/`overclock_end_time`; `expired` → kein Undo-Schritt; Labels `overclockOn`/`overclockOff`.
  - Rendering: `max_damage_level > 0` → `DamageLevelCard`; `type === "blade_system"` → `BladeSystemCard`; sonst `SimpleEpicCard`.
- `DamageLevelCard` (`damage-level-card.tsx`, 543 Zeilen): Stepper −/+ (:148-180, nur Owner, ohne Auto-Unlock), Punkte, aktuelle Stufe mit Badges, Fragility-Box (:263-276), Zauberfähigkeiten (lokaler State), Stufentabelle, `OverclockPanel` (:384-396, nicht bei `device_offline`), Reparatur-Info (:398-426: `repairInfo {skill, level}`, `elixirInfo {bonus, cost}`).
- `OverclockPanel` (:431-543): `durationHours` (Default 1), rAF + 30-s-Intervall; Ablauf → `onToggle(false, null, true)`; aktiv: Badges CON/Gift/Heilung; inaktiv: Beschreibung + „Erfordert {skill}-Wurf“; Owner-Button Aktivieren/Deaktivieren.
- `BladeSystemCard` (`blade-system-card.tsx`, 435 Zeilen): `persistState` → `onSimpleEffectsChange(itemId, {...data, blades, mixtures}, {key:"blades"})`; `handleCraft` (:116-124) count +1; Mixtur-Vorrat (:387-432) mit Badge `count×`, Effekt, Dauer, Button `mixtureCraft`.

### Play Mode

- `src/app/characters/[id]/play/page.tsx`: `characters(*)` inkl. `gold_*`, NWPs mit Join `proficiency:nonweapon_proficiencies(*)` (:74-76), `epic_items(*)` (:78), `character_effects`.
- `play-mode.tsx`:
  - `epicItems` nur Prop (Default `[]`), keine Writes auf `epic_items`.
  - `overclockState` (:307-318) aus erstem ausgerüsteten Item mit `overclock_active`; `overclockEffective` (:321).
  - `hpDelta` (:412-433), `effectiveHpMax = max(1, hp_max + hpDelta)`, `effectiveHpCurrent = clampHpCurrentToMax(...)`.
  - `updateCharacter(updates) → RowChange | null` (:622-635); `handleHpChange(newEffectiveHp, {record})` (:638-656, Label `hp`, coalesce `"hp"`); `handleDamage` (:660-673); `coinPurse` (:610-619); `handleCoinChange` (:676-688, Label `coins`).
  - `recordChanges(label, changes, coalesceKey?)`; `useUndoSync` patcht `characters`, `character_spells`, `character_equipment`, `character_inventory`.
  - Banner (:966-974) in `<div className="mt-2">` nach `LevelUpDialog`, vor der mobilen Pill-Navigation.
- `PlayOverclockBanner`: Countdown aus `endTime`, Badges CON/Gift/Heilung; keine Buttons.
- `play-checks-panel.tsx:254-273`: NWP-Zielwert = effektiver Attributwert (`effective.values[ability]`) + `proficiency.modifier` + `effectSummary.abilityChecks`. Für Ingenieurskunst: INT − 3 (+ Effekte).

### Undo

- `UndoLabel { key, values? }` (`src/lib/undo/types.ts:20-24`); Texte unter `undo.labels` in `messages/de.json`/`en.json` (ab Zeile 2253), u. a. `hp, damage, coins, damageLevel, blades, overclockOn, overclockOff`.
- `rowUpdate(table, key, before, after)` (`src/lib/undo/changes.ts:39`) → nur geänderte Spalten, `null` ohne Änderung. `patchList`/`patchRow`/`touches` in `src/lib/undo/patch.ts`.
- `src/test/undo-coverage.test.ts`: Scope u. a. `src/components/play-mode`, `src/components/epic-equipment`; jede Datei mit `.from("x").update|insert|upsert|delete(` muss `useUndo(` / `record…(` / `undo?.record` enthalten oder in `EXCEPTIONS` stehen; alle Label-Keys (`label: {key: "…"}` / `record…({key: "…"}`) müssen in beiden Sprachdateien existieren.
- Tests: `epic-equipment-view.test.tsx` (Supabase-Mock `from().update().eq()`, `createUndoStub`, Assertions auf `entries[0]` + `replay`), `play-mode-undo.test.tsx` (Proxy-Chain-Mock, gleiche Assertion-Art).

### Bestehende Tests

- `blades.test.ts`: load/throw/collect/lose/forge.
- `epic-items.test.ts:166-243`: Overclock-Parsing inkl. `durationHours 1`, `device_offline`-Fälle; `:269-330` Fragility.
- `effective-stats.test.ts:78-86`: CON-Override bei `overclockActive`.
- Keine Tests lesen `overclock_active`/`overclock_end_time` direkt.

## Code References

- `src/lib/rules/epic-items.ts:39-50` – `OverclockAbility`
- `src/lib/rules/epic-items.ts:325-360` – Overclock-Parsing in `getEpicEffects`
- `src/lib/rules/effective-stats.ts:78-79` – CON-Override
- `src/lib/rules/character-computed.ts:134-151` – `overclock_active` für Dashboard/GM
- `src/lib/rules/blades.ts` – Mixtur-/Klingen-Transformationen
- `src/lib/rules/equipment.ts:267-308` – `calculatePayment`
- `src/components/epic-equipment/epic-equipment-view.tsx:107-158` – `persistHpAfterConChange`
- `src/components/epic-equipment/epic-equipment-view.tsx:192-281` – Schadensstufe, `updateSimpleEffects`, Overclock-Toggle
- `src/components/epic-equipment/damage-level-card.tsx:384-543` – Overclock-Panel + Reparatur-Info
- `src/components/epic-equipment/blade-system-card.tsx:116-124, 387-432` – Herstellen
- `src/components/play-mode/play-mode.tsx:307-321, 622-688, 966-974` – Overclock-State, Writes, Banner
- `src/components/play-mode/play-checks-panel.tsx:254-273` – NWP-Zielwerte
- `src/app/characters/[id]/epic/page.tsx` – Datenladen Epic
- `src/app/characters/[id]/play/page.tsx:59-87` – Datenladen Play
- `src/test/undo-coverage.test.ts:12-70` – Undo-Abdeckung

## Architecture Documentation

- Regeln sind reine Funktionen in `src/lib/rules/`, Komponenten rufen sie auf und persistieren das Ergebnis.
- Epic-Zustand lebt in `simple_effects` (JSONB) und wird immer als ganzes Objekt geschrieben; Undo speichert `simple_effects` vorher/nachher.
- Ein Nutzerschritt = ein `record()` mit allen `RowChange`s (z. B. Schadensstufe + `hp_current`).
- Bilinguale Daten: Felder `x` + `x_en`, Anzeige über `localized()`.
- CON-Änderungen durch Epic Items: `persistHpAfterConChange` (Epic-Seite) bzw. `hpDelta` (Play Mode, `computeCharacterCombatData`).
- Daten-Seeds für Sprocket stehen in Migrationen, die per `slug` + `character_id` arbeiten.

## Open Questions

- Ob Sprocket „Ingenieurskunst“ tatsächlich als NWP-Zeile in `character_nonweapon_proficiencies` hat, ist nur in der Live-DB prüfbar.
- Der aktuelle Live-Stand von `simple_effects` (Mixtur-Zähler, ggf. aktive Übertaktung) ist nur in der DB sichtbar; die Migrationen zeigen den Seed-Stand.
