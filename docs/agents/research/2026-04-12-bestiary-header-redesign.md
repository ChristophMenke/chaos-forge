---
date: 2026-04-12T00:48:00+02:00
git_commit: 8bb05ea04c3752aa7461ff38bba47b10beb57308
branch: main
topic: "Bestiary-Header-Layout im Master-Panel — Status quo & Vergleich"
tags: [research, master, bestiary, header, ai-import, precise-mode]
status: complete
---

# Research: Bestiary-Header-Layout im Master-Panel

## Research Question

Im GM-Bestiary-Panel auf Mobile (siehe Screenshot `ressources/upload/bestiary-header-mobile.png`) sieht der Header oben verbastelt aus:

1. **"Create Monster" (gelb, schmal)** und **"AI Import (Photo/PDF)" (outline, breit, 2-zeilig)** sind komplett unterschiedlich groß und stylistisch — kein konsistentes Action-Pattern.
2. **"Precise mode" Checkbox** sitzt visuell unter "Create Monster", obwohl sie nur für den AI-Import relevant ist → irreführend.
3. Generell sieht der Header verbastelt aus.

Was ich brauche:

- Status quo des aktuellen Headers (Code, Layout, States, AI-Import-Flow, Precise-Mode-Konsumption)
- Vergleich mit anderen Master-Panels (gibt es ein etabliertes Pattern, das hier nicht angewandt wurde?)
- Wo sitzen Precise-Mode oder vergleichbare Toggles in anderen AI-Import-Flows?
- i18n-Keys + tatsächlicher Text der relevanten Labels

## Summary

Der Header des `MasterBestiaryPanel` ist ein einzeiliger `flex flex-wrap gap-2`-Container mit drei Geschwistern: einem `<Button>`-Component (Create Monster), einem als Button gestyltem `<label>`-Element mit verstecktem File-Input (AI Import), und einem dritten `<label>`-Element für die Precise-Mode-Checkbox. Die ersten beiden haben `flex-1`, die Checkbox nicht. Auf Mobile (390px) führt das `flex-wrap` dazu, dass das Layout zwar bricht, die Checkbox aber direkt nach den Buttons in der Wrap-Reihenfolge fließt — visuell landet sie unter "Create Monster", ist aber funktional an "AI Import" gekoppelt.

Ein vergleichbares "zwei flex-1-Buttons"-Pattern existiert in `MasterItemsPanel`, dort allerdings mit **identischer Stilisierung** beider Buttons (`bg-primary/10`) und ohne dritten Toggle. Andere Master-Panels (NPCs, Party, Bookmarks, Gold) verwenden jeweils unterschiedliche Header-Patterns und keine Mischung aus Default-Button + Outline-Label.

Der Precise-Mode wird vom Endpoint `/api/scan-monster` lediglich als Model-Switch zwischen Claude Haiku 4.5 (default) und Claude Sonnet 4 (precise) interpretiert — der Prompt selbst ist identisch. Es gibt **eine zweite UI-Stelle**, an der der Toggle in der App auftaucht: `src/app/characters/import/page.tsx`, dort jedoch nicht im Listen-Header sondern auf einer dedizierten Import-Seite.

## Detailed Findings

### 1. Aktueller Bestiary-Header

**Datei:** `src/components/master/master-bestiary-panel.tsx`

#### Container und Buttons (Zeilen 360-404)

```tsx
<div className="space-y-4" data-testid="gm-bestiary-panel">
  {/* Create + AI Import Toolbar */}
  <div className="flex flex-wrap gap-2">
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
    <label
      className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background/50 px-4 py-2 text-sm font-medium transition-colors hover:bg-background/70 ${importing ? "pointer-events-none opacity-60" : ""}`}
      data-testid="gm-monster-ai-import"
    >
      {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
      {importing ? t("monsterImporting") : t("monsterAIImport")}
      <input
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleAIImport(e.target.files)}
        disabled={importing}
        data-testid="gm-monster-ai-upload"
      />
    </label>
    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
      <input
        type="checkbox"
        checked={preciseMode}
        onChange={(e) => setPreciseMode(e.target.checked)}
        className="h-3.5 w-3.5"
        data-testid="gm-monster-precise-mode"
      />
      {t("preciseMode")}
    </label>
  </div>
```

#### Wichtige Eigenschaften:

- **Container:** `flex flex-wrap gap-2`. Wrap-Reihenfolge ist DOM-Reihenfolge: Create → AI Import → Precise-Checkbox.
- **Create Monster:** `<Button>`-Component aus `@/components/ui/button` mit `className="flex-1"`. Nutzt die Default-Variante (= primary, gelb/amber im Glassmorphism-Theme).
- **AI Import:** Kein `<Button>`-Component, sondern `<label>` mit `flex flex-1 ...`. Der Label-Trick erlaubt es, einen versteckten `<input type="file">` zu hosten und das ganze Element wie einen Button aussehen zu lassen. Stilisierung: `border border-border bg-background/50 ... rounded-md` — entspricht der Outline-Variante, aber **nicht** über die Button-Variants gerendert.
- **Precise-Mode:** Drittes `<label>` ohne `flex-1`, nur `text-xs text-muted-foreground`. Hat keine eigene Zeile/Box, sondern ist Geschwister der zwei Buttons im selben flex-Container.
- **Loading-State:** Beim Importieren wird das `<label>` über `pointer-events-none opacity-60` deaktiviert; Spinner und veränderter Text werden inline gerendert.

#### State-Verdrahtung:

- `preciseMode: boolean` lebt im Component-State (Zeile 138): `const [preciseMode, setPreciseMode] = useState(false);`
- `importing: boolean` (Zeile 134) regelt den Loading-Indikator auf dem AI-Import-Label
- `createOpen: boolean` (Zeile 131) öffnet das Create-Dialog
- `pendingVariants: ScannedMonsterVariant[] | null` (Zeile 133) hält die Scan-Ergebnisse zwischen "Scan fertig" und "Variant Picker / Form öffnen"

#### handleAIImport-Flow (Zeilen 181-218):

1. `setImporting(true)`
2. Files werden via `compressImageIfNeeded` clientseitig komprimiert
3. FormData mit allen Files + optional `precise=true` (nur wenn `preciseMode === true`)
4. POST an `/api/scan-monster`
5. Response enthält `variants: ScannedMonsterVariant[]`
   - Bei 1 Variant: `setCreateOpen(true)` + `setPendingVariants(variants)` → Create-Dialog öffnet sich mit pre-filled MonsterForm
   - Bei mehreren Varianten: `setPendingVariants(variants)` → separater MonsterVariantPicker-Dialog (Zeilen 645-664)
6. `setImporting(false)`

### 2. Endpoint `/api/scan-monster`

**Datei:** `src/app/api/scan-monster/route.ts`

- **Zeile 132:** `const preciseMode = formData.get("precise") === "true";`
- **Zeile 136:** Model-Selection:
  - `precise === true` → `claude-sonnet-4-20250514`
  - `precise === false` → `claude-haiku-4-5-20251001`
- **Zeile 137:** `max_tokens: 8192`
- **Response-Schema** (Zeile 51-53): `{ variants: ScannedMonsterVariant[] }`
- **Prompt-Datei:** `src/lib/scan/monster-scan-prompt.ts` Zeilen 59-135. Der Prompt selbst ist **identisch** für beide Modi — der Unterschied liegt ausschließlich im Modell.

**Implikation:** Precise-Mode ist semantisch ein "Slow but accurate"-Toggle, technisch nur ein Modell-Switch. Trade-off: Sonnet ist genauer bei komplexen oder handschriftlichen Stat-Blocks, Haiku ist schneller und billiger.

### 3. Vergleichs-Endpoint `/api/scan-character`

**Datei:** `src/app/api/scan-character/route.ts`

- **Zeile 106:** Identische Precise-Verarbeitung: `formData.get("precise") === "true"`
- **Zeile 111:** Identische Model-Selection (Sonnet vs. Haiku)
- **Zeile 112:** `max_tokens: 4096` (vs. 8192 beim Monster-Scan)
- **Prompt:** Inline im Route-Handler, nicht in separater Datei

### 4. Andere UI-Stellen mit `precise`-Flag

Vollständige Suche in `src/`:

| Datei                                             | Zeile             | Kontext                                                                        |
| ------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------ |
| `src/components/master/master-bestiary-panel.tsx` | 138, 191, 397-403 | State + FormData-Append + Inline-Checkbox im Header                            |
| `src/app/characters/import/page.tsx`              | 100               | State + FormData-Append; UI auf dedizierter Import-Seite (nicht Inline-Header) |

**Beobachtung:** Es gibt nur diese zwei Stellen. Im Character-Import lebt der Toggle auf einer eigenen Seite, im Bestiary direkt im Listen-Header.

### 5. Vergleich mit anderen Master-Panels

Übersicht aller Master-Panel-Komponenten in `src/components/master/`:

| Panel     | Datei                                | Header-Pattern                                                                                      |
| --------- | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Bestiary  | `master-bestiary-panel.tsx:362-404`  | 2 Buttons (`flex-1`) + Checkbox, Mix aus `<Button>` + `<label>`                                     |
| Items     | `master-items-panel.tsx:410-443`     | 2 Buttons (`flex-1`), beide identisch gestylt (`bg-primary/10`), beide togglen Disclosure           |
| NPCs      | `master-npcs-panel.tsx:271-393`      | 3 Buttons (fest dimensioniert, keine `flex-1`), unterschiedliche Akzentfarben (primary/green/amber) |
| Party     | `master-party-panel.tsx:122-219`     | Kein Add/Create, nur Statistic Banner + Hero-Cards                                                  |
| Bookmarks | `master-bookmarks-panel.tsx:148-177` | Kein Add/Create, nur Display                                                                        |
| Gold      | `master-gold-panel.tsx:174-488`      | Kein Add/Create, Treasury Banner + Hero-Selection                                                   |

#### MasterItemsPanel (das nächste Pattern-Match)

**Datei:** `src/components/master/master-items-panel.tsx:410-443`

```tsx
<div className="mb-3 space-y-2">
  <div className="flex gap-2">
    <button
      onClick={() => {
        setShowCreate(!showCreate);
        setShowMagicCreate(false);
      }}
      className="flex flex-1 items-center justify-between rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
      data-testid="gm-create-toggle"
    >
      <span className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        {t("createCustom")}
      </span>
      {showCreate ? <ChevronUp /> : <ChevronDown />}
    </button>
    <button
      onClick={() => {
        setShowMagicCreate(!showMagicCreate);
        setShowCreate(false);
      }}
      className="flex flex-1 items-center justify-between rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
      data-testid="gm-magic-create-toggle"
    >
      <span className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        {t("createMagicItem")}
      </span>
      {showMagicCreate ? <ChevronUp /> : <ChevronDown />}
    </button>
  </div>
  {showCreate && <GlassCard>...inline form...</GlassCard>}
</div>
```

**Wichtige Unterschiede zum Bestiary:**

- Beide Items-Buttons sind native `<button>`-Elemente (kein `<Button>`-Component, kein `<label>`-Trick)
- **Beide identisch gestylt** mit `bg-primary/10 ... text-primary` — konsistente Farbgebung
- Chevron auf der rechten Seite zeigt Open/Closed-State der Disclosure
- Buttons triggern **kein Modal**, sondern togglen ein **Inline-Disclosure** unterhalb (eine `GlassCard` mit Form-Inhalt)
- Kein dritter Toggle/Checkbox im Header

#### MasterNpcsPanel

**Datei:** `src/components/master/master-npcs-panel.tsx:271-393`

Drei Buttons mit unterschiedlichen Akzentfarben für unterschiedliche Aktionstypen (Create Simple, Create Advanced, Copy from Character), alle fest dimensioniert (`px-3 py-2`), kein `flex-1`. Container ist `flex flex-wrap items-center gap-2`. Filter-Selects und View-Toggle sind separate Elemente im selben Container.

### 6. i18n-Keys

| Key                           | Deutsch (`messages/de.json`)      | Englisch (`messages/en.json`)    |
| ----------------------------- | --------------------------------- | -------------------------------- |
| `master.createMonster`        | "Monster erstellen"               | "Create Monster"                 |
| `master.monsterAIImport`      | "KI-Import (Foto/PDF)"            | "AI Import (Photo/PDF)"          |
| `master.monsterImporting`     | "Monster wird analysiert..."      | "Analyzing monster..."           |
| `master.preciseMode`          | "Präziser Modus"                  | "Precise mode"                   |
| `master.preciseModeDesc`      | "langsamer, genauer"              | "slower, more accurate"          |
| `master.monsterImportSuccess` | "Monster erfolgreich importiert!" | "Monster imported successfully!" |
| `master.monsterImportFailed`  | "Import fehlgeschlagen."          | "Import failed."                 |

**Beobachtung:** Es existiert bereits eine Beschreibung `preciseModeDesc` ("langsamer, genauer"), die im aktuellen Header **nicht** verwendet wird. Der Tooltip-Text ist also schon übersetzt, nur nicht angezeigt.

### 7. Mobile-Constraints und Wrap-Verhalten

- Bestiary-Container: `flex flex-wrap gap-2` ohne explizite Breakpoints
- Auf Mobile (~390px Breite, abzüglich Padding der äußeren Layouts):
  - Beide `flex-1`-Buttons konkurrieren um die volle Zeilenbreite
  - Bei einem 2-zeiligen AI-Import-Label ("AI Import (Photo/PDF)") kann der Button intern auf 2 Zeilen brechen, während Create Monster 1-zeilig bleibt → unterschiedliche Höhe
  - Die Precise-Mode-Checkbox passt nicht in die erste Zeile, wird via `flex-wrap` auf eine eigene Zeile umgebrochen
  - Die DOM-Reihenfolge der Wrap-Children ist Create → Import → Precise; nach dem Wrap erscheint Precise visuell am Anfang der zweiten Zeile, also unterhalb von Create Monster (dem Element, das links steht)
- Es gibt **keinen** `sm:` oder `md:` Breakpoint im Header — das Layout ist für alle Größen gleich

### 8. Gesamter Detail-Bestand des Bestiary-Panels

Das Panel rendert nach dem Header noch eine zweite Toolbar (Search, Filter, Sort, View-Toggle) bei `master-bestiary-panel.tsx:407-504`, dann die Result-Anzeige (Grid oder List) und mehrere Dialoge (Create, Variant Picker, Edit, Delete-Confirm). Die Action-Buttons befinden sich isoliert ganz oben im Header und gehören nicht zur Filter-Toolbar.

## Code References

- `src/components/master/master-bestiary-panel.tsx:138` — `useState(false)` für `preciseMode`
- `src/components/master/master-bestiary-panel.tsx:181-218` — `handleAIImport` Funktion (FormData-Konstruktion + `precise`-Append)
- `src/components/master/master-bestiary-panel.tsx:362-404` — Header-Toolbar (Create, AI Import, Precise-Checkbox)
- `src/components/master/master-bestiary-panel.tsx:600-643` — Create Monster Dialog
- `src/components/master/master-bestiary-panel.tsx:645-664` — Multi-Variant Picker Dialog
- `src/components/master/master-items-panel.tsx:410-443` — Vergleichs-Pattern: zwei `flex-1` Buttons mit identischem Style
- `src/components/master/master-npcs-panel.tsx:271-393` — Vergleichs-Pattern: drei Buttons fest dimensioniert
- `src/app/api/scan-monster/route.ts:132,136` — Precise-Mode-Verarbeitung (Model-Switch)
- `src/lib/scan/monster-scan-prompt.ts:59-135` — Prompt-Definition (identisch für beide Modi)
- `src/app/characters/import/page.tsx:100` — Zweite UI-Stelle mit `precise`-Toggle
- `src/components/ui/button.tsx:6-41` — Button-Variants (`default`, `outline`, `ghost`, `secondary`, `destructive`, `link`) und Sizes (`default`, `xs`, `sm`, `lg`, `icon`, `icon-sm`, `icon-lg`)
- `messages/de.json` (chronicle._ + master._ Namespaces) — i18n-Keys
- `messages/en.json` — englische Pendants

## Architecture Documentation

### Etablierte Action-Header-Patterns in Master-Panels

1. **"Two flex-1 buttons mit Disclosure"** — Items-Panel: zwei native `<button>` mit identischem `bg-primary/10`-Style, Chevron-Indikator für Open/Closed-State, triggern eingebettete Form-Disclosure (kein Modal)
2. **"Drei freistehende Aktion-Buttons"** — NPCs-Panel: feste Größen, unterschiedliche Akzentfarben pro Aktionstyp, kein `flex-1`
3. **"Two flex-1 buttons mit Mixed-Style + Modal-Trigger + Inline-Toggle"** — Bestiary-Panel: einzigartig in der Codebase. Kombiniert `<Button>`-Component (gelb) + `<label>` (outline-styled) + getrennte Checkbox

### Button-Component-System

`src/components/ui/button.tsx` definiert via `cva` mehrere Variants. Im Bestiary wird die `default`-Variante (= primary) für Create benutzt, während AI Import als `<label>` ohne Variant-Klassen gerendert wird. Die `outline`-Variante (`border-border bg-background hover:bg-muted`) gibt es bereits im Button-System.

### File-Upload-Pattern

Das `<label>`-mit-verstecktem-`<input type="file">`-Pattern wird gewählt, weil HTML-Buttons keinen File-Picker triggern können — der `<input type="file">` muss DOM-Kind eines klickbaren Elements sein, oder es muss ein synthetisches `.click()` über ein `useRef` ausgelöst werden. Andere File-Upload-Komponenten in der Codebase (z.B. `npc-avatar-upload.tsx`) nutzen ein `useRef` + Button + verstecktes Input. Beide Wege sind im Codebase vertreten.

### State-Lebenszyklus des Headers

`createOpen`, `editingMonster`, `pendingVariants`, `importing`, `savingMonster`, `preciseMode`, `deleteConfirmId` — alle in lokalem `useState` des `MasterBestiaryPanel`. Es gibt keinen Custom Hook und keinen Reducer, sondern flache useState-Zustände.

## Open Questions

Keine — alle für die Plan-Phase nötigen Informationen sind gesammelt. Was die Plan-Phase entscheiden muss (wird nicht hier dokumentiert):

- Ob "Precise mode" in den AI-Import-Modal-Flow oder als Disclosure am AI-Button selbst wandert
- Ob beide Buttons auf das Items-Pattern angeglichen oder beide auf den `<Button>`-Component umgestellt werden
- Wie sich das Design in den `MasterItemsPanel`-Stil einfügt, ohne dort etwas zu ändern (Cross-Panel-Konsistenz vs. Bestiary-spezifische Lösung)
- Wie das Loading-State + Disable-Verhalten beim AI-Import-Button gehandhabt wird, wenn er kein `<label>` mehr ist
