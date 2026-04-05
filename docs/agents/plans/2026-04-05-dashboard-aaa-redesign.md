---
date: 2026-04-05T16:39:09Z
git_commit: e41a10f
branch: feature/magic-items-extended
topic: "Dashboard Stats Cards — AAA Video Game Redesign"
tags: [plan, dashboard, ui-design, glassmorphism]
status: draft
---

# Dashboard Stats Cards — AAA Video Game Redesign

## Overview

Die Dashboard Stats Cards (Adventurers, Avg Level, Sessions, Days Since) und die Class/Race Distribution visuell auf AAA-RPG-Niveau heben. "My Characters" wird ganz nach oben verschoben. Die bestehende Glassmorphism-Basis bleibt erhalten, wird aber mit layered shadows, metallic borders, Lucide-Icons, subtilen animated glows und einer Noise-Texture aufgewertet.

## Current State Analysis

**Stats Row (4 cards):** Einfache GlassCards mit zentriertem Text — Label (xs, muted) + Zahl (3xl, gold). Kein Icon, keine visuelle Tiefe, identische Struktur.

**Class/Race Distribution:** Reiner Text (`"Fighter 3 · Thief 2"`) in GlassCard. Keine Farb-Kodierung, keine visuellen Bars.

**Layout-Reihenfolge:** Title → Stats → Distribution → My Characters → Widgets

### Key Discoveries:

- `src/app/dashboard/page.tsx:261-334` — Alle betroffenen Sections
- `src/app/globals.css:187-267` — Glass + Glow CSS-System
- `src/lib/utils/class-colors.ts` — Farben pro Klassengruppe (warrior=red, priest=gold, rogue=blue, wizard=teal)
- Lucide Icons bereits im Projekt (`lucide-react`)
- `font-heading` = Cinzel (medieval serif), `font-sans` = Geist Sans

## Desired End State

```
Dashboard Page (neue Reihenfolge)
├── Title: "Party Dashboard"
├── My Characters (CharacterCard grid — ganz oben, Hero-Bereich)
├── Stats Row (4 aufgewertete Stat Cards mit Icons, Glow, Depth)
├── Class & Race Distribution (Bars mit Klassenfarben)
├── Two-Column Grid (Widgets — unverändert)
```

### UI Mockups

**VORHER — Stats Row:**

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Abenteurer│ │Durchschn.│ │ Sessions │ │Tage seit │
│     4     │ │    7     │ │    12    │ │    3     │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
  (simple glass, text only, no icons)
```

**NACHHER — Stats Row:**

```
┌─✦──────────────✦─┐ ┌─✦──────────────✦─┐
│  ⚔  ABENTEURER   │ │  📊 DURCHSCHN.   │
│                   │ │     STUFE        │
│       4           │ │       7          │
│   ~~~ glow ~~~    │ │   ~~~ glow ~~~   │
└─✦──────────────✦─┘ └─✦──────────────✦─┘
┌─✦──────────────✦─┐ ┌─✦──────────────✦─┐
│  📜  SESSIONS    │ │  ⏳ TAGE SEIT    │
│                   │ │   LETZTER SESSION│
│      12           │ │       3          │
│   ~~~ glow ~~~    │ │   ~~~ glow ~~~   │
└─✦──────────────✦─┘ └─✦──────────────✦─┘
  (beveled frame, icon, ambient glow, noise texture)
```

**NACHHER — Class Distribution:**

```
┌────────────────────────────────────┐
│  KLASSEN                           │
│                                    │
│  Kämpfer    ████████████░░  3      │
│  Dieb       ████████░░░░░░  2      │
│  Magier     ████░░░░░░░░░░  1      │
│                                    │
│  (bars colored by class group)     │
└────────────────────────────────────┘
```

## What We're NOT Doing

- Keine Änderung an CharacterCard (bereits visuell reichhaltig)
- Keine Änderung an den Two-Column Widgets (Quote, Party Overview, Sessions, etc.)
- Keine neuen NPM-Dependencies
- Kein SVG-Filter-Noise (zu komplex) — stattdessen CSS gradient-noise via Pseudo-Element
- Keine Animationen die prefers-reduced-motion ignorieren

## Implementation Approach

Rein CSS/Tailwind-basiert. Neue CSS-Klassen in `globals.css` für den AAA-Look. Stats als dedizierte Inline-Struktur in `page.tsx` statt eigener Komponente (Dashboard ist ein Server Component, Komplexität bleibt gering).

## Architecture and Code Reuse

**Wiederverwendung:**

- `GlassCard` bleibt als Container (wird nicht geändert)
- `getClassGroupColors()` für Class Distribution Bars
- Bestehende `.glass`, `.glow-neutral` CSS-Basis
- Lucide Icons (bereits installiert): `Users`, `TrendingUp`, `BookOpen`, `Clock`

**Neue CSS-Klassen (globals.css):**

- `.stat-card-frame` — beveled metallic border + layered shadow + subtle noise
- `.stat-card-icon` — icon glow container
- `.stat-card-value` — large number with text-shadow
- `.distribution-bar` — animated fill bar

**Betroffene Dateien:**

```
src/app/dashboard/page.tsx    # Layout-Reihenfolge + Stats-HTML + Distribution-Bars
src/app/globals.css           # Neue CSS-Klassen für AAA-Look
```

## Phase 1: CSS Foundation + Layout-Reorder

### Overview

Neue CSS-Klassen für den AAA-Look und My Characters nach oben verschieben.

### Changes Required:

#### [x] 1. Neue CSS-Klassen in globals.css

**File**: `src/app/globals.css`
**Changes**: Neue Klassen nach den bestehenden Glow-Variants einfügen

```css
/* ─── AAA Stat Card System ─────────────────────────── */

/* Beveled metallic frame with layered depth */
.stat-card-frame {
  position: relative;
  border: 1.5px solid oklch(0.7 0.12 80 / 0.5);
  background: linear-gradient(135deg, oklch(0.18 0.03 285 / 0.8), oklch(0.12 0.02 285 / 0.9));
  box-shadow:
    0 8px 24px oklch(0 0 0 / 0.5),
    0 2px 8px oklch(0 0 0 / 0.3),
    inset 0 1px 0 oklch(0.8 0.1 80 / 0.15),
    inset 0 -1px 0 oklch(0 0 0 / 0.3);
  overflow: hidden;
}
/* Noise texture pseudo-element */
.stat-card-frame::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-conic-gradient(oklch(0.5 0 0 / 0.03) 0% 25%, transparent 0% 50%) 0 0 / 4px
    4px;
  pointer-events: none;
  z-index: 0;
}
/* Corner ornament pseudo-element */
.stat-card-frame::after {
  content: "✦";
  position: absolute;
  top: 6px;
  left: 10px;
  color: oklch(0.75 0.12 80 / 0.4);
  font-size: 10px;
  z-index: 1;
}
/* Light mode adjustments */
.stat-card-frame:not(.dark *) {
  border-color: oklch(0.6 0.1 80 / 0.4);
  background: linear-gradient(135deg, oklch(0.95 0.01 80 / 0.9), oklch(0.92 0.015 80 / 0.95));
  box-shadow:
    0 4px 16px oklch(0.2 0.02 285 / 0.15),
    inset 0 1px 0 oklch(1 0 0 / 0.5),
    inset 0 -1px 0 oklch(0.5 0.05 80 / 0.2);
}

/* Ambient glow pulse for stat value */
.stat-glow {
  text-shadow: 0 0 20px oklch(0.82 0.14 80 / 0.4);
}
.stat-glow-pulse {
  animation: stat-ambient-glow 3s ease-in-out infinite;
}
@keyframes stat-ambient-glow {
  0%,
  100% {
    text-shadow: 0 0 16px oklch(0.82 0.14 80 / 0.3);
  }
  50% {
    text-shadow: 0 0 28px oklch(0.82 0.14 80 / 0.6);
  }
}

/* Icon container glow */
.stat-icon-glow {
  filter: drop-shadow(0 0 6px oklch(0.82 0.14 80 / 0.5));
}

/* Distribution bar */
.distribution-bar {
  height: 6px;
  border-radius: 3px;
  background: oklch(0.25 0.02 285 / 0.5);
  overflow: hidden;
}
.distribution-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .stat-glow-pulse {
    animation: none;
  }
  .distribution-bar-fill {
    transition: none;
  }
}
```

#### [ ] 2. Layout-Reihenfolge ändern

**File**: `src/app/dashboard/page.tsx`
**Changes**: My Characters Block vor die Stats Row verschieben

```
Neue Reihenfolge:
1. Title
2. My Characters (was Zeile 314-334)
3. Stats Row (Zeile 261-286) — mit neuem Design
4. Class & Race Distribution (Zeile 288-312) — mit Bars
5. Two-Column Grid (unverändert)
```

### Success Criteria:

#### Automated Verification:

- [x] `npm run build` — keine Fehler
- [x] `npm run lint` — keine neuen Errors

---

## Phase 2: Stats Cards Aufwerten

### Overview

Die 4 Stats Cards mit Icons, beveled frame, animated glow und Noise-Texture versehen.

### Changes Required:

#### [ ] 1. Stats Row HTML ersetzen

**File**: `src/app/dashboard/page.tsx`
**Changes**: GlassCards durch aufgewertete Stat-Cards ersetzen. Lucide Icons importieren.

Jede Stat Card folgt diesem Pattern:

```tsx
import { Users, TrendingUp, BookOpen, Clock } from "lucide-react";

// Stats Row
<div className="stagger-reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {/* Adventurers */}
  <div className="stat-card-frame glass rounded-xl p-5" data-testid="stat-card-adventurers">
    <div className="relative z-10 flex flex-col items-center gap-2 text-center">
      <Users className="stat-icon-glow h-6 w-6 text-primary/80" />
      <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {t("adventurers")}
      </div>
      <div className="stat-glow stat-glow-pulse font-heading text-4xl text-primary">
        {allCharacters.length}
      </div>
    </div>
  </div>
  {/* ... analog für Avg Level (TrendingUp), Sessions (BookOpen), Days Since (Clock) */}
</div>;
```

### Success Criteria:

#### Automated Verification:

- [x] `npm run build` — keine Fehler
- [x] Bestehende E2E Tests: `npx playwright test dashboard` — data-testids bleiben erhalten

#### Manual Verification:

- [x] Stats Cards zeigen Icons, beveled frame, glow-Effekte
- [x] Responsive: 2 Spalten auf Tablet, 4 auf Desktop
- [x] Dark Mode + Light Mode sehen gut aus
- [x] prefers-reduced-motion: keine Animation

---

## Phase 3: Class & Race Distribution mit visuellen Bars

### Overview

Text-only Distribution durch farbkodierte Bars mit Klassenfarben ersetzen.

### Changes Required:

#### [ ] 1. Distribution mit Bars

**File**: `src/app/dashboard/page.tsx`
**Changes**: Die Class Distribution zeigt Bars mit Klassen-Farben. Race Distribution analog.

```tsx
{
  /* Class Distribution */
}
<div className="stat-card-frame glass rounded-xl p-5" data-testid="stat-card-classes">
  <h3 className="relative z-10 mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
    {t("classDistribution")}
  </h3>
  <div className="relative z-10 space-y-2">
    {classDistribution.map((c) => {
      // Map class name → class group → color
      const pct = Math.round((c.count / allCharacters.length) * 100);
      return (
        <div key={c.name} className="flex items-center gap-3">
          <span className="w-20 truncate text-xs text-foreground">{c.name}</span>
          <div className="distribution-bar flex-1">
            <div
              className="distribution-bar-fill"
              style={{ width: `${pct}%`, background: barColor }}
            />
          </div>
          <span className="w-6 text-right font-mono text-xs text-muted-foreground">{c.count}</span>
        </div>
      );
    })}
  </div>
</div>;
```

Für die Farbzuordnung: Jeder Klassenname wird über `CLASSES` → `classGroup` → `getClassGroupColors()` aufgelöst. Für die Distribution-Bars verwende ich die HP-Bar-Gradients der jeweiligen Klassengruppe.

Race Distribution bekommt ein einheitliches neutrales Gold-Gradient.

### Success Criteria:

#### Automated Verification:

- [x] `npm run build` — keine Fehler
- [x] `npm test` — alle Tests grün
- [x] `npx playwright test dashboard` — bestehende Tests grün

#### Manual Verification:

- [x] Class Bars zeigen korrekte Farben (Warrior=rot, Priest=gold, Rogue=blau, Wizard=teal)
- [x] Race Bars sind neutral-gold
- [x] Bar-Breiten proportional zur Anzahl
- [x] Responsive Layout funktioniert

---

## Testing Strategy

### Automated Tests:

- Bestehende E2E Tests (`dashboard.spec.ts`) prüfen `stat-card-adventurers`, `stat-card-avg-level`, etc.
- data-testids bleiben alle erhalten → Tests sollen weiterhin grün sein

### Manual Testing Steps:

1. Dashboard öffnen → My Characters erscheint ganz oben
2. Stats Cards zeigen Icons, metallischen Rahmen, pulsierenden Glow
3. Class Distribution zeigt farbige Bars pro Klasse
4. Dark Mode umschalten → Kontraste prüfen
5. Mobile Viewport → Responsive Grid (2 Spalten auf sm, 1 auf mobile)
6. `prefers-reduced-motion` im Browser aktivieren → keine Animationen

## Performance Considerations

- Rein CSS-basiert (kein JS für Animationen)
- Noise-Texture via CSS `repeating-conic-gradient` (kein SVG-Filter, kein Bild)
- `prefers-reduced-motion` deaktiviert alle Animationen
- Kein Layout-Shift da die Card-Größe nicht verändert wird

## References

- Research: `docs/agents/research/2026-04-05-dashboard-aaa-redesign.md`
- Glass CSS: `src/app/globals.css:187-267`
- Class Colors: `src/lib/utils/class-colors.ts`
- Dashboard Page: `src/app/dashboard/page.tsx:256-334`
