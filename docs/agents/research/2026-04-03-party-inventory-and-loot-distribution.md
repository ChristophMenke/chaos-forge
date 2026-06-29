---
date: "2026-04-03T20:32:51.444646+00:00"
git_commit: fc5f05e72d854046ef210c5caaf16e88f03e7ab0
branch: feat/xp-emoji-party-inventory
topic: "Party Inventory & Loot Distribution"
tags: [research, codebase, party, inventory, loot, gold, supabase]
status: complete
---

# Research: Party Inventory & Loot Distribution

## Research Question

Research the codebase for everything needed to implement a Party Inventory & Loot Distribution feature. Covers: existing party concepts, character equipment/inventory structure, DB schema patterns, navigation, gold system, RLS policies, i18n patterns, and Supabase types.

## Summary

There is **no existing party concept** in the codebase — no shared inventory, party table, or loot distribution mechanism. Characters have individual gold (5 denominations) and individual inventory (general items + equipment). The closest analog is the **sessions/chronicle system** which is a shared, all-authenticated-users page. The gold system uses a `CoinPurse` type with PP/GP/EP/SP/CP and has payment/receive logic already implemented per character.

## Detailed Findings

### 1. No Existing Party Concept

There are no tables, components, or pages related to "party" as a shared entity. Each character has:

- Individual gold (5 coin types on `characters` table)
- Individual inventory (`character_inventory` table with `general_items` FK)
- Individual equipment (`character_equipment` table with `weapons`/`armor` FKs)

The **dashboard** (`src/app/dashboard/page.tsx`) shows a "Party Composition" widget but this is derived from aggregating individual characters — there is no party entity.

### 2. Character Equipment & Inventory System

**DB Tables:**

| Table                 | File                              | Purpose                       |
| --------------------- | --------------------------------- | ----------------------------- |
| `character_equipment` | `00004_character_full_schema.sql` | Weapons + armor per character |
| `character_inventory` | `00017_inventory.sql`             | General items per character   |
| `general_items`       | `00017_inventory.sql`             | Catalog of general items      |

**`character_inventory` schema** (`00017_inventory.sql`):

```sql
create table public.character_inventory (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references public.characters(id) on delete cascade not null,
  item_id uuid references public.general_items(id) on delete set null,
  custom_name text,
  quantity integer not null default 1,
  notes text not null default ''
);
```

**`general_items` schema** (`00017_inventory.sql`):

```sql
create table public.general_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  weight numeric(5,1) not null default 0,
  cost_gp numeric(8,2) not null default 0,
  category text not null default 'general',
  is_custom boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null
);
```

**TypeScript types** (`src/lib/supabase/types.ts:307-330`):

- `GeneralItemRow` — id, name, name_en, weight, cost_gp, category, source_book, is_custom, created_by
- `CharacterInventoryRow` — id, character_id, item_id, custom_name, quantity, notes
- `CharacterInventoryWithDetails` — extends with joined `item: GeneralItemRow | null`

**UI Components:**

- **Manage mode**: `tab-equipment.tsx:1725-1873` — General inventory section with add/remove/quantity-change
- **Play mode**: `play-inventory-panel.tsx` — Simplified inventory with quick-add (name + qty), ± buttons, weight/encumbrance display

### 3. Gold / Currency System

**DB columns** on `characters` table (`00009_character_fields.sql`):

```sql
gold_pp integer not null default 0,
gold_gp integer not null default 0,
gold_ep integer not null default 0,
gold_sp integer not null default 0,
gold_cp integer not null default 0
```

**Rules engine** (`src/lib/rules/equipment.ts:146-210`):

- `CoinPurse` interface: `{ pp, gp, ep, sp, cp }`
- `COIN_VALUES_IN_CP`: PP=500, GP=100, EP=50, SP=10, CP=1
- `purseTotalInCP(purse)` — convert purse to total CP
- `calculatePayment(purse, costInCP)` — deduct cost from purse, largest coins first
- `PaymentResult`: `{ success, remaining: CoinPurse, shortfall }`

**UI** (`src/components/play-mode/play-coin-purse-panel.tsx`):

- 5-column grid showing PP/GP/EP/SP/CP values
- Total in GP display
- Pay button → `PayDialog` component (handles coin deduction)
- Receive button → inline dialog with 5 number inputs

### 4. Dashboard Page (Reference for Shared Pages)

**File**: `src/app/dashboard/page.tsx` — Server Component

**Pattern:**

1. `requireAuth()` for user identification
2. Parallel queries via `Promise.all([...supabase queries...])`
3. Dependent queries in second wave (need IDs from first)
4. Renders `GlassCard` widgets in responsive grid (`lg:grid-cols-2`)
5. Uses `getTranslations("dashboard")` for i18n
6. `data-testid` on every meaningful element

### 5. Sessions Page (Reference for New Pages)

**File**: `src/app/sessions/page.tsx` — Server Component

**Pattern:**

- Same fetch pattern as dashboard: parallel queries → dependent queries
- Header with title + "Create New" button
- Grid of `GlassCard` items with hover effect
- Empty state with CTA button
- Tags displayed as colored badges

### 6. Supabase Migration Numbering

**Latest migration**: `00160_add_last_accessed_at.sql`
**Next available**: `00161`
**Total migrations**: 160 files

### 7. Navigation Structure

**File**: `src/lib/navigation.ts`

Current nav items:

| Label Key  | Path                 | Icon            |
| ---------- | -------------------- | --------------- |
| dashboard  | `/dashboard`         | LayoutDashboard |
| characters | `/characters`        | Users           |
| sessions   | `/sessions`          | ScrollText      |
| import     | `/characters/import` | FileUp          |
| rulebook   | `/chat`              | BookOpen        |

**Desktop**: `app-sidebar.tsx` — fixed left sidebar with icons + labels on XL
**Mobile**: `app-nav.tsx` — bottom bar with icons + labels, "More" menu for settings

### 8. RLS Policy Patterns

Five patterns used across the codebase:

**Pattern A — Owner-only** (`00004_character_full_schema.sql`):

```sql
-- All CRUD via character ownership
using (character_id in (select id from characters where user_id = auth.uid()))
```

**Pattern B — Authenticated read-all, owner-write** (`00113_rls_shared_character_data.sql`):

```sql
-- SELECT: any authenticated user
CREATE POLICY "Authenticated can view" ON table FOR SELECT TO authenticated USING (true);
-- INSERT/UPDATE/DELETE: owner only
```

**Pattern C — Owner + shared access** (`00114_rls_epic_items_shared_only.sql`):

```sql
-- SELECT: owner OR explicitly shared via character_shares
```

**Pattern D — Custom item creation** (`00038_custom_item_insert_policies.sql`):

```sql
WITH CHECK (is_custom = true AND created_by = auth.uid())
```

**Pattern E — Creator-only delete** (`00040_chronicle_quotes.sql`):

```sql
-- SELECT/INSERT: all authenticated
-- DELETE: only own records (auth.uid() = user_id)
```

**Best fit for party inventory**: Pattern B (all authenticated can read) + Pattern E (creator tracking for audit trail)

### 9. I18N Patterns

**Files**: `messages/de.json`, `messages/en.json`

**Structure**: Flat JSON with top-level page keys, camelCase message keys.

Existing top-level keys: `common`, `landing`, `login`, `nav`, `notFound`, `characters`, `wizard`, `sheet`, `equipment`, `spells`, `proficiencies`, `sessions`, `tagTypes`, `dashboard`, `import`, `print`, `chronicle`, `theme`, `alignment`, `abilityNames`, `classGroups`, `nwpGroups`, `confirm`, `avatar`, `sharing`, `spellbook`, `playMode`

**Pattern for new pages**: Add a new top-level key (e.g. `"party"`) with camelCase message entries. Use `{placeholder}` syntax for dynamic values. Access via `getTranslations("party")` (server) or `useTranslations("party")` (client).

### 10. Supabase Types

**File**: `src/lib/supabase/types.ts`

All DB row types are defined here as TypeScript interfaces. Pattern:

- `FooRow` — mirrors DB columns
- `FooWithDetails` — extends with joined relations
- Manual type definitions (not auto-generated from Supabase)

Key types for reference:

- `CharacterRow` (lines 3-75) — 60+ fields including gold_pp through gold_cp
- `CharacterInventoryRow` (lines 319-326) — character_id, item_id, custom_name, quantity, notes
- `GeneralItemRow` (lines 307-317) — name, name_en, weight, cost_gp, category
- `SessionRow` (lines 262-270) — id, title, session_date, summary, created_by
- `QuoteReactionRow` (lines 373-379) — quote_id, user_id, emoji (audit trail pattern)
- `AppUser` (lines 348-352) — id, email, display_name

## Code References

- `src/lib/supabase/types.ts:307-330` — GeneralItemRow, CharacterInventoryRow, CharacterInventoryWithDetails
- `src/lib/supabase/types.ts:3-75` — CharacterRow with gold fields
- `src/lib/rules/equipment.ts:146-210` — CoinPurse, purseTotalInCP, calculatePayment
- `src/components/play-mode/play-coin-purse-panel.tsx` — Gold UI with pay/receive
- `src/components/play-mode/play-inventory-panel.tsx` — Play mode inventory panel
- `src/components/character-sheet/tab-equipment.tsx:1725-1873` — Manage mode inventory section
- `src/app/dashboard/page.tsx` — Reference shared page (server component, parallel queries)
- `src/app/sessions/page.tsx` — Reference shared page with CRUD
- `src/lib/navigation.ts` — Navigation items definition
- `src/components/app-sidebar.tsx` — Desktop sidebar
- `src/components/app-nav.tsx` — Mobile bottom nav
- `src/lib/supabase/auth.ts:22-41` — requireAuth() function
- `supabase/migrations/00160_add_last_accessed_at.sql` — Latest migration
- `supabase/migrations/00017_inventory.sql` — character_inventory + general_items tables
- `supabase/migrations/00040_chronicle_quotes.sql` — quote_reactions pattern (audit trail reference)

## Architecture Documentation

### Data Flow Pattern (Server Components)

1. `requireAuth()` — get current user
2. `createClient()` — get Supabase server client
3. `Promise.all([...])` — parallel data fetching
4. Optional second wave for dependent data
5. Render with `GlassCard` grid layout

### Component Patterns

- Server Components for pages (data fetching)
- Client Components for interactivity (`"use client"`)
- `GlassCard` as standard container with optional `glow` and `hover`
- `data-testid` on all interactive/meaningful elements
- Responsive: mobile cards → desktop grid/table

### DB Patterns

- UUID primary keys via `gen_random_uuid()`
- Cascade deletes on parent references
- `created_at` / `updated_at` timestamps
- `user_id` or `created_by` for ownership tracking
- Bilingual names: `name` (DE) + `name_en` (EN)

## Open Questions

1. **Party scope**: Should the party inventory be global (one shared pool) or session-scoped (per adventure)?
2. **Access control**: Should any authenticated user be able to add/remove items, or only a "DM" role?
3. **Item catalog**: Should party items use the existing `general_items` table or have their own item definitions?
4. **Gold tracking**: Should the party have its own gold pool separate from character gold, or transfer between them?
5. **Distribution**: When distributing loot to characters, should the system auto-update character inventories, or just record the distribution as an audit entry?
