---
date: 2026-04-09T13:20:26Z
git_commit: 71e255a
branch: main
topic: "Umfassende UX, UI & Performance Analyse"
tags: [research, ux, ui, performance, accessibility, visual-enhancement]
status: complete
---

# Research: Umfassende UX, UI & Performance Analyse

## Research Question

Feature-Ready-Audit: Analyse der gesamten Chaos Forge Applikation hinsichtlich UX, UI-Qualität, Performance-Optimierungen, visueller Aufwertungsmöglichkeiten (inkl. KI-generierter Bilder), Quality-of-Life Features und Accessibility.

## Summary

Die App hat ein solides Fundament — konsistentes Glassmorphism-Design, durchgängige i18n, gute Accessibility-Basics (SkipToMain, ARIA auf HP-Bars, 1036 data-testid Attribute). Es gibt jedoch systematische Optimierungspotentiale in 6 Kategorien, von denen die wichtigsten sind: (1) ungenutztes Bildmaterial das bereits existiert, (2) fehlende Error-Feedback im Play Mode, (3) zu kleine Touch-Targets auf Mobile und (4) Performance-Optimierungen bei React Re-Renders.

---

## Detailed Findings

### 1. UI-Konsistenz

#### 1.1 Padding-Inkonsistenzen (3 verschiedene Muster)

- **Pattern A** `gap-4 p-4 sm:gap-6 sm:p-6` — Dashboard, Characters, Party (korrekt responsiv)
- **Pattern B** `gap-6 p-6` — Sessions (fest, kein Mobile-Scaling)
- **Pattern C** `w-full p-4 sm:p-6` — Character Sheet, Session Detail (kein `flex flex-1`)
- **Pattern D** `w-full` (kein Padding) — Play Mode (eigenes internes Padding)

#### 1.2 Loading-Skeleton Mismatches

- Characters/Dashboard loading.tsx: `gap-6 p-6` fest vs. Page `gap-4 p-4 sm:gap-6 sm:p-6`
- Master loading.tsx: komplett anderes Layout als MasterDashboard
- Play Mode & Epic: **keine eigene loading.tsx**

#### 1.3 Fehlende Max-Width Container

Die meisten Seiten haben kein `max-w-*` — Inhalte strecken sich auf ultrawide Monitoren über die gesamte Breite. Nur Wizard (`max-w-2xl`), Login (`max-w-md`), Landing (`max-w-lg`) haben Begrenzungen.

#### 1.4 Print Toolbar mit Raw Colors

`print-sheet.tsx`: `bg-gray-800`, `hover:bg-gray-700` statt Design-System Tokens.

---

### 2. UX Friction Points

#### 2.1 Stille Fehler im Play Mode (KRITISCH)

- `play-mode.tsx:648` — HP-Update-Fehler: nur `console.error`, User sieht nichts
- `play-mode.tsx:697` — Spell-Expenditure-Fehler: silent
- `play-mode.tsx:712` — Spell-Reset-Fehler: silent
- Während einer Session denkt der Spieler, HP/Spells sind gespeichert — sind sie aber nicht.

#### 2.2 Kein globales Error Boundary

Kein `error.tsx` in der App. Unbehandelte React-Fehler crashen zu leerem Bildschirm.

#### 2.3 Fehlende THAC0/Mechanics Tooltips

- THAC0 wird roh angezeigt ohne Erklärung
- Saving Throw Kategorien ohne Tooltip was sie abdecken
- AC ohne Breakdown-Tooltip
- Wahrnehmungswurf-Formel (Hausregel) nicht erklärt
- `title=` Attribute auf Touch-Geräten nicht zugänglich

#### 2.4 Kein Onboarding

- Kein First-Run Welcome, keine Tour, keine Checkliste
- Dashboard-Widgets werden nicht erklärt
- AD&D-spezifische Panels setzen volles Regelwissen voraus

---

### 3. Performance

#### 3.1 React Re-Renders im Play Mode (MEDIUM)

- `handleHpChange`, `handleCoinChange`, `handleCastSpell` etc. sind nicht in `useCallback` gewrapped (`play-mode.tsx:653-714`)
- Kein `React.memo` auf Play-Mode Panels — HP-Update triggert Re-Render aller 6-8 Panels
- `panels` Array (mit JSX-Icons) wird jeden Render neu erstellt (`play-mode.tsx:716-752`)

#### 3.2 Eagere Katalog-Loads

- `manage/page.tsx:113-121` lädt **alle** Waffen, Rüstungen, NWPs, Items bei jedem Page-Load, auch wenn Equipment-Tab nie geöffnet wird
- `master/page.tsx:72-74` joined volle Spell-Details für alle Charaktere

#### 3.3 Fehlende Image-Optimierung

- Keine `priority` Prop auf Above-the-Fold Avataren (character-card.tsx, play-hp-bar.tsx)
- Keine `sizes` Prop auf Character-Card Avataren

#### 3.4 Code Splitting Lücken

- `TabEquipment` (2377 Zeilen) und `TabSpells` (1579 Zeilen) statisch importiert in character-sheet.tsx — kein Dynamic Import
- Kein `server-only` Guard auf `src/lib/gemini/client.ts`

---

### 4. Visuelle Aufwertung — Bildmaterial

#### 4.1 Ungenutztes Bildmaterial (QUICK WIN)

**32 Schul-/Sphären-Illustrationen existieren bereits als .webp aber werden NICHT verwendet:**

- `/public/images/schools/` — 8 Bilder (abjuration.webp bis necromancy.webp)
- `/public/images/spheres/` — 28+ Bilder (all.webp bis weather.webp)
- `SchoolSphereIcon` (`src/components/spellbook/school-sphere-icon.tsx`) zeigt stattdessen Emoji (🛡️ 🔮 💀 etc.)

#### 4.2 Klassen-Portraits als Avatar-Fallback

- `/public/images/classes/` hat 11 Klassen-Portraits (nur im Wizard genutzt)
- `AvatarDisplay` zeigt bei fehlendem Avatar nur Initialen auf lila Kreis
- Die Klassen-Portraits könnten als Fallback verwendet werden

#### 4.3 Leere Zustände — Nur Text

Alle Empty States sind `<p className="text-muted-foreground">` ohne Illustration:

- Characters-Seite: "Noch keine Charaktere erstellt"
- Sessions: "Noch keine Sessions in der Chronik"
- Epic Equipment, Spell Tab, Party Pool, GM Panels

#### 4.4 Kein Ambient Background

Login hat `login-bg.webp` bei 12% Opacity — alle anderen Seiten: purer CSS-Hintergrund ohne Textur.

#### 4.5 Footer Logo ungenutzt

`/public/footer-logo.webp` existiert, wird nirgends referenziert.

---

### 5. Quality-of-Life

#### 5.1 Touch Targets zu klein (MOBILE-KRITISCH)

Pervasive `h-6` (24px) Buttons im Play Mode — weit unter WCAG 2.5.5 (44px) und Apple/Google Guidelines (48px):

- Inventory +/− Buttons: `play-inventory-panel.tsx:182-204`
- Spell Cast Buttons: `play-spellbook-panel.tsx:451, 591`
- Combat Detail Toggle: `play-combat-panel.tsx:298, 308`
- Ability Reset: `play-abilities-panel.tsx:116, 192, 275`

#### 5.2 Keine Keyboard Shortcuts

- Kein Panel-Wechsel via Hotkeys im Play Mode
- Kein Shortcut für HP-Update
- Mobile Pill-Nav ohne `role="tab"` / `aria-selected`

#### 5.3 Keine Swipe-Gesten

Mobile Play Mode: kein Swipe links/rechts zum Panel-Wechsel.

#### 5.4 Kein Toast-System

- Nur 2 lokale Toast-Implementierungen (MasterGoldPanel, MasterItemsPanel)
- Kein globaler Toast für Erfolg/Fehler-Feedback

---

### 6. Accessibility

#### 6.1 Stärken

- `SkipToMain` vorhanden
- `html[lang]` korrekt gesetzt
- HP-Bars: `role="progressbar"` + `aria-label`
- 1036 `data-testid` Attribute in 96 Dateien
- `prefers-reduced-motion` respektiert in globals.css
- `ConfirmDialog`: vollständige ARIA-Attribute

#### 6.2 Schwächen

- **Focus-Trap fehlt** in custom Dialogen (party-gold, party-log, coin-purse) — Tab leakt raus
- **Keine `aria-live` Regions** für dynamische Wertänderungen (HP, Spell Slots)
- **Focus-Outline zu schwach:** `outline-ring/50` (50% Opacity) in globals.css:152
- **8-9px Text** in play-checks-panel und app-nav — WCAG-Compliance unmöglich bei dieser Größe
- **Duplicate Dialog** fehlt `role="dialog"` (character-sheet.tsx:951-1002)
- **Play-Mode Pill Nav** ohne Tab-Semantik (kein `role="tab"`, `aria-selected`)
- **Axe-core Coverage-Lücken:** Play Mode, Spellbook, Party, Master, Sessions nicht getestet

---

## Code References

- `src/app/globals.css:152` — Focus outline opacity
- `src/components/play-mode/play-mode.tsx:648,697,712` — Silent errors
- `src/components/play-mode/play-mode.tsx:653-714` — Handlers ohne useCallback
- `src/components/play-mode/play-mode.tsx:716-752` — Panels array recreated
- `src/components/play-mode/play-mode.tsx:797-811` — Mobile nav ohne ARIA tabs
- `src/components/play-mode/play-inventory-panel.tsx:182-204` — 24px touch targets
- `src/components/spellbook/school-sphere-icon.tsx:1-63` — Emoji statt vorhandene Images
- `src/components/avatar-display.tsx:44-52` — Initialen-Fallback ohne Klassen-Portrait
- `src/app/characters/[id]/manage/page.tsx:113-121` — Eager catalog loads
- `src/components/character-sheet/character-sheet.tsx:65-66` — Static tab imports
- `src/components/character-sheet/character-sheet.tsx:951-1002` — Duplicate dialog ohne ARIA
- `src/app/dashboard/page.tsx:771` — Gap-Inkonsistenz in Mini-Stats Grid

## Architecture Documentation

Das Design-System basiert auf:

- **CSS Custom Properties** mit oklch-Farben für Light/Dark Mode
- **Glassmorphism-Klassen** (.glass, .glow-warrior/priest/rogue/wizard)
- **Schrift-Hierarchie:** Cinzel (Headings), Geist Sans (Body), Crimson Text (Serif)
- **Responsive Pattern:** Desktop Left-Sidebar + Mobile Bottom-Nav + Play Mode Pill-Nav
- **Stat Card System:** .stat-card-frame mit Noise-Textur und Corner-Ornaments

## Open Questions

- Soll `max-w-7xl` o.ä. global eingeführt werden oder pro Seite entschieden?
- Globales Toast-System (Sonner?) vs. lokale Toast-States weiter ausbauen?
- Lazy Loading für Equipment/Spell-Kataloge: Client-seitig on-demand oder Server Component Split?
