---
date: 2026-04-09T13:47:22Z
git_commit: 71e255a
branch: main
topic: "UX/UI/Performance Polish"
tags: [plan, ux, ui, performance, accessibility, visual-enhancement, play-mode, toast, empty-states]
status: draft
---

# UX/UI/Performance Polish — Implementation Plan

## Overview

Umfassendes Polish-Update für Chaos Forge: 22 abgestimmte Verbesserungen in UX, UI, Performance, Accessibility und visueller Aufwertung. Fokus auf Play Mode (Error Feedback, Touch Targets, Performance), visuelle Aufwertung (Avatar-Silhouetten, Empty States, Ambient Textur) und Konsistenz (Padding, Buttons, Loading States, ARIA).

## Current State Analysis

- App ist feature-ready, alle Kern-Features implementiert
- Glassmorphism Design-System konsistent, aber Detailprobleme (Padding, Buttons, Empty States)
- Play Mode hat stille Fehler (console.error only), 24px Touch Targets, keine React-Optimierung
- Kein globales Toast-System, kein Error Boundary
- Avatar-Fallback zeigt nur Initialen
- Empty States sind reiner Text ohne Illustrationen
- Party Loot und Chronicle visuell kahl
- Sonner, Dialog und focus-trap-react nicht installiert

### Key Discoveries:

- `src/components/ui/` hat kein `dialog.tsx` und kein `sonner.tsx` — beides muss via shadcn CLI hinzugefügt werden
- `src/lib/gemini/client.ts` existiert für KI-Bildgenerierung (hat keinen `server-only` Guard)
- Bestehende Lazy-Loading Pattern in `tab-spells.tsx` (allSpells) kann als Vorlage für Katalog-Loading dienen
- Play Mode hat 9 Panel-Komponenten, keine mit `React.memo`
- Sessions-Seite nutzt `GlassCard` bereits für Session-Cards, aber nicht für Quotes/NPCs
- Custom Dialoge in `party-gold-panel.tsx`, `party-log-panel.tsx`, `play-coin-purse-panel.tsx` sind manuelle `<div>` Overlays ohne Focus-Trap

## Desired End State

- Globales Toast-System für Erfolg/Fehler-Feedback in der gesamten App
- Alle Play Mode Buttons ≥ 36px Touch Target
- Error Boundary fängt unbehandelte Fehler ab
- Avatar-Fallback zeigt Rassen-Silhouette mit Klassengruppen-Symbol
- Illustrierte Empty States auf allen wichtigen Seiten
- Subtile Ambient-Textur auf allen Seiten
- Tooltips erklären AD&D-Mechaniken
- Party Loot und Chronicle visuell aufgewertet
- Konsistente Button-Varianten App-weit
- Swipe-Gesten für Mobile Play Mode
- React.memo/useCallback Optimierungen im Play Mode
- Lazy Loading für Equipment-Kataloge
- Konsistente Padding, Loading Skeletons, Focus-Ring, ARIA Tabs

### Verification:

- `npm test` — alle bestehenden + neuen Tests grün
- `npm run lint` — keine Fehler
- `npm run build` — Production Build erfolgreich
- E2E-Tests (`npm run test:e2e`) — alle bestehend + axe-core auf neuen Seiten
- Visueller Check aller geänderten Seiten auf Desktop + Mobile

## What We're NOT Doing

- SchoolSphereIcon Emoji → Mini-Icons (aufgeschoben, braucht echtes Icon-Design)
- Keyboard Shortcuts für Play Mode (User will nicht)
- Onboarding/Tour für neue Spieler
- `max-w` auf Master Dashboard (eigenes Layout)
- Umbau der Master-Page Spell-Joins (niedrige Priorität)

## Architecture and Code Reuse

### Neue Dependencies

```
npx shadcn@latest add sonner dialog
npm install server-only
```

### Existing Patterns to Reuse

- `GlassCard` component (`src/components/glass-card.tsx`) für konsistente Card-Wrapping
- Lazy Loading Pattern aus `tab-spells.tsx` für Katalog-Loading
- `Tooltip` component (`src/components/ui/tooltip.tsx`) für Mechanics-Tooltips
- `getGenAI()` aus `src/lib/gemini/client.ts` für Bildgenerierung
- `getClassGroup()` aus `src/lib/rules/classes.ts` für Klassengruppen-Zuordnung

### File Tree (affected files)

```
src/
  app/
    layout.tsx                          # + Toaster, ambient bg class
    error.tsx                           # NEW — Error Boundary
    globals.css                         # + ambient texture, focus-ring fix
    dashboard/loading.tsx               # Fix padding
    characters/loading.tsx              # Fix padding
    characters/[id]/play/loading.tsx    # NEW
    characters/[id]/epic/loading.tsx    # NEW
    characters/page.tsx                 # + empty state illustration
    sessions/page.tsx                   # + padding fix, visual upgrade
    party/page.tsx                      # (no change, client component)
    master/loading.tsx                  # Fix layout match
  components/
    ui/
      sonner.tsx                        # NEW (shadcn add)
      dialog.tsx                        # NEW (shadcn add)
    avatar-display.tsx                  # + classGroup/raceId fallback
    play-mode/
      play-mode.tsx                     # Toast, useCallback, memo, swipe, ARIA tabs
      play-combat-panel.tsx             # Touch targets, tooltips, memo
      play-spellbook-panel.tsx          # Touch targets, memo
      play-inventory-panel.tsx          # Touch targets, memo
      play-abilities-panel.tsx          # Touch targets, memo
      play-checks-panel.tsx             # Tooltips, memo
      play-coin-purse-panel.tsx         # → shadcn Dialog, memo
      play-turn-undead-panel.tsx        # memo
      play-magic-items-panel.tsx        # memo
      play-hp-bar.tsx                   # priority prop
    character-sheet/
      character-sheet.tsx               # Dynamic imports for TabEquipment/TabSpells
      tab-equipment.tsx                 # Lazy catalog loading
    party/
      party-gold-panel.tsx              # → shadcn Dialog, visual upgrade
      party-items-panel.tsx             # Visual upgrade, empty state
      party-log-panel.tsx               # → shadcn Dialog, visual upgrade
    session/
      quote-section.tsx                 # Visual upgrade
    character-card.tsx                  # priority prop
  lib/
    gemini/client.ts                    # + server-only
  public/
    images/
      avatars/                          # NEW — 36 silhouette images
      empty-states/                     # NEW — 6 empty state illustrations
      textures/                         # NEW — ambient bg tile
  messages/
    de.json                             # + tooltip strings, empty state strings
    en.json                             # + tooltip strings, empty state strings
```

---

## Phase 1: Foundation — Toast, Error Boundary, Dependencies

### Overview

Installiere Sonner + Dialog, richte das globale Toast-System ein, ersetze stille Fehler im Play Mode, erstelle Error Boundary.

### Changes Required:

#### [ ] 1.1 Dependencies installieren

```bash
npx shadcn@latest add sonner dialog
npm install server-only
```

#### [ ] 1.2 Toaster in Layout einbinden

**File**: `src/app/layout.tsx`

```tsx
import { Toaster } from "@/components/ui/sonner";
// In <body>, nach <SpeedInsights />:
<Toaster richColors position="bottom-right" />;
```

#### [ ] 1.3 Play Mode Error Feedback

**File**: `src/components/play-mode/play-mode.tsx`

- Import `toast` from `sonner`
- `updateCharacter` (line 643): bei Error → `toast.error(t("saveFailed"))`
- `handleCastSpell` (line 672): bei Error → `toast.error(t("spellCastFailed"))`
- `handleRest` (line 706): bei Error → `toast.error(t("restFailed"))`
- Optional: `toast.success` bei erfolgreichem Rest

#### [ ] 1.4 Error Boundary

**File**: `src/app/error.tsx` (NEW)

- `"use client"` mit `reset` + `error` Props
- Dark Fantasy Design mit Glass-Card
- Retry-Button + Link zum Dashboard
- i18n Strings für Fehlermeldung

#### [ ] 1.5 server-only Guard

**File**: `src/lib/gemini/client.ts`

```tsx
import "server-only";
```

#### [ ] 1.6 i18n Strings

**Files**: `messages/de.json`, `messages/en.json`

- `playMode.saveFailed`, `playMode.spellCastFailed`, `playMode.restFailed`
- `error.title`, `error.message`, `error.retry`, `error.backToDashboard`

### Success Criteria:

#### Automated Verification:

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] New unit test: error.tsx renders correctly

#### Manual Verification:

- [ ] Play Mode: HP-Update mit unterbrochener Netzwerkverbindung zeigt Toast
- [ ] Error Boundary: Künstlicher Fehler zeigt Dark Fantasy Error-Seite mit Retry

---

## Phase 2: Touch Targets & Play Mode Performance

### Overview

Vergrößere Touch Targets, optimiere React-Performance mit memo/useCallback/useMemo, füge ARIA Tab-Semantik hinzu.

### Changes Required:

#### [ ] 2.1 Touch Targets vergrößern

**Files**: Alle Play-Mode Panels

- `play-inventory-panel.tsx`: `h-6 w-6 p-0` → `h-8 w-8 p-0` (Quantity +/−)
- `play-spellbook-panel.tsx`: `h-6 shrink-0 px-2` → `h-8 shrink-0 px-2.5` (Cast/Use)
- `play-combat-panel.tsx`: `h-6 shrink-0 px-2` → `h-8 shrink-0 px-2.5` (Details toggle)
- `play-abilities-panel.tsx`: `h-6 shrink-0 px-2` → `h-8 shrink-0 px-2.5` (Reset, Use)

#### [ ] 2.2 React.memo auf alle Play-Panels

**Files**: Alle 9 Panel-Komponenten

```tsx
// Am Ende jeder Panel-Datei:
export const PlayCombatPanel = memo(PlayCombatPanelInner);
// displayName setzen für DevTools
PlayCombatPanel.displayName = "PlayCombatPanel";
```

Betrifft: PlayCombatPanel, PlaySpellbookPanel, PlayChecksPanel, PlayInventoryPanel, PlayCoinPursePanel, PlayTurnUndeadPanel, PlayAbilitiesPanel, PlayMagicItemsPanel, PlayHpBar

#### [ ] 2.3 useCallback auf Play Mode Handlers

**File**: `src/components/play-mode/play-mode.tsx`

- `handleHpChange` → `useCallback` (deps: `character.hp_max`, `hpDelta`)
- `handleCoinChange` → `useCallback` (deps: none beyond `updateCharacter`)
- `handleCastSpell` → `useCallback` (deps: `character.spell_system`, `character.spell_points_used`)
- `handleRest` → `useCallback` (deps: `spells`, `character.spell_system`)

#### [ ] 2.4 useMemo auf panels Array

**File**: `src/components/play-mode/play-mode.tsx`

```tsx
const panels = useMemo(() => [
  { id: "combat", label: t("combat"), icon: <SwordIcon ... /> },
  // ...
], [t, showSpellbook, showTurnUndead, showAbilities, showMagicItems]);
```

#### [ ] 2.5 ARIA Tab-Semantik auf Mobile Pill Nav

**File**: `src/components/play-mode/play-mode.tsx`

- Container: `role="tablist"` + `aria-label={t("panelNavigation")}`
- Buttons: `role="tab"` + `aria-selected={active === panel.id}` + `aria-controls={`panel-${panel.id}`}`
- Panel content: `role="tabpanel"` + `id={`panel-${panel.id}`}` + `aria-labelledby={`tab-${panel.id}`}`

#### [ ] 2.6 Swipe-Gesten für Mobile Panel-Wechsel

**File**: `src/components/play-mode/play-mode.tsx`

- Touch-Event-Handler auf dem Panel-Content-Container
- `onTouchStart`/`onTouchEnd` mit Schwellenwert (min 50px horizontal, max 30px vertikal)
- Swipe rechts → vorheriges Panel, Swipe links → nächstes Panel
- Nur auf Mobile (`sm:hidden` Container)
- `prefers-reduced-motion` respektieren

### Success Criteria:

#### Automated Verification:

- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] New tests: Touch target minimum sizes verified (check className contains h-8 or larger)
- [ ] New tests: ARIA attributes present on pill nav

#### Manual Verification:

- [ ] Mobile: Alle Play Mode Buttons bequem mit Daumen tippbar
- [ ] Mobile: Swipe links/rechts wechselt Panels
- [ ] Screen Reader: Pill Nav wird als Tab-Liste erkannt

---

## Phase 3: Accessibility & Konsistenz

### Overview

Focus-Ring, Padding, Loading Skeletons, Focus-Trap in Dialogen, max-w Container, Button-Varianten.

### Changes Required:

#### [ ] 3.1 Focus-Ring stärker

**File**: `src/app/globals.css`

```css
/* Zeile 152: outline-ring/50 → outline-ring */
* {
  @apply border-border outline-ring;
}
```

#### [ ] 3.2 Padding vereinheitlichen

**Files**:

- `src/app/sessions/page.tsx`: `gap-6 p-6` → `gap-4 p-4 sm:gap-6 sm:p-6`
- `src/components/character-sheet/character-sheet.tsx`: Root-Wrapper `w-full p-4 sm:p-6` → `flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6`
- `src/components/session/session-detail.tsx`: `w-full p-6` → `flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6`

#### [ ] 3.3 Loading Skeletons fixen

**Files**:

- `src/app/dashboard/loading.tsx`: `gap-6 p-6` → `gap-4 p-4 sm:gap-6 sm:p-6`
- `src/app/characters/loading.tsx`: selber Fix
- `src/app/master/loading.tsx`: an MasterDashboard Layout anpassen (Sidebar-Offset)
- `src/app/characters/[id]/play/loading.tsx` (NEW): Play Mode Skeleton mit HP-Bar + Panel-Platzhalter
- `src/app/characters/[id]/epic/loading.tsx` (NEW): Epic Equipment Skeleton

#### [ ] 3.4 Focus-Trap in Custom Dialogen

**Files**: `party-gold-panel.tsx`, `party-log-panel.tsx`, `play-coin-purse-panel.tsx`

- Manuelle `<div>` Overlays durch shadcn `<Dialog>` ersetzen
- `<Dialog open={showDialog} onOpenChange={setShowDialog}>`
- Bestehende Dialog-Inhalte in `<DialogContent>` wrappen
- Focus-Trap und Escape-Handling kommt automatisch via Radix

#### [ ] 3.5 max-w auf Content-Seiten

**Files**: Alle Layout-Dateien für authentifizierte Routes

- In `src/app/dashboard/layout.tsx`, `characters/layout.tsx`, `sessions/layout.tsx`, `party/layout.tsx`:
  Content-Wrapper erhält `max-w-[1600px]` (breit genug für 3-Spalten-Grids, begrenzt Ultrawide)

#### [ ] 3.6 Button-Varianten konsistent machen

**Regel**: Primary (filled gold) = Haupt-CTA pro Seite, Outline = sekundäre Aktionen, Ghost = inline/subtile Aktionen, Destructive = Delete
**Files**:

- `src/app/sessions/page.tsx`: "Add Quote" + "Add NPC" von Ghost/Link → `variant="outline" size="sm"`
- Alle Delete-Buttons prüfen: einheitlich `variant="destructive" size="sm"` oder `variant="ghost"` mit `text-destructive`
- Sessions NPC-Liste: "Edit" → `variant="ghost" size="sm"`, "Delete" → `variant="ghost" size="sm" className="text-destructive"`

### Success Criteria:

#### Automated Verification:

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] New tests: Loading skeletons render
- [ ] New tests: Dialog focus-trap (shadcn Dialog renders with role="dialog")

#### Manual Verification:

- [ ] Tab-Navigation: Focus-Ring deutlich sichtbar auf allen interaktiven Elementen
- [ ] Ultrawide Monitor: Content zentriert, nicht über volle Breite gestreckt
- [ ] Mobile Sessions: Padding kleiner als Desktop
- [ ] Dialoge: Tab bleibt innerhalb des Dialogs gefangen

---

## Phase 4: THAC0/Mechanics Tooltips

### Overview

Tooltips für alle AD&D-Mechaniken im Play Mode, die für Spieler nicht selbsterklärend sind.

### Changes Required:

#### [ ] 4.1 Tooltip-Strings i18n

**Files**: `messages/de.json`, `messages/en.json`

```json
{
  "playMode": {
    "thac0Tooltip": "To Hit Armor Class 0. Würfle d20 — Ergebnis ≥ THAC0 − Gegner-RK = Treffer.",
    "acTooltip": "Rüstungsklasse. Je niedriger, desto besser geschützt.",
    "savingThrowsTooltip": "Rettungswurf — würfle d20, Ergebnis ≥ Zielwert = Erfolg.",
    "paralyzationTooltip": "Gegen Lähmung, Gift und Todesmagie.",
    "rodTooltip": "Gegen Stab-, Ruten- und Zauberstab-Effekte.",
    "petrificationTooltip": "Gegen Versteinerung und Verwandlung.",
    "breathTooltip": "Gegen Drachenodem und Flächeneffekte.",
    "spellTooltip": "Gegen direkte Zauberspruch-Effekte.",
    "perceptionTooltip": "Hausregel: ⌊(INT + WIS) / 2⌋. Würfle d20, Ergebnis ≤ Wert = Erfolg.",
    "backstabTooltip": "Hinterhalt-Schadensmultiplikator bei Überraschungsangriffen."
  }
}
```

#### [ ] 4.2 Tooltips im Play Mode einbauen

**Files**: `play-combat-panel.tsx`, `play-checks-panel.tsx`, `play-hp-bar.tsx`

- Wrap THAC0-Werte in `<Tooltip><TooltipTrigger>...<TooltipContent>{t("thac0Tooltip")}</TooltipContent></Tooltip>`
- AC in PlayHpBar: Tooltip mit Breakdown
- Saving Throws: Tooltip pro Kategorie
- Wahrnehmung: Tooltip mit Hausregel-Formel
- Backstab-Multiplikator: Tooltip

### Success Criteria:

#### Automated Verification:

- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] New tests: Tooltip-Trigger elements present (data-testid)

#### Manual Verification:

- [ ] Desktop: Hover über THAC0 zeigt Erklärung
- [ ] Mobile: Tap auf THAC0 zeigt Erklärung
- [ ] Alle Tooltip-Texte in DE und EN korrekt

---

## Phase 5: Performance — Lazy Loading & Code Splitting

### Overview

Lazy Loading für Equipment-Kataloge, Dynamic Import für große Tabs, priority auf Avatar Images.

### Changes Required:

#### [ ] 5.1 Lazy Loading Equipment-Kataloge

**File**: `src/app/characters/[id]/manage/page.tsx`

- Entferne Server-Side Fetches für: weapons, armor, nonweapon_proficiencies, general_items, magic_items (Zeilen 113-121)
- Übergebe leere Arrays als Props: `allWeapons={[]}` etc.

**File**: `src/components/character-sheet/tab-equipment.tsx`

- Lade Kataloge client-seitig bei erstem Tab-Öffnung (analog `tab-spells.tsx` Pattern)
- `useEffect` mit `loaded` State, fetch bei Mount
- Skeleton-Loading-State während Fetch

#### [ ] 5.2 Dynamic Import für Tab-Komponenten

**File**: `src/components/character-sheet/character-sheet.tsx`

```tsx
import dynamic from "next/dynamic";
const TabEquipment = dynamic(
  () => import("./tab-equipment").then((m) => ({ default: m.TabEquipment })),
  {
    loading: () => <Skeleton className="h-96 w-full rounded-lg" />,
  }
);
const TabSpells = dynamic(() => import("./tab-spells").then((m) => ({ default: m.TabSpells })), {
  loading: () => <Skeleton className="h-96 w-full rounded-lg" />,
});
```

#### [ ] 5.3 priority auf Avatar Images

**Files**:

- `src/components/character-card.tsx`: `<Image ... priority />` auf Avatar
- `src/components/play-mode/play-hp-bar.tsx`: `<Image ... priority />` auf Avatar

### Success Criteria:

#### Automated Verification:

- [ ] `npm run build` passes (bundle size check)
- [ ] `npm test` passes
- [ ] `npm run lint` passes

#### Manual Verification:

- [ ] Character Sheet: Equipment Tab öffnet mit kurzem Skeleton, dann Daten
- [ ] Character Sheet: Stats Tab lädt sofort ohne Equipment/Spell-Daten
- [ ] Lighthouse: LCP verbessert durch priority Avatare

---

## Phase 6: Bildgenerierung — Silhouetten, Empty States, Ambient Textur

### Overview

Generiere alle benötigten Bilder via Gemini API und integriere sie in die App.

### Changes Required:

#### [ ] 6.1 Bildgenerierungs-Script

**File**: `scripts/generate-polish-images.ts` (NEW)
Generiert via Gemini Imagen:

**Rassen-Silhouetten (36 Bilder):**

- 9 Rassen × 4 Klassengruppen
- Prompt-Template: "Dark fantasy silhouette of a [race] [class-symbol], gender-neutral, minimalist, dark purple background matching oklch(0.12 0.02 285), [class-group] symbol overlay, suitable for 80x80px avatar"
- Output: `public/images/avatars/{race}-{classGroup}.webp` (z.B. `elf-wizard.webp`)

**Empty State Illustrationen (6 Bilder):**

- Characters: leere Schmiede/Amboss
- Sessions: leeres Buch/Chronik
- Epic Equipment: leerer arkaner Sockel
- Party Inventory: leere Schatztruhe
- Spell Tab: leeres Zauberbuch
- GM Panels: leerer Thron/Kartentisch
- Prompt: "Dark fantasy illustration, [subject], atmospheric, muted purple-gold color palette, transparent background, 400x300px"
- Output: `public/images/empty-states/{name}.webp`

**Ambient Textur (1 Bild):**

- Tileable Dungeon-Stein-Textur, 256x256px
- Subtil, nicht ablenkend, passt zu oklch(0.12 0.02 285) Hintergrund
- Output: `public/images/textures/dungeon-stone.webp`

#### [ ] 6.2 Avatar-Fallback Integration

**File**: `src/components/avatar-display.tsx`

```tsx
interface AvatarDisplayProps {
  name: string;
  avatarUrl: string | null;
  size?: number;
  className?: string;
  variant?: "circle" | "square";
  raceId?: string; // NEW
  classGroup?: string; // NEW — "warrior" | "priest" | "rogue" | "wizard"
}
```

- Fallback-Kette: avatarUrl → Silhouette (wenn raceId + classGroup) → Initialen
- Silhouette-Pfad: `/images/avatars/${raceId}-${classGroup}.webp`

**Files** die `AvatarDisplay` aufrufen — `classGroup` + `raceId` durchreichen:

- `character-card.tsx`
- `play-hp-bar.tsx`
- `character-sheet.tsx`

#### [ ] 6.3 Empty State Integration

**Files**:

- `src/app/characters/page.tsx`: Illustration über "Noch keine Charaktere"
- `src/app/sessions/page.tsx`: Illustration über "Noch keine Sessions"
- `src/components/epic-equipment/epic-equipment-view.tsx`: Illustration
- `src/components/party/party-items-panel.tsx`: Illustration
- `src/components/character-sheet/tab-spells.tsx`: Illustration
- GM Panels: Illustration in leeren Zuständen

Pattern:

```tsx
<div className="flex flex-col items-center gap-4 py-8">
  <Image
    src="/images/empty-states/forge.webp"
    alt=""
    width={200}
    height={150}
    className="opacity-60"
  />
  <p className="text-lg text-muted-foreground">{t("noCharacters")}</p>
</div>
```

#### [ ] 6.4 Ambient Background Textur

**File**: `src/app/globals.css`

```css
.dark body {
  background-image: url("/images/textures/dungeon-stone.webp");
  background-size: 256px 256px;
  background-repeat: repeat;
  background-blend-mode: soft-light;
  background-color: oklch(0.12 0.02 285);
}
/* Opacity via blend mode — texture adds subtle depth */
```

### Success Criteria:

#### Automated Verification:

- [ ] All 43 images generated and present in `/public/images/`
- [ ] `npm run build` passes
- [ ] `npm test` passes
- [ ] New tests: AvatarDisplay renders silhouette when raceId+classGroup provided

#### Manual Verification:

- [ ] Character ohne Avatar zeigt Rassen-Silhouette statt Initialen
- [ ] Characters-Seite ohne Charaktere zeigt Schmiede-Illustration
- [ ] Subtile Dungeon-Textur auf allen Seiten sichtbar (nicht ablenkend)
- [ ] Empty States auf allen 6 Stellen korrekt

---

## Phase 7: Visual Upgrade — Party Loot & Chronicle

### Overview

Party Loot Seite visuell aufwerten, Chronicle-Seite aufwerten.

### Changes Required:

#### [ ] 7.1 Party Loot Visual Upgrade

**File**: `src/components/party/party-gold-panel.tsx`

- Gold Pool: Münz-Farbcodes für PP (Platin/Silberblau), GP (Gold), EP (Elektrum/Grünlich), SP (Silber), CP (Kupfer/Bronze)
- Farbige Rahmen pro Münztyp statt nackter Inputs
- "Total in GP" prominenter als Badge
- Buttons konsistent (Add/Remove/Distribute als Outline-Buttons)
- Glass-Card Wrapper um den Gold Pool

**File**: `src/components/party/party-items-panel.tsx`

- Items mit Kategorie-Badge (Magic → lila Sparkle, Weapon → rote Sword, Armor → graues Shield, General → neutral)
- Loot Pool als Glass-Card
- Magic Items visuell hervorgehoben (glow-wizard Border)

**File**: `src/components/party/party-log-panel.tsx`

- Activity Log mit farbcodierten Aktionstypen (Add → grün, Remove → rot, Distribute → gold, Send → blau)
- Charakter-Name mit Klassen-Farbe
- Timestamps als relative Zeiten ("vor 5 Min")

#### [ ] 7.2 Chronicle Visual Upgrade

**File**: `src/app/sessions/page.tsx`

- Session-Cards: bereits GlassCard, ggf. Mood-Image Thumbnail wenn vorhanden
- Quotes: dekorative Anführungszeichen (❝❞), Zitatgeber mit Avatar, Pergament-Hintergrund (leichter Sepia-Tint)
- NPCs: Location als farbiger Badge statt "— Location", kompaktere Cards

**File**: `src/components/session/quote-section.tsx`

- Zitat-Karte: `bg-amber-950/20 border-amber-500/20` für Pergament-Feel
- Große dekorative Anführungszeichen oben links
- Charakter-Name mit Avatar (kleiner, inline)

### Success Criteria:

#### Automated Verification:

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes

#### Manual Verification:

- [ ] Party Loot: Münz-Farben sichtbar, Items kategorisiert, Log farbcodiert
- [ ] Chronicle: Zitate mit Pergament-Feel, NPCs mit Location-Badges
- [ ] Beide Seiten Desktop + Mobile getestet

---

## Phase 8: Final Cleanup & Verification

### Overview

Letzte Konsistenz-Checks, fehlende Tests, E2E-Verification.

### Changes Required:

#### [ ] 8.1 Bestehende E2E-Tests prüfen

- `npm run test:e2e` ausführen
- Alle bestehenden Tests müssen grün sein
- Neue axe-core Coverage für Play Mode, Party, Sessions

#### [ ] 8.2 i18n Vollständigkeit prüfen

- Alle neuen Strings in `de.json` und `en.json` vorhanden
- Keine hardcoded deutschen Strings in Komponenten

#### [ ] 8.3 data-testid Coverage

- Alle neuen interaktiven Elemente haben `data-testid`
- Alle neuen Empty States haben `data-testid`

### Success Criteria:

#### Automated Verification:

- [ ] `npm test` — alle Tests grün
- [ ] `npm run lint` — keine Fehler
- [ ] `npm run build` — Production Build erfolgreich
- [ ] `npm run test:e2e` — alle E2E Tests grün
- [ ] `npm run format:check` — Formatting korrekt

---

## Testing Strategy

### Unit Tests:

- Toast: Sonner toast aufrufen bei DB-Fehler (mock supabase)
- Touch Targets: className assertions auf Button-Größen
- React.memo: Re-Render-Count Tests mit React Testing Library
- ARIA: role/aria-selected Attribute auf Pill Nav
- AvatarDisplay: Fallback-Kette (avatar → silhouette → initials)
- Error Boundary: Render mit error + reset Props
- Lazy Loading: Tab-Equipment lädt Kataloge bei Mount

### Integration Tests:

- Play Mode: HP-Änderung re-rendert nur betroffenes Panel (memo verify)
- Character Sheet: Dynamic Import lädt Tab erst bei Klick
- Dialog: Focus bleibt in shadcn Dialog gefangen

### Manual Testing Steps:

1. Play Mode auf Mobile öffnen — Buttons bequem tippbar
2. Swipe links/rechts wechselt Panels
3. HP auf 0 setzen mit unterbrochener Verbindung — Toast erscheint
4. Characters-Seite ohne Charaktere — Illustration sichtbar
5. Party Loot — Gold Pool farbig, Items mit Icons
6. Chronicle — Zitate mit Pergament-Stil
7. Ultrawide Monitor — Content zentriert
8. Tab durch gesamte App — Focus-Ring deutlich sichtbar

## Performance Considerations

- Ambient Textur: 256x256 tile, ~10-20KB, cached nach erstem Load
- Silhouette Images: 36 × ~5KB = ~180KB total, lazy loaded per character
- Empty State Images: 6 × ~20KB = ~120KB, nur geladen wenn Zustand leer
- React.memo: Reduziert Re-Renders von ~8 auf ~1 pro HP-Änderung
- Lazy Kataloge: Spart ~200-500KB initial payload auf Manage-Page
- Dynamic Imports: TabEquipment + TabSpells nur bei Tab-Wechsel geladen

## Migration Notes

- Keine DB-Migration nötig
- Keine Breaking Changes an APIs oder Props (nur Erweiterungen)
- Bestehende Custom Dialoge werden durch shadcn Dialog ersetzt — gleiche Funktionalität, bessere Accessibility

## References

- Research: `docs/agents/research/2026-04-09-ux-ui-performance-audit.md`
- shadcn Sonner: https://ui.shadcn.com/docs/components/sonner
- shadcn Dialog: https://ui.shadcn.com/docs/components/dialog
- WCAG 2.5.5 Target Size: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
- ARIA Tabs Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
