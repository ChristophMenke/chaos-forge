---
date: 2026-04-04T18:29:43.025869+00:00
git_commit: f0671a796ecd8914f1a264b79ece19c51ee9d0fe
branch: main
topic: "Notifications, Character Trading & Dashboard Improvements"
tags: [plan, notifications, trading, dashboard, play-mode, sidebar]
status: draft
---

# Notifications, Character Trading & Dashboard Improvements

## Overview

Drei zusammenhängende Features:

1. **Notification-System** — Persistente Benachrichtigungen mit Bell-Icon im Sidebar/Nav, Unread-Badge, Dropdown-Panel. Benachrichtigt Spieler wenn sie Items oder Gold erhalten.
2. **Character-to-Character Trading** — Spieler können im Play Mode Items und Gold direkt an andere Charaktere senden.
3. **Dashboard-Verbesserungen** — Charakter-Grid nach oben, Stats über alle Chars (aktiv + inaktiv), Klassen-/Rassen-Übersicht.

## Current State Analysis

### Notifications

- Kein Notification-System vorhanden
- Kein shared Toast-System — jede Komponente nutzt inline State (`master-gold-panel.tsx:23`, `master-items-panel.tsx:40`)
- Einzige Realtime-Subscription: GM Dashboard HP-Updates (`master-dashboard.tsx:55-132`)
- Nächste Migration: `00177`

### Trading

- Item-Verteilung existiert nur Party-Pool → Charakter (`distribute-item-dialog.tsx:45-149`)
- Gold: Empfangen + Bezahlen existiert lokal (`play-coin-purse-panel.tsx:41-51`), aber kein Senden an andere
- Play Mode Inventar (`play-inventory-panel.tsx`) hat Add/Remove/Update, aber kein Send
- GM kann Items + Gold an Charaktere pushen (`actions.ts:72-189`)

### Dashboard

- Stats-Zeile zeigt nur aktive Chars des Users (`page.tsx:55-61`, `eq("is_active", true)`)
- Charakter-Grid ganz unten nach allen Widgets (`page.tsx:510-530`)
- Keine Klassen-/Rassen-Statistik

## Desired End State

### Notifications

```
┌──────────────────────────────────────────┐
│  🔔 (3)  ← Badge mit Unread-Count       │
│  ┌────────────────────────────────────┐  │
│  │ Gor hat dir Langschwert +1 gesendet│  │
│  │ vor 2 Min                     [•]  │  │
│  ├────────────────────────────────────┤  │
│  │ GM hat 50 GP an Larry verteilt     │  │
│  │ vor 15 Min                    [•]  │  │
│  ├────────────────────────────────────┤  │
│  │ Seil (Party-Loot) → Larry          │  │
│  │ vor 1 Std                         │  │
│  └────────────────────────────────────┘  │
│  [Alle als gelesen markieren]            │
└──────────────────────────────────────────┘
```

### Trading (Play Mode)

```
┌─ Inventar ──────────────────────────────┐
│ Seil              2.3 kg   −[2]+ [📤]  │
│ Fackel            0.5 kg   −[3]+ [📤]  │
└─────────────────────────────────────────┘

┌─ Geldbörse ─────────────────────────────┐
│  PP  GP  EP  SP  CP                     │
│   0  50   0  10   5                     │
│                                         │
│ [Bezahlen] [Empfangen] [Senden]         │
└─────────────────────────────────────────┘
```

Klick auf 📤 (Send) öffnet Dialog:

```
┌─ Item senden ───────────────────────────┐
│ Seil × 1                                │
│                                         │
│ An: [Gor          ▼]                    │
│ Menge: [1    ]                          │
│                                         │
│ [Senden]  [Abbrechen]                   │
└─────────────────────────────────────────┘
```

### Dashboard

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│Abenteurer│ │Avg Level │ │ Sessions │ │Tage seit │
│    5     │ │    8     │ │    12    │ │    7     │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

┌─────────────────────┐ ┌─────────────────────┐
│ Klassen             │ │ Rassen              │
│ Fighter 3 · Mage 2  │ │ Mensch 2 · Elf 1    │
│ Priest 1 · Thief 1  │ │ Zwerg 1 · Halb. 1   │
└─────────────────────┘ └─────────────────────┘

── Meine Charaktere ──────────────────────
[CharacterCard] [CharacterCard] [CharacterCard]

── Widgets (Quote, Party, Session, ...) ──
```

### Key Discoveries

- `NAV_ITEMS` in `src/lib/navigation.ts:3-46` — zentrales Nav-Item-Registry
- Sidebar rendert Items als Tooltip-wrapped Links (`app-sidebar.tsx:36-67`)
- Mobile Bottom-Bar hat 4 Items + More-Button (`app-nav.tsx:89-127`) — Glocke kommt ins More-Menu
- Party-Verteilung nutzt Browser-Client direkt, keine Server Actions (`distribute-item-dialog.tsx`)
- Play Mode Inventar hat `onInventoryChange` Callback (`play-inventory-panel.tsx:22`)
- Coin Purse hat bereits Pay + Receive Buttons (`play-coin-purse-panel.tsx:87-106`)
- Dashboard fetcht nur aktive User-Chars (`dashboard/page.tsx:55-61`)

## What We're NOT Doing

- Keine Browser Push Notifications (Web Push API)
- Kein Annahme-Flow für empfangene Items (direkte Übertragung)
- Kein Trading von Equipment (angelegte Waffen/Rüstungen) — nur Inventar-Items und Gold
- Keine Notification-Preferences (alle Benachrichtigungen an)
- Kein shared Toast-System extrahieren (bleibt inline)
- Keine Notification-History-Seite (nur Dropdown)

## Implementation Approach

1. **DB-Schema zuerst** — `notifications` Tabelle mit type, details (JSONB), is_read, Realtime
2. **Notification-Erstellung** in bestehende Flows einbauen (GM Actions als Server Action, Party-Dialoge als Client-Insert)
3. **Bell-Icon als Client-Komponente** mit Realtime-Subscription — kein Nav-Item weil es kein Link ist, sondern ein Button mit Dropdown
4. **Trading-UI** im Play Mode Inventar + Coin Purse einbauen
5. **Dashboard** umstrukturieren (rein serverseitig, keine neuen Client-Komponenten)

## Architecture and Code Reuse

```
notifications table (NEW)
    ↑ INSERT
    ├── master/actions.ts          (GM → Char: Items + Gold)
    ├── distribute-item-dialog.tsx (Party → Char: Items)
    ├── distribute-gold-dialog.tsx (Party → Char: Gold)
    ├── send-item-dialog.tsx (NEW) (Char → Char: Items)
    └── send-gold-dialog.tsx (NEW) (Char → Char: Gold)
    ↓ SELECT + Realtime
    notification-bell.tsx (NEW)    (Bell Icon + Dropdown + Unread Badge)
    ├── app-sidebar.tsx            (Desktop: Bell zwischen Nav + Bottom Actions)
    └── app-nav.tsx                (Mobile: Bell im More-Panel)
```

**Wiederverwendbare Patterns:**

- `distribute-item-dialog.tsx` als Vorlage für `send-item-dialog.tsx`
- `distribute-gold-dialog.tsx` als Vorlage für `send-gold-dialog.tsx`
- `master-dashboard.tsx:55-132` Realtime-Pattern für Notification-Subscription
- `play-coin-purse-panel.tsx` Coin-Grid + Dialog-Pattern

**Betroffene Dateien:**

```
supabase/migrations/
  00177_notifications.sql                    # NEW: Tabelle + RLS + Realtime

src/lib/supabase/types.ts                    # NotificationRow Type
src/lib/notifications.ts                     # NEW: createNotification() Helper

src/app/master/actions.ts                    # Notification bei Item/Gold-Injection
src/components/party/distribute-item-dialog.tsx  # Notification bei Item-Verteilung
src/components/party/distribute-gold-dialog.tsx  # Notification bei Gold-Verteilung

src/components/notifications/
  notification-bell.tsx                      # NEW: Bell + Badge + Dropdown
  notification-item.tsx                      # NEW: Einzelne Notification-Zeile

src/components/play-mode/
  play-inventory-panel.tsx                   # Send-Button pro Item
  play-coin-purse-panel.tsx                  # Send-Gold-Button
  send-item-dialog.tsx                       # NEW: Item an Charakter senden
  send-gold-dialog.tsx                       # NEW: Gold an Charakter senden

src/components/app-sidebar.tsx               # Bell-Icon einbauen
src/components/app-nav.tsx                   # Bell-Icon im More-Panel

src/app/dashboard/page.tsx                   # Layout umstrukturieren + Stats erweitern

messages/de.json + messages/en.json          # Neue i18n Keys
```

---

## Phase 1: DB Schema + Types + Notification Helper

### Overview

Notification-Tabelle anlegen, TypeScript-Types definieren, wiederverwendbaren `createNotification()` Helper erstellen.

### Changes Required:

#### [x] 1. Migration: `notifications` Tabelle

**File**: `supabase/migrations/00177_notifications.sql`
**Changes**: Neue Tabelle mit RLS + Realtime

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  type text NOT NULL,
  -- type values:
  --   'gm_item_received'     — GM pushed item
  --   'gm_gold_received'     — GM sent gold
  --   'party_item_received'  — Party loot distributed
  --   'party_gold_received'  — Party gold distributed
  --   'trade_item_received'  — Another character sent item
  --   'trade_gold_received'  — Another character sent gold
  details jsonb NOT NULL DEFAULT '{}',
  -- details examples:
  --   { "item_name": "Longsword +1", "quantity": 1, "from_character": "Gor" }
  --   { "pp": 0, "gp": 50, "ep": 0, "sp": 0, "cp": 0, "from_character": "Gor" }
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read)
  WHERE is_read = false;
CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

#### [x] 2. TypeScript Types

**File**: `src/lib/supabase/types.ts`
**Changes**: `NotificationRow` Type hinzufügen

```typescript
export interface NotificationRow {
  id: string;
  user_id: string;
  character_id: string | null;
  type:
    | "gm_item_received"
    | "gm_gold_received"
    | "party_item_received"
    | "party_gold_received"
    | "trade_item_received"
    | "trade_gold_received";
  details: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}
```

#### [x] 3. Notification Helper

**File**: `src/lib/notifications.ts` (NEW)
**Changes**: Wiederverwendbare Helper-Funktion für Client + Server

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType =
  | "gm_item_received"
  | "gm_gold_received"
  | "party_item_received"
  | "party_gold_received"
  | "trade_item_received"
  | "trade_gold_received";

interface CreateNotificationParams {
  userId: string;
  characterId?: string;
  type: NotificationType;
  details: Record<string, unknown>;
}

export async function createNotification(
  supabase: SupabaseClient,
  params: CreateNotificationParams
): Promise<void> {
  await supabase.from("notifications").insert({
    user_id: params.userId,
    character_id: params.characterId ?? null,
    type: params.type,
    details: params.details,
  });
}
```

#### [x] 4. i18n Keys (Notifications)

**Files**: `messages/de.json`, `messages/en.json`
**Changes**: Neue Keys unter `notifications.*`

```json
{
  "notifications": {
    "title": "Benachrichtigungen",
    "markAllRead": "Alle als gelesen markieren",
    "empty": "Keine Benachrichtigungen",
    "gmItemReceived": "{character} hat {item} erhalten (GM)",
    "gmGoldReceived": "{character} hat Gold erhalten (GM)",
    "partyItemReceived": "{item} aus dem Party-Loot an {character}",
    "partyGoldReceived": "Gold aus der Gruppenkasse an {character}",
    "tradeItemReceived": "{from} hat {item} an {character} gesendet",
    "tradeGoldReceived": "{from} hat Gold an {character} gesendet",
    "goldDetail": "{pp} PP, {gp} GP, {ep} EP, {sp} SP, {cp} CP",
    "quantityDetail": "× {count}"
  }
}
```

### Success Criteria:

#### Automated Verification:

- [x] Migration läuft: `npx supabase db push`
- [x] Type checking: `npx tsc --noEmit`
- [x] Lint: `npm run lint`

---

## Phase 2: Notification Bell UI

### Overview

Bell-Icon mit Unread-Badge als Client-Komponente. Dropdown mit Notification-Liste und "Alle gelesen"-Button. Realtime-Subscription für Live-Updates. Integration in Sidebar (Desktop) und More-Panel (Mobile).

### Changes Required:

#### [x] 1. Notification Item Component

**File**: `src/components/notifications/notification-item.tsx` (NEW)
**Changes**: Einzelne Notification-Zeile mit Icon, Text, Zeitstempel, Read/Unread-Indikator

- Notification-Text wird aus i18n-Keys + `details` JSON generiert
- Relative Zeitanzeige ("vor 2 Min", "vor 1 Std")
- Unread-Dot-Indikator
- Click markiert als gelesen

#### [x] 2. Notification Bell Component

**File**: `src/components/notifications/notification-bell.tsx` (NEW)
**Changes**: Bell-Icon Button mit Badge + Dropdown-Panel

- `Bell` Icon aus lucide-react
- Badge-Count (nur wenn > 0)
- Dropdown-Panel mit max 20 neueste Notifications
- "Alle als gelesen markieren" Button
- Supabase Realtime Subscription auf `notifications` Tabelle (gefiltert auf `auth.uid()`)
- Initial-Fetch der ungelesenen Notifications
- Polling-Fallback (wie GM Dashboard Pattern)
- Click-Outside schließt Dropdown

```typescript
interface NotificationBellProps {
  userId: string;
}
```

#### [x] 3. Desktop Sidebar Integration

**File**: `src/components/app-sidebar.tsx`
**Changes**: Bell-Icon zwischen Nav-Items und Bottom-Actions einfügen

- `<NotificationBell />` am Ende der Nav-Items-Section (nach den `NAV_ITEMS.map()`)
- Styling passend zu Nav-Items: `h-10 w-10 rounded-lg`
- Badge als `absolute -top-1 -right-1` roter Dot mit Zahl
- Dropdown öffnet sich nach rechts (`right: -320px` oder so)

#### [x] 4. Mobile Nav Integration

**File**: `src/components/app-nav.tsx`
**Changes**: Bell-Icon im More-Panel einfügen

- `<NotificationBell />` im More-Panel über den Nav-Items
- Badge-Count auch auf dem More-Trigger-Button anzeigen (wenn Notifications ungelesen)

#### [x] 5. userId durchreichen

**Files**: `src/app/(authenticated)/layout.tsx` oder wo Sidebar/Nav gerendert werden
**Changes**: `userId` an Sidebar + Nav Props übergeben, damit NotificationBell den User kennt

### Success Criteria:

#### Automated Verification:

- [ ] Type checking: `npx tsc --noEmit`
- [ ] Tests: `npx vitest run`
- [ ] Lint: `npm run lint`

#### Manual Verification:

- [ ] Desktop: Bell-Icon im Sidebar sichtbar, Badge zeigt Unread-Count
- [ ] Klick auf Bell öffnet Dropdown mit Notifications
- [ ] "Alle gelesen" Button funktioniert
- [ ] Mobile: Bell-Icon im More-Panel sichtbar
- [ ] Dropdown schließt bei Click-Outside

---

## Phase 3: Notification-Erstellung in bestehende Flows

### Overview

In allen 4 bestehenden Quellen (GM Items, GM Gold, Party Items, Party Gold) werden Notifications erstellt wenn Items/Gold an Charaktere verteilt werden.

### Changes Required:

#### [x] 1. GM Item Injection

**File**: `src/app/master/actions.ts`
**Changes**: Nach erfolgreichem `injectItemToCharacter()` eine Notification erstellen

- Character-Owner (`user_id`) aus DB holen
- Item-Name aus DB holen (Waffe/Rüstung/Item je nach `itemType`)
- `createNotification(service, { userId: charOwner, characterId, type: 'gm_item_received', details: { item_name, quantity } })`

#### [x] 2. GM Gold Distribution

**File**: `src/app/master/actions.ts`
**Changes**: Nach erfolgreichem `distributeGold()` eine Notification erstellen

- Character-Owner aus DB holen
- `createNotification(service, { userId: charOwner, characterId, type: 'gm_gold_received', details: { pp, gp, ep, sp, cp } })`

#### [x] 3. Party Item Distribution

**File**: `src/components/party/distribute-item-dialog.tsx`
**Changes**: Nach erfolgreichem Verteilen eine Notification erstellen

- Character-Owner muss aus der `characters` Liste kommen (bereits als Prop vorhanden)
- `createNotification(supabase, { userId: charOwner, characterId, type: 'party_item_received', details: { item_name, quantity } })`

#### [x] 4. Party Gold Distribution

**File**: `src/components/party/distribute-gold-dialog.tsx`
**Changes**: Nach erfolgreichem Verteilen eine Notification erstellen

- Analog zu Party Items
- `createNotification(supabase, { userId: charOwner, characterId, type: 'party_gold_received', details: { pp, gp, ep, sp, cp } })`

### Success Criteria:

#### Automated Verification:

- [ ] Type checking: `npx tsc --noEmit`
- [ ] Tests: `npx vitest run`
- [ ] Lint: `npm run lint`

#### Manual Verification:

- [ ] GM Dashboard: Item an Charakter senden → Bell-Badge erscheint beim Charakter-Owner
- [ ] GM Dashboard: Gold senden → Notification erscheint
- [ ] Party: Item verteilen → Notification erscheint
- [ ] Party: Gold verteilen → Notification erscheint

---

## Phase 4: Character-to-Character Trading

### Overview

Spieler können im Play Mode Items aus dem Inventar und Gold an andere aktive Charaktere senden. Empfänger bekommen eine Notification.

### Changes Required:

#### [x] 1. Send Item Dialog

**File**: `src/components/play-mode/send-item-dialog.tsx` (NEW)
**Changes**: Dialog zum Senden eines Items an einen anderen Charakter

- Pattern von `distribute-item-dialog.tsx` übernehmen
- Props: `item` (CharacterInventoryWithDetails), `characterId` (Sender), `characters` (alle aktiven außer eigener), `onSend` Callback
- Flow:
  1. Charakter auswählen (Dropdown mit aktiven Chars)
  2. Menge wählen (1 bis item.quantity)
  3. Senden: Item vom Sender entfernen/dekrementieren, beim Empfänger hinzufügen
  4. Notification erstellen (`trade_item_received`)
- Sender-Charakter-Name in `details.from_character`

#### [x] 2. Send Gold Dialog

**File**: `src/components/play-mode/send-gold-dialog.tsx` (NEW)
**Changes**: Dialog zum Senden von Gold an einen anderen Charakter

- Pattern von `play-coin-purse-panel.tsx` Receive-Dialog + `distribute-gold-dialog.tsx`
- Props: `characterId` (Sender), `coinPurse` (Sender-Geldbörse), `characters`, `onSend` Callback
- Flow:
  1. Charakter auswählen
  2. Münzbeträge eingeben (validiert gegen verfügbare Münzen)
  3. Senden: Vom Sender abziehen, beim Empfänger addieren (via `distribute_gold` RPC + lokale Münz-Dekrementierung)
  4. Notification erstellen (`trade_gold_received`)

#### [x] 3. Play Inventory Panel: Send-Button

**File**: `src/components/play-mode/play-inventory-panel.tsx`
**Changes**: Send-Button (📤) pro Item hinzufügen

- Neuer Button neben dem +/−-Buttons
- Öffnet `SendItemDialog`
- Benötigt `characters` Liste als neue Prop
- Nach Send: `onInventoryChange` aufrufen (Item entfernen/dekrementieren)

#### [x] 4. Play Coin Purse Panel: Send-Button

**File**: `src/components/play-mode/play-coin-purse-panel.tsx`
**Changes**: "Senden"-Button neben Pay + Receive hinzufügen

- Dritter Button: "Senden" / "Send"
- Öffnet `SendGoldDialog`
- Benötigt `characters` Liste als neue Prop
- Nach Send: `onCoinChange` aufrufen (abgezogene Münzen)

#### [x] 5. Play Mode: Characters-Liste durchreichen

**File**: `src/components/play-mode/play-mode.tsx` (oder wo Inventory/CoinPurse gerendert werden)
**Changes**: Aktive Charaktere laden und als Prop an Inventory + CoinPurse übergeben

- Aktive Charaktere fetchen (alle außer eigener): `supabase.from("characters").select("id, name, user_id").eq("is_active", true).neq("id", characterId)`
- Als `characters` Prop an `PlayInventoryPanel` und `PlayCoinPursePanel` weiterreichen

#### [x] 6. i18n Keys (Trading)

**Files**: `messages/de.json`, `messages/en.json`
**Changes**: Neue Keys unter `playMode.*`

```json
{
  "playMode": {
    "sendItem": "Senden",
    "sendItemTitle": "Item senden",
    "sendGold": "Senden",
    "sendGoldTitle": "Gold senden",
    "toCharacter": "An",
    "selectCharacter": "Charakter wählen...",
    "sendConfirm": "Senden",
    "insufficientFunds": "Nicht genug Münzen"
  }
}
```

### Success Criteria:

#### Automated Verification:

- [ ] Type checking: `npx tsc --noEmit`
- [ ] Tests: `npx vitest run`
- [ ] Lint: `npm run lint`

#### Manual Verification:

- [ ] Play Mode: Send-Button (📤) bei jedem Inventar-Item sichtbar
- [ ] Klick auf Send öffnet Dialog mit Charakter-Auswahl
- [ ] Item senden: Item verschwindet beim Sender, erscheint beim Empfänger
- [ ] Gold senden: Münzen werden korrekt abgezogen und addiert
- [ ] Empfänger erhält Notification mit Sender-Name
- [ ] Read-Only Modus: Keine Send-Buttons sichtbar

---

## Phase 5: Dashboard-Verbesserungen

### Overview

Charakter-Grid nach oben verschieben, Stats auf alle Charaktere (aktiv + inaktiv) erweitern, neue Statistik-Karten für Klassen- und Rassen-Verteilung.

### Changes Required:

#### [x] 1. Dashboard Page umstrukturieren

**File**: `src/app/dashboard/page.tsx`
**Changes**:

1. **Alle Charaktere laden (aktiv + inaktiv)**:
   - Bestehende Query (`line 55-61`): `.eq("is_active", true)` entfernen
   - Neue Variable `allCharacters` für Stats, `activeCharacters` für Grid-Anzeige
   - Stats-Zeile "Adventurers" zeigt `allCharacters.length`
   - "Average Level" über alle Charaktere (aktiv + inaktiv)

2. **Neue Stats: Klassen + Rassen**:
   - Klassen-Verteilung: Aus `charClassMap` aggregieren (Klasse → Anzahl Charaktere)
   - Rassen-Verteilung: Aus `allCharacters` aggregieren (Rasse → Anzahl)
   - Zwei neue `GlassCard`s nach der 4er Stats-Zeile
   - Localized Klassen-/Rassen-Namen

3. **Layout-Reihenfolge ändern**:
   ```
   Stats Row (4 cards)
   Klassen + Rassen (2 cards, nebeneinander)
   Character Grid (moved UP from bottom)
   Widgets Grid (Quote, Party, Session, etc.)
   ```

#### [x] 2. i18n Keys (Dashboard)

**Files**: `messages/de.json`, `messages/en.json`
**Changes**: Neue Keys

```json
{
  "dashboard": {
    "classDistribution": "Klassen",
    "raceDistribution": "Rassen"
  }
}
```

### Success Criteria:

#### Automated Verification:

- [ ] Type checking: `npx tsc --noEmit`
- [ ] Tests: `npx vitest run`
- [ ] Lint: `npm run lint`

#### Manual Verification:

- [ ] Dashboard: Charakter-Grid erscheint vor den Widgets
- [ ] Stats zeigen alle Charaktere (aktiv + inaktiv)
- [ ] Klassen-Karte zeigt Verteilung (z.B. "Fighter 3 · Mage 2")
- [ ] Rassen-Karte zeigt Verteilung (z.B. "Mensch 2 · Elf 1")
- [ ] Localized: Sprache wechseln → Klassen/Rassen in korrekter Sprache

---

## Phase 6: Tests + Polish

### Changes Required:

#### [x] 1. Unit Tests: Notification Helper

**File**: `src/lib/notifications.test.ts` (NEW)

- `createNotification()` ruft `supabase.from("notifications").insert()` korrekt auf
- Alle 6 Notification-Types werden korrekt gehandelt
- `characterId` optional

#### [ ] 2. Unit Tests: Notification Bell

- Unread-Count wird korrekt angezeigt
- "Alle gelesen" markiert alle als gelesen
- Leerer Zustand zeigt "Keine Benachrichtigungen"

#### [ ] 3. E2E Tests

**File**: `e2e/notifications.spec.ts` (NEW)

- Bell-Icon im Sidebar sichtbar
- Bell-Icon im Mobile More-Panel sichtbar
- Dropdown öffnet/schließt bei Click

#### [ ] 4. E2E Tests: Trading

**File**: `e2e/trading.spec.ts` (NEW)

- Send-Button im Play Mode Inventar sichtbar
- Send-Gold-Button in Coin Purse sichtbar
- Send-Dialog öffnet mit Charakter-Auswahl

#### [x] 5. Format + Lint

- `npm run format`
- `npm run lint`
- `npx vitest run`

### Success Criteria:

#### Automated Verification:

- [ ] All tests pass: `npx vitest run`
- [ ] E2E tests pass: `npx playwright test`
- [ ] Type checking: `npx tsc --noEmit`
- [ ] Lint: `npm run lint`
- [ ] Format: `npm run format:check`

---

## Testing Strategy

### Unit Tests:

- `createNotification()` — korrekte DB-Inserts für alle 6 Types
- Notification-Text-Rendering aus i18n-Keys + Details
- Dashboard Stats-Berechnung mit aktiven + inaktiven Chars
- Gold-Transfer-Validierung (nicht mehr senden als vorhanden)

### Integration Tests:

- GM Item Injection → Notification wird erstellt
- Party Distribution → Notification wird erstellt
- Character Trading → Items korrekt übertragen + Notification

### E2E Tests:

- Notification Bell: sichtbar, Dropdown öffnet, Mark-all-read
- Trading: Send-Button, Dialog, Charakter-Auswahl
- Dashboard: Layout-Reihenfolge, Stats, Klassen/Rassen

### Manual Testing Steps:

1. GM Dashboard: Item/Gold an Charakter senden → In anderem Browser als Spieler einloggen → Bell-Badge prüfen
2. Play Mode: Item an anderen Charakter senden → Empfänger-Inventar prüfen
3. Play Mode: Gold senden → Sender-Geldbörse dekrementiert, Empfänger inkrementiert
4. Dashboard: Inaktiven Charakter anlegen → Stats-Zahlen prüfen
5. Mobile: Bell im More-Panel, Send-Buttons im Play Mode

## Performance Considerations

- Notification-Query ist indiziert auf `(user_id, is_read)` — schnell für Unread-Count
- Realtime-Subscription nur auf eigene Notifications (RLS filtert serverseitig)
- Dashboard: Eine zusätzliche Query (inaktive Chars) — vernachlässigbar bei max 10 Usern
- Notification-Dropdown: Max 20 Items geladen, kein Infinite Scroll nötig
- Trading: Einzelne Item-Transfers, keine Batch-Operationen

## Migration Notes

- Migration `00177` muss via `npx supabase db push` ausgeführt werden
- Keine Datenmigration nötig (neue Tabelle, leer)
- Realtime-Aktivierung für `notifications` in der Migration enthalten
- Bestehende Flows (GM Actions, Party Dialoge) werden nur erweitert, nicht geändert

## References

- GM Dashboard Realtime Pattern: `src/components/master/master-dashboard.tsx:55-132`
- Party Item Distribution Pattern: `src/components/party/distribute-item-dialog.tsx:45-149`
- Party Gold Distribution Pattern: `src/components/party/distribute-gold-dialog.tsx:44-108`
- Play Mode Inventory: `src/components/play-mode/play-inventory-panel.tsx`
- Play Mode Coin Purse: `src/components/play-mode/play-coin-purse-panel.tsx`
- Navigation Registry: `src/lib/navigation.ts`
- Sidebar: `src/components/app-sidebar.tsx`
- Mobile Nav: `src/components/app-nav.tsx`
- Dashboard: `src/app/dashboard/page.tsx`
