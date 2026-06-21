---
date: 2026-06-21T09:31:21Z
git_commit: 352b06a3814f86e4a5107488483686811c515366
branch: feat/sidebar-avatar-center-click
topic: "Sprockets Mix-n-Match-Klingen (Phiolen-Mechanik) & Armbrust-Nachladen im Play Mode"
tags: [research, codebase, epic-items, blade-system, sprocket, consumables]
status: complete
---

# Research: Sprockets Mix-n-Match-Klingen & Armbrust-Nachlade-Mechanik

## Research Question

Wie sind Sprockets epische Mix-n-Match-Wurfklingen aktuell umgesetzt, und wie
funktioniert das Nachladen einer Armbrust im Play Mode? Ziel ist eine Mechanik,
bei der eine geworfene Klinge bei Treffer ihre Phiole/Flüssigkeit verbraucht (→
normaler Wurfdolch), bei Fehlwurf die Phiole kaputt gehen _kann_, und kaputte
Klingen erst mit einer frischen Phiole neu bestückt werden müssen — analog zum
Armbrust-Nachladen.

## Summary

Das Blade-System existiert bereits als **eigene Epic-Item-Variante** (`type:
"blade_system"` im `simple_effects`-JSONB von `epic_items`). Es rendert über eine
dedizierte Komponente `BladeSystemCard` und verwaltet seinen Zustand vollständig
client-seitig mit direktem Supabase-`.update()`.

**Wichtigste Erkenntnis zur Armbrust:** Es gibt **keinen** Nachlade-/Lade-Zustands-
Mechanismus für Armbrüste im Code. Armbrüste sind reine Waffen-Stammdaten
(`weapons`-Tabelle, Migration `00003`/`00053`) ohne Munitions- oder Lade-Logik.
Das nächstliegende vorhandene Muster für "Verbrauch + Nachfüllen" ist:

1. Das **Blade-System selbst** (Load → Throw → Collect → Craft).
2. Das generische **Charges-System** für magische Verbrauchsgüter
   (`magic_effects.current_charges / max_charges` in `character_equipment`,
   Logik in `src/lib/rules/consumables.ts`).

Die User-Referenz "wie das Nachladen einer Armbrust" ist daher **konzeptuell** zu
verstehen: eine explizite, separate "Neu bestücken / Phiole einsetzen"-Aktion als
eigener Schritt, bevor die Klinge wieder einsatzbereit ist.

```
epic-items (Tabelle)
└── simple_effects (jsonb)  ── type: "blade_system"
        ├── max_prepared: 4
        ├── blades[]:  { id, mixture: string|null, status: "ready"|"thrown" }
        └── mixtures{}: red/blue/green/purple → { count, name, color, effect, duration }

Rendering:
epic-equipment-view.tsx
  └── isBladeSystem ?  BladeSystemCard  (sonst DamageLevelCard / SimpleEpicCard)
```

## Detailed Findings

### Blade-System: Datenmodell

- **Seed:** `supabase/migrations/00054_seed_sprocket_blades.sql` — legt das Item
  `mix-and-match-blades` für Sprocket (`294c567c-5abb-4b6e-bc24-8d5105981ccf`) an.
- **Waffenstats nachgerüstet:** `supabase/migrations/00058_blade_weapon_stats.sql`
  (`weapon_stats`: 1d3/1d2, speed 2, range 10/20/30 ft, weight 0.5).
- **Struktur** (`simple_effects`):
  - `max_prepared: 4`
  - `blades`: Array von 4 Objekten `{ id, mixture, status }`
    - `mixture`: Mixtur-Key (`"red"`…) oder `null` (= leere Klinge)
    - `status`: `"ready"` | `"thrown"`
  - `mixtures`: Record mit 4 Mixturen (`red`=Rauchbombe, `blue`=Gefrierbrand,
    `green`=Blenden, `purple`=Narkose), je `{ count, name, name_en, color,
effect, effect_en, duration, duration_en }`.

### Blade-System: UI & State (zentrale Datei)

`src/components/epic-equipment/blade-system-card.tsx` — die gesamte Logik:

- State: `blades`, `mixtures` (lokaler React-State, init aus `item.simple_effects`).
- `persistState(newBlades, newMixtures)` (Zeile 66) — schreibt das gesamte
  `simple_effects`-Objekt zurück via `supabase.from("epic_items").update(...)`.
- **`handleLoadBlade(bladeId, mixtureKey)`** (Z. 78) — setzt `blade.mixture`,
  dekrementiert `mixture.count`. (= "Phiole in Klinge einsetzen")
- **`handleThrow(bladeId)`** (Z. 93) — setzt `status: "thrown"`. **Keine
  Treffer/Fehlschlag-Unterscheidung.** Mixtur bleibt am Blade gespeichert.
- **`handleCollect(bladeId)`** (Z. 101) — setzt `mixture: null, status: "ready"`.
  Aktuell geht die Mixtur beim Einsammeln **immer verloren** (egal ob getroffen).
- **`handleCraft(mixtureKey)`** (Z. 109) — `mixture.count + 1` (Mixtur herstellen).
- UI-Flow je Blade (Z. 238–293): leer → `bladeLoad` (Mixtur-Auswahl) → bestückt →
  `bladeThrow` → geworfen → `bladeCollect`.

**Konsequenz des Ist-Zustands:** Es gibt nur die Zustände `ready`/`thrown` und
`mixture: null | key`. Einen Zustand "Klinge vorhanden, aber Phiole leer/kaputt"
(= normaler Wurfdolch, der nachgeladen werden muss) gibt es **nicht**. Beim
Einsammeln wird die Klinge sofort wieder zur leeren `ready`-Klinge — kein
Verbrauch der Phiole modelliert, keine Trefferabfrage, kein Fehlwurf-Risiko.

### Blade-System: i18n-Keys

`messages/de.json` / `messages/en.json` (Namespace `epic`):
`bladesReady`, `bladeEmpty`, `bladeThrown`, `bladeLoad`, `bladeThrow`,
`bladeCollect`, `bladesThrown`, `mixtureInventory`, `mixtureCraft`.

### Epic-Item-System (Rahmen)

- **Tabelle** `epic_items`: `supabase/migrations/00049_epic_items.sql`. Spalten u.a.
  `equipped`, `damage_level`, `max_damage_level`, `damage_levels jsonb`,
  `simple_effects jsonb`. Constraint `UNIQUE(character_id, slug)`.
- **Typen:** `src/lib/supabase/types.ts:355` (`EpicItemRow`), `simple_effects` ist
  `Record<string, unknown>` (flexibel).
- **Rendering-Routing:** `src/components/epic-equipment/epic-equipment-view.tsx:260`
  — `max_damage_level > 0` → `DamageLevelCard`; `simple_effects.type ===
"blade_system"` → `BladeSystemCard`; sonst `SimpleEpicCard`.
- **Regel-Engine:** `src/lib/rules/epic-items.ts` — `getEpicEffects()` etc.
  verarbeitet **kein** Blade-System (Blade-Logik liegt komplett in der Komponente,
  nicht in der reinen Rules-Engine). Es gibt dort **keine** Tests für Blades.

### Armbrust / Munition / Nachladen

- **Kein** Lade-/Nachlade-Mechanismus existiert. Armbrüste = Waffen-Stammdaten:
  `00003_seed_data.sql:106` (Leichte/Schwere Armbrust), `00053:61` (Handarmbrust).
- Munition ist in `scan-character/route.ts:183` explizit als **keine Waffe**
  deklariert; wird über `character_inventory.quantity` getrackt.
- Generisches Verbrauchsmuster: `src/lib/rules/consumables.ts`
  (`getConsumableType`, `canUseConsumable`) + `src/components/play-mode/
play-magic-items-panel.tsx` (Charges-Abzug via `current_charges`).
- **Blades erscheinen NICHT im Play Mode** — `BladeSystemCard` wird nur in der
  Epic-Equipment-View gerendert, nicht in einem Play-Mode-Panel.

## Code References

- `src/components/epic-equipment/blade-system-card.tsx:58-356` — gesamte Blade-UI/Logik
- `src/components/epic-equipment/blade-system-card.tsx:93-107` — `handleThrow` / `handleCollect` (Kern der zu ändernden Mechanik)
- `src/components/epic-equipment/epic-equipment-view.tsx:260-286` — Rendering-Routing
- `supabase/migrations/00054_seed_sprocket_blades.sql` — Blade-Seed (Datenstruktur)
- `supabase/migrations/00058_blade_weapon_stats.sql` — Waffenstats der Klingen
- `src/lib/supabase/types.ts:355-372` — `EpicItemRow`
- `src/lib/rules/consumables.ts` — generisches Charges/Verbrauchs-Muster (Vorbild Nr. 2)
- `src/components/play-mode/play-magic-items-panel.tsx:70-107` — Charge-Abzug-Flow
- `messages/de.json` / `messages/en.json` (Namespace `epic`) — Blade-i18n-Keys

## Architecture Documentation

- Blade-System ist eine **Sonder-Variante** des generischen Epic-Item-Schemas; die
  gesamte Domänenlogik lebt in der React-Komponente (`BladeSystemCard`), persistiert
  direkt das komplette `simple_effects`-JSONB. Keine Rules-Engine-Funktion, keine
  Unit-Tests für die Blade-Mechanik vorhanden.
- Es gibt zwei etablierte "Verbrauch + Nachfüllen"-Muster im Code, an denen sich
  eine neue Phiolen-Mechanik orientieren könnte: (a) das Blade-System selbst,
  (b) das Charges-System der magischen Items.
- Eine "Klinge ohne Phiole" (normaler Wurfdolch, der explizit nachgeladen werden
  muss) ist im aktuellen Modell **nicht** abgebildet — das ist der Kern der neuen
  Anforderung.

## Open Questions

Diese werden mit dem User in der Requirements-Phase (Phase 1) geklärt — siehe die
direkt im Chat gestellten Verständnisfragen. Schwerpunkte:

1. Blade-Status-Modell: brauchen wir einen neuen Status `empty`/`broken`
   (Klinge da, aber ohne Phiole) zusätzlich zu `ready`/`thrown`?
2. Treffer/Fehlwurf: Wer entscheidet (manueller Button "getroffen"/"verfehlt")?
   Soll bei Fehlwurf die Bruch-Chance ausgewürfelt/abgefragt werden?
3. Soll diese Mechanik auch (oder nur) im Play Mode verfügbar sein?
4. Verbleiben Klingen physisch immer (nur Phiole geht verloren), oder kann auch
   die Klinge verloren gehen?
