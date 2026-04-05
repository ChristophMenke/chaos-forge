---
date: "2026-04-05T20:03:11.106443+00:00"
git_commit: 3a07c1acd2086599e92d5a146a43822f495b06c9
branch: feature/magic-items-extended
topic: "Finale A11y & Qualitäts-Fixes vor Produktiveinsatz"
tags: [plan, a11y, accessibility, quality, testing]
status: approved
---

# Finale A11y & Qualitäts-Fixes Implementation Plan

## Overview

Behebung der identifizierten A11y-Gaps aus der finalen Qualitätsanalyse. Fokus auf WCAG 2 AA Konformität: Skip-Link, aria-live Regionen, aria-describedby für Form-Errors und fehlende Icon-Button-Labels.

## Current State Analysis

Nach Verifizierung des Research-Reports gegen den aktuellen Code:

- **Layout**: Hat bereits `<main>` Tag (layout.tsx:106) — kein Fix nötig
- **Bard Spell Slots**: Bereits 7 Tests vorhanden (spellslots.test.ts:20-61) — kein Fix nötig
- **Specialist Bonus Slots**: Bereits 5 Tests vorhanden (spellslots.test.ts:220-250) — kein Fix nötig
- **Magic Items Tests**: 392 Zeilen, 20+ Tests inkl. Edge Cases — kein Fix nötig

### Tatsächliche Gaps:

1. **Kein Skip-to-Main-Content Link** — Keyboard-Navigation muss durch gesamte Nav
2. **Keine aria-live Regionen** — 0 Treffer im gesamten src/
3. **Keine aria-describedby** — 0 Treffer im gesamten src/
4. **1 Play-Mode Button ohne Label** — play-checks-panel.tsx:424 (NWP-Expand-Div)
5. **A11y E2E-Tests testen nur im Dark Mode** — Light Mode nicht geprüft

## Desired End State

- Skip-to-Main-Content Link vor Navigation, nur bei Focus sichtbar
- Wizard-Formular Fehler mit aria-describedby assoziiert
- Status-Messages (Save-Erfolg, Errors) mit aria-live="polite"
- Play-Mode NWP-Expand mit role="button" + aria-label + aria-expanded
- A11y E2E-Tests prüfen beide Modi (Dark + Light)
- Alle Tests grün

## What We're NOT Doing

- Performance-Optimierungen (Dynamic Imports, Caching) — separate Initiative
- Dualclass-Engine (CLASS-012/013) — zu großer Scope
- Neue E2E-Tests für Session-Management
- Änderungen an der Regelwerk-Engine

## Architecture and Code Reuse

Bestehende Patterns wiederverwenden:

- `sr-only` Klasse existiert bereits in Tailwind
- `data-testid` Convention auf allen neuen Elementen
- i18n Keys in `messages/de.json` + `messages/en.json`
- Bestehender a11y E2E-Test als Template (e2e/accessibility.spec.ts)

```
src/app/layout.tsx                              # + Skip-Link
src/components/wizard/character-wizard.tsx       # + aria-describedby auf Error
src/components/wizard/step-basics.tsx            # + aria-describedby auf Inputs
src/components/play-mode/play-checks-panel.tsx   # + role="button", aria-label, aria-expanded
messages/de.json                                # + skipToMain Key
messages/en.json                                # + skipToMain Key
e2e/accessibility.spec.ts                       # + Light-Mode Tests
```

---

## Phase 1: Skip-to-Main-Content Link

### Overview

WCAG 2.4.1 "Bypass Blocks" — Skip-Link vor der Navigation einfügen.

### Changes Required:

#### [ ] 1. Skip-Link in Root Layout

**File**: `src/app/layout.tsx`
**Changes**: Unsichtbaren Skip-Link als erstes Kind von `<body>` einfügen, `id="main"` auf `<main>` setzen.

```tsx
<body>
  <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground focus:border focus:border-ring" data-testid="skip-to-main">
    {/* i18n skipToMain */}
  </a>
  ...
  <main id="main" className="...">
```

#### [ ] 2. i18n Keys

**Files**: `messages/de.json`, `messages/en.json`
**Changes**: Key `common.skipToMain` hinzufügen

### Success Criteria:

#### Automated Verification:

- [ ] `npm run build` — Build erfolgreich
- [ ] `npm run lint` — Keine Lint-Fehler
- [ ] `npm test` — Unit-Tests grün

---

## Phase 2: aria-live für Status-Messages

### Overview

WCAG 4.1.3 "Status Messages" — Dynamische Meldungen für Screenreader ankündigen.

### Changes Required:

#### [ ] 1. Wizard Error mit aria-live

**File**: `src/components/wizard/character-wizard.tsx`
**Changes**: Error-Paragraph mit `aria-live="assertive"` versehen + `role="alert"`

```tsx
{
  error && (
    <p
      className="text-sm text-destructive"
      role="alert"
      aria-live="assertive"
      data-testid="wizard-error"
    >
      {error}
    </p>
  );
}
```

#### [ ] 2. aria-describedby für Wizard Error

**File**: `src/components/wizard/character-wizard.tsx`
**Changes**: `id="wizard-error"` auf Error + `aria-describedby="wizard-error"` auf das aktive Form-Element

### Success Criteria:

#### Automated Verification:

- [ ] `npm run build` — Build erfolgreich
- [ ] `npm test` — Unit-Tests grün

---

## Phase 3: Play-Mode Icon-Button A11y

### Overview

WCAG 4.1.2 "Name, Role, Value" — Interaktive Elemente brauchen accessible name.

### Changes Required:

#### [ ] 1. NWP-Expand-Button mit Accessibility

**File**: `src/components/play-mode/play-checks-panel.tsx`
**Changes**: `role="button"`, `tabIndex={0}`, `aria-expanded`, `aria-label`, `onKeyDown` für Enter/Space

```tsx
<div
  role={nwp.description ? "button" : undefined}
  tabIndex={nwp.description ? 0 : undefined}
  aria-expanded={nwp.description ? expandedNwp === nwp.name : undefined}
  aria-label={nwp.description ? `${localizedName}: ${t("showDescription")}` : undefined}
  onKeyDown={nwp.description ? handleKeyDown : undefined}
  ...
>
```

#### [ ] 2. i18n Key

**Files**: `messages/de.json`, `messages/en.json`
**Changes**: Key für "Beschreibung anzeigen" / "Show description"

### Success Criteria:

#### Automated Verification:

- [ ] `npm run build` — Build erfolgreich
- [ ] `npm test` — Unit-Tests grün

---

## Phase 4: A11y E2E-Tests für Light Mode

### Overview

Bestehende axe-core Tests decken nur Dark Mode ab. Light-Mode-Kontraste separat prüfen.

### Changes Required:

#### [ ] 1. Light-Mode A11y Tests

**File**: `e2e/accessibility.spec.ts`
**Changes**: Neue Test-Suite die Theme auf Light setzt und axe-core erneut laufen lässt

```typescript
test.describe("Accessibility — Light Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("chaos-forge-theme", "light"));
  });

  test("landing page light mode", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("html.light");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations).toEqual([]);
  });
  // ... login, 404
});
```

### Success Criteria:

#### Automated Verification:

- [ ] `npm run test:e2e` — Alle E2E-Tests grün (inkl. neue Light-Mode-Tests)

---

## Testing Strategy

### Unit Tests:

- Keine neuen Unit-Tests nötig (A11y-Änderungen sind UI-only)

### E2E Tests:

- Light-Mode axe-core Scans auf Landing, Login, 404

### Manual Testing Steps:

1. Tab-Navigation: Skip-Link erscheint bei Focus, springt zu Hauptinhalt
2. Screenreader: Wizard-Fehler wird vorgelesen
3. Theme-Toggle: Light Mode hat keine Kontrast-Probleme

## References

- [Research: Finale Qualitätsanalyse](../research/2026-04-05-final-quality-audit.md)
- [WCAG 2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks)
- [WCAG 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG21/Understanding/status-messages)
