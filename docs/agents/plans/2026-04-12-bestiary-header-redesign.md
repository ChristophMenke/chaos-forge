---
date: 2026-04-12T05:13:06+00:00
git_commit: 8bb05ea04c3752aa7461ff38bba47b10beb57308
branch: main
topic: "Bestiary-Header-Redesign + Test-Helper QA-Migration"
tags: [plan, master, bestiary, header, ai-import, precise-mode, e2e, qa-migration]
status: ready
---

# Bestiary-Header-Redesign + Test-Helper QA-Migration

## Overview

Zwei zusammengehörige Aufgaben in einem PR:

**Block A:** Der Header des GM-Bestiary-Panels (`master-bestiary-panel.tsx:362-404`) wird aufgeräumt — zwei stilistisch unterschiedliche Buttons (Default `<Button>` vs. gestyltes `<label>`) werden auf einheitliche `<Button>`-Components umgestellt, und die fehlplatzierte Precise-Mode-Checkbox wird als Disclosure-Popover an den AI-Import-Button gekoppelt.

**Block B:** Alle Test-Infrastruktur (E2E-Helper, API-Routes, Specs) migriert von `@chaos-forge.de` auf die RFC-reservierte `.test`-TLD `@qa.chaosforge.test`, damit Test-User nie reale Welcome-Mails triggern können.

## Current State Analysis

### Block A — Bestiary Header

**Datei:** `src/components/master/master-bestiary-panel.tsx:362-404`

Aktueller Header ist ein `flex flex-wrap gap-2`-Container mit 3 Geschwistern:

1. `<Button className="flex-1">` — "Create Monster" (primary/gold)
2. `<label className="flex flex-1 ...">` — "AI Import" (selbst-gestyltes Label mit hidden File-Input, outline-artig)
3. `<label className="flex cursor-pointer ...">` — Precise-Mode-Checkbox (tiny, kein `flex-1`)

Probleme:

- Buttons haben komplett unterschiedliche Höhe/Style (Button-Component vs. gestyltes Label)
- Precise-Checkbox ist Geschwister im flex-Container → wrappt auf Mobile unter "Create Monster" obwohl funktional zum AI-Import gehört
- AI-Import-Label hat keinen Disabled-/Focus-State aus dem Button-System

**Vergleich:** `master-items-panel.tsx:410-443` verwendet das gleiche "zwei flex-1"-Pattern, aber mit identischem Style (`bg-primary/10`) auf beiden Buttons.

### Block B — Test-Domain

16 Dateien mit hardcoded `@chaos-forge.de`. Davon 1 in **Production-Code** (`share-dialog.tsx:70` filtert die Domain aktiv aus dem Share-Dropdown). 6 API-Routes definieren jeweils lokal eine `TEST_DOMAIN`-Konstante. `.env.local` enthält `TEST_USER_EMAIL=christoph@chaos-forge.de`.

## Desired End State

### Block A — Neuer Bestiary-Header

```
┌──────────────────────────────────────────────────┐
│ Mobile (390px)                                    │
├──────────────────────────────────────────────────┤
│ ┌───────────────────┐ ┌───────────────────┐      │
│ │  ⊕ Monster        │ │  ⬆ KI-Import  ⚙  │      │
│ │    erstellen       │ │   (Foto/PDF)      │      │
│ └───────────────────┘ └───────────────────┘      │
│                                                   │
│ 🔍 Monster suchen...    Size ▼   HD range ▼      │
└──────────────────────────────────────────────────┘

Beim Klick auf ⚙ öffnet sich ein Popover:
┌──────────────────────────┐
│ ☐ Präziser Modus         │
│   langsamer, genauer     │
└──────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────┐
│ Desktop (1440px)                                              │
├──────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐ ┌─────────────────────────┐     │
│ │  ⊕ Monster erstellen    │ │  ⬆ KI-Import (Foto/PDF) ⚙│   │
│ └─────────────────────────┘ └─────────────────────────┘     │
│                                                               │
│ 🔍 Monster suchen...  Size ▼  HD range ▼  Sort ▼  🟦🟨     │
└──────────────────────────────────────────────────────────────┘
```

**Beide Buttons:**

- Nutzen `<Button>` Component mit `default`-Variante (primary/gold)
- Beide `flex-1` für gleiche Breite
- AI-Import hat rechts ein Settings-Cog-Icon (`Settings2` von lucide-react)
- Klick auf den Button-Body triggert den File-Picker (wie bisher, `useRef` statt `<label>`)
- Klick auf das Cog-Icon öffnet ein Popover mit dem Precise-Mode-Toggle + Beschreibung

### Block B — QA-Domain

- Alle `@chaos-forge.de`-Referenzen in Test-Infrastruktur → `@qa.chaosforge.test`
- `share-dialog.tsx` Filter → `@qa.chaosforge.test`
- `.env.local` → `TEST_USER_EMAIL=QA-primary@qa.chaosforge.test`
- Bestehende Auth-User werden via `auth.admin.updateUserById` in-place umbenannt

### Key Discoveries:

- `share-dialog.tsx:70` filtert `@chaos-forge.de` in **Production-Code** aus dem Share-Dropdown → muss mit migriert werden
- `master.preciseModeDesc` i18n-Key ("langsamer, genauer") existiert bereits aber wird nirgends angezeigt → jetzt im Popover nutzen
- `Button`-Component hat `disabled`-State eingebaut → AI-Import-Button kann nativ disabled werden während Import läuft
- `useRef` + `.click()`-Pattern für File-Upload existiert in `npc-avatar-upload.tsx` → statt `<label>`-Trick nachbauen

## What We're NOT Doing

- Andere Master-Panels (Items, NPCs, Party) umbauen
- Neue Features im AI-Import-Flow (Drag&Drop, Multi-File-Preview, Progress)
- Schema-Änderungen am `monsters`-Table
- Full-blown Settings-Panel für den Bestiary-Bereich
- CI-Pipeline-Änderungen (die neuen Domains funktionieren automatisch in CI weil die Whitelists Code-seitig sind)

## Implementation Approach

**Block A (Phasen 1–3):** Erst Refactor, dann UI, dann Precise-Popover. Jede Phase hat eine lauffähige Zwischenstufe.

**Block B (Phasen 4–5):** Constants extrahieren, dann alle Referenzen umstellen, dann bestehende DB-User migrieren.

```
Block A                    Block B
Phase 1: Button-Refactor → Phase 4: Constants + API-Routes
Phase 2: Precise-Popover → Phase 5: E2E-Migration + DB-Rename
Phase 3: Manual QA (A)   → Phase 6: Manual QA (B) + Code-Review
```

## Architecture and Code Reuse

**Bestehend:**

- `<Button>` Component (`src/components/ui/button.tsx`) — Variants + Sizes
- `useRef` + hidden `<input>` pattern (`src/components/session/npc-avatar-upload.tsx:33,120-127`)
- `<Tooltip>` Component (`src/components/ui/tooltip.tsx`) — für Popover-Trigger
- `Settings2` Icon aus `lucide-react` — Cog-Icon am AI-Import-Button
- `master.preciseModeDesc` i18n-Key — bereits vorhanden, bisher ungenutzt

**Neu extrahieren:**

- `src/lib/test/constants.ts` — zentrale `TEST_DOMAIN`-Konstante für alle API-Routes + E2E-Helper

**Betroffene Dateien (Übersicht):**

```
src/
  components/master/
    master-bestiary-panel.tsx          # Block A: Header-Refactor + Precise-Popover
  components/character-sheet/
    share-dialog.tsx                   # Block B: Filter-Domain umstellen
  lib/test/
    constants.ts                       # NEU: zentrale TEST_DOMAIN Konstante
  app/api/
    test-login/route.ts                # Block B: TEST_DOMAIN import
    test-cleanup/route.ts              # Block B: TEST_DOMAIN import
    test-seed/route.ts                 # Block B: TEST_DOMAIN import
    test-seed-npc/route.ts             # Block B: TEST_DOMAIN import
    test-seed-cleanup/route.ts         # Block B: TEST_DOMAIN import
    test-party-cleanup/route.ts        # Block B: TEST_DOMAIN import
e2e/
  helpers/auth.ts                      # Block B: TEST_EMAIL + Domain-Referenz
  helpers/test-character.ts            # Block B: TEST_EMAIL
  helpers/test-npc.ts                  # Block B: TEST_EMAIL
  auth.setup.ts                        # Block B: TEST_EMAIL
  global-teardown.ts                   # Block B: TEST_EMAIL + SECONDARY_EMAIL
  share-dialog.spec.ts                 # Block B: Domain-Refs in Assertions
  party.spec.ts                        # Block B: TEST_EMAIL
  xp-management.spec.ts               # Block B: TEST_EMAIL
  magic-items.spec.ts                  # Block B: TEST_EMAIL
messages/
  de.json                              # Keine neuen Keys nötig (preciseModeDesc existiert)
  en.json                              # Keine neuen Keys nötig
```

---

## Phase 1: Button-Refactor (Block A)

### Overview

Die zwei Action-Buttons im Bestiary-Header auf einheitliche `<Button>`-Components umstellen. Precise-Mode-Checkbox wird temporär entfernt (kommt in Phase 2 als Popover zurück).

### Changes Required:

#### [ ] 1. AI-Import von `<label>` auf `<Button>` + `useRef` umstellen

**File**: `src/components/master/master-bestiary-panel.tsx`
**Changes**:

- `useRef<HTMLInputElement>(null)` für den hidden File-Input hinzufügen
- `<label>` durch `<Button variant="default" className="flex-1">` ersetzen, `onClick` triggert `fileInputRef.current?.click()`
- Hidden `<input type="file">` bleibt im DOM, aber außerhalb des Buttons
- Loading-State: `disabled={importing}` + Spinner via `<Loader2 className="animate-spin" />`
- Precise-Mode-Checkbox-Label (Zeilen 394-403) entfernen — der State `preciseMode` bleibt erhalten, wird in Phase 2 wieder angebunden

```tsx
const fileInputRef = useRef<HTMLInputElement>(null);

// Im JSX:
<div className="flex gap-2">
  <Button
    onClick={() => {
      setPendingVariants(null);
      setCreateOpen(true);
    }}
    className="flex-1"
    data-testid="gm-monster-create-toggle"
  >
    <Plus className="h-4 w-4" />
    {t("createMonster")}
  </Button>
  <Button
    onClick={() => fileInputRef.current?.click()}
    disabled={importing}
    className="flex-1"
    data-testid="gm-monster-ai-import"
  >
    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
    {importing ? t("monsterImporting") : t("monsterAIImport")}
  </Button>
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*,application/pdf"
    multiple
    className="hidden"
    onChange={(e) => e.target.files && handleAIImport(e.target.files)}
    disabled={importing}
    data-testid="gm-monster-ai-upload"
  />
</div>;
```

#### [ ] 2. `flex-wrap` entfernen

**File**: `src/components/master/master-bestiary-panel.tsx`
**Changes**: Container-Klasse von `flex flex-wrap gap-2` auf `flex gap-2` ändern — da die Precise-Checkbox weg ist, braucht nichts mehr zu wrappen.

### Success Criteria:

#### Automated Verification:

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes (1552 Unit-Tests)

**Implementation Note**: Phase hat nur automatisierte Verifizierung → direkt zu Phase 2 weiter.

---

## Phase 2: Precise-Mode-Popover (Block A)

### Overview

Precise-Mode als Disclosure-Popover am AI-Import-Button integrieren. Settings-Cog-Icon rechts im Button, Klick öffnet Popover mit Checkbox + Beschreibung.

### Changes Required:

#### [ ] 1. Settings-Cog + Popover in den AI-Import-Button integrieren

**File**: `src/components/master/master-bestiary-panel.tsx`
**Changes**:

- `Settings2` Icon von `lucide-react` importieren
- `Popover`, `PopoverTrigger`, `PopoverContent` von shadcn/ui importieren (oder `Tooltip` + clickable Trigger nutzen wenn Popover nicht vorhanden)
- Im AI-Import-Button: Settings-Cog rechts, onClick stopPropagation + toggled Popover
- Popover-Inhalt: Checkbox mit `preciseMode`-State + `t("preciseModeDesc")` als Beschreibung

```tsx
<div className="flex gap-2">
  <Button
    onClick={() => {
      setPendingVariants(null);
      setCreateOpen(true);
    }}
    className="flex-1"
    data-testid="gm-monster-create-toggle"
  >
    <Plus className="h-4 w-4" />
    {t("createMonster")}
  </Button>
  <div className="flex flex-1 gap-0">
    <Button
      onClick={() => fileInputRef.current?.click()}
      disabled={importing}
      className="flex-1 rounded-r-none"
      data-testid="gm-monster-ai-import"
    >
      {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
      {importing ? t("monsterImporting") : t("monsterAIImport")}
    </Button>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="default"
            size="icon-sm"
            className="rounded-l-none border-l border-primary-foreground/20"
            onClick={(e) => {
              e.stopPropagation();
              setPreciseMode(!preciseMode);
            }}
            data-testid="gm-monster-precise-toggle"
          >
            <Settings2
              className={`h-3.5 w-3.5 ${preciseMode ? "text-primary-foreground" : "text-primary-foreground/60"}`}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preciseMode}
              onChange={(e) => setPreciseMode(e.target.checked)}
              className="h-3.5 w-3.5"
              data-testid="gm-monster-precise-mode"
            />
            <div>
              <p className="font-medium text-sm">{t("preciseMode")}</p>
              <p className="text-xs text-muted-foreground">{t("preciseModeDesc")}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*,application/pdf"
    multiple
    className="hidden"
    onChange={(e) => e.target.files && handleAIImport(e.target.files)}
    disabled={importing}
    data-testid="gm-monster-ai-upload"
  />
</div>
```

**Hinweis:** Falls `Tooltip` als Popover zu fragil ist (dismisst bei Mouse-Leave), prüfe ob shadcn/ui `Popover` existiert und nutze das stattdessen. Fallback: einfacher Click-Toggle auf ein `div` unter dem Button.

#### [ ] 2. `data-testid` für alle neuen Elemente

- `gm-monster-precise-toggle` — der Settings-Cog-Button
- `gm-monster-precise-mode` — die Checkbox (behält bestehende testid)

### Success Criteria:

#### Automated Verification:

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes

**Implementation Note**: Nur automatisierte Verifizierung → weiter zu Phase 3.

---

## Phase 3: Manual QA für Block A

### Overview

Manuelle Verifikation des neuen Bestiary-Headers auf Mobile + Desktop. Screenshots an User via Discord.

### Success Criteria:

#### Manual Verification:

- [ ] Mobile (390px): Beide Buttons gleichmäßig nebeneinander, gleiche Höhe, gleicher Style (gold/primary)
- [ ] Desktop (1440px): Beide Buttons gleichmäßig, Settings-Cog sichtbar rechts am AI-Import-Button
- [ ] Klick auf "Monster erstellen" öffnet weiterhin das Create-Monster-Dialog
- [ ] Klick auf "KI-Import (Foto/PDF)" öffnet den File-Picker (nicht den Cog)
- [ ] Klick auf das Settings-Cog toggled den Precise-Mode-Indikator (und zeigt Popover/Tooltip mit Checkbox + Beschreibung)
- [ ] Loading-State: Während Import dreht Spinner, Button ist disabled, Create-Button bleibt klickbar
- [ ] Screenshots (Mobile + Desktop) an User via Discord senden

---

## Phase 4: Test-Infrastruktur-Constants extrahieren (Block B)

### Overview

Zentrale `TEST_DOMAIN`-Konstante erstellen, alle 6 API-Routes und `share-dialog.tsx` auf den Import umstellen.

### Changes Required:

#### [ ] 1. `src/lib/test/constants.ts` anlegen

**File**: `src/lib/test/constants.ts` (NEU)

```typescript
export const TEST_DOMAIN = "@qa.chaosforge.test";
export const TEST_PRIMARY_EMAIL = `QA-primary${TEST_DOMAIN}`;
export const TEST_SECONDARY_EMAIL = `QA-secondary${TEST_DOMAIN}`;
```

#### [ ] 2. API-Routes auf Import umstellen

**Files**: 6 API-Routes unter `src/app/api/test-*`

- `test-login/route.ts` — `import { TEST_DOMAIN } from "@/lib/test/constants"`, lokale Konstante entfernen
- `test-cleanup/route.ts` — analog
- `test-seed/route.ts` — analog, `secondaryEmail` auf `TEST_SECONDARY_EMAIL` umstellen
- `test-seed-npc/route.ts` — analog
- `test-seed-cleanup/route.ts` — analog
- `test-party-cleanup/route.ts` — analog

#### [ ] 3. Share-Dialog Production-Filter umstellen

**File**: `src/components/character-sheet/share-dialog.tsx:70`
**Change**: `endsWith("@chaos-forge.de")` → `import { TEST_DOMAIN }` + `endsWith(TEST_DOMAIN)`

#### [ ] 4. `.env.local` aktualisieren

**File**: `.env.local`
**Change**: `TEST_USER_EMAIL=QA-primary@qa.chaosforge.test`

### Success Criteria:

#### Automated Verification:

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes

**Implementation Note**: Nur automatisierte Verifizierung → weiter zu Phase 5.

---

## Phase 5: E2E-Helper + Specs auf QA-Domain migrieren (Block B)

### Overview

Alle E2E-Helper und Specs von `@chaos-forge.de` auf `@qa.chaosforge.test` umstellen. Bestehende Auth-User in der lokalen DB in-place umbenennen.

### Changes Required:

#### [ ] 1. E2E-Helper umstellen

**Files**:

- `e2e/helpers/auth.ts:3` — `TEST_EMAIL = "QA-primary@qa.chaosforge.test"`; Kommentar + `loginAsUser` Dokumentation anpassen
- `e2e/helpers/test-character.ts:3` — `TEST_EMAIL` analog
- `e2e/helpers/test-npc.ts:3` — `TEST_EMAIL` analog
- `e2e/auth.setup.ts:5` — `TEST_EMAIL` analog
- `e2e/global-teardown.ts:3-4` — `TEST_EMAIL` + `SECONDARY_EMAIL` analog

#### [ ] 2. E2E-Specs umstellen

**Files**:

- `e2e/share-dialog.spec.ts:5,14,55,76,81` — `TEST_EMAIL`, dynamische Share-User-Domain (`QA-share-${id}@qa.chaosforge.test`), Assertion-Strings
- `e2e/party.spec.ts:6` — `TEST_EMAIL`
- `e2e/xp-management.spec.ts:3` — `TEST_EMAIL`
- `e2e/magic-items.spec.ts:3` — `TEST_EMAIL`

#### [ ] 3. Bestehende Auth-User in-place umbenennen

**Script** (einmalig, nicht committed):

```typescript
const supabase = createClient(URL, SERVICE_ROLE_KEY);
const { data } = await supabase.auth.admin.listUsers();
// Rename christoph@chaos-forge.de → QA-primary@qa.chaosforge.test
// Rename test@chaos-forge.de → QA-secondary@qa.chaosforge.test
// Rename e2e-other@chaos-forge.de → QA-secondary@qa.chaosforge.test (falls vorhanden)
// Alle anderen @chaos-forge.de → löschen
for (const user of usersToRename) {
  await supabase.auth.admin.updateUserById(user.id, { email: newEmail });
}
```

#### [ ] 4. Auth-Setup verifizieren

Nach der Migration `npx playwright test --project=setup` laufen lassen um sicherzustellen, dass der neue Test-User korrekt eingeloggt wird.

### Success Criteria:

#### Automated Verification:

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npx playwright test --project=setup` passes (Auth-Setup mit neuer Domain)
- [ ] `npx playwright test` — volle E2E-Suite grün (oder nur pre-existing failures)

**Implementation Note**: Nur automatisierte Verifizierung → weiter zu Phase 6.

---

## Phase 6: Code-Review + Final QA

### Overview

Phase 3 (code-improver) + Phase 4 (manuelle QA) des Entwicklungs-Workflows. Dann `npm run verify` + PR.

### Changes Required:

#### [ ] 1. Code-Review via `code-improver` Agent

- Review auf `master-bestiary-panel.tsx` (Block A Änderungen)
- Review auf `src/lib/test/constants.ts` + alle Block B Änderungen
- Should-Fix-Issues direkt einbauen

#### [ ] 2. `npm run verify` (vollständiger CI-Spiegel)

- format:check, lint, typecheck, test, build

#### [ ] 3. `npm run format` vor dem Commit

#### [ ] 4. Test-User-Cleanup nach Abschluss

- `auth.admin.listUsers()` → nur `QA-primary@qa.chaosforge.test` + `QA-secondary@qa.chaosforge.test` dürfen übrig sein
- Alle alten `@chaos-forge.de`-Accounts löschen falls noch vorhanden

### Success Criteria:

#### Manual Verification:

- [ ] Bestiary-Header sieht auf Mobile + Desktop gut aus (User-Bestätigung via Discord-Screenshots)
- [ ] AI-Import funktioniert weiterhin (File-Picker → Scan → Form)
- [ ] Precise-Mode-Toggle ist korrekt am AI-Import-Button gekoppelt
- [ ] E2E-Suite läuft mit neuer QA-Domain grün
- [ ] PR erstellt, User merged

---

## Testing Strategy

### Unit Tests:

- Keine neuen Unit-Tests nötig — Block A ist reines UI-Refactoring, Block B ist String-Replacement in Infrastruktur
- Bestehende 1552 Tests müssen weiterhin grün sein

### E2E Tests:

- Auth-Setup (`e2e/auth.setup.ts`) muss mit neuer Domain funktionieren
- Share-Dialog-Test (`e2e/share-dialog.spec.ts`) muss mit neuer Domain-Assertion funktionieren
- Alle bestehenden E2E-Specs müssen weiterhin passen

### Manual Testing Steps:

1. GM-Dashboard öffnen → Monsters-Tab → Header prüfen (gleichmäßige Buttons)
2. "Monster erstellen" klicken → Create-Dialog muss öffnen
3. "KI-Import (Foto/PDF)" klicken → File-Picker muss öffnen
4. Settings-Cog am AI-Import klicken → Precise-Mode-Toggle muss erscheinen
5. Toggle Precise-Mode → Settings-Cog visuelles Feedback (volle/halbe Opacity)
6. Monster scannen mit Precise-Mode an → Scan muss mit Sonnet-Modell laufen (ggf. via API-Log verifizieren)

## Performance Considerations

Keine relevanten Performance-Änderungen. Block A ist reines DOM-Refactoring, Block B sind String-Konstanten.

## Migration Notes

### Block B Migration:

- **Lokale DB:** `auth.admin.updateUserById()` für Rename-in-place. FK-Referenzen (characters, chronicle_npcs, session_entries etc.) bleiben intakt weil die User-ID sich nicht ändert.
- **CI:** Keine manuelle Migration nötig — CI erstellt Test-User frisch per `test-login` API. Die neue Domain wird automatisch genutzt sobald der Code deployed ist.
- **Vercel Preview:** Nutzt die Supabase-Cloud, dort existieren die alten Test-User ggf. noch → werden bei nächstem E2E-Run via `test-login` mit neuer Domain automatisch erstellt.

## References

- Research-Bericht: `docs/agents/research/2026-04-12-bestiary-header-redesign.md`
- Items-Panel Vergleichs-Pattern: `src/components/master/master-items-panel.tsx:410-443`
- Button-Component: `src/components/ui/button.tsx`
- NPC-Avatar useRef-Pattern: `src/components/session/npc-avatar-upload.tsx:33,120-127`
- Tooltip-Component: `src/components/ui/tooltip.tsx`
