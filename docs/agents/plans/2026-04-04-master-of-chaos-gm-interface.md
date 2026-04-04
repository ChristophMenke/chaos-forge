---
date: 2026-04-04T13:10:23.676337+00:00
git_commit: ac2641021318019a30d443964bca639e7185fe1a
branch: main
topic: "Master of Chaos — GM Interface"
tags: [plan, master, gm, realtime, supabase]
status: draft
---

# Master of Chaos — GM Interface Implementation Plan

## Overview

Dedicated Game Master (GM) interface at `/master` with PIN-protected access, tactical party overview (AC, THAC0, HP, Saves, Thief Skills), Supabase Realtime for live HP updates, and item injection (Waffen/Rüstungen → Charakter oder Party-Inventar). Mobile-first design optimiert für iPhone XR (414×896).

## Current State Analysis

- **Auth:** Cookie-basiert via Supabase, kein Rollen-System. `requireAuth()` redirected zu `/login`.
- **Realtime:** Nicht verwendet — alle Daten server-side oder client-query.
- **Party-Übersicht:** Dashboard-Widget zeigt public + shared Characters mit Mini-HP-Bars.
- **Item-Injection:** Party-Inventar hat add/distribute Pattern. Character-Equipment nutzt `character_equipment` Junction Table.
- **Navigation:** `/master` wird NICHT in NAV_ITEMS aufgenommen (versteckte Route).

### Key Discoveries:

- Play Mode `play-mode.tsx` (919 Zeilen) berechnet alle abgeleiteten Werte (THAC0, Saves, AC etc.) — diese Logik muss in den GM extrahiert/wiederverwendet werden
- `GlassCard`, `HpBar`, `LevelBadge` sind gut wiederverwendbar
- Service Role Key existiert bereits als `SUPABASE_SERVICE_ROLE_KEY` in `.env.local.example`
- `character_classes` Query ist bereits unscoped im Dashboard (für alle sichtbaren Characters)

## Desired End State

### Mobile-First Taktische Übersicht (iPhone XR 414×896)

```
┌─────────────────────────────┐
│  ⚔ Master of Chaos    [🔓] │  ← Header (Glassmorphism)
├─────────────────────────────┤
│ [Party] [Items]             │  ← Tab-Navigation (Pill-Style)
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ 👤 Larry        Lv 5   │ │  ← Character Card (GlassCard)
│ │ ████████░░  HP: 38/45  │ │  ← HP Bar mit Pulse <25%
│ │ AC: 1  THAC0: 16       │ │
│ │                         │ │
│ │ Saves:                  │ │
│ │ Para 11 Rod 13 Pet 12  │ │
│ │ Bre  13 Spl 14         │ │
│ │                         │ │
│ │ Perception: 12          │ │
│ │                         │ │
│ │ Thief: PP 45 OL 55     │ │  ← Nur wenn Thief Skills > 0
│ │   MS 60 HS 55 CW 80    │ │
│ │   DN 40 RL 20 FT 35    │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 👤 Sprocket     Lv 4   │ │  ← Nächster Character
│ │ ...                     │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤  ← Items Tab (wenn ausgewählt)
│ 🔍 [Suche Waffen/Rüstung] │
│                             │
│ Langschwert     1d8/1d12   │
│   [→ Larry] [→ Party]     │
│                             │
│ Kettenpanzer    AC 5       │
│   [→ Sprocket] [→ Party]  │
└─────────────────────────────┘
```

### Desktop Layout (≥1024px)

```
┌──────────────────────────────────────────────────────────────┐
│  ⚔ Master of Chaos                                    [🔓]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│ │   Larry    │ │  Sprocket  │ │   Varek    │ │  Caynorn   │ │
│ │   Lv 5    │ │   Lv 4    │ │   Lv 3    │ │   Lv 6    │ │
│ │ HP 38/45  │ │ HP 22/28  │ │ HP 15/20  │ │ HP 42/50  │ │
│ │ AC 1      │ │ AC 4      │ │ AC 6      │ │ AC 2      │ │
│ │ THAC0 16  │ │ THAC0 19  │ │ THAC0 20  │ │ THAC0 15  │ │
│ │           │ │           │ │           │ │           │ │
│ │ Saves:    │ │ Saves:    │ │ Saves:    │ │ Saves:    │ │
│ │ P11 R13   │ │ P13 R15   │ │ P14 R16   │ │ P10 R12   │ │
│ │ T12 B13   │ │ T14 B16   │ │ T15 B17   │ │ T11 B13   │ │
│ │ S14       │ │ S16       │ │ S17       │ │ S13       │ │
│ │           │ │           │ │           │ │           │ │
│ │ Perc: 12  │ │ Perc: 14  │ │ Perc: 10  │ │ Perc: 11  │ │
│ │           │ │           │ │           │ │           │ │
│ │ Thief:    │ │           │ │ Thief:    │ │           │ │
│ │ PP45 OL55 │ │           │ │ PP30 OL40 │ │           │ │
│ │ MS60 HS55 │ │           │ │ MS45 HS50 │ │           │ │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │  Item Injection                         🔍 [Suche...]   │ │
│ │  Langschwert  1d8/1d12  [→Larry] [→Sprocket] [→Party]  │ │
│ │  Kettenpanzer AC 5      [→Larry] [→Sprocket] [→Party]  │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Verification:

- PIN-Gate blockiert Zugriff ohne korrekten 6-stelligen PIN
- Alle aktiven Charaktere der Gruppe werden angezeigt (bypass RLS)
- HP-Änderungen im Play Mode erscheinen in <2s im GM-Dashboard
- Items können per Button an Charaktere oder Party-Inventar gepusht werden
- Mobile (iPhone XR): Alles einhändig bedienbar, kein horizontales Scrollen
- i18n: DE + EN vollständig

## What We're NOT Doing

- **Kein Initiative-Tracker** — das ist ein eigenes Feature
- **Kein Würfel-Roller** — der DM hat physische Würfel
- **Keine GM-Notizen** — der DM nutzt eigene Tools dafür
- **Kein Encounter Builder** — außerhalb des Scope
- **Keine Profil-Rolle "GM"** — PIN-basiert, nicht User-basiert
- **Kein Edit von Character-Werten** — nur Read + Item Injection
- **Keine Spell-Injection** — nur Waffen, Rüstungen, General Items
- **Keine Anzahl-Angreifer-Tracking** — DM-managed

## Implementation Approach

1. **PIN-Gate als Server Action** — PIN wird gegen `GM_PIN` Env-Var geprüft, bei Erfolg wird ein signierter httpOnly Cookie gesetzt. Kein DB-Roundtrip.
2. **Service Role Supabase Client** — Neuer `createServiceClient()` in `src/lib/supabase/service.ts` für RLS-Bypass. Wird nur in Server Actions/Route Handlers aufgerufen.
3. **Datenberechnung server-side** — Alle abgeleiteten Werte (THAC0, Saves, AC, Perception) werden in einer shared Utility berechnet, die sowohl GM als auch Play Mode nutzen können.
4. **Supabase Realtime** — Client-side Subscription auf `characters` Tabelle für HP-Änderungen. Channel mit Filter auf aktive Characters.
5. **Mobile-First** — Tab-basierte Navigation (Party / Items), vertikale Card-Liste, Touch-optimierte Buttons (min 44px).

## Architecture and Code Reuse

### Bestehende Components (Reuse)

- `GlassCard` — Container für Character-Cards und Panels
- `HpBar` — HP-Anzeige mit Pulse-Effekt
- `LevelBadge` — Hexagonales Level-Badge
- `AvatarDisplay` — Character-Avatar
- `localized()` — Bilingual Text-Auswahl
- Rules Engine: `getMulticlassSaves()`, `calculateAC()`, `getThac0()`, `getAttacksPerRound()`

### Neue Utilities (Extract from Play Mode)

- `computeCharacterCombatData()` — Berechnet THAC0, AC, Saves, Perception aus CharacterRow + Classes + Equipment + Epic Items. Extrahiert die Logik aus `play-mode.tsx` in eine wiederverwendbare Funktion.

### Supabase Service Client (Neu)

```typescript
// src/lib/supabase/service.ts
import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

### File Tree

```
src/
  app/
    master/
      page.tsx                    # NEW — Server Component: Auth + PIN-Gate + Data Fetching
      actions.ts                  # NEW — Server Actions: PIN-Validierung, Item-Injection
  components/
    master/
      master-pin-gate.tsx         # NEW — PIN-Eingabe UI (6 Digits, Numpad-optimiert)
      master-dashboard.tsx        # NEW — Client Component: Realtime + Tab-Navigation
      master-party-panel.tsx      # NEW — Character-Cards Grid mit Live-HP
      master-character-card.tsx   # NEW — Kompakte Character-Card (AC, THAC0, HP, Saves, Thief)
      master-items-panel.tsx      # NEW — Item-Suche + Injection
      master-inject-dialog.tsx    # NEW — Dialog: Ziel-Charakter oder Party wählen
  lib/
    supabase/
      service.ts                  # NEW — Service Role Client
    rules/
      character-computed.ts       # NEW — Shared Berechnungslogik (THAC0, AC, Saves, Perception)
messages/
  de.json                         # UPDATE — master.* Keys
  en.json                         # UPDATE — master.* Keys
.env.local.example                # UPDATE — GM_PIN hinzufügen
```

---

## Phase 1: PIN-Gate + Service Client + Grundstruktur

### Overview

PIN-geschützter Zugang zur `/master` Route. Server Action validiert PIN gegen Env-Var, setzt httpOnly Cookie. Service Role Client für RLS-Bypass.

### Changes Required:

#### [ ] 1. Environment Variable

**File**: `.env.local.example`
**Changes**: `GM_PIN` hinzufügen

```
GM_PIN=000000
```

#### [ ] 2. Service Role Client

**File**: `src/lib/supabase/service.ts` (NEW)
**Changes**: Factory für Supabase Client mit Service Role Key

```typescript
import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

#### [ ] 3. Server Actions (PIN + Cookie)

**File**: `src/app/master/actions.ts` (NEW)
**Changes**: `verifyPin()` Server Action — prüft PIN gegen `GM_PIN`, setzt signiertes httpOnly Cookie `gm_session` mit 24h Expiry. `checkGmSession()` prüft ob Cookie gültig.

```typescript
"use server";
import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "gm_session";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

function signToken(pin: string): string {
  const secret = process.env.GM_PIN!;
  return crypto.createHmac("sha256", secret).update("gm-authenticated").digest("hex");
}

export async function verifyPin(pin: string): Promise<{ success: boolean }> {
  if (pin !== process.env.GM_PIN) return { success: false };
  const token = signToken(pin);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/master",
  });
  return { success: true };
}

export async function checkGmSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const expected = signToken(process.env.GM_PIN!);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
```

#### [ ] 4. PIN-Gate UI Component

**File**: `src/components/master/master-pin-gate.tsx` (NEW)
**Changes**: 6-Digit PIN-Eingabe mit Auto-Submit. Mobile-optimiert: große Numpad-Buttons (min 56px), zentriertes Layout. Glassmorphism Design.

```
┌─────────────────────────────┐
│                             │
│      ⚔ Master of Chaos     │
│                             │
│   Gib den 6-stelligen PIN  │
│   ein, um fortzufahren.    │
│                             │
│      [ _ _ _ _ _ _ ]       │  ← 6 einzelne Digit-Felder
│                             │
│      [  Entsperren  ]      │
│                             │
│   ❌ Falscher PIN           │  ← Nur bei Fehler
│                             │
└─────────────────────────────┘
```

- `inputMode="numeric"` für mobiles Numpad
- Auto-Focus auf erstes Feld
- Auto-Submit bei 6. Ziffer
- Shake-Animation bei falschem PIN
- `data-testid="gm-pin-*"`

#### [ ] 5. Master Page (Server Component)

**File**: `src/app/master/page.tsx` (NEW)
**Changes**: Server Component mit `requireAuth()` + `checkGmSession()`. Zeigt PIN-Gate oder Dashboard.

```typescript
export default async function MasterPage() {
  await requireAuth();
  const isGm = await checkGmSession();

  if (!isGm) {
    return <MasterPinGate />;
  }

  // Fetch ALL active characters via Service Role (bypass RLS)
  const service = createServiceClient();
  const [{ data: characters }, { data: allClasses }, ...] = await Promise.all([...]);

  return <MasterDashboard characters={...} />;
}
```

#### [ ] 6. i18n Keys

**Files**: `messages/de.json`, `messages/en.json`
**Changes**: `master.*` Namespace

```json
{
  "master": {
    "title": "Master of Chaos",
    "pinPrompt": "Gib den 6-stelligen PIN ein, um fortzufahren.",
    "pinPlaceholder": "PIN",
    "unlock": "Entsperren",
    "wrongPin": "Falscher PIN. Versuche es erneut.",
    "locked": "Gesperrt",
    "partyTab": "Party",
    "itemsTab": "Items",
    "ac": "RK",
    "thac0": "ETW0",
    "saves": "Rettungswürfe",
    "perception": "Wahrnehmung",
    "thiefSkills": "Diebesfähigkeiten",
    "injectToCharacter": "An {name}",
    "injectToParty": "An Beutekasse",
    "injected": "Item hinzugefügt!",
    "injectFailed": "Fehler beim Hinzufügen.",
    "searchItems": "Waffen & Rüstungen suchen...",
    "noResults": "Keine Ergebnisse.",
    "pickPockets": "TP",
    "openLocks": "SÖ",
    "findTraps": "FE",
    "moveSilently": "LB",
    "hideShadows": "VS",
    "detectNoise": "GE",
    "climbWalls": "KW",
    "readLanguages": "SL",
    "liveIndicator": "Live",
    "damage": "Schaden",
    "weight": "Gewicht",
    "speed": "Geschw.",
    "selectTarget": "Ziel wählen",
    "character": "Charakter",
    "partyInventory": "Beutekasse"
  }
}
```

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — Keine TypeScript-Fehler
- [ ] `npx vitest run` — Alle Unit-Tests grün
- [ ] `npm run lint` — Keine ESLint-Fehler

#### Manual Verification:

- [ ] `/master` zeigt PIN-Gate wenn nicht authentifiziert
- [ ] Korrekter PIN → Dashboard (leere Seite erstmal OK)
- [ ] Falscher PIN → Fehlermeldung mit Shake
- [ ] PIN-Session bleibt über Page-Refresh erhalten
- [ ] Mobile (iPhone XR): Numpad-Eingabe funktioniert, Touch-Targets ≥44px

---

## Phase 2: Character Computed Data Utility

### Overview

Extrahiere die Berechnungslogik für THAC0, AC, Saves, Perception aus `play-mode.tsx` in eine shared Utility `character-computed.ts`. Diese wird sowohl vom GM-Dashboard als auch vom Play Mode genutzt.

### Changes Required:

#### [ ] 1. Character Computed Utility

**File**: `src/lib/rules/character-computed.ts` (NEW)
**Changes**: Pure Function die aus CharacterRow + Classes + Equipment + Epic Items alle abgeleiteten Kampfwerte berechnet.

```typescript
export interface CharacterCombatData {
  thac0: number;
  ac: number;
  saves: SavingThrows;
  perception: number;           // floor((INT + WIS) / 2) + epicPerceptionBonus
  classGroups: ClassGroup[];
  primaryClassGroup: ClassGroup;
  maxLevel: number;
  hpCurrent: number;
  hpMax: number;
  backstabMultiplier: number | null;
  // Thief skills (nach Epic-Penalty)
  thiefSkills: ThiefSkillValues | null;
  // Poison save penalty from epic
  poisonSavePenalty: number;
}

export interface ThiefSkillValues {
  pickPockets: number;
  openLocks: number;
  findTraps: number;
  moveSilently: number;
  hideInShadows: number;
  detectNoise: number;
  climbWalls: number;
  readLanguages: number;
}

export function computeCharacterCombatData(
  character: CharacterRow,
  classes: CharacterClassRow[],
  equipment: CharacterEquipmentWithDetails[],
  epicItems: EpicItemRow[],
  weaponProficiencies: CharacterWeaponProficiencyRow[],
  fightingStyles?: CharacterFightingStyleRow[],
): CharacterCombatData { ... }
```

Die Funktion extrahiert folgende Logik aus `play-mode.tsx`:

- Multiclass THAC0/Saves via `getMulticlassSaves()` / `getMulticlassThac0()`
- AC via `calculateAC()` mit Armor, Shield, DEX, Unarmored Bonus, Epic, Shield Proficiency, Single-Weapon Style
- Perception via `floor((INT + WIS) / 2) + epicPerceptionBonus`
- Thief Skills mit Epic-Penalty via `applyThiefPenalty()`
- Backstab Multiplier via `getBackstabMultiplier()`

#### [ ] 2. Unit Tests

**File**: `src/lib/rules/character-computed.test.ts` (NEW)
**Changes**: Tests für `computeCharacterCombatData()` mit verschiedenen Character-Konfigurationen:

- Einfacher Fighter (kein Thief, keine Epics)
- Multiclass Fighter/Thief (Thief Skills + Backstab)
- Character mit Epic Items (Stat-Overrides, Thief-Penalty)
- Character mit Shield Proficiency
- Character mit Magical Protection (Bracers)

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — Keine TypeScript-Fehler
- [ ] `npx vitest run src/lib/rules/character-computed.test.ts` — Alle Tests grün

**Implementation Note**: Keine manuelle Verifikation nötig — reine Utility ohne UI.

---

## Phase 3: GM Dashboard + Party Panel (Mobile-First)

### Overview

Taktische Party-Übersicht mit allen aktiven Charakteren. Mobile-First mit vertikaler Card-Liste und Tab-Navigation.

### Changes Required:

#### [ ] 1. Master Page — Data Fetching

**File**: `src/app/master/page.tsx`
**Changes**: Service Role Client fetcht ALLE aktiven Characters + zugehörige Daten (Classes, Equipment, Epic Items, Weapon Profs, Fighting Styles). Berechnet `CharacterCombatData` für jeden Character. Übergibt alles an `MasterDashboard`.

```typescript
// Fetch ALL active characters (bypass RLS via Service Role)
const service = createServiceClient();
const [
  { data: characters },
  { data: allClasses },
  { data: allEquipment },
  { data: allEpicItems },
  { data: allWeaponProfs },
  { data: allFightingStyles },
] = await Promise.all([
  service.from("characters").select("*").eq("is_active", true),
  service.from("character_classes").select("*"),
  service.from("character_equipment").select("*, weapon:weapons(*), armor:armor(*)"),
  service.from("epic_items").select("*"),
  service.from("character_weapon_proficiencies").select("*"),
  service.from("character_fighting_styles").select("*"),
]);

// Compute combat data for each character
const partyData = characters.map(char => ({
  character: char,
  classes: allClasses.filter(c => c.character_id === char.id),
  combat: computeCharacterCombatData(char, ..., ...),
}));
```

#### [ ] 2. Master Dashboard (Client Component)

**File**: `src/components/master/master-dashboard.tsx` (NEW)
**Changes**: Tab-basierte Navigation (Party / Items). Supabase Realtime Subscription für HP-Updates. Mobile-First Layout.

```typescript
interface MasterDashboardProps {
  partyData: Array<{
    character: CharacterRow;
    classes: CharacterClassRow[];
    combat: CharacterCombatData;
  }>;
}
```

- **Tab-Navigation**: Pill-Style Tabs wie im Play Mode (Party / Items)
- **Realtime**: `supabase.channel("gm-hp").on("postgres_changes", { event: "UPDATE", table: "characters", filter: "is_active=eq.true" }, ...)` → aktualisiert `hp_current`/`hp_max` im lokalen State
- **Live-Indicator**: Grüner Punkt + "Live" Badge im Header
- **Mobile**: `flex flex-col gap-3 p-3`
- **Desktop**: `grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4`

#### [ ] 3. Master Character Card

**File**: `src/components/master/master-character-card.tsx` (NEW)
**Changes**: Kompakte Character-Card mit allen GM-relevanten Werten.

Layout (Mobile — volle Breite):

```
┌─────────────────────────────────┐
│ [Avatar] Larry           Lv 5  │  ← Avatar + Name + LevelBadge
│ ████████████░░  HP: 38/45      │  ← HpBar (class-colored)
│                                 │
│ RK: 1     ETW0: 16             │  ← AC + THAC0 (große Zahl)
│                                 │
│ Rettungswürfe:                  │
│ Para 11  Stab 13  Verst 12    │  ← 3er Grid
│ Odem 13  Zau  14              │
│                                 │
│ Wahrnehmung: 12                 │
│                                 │
│ Diebesfähigkeiten:              │  ← Nur wenn > 0
│ TP 45  SÖ 55  FE 35  LB 60   │  ← 4er Grid
│ VS 55  GE 40  KW 80  SL 20   │
└─────────────────────────────────┘
```

- `GlassCard` mit `glow={primaryClassGroup}`
- `HpBar` mit class-colored Bar
- `LevelBadge` hexagonal
- `AvatarDisplay` 40×40
- Saving Throws als kompaktes 3-Spalten Grid (Labels abgekürzt)
- Thief Skills als 4-Spalten Grid (nur anzeigen wenn `thiefSkills !== null`)
- Alle Werte read-only
- `data-testid="gm-character-card-{id}"`

#### [ ] 4. Master Party Panel

**File**: `src/components/master/master-party-panel.tsx` (NEW)
**Changes**: Rendert die Character-Cards. Sortiert nach Name.

#### [ ] 5. Supabase Realtime aktivieren

**File**: `supabase/migrations/00170_enable_realtime_characters.sql` (NEW)
**Changes**: Realtime für `characters` Tabelle aktivieren.

```sql
-- Enable Supabase Realtime for characters table (GM Dashboard live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.characters;
```

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — Keine TypeScript-Fehler
- [ ] `npx vitest run` — Alle Unit-Tests grün
- [ ] `npm run lint` — Keine ESLint-Fehler
- [ ] Migration ausführen: `npx supabase db push`

#### Manual Verification:

- [ ] `/master` zeigt nach PIN alle aktiven Charaktere
- [ ] AC, THAC0, HP, Saves, Perception korrekt berechnet
- [ ] Thief Skills nur bei Charakteren mit Diebsfähigkeiten
- [ ] HP-Änderung im Play Mode erscheint in <2s im GM-Dashboard
- [ ] Mobile (iPhone XR): Cards vertikal gestapelt, kein horizontales Scrollen, Touch-Targets ≥44px
- [ ] Desktop: Grid-Layout mit 2-4 Spalten
- [ ] i18n: Labels auf Deutsch und Englisch korrekt

---

## Phase 4: Item Database + Injection

### Overview

Durchsuchbare Waffen/Rüstungen-Liste mit Push-to-Character und Push-to-Party Funktionalität.

### Changes Required:

#### [ ] 1. Item-Injection Server Actions

**File**: `src/app/master/actions.ts`
**Changes**: Erweitern um `injectItemToCharacter()` und `injectItemToParty()` Server Actions.

```typescript
export async function injectItemToCharacter(
  characterId: string,
  itemType: "weapon" | "armor" | "general",
  itemId: string,
  options?: { hitBonus?: number; damageBonus?: number; quantity?: number; customLabel?: string }
): Promise<{ success: boolean; error?: string }> {
  // Verify GM session
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };

  const service = createServiceClient();
  // Insert into character_equipment (weapon/armor) or character_inventory (general)
  ...
}

export async function injectItemToParty(
  itemType: "weapon" | "armor" | "general",
  itemId: string,
  customName?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!(await checkGmSession())) return { success: false, error: "Unauthorized" };

  const service = createServiceClient();
  // Insert into party_loot_items
  ...
}
```

#### [ ] 2. Master Items Panel

**File**: `src/components/master/master-items-panel.tsx` (NEW)
**Changes**: Durchsuchbare Liste von Waffen und Rüstungen. Drei Tabs: Waffen / Rüstungen / Items.

- **Suchfeld**: `inputMode="search"`, Debounce 300ms, `data-testid="gm-item-search"`
- **Ergebnis-Liste**: Max 20 Ergebnisse, scrollbar
- **Pro Item**: Name (localized), Key-Stats (Damage oder AC), Injection-Buttons
- **Mobile**: Vollbreite, Items als vertikale Karten
- **Injection-Buttons**: Dropdown mit Charakter-Auswahl oder "An Beutekasse"

#### [ ] 3. Inject Dialog

**File**: `src/components/master/master-inject-dialog.tsx` (NEW)
**Changes**: Dialog zur Ziel-Auswahl (Charakter oder Party). Zeigt Character-Avatare als Auswahl-Grid.

```
┌─────────────────────────────┐
│  Langschwert zuweisen       │
│                             │
│  [👤 Larry] [👤 Sprocket]  │  ← Character-Auswahl Grid
│  [👤 Varek] [👤 Caynorn]  │
│                             │
│  [📦 An Beutekasse]        │  ← Party-Option
│                             │
│  Bonus: [+0] Hit  [+0] Dmg │  ← Nur bei Waffen
│  Menge:  [1]                │
│                             │
│  [Abbrechen] [Zuweisen]    │
└─────────────────────────────┘
```

#### [ ] 4. Item Data Fetching

**File**: `src/app/master/page.tsx`
**Changes**: Waffen, Rüstungen und General Items parallel mitfetchen und an Dashboard übergeben.

```typescript
const [
  ...,
  { data: weapons },
  { data: armor },
  { data: generalItems },
] = await Promise.all([
  ...,
  service.from("weapons").select("*").order("name"),
  service.from("armor").select("*").order("name"),
  service.from("general_items").select("*").order("name"),
]);
```

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — Keine TypeScript-Fehler
- [ ] `npx vitest run` — Alle Unit-Tests grün
- [ ] `npm run lint` — Keine ESLint-Fehler

#### Manual Verification:

- [ ] Waffen/Rüstungen-Suche findet Items (DE + EN)
- [ ] Item-Injection an Charakter: Item erscheint im Character Sheet
- [ ] Item-Injection an Party: Item erscheint in der Beutekasse
- [ ] Waffen: Hit/Damage-Bonus einstellbar
- [ ] Mobile: Dialog nutzt volle Bildschirmbreite, Touch-Targets ≥44px
- [ ] Erfolgsmeldung nach Injection (Toast)

---

## Phase 5: Polish, Tests & i18n

### Overview

E2E-Tests, Accessibility, finale i18n-Prüfung, Performance-Optimierung.

### Changes Required:

#### [ ] 1. E2E Tests

**File**: `e2e/master.spec.ts` (NEW)
**Changes**: Playwright E2E-Tests für GM Interface:

- PIN-Gate: Falscher PIN → Fehlermeldung
- PIN-Gate: Korrekter PIN → Dashboard sichtbar
- Party-Übersicht: Alle Charaktere angezeigt
- Item-Suche: Ergebnisse filtern
- Responsive: Mobile + Desktop Layout

#### [ ] 2. Accessibility

- `aria-label` auf allen interaktiven Elementen
- `role="tablist"` auf Tab-Navigation
- Kontraste prüfen (WCAG 2 AA)
- Keyboard-Navigation für PIN-Eingabe

#### [ ] 3. Performance

- Items-Liste: Virtualisierung falls > 100 Items (unlikely, aber vorbereiten)
- Realtime: Cleanup-Subscription bei Unmount
- `useMemo` für gefilterte Item-Listen

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit` — Keine TypeScript-Fehler
- [ ] `npx vitest run` — Alle Unit-Tests grün
- [ ] `npm run lint` — Keine ESLint-Fehler
- [ ] `npx playwright test e2e/master.spec.ts` — E2E-Tests grün

#### Manual Verification:

- [ ] Gesamttest auf iPhone XR (Safari): PIN → Dashboard → Items → Injection
- [ ] Gesamttest Desktop (Chrome): Layout, Realtime, Item-Injection
- [ ] i18n: Alle Labels in DE + EN korrekt
- [ ] Accessibility: Keine axe-core Violations

---

## Testing Strategy

### Unit Tests:

- `character-computed.test.ts`: Fighter, Multiclass, Epic Items, Shield Prof, Magical Protection
- `actions.test.ts`: PIN-Validierung (korrekt, falsch, leer), Item-Injection (valid, invalid character)

### E2E Tests:

- PIN-Gate Flow (falsch → korrekt → Session persistent)
- Party-Übersicht Rendering (Charaktere, HP, Saves)
- Item-Suche + Injection
- Responsive Layout (iPhone XR viewport)
- Accessibility (axe-core)

### Manual Testing Steps:

1. PIN eingeben auf iPhone XR → Dashboard öffnet sich
2. HP eines Charakters im Play Mode ändern → Wert aktualisiert sich im GM-Dashboard
3. Waffe suchen → an Larry zuweisen → im Character Sheet prüfen
4. Rüstung suchen → an Beutekasse zuweisen → in Party-Inventar prüfen
5. Sprache auf Englisch wechseln → alle Labels korrekt

## Performance Considerations

- **Service Role Queries**: Alle Character-Daten in einem Server-Side `Promise.all` — max 6 parallele Queries
- **Realtime**: Nur `hp_current`/`hp_max` Änderungen subscribed, nicht alle Spalten
- **Item-Listen**: Client-side Filterung statt DB-Queries bei jedem Tastendruck (Waffen/Rüstungen sind <200 Einträge)
- **Memo**: Character Combat Data wird server-side berechnet, nicht bei jedem Render

## Migration Notes

- Migration 00170: `ALTER PUBLICATION supabase_realtime ADD TABLE public.characters;`
- Keine Schema-Änderungen an bestehenden Tabellen
- `GM_PIN` muss in `.env.local` und auf Vercel gesetzt werden

## References

- Research: `docs/agents/research/2026-04-04-master-of-chaos-gm-interface.md`
- Play Mode Pattern: `src/components/play-mode/play-mode.tsx`
- Dashboard Pattern: `src/app/dashboard/page.tsx`
- Party Injection: `src/components/party/party-items-panel.tsx`
- Supabase Realtime Docs: https://supabase.com/docs/guides/realtime
