---
date: 2026-10-05T09:02:54+00:00
git_commit: 0b38f9a02fd11f48522e7ab9c4b403e80330ba30
branch: feat/view-mode-setting
topic: "Ansichtsmodus-Einstellung (Web vs. Mobile) – Responsiveness auf Tablets"
tags: [research, responsive, tailwind, play-mode, character-sheet, settings]
status: complete
---

# Research: Ansichtsmodus-Einstellung (Web vs. Mobile)

> **Status:** Umgesetzt über `docs/agents/plans/2026-10-05-view-mode-setting.md` (Branch `feat/view-mode-setting`).

## Research Question

Auf einem Samsung Galaxy Tab S6 Lite sind „Charakter spielen“ (`/characters/[id]/play`) und „Charakter verwalten“ (`/characters/[id]/manage`) nicht mehr responsiv. Untersucht wird:

- wie die Responsiveness heute umgesetzt ist und wo das Layout an der Viewport-Breite hängt (CSS vs. JS),
- was bei Tablet-Breiten passiert,
- wie `/settings` Einstellungen speichert,
- welche Mechanismen es für eine erzwungene Mobile- oder Desktop-Ansicht gibt.

## Summary

Die Responsiveness ist fast vollständig **CSS-basiert über Tailwind-Breakpoints** mit den Default-Werten: sm 640, md 768, lg 1024, xl 1280 px. Layoutentscheidungen hängen fast ausschließlich an **`sm` (640 px)**. Ab 640 px gilt:

- Play Mode zeigt alle 8 Panels in einem 2-Spalten-Grid statt Tabs.
- Die App-Shell zeigt die linke Icon-Sidebar statt der Bottom-Nav.
- Der Charakterbogen stellt den Header nebeneinander und erhöht die Grid-Spaltenzahl.

`md` wird fast nur für Textgrößen genutzt, `lg` und `xl` kaum.

```
Viewport-Breite (CSS px)     0 ────── 640 ────── 768 ────── 1024 ───── 1280
App-Shell                    Bottom-Nav │ Sidebar 4rem (Icons) ──────│ Sidebar 12rem
Play Mode                    Tabs (1 Panel) │ Grid 2×1fr ─────────────│ Grid 55/45
Charakterbogen-Header        gestapelt │ nebeneinander, Avatar wächst mit
Waffentabelle (Ausrüstung)   Karten ───────────────│ Tabelle
```

**Tablet:** Das Tab S6 Lite hat physisch 1200 × 2000 px. Mit dem für Android-Tablets üblichen devicePixelRatio 1,5 ergibt sich eine CSS-Breite von ~800 px (Portrait) bzw. ~1333 px (Landscape). Der genaue Wert ist nicht verifiziert (siehe Open Questions). Bei ~800 px Portrait gilt:

- `sm` und `md` greifen, das Gerät bekommt also das Desktop-Layout.
- Die 64-px-Sidebar plus `p-4` lassen jeder der beiden Play-Spalten etwa 340 px.
- Darin stehen Panels mit festen `grid-cols-4` bzw. `grid-cols-6` (Geldbörse, Checks, Kampf).

**JS-seitige Viewport-Prüfungen** gibt es nur an drei Stellen: `character-sheet.tsx:163` (Avatar-Höhe, 640 px), `party-page-client.tsx:60` (`useMediaQuery` 1024 px) und `tutorial-overlay.tsx:84,240` (`innerWidth`).

**Einstellungen** werden heute unterschiedlich gespeichert:

- Theme: localStorage `chaos-forge-theme`, pro Gerät.
- Sprache: Cookie `NEXT_LOCALE`, pro Gerät.
- Profildaten: `profiles`-Spalten, pro Nutzer.

Für eine Klassen-gesteuerte Layout-Variante auf `<html>` existiert bereits ein Vorbild: das `embed-mode`-Inline-Script in `layout.tsx:82-87` plus CSS in `globals.css:549-557`.

**Tailwind v4 (4.3.3)** erlaubt es, die eingebauten Breakpoint-Varianten per `@custom-variant sm { … }` zu **überschreiben**. Lokal mit der Tailwind-CLI verifiziert:

- Mit `:where(:root:not(.x) *)` bleiben Spezifität und Varianten-Reihenfolge (sm → md → lg → xl, auch kombiniert mit `hover:`/`dark:`) identisch zum Default.
- Eine zusätzliche Regel `:where(:root.y *)` ohne Media Query aktiviert einen Breakpoint unabhängig von der Breite.

### Schlüsseldateien

```
src/
  app/
    layout.tsx                         # <html class="… dark">, embed-mode-Inline-Script, main pb-16 sm:pb-0
    globals.css                        # @custom-variant dark, keine Breakpoint-Overrides, .embed-mode-Regeln
    characters/layout.tsx              # Shell: sm:flex-row, sm:ml-[4rem] xl:ml-[12rem], max-w-[1600px]
    settings/page.tsx                  # Server: Profil + Spieltermine laden
    settings/settings-client.tsx       # Abschnitte Profil, Darstellung, Spieltermine, Tutorials, Danger Zone
  components/
    app-sidebar.tsx                    # hidden sm:flex, w-16 xl:w-48
    app-nav.tsx                        # Bottom-Nav sm:hidden
    character-mode-nav.tsx             # Labels hidden sm:inline
    theme-provider.tsx                 # useSyncExternalStore + localStorage, Klasse auf <html>
    locale-toggle.tsx                  # NEXT_LOCALE-Cookie + reload
    play-mode/play-mode.tsx            # Tabs sm:hidden vs. Grid hidden sm:grid
    character-sheet/character-sheet.tsx# Header/Grids sm:, matchMedia 640 für Avatar
    character-sheet/tab-equipment.tsx  # Waffen: Tabelle md:block vs. Karten md:hidden
    party/party-page-client.tsx        # useMediaQuery("(min-width: 1024px)")
  lib/hooks/use-media-query.ts         # useSyncExternalStore-Hook
```

## Detailed Findings

### 1. Play Mode (`src/components/play-mode/play-mode.tsx`)

- **Mobile Pill-Tabs** (`:866-892`): `sticky top-[72px] … sm:hidden`, `role="tablist"`, ein Button pro sichtbarem Panel.
- **Desktop-Grid** (`:895`): `hidden gap-4 p-4 sm:grid sm:grid-cols-[1fr_1fr] lg:grid-cols-[55%_45%]`.
  - Linke Spalte: Combat, Spellbook, TurnUndead, Abilities.
  - Rechte Spalte (`:956`): Checks, MagicItems, CoinPurse, Inventory.
- **Mobile Einzelpanel** (`:1015-1021`): `p-3 sm:hidden`, `role="tabpanel"`, Swipe-Handler (`:802-827`, ≥ 50 px horizontal).
- Beide Zweige werden immer gerendert. Die Umschaltung ist reines CSS bei 640 px.
- **Panels:**
  - Feste Grids ohne Breakpoint: `play-coin-purse-panel.tsx:120,198` (`grid-cols-4`), `play-checks-panel.tsx:336` (`grid-cols-4`), `play-combat-panel.tsx:465` (`grid-cols-3`).
  - Grids mit Breakpoint: `play-checks-panel.tsx:401` (`grid-cols-3 sm:grid-cols-6`) und `play-combat-panel.tsx:687` (`grid-cols-2 sm:grid-cols-4`). Mit `sm` springen sie in der schmalen Grid-Spalte auf mehr Spalten.
  - Sonst überwiegend `md:`-Textgrößen (`text-[10px] md:text-xs`).
- **HP-Leiste** `play-hp-bar.tsx:92`: `sticky top-0 … sm:px-4 sm:py-3`.

### 2. Charakterbogen (`src/components/character-sheet/character-sheet.tsx`)

- **Header** (`:725-726`): `flex-col … sm:flex-row sm:justify-between`. Button-Labels sind `hidden sm:inline` (`:881-967`).
- **Avatar** (`:155-174`): `matchMedia("(min-width: 640px)")` plus `ResizeObserver`. Ab 640 px wächst der Avatar auf die Höhe der Infospalte (max. 220 px), sonst bleibt er bei 80 px.
- **Tab-Leiste** (`:1082-1085`): `flex-wrap … sm:justify-center sm:[&>*]:flex-1`, ohne horizontales Scrollen.
- **Grids:** `grid-cols-2 sm:grid-cols-3` (`:1124, 1256, 1898, 1921`), `grid-cols-3 sm:grid-cols-5` (`:1759`), `grid-cols-2 sm:grid-cols-5` (`:1957`).
- **Ausrüstung** `tab-equipment.tsx`:
  - Waffen als Tabelle `hidden overflow-x-auto md:block` (`:1899`), als Karten `md:hidden` (`:2053`).
  - Inventartabelle in `overflow-x-auto` (`:1026`).
- **Zauber** `tab-spells.tsx:765`: `grid-cols-3 sm:grid-cols-5 lg:grid-cols-7`.

### 3. App-Shell

- **`layout.tsx:97`:** `<main … pb-16 sm:pb-0>` (Platz für die Bottom-Nav).
- **Segment-Layouts**, z. B. `characters/layout.tsx:11-15`: `flex-col sm:flex-row`, Inhalt mit `sm:ml-[calc(4rem+…)] xl:ml-[calc(12rem+…)]`, `max-w-[1600px]`. Dasselbe gilt für settings, party, dashboard, sessions und chat.
- **`app-sidebar.tsx:34`:** `fixed … hidden w-16 … sm:flex xl:w-48`. Labels sind `hidden xl:inline`.
- **`app-nav.tsx:40`:** `fixed bottom-0 … sm:hidden`.
- **`character-mode-nav.tsx:72`:** Labels `hidden sm:inline`.

### 4. JS-Viewport-Abfragen (vollständig)

| Datei:Zeile                                              | Mechanismus                   | Query                                           |
| -------------------------------------------------------- | ----------------------------- | ----------------------------------------------- |
| `src/lib/hooks/use-media-query.ts:11-21`                 | Hook (SSR → `false`)          | –                                               |
| `src/components/party/party-page-client.tsx:60`          | `useMediaQuery`               | `(min-width: 1024px)`                           |
| `src/components/character-sheet/character-sheet.tsx:163` | `matchMedia` + ResizeObserver | `(min-width: 640px)`                            |
| `src/components/tutorial/tutorial-overlay.tsx:84,240`    | `window.innerWidth`           | Fallback 1920                                   |
| `src/components/play-mode/play-mode.tsx:805`             | `matchMedia`                  | `prefers-reduced-motion` (nicht layoutrelevant) |

### 5. Tailwind-Setup

- **`globals.css:1-5`:** Importiert `tailwindcss`, `tw-animate-css` und `shadcn/tailwind.css`; dazu `@custom-variant dark (&:is(.dark *));`.
- **Keine Breakpoint-Overrides:** kein `--breakpoint-*`, keine Container Queries (außer shadcn `card.tsx:28`), keine `max-*`-/`min-[…]`-Varianten in `src`.
- **Konfiguration:** Es gibt keine `tailwind.config.*`. `postcss.config.mjs` enthält nur `@tailwindcss/postcss`.
- **Verifiziertes CSS-Ergebnis** (Tailwind 4.3.3, CLI-Test):
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
  ```
  - Erzeugt `.sm\:x:where(…)` mit der gleichen Spezifität wie bisher.
  - Die Reihenfolge `sm` < `md` < `lg` < `xl` bleibt erhalten.
  - Kombinationen wie `sm:hover:` und `dark:sm:` werden korrekt verschachtelt.

### 6. Einstellungen & Persistenz

- **`settings-client.tsx`:** Abschnitte als `GlassCard` mit Icon-Header. Der Abschnitt „Darstellung“ (`:284-314`, `settings-section-appearance`) hat zwei Outline-Buttons: Theme-Toggle (`:291-303`) und Sprach-Toggle (`:134-145`).
- **UI-Bausteine:** Es gibt keine Switch- oder RadioGroup-Komponente in `src/components/ui/`. Vorhanden sind `select.tsx` und `tabs.tsx`.
- **Theme** (`theme-provider.tsx`):
  - Store auf Modulebene, angebunden über `useSyncExternalStore`.
  - localStorage `chaos-forge-theme` wird erst nach der Hydration gelesen (`:46-50`). Bis dahin steht `dark` hart im `<html>` (`layout.tsx:78`, `suppressHydrationWarning`).
  - Es gibt kein Pre-Hydration-Script.
- **Sprache:** Cookie `NEXT_LOCALE` per `document.cookie` und anschließendes `window.location.reload()` (`settings-client.tsx:143`, `locale-toggle.tsx:32`). Gelesen wird es in `src/i18n/request.ts:5-11`.
- **localStorage-Schlüssel:**
  - `chaos-forge-theme`
  - `chaos-forge-print-<characterId>`
  - `chaos-forge-tutorial-dismissed`
- **Pre-Paint-Script-Muster:** `layout.tsx:82-87` setzt `embed-mode` auf `<html>`, bevor der Body-Inhalt geparst wird. Die zugehörigen Regeln stehen in `globals.css:549-557`.
- **i18n-Namespace `settings`** (`messages/de.json`, ab Zeile 1790):
  - Abschnittstitel als `section<Name>`, Hinweise als `<x>Hint`.
  - Darstellung: `theme`, `themeDark`, `themeLight`, `language`.

## Code References

- `src/components/play-mode/play-mode.tsx:866-892`: Mobile-Tabs (`sm:hidden`)
- `src/components/play-mode/play-mode.tsx:895`: Desktop-Grid (`hidden sm:grid … lg:grid-cols-[55%_45%]`)
- `src/components/play-mode/play-mode.tsx:1015-1021`: Mobile-Einzelpanel mit Swipe
- `src/components/play-mode/play-coin-purse-panel.tsx:120`: festes `grid-cols-4`
- `src/components/play-mode/play-checks-panel.tsx:401`: `grid-cols-3 sm:grid-cols-6`
- `src/components/character-sheet/character-sheet.tsx:155-174`: Avatar-Fit per `matchMedia` 640
- `src/components/character-sheet/character-sheet.tsx:725-726`: Header-Stapelung
- `src/components/character-sheet/tab-equipment.tsx:1899,2053`: Tabelle/Karten bei md
- `src/components/party/party-page-client.tsx:60`: `useMediaQuery` 1024
- `src/components/app-sidebar.tsx:34`, `src/components/app-nav.tsx:40`: Shell-Umschaltung bei sm
- `src/app/layout.tsx:78-87`: `<html>`-Klassen, embed-mode-Script
- `src/app/globals.css:5,549-557`: dark-Variante, embed-mode-CSS
- `src/components/theme-provider.tsx:17-57`: Theme-Store + localStorage
- `src/app/settings/settings-client.tsx:134-145,284-314`: Sprache und Darstellung

## Architecture Documentation

- **Mobile-first per Tailwind:** Unpräfixierte Klassen gelten für Telefone, `sm:` schaltet auf das Desktop-Layout um. Beide Varianten liegen im DOM, die Sichtbarkeit steuert CSS.
- **Gerätebezogene Präferenzen** (Theme, Sprache, Druckeinstellungen, Tutorials) liegen im Browser (localStorage/Cookie), **nutzerbezogene** in `profiles`.
- **Klassen auf `<html>`** steuern bereits Theme (`dark`/`light`) und Embed-Modus (`embed-mode`).

## Open Questions

- **Tatsächlicher Viewport des Tab S6 Lite:** Den Wert von `window.innerWidth`/`devicePixelRatio` hat niemand auf dem Gerät gemessen. Bekannt ist nur die physische Auflösung von 1200 × 2000 px (GSMArena), die CSS-Breite ist daraus berechnet. Davon hängt ab, ob im Portrait-Modus ~800 px (Desktop-Layout aktiv) oder ~600 px (Mobile-Layout aktiv) anliegen.
- **Welche Ausrichtung** (Portrait oder Landscape) nutzt der User am Spieltisch?
- **Was genau heißt „nicht responsiv“?** Zu enge Spalten, horizontales Scrollen oder überlappende Elemente: Das ist ohne Screenshot vom Gerät nicht eindeutig.

## Follow-up Research 2026-10-05

Antworten des Users:

- **Ausrichtung:** Hochformat.
- **Symptom:** Er muss herauszoomen, um alles zu sehen; danach ist alles sehr klein. Inhalte sind also **breiter als der Viewport**.
- **Viewport (gemessen):** **800 × 1165 CSS-px**. `sm` und `md` greifen, `lg` und `xl` nicht.

Folgerungen aus dem Code:

- **App-Shell:** Bei 800 px ist die 64-px-Icon-Sidebar aktiv, der Inhalt hat also ~736 px.
- **Play Mode:** `sm:grid-cols-[1fr_1fr]` (`play-mode.tsx:895`) teilt den Platz in zwei `1fr`-Spalten. `1fr` entspricht `minmax(auto, 1fr)`, das Minimum ist also die min-content-Breite des Spalteninhalts. Ist ein Panel breiter als die halbe Fläche, wächst die Spalte über den Viewport hinaus. Das passt zum Symptom „rauszoomen“.
- **Wo es überläuft:** `body` hat `overflow-x-hidden` (`layout.tsx:81`). Die Seite scrollt also nicht seitlich, Mobile-Browser zoomen dann aber auf die Layout-Breite heraus.
- **Charakterbogen:** Bei 800 px ist das Desktop-Layout aktiv (Header nebeneinander, `sm:`-Grids, Waffentabelle ab `md`). Die Tabelle steckt in `overflow-x-auto`.
