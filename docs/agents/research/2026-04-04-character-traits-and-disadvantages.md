---
date: "2026-04-04T10:58:58.315807+00:00"
git_commit: 288da8031fe5b0ce6f326c16409daa826c8228d3
branch: feat/epic-klinge-des-wassers
topic: "Character Traits and Disadvantages"
tags: [research, character-sheet, traits, disadvantages, player-option]
status: complete
---

# Research: Character Traits and Disadvantages

## Research Question

How to implement character Traits and Disadvantages (Player's Option: Skills & Powers) for the character system. Larry (new) has:

- **Trait:** Internal Compass — +1 bonus to Navigation proficiency checks, reduced chance of being lost by 5%
- **Disadvantage:** Colorblind — Character sees only in shades of grey

## Summary

There is **no existing concept** of traits or disadvantages anywhere in the codebase. The system has established patterns for displaying similar content (racial abilities, class abilities, kit abilities) in character sheet, print sheet, and DOCX export — all using the same `name + description` pattern with bilingual support. The simplest approach would be to store traits and disadvantages as JSONB arrays on the `characters` table (similar to `spell_slots_adj`), then display them using the existing abilities section pattern.

## Detailed Findings

### 1. No Existing Traits/Disadvantages System

Zero references to "trait", "disadvantage", "advantage", or "flaw" in:

- Database migrations
- TypeScript types
- Components
- i18n files

### 2. Established Display Patterns for Similar Content

**Abilities Section Pattern** (used for racial, class, kit abilities):

Each ability has: `{ name, name_en, description, description_en }`

**Print Sheet** (`print-sheet.tsx:505-575`):

```html
<section data-testid="print-section-abilities-list">
  <h2>Fähigkeiten / Abilities</h2>
  <div class="grid grid-cols-2">
    <!-- Racial Abilities -->
    <div>
      <h3>Rassenfähigkeiten (Race Name)</h3>
      <ul>
        <li><b>Name</b> — Description</li>
      </ul>
    </div>
    <!-- Class Abilities -->
    <!-- Kit Abilities -->
  </div>
</section>
```

**DOCX Export** (`docx-export.ts:668-800`):
Same pattern — section heading, then bulleted list with bold names and descriptions. Uses `localized()` for bilingual support.

**Play Mode Abilities Panel** (`play-mode/play-abilities-panel.tsx`):
Expandable cards with name, description, and optional uses-per-day tracker. Three sections: racial, class, granted powers.

### 3. Character Notes Field

**Type:** `CharacterRow.notes: string` — simple text field
**Display:** Dedicated "Notes" tab in character sheet with textarea
**Not suitable** for structured traits/disadvantages — no name/description separation

### 4. JSONB Field Patterns on Characters Table

Existing patterns for structured character data:

| Field                 | Type                     | Example                         |
| --------------------- | ------------------------ | ------------------------------- |
| `spell_slots_adj`     | `Record<string, number>` | `{"1": 2, "4": -1}`             |
| `allowed_spell_books` | `string[]`               | `["PHB", "ToM"]`                |
| `spell_whitelist`     | `string[]`               | `["fireball", "magic-missile"]` |

For traits/disadvantages, a JSONB array of objects would fit:

```typescript
traits: Array<{ name: string; name_en: string; description: string; description_en: string }>;
disadvantages: Array<{
  name: string;
  name_en: string;
  description: string;
  description_en: string;
}>;
```

### 5. Character Sheet Tab Structure

**Tabs** in `character-sheet.tsx`:

1. `stats` — Personal details, attributes, HP, classes
2. `combat` — Combat values, THAC0, saving throws
3. `notes` — Character notes textarea
4. `equipment` — Weapons, armor, inventory
5. `spells` — Spell management (conditional)
6. `thief-skills` — Thief skill percentages (conditional)
7. `proficiencies` — Weapon/NWP/language/fighting styles

Traits/disadvantages could go in the `notes` tab or the `stats` tab (personal details).

### 6. Print Config Section IDs

**File:** `src/lib/print-config.ts`

Current sections:

- personal, abilities, combat, saves, racialClassAbilities, thiefSkills, acBreakdown, weapons, equipment, generalInventory, spells, spellsMemorized, proficiencies, notes

Traits/disadvantages could be added to `racialClassAbilities` (expanding it to include traits) or as a new section ID.

### 7. Character Creation Wizard

**Steps:** basics → abilities → race → class → kit → priesthood → combat → summary

No existing traits/disadvantages step. These would typically be set during character creation (P.O: S&P), but since the app supports manual character entry, traits can be added post-creation in the manage view.

### 8. Larry (new)'s Data

Larry (new) is a Level 9 Fighter (Human, Chaotic Good). His specific traits/disadvantages from the PDF:

- **Trait:** Internal Compass — +1 bonus to Navigation proficiency checks, chance of being lost reduced by 5%
- **Disadvantage:** Colorblind — Character sees only in shades of grey

Both are pure display text — no mechanical effects need to be computed in the rules engine.

## Code References

- `src/lib/supabase/types.ts:1-75` — CharacterRow type (no traits/disadvantages fields)
- `src/components/character-sheet/character-sheet.tsx:983-1013` — Tab structure
- `src/components/character-sheet/character-sheet.tsx:1866-1877` — Notes tab (simple textarea)
- `src/components/print-sheet/print-sheet.tsx:505-575` — Abilities section rendering pattern
- `src/lib/utils/docx-export.ts:668-800` — DOCX abilities section
- `src/components/play-mode/play-abilities-panel.tsx` — Play mode abilities display
- `src/lib/print-config.ts:1-16` — Print section IDs
- `supabase/migrations/00037_spell_slot_adjustments.sql` — JSONB column pattern
- `supabase/migrations/00004_character_full_schema.sql:19` — Notes column definition

## Architecture Documentation

### Suggested Storage Pattern (based on existing codebase patterns)

```
characters table:
  traits     jsonb NOT NULL DEFAULT '[]'::jsonb
  disadvantages  jsonb NOT NULL DEFAULT '[]'::jsonb

TypeScript:
  traits: Array<{ name: string; name_en: string; description: string; description_en: string }>
  disadvantages: Array<{ name: string; name_en: string; description: string; description_en: string }>
```

### Display Integration Points

```
1. Character Sheet (manage view) → Notes tab or Stats tab
2. Print Sheet → Part of racialClassAbilities section or new section
3. DOCX Export → Same pattern as racial/class abilities
4. Play Mode → Optional display in abilities panel
```

## Open Questions

1. Should traits/disadvantages be editable in the manage view (like notes) or only set via migration/import?
2. Should they appear in a new tab, in the notes tab, or in the stats tab?
3. Should they get their own print section ID or be added to `racialClassAbilities`?
4. Do any traits have mechanical effects that need rules engine support (e.g., the +1 Navigation bonus)?
