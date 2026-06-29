---
date: 2026-04-05T16:09:19Z
git_commit: e41a10f
branch: feature/magic-items-extended
topic: "Dashboard Stats Redesign — AAA Video Game UI"
tags: [research, dashboard, ui-design, glassmorphism, dark-fantasy]
status: complete
---

# Research: Dashboard Stats Redesign — AAA Video Game UI

## Research Question

Understand the current Dashboard implementation (Stats Row, Class/Race Distribution, My Characters) and research AAA video game UI patterns for RPG character dashboards to redesign the stat cards for a premium, immersive look.

## Summary

The Dashboard (`src/app/dashboard/page.tsx`) is a Server Component with 8 widgets. The **Stats Row** at the top consists of 4 simple `GlassCard` components showing numeric values (Adventurers, Average Level, Sessions, Days Since Last Session), followed by Class/Race Distribution as text strings, then the "My Characters" grid using `CharacterCard` components.

The current design uses the Glassmorphism system (backdrop-blur, translucent backgrounds, gold glow borders) which is clean but visually flat for a gaming context. AAA RPG games (Diablo 4, Baldur's Gate 3, Elden Ring, Path of Exile) use **layered depth** (multiple box-shadows), **metallic borders** (beveled gold/bronze), **texture overlays** (noise/grain), **icon systems**, and **animated glows** to create premium stat displays.

## Detailed Findings

### Current Dashboard Structure

```
Dashboard Page
├── Stats Row (4 cards in grid: Adventurers | Avg Level | Sessions | Days Since)
├── Class & Race Distribution (2 cards, text-only: "Fighter 3 · Thief 2")
├── My Characters (CharacterCard grid with avatar, HP bar, level badge)
├── Two-Column Grid:
│   ├── Random Quote (blockquote + reaction bar)
│   ├── Party Overview (compact character list with HP bars)
│   ├── Latest Session (title + summary + tags + entries)
│   ├── Throwback Session (random older session)
│   ├── XP Overview (ranked list with XP totals)
│   ├── Tag Cloud (colored badges by type)
│   └── Latest NPCs (avatar + name + location)
```

### Stats Row Cards (Lines 261-286)

Currently: Simple `GlassCard` with centered text — label (xs, muted) + value (3xl, primary/gold). No icons, no visual hierarchy beyond font size. All 4 cards identical in structure.

### Class/Race Distribution (Lines 288-312)

Currently: Plain text strings (`"Fighter 3 · Thief 2"`) inside GlassCard. No visual bars, no color-coding by class group.

### CharacterCard Component (`src/components/character-card.tsx`)

Already the most visually rich component:

- Avatar breakout effect (negative margins, rounded-l-xl)
- Class-group glow borders (warrior=red, priest=gold, rogue=blue, wizard=teal)
- Hexagonal level badge (CSS clip-path)
- HP bar with class-group gradient + pulse at low HP
- 3D tilt on hover (`perspective(800px) rotateY(2deg)`)
- Stagger-reveal animation

### Design System Reference

**Glass Card Base:**

- Dark mode: `oklch(0.16 0.025 285 / 0.6)`, blur 20px, saturate 1.6
- Border: `oklch(0.5 0 0 / 0.15)`

**Glow Colors (oklch):**

| Group   | Hue        | Border                      | Shadow      |
| ------- | ---------- | --------------------------- | ----------- |
| Warrior | 25 (red)   | `oklch(0.6 0.22 25 / 0.4)`  | 24px spread |
| Priest  | 80 (gold)  | `oklch(0.75 0.15 80 / 0.4)` | 24px spread |
| Rogue   | 260 (blue) | `oklch(0.6 0.18 260 / 0.4)` | 24px spread |
| Wizard  | 185 (teal) | `oklch(0.7 0.14 185 / 0.4)` | 24px spread |
| Neutral | 80 (gold)  | `oklch(0.82 0.14 80 / 0.3)` | 16px spread |

**Primary color:** `oklch(0.82 0.14 80)` — vibrant gold

### AAA Game UI Patterns

**Diablo 4:** Stone/metal textures, burgundy/gold palette, large readable stat numbers, colored rarity borders, layered box-shadows for depth.

**Baldur's Gate 3:** Organized tabs, clean typography, expandable panels, consistent icon system, parchment-like backgrounds.

**Elden Ring:** Minimalist stat layout, generous whitespace, medieval typography, dark backgrounds with selective golden highlights.

**Path of Exile:** Dense stat grids, color-coded by damage type, tooltips on hover, nested stat breakdowns.

**Key techniques achievable with CSS/Tailwind:**

1. **Layered box-shadows** for 3D beveled frames
2. **SVG noise/turbulence filters** or gradient overlays for texture
3. **Metallic gradient borders** (amber → bronze transitions)
4. **Animated glows** (pulsing ember effects via keyframe animations)
5. **Corner ornaments** (Unicode decorative characters or SVG)
6. **Icon + number pairings** for instant stat recognition

## Code References

- `src/app/dashboard/page.tsx:261-286` — Stats Row (4 cards)
- `src/app/dashboard/page.tsx:288-312` — Class & Race Distribution
- `src/app/dashboard/page.tsx:314-334` — My Characters grid
- `src/components/glass-card.tsx` — GlassCard base component
- `src/components/character-card.tsx` — CharacterCard with avatar/HP/level
- `src/components/hp-bar.tsx` — HP bar with class gradients + pulse
- `src/components/level-badge.tsx` — Hexagonal level badge
- `src/lib/utils/class-colors.ts` — Class group color definitions
- `src/app/globals.css:187-420` — Glass, glow, tilt, stagger CSS

## Architecture Documentation

The Dashboard is a Server Component that runs 10 parallel Supabase queries, computes derived stats (distributions, rankings, averages), and renders a responsive grid layout. All visual elements use the shared Glassmorphism design system (`.glass`, `.glow-*`, `.tilt-card`, `.stagger-reveal`). The `GlassCard` component is the universal container with configurable glow color.

The i18n keys for the dashboard live in the `"dashboard"` namespace in `messages/de.json` and `messages/en.json`.
