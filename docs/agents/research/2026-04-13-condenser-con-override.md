---
date: 2026-04-13T09:12:12+00:00
git_commit: 757445feee0ec17c8528a5a5f521a73c839bda6b
branch: fix/condenser-con-override
topic: "Constitution Condenser Unequip-Bug: CON-Anzeige und HP-Clamping"
tags: [research, codebase, epic-items, forceStatOverrides, hitpoints, kondensator]
status: complete
---

# Research: Constitution Condenser (Sprocket) Unequip-Bug

## Research Question

Beim Ablegen des Kondensators soll CON von 18 auf 5 fallen (via `simple_effects.base_constitution = 5` → `forceStatOverrides.con`). Beobachtet wurde:

1. **CON-Anzeige zeigt weiterhin 18** in Manage-Ansicht und Play-Mode-Checks-Panel.
2. **HP steht bei −10/12 (Unconscious)** statt bei 12/12 — obwohl vorher 34/34 war.

Ziel dieser Research: Dokumentieren, wo `forceStatOverrides.con` gelesen wird, wo nicht, und wie die HP-Berechnung beim Unequip-Szenario genau arbeitet.

## Summary

Der Datenfluss besteht aus drei Ebenen:

1. **Engine (`getEpicEffects`)** — setzt `forceStatOverrides.con = 5` korrekt, wenn ein Item mit `simple_effects.base_constitution` UNEQUIPPED ist (`src/lib/rules/epic-items.ts:222-230`).
2. **Stat-Resolution** — drei verschiedene Implementierungen in drei Dateien, die sich im Umgang mit `forceStatOverrides` unterscheiden.
3. **HP-Berechnung** — verwendet ein **Delta-Modell**: `effectiveHpCurrent = hp_current + min(0, hpDelta)`, anschließend Clamp. Das reduziert Current-HP um den CON-Penalty-Betrag, statt Current-HP nur an das neue Max zu clampen.

### Wer liest `forceStatOverrides.con`?

| Datei                                                   | Zeile    | Liest `fo.con`?                                     | Display                              |
| ------------------------------------------------------- | -------- | --------------------------------------------------- | ------------------------------------ |
| `src/lib/rules/character-computed.ts`                   | 135, 198 | **Ja** (resolve-Helper)                             | GM-Dashboard                         |
| `src/components/character-sheet/character-sheet.tsx`    | 252, 266 | **Ja** (für `effectiveCon`, verwendet in `conMods`) | Manage-Seite (Derived-Werte)         |
| `src/components/character-sheet/character-sheet.tsx`    | 1241     | **Nein** — zeigt hardcodiert `character.con`        | Manage-Seite (Stat-Grid)             |
| `src/components/play-mode/play-mode.tsx`                | 269, 282 | **Ja** (resolve-Helper)                             | Play-Mode (Derived-Werte)            |
| `src/components/play-mode/play-checks-panel.tsx`        | 88-94    | **Nein** — `eff()` nutzt nur `eo` + `mo`            | Play-Mode Checks-Panel (CON-Anzeige) |
| `src/components/epic-equipment/epic-equipment-view.tsx` | 84-85    | **Ja**                                              | Epic-Equipment-Übersicht             |

## Detailed Findings

### 1. Engine: `forceStatOverrides` für unequipped Items

`src/lib/rules/epic-items.ts:98-126` definiert `BASE_STAT_KEYS` und `applyUnequippedBaseOverrides`. Für jedes unequipped Item mit `simple_effects.base_<stat>` wird der Wert in `result.forceStatOverrides[statKey]` geschrieben, sofern noch undefined.

```ts
// src/lib/rules/epic-items.ts:222-230
for (const item of items) {
  if (!item.equipped) {
    applyUnequippedBaseOverrides(item, result.forceStatOverrides);
    continue;
  }
  ...
}
```

Ergebnis für Kondensator im unequipped-Zustand: `forceStatOverrides.con = 5`, `statOverrides.con` bleibt undefined.

### 2. Stat-Resolution: Drei Varianten

#### 2a. `character-computed.ts` (korrekt)

`src/lib/rules/character-computed.ts:147-148`:

```ts
const resolve = (base, force, epic, magic) => force ?? Math.max(base, epic ?? 0, magic ?? 0);
```

`fo.con` gewinnt absolut; Base/epic/magic werden ignoriert. Genutzt für alle effektiven Stats im GM-Dashboard + Play-Mode-Kombiwerte.

#### 2b. `character-sheet.tsx` (teilweise korrekt)

`src/components/character-sheet/character-sheet.tsx:264-269`:

```ts
const effectiveCon = fo.con ?? eo.con ?? character.con;
```

→ effectiveCon wird korrekt als 5 berechnet und an `conMods` weitergereicht.

**Aber:** Das Stat-Grid rendert bei `src/components/character-sheet/character-sheet.tsx:1241`:

```ts
{
  key: "con" as const,
  label: "CON",
  value: character.con,   // ← hardcodiert Base-Wert
  mods: t("abilityModCon", { hp: `${conMods.hpAdj}` }),
},
```

`value` ist immer `character.con` (18), nicht `effectiveCon` (5). Modifier unten nutzt jedoch `conMods`, das aus `effectiveCon` kommt — Modifier-Anzeige könnte also inkonsistent zum darüberstehenden Zahlenwert sein.

Das Muster gilt analog für STR/DEX/INT/WIS/CHA (Zeilen 1224, 1233, 1249, 1255, 1263): alle zeigen `character.<stat>` statt `effective<Stat>`.

#### 2c. `play-checks-panel.tsx` (inkorrekt)

`src/components/play-mode/play-checks-panel.tsx:87-95`:

```ts
const epic = epicEffects ?? defaultEpic;
const eo = epic.statOverrides;
const mo = magicStatOverrides;
const mb = magicStatBonuses;

function eff(base, stat) {
  return Math.max(base, eo[stat] ?? 0, mo[stat] ?? 0) + (mb[stat] ?? 0);
}
```

`fo` (forceStatOverrides) wird **nicht eingebunden**. Für den Kondensator-Unequip-Fall ist `eo.con` undefined → `Math.max(18, 0, 0) = 18`. Deswegen zeigt das Checks-Panel CON = 18.

Diese `eff`-Funktion wird verwendet für:

- Abilities-Grid (`play-checks-panel.tsx:115-204`) — "CON 18" statt 5
- Sub-Score-Skalierung via `sub()` (Zeile 103-112)
- NWP-Checks inline (`play-checks-panel.tsx:253-262`) — CON-basierte Proficiencies haben Target-Nummer aus 18 statt 5

Dieselbe `isModified`-Funktion (Zeile 98) liefert `false`, also wird auch kein Modified-Badge angezeigt.

### 3. HP-Berechnung: Delta-Modell

#### 3a. Play-Mode

`src/components/play-mode/play-mode.tsx:436-465`:

```ts
const baseConMods = getConstitutionModifiers(character.con, ...);   // CON 18
const hpDelta = useMemo(() => {
  if (conMods.hpAdj === baseConMods.hpAdj) return 0;
  const divisor = getMulticlassHpDivisor(activeClasses.length);
  let totalDelta = 0;
  for (const cc of activeClasses) {
    const group = getClassGroup(cc.class_id);
    const cap = getConBonusCap(group);              // +2 für Non-Warrior
    const cappedNew = Math.min(conMods.hpAdj, cap); // effectiveCon=5 → negativer hpAdj
    const cappedOld = Math.min(baseConMods.hpAdj, cap);
    totalDelta += (cappedNew - cappedOld) * cc.level;
  }
  return Math.round(totalDelta / divisor);
}, [activeClasses, conMods.hpAdj, baseConMods.hpAdj]);

const effectiveHpMax = Math.max(1, character.hp_max + hpDelta);
// Asymmetric HP capping: damage (negative delta) caps current HP down,
// but repair (positive delta) only raises max — never heals current HP.
// HP can go negative down to -maxHP (death threshold).
const effectiveHpCurrent = Math.max(
  getDeathThreshold(effectiveHpMax),
  Math.min(character.hp_current + Math.min(0, hpDelta), effectiveHpMax)
);
```

`character.hp_current` bleibt unverändert in der DB. Beim Render wird `hp_current + min(0, hpDelta)` berechnet. Mit `hpDelta < 0` wird Current effektiv um den Delta-Betrag gesenkt, zusätzlich auf `[−maxHp, effectiveHpMax]` geclampt.

Für das konkrete Szenario (vorher 34/34, jetzt `effectiveHpMax = 12`): `34 + (−44) = −10`, Clamp auf `max(−12, min(−10, 12)) = −10` → Anzeige `−10/12 (Unconscious)`.

Der Kommentar ("damage ... caps current HP down") deutet darauf, dass das Delta-Modell absichtlich so gebaut ist: beim Unequip wird Current nicht nur an das neue Max geclampt, sondern um den Delta-Betrag reduziert, wie "Damage".

#### 3b. `character-computed.ts` (GM-Dashboard)

`src/lib/rules/character-computed.ts:204-218` verwendet dieselbe Delta-Logik, aber einen anderen Floor:

```ts
const hpMax = Math.max(1, character.hp_max + hpDelta);
const hpCurrent = Math.max(0, Math.min(character.hp_current + Math.min(0, hpDelta), hpMax));
```

Floor ist `0` (nicht `getDeathThreshold(hpMax)` wie im Play-Mode). Gleicher Subtraktions-Ansatz für Current.

#### 3c. `computeEffectiveMaxHp` in `hitpoints.ts`

`src/lib/rules/hitpoints.ts:35-46` ist ein separater Helper, der **nur Max** berechnet (nicht Current). Wird in keiner der drei oben genannten Dateien direkt aufgerufen; die Logik ist inline dupliziert.

```ts
export function computeEffectiveMaxHp(
  storedMaxHp,
  storedConHpAdj,
  effectiveConHpAdj,
  characterLevel,
  classGroup
): number {
  const storedCapped = capConHpAdjForClass(storedConHpAdj, classGroup);
  const effCapped = capConHpAdjForClass(effectiveConHpAdj, classGroup);
  const delta = (effCapped - storedCapped) * Math.max(1, characterLevel);
  return Math.max(1, storedMaxHp + delta);
}
```

### 4. HP-Bar-Anzeige (aus Screenshot `-10/12`)

Die Anzeige `-10/12 Unconscious` aus dem Master-Dashboard stammt aus `src/lib/rules/character-computed.ts` (via `hpCurrent` / `hpMax` in `CharacterCombatData`). Dort ist der Floor `Math.max(0, ...)` — das heißt: `-10` wäre bei dieser Logik eigentlich `0`. Der Screenshot aus dem PLAY-Mode (letztes Bild) nutzt aber wohl `getDeathThreshold` als Floor und erlaubt `-10`.

**Diskrepanz:** `character-computed.ts` clampt Current auf `≥ 0`, `play-mode.tsx` erlaubt negativ bis Death-Threshold. Die User-Meldung zeigt `-10/12` — der Wert `-10` kann also nur aus `play-mode.tsx` (oder einer anderen Stelle mit demselben Muster) stammen, nicht aus `character-computed.ts`.

### 5. Parallele Stellen in anderen Komponenten

- `src/app/dashboard/page.tsx`, `src/app/master/page.tsx` — nutzen `computeCharacterCombatData`, erben dessen HP-Logik.
- `src/components/epic-equipment/epic-equipment-view.tsx:84-85` — zeigt Before/After-Vergleich für CON in Epic-Equipment-Panel. Nutzt korrekt `fo.con ?? eo.con`.

## Code References

- `src/lib/rules/epic-items.ts:98-126` — `BASE_STAT_KEYS` + `applyUnequippedBaseOverrides`
- `src/lib/rules/epic-items.ts:222-230` — Unequip-Zweig in `getEpicEffects`
- `src/lib/rules/epic-items.ts:240-259` — Equip-Zweig mit `authoritativeStats`
- `src/lib/rules/character-computed.ts:135,147-148,198` — Resolver mit force-Override
- `src/lib/rules/character-computed.ts:202-218` — HP-Delta-Berechnung (Floor 0)
- `src/lib/rules/hitpoints.ts:35-46` — `computeEffectiveMaxHp`-Helper (nur Max)
- `src/components/character-sheet/character-sheet.tsx:250-282` — Effective-Stat-Berechnung Manage
- `src/components/character-sheet/character-sheet.tsx:1220-1265` — Stat-Grid-Render (liest `character.con` direkt)
- `src/components/play-mode/play-mode.tsx:268-285` — Effective-Stats mit force-Override
- `src/components/play-mode/play-mode.tsx:445-465` — HP-Delta mit asymmetrischem Clamp auf Death-Threshold
- `src/components/play-mode/play-checks-panel.tsx:87-99` — `eff()` und `isModified()` OHNE force-Override
- `src/components/play-mode/play-checks-panel.tsx:115-204` — Abilities-Grid nutzt `eff()`
- `src/components/play-mode/play-checks-panel.tsx:252-278` — NWP-Checks nutzen eigene inline `effective()`-Funktion (auch ohne `fo`)
- `src/components/epic-equipment/epic-equipment-view.tsx:84-85` — Before/After-CON-Diff für Epic Items

## Architecture Documentation

### Stat-Resolution-Pattern

Es existieren drei Varianten der Stat-Resolution im Codebase:

1. **Vollständig (resolve-Helper):** `force ?? max(base, epic, magic) + magicBonus`. In `character-computed.ts`, `play-mode.tsx` konsistent.
2. **Nullish-Chain:** `fo.x ?? eo.x ?? character.x`. In `character-sheet.tsx` (für Sub-Stat-Helper-Variablen) und `epic-equipment-view.tsx`. Unterschied zur resolve-Variante: kein `Math.max`, also wenn `eo.x < base` wäre, würde hier `eo.x` gewinnen. Für Kondensator-Unequip-Case identisch, da `eo.con` undefined ist und `fo.con` direkt greift.
3. **Max-only (ohne force):** `max(base, epic, magic) + magicBonus`. In `play-checks-panel.tsx:eff()` und dessen inline-Duplikat in der NWP-Check-Berechnung. Hier fehlt die Force-Override-Berücksichtigung ganz.

### HP-Delta-Pattern

Beide HP-Implementierungen (play-mode.tsx + character-computed.ts) folgen demselben Muster:

```
hpDelta = Σ_classes (cappedNew − cappedOld) × level / divisor
effectiveHpMax = max(1, hp_max + hpDelta)
effectiveHpCurrent = clamp(hp_current + min(0, hpDelta), floor, effectiveHpMax)
```

Der Unterschied liegt nur im Floor:

- `play-mode.tsx`: Floor = `getDeathThreshold(effectiveHpMax) = −effectiveHpMax`
- `character-computed.ts`: Floor = `0`

Das `min(0, hpDelta)` stellt die Asymmetrie her: Positive Deltas (CON↑) heben nur `hpMax`, nicht Current; negative Deltas (CON↓) ziehen Current mit runter (wirken wie Damage).

### Force-Override-Semantik

`forceStatOverrides` wurde laut `src/lib/rules/epic-items.ts:61-70` Kommentar eingeführt für Items wie den Kondensator. `statOverrides` folgt Buff-Semantik (nur wenn höher als Base), `forceStatOverrides` ersetzt absolut. Der Kommentar erwähnt Equipped-Fall ("stored CON when unequipped, even though stored CON is higher reflecting the 'normally equipped' state") — die UNEQUIPPED-Pfad-Logik in `applyUnequippedBaseOverrides` setzt entsprechend `forceStatOverrides`.

## Open Questions

1. **Design-Intent des Delta-Damage-Verhaltens:** Der Kommentar in `play-mode.tsx:459-461` ("damage caps current HP down") ist vermutlich auf temporäre Buffs (Overclock) gemünzt, wo das Wiederfallen des CON-Bonus wie Damage wirken soll. Ob das beim **permanenten** Unequip-Szenario (Kondensator aus) ebenso gewünscht ist, klärt der Code nicht.
2. **Floor-Inkonsistenz:** Warum `character-computed.ts` auf `0` clampt, `play-mode.tsx` aber auf Death-Threshold, ist nicht dokumentiert.
3. **Stat-Grid in Manage-Ansicht:** Es ist nicht eindeutig, ob das Zeigen von `character.con` (statt `effectiveCon`) bewusst ist — die nebenstehende Modifier-Zeile nutzt bereits `conMods` aus `effectiveCon`, was zu inkonsistenter Anzeige führen kann.
