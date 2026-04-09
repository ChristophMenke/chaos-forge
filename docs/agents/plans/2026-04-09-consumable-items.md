---
date: 2026-04-09T09:13:20Z
git_commit: b746ced
branch: feature/magic-items-catalog-bookmarks
topic: "Consumable Items (Potions, Scrolls, Wand-Charges)"
tags: [plan, play-mode, equipment, magic-items]
status: draft
---

# Consumable Items Implementation Plan

## Overview

Spieler können Consumable Magic Items (Potions, Scrolls, Wand-Charges) aus dem Equipment-Tab benutzen. Potions heilen HP oder geben temporäre Effekte, Scrolls wirken Zauber, Wands verbrauchen Charges. Nach Nutzung wird das Item entfernt (Potions/Scrolls) oder eine Charge abgezogen (Wands/Rods). Würfelwürfe gibt der Spieler manuell ein (Pen&Paper-Feeling).

## Current State Analysis

- Magic Items liegen in `character_equipment` mit `weapon_id=null, armor_id=null, custom_label, magic_effects`
- Equipment-Tab zeigt Magic Items mit Equip/Unequip/Edit/Remove Buttons (`tab-equipment.tsx:799-843`)
- `magic_effects.max_charges` / `current_charges` existieren bereits im Typ (`types.ts:184-185`)
- `isDepleted()` in `magic-items.ts:65-69` prüft ob Charges aufgebraucht sind
- HP-Änderungen im Play Mode via `PlayHpBar` → `onHpChange()` → Supabase Update
- **Kein** "Use"-Button, kein Consumable-Mechanismus, keine Unterscheidung Potion vs. permanentes Item

### Key Discoveries:

- Magic Item Kategorie steht im `custom_label` als `"Name (Category)"` Pattern — parsebar via Regex
- Kategorie ist auch im `magic_items` Katalog als eigenes Feld `category`
- `MagicEffects.description` enthält bei Potions den Heilwurf-Text (z.B. "Heals 1d8+1 HP")
- Charges-System existiert bereits: `max_charges`, `current_charges`, `isDepleted()`

## Desired End State

### UI Mockup — Equipment Tab Magic Items:

```
┌──────────────────────────────────────────────────────┐
│ Potion of Healing                      [Use] [✕]    │
│ ┌──────────────────────────────────────────────┐     │
│ │ Heals 1d8+1 HP                               │     │
│ └──────────────────────────────────────────────┘     │
│                                                      │
│ Wand of Magic Missiles (38/50 charges)  [Use] [Edit] │
│ ┌──────────────────────────────────────────────┐     │
│ │ Magic Missile (at-will)                       │     │
│ └──────────────────────────────────────────────┘     │
│                                                      │
│ Ring of Protection +1                   [Eq] [Edit]  │
│ ┌──────────────────────────────────────────────┐     │
│ │ AC -1  Saves +1                               │     │
│ └──────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────┘
```

### UI Mockup — Use Consumable Dialog (Potion):

```
┌─────────────────────────────────────┐
│  🍾 Potion of Healing               │
│  Heals 1d8+1 HP                     │
│                                     │
│  HP geheilt: [___]                  │
│                                     │
│  Aktuell: 28/34 HP                  │
│                                     │
│  [Trinken]           [Abbrechen]    │
└─────────────────────────────────────┘
```

### UI Mockup — Use Consumable Dialog (Wand):

```
┌─────────────────────────────────────┐
│  🪄 Wand of Magic Missiles          │
│  38/50 Charges                      │
│                                     │
│  Charges verbraucht: [1]            │
│                                     │
│  [Benutzen]          [Abbrechen]    │
└─────────────────────────────────────┘
```

### UI Mockup — Use Consumable Dialog (Scroll):

```
┌─────────────────────────────────────┐
│  📜 Scroll of Fireball              │
│  Fires a 6d6 fireball              │
│                                     │
│  Scroll verbrauchen?                │
│                                     │
│  [Verbrauchen]       [Abbrechen]    │
└─────────────────────────────────────┘
```

### Verification:

- Spieler sieht "Use"-Button bei Potions, Scrolls, Wands (nicht bei Ringen, Amuletten etc.)
- Klick öffnet Dialog mit Item-Info und manuellem Eingabefeld
- Nach Bestätigung: HP werden geheilt (Potions), Charges werden abgezogen (Wands), Item wird entfernt (Potions/Scrolls)
- Depleted Wands (0 Charges) zeigen keinen "Use"-Button mehr

## What We're NOT Doing

- Kein automatisches Würfeln — Spieler gibt manuell ein
- Keine temporären Buff-Tracking (Potion of Speed Dauer etc.) — nur HP-Heilung und Charge-Verbrauch
- Kein Potion-Mixing oder Nebenwirkungen
- Kein Scroll-Mishap-System (Caster-Level-Check)
- Keine Wand-Recharge-Mechanik

## Implementation Approach

1. Consumable-Erkennung: Funktion `isConsumable(item)` basierend auf Kategorie (Potion, Scroll, Wand, Rod, Staff) oder vorhandenen Charges
2. "Use"-Button im Equipment-Tab neben Equip/Edit nur für Consumables
3. Neuer `UseConsumableDialog` als shared Komponente — typ-spezifisch (Potion mit HP-Input, Wand mit Charge-Input, Scroll mit Bestätigung)
4. Nach Nutzung: HP-Update (Potions), Charge-Decrement (Wands/Rods), Item-Delete (Potions/Scrolls)

## Architecture and Code Reuse

**Bestehender Code zum Wiederverwenden:**

- `isDepleted()` aus `magic-items.ts` — Charge-Prüfung
- `getMagicEffectBadgeList()` aus `magic-effect-badges.tsx` — Item-Info im Dialog
- HP-Update Pattern aus `play-hp-bar.tsx:55-70` — `onHpChange(Math.min(hpMax, current + amount))`
- `ConfirmDialog` Pattern für einfache Scroll-Bestätigung
- Equipment Remove Pattern aus `tab-equipment.tsx:285-291`

**Neue Dateien:**

```
src/
  components/
    character-sheet/
      use-consumable-dialog.tsx    # NEU — Dialog für Potion/Scroll/Wand Nutzung
    shared/
      consumable-utils.ts          # NEU — isConsumable(), getConsumableType(), parseCategory()
  lib/
    rules/
      consumables.ts               # NEU — Consumable-Logik (Typ-Erkennung, Charge-Berechnung)

Geänderte Dateien:
  src/components/character-sheet/tab-equipment.tsx  # "Use"-Button hinzufügen
  messages/de.json + en.json                        # i18n Keys
```

## Phase 1: Consumable-Erkennung + Rules-Logic

### Overview

Reine TypeScript-Logik für Consumable-Erkennung und -Klassifizierung. Keine UI-Änderungen.

### Changes Required:

#### [ ] 1. Consumable Rules Logic

**File**: `src/lib/rules/consumables.ts` (NEU)

```typescript
export type ConsumableType = "potion" | "scroll" | "charged" | null;

const CONSUMABLE_CATEGORIES = ["Potion", "Scroll"];
const CHARGED_CATEGORIES = ["Wand/Staff/Rod", "Wand", "Rod", "Staff"];

export function getConsumableType(item: CharacterEquipmentWithDetails): ConsumableType;
export function isConsumable(item: CharacterEquipmentWithDetails): boolean;
export function parseCategory(customLabel: string | null): string | null;
export function canUseConsumable(item: CharacterEquipmentWithDetails): boolean;
// → true wenn: isConsumable UND (nicht depleted ODER kein Charge-System)
```

#### [ ] 2. Unit Tests

**File**: `src/lib/rules/consumables.test.ts` (NEU)

Testfälle:

- Potion of Healing → type "potion"
- Scroll of Fireball → type "scroll"
- Wand of Magic Missiles (charges > 0) → type "charged"
- Wand of Magic Missiles (charges = 0) → canUse = false
- Ring of Protection → type null (not consumable)
- Belt of Giant Strength → type null
- Item ohne custom_label → type null
- Item mit magic_item_id + category aus Katalog

### Success Criteria:

#### Automated Verification:

- [ ] `npm test` — alle Tests bestehen inkl. neue consumables.test.ts
- [ ] `npx tsc --noEmit` — keine TypeScript-Fehler

---

## Phase 2: Use Consumable Dialog

### Overview

Neuer Dialog für die Nutzung von Consumables. Typ-spezifische UI: Potion (HP-Input), Scroll (Bestätigung), Charged (Charge-Input).

### Changes Required:

#### [ ] 1. UseConsumableDialog Komponente

**File**: `src/components/character-sheet/use-consumable-dialog.tsx` (NEU)

```typescript
interface UseConsumableDialogProps {
  item: CharacterEquipmentWithDetails;
  consumableType: ConsumableType;
  hpCurrent: number;
  hpMax: number;
  onUse: (result: { hpHealed?: number; chargesUsed?: number }) => void;
  onCancel: () => void;
}
```

**Dialog-Varianten:**

- **Potion**: Zeigt Description, HP-Eingabefeld, aktuelle HP. "Trinken" Button.
- **Scroll**: Zeigt Description/Spell Abilities. "Verbrauchen" Button (Confirm only).
- **Charged (Wand/Rod/Staff)**: Zeigt Charges-Status, Charge-Eingabefeld (default 1). "Benutzen" Button.

#### [ ] 2. i18n Keys

**Files**: `messages/de.json`, `messages/en.json`

```json
{
  "equipment": {
    "useItem": "Benutzen",
    "usePotion": "Trinken",
    "useScroll": "Verbrauchen",
    "useCharged": "Benutzen",
    "hpHealed": "HP geheilt",
    "chargesUsed": "Charges verbraucht",
    "currentHp": "Aktuell: {current}/{max} HP",
    "chargesRemaining": "{current}/{max} Charges",
    "potionConsumed": "Trank verbraucht! +{hp} HP",
    "scrollConsumed": "Schriftrolle verbraucht!",
    "chargesDeducted": "{charges} Charge(s) verbraucht"
  }
}
```

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — TypeScript fehlerfrei
- [ ] `npm test` — alle Tests bestehen

---

## Phase 3: Equipment-Tab Integration

### Overview

"Use"-Button im Equipment-Tab für Consumables. Nach Nutzung: HP heilen, Charges abziehen, oder Item entfernen.

### Changes Required:

#### [ ] 1. Equipment-Tab erweitern

**File**: `src/components/character-sheet/tab-equipment.tsx`

Änderungen:

- Import `UseConsumableDialog`, `isConsumable`, `getConsumableType`, `canUseConsumable`
- State: `usingConsumableId: string | null`
- "Use"-Button neben Equip/Edit für Items wo `canUseConsumable(item) === true`
- Handler `handleUseConsumable(result)`:
  - **Potion**: `onHpChange(Math.min(hpMax, hpCurrent + result.hpHealed))` → Delete Item von `character_equipment`
  - **Scroll**: Delete Item von `character_equipment`
  - **Charged**: Update `magic_effects.current_charges -= result.chargesUsed` via Supabase. Wenn 0 → Item bleibt (depleted), Effects werden nicht mehr aggregiert (bestehende `isDepleted`-Logik)

#### [ ] 2. Props erweitern

`TabEquipmentProps` braucht `hpCurrent`, `hpMax`, `onHpChange` — prüfen ob diese bereits durchgereicht werden, oder ob sie von der Eltern-Seite ergänzt werden müssen.

#### [ ] 3. Toast-Feedback

Nach Nutzung: Toast-Nachricht ("Trank verbraucht! +6 HP", "Schriftrolle verbraucht!", "2 Charge(s) verbraucht")

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — keine Fehler
- [ ] `npm test` — alle Tests bestehen
- [ ] `npm run build` — Build erfolgreich

#### Manual Verification:

- [ ] Potion of Healing: "Use"-Button sichtbar, Dialog öffnet, HP-Wert eingeben, HP werden geheilt, Potion wird entfernt
- [ ] Wand of Magic Missiles: "Use"-Button sichtbar, Charges-Eingabe, Charges werden abgezogen, Item bleibt mit reduzierten Charges
- [ ] Ring of Protection: Kein "Use"-Button (nicht consumable)
- [ ] Depleted Wand (0 Charges): Kein "Use"-Button

---

## Testing Strategy

### Unit Tests:

- `consumables.test.ts`: isConsumable, getConsumableType, canUseConsumable für alle Kategorien
- `magic-effect-badges.test.ts`: Description-Fallback (bereits vorhanden)
- Edge Cases: Item ohne category, Item mit nur Charges ohne category, cursed Potions

### Manual Testing Steps:

1. Magic Item "Potion of Healing" an Charakter verteilen (GM Dashboard)
2. Equipment-Tab öffnen → "Use"-Button bei Potion sichtbar
3. Klick → Dialog mit HP-Input → Wert eingeben → Trinken
4. HP erhöht, Potion aus Equipment entfernt
5. Wand of Magic Missiles verteilen → Use → Charges abziehen → prüfen dass Charges korrekt aktualisiert
6. Scroll erstellen → Use → Bestätigen → Scroll entfernt
7. Ring/Amulet → kein "Use"-Button sichtbar

## Performance Considerations

Keine relevanten Performance-Implikationen — einzelne DB-Updates/Deletes bei Nutzung.

## Migration Notes

Keine DB-Migration nötig. `max_charges`, `current_charges`, `description` existieren bereits im `MagicEffects` JSONB. Die Kategorie-Erkennung basiert auf `custom_label` Parsing oder `magic_item_id` → `magic_items.category` Lookup.

## References

- Magic Items Typ: `src/lib/supabase/types.ts:144-199` (MagicEffects Interface)
- Magic Item Detection: `src/lib/rules/magic-items.ts:60-69` (isMagicItem, isDepleted)
- HP Change: `src/components/play-mode/play-hp-bar.tsx:55-70` (applyDamage/applyHeal)
- Equipment Tab Magic Items: `src/components/character-sheet/tab-equipment.tsx:799-843`
- MagicEffectBadges: `src/components/shared/magic-effect-badges.tsx`
