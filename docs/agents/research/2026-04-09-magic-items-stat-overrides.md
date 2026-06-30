---
date: 2026-04-09T12:37:49+00:00
git_commit: cc823168be2352a6a22674dff26b4306e5ac188c
branch: feature/play-mode-magic-items
topic: "Magische Items in AD&D 2e: Stat-Overrides, Waffen, Rüstungen und Play Mode Integration"
tags: [research, magic-items, epic-items, stat-overrides, play-mode, ad&d-2e]
status: complete
---

# Research: Magische Items in AD&D 2e — Stat-Overrides, Waffen, Rüstungen und Play Mode Integration

## Research Question

Wie funktionieren magische Items (Waffen, Rüstungen, Ringe, Gürtel, etc.) in AD&D 2nd Edition? Wie werden Stat-Overrides vs. additive Boni modelliert? Wie ist die aktuelle Implementierung aufgebaut und wo gibt es Lücken?

## Summary

Das MagicEffects-System kennt derzeit **nur additive Boni** (`str: 19` wird als `+19` interpretiert), obwohl AD&D 2e Items wie der **Gürtel der Riesenstärke** die Stärke auf einen festen Wert **setzen** (Override). Epic Items haben dieses Override-Konzept bereits implementiert (`stat_overrides` in `damage_levels`), aber Magic Items nicht. Insgesamt sind 4 von 25 Seed-Items betroffen (Belt of Giant Strength, Gauntlets of Ogre Power, Gauntlets of Dexterity, Potion of Giant Strength). Zusätzlich werden Magic Item Stat-Boni im Checks-Panel nicht visuell angezeigt.

---

## Detailed Findings

### 1. AD&D 2e Magische Item-Kategorien

Laut DMG gibt es folgende Hauptkategorien magischer Items, die für einen Play Mode relevant sind:

| Kategorie                  | Beispiele                                     | Play Mode Relevanz                |
| -------------------------- | --------------------------------------------- | --------------------------------- |
| **Waffen** (+1/+2/+3)      | Longsword +1, Frostbrand                      | THAC0, Schaden                    |
| **Rüstungen** (+1/+2/+3)   | Chain Mail +1, Plate +2                       | AC                                |
| **Ringe**                  | Ring of Protection, Ring of Invisibility      | AC, Saves, Passiv                 |
| **Gürtel**                 | Belt of Giant Strength, Girdle of Dwarvenkind | Stat-Override, Passiv             |
| **Umhänge**                | Cloak of Protection, Cloak of Displacement    | AC, Passiv                        |
| **Armschienen/Handschuhe** | Gauntlets of Ogre Power, Bracers of Defense   | Stat-Override, AC                 |
| **Stiefel**                | Boots of Speed, Boots of Elvenkind            | Bewegung, Thief Skills            |
| **Amulette**               | Periapt of Health, Necklace of Fireballs      | Passiv, Spell Abilities           |
| **Tränke**                 | Potion of Giant Strength, Potion of Healing   | Temporäre Stat-Overrides, Heilung |
| **Stäbe/Zauberstäbe**      | Wand of Magic Missiles, Rod of Healing        | Charges, Spell Abilities          |

### 2. Stat-Modifikation: Override vs. Additive Boni

In AD&D 2e gibt es **zwei fundamental verschiedene Arten** wie Items Attribute modifizieren:

#### A) Stat-Override ("Set to X")

Das Item **ersetzt** den Attributwert durch einen festen Wert. Funktioniert nur wenn der Override höher ist als der Base-Wert.

| Item                     | Effekt                    | Anmerkung                                                                               |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------- |
| Belt of Giant Strength   | STR → 19 (Hill Giant)     | Es gibt Varianten: Hill (19), Stone (20), Frost (21), Fire (22), Cloud (23), Storm (24) |
| Gauntlets of Ogre Power  | STR → 18/00               | Exceptional Strength                                                                    |
| Gauntlets of Dexterity   | DEX → 18                  |                                                                                         |
| Potion of Giant Strength | STR → 19-24 (je nach Typ) | Temporär                                                                                |

**Regeldetail:** Wenn der Charakter bereits einen höheren Wert hat, wird der Override ignoriert. Es gilt immer: `max(baseValue, overrideValue)`.

#### B) Additive Boni ("+X")

Das Item addiert einen Bonus zum bestehenden Wert.

| Item                   | Effekt            | Anmerkung                         |
| ---------------------- | ----------------- | --------------------------------- |
| +1/+2/+3 Waffen        | Hit +X, Damage +X | Beide Boni                        |
| +1/+2/+3 Rüstungen     | AC -X             | In AD&D: niedrigere AC = besser   |
| Ring of Protection +1  | AC -1, Saves +1   |                                   |
| Cloak of Protection +1 | AC -1, Saves +1   | Ring + Cloak stacken NICHT (AD&D) |

### 3. Magische Waffen in AD&D 2e

**+X Bonus:** Gilt immer für **beide** — Attack Roll UND Damage Roll.

- Longsword +2: THAC0 -2, Damage +2
- Spezialwaffen können unterschiedliche Hit/Damage-Boni haben (z.B. +1 Hit, +3 Damage)

**Spezialeffekte:** Flame Tongue, Frostbrand, Vorpal, Disruption, etc. — diese haben zusätzliche Effekte (extra Damage vs. bestimmte Gegner, Soforttod, etc.)

**Aktuelle Implementierung:**

- Magische Waffen-Boni werden über `character_equipment.hit_bonus` und `character_equipment.damage_bonus` gespeichert (nicht auf der Waffe selbst)
- `getAdjustedWeaponThac0()` in `combat.ts` subtrahiert `weaponHitBonus` vom THAC0
- `formatDamageWithBonus()` addiert `weaponDmgBonus` zum Schaden
- **Funktioniert korrekt** für +X Boni

### 4. Magische Rüstungen in AD&D 2e

**+X Bonus:** Verbessert die AC um X (in AD&D: Plate Mail AC 3, Plate +2 = AC 1).

**Aktuelle Implementierung:**

- Keine separaten "magischen Boni" auf der Rüstung — der User setzt die AC direkt oder nutzt `character_equipment.magic_effects.ac_bonus`
- `calculateAC()` in `equipment.ts` akzeptiert `magicACModifier` (von magic items) und `epicAcBonus` (von epic items)
- Bracers/Rings nutzen `armor.is_magical_protection` Flag — werden als Bonus zu Base AC 10 behandelt

### 5. Aktuelle MagicEffects Implementierung

#### Type-Definition (`types.ts:144-199`)

```typescript
interface MagicEffects {
  str?: number; dex?: number; con?: number; int?: number; wis?: number; cha?: number;
  ac_bonus?: number; attack_bonus?: number; damage_bonus?: number;
  save_all?: number; save_vs_spell?: number; save_vs_poison?: number; ...
  hide_in_shadows?: number; move_silently?: number; ...
  perception_bonus?: number; movement_bonus?: number;
  magic_resistance?: number; spell_failure?: number;
  max_charges?: number; current_charges?: number;
  spell_abilities?: MagicSpellAbility[];
  resistances?: string[]; passive_abilities?: string[];
  description?: string; description_en?: string; is_cursed?: boolean;
}
```

**Fehlendes Feld:** `stat_overrides` — es gibt keine Möglichkeit, Override-Semantik auszudrücken.

#### Aggregation (`magic-items.ts:76-221`)

- `getMagicItemEffects()` iteriert über alle equipped magic items
- Stats werden **summiert** (Zeile 106-109): `result.statBonuses[stat] += fx[stat]`
- AC, Attack, Damage: summiert
- Saves: summiert (inkl. `save_all` auf alle 5 Kategorien)
- Thief Skills: summiert
- Magic Resistance: **max** (nicht kumulativ, per AD&D)
- Spell Failure: **max**
- Spell Abilities, Resistances, Passive Abilities: concat/dedupliziert

#### Vergleich: MagicEffects vs. EpicEffects

| Aspekt            | MagicEffects                       | EpicEffects                            |
| ----------------- | ---------------------------------- | -------------------------------------- |
| Stat-Modifikation | Additiv (sum)                      | Override (last wins)                   |
| Storage           | `magic_effects` JSONB              | `damage_levels[n].stat_overrides`      |
| AC                | `ac_bonus` (additiv)               | `acBonus` (per effect string)          |
| Aggregation       | `getMagicItemEffects()`            | `getEpicEffects()`                     |
| Spell Abilities   | `MagicSpellAbility[]`              | `SpellAbility[]` (mit replaces-Logik)  |
| Spezialeffekte    | resistances[], passive_abilities[] | shapeshift, special_attacks, overclock |

### 6. Seed-Daten: 25 Magic Items (DMG)

**4 Items mit falsch modellierten Stat-Effekten:**

| Item                     | Aktuell                            | Korrekt (AD&D)             |
| ------------------------ | ---------------------------------- | -------------------------- |
| Belt of Giant Strength   | `"str": 19` (wird als +19 addiert) | Stat-Override: STR = 19    |
| Gauntlets of Ogre Power  | `"str": 18` (wird als +18 addiert) | Stat-Override: STR = 18/00 |
| Gauntlets of Dexterity   | `"dex": 18` (wird als +18 addiert) | Stat-Override: DEX = 18    |
| Potion of Giant Strength | `"str": 19` (wird als +19 addiert) | Stat-Override: STR = 19    |

**Bracers of Defense AC 6 Sonderfall:**

- Aktuell: `"ac_bonus": -4` (additiv von AC 10 → AC 6)
- Dies ist korrekt für das **aktuelle** System, da Bracers auch über `armor.is_magical_protection` modelliert werden können
- In AD&D 2e setzen Bracers die AC auf einen festen Wert (AC 6, AC 4, etc.) — das ist eher ein "AC Override"

### 7. Play Mode Integration — Wo Magic Effects genutzt werden

#### Vollständig integriert:

- **Effective Stats** (`play-mode.tsx:272-279`, `character-computed.ts:140-145`): Epic Override → dann Magic Bonus additiv → Cap bei 25
- **AC** (`character-computed.ts:212-224`): `magicEffects.acBonus` in `calculateAC()`
- **Saving Throws** (`character-computed.ts:230-237`): `magicEffects.saveBonuses` subtrahiert (lower = better)
- **Thief Skills** (`character-computed.ts:239-257`): Epic Penalty → dann Magic Bonus additiv
- **Perception** (`character-computed.ts:226-227`): Berechnet aus effectiveInt + effectiveWis (Magic Boni fließen indirekt ein)
- **Magic Resistance, Spell Failure, Resistances, Passives, Spell Abilities**: Aggregiert und weitergereicht

#### Nicht in UI angezeigt:

- **Checks-Panel** (`play-checks-panel.tsx:91-180`): Zeigt nur `eo.str ?? character.str` — Magic Item Boni **fehlen** in der Anzeige
- **Thief Skills im Checks-Panel**: Nutzt nur `applyThiefPenalty()` ohne Magic Item Boni (obwohl Props dafür definiert sind)
- **GM Dashboard**: Finale Werte werden angezeigt, aber Quelle der Boni (Magic vs. Epic) nicht unterschieden

### 8. Architektur: Drei Systeme für magische Effekte

```
┌─────────────────────────────────────────────┐
│              character_equipment             │
│                                             │
│  weapon_id ──► weapons (hit_bonus/dmg_bonus)│  ← Magische Waffen (+X)
│  armor_id  ──► armor (ac, is_magical_prot)  │  ← Magische Rüstungen (+X)
│  magic_item_id ──► magic_items (effects)    │  ← Magic Items (Ringe, Gürtel, etc.)
│                                             │
│  magic_effects JSONB ← kopiert von Katalog  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│                epic_items                    │
│  damage_levels[n].stat_overrides            │  ← Stat-Overrides
│  simple_effects (shapeshift, spells, etc.)  │  ← Spezialeffekte
└─────────────────────────────────────────────┘
```

## Code References

- `src/lib/supabase/types.ts:144-199` — MagicEffects Interface (fehlt stat_overrides)
- `src/lib/rules/magic-items.ts:76-221` — getMagicItemEffects() Aggregation (nur additiv)
- `src/lib/rules/epic-items.ts:61-88` — EpicEffects Interface (hat statOverrides)
- `src/lib/rules/epic-items.ts:163-263` — getEpicEffects() mit Override-Logik
- `src/lib/rules/character-computed.ts:140-145` — Effective Stats: epic override + magic additive
- `src/lib/rules/character-computed.ts:211-224` — AC Berechnung mit magic + epic
- `src/lib/rules/character-computed.ts:230-237` — Saves mit magic bonuses
- `src/lib/rules/character-computed.ts:239-257` — Thief Skills mit magic bonuses
- `src/lib/rules/equipment.ts:37-84` — calculateAC() Implementation
- `src/lib/rules/combat.ts:197-211` — getAdjustedWeaponThac0() mit weaponHitBonus
- `src/components/play-mode/play-mode.tsx:244-280` — Play Mode effective stats
- `src/components/play-mode/play-checks-panel.tsx:91-180` — Checks Panel: fehlt magic item display
- `supabase/migrations/00195_seed_magic_items_effects.sql` — Seed-Daten mit falscher Semantik

## Architecture Documentation

### Aktuelle Effekt-Verarbeitungskette

1. **DB → TypeScript:** `character_equipment.magic_effects` JSONB wird als `MagicEffects` geladen
2. **Aggregation:** `getMagicItemEffects()` summiert alle equipped items
3. **Stat-Berechnung:** `effectiveStr = (epicOverride ?? baseStr) + magicBonus`
4. **Abgeleitete Werte:** THAC0, AC, Saves, Perception, Thief Skills nutzen effective stats
5. **UI:** Checks-Panel zeigt nur Epic Override oder Base — Magic Boni fehlen

### Konvention: Magic Items vs. Waffen/Rüstungen

- **Waffen:** Boni über `character_equipment.hit_bonus`/`damage_bonus` (einfache Integer)
- **Rüstungen:** Boni über `armor.ac` direkt oder `armor.is_magical_protection`
- **Magic Items:** Alle Effekte in `magic_effects` JSONB (komplex, strukturiert)
- **Epic Items:** Eigene Tabelle `epic_items` mit `damage_levels` und `simple_effects`

## Open Questions

1. **Stacking-Regeln:** In AD&D 2e stacken viele Schutz-Items nicht (Ring of Protection + Cloak of Protection = nur der bessere zählt). Soll das implementiert werden oder ist das eine bewusste Vereinfachung?
2. **Exceptional Strength bei Override:** Gauntlets of Ogre Power setzen STR auf 18/00 — wie soll `str_exceptional` bei Overrides behandelt werden?
3. **Temporäre Effekte (Tränke):** Potions haben zeitlich begrenzte Effekte. Soll das über das bestehende Charges-System gelöst werden oder braucht es ein Duration-Feld?
4. **Bracers of Defense:** Aktuell als `ac_bonus: -4` modelliert — soll es ein AC-Override werden (Bracers of Defense AC 6) oder bleibt das additiv?
