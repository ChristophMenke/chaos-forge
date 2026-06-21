---
date: 2026-06-21T09:31:21Z
git_commit: 352b06a3814f86e4a5107488483686811c515366
branch: feat/sidebar-avatar-center-click
topic: "Sprockets Mix-n-Match-Klingen: Phiolen-/Wurf-Mechanik"
tags: [plan, epic-items, blade-system, sprocket]
status: draft
---

# Sprockets Mix-n-Match-Klingen: Phiolen-/Wurf-Mechanik — Implementierungsplan

## Overview

Die Wurfklingen sollen realistischer funktionieren: Beim Werfen wird zwischen
**Treffer** und **Fehlwurf** unterschieden. Bei Treffer ist die Phiole verbraucht
(Klinge = normaler Wurfdolch, muss nachgeladen werden). Bei Fehlwurf kann die
Phiole zerbrechen oder intakt bleiben (intakt → Klinge bleibt bestückt). Eine
geworfene Klinge kann zudem **verloren** gehen, und verlorene Klingen lassen sich
durch **Schmieden** bis zum Maximum (4) ersetzen. Das „Nachladen" einer leeren
Klinge funktioniert wie ein bewusster Nachlade-Schritt (analog Armbrust).

## Current State Analysis

- Gesamte Blade-Logik liegt in `src/components/epic-equipment/blade-system-card.tsx`
  (Z. 58–356), persistiert das komplette `simple_effects`-JSONB via direktem
  Supabase-`.update()`. **Keine Unit-Tests.**
- `Blade` = `{ id, mixture: string|null, status: "ready"|"thrown" }`.
  Es gibt nur `ready`/`thrown`; keinen „leer/verbraucht"-Zustand, keine
  Treffer-/Fehlwurf-Unterscheidung, keinen Verlust.
- `handleThrow` setzt nur `status:"thrown"`; `handleCollect` setzt immer
  `mixture:null, status:"ready"` (Phiole geht **immer** verloren).
- `handleLoadBlade` (Phiole einsetzen, Vorrat −1) und `handleCraft`
  (Mixtur-Vorrat +1) existieren bereits.
- Seed: `supabase/migrations/00054_seed_sprocket_blades.sql` — 4 Klingen `ready`,
  `mixture:null`; `max_prepared:4`; 4 Mixturen (`red/blue/green/purple`).
- i18n-Keys (Namespace `epic`, `messages/de.json` Z. 1289–1297 + `en.json`):
  `bladesReady, bladeEmpty, bladeThrown, bladeLoad, bladeThrow, bladeCollect,
bladesThrown, mixtureInventory, mixtureCraft`.

## Desired End State

Pro Klinge ein erweitertes Zustandsmodell mit Treffer-/Fehlwurf-Auflösung,
Verlust und Schmieden. Die reine Zustandslogik liegt in einem **testbaren Modul**
(`src/lib/rules/blades.ts`) mit Vitest-Tests; die Komponente ruft diese reinen
Funktionen auf und persistiert das Ergebnis.

```
leer (mixture:null) ──[Bestücken/Nachladen, Vorrat −1]──> bestückt (mixture:key, ready)
bestückt ──[Treffer]──> geworfen (thrown, outcome:"hit")
bestückt ──[Fehlwurf]──> geworfen (thrown, outcome:"miss")
geworfen ──[Einsammeln]──> hit: leer · miss→[intakt]: bestückt / [zerbrochen]: leer
geworfen ──[Verloren]──> Klinge entfernt (blades.length sinkt; "X/4")
blades.length < 4 ──[Klinge schmieden]──> + leere Klinge
```

## What We're NOT Doing

- **Kein** Play-Mode-Panel — Mechanik bleibt in der Epische-Ausrüstung-Ansicht.
- **Keine** Materialkosten/GP fürs Schmieden.
- **Kein** automatischer Würfelwurf (Treffer/Fehlwurf und Bruch werden manuell
  per Button entschieden).
- **Keine** Rückerstattung von Phiolen in den Vorrat (intakte Phiole bleibt am
  Blade, kein Inventar-Rückfluss).
- **Keine** DB-Migration (Feld `outcome` optional, abwärtskompatibel).

## UI Mockups

Klingen-Slot je nach Zustand (Aktionen unten):

```
 LEER              BESTÜCKT          GEWORFEN (hit)     GEWORFEN (miss)
┌──────────┐      ┌──────────┐      ┌──────────┐       ┌──────────┐
│   (3)    │      │   (2)    │      │    —     │       │    —     │
│  Leer    │      │Gefrierbr.│      │Getroffen │       │ Verfehlt │
│[Bestücken]│      │[Treffer] │      │[Einsammeln]│      │[Einsammeln]│
│          │      │[Fehlwurf]│      │[Verloren]│       │[Verloren]│
└──────────┘      └──────────┘      └──────────┘       └──────────┘

Einsammeln nach Fehlwurf (inline, wie Mixtur-Picker):
   [ Phiole intakt ]   [ Zerbrochen ]   ✕

Kopfzeile, wenn Klingen fehlen:
   Vorbereitete Klingen (2/4)      [ + Klinge schmieden ]
```

## Architecture and Code Reuse

Reine Logik wird aus der Komponente in ein neues Rules-Modul extrahiert (DRY +
Testbarkeit). Typen (`Blade`, `MixtureInfo`, `BladeSystemData`) wandern dorthin und
werden in der Komponente importiert statt lokal dupliziert.

- `src/lib/rules/`
  - `blades.ts` _(neu)_ — reine Transformationsfunktionen + Typen
    - `BladeOutcome = "hit" | "miss"`, `Blade`, `MixtureInfo`, `BladeSystemData`
    - `loadBlade(blades, mixtures, id, key)` — Vorrat −1, `mixture=key`, `status:"ready"`, `outcome` gelöscht
    - `throwBlade(blades, id, outcome)` — `status:"thrown"`, `outcome` gesetzt
    - `collectBlade(blades, id, vialIntact)` — hit→leer; miss & intakt→bleibt bestückt; miss & zerbrochen→leer; `status:"ready"`, `outcome` gelöscht
    - `loseBlade(blades, id)` — Klinge aus Array entfernen
    - `forgeBlade(blades, maxPrepared)` — leere Klinge ergänzen, wenn `length < max`; neue `id = max(ids)+1`
  - `index.ts` — Barrel-Export ergänzen
- `src/components/epic-equipment/blade-system-card.tsx` — Handler rufen die reinen
  Funktionen auf; neuer State `collectingBlade`; neue Buttons/Labels; Typen-Import
- `messages/de.json`, `messages/en.json` — neue `epic`-Keys
- `src/lib/rules/blades.test.ts` _(neu)_ — Vitest-Tests aller Funktionen

## Performance Considerations

Reine Array-Transformationen auf max. 4 Elementen — vernachlässigbar. Persistenz
bleibt ein einzelnes `.update()` pro Aktion (unverändert).

## Migration Notes

Keine DB-Migration nötig. `outcome` ist optional; bestehende Blade-Rows (nur
`status:"ready"`) laden unverändert. Defensive Behandlung: ein `thrown`-Blade ohne
`outcome` wird beim Einsammeln wie `miss` behandelt (Intakt-/Zerbrochen-Abfrage),
sodass Altdaten nie Phiolen „geschenkt" bekommen.

---

## Phase 1: Reine Zustandslogik + Typen + Tests (TDD)

Extraktion der Blade-Domänenlogik in ein testbares Modul. Keine UI-Änderung.

**Tasks**:

- [x] `src/lib/rules/blades.ts` anlegen: Typen `BladeOutcome`, `Blade`
      (`{ id; mixture: string|null; status: "ready"|"thrown"; outcome?: BladeOutcome }`),
      `MixtureInfo`, `WeaponStats`, `BladeSystemData` (aus der Komponente übernommen).
- [x] `loadBlade(blades, mixtures, id, key)` → `{ blades, mixtures }`. Guard:
      `mixtures[key].count <= 0` ⇒ unverändert zurück. Sonst `count−1`, Blade
      `{ mixture:key, status:"ready" }` (outcome entfernt).
- [x] `throwBlade(blades, id, outcome)` → Blade `{ status:"thrown", outcome }`
      (mixture bleibt für Anzeige erhalten).
- [x] `collectBlade(blades, id, vialIntact)` → Regeln:
      `outcome==="hit"` ⇒ `mixture:null`; `outcome` anders/fehlt (miss) ⇒
      `vialIntact ? mixture bleibt : mixture:null`; immer `status:"ready"`,
      outcome entfernt.
- [x] `loseBlade(blades, id)` → Array ohne diese Klinge.
- [x] `forgeBlade(blades, maxPrepared)` → bei `length < max` eine leere Klinge
      `{ id: max(ids)+1 (oder 1), mixture:null, status:"ready" }` anhängen, sonst
      unverändert.
- [x] `src/lib/rules/index.ts`: Re-Export von `blades.ts`.

**Automated Verification**:

- [x] `src/lib/rules/blades.test.ts` (Unit, 14 Fälle) grün: loadBlade dekrementiert
      Vorrat / blockt bei count 0 & unbekannter Mixtur; throwBlade hit+miss setzt
      outcome; collectBlade hit→leer; miss+intakt→bestückt; miss+zerbrochen→leer;
      ohne outcome→wie miss; loseBlade entfernt; forgeBlade füllt bis max & nicht
      darüber; eindeutige neue id.
- [x] `npm run typecheck` sauber (volle `npm run verify` am Ende von Phase 2).

---

## Phase 2: Komponenten-UI + i18n

[Dependencies: **Phase 1**]

`BladeSystemCard` auf die neuen Funktionen umstellen, neue Aktionen/Labels.

**Tasks**:

- [x] Lokale Interface-Duplikate in `blade-system-card.tsx` entfernen, Typen aus
      `@/lib/rules/blades` (bzw. `@/lib/rules`) importieren.
- [x] Handler auf reine Funktionen umstellen + persistieren:
      `handleLoadBlade`→`loadBlade`, neuer `handleThrow(id, outcome)`,
      `handleCollect(id, vialIntact)`, `handleLose(id)`→`loseBlade`,
      `handleForge()`→`forgeBlade`. Optimistic State + `persistState`.
- [x] State `collectingBlade: number | null` für die Intakt-/Zerbrochen-Inline-Wahl.
- [x] Slot-Rendering anpassen:
  - bestückt: Buttons **Treffer** (`bladeThrowHit`) / **Fehlwurf** (`bladeThrowMiss`)
  - geworfen: Label `outcome==="hit" ? bladeHit : bladeMiss`; Buttons
    **Einsammeln** / **Verloren** (`bladeLost`). Einsammeln bei `hit` ⇒ direkt
    `handleCollect(id, false)`; bei `miss` ⇒ `collectingBlade=id` öffnet inline
    **Phiole intakt** (`bladeVialIntact`) / **Zerbrochen** (`bladeVialBroken`).
  - leer: Button **Bestücken** (`bladeLoad`, unverändert) als Nachladen.
- [x] Kopfzeile: Zähler `({blades.length}/{max_prepared})`; wenn `<` max
      ein Button **Klinge schmieden** (`bladeForge`).
- [x] `messages/de.json` + `messages/en.json` (Namespace `epic`) ergänzen:
      `bladeThrowHit` (Treffer/Hit), `bladeThrowMiss` (Fehlwurf/Miss),
      `bladeHit` (Getroffen/Hit), `bladeMiss` (Verfehlt/Miss),
      `bladeVialIntact` (Phiole intakt/Vial intact),
      `bladeVialBroken` (Zerbrochen/Broken), `bladeLost` (Verloren/Lost),
      `bladeForge` (Klinge schmieden/Forge blade).

**Automated Verification**:

- [x] `npm run verify` passt (1592 Tests grün, Build kompiliert, 0 Lint-Errors;
      verbleibende 2 Warnings sind vorbestehend, nicht aus diesen Dateien).

**Manual Verification**:

- [ ] Auf der Epische-Ausrüstung-Seite von Sprocket:
  1. Leere Klinge **Bestücken** → Mixtur-Vorrat −1, Klinge zeigt Mixturname.
  2. **Treffer** werfen → Klinge „Geworfen · Getroffen"; **Einsammeln** → Klinge
     ist **leer** (muss nachgeladen werden).
  3. **Fehlwurf** werfen → **Einsammeln** → **Phiole intakt** → Klinge bleibt
     bestückt; erneut werfen → Einsammeln → **Zerbrochen** → Klinge leer.
  4. Geworfene Klinge **Verloren** → Zähler sinkt auf z.B. 3/4.
  5. **Klinge schmieden** → leere Klinge zurück bis 4/4; über 4 nicht möglich.
  6. Seite neu laden → alle Zustände korrekt persistiert.

---

## References

- Research: `docs/agents/research/2026-06-21-sprocket-blade-vial-mechanic.md`
- Komponente: `src/components/epic-equipment/blade-system-card.tsx:58-356`
- Seed: `supabase/migrations/00054_seed_sprocket_blades.sql`
- i18n: `messages/de.json:1289-1297`, `messages/en.json` (Namespace `epic`)
