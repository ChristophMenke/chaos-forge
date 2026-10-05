---
date: 2026-10-05T09:46:34+00:00
git_commit: 0b38f9a02fd11f48522e7ab9c4b403e80330ba30
branch: feat/view-mode-setting
topic: "Ansichtsmodus-Einstellung: Automatisch / Mobil / Desktop"
tags: [plan, responsive, tailwind, settings, play-mode]
status: draft
---

# Ansichtsmodus-Einstellung Implementation Plan

## Overview

Ein Galaxy Tab S6 Lite im Hochformat (gemessen 800 × 1165 CSS-px) bekommt heute das Desktop-Layout, weil fast alle Layout-Wechsel bei `sm` (640 px) liegen. Im Play Mode laufen Inhalte dabei über den Rand, der User muss herauszoomen. Wir führen eine **geräteweite Einstellung „Ansicht: Automatisch / Mobil / Desktop“** ein, die die ganze App auf das Handy- bzw. Desktop-Layout zwingt. Zusätzlich beheben wir die Überlauf-Ursache im Play-Mode-Grid, damit „Automatisch“ auf dem Tablet ebenfalls nicht mehr überläuft.

## Current State Analysis

Quelle: `docs/agents/research/2026-10-05-view-mode-setting.md`.

- **Breakpoints:** Das Layout hängt an Tailwinds Default-Breakpoints (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). Weder in `src/app/globals.css` noch anderswo gibt es Overrides. `sm` schaltet Shell (Sidebar ↔ Bottom-Nav), Play Mode (Grid ↔ Tabs) und den Header des Charakterbogens.
- **Tailwind 4.3.3:** Die eingebauten Varianten `sm` bis `2xl` lassen sich per `@custom-variant` überschreiben. Per CLI verifiziert: Mit `:where(...)` bleiben Spezifität und Varianten-Reihenfolge identisch, auch in Kombination mit `hover:` und `dark:`.
- **JS-Breitenprüfungen:**
  - `character-sheet.tsx:163`: `matchMedia("(min-width: 640px)")`, steuert die Avatar-Höhe.
  - `party-page-client.tsx:60`: `useMediaQuery("(min-width: 1024px)")`.
  - `tutorial-overlay.tsx:84,240`: nutzt `innerWidth` nur für Geometrie (Tooltip- und Cutout-Clamping) und ist vom Modus unabhängig.
- **Play-Grid** `play-mode.tsx:895`: `sm:grid-cols-[1fr_1fr] lg:grid-cols-[55%_45%]`.
  - `1fr` hat das Minimum `auto` (min-content), Spalten wachsen also mit breitem Inhalt über den Viewport.
  - `55% + 45% + gap-4` ist breiter als 100 %.
- **Vorbilder:**
  - Theme (`theme-provider.tsx`): `useSyncExternalStore` + localStorage `chaos-forge-theme`, Klasse auf `<html>`.
  - `embed-mode`-Inline-Script in `layout.tsx:82-87`, setzt die Klasse vor dem Paint.
- **Settings** (`settings-client.tsx:284-314`): Abschnitt „Darstellung“ mit Outline-Buttons. Es gibt keine RadioGroup- oder Switch-Komponente.

## Desired End State

- **Einstellungen → Darstellung → „Ansicht“** bietet drei Optionen: Automatisch (Standard), Mobil, Desktop. Die Wahl gilt pro Gerät (localStorage) und sofort, ohne Reload.
- **Mobil:** Alle Breakpoint-Varianten (`sm` bis `2xl`) sind unabhängig von der Breite aus. Die App zeigt überall das Handy-Layout: Bottom-Nav, Play-Tabs, gestapelter Header, schmale Grids.
- **Desktop:** `sm`, also der Layout-Breakpoint für Shell, Play-Grid und Header, ist auch unter 640 px aktiv. `md` bis `2xl` bleiben breitenabhängig. `md` steuert fast nur Textgrößen; erzwungenes `md` würde Inputs auf Handys auf 14 px setzen (`ui/input.tsx:12`), und iOS zoomt beim Fokus solcher Inputs.
- **Automatisch:** verhält sich exakt wie heute.
- **Kein Aufblitzen:** Die Klasse steht vor dem ersten Paint auf `<html>`, auch beim Reload.
- **JS-Breitenprüfungen** im Charakterbogen und auf der Party-Seite folgen dem Modus.
- **Play Mode bei 800 px (Automatisch):** Das 2-Spalten-Grid sprengt die Breite nicht mehr.

## What We're NOT Doing

- Kein Speichern im Nutzerkonto, keine Synchronisation zwischen Geräten.
- Kein Schnellzugriff in Sidebar oder Navigation, nur in den Einstellungen.
- Kein Umbau einzelner Komponenten auf andere Breakpoints. Ausnahme ist die Grid-Ursache im Play Mode.
- Kein Override für `md` bis `2xl` im Desktop-Modus (siehe Desired End State).
- **`max-*`-Varianten** (heute ungenutzt) bleiben breitenbasiert und ignorieren den Modus. Das wird in `CLAUDE.md` dokumentiert.
- **GM-Dashboard und Embed-Seiten:** Die Einstellung gilt pro Browser, also auch für `/master`. Das ist bewusst so, das Dashboard folgt den Varianten automatisch.
- Keine Änderung an der Tutorial-Geometrie und am GM-Dashboard-eigenen Layout außer dem, was sich über die Varianten automatisch ergibt.

## UI Mockups

**Einstellungen → Darstellung (neu: „Ansicht“):**

```
┌─ 🎨 Darstellung ─────────────────────────────────────────────┐
│  [🌙 Theme: Dunkel]   [🌐 Sprache wechseln]                    │
│                                                               │
│  Ansicht                                                      │
│  ┌───────────────┬──────────────┬──────────────┐              │
│  │ ✓ Automatisch │   📱 Mobil   │  🖥 Desktop  │  role=radiogroup
│  └───────────────┴──────────────┴──────────────┘              │
│  Gilt nur für dieses Gerät. „Mobil“ zeigt die Handy-Ansicht   │
│  mit Tabs und unterer Navigation – auch auf Tablets.          │
└───────────────────────────────────────────────────────────────┘
```

**Tablet (800 px) – Charakter spielen:**

```
Automatisch (vorher, läuft über)      Mobil (neu)
┌───────┬──────────────────────…┐    ┌──────────────────────────────┐
│ ▣     │ Kampf      │ Checks   …│→   │ ❤ Larry   TP ████████░ 20/24 │
│ ▣     │ (zu breit) │ (abgeschn.)    │ (Kampf)(Zauber)(Checks)(…)   │
│ ▣     │            │          …│    │ ┌──────────────────────────┐ │
└───────┴──────────────────────…┘    │ │ Kampf-Panel, volle Breite│ │
                                      │ └──────────────────────────┘ │
Automatisch (nachher, Grid-Fix)       │ [🏠] [⚔] [📜] [👥] [⋯]        │
┌───────┬────────────┬───────────┐    └──────────────────────────────┘
│ ▣     │ Kampf      │ Checks    │
│ ▣     │ (umbricht) │ (passt)   │
└───────┴────────────┴───────────┘
```

## Architecture and Code Reuse

```
localStorage "chaos-forge-view-mode" = auto | mobile | desktop
        │
        ├─ Pre-Paint-Script (layout.tsx, vor dem Body-Inhalt) ─┐
        │                                                       ▼
        └─ setViewMode() (Settings) ──► applyViewMode() ──► <html class="… view-mobile | view-desktop">
                                                                │
              globals.css: @custom-variant sm/md/lg/xl/2xl ◄────┘
                 sm: @media(min) & :where(:root:not(.view-mobile) *)  +  :where(:root.view-desktop *)
                 md/lg/xl/2xl: @media(min) & :where(:root:not(.view-mobile) *)

              useBreakpoint("sm" | "lg") ──► matchMedia + Modus (Charakterbogen, Party)
```

- **Reuse:**
  - Store-Muster aus `theme-provider.tsx` (`useSyncExternalStore`, Listener-Set, localStorage) für `useViewMode`.
  - Inline-Script-Muster aus `layout.tsx:82-87`.
  - `useMediaQuery` (`src/lib/hooks/use-media-query.ts`) als Basis von `useBreakpoint`.
- **Keine neue Library.** Tailwind v4 `@custom-variant` mit `@slot`, CSS `:where()`.

Betroffene Dateien:

- `src/lib/view-mode.ts` (neu)
  - `ViewMode`, `VIEW_MODES`, `VIEW_MODE_STORAGE_KEY`, `parseViewMode()`, `viewModeClass()`
  - `getViewMode()`, `setViewMode()`, `subscribeViewMode()`, `applyViewMode()`
  - `VIEW_MODE_INIT_SCRIPT`: String für das Pre-Paint-Script, erzeugt aus denselben Konstanten
- `src/lib/hooks/use-view-mode.ts` (neu): `useViewMode(): [ViewMode, (m) => void]`
- `src/lib/hooks/use-breakpoint.ts` (neu): `useBreakpoint(bp: "sm" | "lg"): boolean`, respektiert den Modus
- `src/app/globals.css`: `@custom-variant sm|md|lg|xl|2xl`
- `src/components/ui/sonner.tsx`: Position im Mobil-Modus
- `src/lib/hooks/use-media-query.ts`: stabiles `subscribe`
- `src/components/play-mode/play-checks-panel.tsx`, `play-combat-panel.tsx`: innere Grids auf `lg`
- `src/app/layout.tsx`: Inline-Script um `VIEW_MODE_INIT_SCRIPT` erweitern
- `src/app/settings/settings-client.tsx`: Abschnitt „Ansicht“ mit `ViewModeSelector`
- `src/components/settings/view-mode-selector.tsx` (neu): Segmented Control (`role="radiogroup"`)
- `src/components/character-sheet/character-sheet.tsx:155-174`: Avatar-Fit über `useBreakpoint("sm")`
- `src/components/party/party-page-client.tsx:60`: `useBreakpoint("lg")` statt `useMediaQuery`
- `src/components/play-mode/play-mode.tsx:895`: Grid-Spalten mit `minmax(0, …)` über die extrahierte Konstante `PLAY_DESKTOP_GRID_CLASS`
- `messages/de.json`, `messages/en.json`: `settings.viewMode*`
- `CLAUDE.md`: Design-System-Abschnitt (Ansichtsmodus), Projektstruktur, Roadmap

## Performance Considerations

- Das zusätzliche CSS ist pro Breakpoint-Utility eine weitere Regel (`:where(:root.view-desktop *)` für sm und md). Das ist vernachlässigbar.
- `:where()` hat Spezifität 0, die Selektor-Prüfung ist trivial.
- Das Inline-Script ist synchron und liest einen localStorage-Eintrag (< 1 ms).

## Migration Notes

- Keine Daten-Migration. Fehlt der localStorage-Eintrag, gilt `auto`, das heutige Verhalten.
- Ist localStorage nicht verfügbar (privater Modus, blockiert), fängt das Script den Fehler ab und belässt `auto`.

---

## Phase 1: Ansichtsmodus-Kern (Store, CSS-Varianten, Pre-Paint, JS-Breakpoints)

Nach dieser Phase funktioniert der Modus vollständig. Gesetzt werden kann er vorerst nur über localStorage, die Oberfläche folgt in Phase 2.

**Tasks**:

- [x] `src/lib/view-mode.ts` anlegen: reine Helfer und Store. **Ohne `"use client"`**, weil das Server-Layout `VIEW_MODE_INIT_SCRIPT` als String importiert. `subscribeViewMode` hört zusätzlich auf das `storage`-Event, damit andere offene Tabs mitziehen.
  ```ts
  export type ViewMode = "auto" | "mobile" | "desktop";
  export const VIEW_MODE_STORAGE_KEY = "chaos-forge-view-mode";
  export function parseViewMode(value: unknown): ViewMode; // ungültig → "auto"
  export function viewModeClass(mode: ViewMode): string | null; // "view-mobile" | "view-desktop" | null
  export function applyViewMode(mode: ViewMode, root = document.documentElement): void;
  export function getViewMode(): ViewMode; // aus localStorage, try/catch
  export function setViewMode(mode: ViewMode): void; // speichern + anwenden + Listener
  export function subscribeViewMode(listener: () => void): () => void;
  export const VIEW_MODE_INIT_SCRIPT: string; // try{…classList.add(...)}catch{}
  ```
- [x] `src/lib/hooks/use-view-mode.ts` anlegen: `useSyncExternalStore(subscribeViewMode, getViewMode, () => "auto")`, gibt `[mode, setViewMode]` zurück.
- [x] `src/lib/hooks/use-breakpoint.ts` anlegen:
  - `useBreakpoint("sm" | "lg")` kombiniert `useMediaQuery` mit `useViewMode()`.
  - `mobile` → immer `false`.
  - `desktop` und `sm` → immer `true`.
  - Sonst gilt die Media Query (640 bzw. 1024 px).
- [x] `src/app/globals.css`: Nach `@custom-variant dark` die fünf Breakpoint-Varianten überschreiben (Werte = Tailwind-Defaults).
  ```css
  @custom-variant sm {
    @media (width >= 40rem) {
      &:where(:root:not(.view-mobile) *) {
        @slot;
      }
    }
    &:where(:root.view-desktop *) {
      @slot;
    }
  }
  /* md: 48rem, lg: 64rem, xl: 80rem, 2xl: 96rem – nur die @media-Regel mit :not(.view-mobile) */
  ```
  Dazu ein Kommentar, warum `:where()` nötig ist (Spezifität und Reihenfolge bleiben wie beim Default).
- [x] `src/app/layout.tsx:82-87`: Das bestehende Inline-Script ruft zusätzlich `VIEW_MODE_INIT_SCRIPT` auf (ein `<script>`, vor dem App-Baum).
- [x] `character-sheet.tsx:155-174`: `matchMedia("(min-width: 640px)")` durch `useBreakpoint("sm")` ersetzen. Der Effekt misst neu, wenn sich der Wert ändert. ResizeObserver bleibt.
- [x] `party-page-client.tsx:60`: `useMediaQuery("(min-width: 1024px)")` → `useBreakpoint("lg")`.
- [x] `src/lib/hooks/use-media-query.ts`: `subscribe` per `useCallback([query])` stabilisieren. Heute entsteht pro Render eine neue Funktion, und React abonniert jedes Mal neu.
- [x] `src/components/ui/sonner.tsx`: Im Modus `mobile` wird `position="top-center"` gesetzt, damit Toasts nicht unter der Bottom-Nav liegen (Sonners eigenes Mobile-Layout greift nur nach Breite).
- [x] `package.json`: `@tailwindcss/node` als devDependency (Version wie `@tailwindcss/postcss`) für den CSS-Test.

**Automated Verification**:

- [x] Unit `src/lib/view-mode.test.ts`:
  - `parseViewMode` akzeptiert die 3 Werte, alles andere ergibt `auto`.
  - `applyViewMode` setzt bzw. entfernt `view-mobile`/`view-desktop` exklusiv und lässt andere Klassen (`dark`, `embed-mode`) unberührt.
  - `setViewMode` speichert in localStorage, wendet an und benachrichtigt Listener.
  - `getViewMode` gibt bei werfendem localStorage `auto` zurück.
  - `VIEW_MODE_INIT_SCRIPT`, per `new Function` ausgeführt, setzt die Klasse für gespeichertes `mobile`, setzt bei `auto` oder ungültigem Wert nichts und wirft nicht, wenn localStorage wirft.
- [x] Unit `src/lib/hooks/use-breakpoint.test.ts`:
  - `mobile` ergibt `false` auch bei passender Media Query.
  - `desktop` ergibt `true` für `sm` auch ohne Match.
  - `desktop` folgt bei `lg` der Media Query.
  - Ein `storage`-Event aus einem anderen Tab aktualisiert den Modus.
  - `auto` folgt der Media Query.
  - Ein Wechsel des Modus rendert neu.
- [x] Unit `src/test/view-mode-css.test.ts`: Kompiliert `globals.css` mit `@tailwindcss/node` und `@source inline("sm:flex md:grid lg:block 2xl:hidden")` und prüft:
  - `.sm\:flex` ist sowohl unter `@media (width >= 40rem)` mit `:where(:root:not(.view-mobile) *)` als auch mit `:where(:root.view-desktop *)` vorhanden.
  - `.md\:grid`, `.lg\:block` und `.2xl\:hidden` haben keine `view-desktop`-Regel.
  - Die Reihenfolge sm < md < lg < 2xl bleibt erhalten.
- [x] Unit `src/test/view-mode-guard.test.ts`, Quelltext-Guard:
  - `src/app/layout.tsx` bindet `VIEW_MODE_INIT_SCRIPT` ein.
  - Außerhalb von `use-media-query.ts`/`use-breakpoint.ts` gibt es in `src/` kein `matchMedia("(min-width` mehr.
- [x] Unit `src/components/ui/sonner.test.tsx`: `mobile` → `top-center`, sonst `bottom-right`.
- [x] `npm run verify` ist grün. Nebenbei behoben: Unter Node ≥ 25 überdeckte Nodes eigener `localStorage`-Getter den von jsdom. `src/test/setup.ts` fällt jetzt auf jsdom zurück, damit läuft auch `print-config.test.ts` lokal grün.
- [x] Browser-Check (Production-Build + Playwright): Die Klasse ist vor `DOMContentLoaded` gesetzt. „Mobil“ bei 1280 px liefert die Handy-Abstände, „Desktop“ bei 400 px die Desktop-Abstände.

---

## Phase 2: Einstellung in `/settings`

[Dependencies: **Phase 1**]

Der User kann den Modus in den Einstellungen wählen.

**Tasks**:

- [ ] `src/components/settings/view-mode-selector.tsx` (neu) anlegen:
  - Segmented Control auf Basis von `@base-ui/react/radio-group` + `radio`; Pfeiltasten und `aria-checked` kommen mit.
  - Icons: Automatisch = `MonitorSmartphone`, Mobil = `Smartphone`, Desktop = `Monitor` (lucide).
  - Optik angelehnt an die Segment-Buttons in `master-bestiary-panel.tsx:496-509`.
  - Nutzt `useViewMode()`, testids `view-mode-auto|mobile|desktop`.
- [ ] `settings-client.tsx:284-314`: Im Abschnitt „Darstellung“ unter den bestehenden Buttons ein Label „Ansicht“, den `ViewModeSelector` und den Hinweistext ergänzen.
- [ ] `messages/de.json` und `messages/en.json`, Namespace `settings`:
  - `viewMode` („Ansicht“ / „View“)
  - `viewModeAuto`, `viewModeMobile`, `viewModeDesktop`
  - `viewModeHint`

**Automated Verification**:

- [ ] Unit `src/components/settings/view-mode-selector.test.tsx`:
  - Initial ist `auto` ausgewählt (`aria-checked`).
  - Ein Klick auf „Mobil“ setzt `view-mobile` auf `<html>` und speichert in localStorage.
  - Pfeil-rechts wechselt auf die nächste Option.
  - Nach erneutem Mount ist der gespeicherte Wert vorausgewählt.
- [ ] `npm run verify` ist grün.

**Manual Verification**:

- [ ] Am PC (Breite > 1280 px):
  1. Einstellungen → Darstellung → „Mobil“ wählen: Die App zeigt sofort Bottom-Nav, Play-Tabs und den gestapelten Header.
  2. Neu laden: Mobil bleibt aktiv, ohne kurz das Desktop-Layout aufblitzen zu lassen.
  3. „Automatisch“ wählen: Alles ist wie vorher.
- [ ] Am Galaxy Tab S6 Lite (Hochformat, 800 px):
  1. „Mobil“ wählen.
  2. Charakter spielen: Die Tabs zeigen ein Panel in voller Breite, kein Rauszoomen nötig.
  3. Charakter verwalten: Der Header ist gestapelt, die Grids sind schmal, die Tabs umbrechen.
- [ ] Am Handy: „Desktop“ wählen. Die Sidebar (Icon-Leiste) und das 2-Spalten-Play-Grid erscheinen, Eingabefelder zoomen beim Antippen nicht. „Automatisch“ stellt das Handy-Layout wieder her.
- [ ] Im Modus „Mobil“ an einem breiten Bildschirm: Toasts erscheinen oben mittig, nicht hinter der Bottom-Nav.

---

## Phase 3: Überlauf-Ursache im Play-Mode-Grid

Unabhängig von Phase 1 und 2. Auch im Modus „Automatisch“ läuft das Grid bei 800 px nicht mehr über.

**Tasks**:

- [ ] `src/components/play-mode/play-mode.tsx:895`: Die Grid-Klassen als exportierte Konstante `PLAY_DESKTOP_GRID_CLASS` extrahieren und die Spalten auf ein Minimum von 0 setzen. Das Verhältnis 55/45 bleibt über `fr`-Anteile erhalten, inklusive Gap.
  ```ts
  export const PLAY_DESKTOP_GRID_CLASS =
    "hidden gap-4 p-4 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]";
  ```
- [ ] Beide Spalten-Container (`:897`, `:962`) bekommen `min-w-0`, damit verschachtelte Flex-Kinder schrumpfen dürfen.
- [ ] Innere Panel-Grids, die bei `sm` von voller Breite ausgehen, im halbbreiten Grid aber zu eng werden, auf `lg` verschieben:
  - `play-checks-panel.tsx:401`: `grid-cols-3 sm:grid-cols-6` → `grid-cols-3 lg:grid-cols-6` (Attributwerte wie „18/00“ in `font-mono text-lg`)
  - `play-combat-panel.tsx:687`: `grid-cols-2 sm:grid-cols-4` → `grid-cols-2 lg:grid-cols-4`
  - Bei 800 px hat eine Spalte ~340 px, ab `lg` (1024 px) ~480 px.

**Automated Verification**:

- [ ] Unit `src/components/play-mode/play-desktop-grid.test.ts`:
  - `PLAY_DESKTOP_GRID_CLASS` enthält für `sm` und `lg` nur Spalten mit `minmax(0,…)`, also kein nacktes `1fr` und keine Prozentwerte.
  - Die Klasse enthält `hidden` und `sm:grid`, damit das Mobile-Verhalten unverändert bleibt.
- [ ] Unit (`play-checks-panel` bzw. `play-combat-panel`, Quelltext-Guard im selben Test): Kein `sm:grid-cols-6` bzw. `sm:grid-cols-4` mehr in den Panels.
- [ ] `npm run verify` ist grün.

**Manual Verification**:

- [ ] Am Galaxy Tab S6 Lite im Modus „Automatisch“: Charakter spielen. Beide Spalten passen in die Breite, kein horizontales Rauszoomen nötig. Lange Werte brechen um oder werden gekürzt.

---

## Abschluss

- [ ] `CLAUDE.md`:
  - Design-System-Abschnitt: „Ansichtsmodus“ mit localStorage-Key, Klassen und überschriebenen Varianten. Hinweise:
    - Neue JS-Breitenprüfungen immer über `useBreakpoint`, nie direkt `matchMedia`.
    - `max-*`-Varianten ignorieren den Modus.
    - Panels im halbbreiten Play-Grid nicht an `sm` hängen.
  - Projektstruktur: `src/lib/view-mode.ts`, `use-view-mode.ts`, `use-breakpoint.ts`.
  - Roadmap-Eintrag 24.
- [ ] Research-Dokument: Status-Notiz mit Verweis auf diesen Plan.

## References

- Research: `docs/agents/research/2026-10-05-view-mode-setting.md`
- Theme-Store-Vorbild: `src/components/theme-provider.tsx:17-57`
- Pre-Paint-Script-Vorbild: `src/app/layout.tsx:82-87`, `src/app/globals.css:549-557`
- Tailwind v4 `@custom-variant`: verifiziert mit `@tailwindcss/cli` 4.3.3 (lokal)
