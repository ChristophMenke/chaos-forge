---
date: "2026-04-03T20:36:20.755813+00:00"
git_commit: fc5f05e72d854046ef210c5caaf16e88f03e7ab0
branch: feat/xp-emoji-party-inventory
topic: "Party Inventory & Loot Distribution"
tags: [plan, party, inventory, loot, gold, supabase]
status: draft
---

# Party Inventory & Loot Distribution — Implementation Plan

## Overview

Neue `/party` Seite mit geteiltem Loot-Pool (Items + Gold) für alle Spieler. Items und Gold können hinzugefügt, entfernt und an einzelne Charaktere verteilt werden. Ein Audit-Trail protokolliert alle Aktionen.

## Current State Analysis

- Kein Party-Konzept vorhanden — jeder Charakter hat eigene Gold-Felder und eigenes Inventar
- `CoinPurse` Typ und `purseTotalInCP()` existieren in `src/lib/rules/equipment.ts`
- `general_items` Tabelle existiert für Item-Katalog
- `character_inventory` zeigt das Pattern für Item-Zuordnung (item_id FK + custom_name)
- Sessions-/Dashboard-Seiten zeigen das Pattern für geteilte Server Component Seiten
- Letzte Migration: `00160`, nächste: `00161`

## Desired End State

Eine voll funktionale Party Inventory Seite unter `/party` mit:

- Gold-Pool (5 Münztypen) mit Hinzufügen/Verteilen
- Item-Liste mit Hinzufügen/Entfernen/Verteilen (aus Katalog oder custom)
- Audit-Trail aller Aktionen
- Navigation in Sidebar und Mobile Nav
- Vollständige i18n (DE/EN)

### UI Mockups

**Desktop Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  Party-Inventar                                         │
├──────────────────────────┬──────────────────────────────┤
│  ┌────────────────────┐  │  ┌────────────────────────┐  │
│  │ GOLDKASSE          │  │  │ BEUTE                  │  │
│  │                    │  │  │                        │  │
│  │ PP  GP  EP  SP  CP │  │  │ [Suche / Custom Name]  │  │
│  │  0  125  0  30  50 │  │  │ [+ Hinzufügen]         │  │
│  │                    │  │  │                        │  │
│  │ Gesamt: 126.3 GP   │  │  │ ┌──────────────────┐   │  │
│  │                    │  │  │ │ Seil (15m)    ×2 │   │  │
│  │ [+ Gold hinzufügen] │  │  │ │ [Verteilen] [×]  │   │  │
│  │ [Verteilen]        │  │  │ ├──────────────────┤   │  │
│  └────────────────────┘  │  │ │ Heiltrank     ×5 │   │  │
│                          │  │ │ [Verteilen] [×]  │   │  │
│                          │  │ └──────────────────┘   │  │
│                          │  └────────────────────────┘  │
├──────────────────────────┴──────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐  │
│  │ PROTOKOLL                                          │  │
│  │                                                    │  │
│  │ 14:32  Max hat 500 GP hinzugefügt                 │  │
│  │ 14:35  Max hat 3× Heiltrank hinzugefügt           │  │
│  │ 14:40  Lisa hat 100 GP an "Sprocket" verteilt     │  │
│  │ 14:41  Lisa hat 1× Seil an "Lady Katrina" vert.   │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Mobile Layout:** Gleiche Karten, aber vertikal gestapelt (1 Spalte).

**Verteilen-Dialog (Gold):**

```
┌──────────────────────────────┐
│  Gold verteilen              │
│                              │
│  An: [Dropdown: Charakter ▾] │
│                              │
│  PP [___] GP [___] EP [___]  │
│  SP [___] CP [___]           │
│                              │
│  [Verteilen]    [Abbrechen]  │
└──────────────────────────────┘
```

**Verteilen-Dialog (Item):**

```
┌──────────────────────────────┐
│  "Heiltrank" verteilen       │
│                              │
│  An: [Dropdown: Charakter ▾] │
│  Anzahl: [___] / 5 verfügbar │
│                              │
│  [Verteilen]    [Abbrechen]  │
└──────────────────────────────┘
```

### Key Discoveries:

- `CoinPurse` und `purseTotalInCP` wiederverwendbar (`src/lib/rules/equipment.ts:149-176`)
- `play-coin-purse-panel.tsx` als UI-Muster für Gold-Anzeige
- `play-inventory-panel.tsx` als UI-Muster für Item-Liste
- Sessions-Page (`src/app/sessions/page.tsx`) als Muster für Server Component Seite
- RLS Pattern B + E für shared-write Zugriff
- `AppUser` Typ existiert für User-Dropdown (`types.ts:348-352`)

## What We're NOT Doing

- Kein DM-Rollen-System (alle authentifizierten User haben gleiche Rechte)
- Keine Session-spezifischen Loot-Pools (global, ein Pool)
- Kein Waffen/Rüstungs-Loot (nur general items + custom names) — Waffen/Rüstungen werden direkt am Charakter angelegt
- Keine Undo-Funktion für Verteilungen (Audit-Trail reicht)
- Keine automatische Gewichts-Berechnung im Party Pool (nur bei Verteilung an Charakter)

## Implementation Approach

Bottom-up: DB Schema → Types → Server Page → Client Interaktivität → Navigation

Die Seite wird als Server Component aufgebaut (wie Sessions), mit Client Components für die interaktiven Panels (Gold, Items, Verteilen-Dialoge, Audit Trail).

## Architecture and Code Reuse

**Wiederverwendung:**

- `CoinPurse`, `purseTotalInCP` aus `src/lib/rules/equipment.ts`
- `GlassCard` für alle Karten
- `Button`, `Badge` aus `shadcn/ui`
- `localized()` für Item-Namen
- `createClient()` (Browser) / `createClient()` (Server) für Supabase
- `requireAuth()` für Auth-Guard
- `AppUser` Typ für User-Dropdown

**Neue Dateien:**

```
supabase/migrations/
  00161_party_loot.sql              # DB Schema + RLS

src/lib/supabase/types.ts           # + PartyLootItemRow, PartyLootGoldRow, PartyLootLogRow
src/app/party/page.tsx              # Server Component (Seite)
src/components/party/
  party-gold-panel.tsx              # Gold-Pool Anzeige + Hinzufügen
  party-items-panel.tsx             # Item-Liste + Hinzufügen/Entfernen
  distribute-gold-dialog.tsx        # Gold-Verteil-Dialog
  distribute-item-dialog.tsx        # Item-Verteil-Dialog
  party-log-panel.tsx               # Audit-Trail Anzeige
src/lib/navigation.ts               # + Party Nav-Item
messages/de.json                    # + "party" Namespace
messages/en.json                    # + "party" Namespace
```

**Datenbankdiagramm:**

```
┌─────────────────────┐     ┌─────────────────────┐
│  party_loot_gold    │     │  party_loot_items    │
├─────────────────────┤     ├─────────────────────┤
│  id (uuid, PK)      │     │  id (uuid, PK)      │
│  pp (int)           │     │  item_id (uuid FK?)  │
│  gp (int)           │     │  custom_name (text?) │
│  ep (int)           │     │  quantity (int)      │
│  sp (int)           │     │  notes (text)        │
│  cp (int)           │     │  added_by (uuid FK)  │
│  updated_at         │     │  created_at          │
│  updated_by (uuid)  │     │  updated_at          │
└─────────────────────┘     └─────────────────────┘

┌─────────────────────────────┐
│  party_loot_log             │
├─────────────────────────────┤
│  id (uuid, PK)              │
│  action (text)              │  -- 'add_gold', 'add_item', 'distribute_gold',
│  user_id (uuid FK)          │  --  'distribute_item', 'remove_item'
│  character_id (uuid FK?)    │  -- Ziel-Charakter bei Verteilung
│  details (jsonb)            │  -- Flexible Daten (Münzen, Item-Name, Menge)
│  created_at                 │
└─────────────────────────────┘
```

**Design-Entscheidung: Eine Gold-Zeile statt Spalten am Charakter.**
Die Party hat genau eine Zeile in `party_loot_gold` mit den 5 Münztypen. Bei der ersten Nutzung wird sie automatisch angelegt (upsert). Das ist simpler als eine eigene "party" Entität.

---

## Phase 1: DB Schema + TypeScript Types

### Overview

Datenbank-Tabellen anlegen, RLS-Policies, TypeScript-Typen definieren.

### Changes Required:

#### [x] 1. Supabase Migration

**File**: `supabase/migrations/00161_party_loot.sql`
**Changes**: Drei neue Tabellen mit RLS

```sql
-- Party Gold Pool (exactly one row, upserted)
CREATE TABLE party_loot_gold (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pp integer NOT NULL DEFAULT 0,
  gp integer NOT NULL DEFAULT 0,
  ep integer NOT NULL DEFAULT 0,
  sp integer NOT NULL DEFAULT 0,
  cp integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE party_loot_gold ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view party gold"
  ON party_loot_gold FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert party gold"
  ON party_loot_gold FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update party gold"
  ON party_loot_gold FOR UPDATE TO authenticated USING (true);

-- Seed with one empty row
INSERT INTO party_loot_gold (pp, gp, ep, sp, cp) VALUES (0, 0, 0, 0, 0);

-- Party Item Pool
CREATE TABLE party_loot_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES general_items(id) ON DELETE SET NULL,
  custom_name text,
  quantity integer NOT NULL DEFAULT 1,
  notes text NOT NULL DEFAULT '',
  added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE party_loot_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view party items"
  ON party_loot_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert party items"
  ON party_loot_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = added_by);
CREATE POLICY "Authenticated can update party items"
  ON party_loot_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete party items"
  ON party_loot_items FOR DELETE TO authenticated USING (true);

-- Audit Log
CREATE TABLE party_loot_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,  -- 'add_gold', 'add_item', 'distribute_gold', 'distribute_item', 'remove_item'
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id uuid REFERENCES characters(id) ON DELETE SET NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE party_loot_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view party log"
  ON party_loot_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert party log"
  ON party_loot_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
```

#### [x] 2. TypeScript Types

**File**: `src/lib/supabase/types.ts`
**Changes**: Neue Interfaces am Ende hinzufügen

```typescript
// ── Party Loot ───────────────────────────────────────────
export interface PartyLootGoldRow {
  id: string;
  pp: number;
  gp: number;
  ep: number;
  sp: number;
  cp: number;
  updated_at: string;
  updated_by: string | null;
}

export interface PartyLootItemRow {
  id: string;
  item_id: string | null;
  custom_name: string | null;
  quantity: number;
  notes: string;
  added_by: string;
  created_at: string;
  updated_at: string;
}

export interface PartyLootItemWithDetails extends PartyLootItemRow {
  item: GeneralItemRow | null;
}

export interface PartyLootLogRow {
  id: string;
  action: "add_gold" | "add_item" | "distribute_gold" | "distribute_item" | "remove_item";
  user_id: string;
  character_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}
```

#### [x] 3. Migration ausführen

`supabase db push` ausführen, um die Tabellen anzulegen.

### Success Criteria:

#### Automated Verification:

- [x] `npx tsc --noEmit` — keine TypeScript-Fehler
- [x] Migration erfolgreich angewendet

---

## Phase 2: Server Page + Gold Pool

### Overview

Die `/party` Seite als Server Component mit dem Gold-Pool Panel (Anzeigen + Hinzufügen).

### Changes Required:

#### [x] 1. Party Page (Server Component)

**File**: `src/app/party/page.tsx`
**Changes**: Neue Server Component Seite nach Sessions-Pattern

```typescript
// Pattern: requireAuth() → parallel queries → render GlassCards
import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { GlassCard } from "@/components/glass-card";
import { PartyGoldPanel } from "@/components/party/party-gold-panel";
import { PartyItemsPanel } from "@/components/party/party-items-panel";
import { PartyLogPanel } from "@/components/party/party-log-panel";
// ... types

export default async function PartyPage() {
  const user = await requireAuth();
  const t = await getTranslations("party");
  const supabase = await createClient();

  const [{ data: gold }, { data: items }, { data: log }, { data: characters }, { data: users }] =
    await Promise.all([
      supabase.from("party_loot_gold").select("*").single(),
      supabase.from("party_loot_items").select("*, item:general_items(*)").order("created_at", { ascending: false }),
      supabase.from("party_loot_log").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("characters").select("id, name, user_id").eq("is_active", true),
      supabase.from("profiles").select("id, display_name"),
    ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6" data-testid="party-page">
      <h1 className="font-heading text-3xl text-primary">{t("title")}</h1>
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Gold + Items panels */}
      </div>
      {/* Log panel */}
    </div>
  );
}
```

#### [x] 2. Party Gold Panel (Client Component)

**File**: `src/components/party/party-gold-panel.tsx`
**Changes**: Neues Client Component für Gold-Pool

```typescript
"use client";
// Props: gold (PartyLootGoldRow), userId, characters, users, onGoldChange
// UI: 5-column coin grid (reuse CoinPurse pattern from play-coin-purse-panel)
//     Total in GP display
//     "Add Gold" button → inline dialog with 5 number inputs
//     "Distribute" button → DistributeGoldDialog
// DB: UPDATE party_loot_gold SET pp=..., updated_by=userId
//     INSERT party_loot_log (action='add_gold', details={coins})
```

#### [x] 3. Distribute Gold Dialog

**File**: `src/components/party/distribute-gold-dialog.tsx`
**Changes**: Dialog zum Gold-Verteilen an Charakter

```typescript
"use client";
// Props: gold (PartyLootGoldRow), characters, userId, onDistribute
// UI: Character dropdown, 5 coin inputs, Distribute/Cancel buttons
// Logic: Deduct from party_loot_gold, add to characters gold_pp/gp/ep/sp/cp
//        Insert party_loot_log (action='distribute_gold', character_id, details={coins})
// Validation: Cannot distribute more than available
```

### Success Criteria:

#### Automated Verification:

- [x] `npx tsc --noEmit` — keine TypeScript-Fehler
- [x] `npm run lint` — keine Fehler

#### Manual Verification:

- [ ] `/party` Seite öffnen → Gold-Pool wird angezeigt (initial alle 0)
- [ ] Gold hinzufügen → Werte aktualisieren sich, Log-Eintrag erscheint
- [ ] Gold verteilen → Party-Gold sinkt, Charakter-Gold steigt, Log-Eintrag

---

## Phase 3: Item Pool

### Overview

Item-Liste zum Party Pool hinzufügen — Items aus Katalog oder custom, Entfernen, Menge ändern.

### Changes Required:

#### [x] 1. Party Items Panel (Client Component)

**File**: `src/components/party/party-items-panel.tsx`
**Changes**: Item-Liste nach play-inventory-panel Pattern

```typescript
"use client";
// Props: items (PartyLootItemWithDetails[]), userId, characters, users, allGeneralItems, onItemsChange
// UI: Search input + "Add" button (same pattern as play-inventory-panel)
//     Item list with: name, quantity (± buttons), "Distribute" button, "×" delete
//     Custom item name input as fallback
// DB operations:
//   addItem: INSERT party_loot_items + INSERT party_loot_log (action='add_item')
//   removeItem: DELETE party_loot_items + INSERT party_loot_log (action='remove_item')
//   updateQuantity: UPDATE party_loot_items SET quantity=...
```

#### [x] 2. Distribute Item Dialog

**File**: `src/components/party/distribute-item-dialog.tsx`
**Changes**: Dialog zum Item-Verteilen an Charakter

```typescript
"use client";
// Props: item (PartyLootItemWithDetails), characters, userId, onDistribute
// UI: Character dropdown, quantity input (max = item.quantity), Distribute/Cancel
// Logic:
//   1. Deduct quantity from party_loot_items (delete if 0)
//   2. INSERT/UPDATE character_inventory for target character
//   3. INSERT party_loot_log (action='distribute_item', character_id, details)
```

### Success Criteria:

#### Automated Verification:

- [x] `npx tsc --noEmit` — keine TypeScript-Fehler
- [x] `npm run lint` — keine Fehler

#### Manual Verification:

- [ ] Item aus Katalog hinzufügen → erscheint in Liste, Log-Eintrag
- [ ] Custom Item hinzufügen → erscheint in Liste
- [ ] Item-Menge ändern (± Buttons)
- [ ] Item verteilen an Charakter → Party-Menge sinkt, Charakter-Inventar steigt
- [ ] Item entfernen (×) → verschwindet aus Liste, Log-Eintrag

---

## Phase 4: Audit Trail + Navigation + i18n

### Overview

Log-Panel, Navigation in Sidebar/Mobile Nav, vollständige Übersetzungen.

### Changes Required:

#### [x] 1. Party Log Panel (Client Component)

**File**: `src/components/party/party-log-panel.tsx`
**Changes**: Audit-Trail Anzeige

```typescript
"use client";
// Props: log (PartyLootLogRow[]), users (Map<id, displayName>), characters (Map<id, name>)
// UI: GlassCard with chronological list
//     Each entry: timestamp + user + action description
//     Format examples:
//       "Max hat 500 GP hinzugefügt"
//       "Lisa hat 3× Heiltrank hinzugefügt"
//       "Lisa hat 100 GP an Sprocket verteilt"
//       "Max hat 1× Seil an Lady Katrina verteilt"
//       "Max hat 2× Fackel entfernt"
// Uses t() for action templates with {user}, {amount}, {item}, {character} placeholders
```

#### [x] 2. Navigation

**File**: `src/lib/navigation.ts`
**Changes**: Neues Nav-Item zwischen Sessions und Import

```typescript
import { Package } from "lucide-react";
// Insert at position 3 (after sessions):
{ href: "/party", icon: Package, labelKey: "party" as const, testId: "nav-party" },
```

#### [x] 3. i18n Keys

**Files**: `messages/de.json`, `messages/en.json`
**Changes**: Neuer `"party"` Namespace + Nav-Label

```json
// de.json
"nav": { ..., "party": "Beutekasse" },
"party": {
  "title": "Party-Inventar",
  "goldPool": "Goldkasse",
  "totalGP": "Gesamt in GP",
  "addGold": "Gold hinzufügen",
  "addGoldTitle": "Gold zur Kasse hinzufügen",
  "distributeGold": "Gold verteilen",
  "distributeGoldTitle": "Gold an Charakter verteilen",
  "items": "Beute",
  "addItem": "Hinzufügen",
  "itemName": "Item-Name...",
  "searchItems": "Item suchen...",
  "customItem": "Eigenes Item",
  "quantity": "Anzahl",
  "distributeItem": "Verteilen",
  "distributeItemTitle": "\"{item}\" verteilen",
  "toCharacter": "An Charakter",
  "available": "{count} verfügbar",
  "distribute": "Verteilen",
  "noItems": "Noch keine Beute im Pool.",
  "log": "Protokoll",
  "noLog": "Noch keine Einträge.",
  "logAddGold": "{user} hat {amount} hinzugefügt",
  "logAddItem": "{user} hat {quantity}× {item} hinzugefügt",
  "logDistributeGold": "{user} hat {amount} an {character} verteilt",
  "logDistributeItem": "{user} hat {quantity}× {item} an {character} verteilt",
  "logRemoveItem": "{user} hat {quantity}× {item} entfernt",
  "apply": "Anwenden",
  "cancel": "Abbrechen",
  "insufficientGold": "Nicht genug Gold in der Kasse"
}

// en.json
"nav": { ..., "party": "Party Loot" },
"party": {
  "title": "Party Inventory",
  "goldPool": "Gold Pool",
  "totalGP": "Total in GP",
  "addGold": "Add Gold",
  "addGoldTitle": "Add Gold to Pool",
  "distributeGold": "Distribute Gold",
  "distributeGoldTitle": "Distribute Gold to Character",
  "items": "Loot",
  "addItem": "Add",
  "itemName": "Item name...",
  "searchItems": "Search items...",
  "customItem": "Custom Item",
  "quantity": "Quantity",
  "distributeItem": "Distribute",
  "distributeItemTitle": "Distribute \"{item}\"",
  "toCharacter": "To Character",
  "available": "{count} available",
  "distribute": "Distribute",
  "noItems": "No loot in the pool yet.",
  "log": "Activity Log",
  "noLog": "No entries yet.",
  "logAddGold": "{user} added {amount}",
  "logAddItem": "{user} added {quantity}× {item}",
  "logDistributeGold": "{user} distributed {amount} to {character}",
  "logDistributeItem": "{user} distributed {quantity}× {item} to {character}",
  "logRemoveItem": "{user} removed {quantity}× {item}",
  "apply": "Apply",
  "cancel": "Cancel",
  "insufficientGold": "Not enough gold in the pool"
}
```

### Success Criteria:

#### Automated Verification:

- [x] `npx tsc --noEmit` — keine TypeScript-Fehler
- [x] `npm run lint` — keine Fehler
- [x] `npm run format` — Code formatiert
- [x] `npm test` — alle Tests grün (1101 Tests)

#### Manual Verification:

- [ ] Nav-Item "Beutekasse" / "Party Loot" sichtbar in Desktop-Sidebar und Mobile-Nav
- [ ] Klick navigiert zu `/party`
- [ ] Audit-Trail zeigt alle bisherigen Aktionen chronologisch
- [ ] DE und EN Sprache korrekt auf der gesamten Seite
- [ ] Mobile responsive: alle Panels untereinander

---

## Testing Strategy

### Unit Tests:

Keine separaten Unit Tests nötig — die Logik ist rein UI-getrieben (Supabase CRUD). Die bestehenden `CoinPurse`/`purseTotalInCP` Tests decken die Geld-Berechnung ab.

### Manual Testing Steps:

1. `/party` öffnen — leerer Gold-Pool und leere Item-Liste
2. 100 GP zur Goldkasse hinzufügen — Wert aktualisiert, Log-Eintrag
3. 3× Heiltrank hinzufügen (aus Katalog) — Item erscheint, Log-Eintrag
4. Custom Item "Magisches Amulett" hinzufügen — Item erscheint
5. 50 GP an Charakter verteilen — Party-Gold sinkt, Charakter-Gold steigt
6. 1× Heiltrank an Charakter verteilen — Party-Menge sinkt, Charakter-Inventar hat Heiltrank
7. Item entfernen (×) — verschwindet, Log-Eintrag
8. Sprache wechseln (DE↔EN) — alle Labels korrekt
9. Mobile: alle Panels untereinander, Dialoge nutzbar

## Performance Considerations

- Log-Abfrage auf 50 Einträge begrenzt (LIMIT 50) mit Sortierung DESC
- Eine Singleton-Zeile für Gold (kein JOIN nötig)
- Items mit JOIN auf `general_items` (wie `character_inventory`)
- Kein Real-Time nötig (kleine Spielgruppe, seltene gleichzeitige Zugriffe)

## Migration Notes

- Migration `00161` erzeugt die Tabellen und seedet eine leere Gold-Zeile
- Kein Datenmigration bestehender Daten nötig (Feature ist komplett neu)
- Rollback: `DROP TABLE party_loot_log, party_loot_items, party_loot_gold;`

## References

- Research: `docs/agents/research/2026-04-03-party-inventory-and-loot-distribution.md`
- Gold UI Pattern: `src/components/play-mode/play-coin-purse-panel.tsx`
- Inventory UI Pattern: `src/components/play-mode/play-inventory-panel.tsx`
- Page Pattern: `src/app/sessions/page.tsx`
- CoinPurse Type: `src/lib/rules/equipment.ts:149-160`
- RLS Pattern: `supabase/migrations/00040_chronicle_quotes.sql`
