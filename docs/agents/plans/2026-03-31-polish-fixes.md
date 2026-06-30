---
date: 2026-03-31T18:51:28.023275+00:00
git_commit: e92dbcbf0437c3e3bfe5239620090de1db04cc3c
branch: main
topic: "Polish Fixes — Magic Effects, Rasten-Reset, Shield, handleSave"
tags: [plan, refactoring, magic-items, play-mode, shield]
status: draft
---

# Polish Fixes Implementation Plan

## Overview

4 Fixes/Refactorings: Magic Item Effekte anwenden, Fähigkeiten-Reset bei Rasten, Shield DB-Spalte, handleSave Spread-Pattern.

## What We're NOT Doing

- Keine neuen Features, nur Fixes und Refactoring
- Keine UI-Änderungen (außer dass Magic Item Effekte sichtbar werden)

---

## Phase 1: handleSave Spread-Pattern (Refactoring, Grundlage)

### Overview

handleSave() von 40+ expliziter Felder auf Spread-with-Exclude umstellen. Das verhindert künftige "vergessene Felder" Bugs.

### Changes Required:

#### [x] 1. handleSave refactoren

**File**: `src/components/character-sheet/character-sheet.tsx:383-432`
**Changes**: Explizite Feldliste → Spread mit Excludes

```typescript
const { id, user_id, created_at, updated_at, avatar_url, ...updatableFields } = character;
const { error: charError } = await supabase
  .from("characters")
  .update(updatableFields)
  .eq("id", character.id);
```

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit`
- [ ] `npx vitest run`
- [ ] `npm run format`

---

## Phase 2: Magic Item Effekte anwenden

### Overview

Equipped Magic Items mit `magic_effects` beeinflussen effektive Attribute im Play Mode.

### Changes Required:

#### [x] 2. getMagicItemEffects Utility

**File**: `src/lib/rules/equipment.ts` (oder neues Utility)
**Changes**: Funktion die alle equipped Magic Items durchgeht und ihre Effekte kombiniert

```typescript
function getMagicItemEffects(equipment: CharacterEquipmentWithDetails[]): MagicEffects {
  // Nur equipped items mit magic_effects
  // Stat-Overrides: höchster Wert gewinnt (wie bei Epic Items)
  // ac_bonus, hide_in_shadows, move_silently: summieren
}
```

#### [x] 3. Play Mode: Magic Effects in effektive Stats einbeziehen

**File**: `src/components/play-mode/play-mode.tsx:201-207`
**Changes**: Nach Epic-Overrides auch Magic Item Effects anwenden

```typescript
// Aktuell: effectiveStr = eo.str ?? character.str
// Neu: effectiveStr = eo.str ?? magicEffects.str ?? character.str
```

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit`
- [ ] `npx vitest run`
- [ ] `npm run format`

---

## Phase 3: Rasten setzt Fähigkeiten-Zähler zurück

### Overview

PlayAbilitiesPanel bekommt einen Reset-Mechanismus der beim Rasten ausgelöst wird.

### Changes Required:

#### [x] 4. PlayAbilitiesPanel: Reset via Key-Prop

**File**: `src/components/play-mode/play-abilities-panel.tsx`
**Changes**: `restCounter` Prop hinzufügen — wenn sich der Counter ändert, wird `usedAbilities` zurückgesetzt (via useEffect)

#### [x] 5. Play Mode: restCounter durchreichen

**File**: `src/components/play-mode/play-mode.tsx`
**Changes**: Neuer State `restCounter` der bei handleRest() inkrementiert wird + als Prop an PlayAbilitiesPanel übergeben

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit`
- [ ] `npx vitest run`
- [ ] `npm run format`

---

## Phase 4: Shield DB-Spalte

### Overview

`is_shield` Boolean auf armor-Tabelle, Migration + Code-Bereinigung an 4 Stellen.

### Changes Required:

#### [x] 6. Migration: is_shield Spalte

**File**: `supabase/migrations/00074_armor_is_shield.sql`
**Changes**: `ALTER TABLE + UPDATE` für bestehende Schild-Einträge

```sql
ALTER TABLE public.armor ADD COLUMN is_shield boolean NOT NULL DEFAULT false;
UPDATE public.armor SET is_shield = true
  WHERE lower(name) IN ('schild', 'shield')
     OR lower(name_en) IN ('shield');
```

#### [x] 7. ArmorRow Type erweitern

**File**: `src/lib/supabase/types.ts`
**Changes**: `is_shield: boolean` zum ArmorRow Interface

#### [x] 8. Shield-Detection an 4 Stellen ersetzen

**Files**: `tab-equipment.tsx`, `play-mode.tsx`, `print-sheet.tsx`, `docx-export.ts`
**Changes**: `name.toLowerCase() === "schild"` → `armor.is_shield`

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit`
- [ ] `npx vitest run`
- [ ] `npm run format`

---

## Roadmap aus CLAUDE.md bereinigen

#### [x] 9. CLAUDE.md Roadmap-Abschnitt aktualisieren

Roadmap-Punkt 11 ("Nächste Schritte — DM-Dashboard, Kampagnen-Verwaltung, weitere Kits und Rassen") entfernen wie vom User gewünscht.
