# Research: Master of Chaos -- GM Interface

**Date:** 2026-04-04
**Branch:** content/spell-descriptions-phb
**Commit:** ac2641021318019a30d443964bca639e7185fe1a
**Repository:** chaos-forge
**Status:** Complete

---

## 1. Auth & Middleware

### Current Auth Flow

The auth system uses Supabase Auth with cookie-based sessions:

- **`src/middleware.ts`** -- Minimal middleware that calls `updateSession()` on every request. Matcher excludes static files, images, and favicon.
- **`src/lib/supabase/middleware.ts`** -- Creates a Supabase server client with cookie handling, calls `supabase.auth.getUser()` to refresh the auth token on every request.
- **`src/lib/supabase/server.ts`** -- Server-side client factory using `createServerClient` from `@supabase/ssr`. Cookie-based, used in Server Components.
- **`src/lib/supabase/client.ts`** -- Browser-side client factory using `createBrowserClient`. Checks `isSupabaseConfigured()` before creating.
- **`src/lib/supabase/auth.ts`** -- Contains `requireAuth()` and `getOptionalUser()`:
  - `requireAuth()` redirects to `/login` if no user. In dev mode without Supabase config, returns a `DEV_USER` stub.
  - `getOptionalUser()` returns null instead of redirecting.

### Protected Routes

There is **no middleware-level route protection**. The middleware only refreshes the session. Route protection is done at the **page level** -- each Server Component page calls `requireAuth()` which redirects to `/login` if unauthenticated.

### Key Finding: No Role System

There is **no role or permission system** in the codebase. The `profiles` table has: `id`, `display_name`, `avatar_url`, `email`, `created_at`, `updated_at`. There is no `role`, `is_gm`, or `is_admin` column. All authenticated users have equal permissions, with ownership-based access control via RLS.

### Character Visibility Model

Characters use a three-tier visibility model (migration `00025_character_visibility.sql`):

1. **Owner** -- `user_id = auth.uid()` (full CRUD)
2. **Public** -- `is_public = true` (read-only for all authenticated users)
3. **Shared** -- Via `character_shares` table (read-only for specific users)

The RLS policy on characters combines all three: `auth.uid() = user_id OR is_public = true OR EXISTS(character_shares...)`.

---

## 2. Supabase Realtime

**Supabase Realtime is NOT used anywhere in the codebase.** A search for `realtime`, `subscribe`, `on('postgres_changes'`, and `.channel(` found zero hits in the `src/` directory. The only `subscribe` usage is in `useSyncExternalStore` calls for locale/theme/print-preferences (React external store subscriptions, not Supabase).

All data is fetched on page load via Server Components or via client-side Supabase queries. There is no live/push-based data synchronization.

---

## 3. Character Data Fetching

### Pattern: Two-Wave Server-Side Fetching

Both the **manage** and **play** pages use the same pattern:

**Wave 1:** Fetch the character row, guard with `notFound()`:

```typescript
const { data: character } = await supabase
  .from("characters")
  .select("*")
  .eq("id", id)
  .single<CharacterRow>();
if (!character) notFound();
```

**Wave 2:** Parallel fetch all related data via `Promise.all([...])`.

### Play Page (`src/app/characters/[id]/play/page.tsx`) fetches:

- `character_classes` (CharacterClassRow[])
- `character_equipment` with joins: `*, weapon:weapons(*), armor:armor(*)`
- `character_spells` with join: `*, spell:spells(*)`
- `character_weapon_proficiencies`
- `character_nonweapon_proficiencies` with join: `*, proficiency:nonweapon_proficiencies(*)`
- `character_inventory` with join: `*, item:general_items(*)`
- `epic_items`
- `character_fighting_styles`

**Wave 3** (conditional): If character has a priest class, fetches available priest spells.

### Manage Page (`src/app/characters/[id]/manage/page.tsx`) fetches all of the above plus:

- `xp_history`
- `sessions`
- `character_languages`
- All catalog data: `weapons`, `armor`, `nonweapon_proficiencies`, `general_items`

### CharacterRow Type

Defined in `src/lib/supabase/types.ts`. Key fields:

- **Identity:** `id`, `user_id`, `name`, `avatar_url`, `player_name`
- **Core stats:** `str`, `dex`, `con`, `int`, `wis`, `cha` (plus `str_exceptional`, and 12 sub-stat fields)
- **HP:** `hp_current`, `hp_max`
- **Combat:** Derived from class/level, not stored directly
- **Gold:** `gold_pp`, `gold_gp`, `gold_ep`, `gold_sp`, `gold_cp`
- **Thief skills:** 7 percentage fields (`thief_pick_locks` through `thief_read_languages`)
- **Class/Race:** `race_id`, `class_id`, `level` (legacy), plus `character_classes` join table for multiclass
- **Priest:** `deity`, `priesthood`, `spell_system` ("slots"|"points"), `spell_points_used`
- **Misc:** `kit`, `alignment`, `xp_current`, `notes`, `is_public`, `is_active`, `traits`, `disadvantages`

### Choice Page (`src/app/characters/[id]/page.tsx`)

The character detail entry point shows a choice page for owners: Manage / Play / Epic. Non-owners are redirected directly to `/characters/{id}/manage`.

---

## 4. Party Overview (Dashboard)

Located in `src/app/dashboard/page.tsx`. The dashboard is a **Server Component** that runs 10 parallel queries in `Promise.all`.

### Party Overview Widget

The party overview shows **public characters + shared characters** (not owned by current user):

1. Fetches all public active characters where `user_id != current_user`
2. Fetches `character_shares` where `shared_with_user_id = current_user`
3. For shared non-public characters, does a second query to get their full data
4. Merges and sorts alphabetically

For each character, it displays:

- Avatar (via `AvatarDisplay` component)
- Name, race (localized), class label with level
- HP current/max with a mini HP bar using class-group colors
- Links to `/characters/{id}`

### Character Classes Resolution

A **single unscoped query** fetches all `character_classes` rows (not filtered by user), then builds a `charClassMap: Map<string, CharacterClassRow[]>` for lookup. This works because RLS on `character_classes` allows reading rows for visible characters.

---

## 5. Thief Skills

### Storage

Seven percentage-based fields directly on `CharacterRow`:

- `thief_pick_locks`, `thief_find_traps`, `thief_move_silently`, `thief_hide_shadows`, `thief_climb_walls`, `thief_detect_noise`, `thief_read_languages`
- Values: 0-99 (integer percentages)

### Display in Character Sheet

`src/components/character-sheet/tab-thief-skills.tsx`:

- Editable number inputs (0-99) for each skill
- Shows base values from `getBaseThiefSkills(level)` and racial adjustments from `getRacialThiefAdjustments(raceId)` as badges
- Displays backstab multiplier from `getBackstabMultiplier(level)`
- Handles epic item penalties: `applyThiefPenalty(rawValue, epicEffects)`
- Warning banners for `thiefDisabled` and `thiefPenalty` from epic effects

### Display in Play Mode

The play-mode checks panel (`src/components/play-mode/play-checks-panel.tsx`) displays thief skills in a read-only compact format alongside ability checks, saving throws, and NWP checks. Epic penalty effects are applied inline.

---

## 6. Equipment/Weapons/Armor DB Schema

All types defined in `src/lib/supabase/types.ts`:

### WeaponRow

- `id`, `name`, `name_en`, `damage_sm`, `damage_l`, `weapon_type` ("melee"|"ranged"|"both")
- `speed`, `weight`, `cost_gp`
- `range_short`, `range_medium`, `range_long` (nullable, for ranged)
- `source_book`, `is_custom`, `created_by`

### ArmorRow

- `id`, `name`, `name_en`, `ac`, `weight`, `cost_gp`, `max_movement`
- `source_book`, `is_custom`, `is_magical_protection`
- `is_shield`, `shield_type` ("buckler"|"small"|"medium"|"large"|null)
- `created_by`

### CharacterEquipmentRow (junction table)

- `id`, `character_id`, `weapon_id` (nullable), `armor_id` (nullable)
- `quantity`, `equipped` (boolean)
- `hit_bonus`, `damage_bonus` (for magic weapons)
- `magic_effects` (JSON: `{ str?, dex?, con?, int?, wis?, cha?, ac_bonus?, hide_in_shadows?, move_silently? }`)
- `custom_label` (nullable, for renamed items)

### CharacterEquipmentWithDetails

Extends `CharacterEquipmentRow` with joined `weapon: WeaponRow | null` and `armor: ArmorRow | null`.

### Query Pattern

```typescript
supabase
  .from("character_equipment")
  .select("*, weapon:weapons(*), armor:armor(*)")
  .eq("character_id", id);
```

---

## 7. Party Inventory

### Architecture

- **Server Component:** `src/app/party/page.tsx` -- Fetches all data server-side
- **Client Component:** `src/components/party/party-page-client.tsx` -- Renders the interactive UI

### Data Model

Three tables:

1. **`party_loot_gold`** -- Single row with 5 coin types: `pp`, `gp`, `ep`, `sp`, `cp`
2. **`party_loot_items`** -- Items in the pool: `item_id` (nullable FK to general_items), `custom_name`, `quantity`, `notes`, `added_by`
3. **`party_loot_log`** -- Audit log: `action` (enum: add_gold, add_item, distribute_gold, distribute_item, remove_item, remove_gold), `user_id`, `character_id`, `details` (JSONB)

### Item Injection

The `PartyItemsPanel` (`src/components/party/party-items-panel.tsx`) allows:

- Adding items from the `general_items` catalog (search + select)
- Adding custom-named items
- All items include `added_by` (user_id) tracking

### Distribution

Items/gold are distributed TO characters. The page fetches all active characters and provides a character selector ("Acting as"). Distribution dialogs (`distribute-item-dialog.tsx`, `distribute-gold-dialog.tsx`) let users select a target character. Distributed items create `character_inventory` rows and log entries.

### Key Pattern: No Realtime

The party page uses client-side state (`useState`) initialized from server-fetched data. After mutations (add/remove/distribute), the client state is updated optimistically. No Supabase Realtime subscriptions.

---

## 8. Saving Throws Display

Located in `src/components/play-mode/play-checks-panel.tsx` (line 282+).

### Props

The `PlayChecksPanel` receives a `saves: SavingThrows` object. This is computed in the parent `PlayMode` component using `getMulticlassSaves()` from the rules engine.

### SavingThrows Type

Five categories: `paralyzation`, `rod`, `petrification`, `breath`, `spell`.

### Display

Rendered as a 4-column grid of compact boxes. Each box shows:

- Label (truncated, 9px)
- Value (mono font, large)
- Optional penalty indicator (amber colored)

AD&D maps to 8 displayed saves (some share the same base value):

- Paralyzation, Poison (both use `saves.paralyzation` + poison penalty)
- Death Magic (uses `saves.paralyzation`)
- Rod/Staff/Wand
- Petrification, Polymorph (both use `saves.petrification`)
- Breath, Spell

The `poisonSavePenalty` prop allows epic item effects to penalize poison saves specifically.

---

## 9. HP Bar Component

### Simple HP Bar (`src/components/hp-bar.tsx`)

```typescript
interface HpBarProps {
  current: number;
  max: number;
  barClass: string; // e.g. "hp-bar-warrior"
}
```

- Calculates percentage, renders a rounded progress bar
- Adds `hp-bar-pulse` CSS class when HP < 25%
- Shows "HP: current/max" text label
- Used in `CharacterCard` for the character list

### Play Mode HP Bar (`src/components/play-mode/play-hp-bar.tsx`)

A much richer component with interactive damage/heal:

```typescript
interface PlayHpBarProps {
  characterId: string;
  name: string;
  avatarUrl: string | null;
  hpCurrent: number;
  hpMax: number;
  ac: number;
  thac0: number;
  classGroup: ClassGroup;
  kitName?: string | null;
  deity?: string | null;
  priesthoodName?: string | null;
  onHpChange: (newHp: number) => void;
}
```

- Sticky header bar with avatar, name, kit/deity badges
- Damage (minus) and Heal (plus) buttons that reveal an input field
- AC and THAC0 displayed as compact stat blocks
- Link to manage page
- Uses class-group-specific colors for HP bar gradient

---

## 10. Environment Variables

From `.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
ANTHROPIC_API_KEY=your-anthropic-api-key
VOYAGE_API_KEY=your-voyage-api-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key  # scripts only
```

Pattern: `NEXT_PUBLIC_` prefix for client-accessible vars. Server-only vars without prefix. The `isSupabaseConfigured()` check allows running in dev without Supabase.

---

## 11. Next Migration Number

The latest migration is **`00169_fix_larry_name_and_reseed.sql`**.

The next migration should be **`00170_*.sql`**.

---

## 12. Sidebar/Navigation

### Navigation Items (`src/lib/navigation.ts`)

Centralized `NAV_ITEMS` array with 6 entries:

1. `/dashboard` (LayoutDashboard) -- mobileBar: true
2. `/characters` (Users) -- mobileBar: true
3. `/sessions` (ScrollText) -- mobileBar: true
4. `/party` (Package) -- mobileBar: true
5. `/characters/import` (FileUp) -- mobileBar: false (in "More" menu)
6. `/chat` (BookOpen, "Rulebook") -- mobileBar: false

Each item has: `href`, `icon` (Lucide component), `labelKey` (i18n), `testId`, `mobileBar` (boolean).

### Desktop Sidebar (`src/components/app-sidebar.tsx`)

- Fixed left sidebar, hidden on mobile (`hidden sm:flex`)
- Width: `w-16` (icon-only) expanding to `xl:w-48` (icon + label)
- Uses Tooltip for icon-only mode, labels visible at xl breakpoint
- Active route detection with "more specific match" logic (prevents parent routes from highlighting when child is active)
- Bottom section: user avatar initial, locale toggle, theme toggle, logout button
- Receives `userEmail` prop from layout

### Mobile Navigation (`src/components/app-nav.tsx`)

- Fixed bottom bar, visible only on mobile (`sm:hidden`)
- Shows `mobileBar: true` items in bottom bar
- "More" button reveals a panel with remaining items + locale/theme/logout
- Backdrop overlay when "More" panel is open

### Adding a New Nav Item

Add to `NAV_ITEMS` in `src/lib/navigation.ts`. Both sidebar and mobile nav render from this single source. Add the `labelKey` to `messages/de.json` and `messages/en.json` under the `nav` namespace.

---

## 13. Glass Card Pattern

### Component (`src/components/glass-card.tsx`)

```typescript
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean; // default: true
  glow?: "neutral" | "warrior" | "priest" | "rogue" | "wizard"; // default: "neutral"
  "data-testid"?: string;
}
```

Composes CSS classes: `glass rounded-xl p-4` + optional `glass-hover` + `glow-{variant}`.

### Usage Across Codebase (17 files)

Used extensively in:

- **Dashboard** (`dashboard/page.tsx`) -- All widgets (stats, quote, party overview, session, XP, tags, NPCs, throwback)
- **Play Mode** -- Combat panel, checks panel, spellbook panel, abilities panel, turn undead panel, inventory panel, coin purse panel
- **Party** -- Gold panel, items panel, log panel
- **Epic Equipment** -- Damage level cards, blade system card, simple epic card
- **Character Creation** -- New character page

The `glow` prop is almost always `"neutral"` (gold glow). Class-specific glows are used in character cards and class-specific contexts.

---

## Summary of Key Findings for GM Interface

### What Exists and Can Be Reused

- **Auth infrastructure** works but has no role system -- a GM role needs to be added (likely a `profiles.role` column or a separate `gm_users` table)
- **Character data fetching pattern** is well-established (two-wave server-side with parallel queries)
- **Party overview widget** already shows all visible characters with HP bars -- good reference for GM dashboard
- **Navigation system** is centralized and easy to extend with a new `/master` route
- **GlassCard** is the universal container component
- **HP Bar** has both simple (list view) and interactive (play mode) variants
- **Saving throws** are computed from rules engine and displayed in a compact grid
- **All component types** use `data-testid` consistently

### What Needs to Be Built

- **Role/permission system** -- No GM concept exists; needs DB column + RLS policy adjustments
- **Supabase Realtime** -- Not used anywhere; would be needed for live GM-to-player sync (HP changes, initiative tracking, etc.)
- **Cross-character view** -- The play page fetches one character at a time; a GM view showing multiple characters simultaneously needs a new query pattern
- **Write access to other users' characters** -- Current RLS only allows owners to UPDATE. GM would need bypass policies or a service-role approach
