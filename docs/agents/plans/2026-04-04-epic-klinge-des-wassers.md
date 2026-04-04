---
date: "2026-04-04T09:21:55.680724+00:00"
git_commit: 225142e399a107f1f932fd6bc62b37a76e011ea7
branch: feat/epic-klinge-des-wassers
topic: "Epic Item: Klinge des Wassers"
tags: [plan, epic-items, weapons, character-equipment]
status: draft
---

# Epic Item: Klinge des Wassers — Implementation Plan

## Overview

Episches Schwert "Klinge des Wassers" für Larry (new) hinzufügen — ein Langschwert mit 4 Level-Stufen (L3-4, L5-6, L7-8, L9-10), das bei steigendem Level stärkere Waffenboni, Kälteschaden und Zauber-Fähigkeiten freischaltet. Alle Fähigkeiten werden über die Epic Items UI verwaltet. Im Play Mode zeigt die Waffe die korrekten Werte mit farblicher Hervorhebung der epischen Boni.

## Current State Analysis

- Epic Items System ist ausgereift: Auto-Unlock, kumulative Effekte, DamageLevelCard UI
- Gor's Items (Totem Warrior, Tattoo) zeigen das Pattern für level-gestufte Items mit `level_thresholds` und `special_attacks`
- **Fehlend:** Kein Mechanismus für Spell-Like Abilities in Epic Items UI (nur in Play Mode als `special_attacks`)
- **Fehlend:** Weapon Card im Play Mode zeigt `custom_label` nicht (nutzt nur `weapon.name`)
- **Fehlend:** Keine farbliche Unterscheidung von epischen vs. normalen magischen Boni
- Larry (new) hat keine Epic Items, kein Langschwert im Equipment, und möglicherweise keine Langschwert-Proficiency

## Desired End State

### Epic Items Seite (`/characters/{id}/epic`)

- DamageLevelCard zeigt "Klinge des Wassers" mit 4 Stufen, Auto-Unlock, Dots-Indikator
- Unterhalb der Effekt-Beschreibung: Spell-Abilities-Bereich mit Use-Tracking (Water Walk, Water Breathing, Cone of Cold)
- Stufe 3 (Level 9) aktiv: alle Abilities sichtbar, Cone of Cold mit 1×/Woche

### Play Mode (`/characters/{id}/play`)

- Waffe zeigt "Klinge des Wassers" statt "Langschwert" (via `custom_label`)
- Hit/Damage Bonus (+3) in **lila** statt blau (epischer Bonus)
- Zusätzliche Zeile: "+1d6 Kälteschaden" in lila im Damage Breakdown
- Magic Bonus Zeile zeigt "Epischer Bonus" statt "Magischer Bonus"

### Equipment Tab (`/characters/{id}/manage`, Tab Equipment)

- Waffe zeigt "Klinge des Wassers" via `custom_label`

### Print/DOCX

- Waffe korrekt mit +3 Bonus angezeigt (funktioniert bereits über `hit_bonus`/`damage_bonus`)

### UI Mockups

**Epic Items Seite — Spell Abilities Section:**

```
┌─────────────────────────────────────────────────┐
│ ⚔ Klinge des Wassers                  [Angelegt]│
│ Eine von vier Klingen eines mächtigen           │
│ Elementarmagiers...                             │
│─────────────────────────────────────────────────│
│ Schadensstufe 3 von 3          ● ● ●           │
│                                                 │
│ ┌─ Aktuelle Auswirkungen ────────────────────┐ │
│ │ Stufe 9-10: +3 Schwert, +1d6 Kälteschaden  │ │
│ │                                             │ │
│ │ [+3 Angriff] [+3 Schaden] [+1d6 Kälte]     │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─ Zauber-Fähigkeiten ──────────────────────┐  │
│ │ Water Walk           3×/Tag    [Einsetzen] │  │
│ │ Water Breathing      3×/Tag    [Einsetzen] │  │
│ │ Cone of Cold (10d4+10) 1×/Woche [Einsetzen]│  │
│ └────────────────────────────────────────────┘  │
│                                                 │
│ ▶ Alle Stufen                                   │
└─────────────────────────────────────────────────┘
```

**Play Mode — Weapon Card (epische Boni lila):**

```
┌─────────────────────────────────────────────────┐
│ Klinge des Wassers    [Nahkampf] ★              │
│                                                 │
│ THAC0 Nahkampf: 8   Schaden: 1d8+8 / 1d12+8   │
│ Geschwindigkeit: 2   Angriffe/Runde: 3/2       │
│                                                 │
│ +3 Epischer Bonus  ★ Spezialisierung            │
│ +1d6 Kälteschaden                    (lila)     │
│                                                 │
│ [Breakdown] [Ablegen]                           │
└─────────────────────────────────────────────────┘
```

**Play Mode — Expanded Breakdown (episch = lila):**

```
THAC0 Nahkampf:
  Basis-THAC0              12
  STR Trefferwurf-Adj.     -2
  ★ Spezialisierung        -1   (amber)
  ⚔ Epischer Bonus         -3   (lila)
  = THAC0                   6

Schaden:
  Basisschaden (SM/L)  1d8 / 1d12
  STR Schadensadj.     +3
  ★ Spezialisierung    +2       (amber)
  ⚔ Epischer Bonus     +3       (lila)
  ❄ Kälteschaden       +1d6     (lila)
  = Schaden            1d8+8+1d6 / 1d12+8+1d6
```

### Key Discoveries:

- `custom_label` existiert auf `CharacterEquipmentRow` aber wird in Play Mode nicht genutzt (`play-combat-panel.tsx:161`)
- Equipment Tab `getItemName()` bevorzugt `weapon.name` über `custom_label` (`tab-equipment.tsx:454-455`)
- Magic Hit/Damage Bonus wird bereits in `text-blue-400` angezeigt (`play-combat-panel.tsx:324,411`)
- `special_attacks` Pattern in `simple_effects` hat `unlock_level`, `usesPerDay`, bilingual — kann für Spell Abilities adaptiert werden
- `swords` Icon existiert bereits im `EpicIcon` Mapper

## What We're NOT Doing

- **Kein Auto-Sync:** Weapon bonuses werden statisch im `character_equipment` gesetzt. Bei Level-Up manuell anpassen.
- **Keine komplexe Schadenswürfel-Engine:** Kälteschaden ist ein Display-String, keine berechnete Mechanik.
- **Keine Änderung am `EpicEffects` Interface** für Weapon-Bonuses — die Bonuses kommen vom `character_equipment` Eintrag.
- **Keine neuen DB-Spalten** — alles passt in bestehende JSONB-Felder (`damage_levels`, `simple_effects`).
- **Kein neuer Card-Typ** — DamageLevelCard wird erweitert, nicht ersetzt.

## Implementation Approach

1. **DB-Migration:** Epic Item + Equipment + Proficiency für Larry (new) seeden
2. **Rules Engine:** `spell_abilities` Array in `getEpicEffects()` auswerten, neues `spellAbilities` Feld in `EpicEffects`
3. **Epic UI:** Spell-Abilities-Section in DamageLevelCard mit Use-Tracking
4. **Play Mode:** `custom_label` Unterstützung, epische Boni lila hervorheben, Kälteschaden-Badge
5. **Equipment Tab:** `custom_label` Unterstützung in `getItemName()`
6. **i18n:** Alle neuen Keys

## Architecture and Code Reuse

**Bestehendes Pattern (Gor's Tattoo → Spell Abilities):**

```
simple_effects.special_attacks → simple_effects.spell_abilities
  [{ key, name, name_en, unlock_level, usesPerDay?, usesPerWeek?, effect, effect_en }]
```

**Neues `spellAbilities` Feld im `EpicEffects` Interface:**

```typescript
interface SpellAbility {
  key: string;
  name: string;
  name_en: string;
  usesPerDay: number; // -1 = unlimited, 0 = not per day
  usesPerWeek: number; // 0 = not per week, >0 = weekly limit
  effect: string;
  effect_en: string;
}

interface EpicEffects {
  // ... existing fields ...
  spellAbilities: SpellAbility[];
}
```

**Farbschema:**

- `text-blue-400` → normaler magischer Bonus (bestehend)
- `text-purple-400` / `border-purple-500/50` → epischer Bonus (NEU)
- `text-amber-400` → Spezialisierung (bestehend)

**Betroffene Dateien:**

```
src/lib/rules/epic-items.ts                    # SpellAbility type + getEpicEffects() erweitern
src/lib/supabase/types.ts                      # (unchanged — EpicItemRow.simple_effects is already jsonb)
src/components/epic-equipment/damage-level-card.tsx  # Spell Abilities section + effect badges
src/components/play-mode/play-combat-panel.tsx       # custom_label, lila Boni, Kälteschaden
src/components/character-sheet/tab-equipment.tsx      # custom_label in getItemName()
messages/de.json                                     # Neue Keys
messages/en.json                                     # Neue Keys
supabase/migrations/00165_seed_larry_klinge_des_wassers.sql  # Epic Item + Equipment + Proficiency
```

---

## Phase 1: DB-Migration

### Overview

Epic Item, Langschwert-Equipment und Waffenproficiency mit Spezialisierung für Larry (new) anlegen.

### Changes Required:

#### [x] 1. Migration: Klinge des Wassers

**File**: `supabase/migrations/00165_seed_larry_klinge_des_wassers.sql`
**Changes**: Epic Item + Equipment + Proficiency seeden

```sql
-- Look up Larry (new) by exact name (not ILIKE — there are two Larrys)
-- Look up Langschwert weapon ID

-- 1. Epic Item: Klinge des Wassers
INSERT INTO public.epic_items (
  character_id, slug, name, name_en, description, description_en, icon,
  equipped, damage_level, max_damage_level, damage_levels, simple_effects, notes
)
SELECT c.id,
  'klinge-des-wassers',
  'Klinge des Wassers',
  'Blade of Water',
  'Eine von vier Klingen, geschaffen von einem mächtigen Elementarmagier der inneren Ebenen...',
  'One of four blades, forged by a powerful Elemental Mage of the Inner Planes...',
  'swords',
  true, 0, 3,
  -- damage_levels: 4 tiers (0-3)
  '{
    "0": {
      "description": "Stufe 3-4: +1 Schwert. 1×/Tag Water Walk.",
      "description_en": "Level 3-4: +1 sword. 1×/day Water Walk.",
      "effects": []
    },
    "1": {
      "description": "Stufe 5-6: +2 Schwert. 3×/Tag Water Walk, 1×/Tag Water Breathing.",
      "description_en": "Level 5-6: +2 sword. 3×/day Water Walk, 1×/day Water Breathing.",
      "effects": []
    },
    "2": {
      "description": "Stufe 7-8: +2 Schwert, +1d6 Kälteschaden. 3×/Tag Water Walk, 3×/Tag Water Breathing.",
      "description_en": "Level 7-8: +2 sword, +1d6 cold damage. 3×/day Water Walk, 3×/day Water Breathing.",
      "effects": ["cold_damage_1d6"]
    },
    "3": {
      "description": "Stufe 9-10: +3 Schwert, +1d6 Kälteschaden. 3×/Tag Water Walk, 3×/Tag Water Breathing, 1×/Woche Cone of Cold (10d4+10).",
      "description_en": "Level 9-10: +3 sword, +1d6 cold damage. 3×/day Water Walk, 3×/day Water Breathing, 1×/week Cone of Cold (10d4+10).",
      "effects": ["cold_damage_1d6"]
    }
  }'::jsonb,
  -- simple_effects: level_thresholds + spell_abilities
  '{
    "level_thresholds": [3, 5, 7, 9],
    "spell_abilities": [
      {
        "key": "water_walk",
        "name": "Water Walk",
        "name_en": "Water Walk",
        "unlock_level": 0,
        "usesPerDay": 1,
        "usesPerWeek": 0,
        "effect": "Der Träger kann auf Wasser laufen, als wäre es fester Boden.",
        "effect_en": "The bearer can walk on water as if it were solid ground."
      },
      {
        "key": "water_walk_3",
        "name": "Water Walk",
        "name_en": "Water Walk",
        "unlock_level": 1,
        "usesPerDay": 3,
        "usesPerWeek": 0,
        "replaces": "water_walk",
        "effect": "Der Träger kann auf Wasser laufen, als wäre es fester Boden.",
        "effect_en": "The bearer can walk on water as if it were solid ground."
      },
      {
        "key": "water_breathing",
        "name": "Water Breathing",
        "name_en": "Water Breathing",
        "unlock_level": 1,
        "usesPerDay": 1,
        "usesPerWeek": 0,
        "effect": "Der Träger kann unter Wasser atmen.",
        "effect_en": "The bearer can breathe underwater."
      },
      {
        "key": "water_breathing_3",
        "name": "Water Breathing",
        "name_en": "Water Breathing",
        "unlock_level": 2,
        "usesPerDay": 3,
        "usesPerWeek": 0,
        "replaces": "water_breathing",
        "effect": "Der Träger kann unter Wasser atmen.",
        "effect_en": "The bearer can breathe underwater."
      },
      {
        "key": "cone_of_cold",
        "name": "Cone of Cold",
        "name_en": "Cone of Cold",
        "unlock_level": 3,
        "usesPerDay": 0,
        "usesPerWeek": 1,
        "effect": "Kältekegel: 10d4+10 Schaden. Rettungswurf gg. Zauber für halben Schaden.",
        "effect_en": "Cone of Cold: 10d4+10 damage. Save vs. Spell for half damage."
      }
    ]
  }'::jsonb,
  ''
FROM public.characters c WHERE c.name = 'Larry (new)' LIMIT 1;

-- 2. Equipment: Langschwert mit +3/+3, custom_label
INSERT INTO public.character_equipment (character_id, weapon_id, quantity, equipped, hit_bonus, damage_bonus, custom_label)
SELECT c.id, w.id, 1, true, 3, 3, 'Klinge des Wassers'
FROM public.characters c, public.weapons w
WHERE c.name = 'Larry (new)' AND w.name = 'Langschwert'
AND NOT EXISTS (
  SELECT 1 FROM public.character_equipment ce
  WHERE ce.character_id = c.id AND ce.custom_label = 'Klinge des Wassers'
)
LIMIT 1;

-- 3. Weapon Proficiency: Langschwert mit Spezialisierung
INSERT INTO public.character_weapon_proficiencies (character_id, weapon_name, specialization)
SELECT c.id, 'Langschwert', true
FROM public.characters c WHERE c.name = 'Larry (new)'
AND NOT EXISTS (
  SELECT 1 FROM public.character_weapon_proficiencies cwp
  WHERE cwp.character_id = c.id AND cwp.weapon_name = 'Langschwert'
)
LIMIT 1;
```

**Spell Abilities Design-Entscheidung — `replaces` Feld:**
Water Walk steigt von 1×/Tag auf 3×/Tag. Statt die gleiche Ability doppelt zu zeigen, ersetzt `water_walk_3` (unlock_level=1) die `water_walk` (unlock_level=0). Die Verarbeitung in `getEpicEffects()` filtert ersetzende Abilities heraus.

### Success Criteria:

#### Automated Verification:

- [x] Migration läuft fehlerfrei: `supabase db push`
- [x] Epic Item existiert für Larry (new) in der DB
- [x] Equipment-Eintrag mit `custom_label = 'Klinge des Wassers'` existiert
- [x] Proficiency mit `specialization = true` für Langschwert existiert

---

## Phase 2: Rules Engine — Spell Abilities

### Overview

`EpicEffects` Interface um `spellAbilities` erweitern und `getEpicEffects()` um die Verarbeitung von `spell_abilities` aus `simple_effects` ergänzen.

### Changes Required:

#### [x] 1. SpellAbility Type und EpicEffects erweitern

**File**: `src/lib/rules/epic-items.ts`
**Changes**: Neuer Type `SpellAbility`, neues Feld `spellAbilities: SpellAbility[]` in `EpicEffects`, Verarbeitung in `getEpicEffects()`

```typescript
// Neuer Type
export interface SpellAbility {
  key: string;
  name: string;
  name_en: string;
  usesPerDay: number; // >0 = per day, 0 = not daily
  usesPerWeek: number; // >0 = per week, 0 = not weekly
  effect: string;
  effect_en: string;
}

// EpicEffects erweitern:
export interface EpicEffects {
  // ... alle bestehenden Felder ...
  spellAbilities: SpellAbility[];
}

// In getEpicEffects(): spell_abilities auswerten
// - Filter by unlock_level <= unlockedLevel
// - Handle "replaces" field: wenn ability.replaces gesetzt,
//   entferne die ersetzte Ability aus dem Ergebnis
```

#### [x] 2. Neuer Effekt-String: `cold_damage_1d6`

**File**: `src/lib/rules/epic-items.ts`
**Changes**: In der Effect-Processing-Schleife `cold_damage_1d6` als `miscEffect` tracken (kein spezielles Feld nötig — wird nur als Badge angezeigt)

#### [x] 3. Unit Tests

**File**: `src/lib/rules/epic-items.test.ts`
**Changes**: Tests für:

- `getEpicEffects()` mit `spell_abilities` in `simple_effects`
- Spell Abilities werden korrekt nach `unlock_level` gefiltert
- `replaces` Feld entfernt die ersetzte Ability
- `cold_damage_1d6` erscheint in `miscEffects`
- `spellAbilities` ist leer wenn kein `spell_abilities` Array vorhanden

### Success Criteria:

#### Automated Verification:

- [x] `npx tsc --noEmit` — keine Fehler
- [x] `npx vitest run src/lib/rules/epic-items.test.ts` — alle Tests grün

---

## Phase 3: i18n Keys

### Overview

Alle neuen Übersetzungs-Keys für Spell Abilities, epische Boni und Kälteschaden hinzufügen.

### Changes Required:

#### [ ] 1. Deutsche Übersetzungen

**File**: `messages/de.json`
**Changes**: Neue Keys in `epic` und `playMode` Namespaces

```json
// epic namespace:
"spellAbilities": "Zauber-Fähigkeiten",
"perDay": "{count}×/Tag",
"perWeek": "{count}×/Woche",
"abilityUsed": "Eingesetzt",
"abilityAvailable": "Verfügbar",
"coldDamage": "+1d6 Kälteschaden",
"weaponHitBonus": "+{bonus} Angriff",
"weaponDmgBonus": "+{bonus} Schaden",

// playMode namespace:
"epicHitBonus": "Epischer Bonus",
"epicDmgBonus": "Epischer Bonus",
"epicColdDamage": "+1d6 Kälteschaden"
```

#### [ ] 2. Englische Übersetzungen

**File**: `messages/en.json`
**Changes**: Gleiche Keys auf Englisch

```json
// epic namespace:
"spellAbilities": "Spell Abilities",
"perDay": "{count}×/day",
"perWeek": "{count}×/week",
"abilityUsed": "Used",
"abilityAvailable": "Available",
"coldDamage": "+1d6 Cold Damage",
"weaponHitBonus": "+{bonus} to hit",
"weaponDmgBonus": "+{bonus} damage",

// playMode namespace:
"epicHitBonus": "Epic Bonus",
"epicDmgBonus": "Epic Bonus",
"epicColdDamage": "+1d6 Cold Damage"
```

### Success Criteria:

#### Automated Verification:

- [x] `npx tsc --noEmit` — keine Fehler

---

## Phase 4: Epic Items UI — Spell Abilities + Effect Badges

### Overview

DamageLevelCard um Spell-Abilities-Section mit Use-Tracking und neue Effect-Badges (Waffenboni, Kälteschaden) erweitern.

### Changes Required:

#### [x] 1. Spell Abilities Section in DamageLevelCard

**File**: `src/components/epic-equipment/damage-level-card.tsx`
**Changes**:

- `spell_abilities` aus `simple_effects` auslesen, nach `unlock_level` filtern, `replaces` verarbeiten
- Neuer Abschnitt zwischen Effect-Description und Fragility
- Jede Ability als Card mit Name, Uses-Badge, Toggle-Button (Einsetzen/Verfügbar)
- Uses State (`usedSpellAbilities`) als lokaler State (Reset beim Neuladen = neuer Tag)
- Weekly abilities: einfach Toggle (1×/Woche Cone of Cold)

```tsx
// Spell Abilities Section (nach currentEffect Block, vor Fragility)
{spellAbilities.length > 0 && (
  <div className="mt-3" data-testid={`epic-spell-abilities-${item.slug}`}>
    <p className="mb-2 text-sm font-medium text-muted-foreground">{t("spellAbilities")}</p>
    <div className="flex flex-col gap-2">
      {spellAbilities.map((ability) => (
        <div key={ability.key} className="flex items-start justify-between rounded-md border ...">
          <div>
            <span className="font-medium">{localized(ability.name, ability.name_en, locale)}</span>
            <Badge>{ability.usesPerDay > 0 ? t("perDay", {count}) : t("perWeek", {count})}</Badge>
            <p className="text-xs text-muted-foreground">{localized(ability.effect, ...)}</p>
          </div>
          <Button size="xs" onClick={toggle}>{isUsed ? t("abilityUsed") : t("abilityAvailable")}</Button>
        </div>
      ))}
    </div>
  </div>
)}
```

#### [x] 2. Neue Effect Badges: Weapon Bonuses + Cold Damage

**File**: `src/components/epic-equipment/damage-level-card.tsx`
**Changes**: `getEffectBadges()` erweitern um `cold_damage_1d6` Badge. Plus: Waffenboni-Badges aus `damage_levels` Description extrahieren (als statischer Text, nicht berechnet).

Einfachere Alternative: Die Waffenboni stehen bereits in der `description` — wir fügen nur den Kälteschaden als Badge hinzu:

```typescript
// In getEffectBadges():
if (effect === "cold_damage_1d6") {
  badges.push({ label: t("coldDamage"), variant: "blue" });
}
```

### Success Criteria:

#### Automated Verification:

- [x] `npx tsc --noEmit` — keine Fehler
- [x] `npx vitest run` — alle Tests grün

#### Manual Verification:

- [ ] Epic Items Seite für Larry (new) öffnen: Klinge des Wassers wird angezeigt
- [ ] Alle 4 Stufen in "Alle Stufen" Tabelle sichtbar
- [ ] Stufe 3 aktiv (Level 9), 3 Dots gefüllt
- [ ] Spell Abilities: Water Walk (3×/Tag), Water Breathing (3×/Tag), Cone of Cold (1×/Woche) sichtbar
- [ ] Toggle-Buttons funktionieren (Einsetzen/Verfügbar)
- [ ] Kälteschaden-Badge sichtbar in blau

---

## Phase 5: Play Mode — Epische Waffe mit Hervorhebung

### Overview

Play Mode Weapon Card: `custom_label` nutzen, epische Boni in Lila hervorheben, Kälteschaden anzeigen.

### Changes Required:

#### [ ] 1. Custom Label Support in Weapon Card

**File**: `src/components/play-mode/play-combat-panel.tsx`
**Changes**: In `renderWeaponCard()` (Zeile 161):

```typescript
// Vorher:
const weaponName = localized(weapon.name, weapon.name_en, locale);

// Nachher:
const weaponName = eq.custom_label || localized(weapon.name, weapon.name_en, locale);
```

#### [ ] 2. Epische Boni lila hervorheben

**File**: `src/components/play-mode/play-combat-panel.tsx`
**Changes**:

- Wenn `eq.custom_label` gesetzt ist (= epische Waffe), Magic Bonus in `text-purple-400` statt `text-blue-400` anzeigen
- Label "Epischer Bonus" statt "Magischer Bonus" verwenden
- Gilt für: Hit Bonus Badge (Zeile 254-257), THAC0 Breakdown (Zeile 322-328), Damage Breakdown (Zeile 409-415)

```typescript
const isEpicWeapon = !!eq.custom_label;
const bonusColor = isEpicWeapon ? "text-purple-400" : "text-blue-400";
const bonusLabel = isEpicWeapon ? t("epicHitBonus") : t("magicHitBonus");
```

#### [ ] 3. Kälteschaden-Badge und Breakdown-Zeile

**File**: `src/components/play-mode/play-combat-panel.tsx`
**Changes**:

- `epicEffects.miscEffects` auf `cold_damage_1d6` prüfen: wenn vorhanden UND Waffe ist episch, Kälteschaden anzeigen
- Badge unterhalb des Magic Bonus (Zeile ~258): `+1d6 Kälteschaden` in lila
- Im Damage Breakdown (nach Zeile 416): Extra-Zeile `❄ Kälteschaden  +1d6` in lila

```tsx
// Badge im Weapon Card:
{
  isEpicWeapon && epicEffects?.miscEffects.includes("cold_damage_1d6") && (
    <span className="text-xs text-purple-400" data-testid={`play-weapon-cold-dmg-${eq.id}`}>
      ❄ {t("epicColdDamage")}
    </span>
  );
}

// Im Damage Breakdown:
{
  isEpicWeapon && epicEffects?.miscEffects.includes("cold_damage_1d6") && (
    <div className="flex justify-between text-purple-400">
      <span>❄ {t("epicColdDamage")}</span>
      <span>+1d6</span>
    </div>
  );
}
```

#### [ ] 4. Custom Label in Equipment Tab

**File**: `src/components/character-sheet/tab-equipment.tsx`
**Changes**: `getItemName()` (Zeile 454) — `custom_label` vor `weapon.name` prüfen:

```typescript
function getItemName(item: CharacterEquipmentWithDetails): string {
  if (item.custom_label) return item.custom_label;
  if (item.weapon) return localized(item.weapon.name, item.weapon.name_en, locale);
  if (item.armor) return localized(item.armor.name, item.armor.name_en, locale);
  return "—";
}
```

### Success Criteria:

#### Automated Verification:

- [x] `npx tsc --noEmit` — keine Fehler
- [x] `npx vitest run` — alle Tests grün

#### Manual Verification:

- [ ] Play Mode für Larry (new) öffnen
- [ ] Waffe zeigt "Klinge des Wassers" statt "Langschwert"
- [ ] "+3 Epischer Bonus" in lila (nicht blau) angezeigt
- [ ] "+1d6 Kälteschaden" in lila angezeigt
- [ ] Breakdown aufklappen: Epischer Bonus und Kälteschaden in lila
- [ ] Spezialisierung weiterhin in amber
- [ ] Equipment Tab: "Klinge des Wassers" als Name

---

## Phase 6: Cleanup & Verifizierung

### Overview

Finaler Type-Check, Linting, Tests, Format.

### Changes Required:

#### [ ] 1. Alle Tests laufen lassen

#### [ ] 2. Format prüfen

#### [ ] 3. Build prüfen

### Success Criteria:

#### Automated Verification:

- [x] `npx tsc --noEmit` — keine Fehler
- [x] `npx vitest run` — alle Tests grün
- [x] `npm run lint` — keine Fehler
- [x] `npm run format:check` — keine Fehler
- [x] `npm run build` — erfolgreich

---

## Testing Strategy

### Unit Tests:

- `getEpicEffects()` mit `spell_abilities` Array → `spellAbilities` Feld korrekt befüllt
- `spell_abilities` mit `unlock_level` Filter bei verschiedenen Character-Leveln
- `replaces` Feld: ersetzte Ability wird herausgefiltert
- `cold_damage_1d6` in `miscEffects` enthalten
- Leeres `spell_abilities` → leeres `spellAbilities` Array
- Item ohne `spell_abilities` → bestehende Effekte unverändert (Regression)

### Manual Testing Steps:

1. Larry (new) → Epic Items: Klinge des Wassers mit 4 Stufen, Stufe 3 aktiv
2. Spell Abilities sichtbar (Water Walk 3×, Water Breathing 3×, Cone of Cold 1×/Woche)
3. Toggle-Buttons für jede Ability funktionieren
4. Larry (new) → Play Mode: Waffe zeigt "Klinge des Wassers", +3 in lila, +1d6 Kälte in lila
5. Breakdown: epische Boni in lila, Spezialisierung in amber
6. Larry (new) → Manage → Equipment Tab: "Klinge des Wassers" als Name
7. Print-Ansicht: Waffe mit +3 Bonus korrekt angezeigt

## Performance Considerations

Keine — eine einzelne Iteration über `spell_abilities` Array (max. 5 Einträge) in `getEpicEffects()`.

## Migration Notes

- Migration 00165 muss via `supabase db push` ausgeführt werden
- Larry (new) wird per exaktem Namen gefunden (`name = 'Larry (new)'`)
- Idempotent: `NOT EXISTS` Checks verhindern Duplikate bei erneutem Ausführen

## References

- Research: `docs/agents/research/2026-04-04-epic-item-klinge-des-wassers.md`
- Gor's Totem Warrior (Pattern): `supabase/migrations/00057_gor_epic_items_v2.sql`
- DamageLevelCard: `src/components/epic-equipment/damage-level-card.tsx`
- Play Mode Combat: `src/components/play-mode/play-combat-panel.tsx`
- Epic Items Rules: `src/lib/rules/epic-items.ts`
