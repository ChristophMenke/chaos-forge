---
date: 2026-10-06T13:37:06+00:00
git_commit: 1e1db9f366cff207fbfb62a58f183a5cf0724f55
branch: feat/sprocket-overclock-crafting
topic: "Sprocket: Übertakten mit Ingenieurskunst-Wurf, Reparatur mit Kupferelixier, Herstellung mit Komponenten-Checkliste"
tags: [plan, epic-items, kondensator, overclock, blades, crafting, play-mode, undo]
status: draft
---

# Sprocket: Übertakten, Reparatur und Herstellung – Implementation Plan

## Overview

Sprockets Kondensator wird nach Spielregeln bedienbar: Übertakten nur nach gelungenem Ingenieurskunst-Wurf (Fehlschlag = +1 Schadensstufe), danach pro Spielstunde +1 TP und ein Kühlungswurf mit wachsender Erschwernis (misslingt er, schaltet Sprocket ab). Dazu ein Reparatur-Dialog mit Kupferelixier (+4) und eine Herstellung von Mixturen und Kupferelixier über eine Komponenten-Checkliste. Grundlage: `docs/agents/research/2026-10-06-sprocket-overclock-crafting.md`.

## Current State Analysis

- Übertakten: `simple_effects.overclock` (Fähigkeit) + `overclock_active`/`overclock_end_time` (Zustand). Aktivieren ohne Wurf, Echtzeit-Timer 1 h (`damage-level-card.tsx:431-543`), Heilung wird nicht verrechnet. Play Mode zeigt nur ein read-only Banner (`play-overclock-banner.tsx`) und schreibt nie in `epic_items` (`play-mode.tsx:230, 307-321`).
- Reparatur/Elixier: nur Text (`repair_skill`, `elixir_bonus: 4`, `elixir_cost_gp: 100`), kein Bestand.
- Mixturen: `mixtures[key].count`, „Herstellen“ = +1 ohne Bedingung (`blade-system-card.tsx:116-124`).
- Schreibpfade Epic-Seite: `updateSimpleEffects`, `handleDamageLevelChange` + `persistHpAfterConChange` (`epic-equipment-view.tsx:107-281`), jeweils ein Undo-Schritt.
- Epic-Seite lädt kein Gold und keine NWPs (`epic/page.tsx`); Play Mode lädt alles (`play/page.tsx:59-87`).
- NWP-Zielwert nur inline in `play-checks-panel.tsx:254-273`. Ingenieurskunst = INT −3 (`00010_proficiencies.sql:134`).
- `undo-coverage.test.ts` verlangt Aufzeichnung jeder Schreibstelle und Label-Keys in beiden Sprachdateien.

## Desired End State

- Kondensator-Karte (Epic-Seite): Übertakten-Bereich mit „Übertakten“ (Wurf-Dialog), bei aktiv „Stunde N“, nächster Kühlungswurf-Modifikator, „Eine Stunde vergeht“, „Beenden“. Reparatur-Button (bei Schadensstufe > 0) mit Wurf-Dialog und Elixier-Option. Kupferelixier-Bestand mit −/+ und Rezept-Checkliste inkl. 100 GM aus der Börse.
- Klingen-Karte: pro Mixtur Rezept-Checkliste; „Herstellen“ nur bei vollständiger Liste, +2, Liste geleert; −/+ zur Korrektur.
- Play Mode: Banner bedient Übertakten (Zielwert aus Ingenieurskunst + Effekten), Stunde, Beenden; inaktiv eine schmale Startzeile (nur Besitzer, nur wenn Fähigkeit verfügbar).
- Jede Nutzeraktion = genau ein Undo-Schritt; Häkchen und Bestände ändern nur Besitzer.
- Kein Echtzeit-Timer mehr; `overclock_end_time` und `duration_hours` existieren nicht mehr.

### Spielregeln (verbindlich)

| Aktion | Gelungen | Misslungen |
|---|---|---|
| Übertakten | `overclock_active = true`, `overclock_hours = 0` | `damage_level + 1` (max. `max_damage_level`), nicht aktiv |
| Eine Stunde vergeht (nur aktiv) | `hours + 1`, +1 TP (bis `hp_max`) | `hours + 1`, +1 TP, `overclock_active = false`, `overclock_cooldown = true` |
| Ein Tag ist vergangen (nur bei Sperre) | `overclock_cooldown = false` | – |
| Reparatur (Zielwert − Schadensstufe, +4 mit Elixier) | `damage_level − 1` | nichts; Elixier trotzdem verbraucht |
| Beenden (freiwillig) | `overclock_active = false`, keine Sperre | – |

Kühlungswurf-Modifikator für die gerade vergangene Stunde `h`: `−floor((h − 1) / 2)` → Stunde 1–2: ±0, 3–4: −1, 5–6: −2.

**Zählung (einheitlich in Code, UI und Tests):** `overclock_hours` = Anzahl bereits vergangener Stunden (Start: 0). Angezeigt wird die laufende Stunde `nextHour = overclock_hours + 1` („Stunde 3“ = zwei Stunden sind vergangen). Der angezeigte nächste Kühlungswurf gilt für `nextHour` und nutzt `getCoolingModifier(nextHour)`. Beispiel: nach Start + 2× „Stunde vergeht“ steht „Stunde 3 · nächster Kühlungswurf (−1)“. Modifikator 0 wird ohne Zusatz angezeigt; der Zielwert im Play Mode enthält den Modifikator bereits („Ingenieurskunst 11 (−1)“).

**Abkühlsperre:** Nach misslungenem Kühlungswurf ist Übertakten für einen Tag gesperrt (`overclock_cooldown: true`). Die App kennt keine Spielzeit; der Spieler hebt die Sperre mit „Ein Tag ist vergangen“ auf (Epic-Seite und Play Mode, eigener Undo-Schritt). Freiwilliges Beenden sperrt nicht.

**TP durch KON 20:** keine eigene Logik. Der CON-HP-Bonus ist für Nicht-Krieger bei +2 gedeckelt (`getConBonusCap`); Sprocket hat mit KON 18 schon +2, Übertakten bringt ihm also keine TP. Nur bei beschädigtem Kondensator (KON < 16) steigen die Max-TP über die bestehende `hpDelta`-Rechnung – unverändert.

**Randfälle:**
- Kondensator nicht angelegt: Übertakten/Stunde gesperrt mit Hinweis „Kondensator ist nicht angelegt“; Reparatur, Elixier und Rezept bleiben bedienbar.
- Erreicht eine Schadensstufe `device_offline` (Stufe 8, per Stepper oder misslungenem Start auf Stufe 7), wird `overclock_active` im selben Schreibvorgang auf `false` gesetzt; der Übertakten-Bereich verschwindet (bestehendes Verhalten bei `device_offline`).
- Bei `damage_level === max_damage_level` ist das Gerät offline, Übertakten ist dort nicht möglich – ein misslungener Start bei max. Stufe kann nicht auftreten.
- Misslungene Reparatur ohne Elixier ändert keine Daten: kein Undo-Schritt, nur Toast „Reparatur misslungen“.
- Heilung „Stunde vergeht“ kappt auf Epic-Seite und Play Mode an der gespeicherten `hp_max` (Play Mode über `handleHpChange`, das ebenso an `hp_max` kappt).
- Alt-Daten: `overclock_end_time` wird ignoriert; fehlendes `overclock_hours` = 0.

## What We're NOT Doing

- Kein Spielzeit-/Kalendersystem, keine Würfel in der App (Spieler würfelt physisch, meldet Gelungen/Misslungen).
- Kein Wurf und keine Zeitverwaltung beim Herstellen (Dauer nur als Hinweis).
- Kein Zielwert auf der Epic-Seite (nur Modifikator); Zahl nur im Play Mode.
- Keine Reparatur und keine Klingen/Bruchgefahr im Play Mode (Spieler nutzt dafür die Epic-Seite); keine Einkaufsliste, keine GM-Benachrichtigung; keine GM-Bearbeitung von Rezepten/Häkchen.
- Kein generisches Crafting für andere Charaktere/Items (Datenformat ist allgemein, UI nur für Kondensator und Klingen).
- Keine Änderung an Fragility (Bruchgefahr) oder Schadensstufen-Effekten.
- Kein Live-Sync zwischen Epic-Seite und Play Mode desselben Spielers auf zwei Geräten (Neuladen nötig; Undo erkennt Konflikte bereits). Der GM-Dashboard bekommt dagegen Realtime auf `epic_items` (KON 20 sichtbar).

## UI Mockups

**Epic-Seite, Kondensator-Karte (neu unterhalb der Stufenanzeige):**
```
┌─ ⚡ Übertakten ──────────────────────────────────────────────┐
│ inaktiv:                                                       │
│ Setzt KON auf 20, RW gg. Gift +1, heilt 1 TP pro Stunde.       │
│ Erfordert Ingenieurskunst-Wurf.              [ Übertakten ]    │
│ aktiv:                                                         │
│ Stunde 3 · [KON → 20] [RW gg. Gift +1] [Heilt 1 TP/Stunde]     │
│ Nächster Kühlungswurf: Ingenieurskunst (−1)                    │
│                     [ Eine Stunde vergeht ]  [ Beenden ]       │
└────────────────────────────────────────────────────────────────┘
┌─ 🔧 Reparatur ────────────────────────────────────────────────┐
│ Ingenieurskunst-Wurf (−2), 10 Minuten        [ Reparieren ]    │
└────────────────────────────────────────────────────────────────┘
┌─ 🧪 Kupferelixier  4×  [−][+]           +4 auf Reparatur  ▾ ──┐
│  ☑ Starker Essig   – Wirtshaus, Markt                          │
│  ☐ Grobes Salz     – Krämer, Metzger                           │
│  ☑ Klauenöl        – Sattler, Schuster                         │
│  💰 100 GM aus der Börse (vorhanden: 143 GM)                   │
│  Ergibt 1 · ca. 4 Stunden                [ Herstellen ] (aus)  │
└────────────────────────────────────────────────────────────────┘
```

**Wurf-Dialog (gemeinsam für Übertakten, Kühlung, Reparatur):**
```
┌─ Reparatur ─────────────────────────────────┐
│ Wurf auf Ingenieurskunst (−2)               │
│ ☐ Kupferelixier verwenden (+4) · noch 4     │
│                                             │
│ [ Abbrechen ]  [ Misslungen ]  [ Gelungen ] │
└─────────────────────────────────────────────┘
```
Kühlung: Zeile „Stunde 3 vergangen: +1 TP“ und „Misslingt er, schaltet Sprocket ab.“ Übertakten: „Misslingt er, nimmt der Kondensator eine Schadensstufe.“ Im Play Mode steht statt „(−1)“ „11 (−1)“.

**Klingen-Karte, Mixtur-Zeile:**
```
● Rauchbombe  5×  [−][+]                                    ▾ Rezept
  Dichte rote Rauchwolke …   ⏱ 1 Runde
  ☑ Salpeter – Stall- oder Kellerwände, Gerber
  ☐ Honig oder Rohzucker – Imker, Markt
  ☐ Krappwurzel – Färber, Wegesrand
  ☐ Bienenwachs – Kerzenzieher, Imker
  Ergibt 2 · ca. 1 Stunde                   [ Herstellen ] (aus)
```

**Play Mode:**
```
gesperrt nach misslungener Kühlung (nur Besitzer):
⚡ Übertakten · Kondensator kühlt ab (ein Tag)     [ Ein Tag ist vergangen ]
inaktiv (nur Besitzer):
⚡ Übertakten · Ingenieurskunst 12                      [ Übertakten ]
aktiv:
┌──────────────────────────────────────────────────────────────┐
│ ⚡ Übertakten — aktiv · Stunde 3                              │
│ [KON → 20] [RW gg. Gift +1] [Heilt 1 TP/Stunde]               │
│ Nächster Kühlungswurf: Ingenieurskunst 11 (−1)                │
│                      [ Eine Stunde vergeht ]  [ Beenden ]     │
└──────────────────────────────────────────────────────────────┘
```

## Architecture and Code Reuse

```
              src/lib/rules/sprocket-devices.ts  (rein, getestet)
   ┌──────────────────────┼─────────────────────────┐
epic-equipment-view    blade-system-card        play-mode
 (Kondensator-Karte)    (Mixtur-Rezepte)         (Banner)
   │      │                 │                       │
   │   RecipeChecklist ◀────┘                        │
   └─ SkillCheckDialog ◀────────────────────────────┘
   │                                                 │
   └── computeHpAfterConChange (rules/epic-hp.ts) ◀──┘
```

Wiederverwendet: `calculatePayment`/`purseTotalInCP` (`equipment.ts`), `rowUpdate`, `patchList`/`patchRow`, `updateSimpleEffects`, `updateCharacter`/`handleHpChange`/`recordChanges`, shadcn `Dialog` (portaled), `Button`/`Badge`/`Label`, natives `<input type="checkbox">` (es gibt kein `ui/checkbox`), `localized()`.

- `src/lib/rules/`
  - `sprocket-devices.ts` (neu)
    - Typen `RecipeComponent`, `Recipe`, `CraftableStock`, `OverclockState`
    - `getCoolingModifier(hour)`, `readOverclockState(se)`, `startOverclock(se, success)`, `passOverclockHour(se, success)`, `stopOverclock(se)`
    - `resolveRepair({damageLevel, elixirCount, useElixir, success})`, `healOneHour(hpCurrent, hpMax, heal)`
    - `toggleComponent(stock, key)`, `isRecipeComplete(stock)`, `craft(stock, purse)`, `adjustStock(stock, delta)`
    - `findOverclockItem(items)`, `nextCoolingModifier(state)`, `withDamageLevel(item, newLevel)` (setzt Level, deaktiviert Übertakten bei `device_offline`)
  - `epic-hp.ts` (neu) – `computeHpDelta` + `computeHpAfterConChange(...)` aus `epic-equipment-view.tsx` herausgelöst
  - `proficiencies.ts` – `getNwpCheckTarget(nwp: NwpLike, abilityValues: Record<string, number>, checkModifier: number)`, `findProficiency<T extends NwpLike>(nwps: T[], name: string, nameEn: string): T | null` mit `type NwpLike = { proficiency: { name: string; name_en: string | null; ability: string; modifier: number } }` (keine Supabase-Imports in `rules/`)
  - `epic-items.ts` – `OverclockAbility` ohne `durationHours`
  - `blades.ts` – `MixtureInfo` erweitert um `recipe?`, `collected?`
- `src/components/epic-equipment/`
  - `skill-check-dialog.tsx` (neu) – Gelungen/Misslungen-Dialog
  - `recipe-checklist.tsx` (neu) – Checkliste, Kosten, Herstellen, −/+
  - `damage-level-card.tsx` – `OverclockPanel` ohne Timer, `RepairPanel`, Elixier-Bereich
  - `blade-system-card.tsx` – Mixtur-Zeile mit `RecipeChecklist`
  - `epic-equipment-view.tsx` – neue Handler, Gold-State
- `src/components/play-mode/`
  - `play-overclock-banner.tsx` – interaktiv (inaktiv/aktiv)
  - `play-mode.tsx` – `epicItems`-State, Undo-Sync, Overclock-Handler
  - `play-checks-panel.tsx` – nutzt `getNwpCheckTarget`
- `src/app/characters/[id]/epic/page.tsx` – lädt `gold_pp…gold_cp`
- `src/components/master/master-dashboard.tsx` – `useRealtimeRefresh` zusätzlich auf `epic_items`
- `src/test/undo-coverage.test.ts` – Label-Regex erweitert
- `supabase/migrations/00231_sprocket_overclock_crafting.sql` (neu)
- `messages/de.json`, `messages/en.json` – Texte `epic.*`, `playMode.*`, `undo.labels.*`

## Performance Considerations

Keine relevanten: reine Funktionen auf kleinen JSON-Objekten, keine zusätzlichen Round-Trips im Play Mode; Epic-Seite lädt 5 Spalten mehr in der bestehenden Query.

## Migration Notes

- `00231` aktualisiert die zwei Sprocket-Items per `slug` + `character_id`, wiederholbar ohne Datenverlust:
  - Kondensator: `overclock` ohne `duration_hours`, neue Beschreibung DE/EN; `overclock_active: false`, `overclock_hours: 0` (beendet eine evtl. noch laufende Timer-Übertaktung); entfernt `overclock_end_time`, `elixir_bonus`, `elixir_cost_gp`; neu `elixir: { count: 4, bonus: 4, name, name_en, collected: [], recipe }` nur `WHERE NOT simple_effects ? 'elixir'` (Bestand wird bei erneutem Lauf nicht zurückgesetzt).
  - Klingen: je Mixtur per `jsonb_set(simple_effects, '{mixtures,<key>,recipe}', …)` und `collected` nur falls fehlend (Zähler bleiben unverändert).
  - `ALTER PUBLICATION supabase_realtime ADD TABLE public.epic_items;` (in `DO`-Block, falls bereits enthalten).
- Code liest defensiv: fehlende `overclock_hours` = 0, fehlendes `elixir`/`recipe` = Bereich ausgeblendet; alte `overclock_end_time` wird ignoriert.
- `supabase db push` erst nach Freigabe durch den User (Produktionsdatenbank).

**Rezepte (Daten der Migration):**

| Produkt | Ertrag / Dauer | Komponenten (DE – Fundort / EN – source) |
|---|---|---|
| red Rauchbombe | 2 / ca. 1 Stunde | `saltpeter` Salpeter – Stall- oder Kellerwände, Gerber / Saltpeter – stable or cellar walls, tanner · `honey` Honig oder Rohzucker – Imker, Markt / Honey or raw sugar – beekeeper, market · `madder` Krappwurzel – Färber, Wegesrand / Madder root – dyer, roadside · `beeswax` Bienenwachs – Kerzenzieher, Imker / Beeswax – chandler, beekeeper |
| blue Gefrierbrand | 2 / ca. 1 Stunde | `hartshorn` Hirschhornsalz – Bäcker / Hartshorn salt – baker · `spirits` Hochprozentiger Branntwein – Wirtshaus / Strong spirits – tavern · `mint` Pfefferminze – Kräuterfrau, Bauerngarten / Peppermint – herbalist, cottage garden · `woad` Waid – Färber / Woad – dyer · `bladder` Schweinsblase – Metzger / Pig bladder – butcher |
| green Blenden | 2 / ca. 1 Stunde | `resin` Kiefernharz oder Pech – Wald, Böttcher, Köhler / Pine resin or pitch – forest, cooper, charcoal burner · `verdigris` Grünspan – Kupferschmied, Kesselflicker / Verdigris – coppersmith, tinker · `foxfire` Fuchsfeuer – Wald, nachts / Foxfire – forest, at night · `pepper` Gemahlener Pfeffer – Markt, Gewürzkrämer / Ground pepper – market, spice seller · `linseed` Leinöl – Ölmüller, Maler / Linseed oil – oil miller, painter |
| purple Narkose | 2 / ca. 1 Stunde | `poppy` Mohnkapseln – Kräuterfrau, Bauerngarten / Poppy pods – herbalist, cottage garden · `valerian` Baldrianwurzel – Kräuterfrau, feuchte Wiesen / Valerian root – herbalist, damp meadows · `hops` Hopfen – Brauer, Wirtshaus / Hops – brewer, tavern · `elder` Holundersaft – Hecken, Bauernhof / Elderberry juice – hedgerows, farm · `schnapps` Schnaps – Wirtshaus / Schnapps – tavern |
| Kupferelixier | 1 / ca. 4 Stunden, `cost_gp: 100` | `vinegar` Starker Essig – Wirtshaus, Markt / Strong vinegar – tavern, market · `salt` Grobes Salz – Krämer, Metzger / Coarse salt – grocer, butcher · `neatsfoot` Klauenöl – Sattler, Schuster / Neatsfoot oil – saddler, cobbler |

---

## Phase 1: Regeln und Daten

Reine Logik, Typen und Migration – Grundlage für Phase 2 und 3.

**Tasks**:
- [x] `src/lib/rules/sprocket-devices.ts` anlegen (TDD, Test zuerst), Typen:
  ```ts
  interface RecipeComponent { key: string; name: string; name_en: string; source: string; source_en: string }
  interface Recipe { components: RecipeComponent[]; yield: number; duration: string; duration_en: string; cost_gp?: number }
  interface CraftableStock { count: number; recipe?: Recipe; collected?: string[] }
  interface OverclockState { active: boolean; hours: number; cooldown: boolean }
  ```
- [x] `getCoolingModifier(hour)` → `-Math.floor((hour - 1) / 2)` (hour ≥ 1)
- [x] `readOverclockState(se)` → `{active: se.overclock_active === true, hours: se.overclock_hours ?? 0, cooldown: se.overclock_cooldown === true}`
- [x] `startOverclock(se, success)` → `{ effects, damageLevelDelta } | null` (null bei Sperre oder bereits aktiv): Erfolg setzt aktiv + hours 0 und entfernt `overclock_end_time`; Fehlschlag Delta 1, Effekte unverändert
- [x] `passOverclockHour(se, success)` → hours + 1; Fehlschlag setzt inaktiv + `overclock_cooldown: true`; nur wenn aktiv (sonst unverändert)
- [x] `endCooldown(se)` → `overclock_cooldown: false`
- [x] `stopOverclock(se)` → inaktiv, hours bleiben für die Anzeige irrelevant (beim nächsten Start 0)
- [x] `healOneHour(hpCurrent, hpMax, heal)` → `Math.min(hpMax, hpCurrent + heal)`, nie unter `hpCurrent`
- [x] `resolveRepair({damageLevel, elixirCount, useElixir, success})` → neuer Level (min 0) und Elixier-Bestand (−1 nur wenn `useElixir && elixirCount > 0`)
- [x] `toggleComponent(stock, key)`, `isRecipeComplete(stock)` (alle Keys in `collected`; ohne Rezept false), `adjustStock(stock, delta)` (min 0)
- [x] `craft(stock, purse)` → `{ stock, purse } | null`: null wenn unvollständig oder `calculatePayment` scheitert; sonst `count + yield`, `collected: []`, `purse` = Rest (oder unverändert ohne `cost_gp`)
- [x] `src/lib/rules/epic-hp.ts`: `computeHpDelta` und die Berechnung aus `persistHpAfterConChange` als `computeHpAfterConChange({ itemsBefore, itemsAfter, character, activeClasses, hpCurrent, characterLevel }): number | null` (null = keine Änderung) herauslösen; `epic-equipment-view.tsx` nutzt sie (Verhalten unverändert)
- [x] `proficiencies.ts`: `getNwpCheckTarget(nwp, abilityValues, checkModifier)` und `findProficiency(nwps, name, nameEn)` (case-insensitive auf `name`/`name_en`); `play-checks-panel.tsx` nutzt `getNwpCheckTarget`
- [x] `epic-items.ts`: `durationHours` aus `OverclockAbility` und Parsing entfernen
- [x] `blades.ts`: `MixtureInfo` um `recipe?: Recipe; collected?: string[]` erweitern
- [x] `findOverclockItem(items)` → erstes angelegtes Item mit `simple_effects.overclock` (oder null); `nextCoolingModifier(state)` = `getCoolingModifier(state.hours + 1)`
- [x] `withDamageLevel({damage_level, damage_levels, simple_effects}, newLevel)` → `{ damage_level, simple_effects }`; enthält die neue Stufe `device_offline`, wird `overclock_active` auf false gesetzt
- [x] Migration `supabase/migrations/00231_sprocket_overclock_crafting.sql` gemäß Migration Notes und Rezepttabelle

**Automated Verification**:
- [x] `sprocket-devices.test.ts`: Modifikator Stunde 1–6 = 0,0,−1,−1,−2,−2; `nextCoolingModifier` nach Start + 2 Stunden = −1
- [x] `sprocket-devices.test.ts`: `readOverclockState` ignoriert `overclock_end_time`, fehlende Stunden = 0; `findOverclockItem` (angelegt/abgelegt/ohne Fähigkeit); `withDamageLevel` auf 8 deaktiviert Übertakten, auf 7 nicht
- [x] `sprocket-devices.test.ts`: Start Erfolg/Fehlschlag; Start bei Sperre → null; Stunde Erfolg/Fehlschlag (Fehlschlag setzt Sperre); Stunde bei inaktiv ändert nichts; Beenden ohne Sperre; `endCooldown`
- [x] `sprocket-devices.test.ts`: Heilung kappt bei `hpMax`; Reparatur Erfolg/Fehlschlag mit/ohne Elixier, Level nicht unter 0, Elixier nicht unter 0
- [x] `sprocket-devices.test.ts`: Checkliste toggeln, vollständig/unvollständig, Herstellen mit Ertrag 2 ohne `cost_gp` (Börse unverändert), mit 100 GM (Wechselgeld korrekt), bei zu wenig Geld null, Liste danach leer, −/+ nicht unter 0
- [x] `epic-hp.test.ts`: Fälle aus bisherigem Verhalten (CON↓ kappt current, CON↑ heilt nicht, keine Änderung → null)
- [x] `proficiencies.test.ts`: `getNwpCheckTarget` (INT 15, −3, Effekt −2 → 10), `findProficiency` DE/EN
- [x] `epic-items.test.ts` ohne `durationHours`; `play-checks-panel.test.tsx` weiter grün
- [x] `npm run typecheck`, `npm test`

---

## Phase 2: Epic-Seite

Dependencies: **Phase 1**

Kondensator- und Klingen-Karte bekommen Übertakten mit Wurf, Reparatur, Elixier und Rezept-Checklisten.

**Tasks**:
- [ ] `epic/page.tsx`: `gold_pp, gold_gp, gold_ep, gold_sp, gold_cp` laden und durchreichen
- [ ] `skill-check-dialog.tsx` (wird auch in Phase 3 genutzt): shadcn `Dialog` mit Titel, Hinweiszeilen, „Wurf auf {skill} {target?} ({mod})“, optionalem Kind-Slot (Elixier-Checkbox), Buttons Abbrechen/Misslungen/Gelungen → `onResult(success)`
- [ ] `recipe-checklist.tsx`: aufklappbar, natives Checkbox-Input + `Label` je Komponente (nur Owner aktiv), Kosten-Zeile mit Börsenstand, „Ergibt N · Dauer“, Herstellen (disabled bis vollständig und bezahlbar, Hinweis bei zu wenig Geld), −/+ Bestand
- [ ] `damage-level-card.tsx`: `OverclockPanel` ohne Timer, Start/Stunde gesperrt mit Hinweis wenn `!item.equipped`, → inaktiv „Übertakten“ (Dialog), aktiv Stunde/Badges/nächster Modifikator, „Eine Stunde vergeht“ (Dialog mit +1 TP-Hinweis), „Beenden“; `RepairPanel` (nur bei `damage_level > 0`, Owner) mit Dialog und Elixier-Checkbox (disabled bei Bestand 0); Elixier-Bereich mit `RecipeChecklist`; alte `elixirInfo`-Zeile entfällt
- [ ] `blade-system-card.tsx`: Mixtur-Zeile mit `RecipeChecklist` (Ertrag 2) statt `handleCraft`, −/+ über `adjustStock`
- [ ] `epic-equipment-view.tsx`: Schadensstufen-Writes (Stepper, misslungener Start, Reparatur) über `withDamageLevel` – `damage_level` und `simple_effects` in einem `update` derselben Zeile
- [ ] `epic-equipment-view.tsx`: `persistCraft(itemId, newEffects, cost)` – liest vor dem Bezahlen den aktuellen Goldstand aus der DB (`select gold_*`), rechnet `craft()` darauf, schreibt zuerst `characters.gold_*`, dann `epic_items`; scheitert der zweite Write, wird das Gold zurückgeschrieben (Toast, kein Undo-Schritt); Erfolg = ein `record()` mit beiden `RowChange`s
- [ ] `epic-equipment-view.tsx` Handler, jeweils genau ein `record()` mit literalem Label-Objekt `{ key: "…", values: {…} }` (damit der Coverage-Test es findet), ohne `coalesceKey`:
  - `handleOverclockStart(itemId, success)` – Erfolg: `simple_effects` (Label `overclockOn`); Fehlschlag: `damage_level + 1` + `computeHpAfterConChange` (Label `overclockFailed`)
  - `handleOverclockHour(itemId, success)` – `simple_effects` + `hp_current` via `healOneHour` (Label `overclockHour {name, hour}`; bei Fehlschlag `overclockCooledDown`)
  - `handleOverclockStop(itemId)` – Label `overclockOff`
  - `handleCooldownEnd(itemId)` – Label `overclockCooldownEnded`
  - `handleRepair(itemId, {useElixir, success})` – `damage_level`, `simple_effects.elixir.count`, ggf. HP (Label `repairSucceeded`/`repairFailed`)
  - `handleCraft(itemId, target)` mit `target = { kind: "elixir" } | { kind: "mixture"; key: string }` – über `persistCraft` (Label `crafted {name, count}`)
  - Häkchen und −/+ über `updateSimpleEffects` (Labels `componentToggled {name}`, `stockChanged {name, count}`)
  - `useUndoSync` patcht zusätzlich die `gold_*`-Felder
  - alle Handler brechen für Nicht-Besitzer ab (`!isOwner`)
- [ ] `messages/de.json`/`en.json`: neue `epic.*`-Texte, `undo.labels` (`overclockFailed`, `overclockHour`, `overclockCooledDown`, `overclockCooldownEnded`, `repairSucceeded`, `repairFailed`, `crafted`, `componentToggled`, `stockChanged`); `epic.overclockTimer`, `epic.elixirInfo`, `epic.repairInfo` (durch Reparatur-Panel ersetzt) entfernen
- [ ] `src/test/undo-coverage.test.ts`: Label-Regex erweitern um positionale Label-Objekte `{ key: "x", values:` und Ternaries mit Punkt-Bedingung (`key: r.success ? "a" : "b"`); bestehende unentdeckte Labels (`blades`, `hp`) werden dadurch ebenfalls geprüft
- [ ] `master-dashboard.tsx`: `useRealtimeRefresh` um `{ table: "epic_items", filter: character_id=in.(…) }` ergänzen

**Automated Verification**:
- [ ] `epic-equipment-view.test.tsx`: Übertakten gelungen → ein Schritt mit `overclock_active`; misslungen → ein Schritt mit `damage_level` +1 (und ggf. HP); Undo/Redo stellt wieder her
- [ ] `epic-equipment-view.test.tsx`: Stunde → `overclock_hours` +1 und `hp_current` +1 in einem Schritt; Kühlung misslungen → inaktiv + gesperrt (Übertakten-Button aus, „Ein Tag ist vergangen“ sichtbar); Tag vergangen → entsperrt
- [ ] `epic-equipment-view.test.tsx`: Reparatur mit Elixier gelungen → Level −1, Bestand −1; misslungen → nur Bestand −1; misslungen ohne Elixier → kein Write, kein Schritt
- [ ] `epic-equipment-view.test.tsx`: Stepper auf Stufe 8 bei aktiver Übertaktung → `overclock_active` false im selben Schritt
- [ ] `epic-equipment-view.test.tsx`: Herstellen, wenn der `epic_items`-Write scheitert → Gold zurückgeschrieben, kein Schritt
- [ ] `epic-equipment-view.test.tsx`: abgelegter Kondensator → Übertakten-Button gesperrt mit Hinweis; Nicht-Besitzer → keine Buttons
- [ ] `epic-equipment-view.test.tsx`: Herstellen Elixier → Bestand +1, Gold −100 GM, Liste leer, ein Schritt; Button gesperrt bei unvollständiger Liste und bei zu wenig Gold
- [ ] `recipe-checklist.test.tsx` / Klingen: Häkchen setzen, Herstellen Mixtur → +2; Nicht-Owner sieht Liste ohne aktive Checkboxen/Buttons
- [ ] `undo-coverage.test.ts` (inkl. neuer Regex-Fälle), `modal-portal-guard.test.ts` grün
- [ ] `npm run verify`

**Manual Verification**:
- [ ] Epic-Seite Sprocket: Übertakten misslungen → Schadensstufe steigt, KON sinkt; gelungen → aktiv, Stunde vergeht 3× → Modifikator −1, TP +3; Kühlung misslungen → aus
- [ ] Reparatur mit Elixier, Bestand sinkt; Rezept abhaken, Herstellen sperrt/entsperrt, Gold sinkt um 100 GM
- [ ] Undo/Redo über die Modus-Leiste für jeden Schritt

---

## Phase 3: Play Mode

Dependencies: **Phase 1**, **Phase 2** (`SkillCheckDialog`, Undo-Labels)

**Tasks**:
- [ ] `play-mode.tsx`: `const [epicItems, setEpicItems] = useState(initialEpicItems)` (Prop umbenannt); State speist `getEpicEffects`, `LevelUpDialog` und `hasEpicItems`; `useUndoSync` patcht `epic_items`; Übertakten-Item über `findOverclockItem`, Zustand über `readOverclockState`
- [ ] `play-mode.tsx`: `updateEpicItem(itemId, patch) → RowChange | null` (optimistisch, Rollback + Toast)
- [ ] `play-mode.tsx`: Ingenieurskunst-Zielwert = `getNwpCheckTarget(findProficiency(nonweaponProficiencies, requiresCheck, requiresCheck_en), effectiveStats.values, effectSummary.abilityChecks)`; ohne Fertigkeit `null` (Dialog zeigt nur Modifikator)
- [ ] `play-mode.tsx` Handler (je genau ein `recordChanges` ohne `coalesceKey`, literale Label-Objekte): Start (Fehlschlag: `withDamageLevel` + `computeHpAfterConChange`), Stunde (`handleHpChange(effectiveHpCurrent + healsPerHour, {record:false})` + `simple_effects`), Beenden, Sperre aufheben – gleiche Labels wie Phase 2
- [ ] `messages/de.json`/`en.json`: neue `playMode.*`-Texte (Startzeile, Stunde, nächster Kühlungswurf, Buttons, „nicht angelegt“); `playMode.overclockTimer` und `data-testid="overclock-timer"` entfernen
- [ ] `play-overclock-banner.tsx`: Props `ability, state, target, isOwner, onStart, onHour, onStop`; inaktiv schmale Zeile (nur Owner), aktiv Stunde/Badges/nächster Wurf + Buttons; nutzt `SkillCheckDialog`
- [ ] `play-mode.tsx`: Banner rendern, wenn `epicEffects.overclockAbility` existiert (aktiv für alle, inaktiv nur Owner)

**Automated Verification**:
- [ ] `play-mode-undo.test.tsx`: Stunde vergeht → ein Schritt mit `epic_items.simple_effects` und `characters.hp_current`; Undo stellt beides her
- [ ] `play-mode-undo.test.tsx`: Übertakten misslungen → `damage_level` +1 in einem Schritt
- [ ] `play-mode-undo.test.tsx`: Übertakten gelungen → ein Schritt; Beenden → ein Schritt; Sperre: Startzeile zeigt „Kondensator kühlt ab“ mit Button „Ein Tag ist vergangen“
- [ ] `play-overclock-banner.test.tsx`: „Stunde 3“ bei `overclock_hours` 2 mit „Ingenieurskunst 11 (−1)“ bei Basis 12; ohne Ingenieurskunst nur „(−1)“; inaktive Zeile nur für Owner; Nicht-Owner ohne Buttons
- [ ] `play-mode` Test: Banner fehlt, wenn die Fähigkeit fehlt oder das Gerät offline ist
- [ ] `npm run verify`

**Manual Verification**:
- [ ] Play Mode Sprocket (Desktop- und Mobil-Ansicht, iPad-Breite): Übertakten mit Zielwert, KON 20 und Gift-Malus sichtbar, Stunde vergeht heilt, Kühlung misslungen beendet; Epic-Seite zeigt denselben Zustand

---

## Phase 4: Doku und QA

Dependencies: **Phase 2**, **Phase 3**

**Tasks**:
- [ ] `CLAUDE.md`: Projektstruktur (`sprocket-devices.ts`, `epic-hp.ts`, `skill-check-dialog.tsx`, `recipe-checklist.tsx`), Abschnitt „Sprockets Geräte“ (Zustandsfelder, Stundenzählung, Regeln, Rezeptformat), Migrationsanzahl 228 → 231, Undo-Abschnitt (Herstellen mit Gold = ein Schritt, erweiterte Label-Prüfung), Roadmap-Punkt 28
- [ ] Migration `00231` erst nach Freigabe des Users per `supabase db push` einspielen
- [ ] Plan-Status auf `implemented`

**Automated Verification**:
- [ ] `npm run verify`

**Manual Verification**:
- [ ] Explorativer Test (Testing-Touren) nach Phase 4 der Projekt-Richtlinien

---

## References

- Research: `docs/agents/research/2026-10-06-sprocket-overclock-crafting.md`
- Muster Schreibpfad + Undo: `src/components/epic-equipment/epic-equipment-view.tsx:192-263`
- Muster reine Zustandslogik: `src/lib/rules/blades.ts`
- Muster Wurf-Eingabe: Stufenaufstiegs-Assistent (`src/components/level-up/`)
- Zahlung: `src/lib/rules/equipment.ts:267-308`
