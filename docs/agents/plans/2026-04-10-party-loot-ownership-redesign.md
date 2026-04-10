# Party Loot Ownership & Redesign

**Status:** Approved (2026-04-10)
**Branch:** `feat/party-loot-ownership`

## Problem

Aktuell kann im Party-Loot-UI (`src/components/party/party-items-panel.tsx`) jedes Item aus dem globalen Katalog eingelegt werden — auch wenn es keinem Charakter des Users gehört. `party_loot_items` enthält keinen Ownership-Link; RLS prüft nur `added_by = auth.uid()`. Zusätzlich wird der `equipped`-Status beim Einlegen nicht berücksichtigt.

Parallel: Die Party-Seite ist nicht mobile-first gestaltet (feste 4-Spalten-Gold-Grid, `flex` ohne Wrap im Items-Panel, gestapelte Panels mit viel Scroll).

## Ziel

1. **Ownership erzwingen**: Items können nur aus dem Bestand eines eigenen Charakters ins Loot wandern („Move"-Semantik: Bestand am Quell-Charakter wird dekrementiert/entfernt).
2. **Equipped-Status sichtbar**: Ausgerüstete Items im Picker mit Badge markieren; beim Verschieben automatisch `equipped=false` setzen und darauf hinweisen.
3. **Responsive Redesign**: Mobile-first Tabs, Card-basierte Item-Liste, Full-Screen-Sheet für Add/Distribute.

## Freigegebene Entscheidungen

| Frage                                            | Entscheidung                               |
| ------------------------------------------------ | ------------------------------------------ |
| Move-Semantik (Item verschwindet aus Charakter)  | **Ja**                                     |
| Equipped: warnen + auto-unequip statt blockieren | **Ja**                                     |
| Epic Items als Quelle                            | **Nein** — charaktergebunden               |
| Partial Stacks (Quantity-Stepper)                | **Ja**                                     |
| Distribute-Ziel weiterhin jeder Party-Charakter  | **Ja**                                     |
| Custom Items (Freitext im Inventar) verschiebbar | **Ja**                                     |
| Mobile-Navigation über URL-Tabs (`?view=`)       | **Ja**                                     |
| Acting-As-Pflicht für Add-Button                 | **Nein** — Charakter wird im Sheet gewählt |

## Datenmodell-Änderung

**Migration `00201_party_loot_source.sql`:**

```sql
alter table party_loot_items
  add column source_character_id uuid references characters(id) on delete set null,
  add column source_type text check (source_type in ('inventory', 'equipment')),
  add column source_row_id uuid;

create index party_loot_items_source_character_idx
  on party_loot_items(source_character_id);
```

- Altbestand: `source_character_id IS NULL` → UI zeigt Chip „Legacy", Distribute bleibt möglich, Rollback nicht.
- `source_row_id` zeigt auf `character_inventory.id` bzw. `character_equipment.id` — wird für Remove/Rollback genutzt.

**Migration `00202_move_to_party_loot_rpc.sql`:**

```sql
create or replace function move_to_party_loot(
  p_character_id uuid,
  p_source_type text,
  p_source_row_id uuid,
  p_quantity int
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_loot_id uuid;
  v_item_id uuid;
  v_custom_name text;
  v_available int;
begin
  -- Owner-Check
  if not exists (
    select 1 from characters
    where id = p_character_id and user_id = auth.uid()
  ) then
    raise exception 'forbidden';
  end if;

  if p_source_type = 'inventory' then
    select item_id, custom_name, quantity
      into v_item_id, v_custom_name, v_available
      from character_inventory
      where id = p_source_row_id and character_id = p_character_id
      for update;

    if v_available is null then
      raise exception 'source_not_found';
    end if;
    if p_quantity > v_available then
      raise exception 'insufficient_quantity';
    end if;

    if p_quantity = v_available then
      delete from character_inventory where id = p_source_row_id;
    else
      update character_inventory
        set quantity = quantity - p_quantity
        where id = p_source_row_id;
    end if;

  elsif p_source_type = 'equipment' then
    -- equipment: immer quantity = 1, row komplett verschieben
    select coalesce(weapon_id, armor_id) into v_item_id
      from character_equipment
      where id = p_source_row_id and character_id = p_character_id
      for update;

    if v_item_id is null then
      raise exception 'source_not_found';
    end if;
    if p_quantity <> 1 then
      raise exception 'equipment_quantity_must_be_one';
    end if;

    delete from character_equipment where id = p_source_row_id;
  else
    raise exception 'invalid_source_type';
  end if;

  insert into party_loot_items (
    item_id, custom_name, quantity, added_by,
    source_character_id, source_type, source_row_id
  ) values (
    v_item_id, v_custom_name, p_quantity, auth.uid(),
    p_character_id, p_source_type, p_source_row_id
  )
  returning id into v_loot_id;

  insert into party_loot_log (action, user_id, character_id, details)
  values ('add_item', auth.uid(), p_character_id,
          jsonb_build_object('source_type', p_source_type, 'quantity', p_quantity));

  return v_loot_id;
end;
$$;

grant execute on function move_to_party_loot to authenticated;
```

**RLS-Verschärfung auf `party_loot_items`:**

Direkte `INSERT`s aus dem Client entfallen. Insert-Policy wird restriktiv: nur via `move_to_party_loot`-RPC (SECURITY DEFINER). Client-`.insert()` aus `party-items-panel.tsx` werden ersatzlos entfernt.

Custom-Items ohne Charakter-Bezug (aktuell über `addCustomItem()`) entfallen als Feature: Wer ein Freitext-Item ins Loot legen will, muss es zuerst im Charakter-Inventar anlegen. Das ist konsistent mit der Ownership-Regel.

## UI-Redesign

### Layout-Struktur

**`src/app/party/page.tsx`:**

- URL-Query `?view=gold|loot|log` (Default: `loot`)
- Server Component lädt zusätzlich: `character_inventory` + `character_equipment` aller Charaktere des Users (mit Joins auf `general_items`, `weapons`, `armor` für Namen)

**`src/components/party/party-page-client.tsx`:**

- Mobile (`<md`): `Tabs` (shadcn) als Sticky-Top, nur ein Panel sichtbar
- Tablet (`md`): 1-spaltig, alle Panels untereinander
- Desktop (`lg`): 2-spaltig (Gold+Items links, Log rechts)
- Tabs schreiben URL-Query via `router.replace()` für Deep-Link-Unterstützung

### Gold-Panel

- Mobile: `grid-cols-2 gap-3`, größere Buttons (min 44px Tap-Target)
- Desktop: `grid-cols-4`
- Sticky Action-Row (Add / Split) am Panel-Bottom

### Items-Panel (Kernumbau)

**Liste:** Card-basiert, Icon + Name + Quantity-Badge + Source-Chip („Von: Thalion"). Legacy-Items ohne Source bekommen grauen „Legacy"-Chip. Tap auf Card öffnet Distribute-Sheet.

**Add-Flow — neuer Full-Screen-Sheet:**

`src/components/party/add-to-loot-sheet.tsx` (neu)

1. **Charakter-Auswahl** (wenn Acting-As gesetzt → vorausgewählt): Liste aller eigenen Charaktere als Cards mit Avatar.
2. **Item-Auswahl**: Gruppen `Ausgerüstet` / `Inventar`, Suchfeld, jede Row zeigt Name + Quantity + optional Equipped-Badge. Tap öffnet Step 3.
3. **Quantity-Stepper**: min 1, max = verfügbare Menge (bei equipment fix 1, ausgegraut). Wenn Item equipped: Warn-Hinweis „Wird automatisch abgelegt."
4. **Bestätigen** → RPC `move_to_party_loot` → Toast + Sheet schließen + Re-Fetch.

Auf Desktop ist das Sheet ein `Dialog`, auf Mobile ein Bottom-Sheet (Radix `Sheet` side=bottom).

**Distribute-Flow — analog:**

`distribute-item-dialog.tsx` wird zu `distribute-item-sheet.tsx`:

- Liste aller Party-Charaktere (wie bisher: keine Owner-Beschränkung)
- Quantity-Stepper
- Bestätigen → wie bisher `character_inventory` oder `character_equipment` + Party-Bestand dekrementieren
- Optional (Stretch): Wenn `source_character_id` des Loot-Items vorhanden ist, Hinweis „Ursprünglich von …" zeigen.

### Log-Panel

- Timeline-Layout mit Tages-Gruppierung (`Heute`, `Gestern`, `2026-04-08`)
- Mobile: Einzeiler, Tap expandiert Details
- Desktop: Expanded von Anfang an

## Code-Strukturierung

**Neue Dateien:**

- `supabase/migrations/00201_party_loot_source.sql`
- `supabase/migrations/00202_move_to_party_loot_rpc.sql`
- `src/components/party/add-to-loot-sheet.tsx`
- `src/components/party/party-tabs.tsx`
- `src/lib/party-loot/types.ts` — `OwnedItem`, `SourceType`, `MoveToLootPayload`
- `src/lib/party-loot/owned-items.ts` — `collectOwnedItems(characters, inventory, equipment)` Pure Function
- `e2e/party-loot-ownership.spec.ts`

**Geänderte Dateien:**

- `src/app/party/page.tsx` — zusätzliche Data-Loads (inventory, equipment)
- `src/components/party/party-page-client.tsx` — Tabs + Layout
- `src/components/party/party-items-panel.tsx` — Entfernt alten Add-Flow, nutzt Sheet
- `src/components/party/party-gold-panel.tsx` — Responsive-Grid
- `src/components/party/party-log-panel.tsx` — Timeline
- `src/components/party/distribute-item-dialog.tsx` → `distribute-item-sheet.tsx`
- `messages/de.json` + `messages/en.json` — neue Strings

## TDD-Reihenfolge (Phase 2)

1. **Pure Function Test**: `owned-items.test.ts` — `collectOwnedItems()` gibt korrekte Gruppierung + Equipped-Flag zurück
2. **Migration schreiben & `supabase db push`** (selbst ausführen, User nicht bitten)
3. **RPC-Test** (manuelle Validierung via Supabase SQL, da RPC-Tests in diesem Repo nicht üblich)
4. **Unit/Integration**: Dialog-Sheet mit Testing-Library (falls Tests für UI-Komponenten vorhanden; sonst in E2E abdecken)
5. **E2E `party-loot-ownership.spec.ts`** (neue Testdaten mit QA-Prefix, kein Reuse bestehender Chars):
   - Move-Flow vom Inventar → Loot verifiziert Decrement
   - Move-Flow vom Equipment → Loot verifiziert Row-Delete + equipped-Reset
   - Insufficient-Quantity-Error
   - Forbidden-Error (Versuch, fremden Charakter zu nutzen — Manipulation via DB-Action-Call nicht UI)
6. **E2E Responsive**: Viewport 375px, 768px, 1280px — Tab-Switch + Add-Flow
7. **A11y**: axe-core Scan Party-Seite + Add-Sheet offen
8. `npm run verify` muss grün sein vor Phase 3

## Realtime-Erweiterungen (gleicher PR)

**Bestand:**

- `characters` (00174) und `notifications` (00177) bereits in `supabase_realtime` Publication
- Pattern im Repo: `master-dashboard.tsx:203` nutzt Channel + `postgres_changes` + `router.refresh()`

**Scope (alles in diesem PR):**

1. **Party Loot** — `party_loot_gold`, `party_loot_items`, `party_loot_log` in Publication aufnehmen. Client-Subscription in `party-page-client.tsx` triggert `router.refresh()`.
2. **Dashboard Party-Widget** — `characters` Publication existiert schon. Im Player-Dashboard-Widget (`src/components/dashboard/party-overview-widget.tsx` o.ä.) analog subscriben und refreshen.
3. **Session-Log** — `session_entries` in Publication aufnehmen. Subscription auf `/sessions/[id]` Detail-Seite.
4. **Chronicle Quotes + NPCs** — `chronicle_quotes`, `chronicle_npcs` in Publication aufnehmen. Subscription dort, wo sie angezeigt werden (Dashboard-Quote-Widget, Chronicle-Seite).

**Neue Migration:** `00203_enable_realtime_shared_tables.sql`

```sql
alter publication supabase_realtime add table public.party_loot_gold;
alter publication supabase_realtime add table public.party_loot_items;
alter publication supabase_realtime add table public.party_loot_log;
alter publication supabase_realtime add table public.session_entries;
alter publication supabase_realtime add table public.chronicle_quotes;
alter publication supabase_realtime add table public.chronicle_npcs;
```

**Gemeinsamer Hook:** `src/lib/hooks/use-realtime-refresh.ts`

```typescript
export function useRealtimeRefresh(
  channelName: string,
  tables: { table: string; filter?: string }[]
): void;
```

Interne Logik: ein Supabase-Channel mit mehreren `.on("postgres_changes", { event: "*", schema: "public", table, filter? })`-Bindings, die alle auf `router.refresh()` verweisen. Einmaliger `subscribe()`/`removeChannel()` via `useEffect`. Debouncing: 150ms Trailing-Debounce auf `refresh()`, damit Bulk-Events (z.B. Loot-Split mit 10 Inserts) nicht 10 Refreshes auslösen.

**Genutzt von:**

- `party-page-client.tsx` — party*loot*\*
- `dashboard` Party-Widget — characters
- `session/[id]` Detail — session_entries
- `dashboard` Quote-Widget + Chronicle-Seite — chronicle_quotes/npcs

## Nicht-Ziele

- Keine Änderung am GM-Dashboard (`src/components/master/`), außer falls der Hook dort refaktoriert werden kann (optional)
- Keine Epic-Item-Integration
- Keine Migration der Altdaten — `source_character_id = NULL` bleibt
- Keine Optimistic-UI-Logik — `router.refresh()` reicht bei <10 Nutzern

## Offene Risiken

- **Custom Items ohne Katalog-Bezug**: wenn der Spieler das Item später aus seinem Inventar löscht, bleibt der Loot-Eintrag. Das ist OK — `source_row_id` wird beim Delete nicht mehr gebraucht (wir haben den Eintrag bereits verschoben).
- **Concurrent Moves**: `for update` im RPC sichert Consistency innerhalb einer Transaction; bei zwei parallelen Add-Calls gewinnt der erste, der zweite bekommt `insufficient_quantity`.
- **Legacy-Items ohne Source**: können weiterhin verteilt werden, aber nicht zurückgerollt (kein Charakter-Rückbezug). UI zeigt „Legacy"-Chip, Distribute bleibt funktional.
