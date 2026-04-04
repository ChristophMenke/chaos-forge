---
date: "2026-04-04T11:05:32.298505+00:00"
git_commit: 42b360523a8765a4d6b7c9cb5af1a2d4812398f3
branch: feat/shield-proficiency-and-traits
topic: "Shield Proficiency AC Bonus + Character Traits & Disadvantages"
tags: [plan, ac-calculation, shield, traits, disadvantages, equipment]
status: draft
---

# Shield Proficiency AC Bonus + Character Traits & Disadvantages

## Overview

Zwei Features auf einem Branch: (A) Shield Proficiency AC-Bonus implementieren (P.O: Skills & Powers Table 51) — aktuell gibt jeder Schild nur flat -1 AC, statt typspezifischer Proficiency-Boni. (B) Character Traits & Disadvantages als neue JSONB-Felder auf der Characters-Tabelle mit Editing-UI, Print- und DOCX-Ausgabe.

## Current State Analysis

### Shield Proficiency

- `calculateAC()` in `equipment.ts:53` gibt flat -1 für ANY Schild, unabhängig von Typ oder Proficiency
- **Kein Shield Proficiency Konzept** im gesamten Code
- `isShieldItem()` erkennt "Buckler" NICHT (enthält nicht "shield")
- `is_shield` DB-Spalte nur für "Schild" gesetzt, nicht für "Großer Schild" oder "Buckler"
- **Kein "Mittlerer Schild" (Medium Shield)** in der DB — muss angelegt werden
- Larry (new) hat Shield Proficiency für Medium Shield

### Traits & Disadvantages

- **Kein existierendes System** — keine DB-Spalten, keine Types, keine UI
- Etabliertes Pattern für ähnliche Daten: `{ name, name_en, description, description_en }` (racial/class/kit abilities)
- Notes-Tab hat nur ein einfaches Textarea

## Desired End State

### Shield Proficiency

- AC-Berechnung berücksichtigt Shield Proficiency: Buckler +1, Small +2, Medium +3, Body +3
- AC Breakdown zeigt Shield Proficiency als separate Zeile
- Larry (new) hat Medium Shield mit Shield Proficiency → -4 AC statt -1

### Traits & Disadvantages

- Characters-Tabelle hat `traits` und `disadvantages` JSONB-Spalten
- Notes-Tab zeigt Traits/Disadvantages als strukturierte Sections mit Add/Remove
- Print Sheet und DOCX zeigen Traits/Disadvantages im Abilities-Bereich
- Larry (new): Internal Compass + Colorblind eingetragen

### UI Mockups

**AC Breakdown mit Shield Proficiency (Play Mode):**

```
AC Breakdown:
  Basis-RK             10
  Kettenhemd           -5
  Schild               -1
  Schildkunde (Mittel) -3    ← NEU
  DEX Bonus            -2
  = RK                 -1
```

**Notes Tab mit Traits & Disadvantages:**

```
┌─ Traits ─────────────────────────────────────────┐
│ Innerer Kompass (3 CP)                    [✕]    │
│ +1 auf Navigation-Würfe, Verirrungschance -5%    │
│                                                   │
│ [+ Trait hinzufügen]                              │
├─ Nachteile ──────────────────────────────────────┤
│ Farbenblind (3 CP)                        [✕]    │
│ Charakter sieht nur in Graustufen                │
│                                                   │
│ [+ Nachteil hinzufügen]                          │
├─ Notizen ────────────────────────────────────────┤
│ [Freitext-Textarea wie bisher]                   │
└──────────────────────────────────────────────────┘
```

**Print Sheet — Traits & Disadvantages (im Abilities-Bereich):**

```
┌─ Fähigkeiten ────────────────────────────────────┐
│ Rassenfähigkeiten (Mensch)                       │
│ • Attack Bonus — +1 auf Trefferwürfe ...         │
│                                                   │
│ Klassenfähigkeiten (Kämpfer)                     │
│ • 1d12 HP — d12 Trefferwürfel                    │
│ • Mehrfach-Spezialisierung — ...                 │
│                                                   │
│ Traits                                    ← NEU  │
│ • Innerer Kompass — +1 Navigation, -5% Verirren  │
│                                                   │
│ Nachteile                                 ← NEU  │
│ • Farbenblind — Sieht nur in Graustufen          │
└──────────────────────────────────────────────────┘
```

### Key Discoveries:

- `calculateAC()` → `equipment.ts:35-77` — alle AC-Modifier zentralisiert
- `isShieldItem()` → `equipment.ts:83-86` — Buckler-Bug (kein "shield" im Namen)
- AC Breakdown wird an 3 Stellen gerendert: `play-combat-panel.tsx:97-150`, `print-sheet.tsx:636-666`, `docx-export.ts:808-848`
- `calculateAC()` wird an 6 Stellen aufgerufen (play-mode, character-sheet, tab-equipment, print-sheet, docx-export, tests)
- Print-Sheet Abilities Section: `print-sheet.tsx:505-575` — Muster für Traits/Disadvantages
- DOCX Abilities: `docx-export.ts:668-800` — gleiches `name + description` Pattern

## What We're NOT Doing

- **Keine "Anzahl Angreifer" Tracking** — das ist DM-managed
- **Keine mechanischen Effekte** für Traits/Disadvantages in der Rules Engine
- **Kein Traits/Disadvantages-Step im Character Wizard** — Eingabe nur im Manage-View
- **Kein Body Shield +4 vs. Missiles** — vereinfacht auf flat +3 (wie Medium Shield)
- **Keine Shield Proficiency Slot-Kosten-Berechnung** — rein informativ

## Implementation Approach

1. DB-Migration für alle neuen Daten
2. Rules Engine für Shield Proficiency (neue Funktion + `calculateAC()` erweitern)
3. i18n Keys
4. Shield Proficiency in AC Breakdown (3 Stellen)
5. Traits & Disadvantages UI (Notes Tab + Print + DOCX)
6. Tests, Format, Build

## Architecture and Code Reuse

**Shield Proficiency — neuer Helper:**

```typescript
// In equipment.ts
export function getShieldProficiencyBonus(
  shieldName: string,
  weaponProficiencies: { weapon_name: string; specialization: boolean }[]
): number;
```

Mapping: Schild-Name → Proficiency-Bonus:

- Buckler → 1
- Schild/Shield/Small Shield → 2
- Mittlerer Schild/Medium Shield → 3
- Großer Schild/Large Shield/Body Shield → 3

**Traits & Disadvantages — JSONB Pattern:**

```typescript
// In types.ts — CharacterRow erweitern
traits: Array<{
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  cost: number;
}>;
disadvantages: Array<{
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  cost: number;
}>;
```

**Betroffene Dateien:**

```
src/lib/rules/equipment.ts                         # calculateAC(), isShieldItem(), getShieldProficiencyBonus()
src/lib/rules/equipment.test.ts                     # Tests für neue Funktion
src/lib/supabase/types.ts                           # CharacterRow + TraitEntry type
src/components/play-mode/play-mode.tsx              # shieldProficiencyBonus an calculateAC() + combat-panel
src/components/play-mode/play-combat-panel.tsx       # AC Breakdown Zeile
src/components/print-sheet/print-sheet.tsx           # AC Breakdown + Traits/Disadvantages Section
src/lib/utils/docx-export.ts                        # AC Breakdown + Traits/Disadvantages Section
src/components/character-sheet/character-sheet.tsx   # Notes Tab mit Traits/Disadvantages UI + calculateAC()
src/components/character-sheet/tab-equipment.tsx     # calculateAC() Aufruf
messages/de.json, messages/en.json                  # i18n Keys
supabase/migrations/00167_shield_proficiency_and_traits.sql  # Migration
```

---

## Phase 1: DB-Migration

### Overview

Medium Shield anlegen, is_shield für alle Schildtypen setzen, traits/disadvantages Spalten, Larry's Daten seeden.

### Changes Required:

#### [x] 1. Migration

**File**: `supabase/migrations/00167_shield_proficiency_and_traits.sql`
**Changes**:

```sql
-- 1. Neuer Schildtyp: Mittlerer Schild (Medium Shield)
INSERT INTO public.armor (name, name_en, ac, weight, cost_gp, max_movement, source_book, is_shield)
VALUES ('Mittlerer Schild', 'Medium Shield', 8, 7.5, 12.0, 12, 'PHB', true)
ON CONFLICT DO NOTHING;

-- 2. is_shield für alle Schildtypen setzen
UPDATE public.armor SET is_shield = true
WHERE lower(name) IN ('buckler', 'großer schild', 'mittlerer schild')
   OR lower(name_en) IN ('buckler', 'large shield', 'medium shield');

-- 3. Traits + Disadvantages Spalten
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS traits jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS disadvantages jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 4. Larry (new): Medium Shield als Equipment
INSERT INTO public.character_equipment (character_id, armor_id, quantity, equipped, hit_bonus, damage_bonus)
SELECT c.id, a.id, 1, true, 0, 0
FROM public.characters c, public.armor a
WHERE c.name = 'Larry (new)' AND a.name = 'Mittlerer Schild'
AND NOT EXISTS (
  SELECT 1 FROM public.character_equipment ce
  JOIN public.armor ar ON ar.id = ce.armor_id
  WHERE ce.character_id = c.id AND ar.name = 'Mittlerer Schild'
)
LIMIT 1;

-- 5. Larry (new): Shield Proficiency für Mittlerer Schild
INSERT INTO public.character_weapon_proficiencies (character_id, weapon_name, specialization)
SELECT c.id, 'Mittlerer Schild', false
FROM public.characters c WHERE c.name = 'Larry (new)'
AND NOT EXISTS (
  SELECT 1 FROM public.character_weapon_proficiencies cwp
  WHERE cwp.character_id = c.id AND cwp.weapon_name = 'Mittlerer Schild'
)
LIMIT 1;

-- 6. Larry (new): Traits + Disadvantages seeden
UPDATE public.characters SET
  traits = '[
    {
      "name": "Innerer Kompass",
      "name_en": "Internal Compass",
      "description": "+1 auf Navigation-Fertigkeitswürfe. Die Chance, sich zu verirren, ist um 5% reduziert.",
      "description_en": "+1 bonus to Navigation proficiency checks, and the chance of being lost is reduced by 5%.",
      "cost": 3
    }
  ]'::jsonb,
  disadvantages = '[
    {
      "name": "Farbenblind",
      "name_en": "Colorblind",
      "description": "Der Charakter sieht nur in Graustufen.",
      "description_en": "Character sees only in shades of grey.",
      "cost": 3
    }
  ]'::jsonb
WHERE name = 'Larry (new)';
```

### Success Criteria:

#### Automated Verification:

- [ ] Migration läuft fehlerfrei: `supabase db push`

---

## Phase 2: Rules Engine — Shield Proficiency

### Overview

`isShieldItem()` fixen, `getShieldProficiencyBonus()` hinzufügen, `calculateAC()` erweitern.

### Changes Required:

#### [x] 1. Fix isShieldItem() + neuer Helper

**File**: `src/lib/rules/equipment.ts`
**Changes**:

```typescript
// isShieldItem() — Buckler ergänzen
export function isShieldItem(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower === "schild" ||
    lower === "shield" ||
    lower === "buckler" ||
    lower.includes("shield") ||
    lower.includes("schild")
  );
}

// Neuer Helper: Shield Proficiency AC Bonus
// P.O: Skills & Powers Table 51
const SHIELD_PROF_BONUS: Record<string, number> = {
  buckler: 1,
  schild: 2,
  shield: 2,
  "small shield": 2,
  "mittlerer schild": 3,
  "medium shield": 3,
  "großer schild": 3,
  "large shield": 3,
  "body shield": 3,
};

export function getShieldProficiencyBonus(
  shieldName: string | null,
  weaponProficiencies: { weapon_name: string }[]
): number {
  if (!shieldName) return 0;
  const lower = shieldName.toLowerCase();
  const isProficient = weaponProficiencies.some((wp) => wp.weapon_name.toLowerCase() === lower);
  if (!isProficient) return 0;
  return SHIELD_PROF_BONUS[lower] ?? 0;
}
```

#### [x] 2. calculateAC() erweitern

**File**: `src/lib/rules/equipment.ts`
**Changes**: Neuer Parameter `shieldProficiencyBonus` in `ACCalculationInput`

```typescript
// ACCalculationInput erweitern:
shieldProficiencyBonus?: number;

// In calculateAC():
return baseAC + shieldBonus + dexDefenseAdj + magicACModifier
  + unarmoredBonus - epicAcBonus - effectiveSWSBonus
  - (shieldEquipped ? (input.shieldProficiencyBonus ?? 0) : 0);
```

#### [x] 3. CharacterRow erweitern

**File**: `src/lib/supabase/types.ts`
**Changes**: `traits` und `disadvantages` Felder hinzufügen

```typescript
export interface TraitEntry {
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  cost: number;
}

// In CharacterRow:
traits: TraitEntry[];
disadvantages: TraitEntry[];
```

#### [x] 4. Unit Tests

**File**: `src/lib/rules/equipment.test.ts`
**Changes**:

- `isShieldItem()` erkennt "Buckler", "Großer Schild", "Mittlerer Schild"
- `getShieldProficiencyBonus()` gibt korrekten Bonus für jeden Schildtyp
- `getShieldProficiencyBonus()` gibt 0 ohne Proficiency
- `calculateAC()` berücksichtigt `shieldProficiencyBonus`
- `shieldProficiencyBonus` wird ignoriert wenn kein Schild equipped

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — keine Fehler
- [ ] `npx vitest run src/lib/rules/equipment.test.ts` — alle Tests grün

---

## Phase 3: i18n Keys

### Overview

Alle neuen Übersetzungs-Keys für Shield Proficiency und Traits/Disadvantages.

### Changes Required:

#### [ ] 1. Deutsche Übersetzungen

**File**: `messages/de.json`

```json
// playMode + print namespace:
"shieldProficiency": "Schildkunde ({shield})",

// sheet namespace (Notes tab):
"traits": "Traits",
"disadvantages": "Nachteile",
"addTrait": "Trait hinzufügen",
"addDisadvantage": "Nachteil hinzufügen",
"traitName": "Name",
"traitNameEn": "Name (EN)",
"traitDescription": "Beschreibung",
"traitDescriptionEn": "Beschreibung (EN)",
"traitCost": "CP-Kosten",
"noTraits": "Keine Traits vorhanden.",
"noDisadvantages": "Keine Nachteile vorhanden.",
"cpCost": "{cost} CP"
```

#### [ ] 2. Englische Übersetzungen

**File**: `messages/en.json`

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — keine Fehler

---

## Phase 4: Shield Proficiency UI — AC Breakdown

### Overview

Shield Proficiency Bonus als neue Zeile in AC Breakdown anzeigen (Play Mode, Print Sheet, DOCX).

### Changes Required:

#### [ ] 1. Play Mode — shieldProficiencyBonus berechnen und übergeben

**File**: `src/components/play-mode/play-mode.tsx`
**Changes**:

- Import `getShieldProficiencyBonus`
- Equipped Shield Name ermitteln
- Bonus berechnen und an `calculateAC()` + `PlayCombatPanel` übergeben

#### [ ] 2. Play Mode — AC Breakdown Zeile

**File**: `src/components/play-mode/play-combat-panel.tsx`
**Changes**:

- Neuer Prop `shieldProficiencyBonus?: number` + `equippedShieldName?: string`
- Neue Zeile im AC Breakdown nach "Schild -1":
  ```
  Schildkunde (Mittlerer Schild)  -3
  ```

#### [ ] 3. Character Sheet — calculateAC() Aufruf

**File**: `src/components/character-sheet/character-sheet.tsx`
**Changes**: `shieldProficiencyBonus` an `calculateAC()` übergeben

#### [ ] 4. Tab Equipment — calculateAC() Aufruf

**File**: `src/components/character-sheet/tab-equipment.tsx`
**Changes**: `shieldProficiencyBonus` an `calculateAC()` übergeben

#### [ ] 5. Print Sheet — AC Breakdown Zeile

**File**: `src/components/print-sheet/print-sheet.tsx`
**Changes**: Shield Proficiency Bonus Zeile im AC Breakdown

#### [ ] 6. DOCX Export — AC Breakdown Zeile

**File**: `src/lib/utils/docx-export.ts`
**Changes**: Shield Proficiency Bonus Zeile im AC Breakdown

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — keine Fehler
- [ ] `npx vitest run` — alle Tests grün

#### Manual Verification:

- [ ] Larry (new) Play Mode: AC Breakdown zeigt "Schildkunde (Mittlerer Schild) -3"
- [ ] Larry (new) Print Sheet: AC Breakdown enthält Shield Proficiency Zeile
- [ ] Gesamter AC korrekt berechnet

---

## Phase 5: Traits & Disadvantages UI

### Overview

Traits/Disadvantages im Notes-Tab anzeigen und editieren, im Print Sheet und DOCX ausgeben.

### Changes Required:

#### [ ] 1. Notes Tab — Traits & Disadvantages Sections

**File**: `src/components/character-sheet/character-sheet.tsx`
**Changes**:

- Über dem Notes-Textarea: Traits-Section und Disadvantages-Section
- Jeder Eintrag: Name + Cost-Badge + Beschreibung + Delete-Button (✕)
- "Hinzufügen" Button öffnet Inline-Formular (Name, Name EN, Beschreibung, Beschreibung EN, CP-Kosten)
- Speichern via `update("traits", [...])` / `update("disadvantages", [...])`

#### [ ] 2. Print Sheet — Traits & Disadvantages im Abilities-Bereich

**File**: `src/components/print-sheet/print-sheet.tsx`
**Changes**:

- In `racialClassAbilities()` Section: nach Kit Abilities
- Traits als eigene Subsection: "Traits" mit `{ name — description }` Pattern
- Disadvantages als eigene Subsection: "Nachteile / Disadvantages"

#### [ ] 3. DOCX Export — Traits & Disadvantages

**File**: `src/lib/utils/docx-export.ts`
**Changes**:

- In `racialClassAbilities()` Funktion: nach Kit Abilities
- Gleiche bulleted-list Pattern wie racial/class/kit abilities

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — keine Fehler
- [ ] `npx vitest run` — alle Tests grün

#### Manual Verification:

- [ ] Larry (new) Notes Tab: "Internal Compass" Trait und "Colorblind" Disadvantage sichtbar
- [ ] Trait/Disadvantage hinzufügen und löschen funktioniert
- [ ] Print Sheet: Traits und Disadvantages im Abilities-Bereich
- [ ] DOCX Export enthält Traits und Disadvantages

---

## Phase 6: Cleanup & Verifizierung

### Overview

Tests, Format, Lint, Build.

### Changes Required:

#### [ ] 1. Alle Tests laufen lassen

#### [ ] 2. Format prüfen

#### [ ] 3. Build prüfen

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — keine Fehler
- [ ] `npx vitest run` — alle Tests grün
- [ ] `npm run lint` — keine Fehler
- [ ] `npm run format:check` — keine Fehler
- [ ] `npm run build` — erfolgreich

---

## Testing Strategy

### Unit Tests:

- `isShieldItem()`: "Buckler" → true, "Mittlerer Schild" → true, "Kettenhemd" → false
- `getShieldProficiencyBonus()`: Buckler → 1, Schild → 2, Mittlerer Schild → 3, Großer Schild → 3
- `getShieldProficiencyBonus()` ohne Proficiency → 0
- `calculateAC()` mit `shieldProficiencyBonus: 3` → korrekte Reduktion
- `calculateAC()` mit `shieldProficiencyBonus` aber ohne Schild → ignoriert

### Manual Testing Steps:

1. Larry (new) → Play Mode: AC Breakdown mit Schildkunde-Bonus
2. Larry (new) → Manage → Notes: Traits/Disadvantages sichtbar und editierbar
3. Neuen Trait hinzufügen, Seite neuladen → persistiert
4. Trait löschen → verschwindet
5. Print-Ansicht: Traits + Disadvantages + Shield Proficiency korrekt

## Migration Notes

- Migration 00167 via `supabase db push`
- "Mittlerer Schild" wird als neuer Armor-Eintrag angelegt
- `is_shield` für alle Schildtypen korrigiert
- Larry (new) bekommt Medium Shield + Proficiency + Traits/Disadvantages

## References

- Research: `docs/agents/research/2026-04-04-shield-proficiency-and-ac-rules.md`
- Research: `docs/agents/research/2026-04-04-character-traits-and-disadvantages.md`
- AC Calculation: `src/lib/rules/equipment.ts`
- Abilities Pattern: `src/components/print-sheet/print-sheet.tsx:505-575`
- DOCX Pattern: `src/lib/utils/docx-export.ts:668-800`
