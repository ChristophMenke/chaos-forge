---
date: 2026-04-08T14:47:19+00:00
git_commit: 84dd469
branch: feature/polish-and-fixes
topic: "NPC-Panel Redesign im Bestiary-Stil + Chronicle Spalten-Fix"
tags: [plan, master-dashboard, npcs, bestiary, chronicle, ui]
status: draft
---

# NPC-Panel Redesign im Bestiary-Stil + Chronicle Spalten-Fix

## Overview

Das NPC-Panel im GM-Dashboard wird visuell auf das Niveau des Monster-Bestiary-Panels gehoben. Das Bestiary dient als direkte Vorlage für Grid/List-View, Sortierung, Paginierung, generierte SVG-Avatare und farbkodierte Stats. Zusätzlich wird das 3-Spalten-Layout der Chronicle-Seite gleichmäßig verteilt.

## Current State Analysis

**NPC Panel** (`src/components/master/master-npcs-panel.tsx`):

- Nur Suche, kein Sortieren/Filter/Paginieren
- Einfache GlassCards ohne Bilder/Avatare
- Inline-Expand statt Detail-Modal
- Kein visuelles Unterscheidungsmerkmal zwischen NPCs
- CRUD funktioniert über Server Actions

**Monster Bestiary** (`src/components/master/master-bestiary-panel.tsx`):

- Grid/List-Toggle, Sortierung (5 Kriterien), 3 Filter, Paginierung
- Generierte SVG-Avatare, farbkodierte Stats, Detail-Modal
- GlassCards mit hover:scale Transition

**Chronicle** (`src/app/sessions/page.tsx:103`):

- Layout: `grid-cols-[1fr_300px_300px]` — ungleichmäßig

### Key Discoveries:

- Bestiary `monsterAvatar()` generiert deterministische SVG-Avatare per Name-Hash → direkt adaptierbar für NPCs
- E2E-Tests nutzen `data-testid` Attribute wie `gm-npc-card-*`, `gm-npc-search`, `gm-npc-create` etc. — diese müssen erhalten bleiben
- NPC-Daten haben genug Felder für visuelle Aufwertung (tier, level, ac, hp, thac0, location, class_ids)
- Zwei NPC-Typen: "Normal" (chronicle_npcs) und "Advanced/Full" (characters mit is_npc=true)

## Desired End State

Das NPC-Panel sieht visuell wie das Bestiary aus:

- Grid-View mit Avatar-Cards als Default, umschaltbar auf List-View
- Sortier-Bar (Name, Location, Level)
- Filter nach Tier (Normal/Advanced/All) + Sichtbarkeit
- Paginierung bei >24 NPCs
- SVG-Avatare mit deterministischem Farbschema und NPC-Silhouetten
- Farbkodierte Stat-Row (AC amber, HP red, Level sky) auf Advanced-NPCs
- Detail-Modal mit allen Infos + Edit/Delete/Visibility Actions
- CRUD-Buttons in Header beibehalten

Chronicle: Alle 3 Spalten gleich breit.

### UI Mockups

**NPC Grid Card (Normal):**

```
┌─────────────────────┐
│  ┌───────────────┐   │
│  │   SVG Avatar  │   │
│  │  (Person-     │   │
│  │   silhouette) │   │
│  │  ▓▓▓▓▓▓▓▓▓▓▓ │   │
│  │  NPC NAME     │   │
│  └───────────────┘   │
│  📍 Berrybuck Castle │
│  👁 Visible          │
└─────────────────────┘
```

**NPC Grid Card (Advanced — mit Stats):**

```
┌─────────────────────┐
│ [★]  ┌───────────┐  │
│      │ SVG Avatar│  │
│      │ (Sword-   │  │
│      │  figure)  │  │
│      │▓▓▓▓▓▓▓▓▓▓│  │
│      │ NPC NAME  │  │
│      └───────────┘  │
│  🛡 AC  ❤️ HP  🎯 Lv│
│  5     45/45   7   │
│  📍 Finnigans Höhlen│
│  👁 Hidden          │
└─────────────────────┘
```

**Filter Bar:**

```
[🔍 Search NPCs...] [Tier ▾] [Sichtbar ▾] [Sort: Name ↑] [⊞ ≡]  [+ Simple] [🛡 Full] [📋 Copy]
```

## What We're NOT Doing

- Keine Avatar-Upload-Funktion für NPCs (nur generierte SVGs)
- Kein Drag-and-Drop Reordering
- Keine Änderungen am NPC-Datenmodell (chronicle_npcs Tabelle bleibt)
- Keine Änderungen an Server Actions (createNpc, updateNpc, deleteNpc bleiben)
- Kein Refactoring der Bestiary-Komponente

## Implementation Approach

Das Bestiary-Panel dient als direkte Code-Vorlage. Wir extrahieren die Avatar-Generierung als shared Utility und adaptieren das gesamte UI-Pattern (Filter/Sort/Paginate/Grid/List/Modal) für die NPC-Datenstruktur. Die bestehende CRUD-Logik wird in das neue UI integriert.

## Architecture and Code Reuse

**Bestehender Code der wiederverwendet wird:**

- `monsterAvatar()` → neue `npcAvatar()` Utility (angepasste Silhouetten)
- `nameToHue()` → 1:1 übernehmen (deterministisches Farbschema)
- GlassCard, Pagination, Grid/List-Toggle — gleiches Pattern
- Farbkodierte Stat-Icons (Shield/amber, Heart/red, Crosshair/sky)

**Neue Shared Utility:**

- `src/lib/utils/svg-avatar.ts` — extrahierte Avatar-Generierung mit konfigurierbaren Silhouetten (für Monster UND NPCs)

**Betroffene Dateien:**

```
src/
  components/master/
    master-npcs-panel.tsx        # Komplettes Redesign (~700 Zeilen)
  lib/utils/
    svg-avatar.ts                # NEU: Shared SVG-Avatar Utility
  app/sessions/
    page.tsx                     # Spalten-Fix (1 Zeile)
messages/
  de.json                        # Neue i18n Keys für NPC-Panel
  en.json                        # Neue i18n Keys für NPC-Panel
```

---

## Phase 1: Chronicle Spalten-Fix

### Overview

Einzeilige CSS-Änderung: Sessions, Quotes und NPCs gleich breit.

### Changes Required:

#### [ ] 1. Gleichmäßiges 3-Spalten-Grid

**File**: `src/app/sessions/page.tsx`
**Changes**: Grid-Template von `[1fr_300px_300px]` auf `3` gleiche Spalten

```tsx
// Zeile 103 — Vorher:
<div className="grid gap-6 lg:grid-cols-[1fr_300px_300px]">
// Nachher:
<div className="grid gap-6 lg:grid-cols-3">
```

### Success Criteria:

#### Automated Verification:

- [ ] Build passes: `npm run build`
- [ ] Type checking passes: `npx tsc --noEmit`

#### Manual Verification:

- [ ] Chronicle-Seite zeigt 3 gleich breite Spalten auf Desktop
- [ ] Mobile-Ansicht stacked weiterhin vertikal

---

## Phase 2: SVG-Avatar Utility extrahieren

### Overview

Die deterministische SVG-Avatar-Generierung aus dem Bestiary wird als shared Utility extrahiert und um NPC-Silhouetten erweitert.

### Changes Required:

#### [ ] 1. Shared SVG-Avatar Utility erstellen

**File**: `src/lib/utils/svg-avatar.ts` (NEU)
**Changes**: `nameToHue()`, `generateSvgAvatar()` mit konfigurierbaren Silhouetten

```typescript
// Silhouetten-Sets
const NPC_SILHOUETTES = {
  normal: "M40 20c-4...",    // Stehende Person
  advanced: "M35 18c-5...",  // Person mit Schwert/Schild
  character: "M38 16c-6...", // Krieger-Figur
};

const MONSTER_SILHOUETTES = { T, S, M, L, H, G }; // Bestehend

export function nameToHue(name: string): number { ... }
export function generateSvgAvatar(name: string, silhouette: string): string { ... }

// Convenience Functions
export function npcAvatar(name: string, tier: "normal" | "advanced" | "character"): string { ... }
export function monsterAvatar(name: string, size: string): string { ... }
```

#### [ ] 2. Bestiary-Panel auf shared Utility umstellen

**File**: `src/components/master/master-bestiary-panel.tsx`
**Changes**: Imports von lokaler `monsterAvatar()` auf shared Utility umstellen

### Success Criteria:

#### Automated Verification:

- [ ] Unit-Tests für `svg-avatar.ts`: deterministische Ausgabe, verschiedene Silhouetten
- [ ] Build passes: `npm run build`
- [ ] Bestiary E2E-Tests bestehen weiterhin

---

## Phase 3: NPC-Panel Redesign — State & Filter-Bar

### Overview

State-Management für Sortierung, Filter, View-Toggle und Paginierung. Filter-Bar UI analog zum Bestiary.

### Changes Required:

#### [ ] 1. State-Management erweitern

**File**: `src/components/master/master-npcs-panel.tsx`
**Changes**: Neue States für viewMode, sortKey, sortDir, tierFilter, visibilityFilter, page

```typescript
type NpcSortKey = "name" | "location" | "level" | "tier";
type SortDir = "asc" | "desc";

const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
const [sortKey, setSortKey] = useState<NpcSortKey>("name");
const [sortDir, setSortDir] = useState<SortDir>("asc");
const [tierFilter, setTierFilter] = useState<"" | "normal" | "advanced" | "character">("");
const [visibilityFilter, setVisibilityFilter] = useState<"" | "visible" | "hidden">("");
const [page, setPage] = useState(0);
```

#### [ ] 2. Unified NPC List — Normal + Advanced zusammenführen

**Changes**: Beide NPC-Typen in einer Liste zusammenführen mit gemeinsamer Sortierung/Filterung

```typescript
type UnifiedNpc =
  { type: "normal"; data: ChronicleNpcRow } | { type: "character"; data: CharacterRow };
```

#### [ ] 3. Filter-Bar UI

**Changes**: Suchfeld + Tier-Filter + Sichtbarkeits-Filter + Sort-Dropdown + Grid/List-Toggle + Create-Buttons

#### [ ] 4. i18n Keys

**Files**: `messages/de.json`, `messages/en.json`
**Changes**: Neue Keys für Tier-Filter, Sortierung, View-Toggle, Paginierung

### Success Criteria:

#### Automated Verification:

- [ ] Build passes: `npm run build`
- [ ] Type checking passes: `npx tsc --noEmit`

---

## Phase 4: NPC Grid Cards

### Overview

Neue NPC-Card-Komponente im Bestiary-Stil mit SVG-Avatar, Stat-Row und Tier-Unterscheidung.

### Changes Required:

#### [ ] 1. NpcGridCard Komponente

**File**: `src/components/master/master-npcs-panel.tsx`
**Changes**: Neue Card-Komponente nach MonsterCard-Vorbild

```tsx
function NpcGridCard({ npc, onSelect, onToggleVisibility }: { ... }) {
  return (
    <GlassCard className="relative overflow-hidden p-0 transition-all hover:scale-[1.01]">
      {/* Visibility indicator — top-right corner */}
      {/* Avatar — square aspect ratio with gradient overlay */}
      {/* Name overlay at bottom of image */}
      {/* Stat row — only for advanced/character NPCs */}
      {/* Location + Tier badge */}
    </GlassCard>
  );
}
```

- Normal NPCs: Avatar + Name + Location + Sichtbarkeit
- Advanced NPCs: Avatar + Name + Stats (AC/HP/THAC0) + Location
- Character NPCs: Avatar + Name + Level + HP + Location + Manage/Play Links

#### [ ] 2. Grid Layout

**Changes**: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6` (wie Bestiary)

#### [ ] 3. Pagination

**Changes**: PAGE_SIZE = 24, Prev/Next-Buttons (wie Bestiary)

### Success Criteria:

#### Automated Verification:

- [ ] Build passes: `npm run build`
- [ ] `data-testid` Attribute beibehalten: `gm-npc-card-*`, `gm-npc-search`, `gm-npc-create`

#### Manual Verification:

- [ ] NPC-Panel zeigt Grid mit Avatar-Cards
- [ ] Normal vs Advanced NPCs visuell unterscheidbar
- [ ] Paginierung funktioniert bei >24 NPCs

---

## Phase 5: NPC List View

### Overview

Tabellen-Ansicht analog zur Bestiary List-View mit sortierbaren Spaltenheadern.

### Changes Required:

#### [ ] 1. NpcListView Komponente

**File**: `src/components/master/master-npcs-panel.tsx`
**Changes**: Tabelle mit Spalten: Avatar+Name, Location, Tier, Level, AC, Sichtbarkeit, Actions

```tsx
function NpcListView({ npcs, sortKey, sortDir, onSort, onSelect }: { ... }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr>{/* Sortierbare Header wie Bestiary */}</tr>
      </thead>
      <tbody>
        {npcs.map(npc => <tr>...</tr>)}
      </tbody>
    </table>
  );
}
```

### Success Criteria:

#### Automated Verification:

- [ ] Build passes: `npm run build`

#### Manual Verification:

- [ ] List-View zeigt sortierbare Tabelle
- [ ] Grid/List-Toggle wechselt korrekt zwischen Ansichten

---

## Phase 6: NPC Detail-Modal + CRUD Integration

### Overview

Detail-Modal ersetzt Inline-Expand. Enthält alle NPC-Infos + Edit/Delete/Visibility-Aktionen. Create/Edit-Form wird als Modal statt Inline gerendert.

### Changes Required:

#### [ ] 1. NpcDetailModal Komponente

**File**: `src/components/master/master-npcs-panel.tsx`
**Changes**: Modal mit NPC-Details, Edit/Delete/Visibility-Buttons

```tsx
function NpcDetailModal({ npc, onClose, onEdit, onDelete, onToggleVisibility }: { ... }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <GlassCard className="w-full max-w-2xl p-6">
        {/* Avatar + Name Header */}
        {/* Stats Grid (wenn advanced) */}
        {/* Description, Equipment, Spell Notes */}
        {/* Action Buttons: Edit, Delete, Visibility Toggle */}
        {/* Manage/Play Links (wenn character NPC) */}
      </GlassCard>
    </div>
  );
}
```

#### [ ] 2. Create/Edit als Modal

**Changes**: NpcForm wird im Modal gerendert statt inline

#### [ ] 3. Copy-from-Character Picker im Modal

**Changes**: Copy-Picker als eigenständiges Modal

### Success Criteria:

#### Automated Verification:

- [ ] Build passes: `npm run build`
- [ ] E2E-Tests bestehen: `npx playwright test e2e/master.spec.ts`
- [ ] Lint passes: `npm run lint`

#### Manual Verification:

- [ ] Klick auf NPC-Card öffnet Detail-Modal
- [ ] Edit/Delete/Visibility im Modal funktioniert
- [ ] "Simple NPC" und "Full NPC" Erstellung funktioniert
- [ ] Copy from Character funktioniert
- [ ] NPC-Suche filtert korrekt
- [ ] Sortierung funktioniert in beiden Ansichten

---

## Phase 7: E2E Test Updates

### Overview

Bestehende E2E-Tests für NPC-Panel anpassen an neues UI (Modal statt Inline, neue Filter-Elemente).

### Changes Required:

#### [ ] 1. NPC E2E Tests anpassen

**File**: `e2e/master.spec.ts`
**Changes**: Test-Selektoren für neues Modal-basiertes UI anpassen

- `gm-npc-card-*` Klick öffnet jetzt Modal statt Expand
- Edit/Delete im Modal statt auf der Card
- Neue Tests für Grid/List-Toggle, Sortierung

### Success Criteria:

#### Automated Verification:

- [ ] Alle E2E-Tests bestehen: `npx playwright test e2e/master.spec.ts`
- [ ] Lint passes: `npm run lint`
- [ ] Format passes: `npm run format:check`

---

## Testing Strategy

### Unit Tests:

- `svg-avatar.ts`: Deterministischer Output, verschiedene Silhouetten, Caching
- Sortierung/Filterung der unified NPC-Liste

### E2E Tests (bestehend, angepasst):

- NPC erstellen (Simple + Full)
- NPC Sichtbarkeit togglen
- NPC suchen
- NPC bearbeiten/löschen
- Copy from Character

### E2E Tests (neu):

- Grid/List-Toggle
- Sortierung (Name, Location)
- Detail-Modal öffnen/schließen

### Manual Testing Steps:

1. GM-Dashboard öffnen → NPCs-Tab → Grid-View mit Avatar-Cards prüfen
2. Grid/List-Toggle testen — beide Ansichten korrekt
3. Sortierung wechseln — Reihenfolge ändert sich
4. NPC suchen — Filter funktioniert
5. NPC-Card klicken → Detail-Modal öffnet
6. Im Modal: Edit, Delete, Visibility Toggle testen
7. Simple NPC erstellen → erscheint im Grid
8. Full NPC erstellen → Redirect zum Wizard
9. Copy from Character → NPC-Kopie erscheint
10. Chronicle-Seite → 3 gleich breite Spalten

## Performance Considerations

- SVG-Avatar-Cache (wie bei Bestiary: `avatarCache = new Map()`) — vermeidet Re-Generierung bei jedem Render
- Client-seitige Paginierung (PAGE_SIZE = 24) — keine DB-Änderung nötig
- `useMemo` für gefilterte/sortierte Liste

## Migration Notes

- Keine DB-Migration nötig
- Keine API-Änderungen
- Bestehende `data-testid` Attribute werden beibehalten oder gezielt migriert in Phase 7

## References

- Research: `docs/agents/research/2026-04-08-npc-panel-vs-bestiary-comparison.md`
- Bestiary (Referenz-UI): `src/components/master/master-bestiary-panel.tsx`
- NPC Panel (aktuell): `src/components/master/master-npcs-panel.tsx`
- Chronicle Layout: `src/app/sessions/page.tsx:103`
