---
date: 2026-07-24T12:48:09Z
git_commit: bc2c8b3802c79edeb6a9099d1e31bc775e420030
branch: main
topic: "Zwei epische Items für Isolde: Shadowdancer + Ring of many faces (inkl. Epic-Thief-Bonus-Engine)"
tags: [plan, epic-items, thief-skills, spell-abilities, migration, isolde]
status: draft
---

# Epic Items für Isolde — Shadowdancer & Ring of many faces

## Overview

Zwei neue level-gestaffelte epische Items für den Charakter **Isolde** (Tiefling-Diebin, Level 9)
werden per DB-Migration angelegt, nach dem Muster der "Klinge des Wassers". Beide nutzen
`max_damage_level = 4` + `level_thresholds = [3,5,7,9]` + `spell_abilities` mit `unlock_level`/`replaces`.

Zusätzlich wird die Epic-Effekt-Engine um **positive Thief-Boni** erweitert (bisher nur Penalties),
damit der Shadowdancer-Effekt "+10% Im Schatten verstecken / Leise bewegen" (Tier 2) automatisch in
die Diebeswerte einfließt — analog zum bestehenden Magic-Items-`ThiefSkillBonuses`-System.

## Current State Analysis

- `epic_items` (Migration `00049`): `character_id`-FK, JSONB `damage_levels` + `simple_effects`,
  `UNIQUE(character_id, slug)`. Keine Create-UI — Items entstehen nur per Seed-Migration.
- Auto-Unlock: `getEpicEffects(items, characterLevel)` + `getAutoUnlockedLevel` lesen
  `simple_effects.level_thresholds`. Tier 0 = Basis (< L3), Tier 1..4 = L3-4/5-6/7-8/9-10.
- Spell Abilities: `getUnlockedSpellAbilities` (replaces-Logik), gerendert **nur** in
  `DamageLevelCard` (`max_damage_level > 0`).
- Thief-Skills: Die Engine kennt nur `thiefPenalty`/`thiefDisabled` (`applyThiefPenalty` zieht ab).
  Positive Boni kommen ausschließlich aus dem separaten Magic-Items-System
  (`getMagicItemEffects → ThiefSkillBonuses`), verrechnet als `applyThiefPenalty(x, epic) + (mtb.skill ?? 0)`
  an drei Stellen: `character-computed.ts:270-286`, `play-checks-panel.tsx:217-256`,
  `tab-thief-skills.tsx:76-110` (Letztere zeigt aktuell nur die Epic-Penalty, keinen Magic-Bonus).
- Referenz: `backup-2026-04-07/characters.json:513-574` — Isolde existiert nur in der Live-DB;
  Seeds referenzieren über `WHERE c.name = 'Isolde'`.
- Vollständige Details siehe Research: `docs/agents/research/2026-07-24-epic-items-isolde-shadowdancer-ring-of-many-faces.md`.

## Desired End State

- Isolde besitzt zwei angelegte (`equipped=true`) Epic Items, die auf der Epic-Seite als
  `DamageLevelCard` mit korrektem Tier (bei L9 = Tier 4) und den freigeschalteten, progressiven
  Spell Abilities erscheinen.
- Der Shadowdancer-Bonus "+10% Verstecken/Schleichen" (ab L5) erhöht Isoldes Werte für
  "Im Schatten verstecken" und "Leise bewegen" automatisch in Play Mode, Charakterbogen-Tab
  und GM-Dashboard (alle drei laufen über `character-computed.ts` bzw. eigene Verrechnung).
  Druckansicht und DOCX-Export sind bewusst ausgenommen (siehe "What We're NOT Doing").
- `npm run verify` (format:check, lint, typecheck, test, build) läuft grün.

## What We're NOT Doing

- Keine Create-/Edit-UI für Epic Items (bleibt migrationsbasiert).
- Kein serverseitiges Nutzungs-Tracking der "X×/Tag"-Abilities (bleibt lokaler UI-State wie gehabt).
- Keine mechanische Automatisierung der Save-basierten Schadensausweichung (Tier 2, zweiter Teil) und
  der Schattenreise-Distanzen — diese bleiben als bilingualer Effekt-Text in den Spell Abilities
  (GM/Spieler interpretieren sie narrativ).
- Kein neuer Icon-Satz — Icons aus der bestehenden `epic-icon.tsx`-Map (`sparkles`).
- Keine Änderung am Magic-Items-System.
- **Kein Bonus in Druckansicht (`print-sheet.tsx`) und DOCX-Export (`docx-export.ts`).** Diese
  rendern Diebeswerte aus den `character.thief_*`-Rohwerten und ignorieren bereits heute _sämtliche_
  Epic- und Magic-Effekte (sie rufen `getEpicEffects` zudem ohne `characterLevel` auf → für Items mit
  `level_thresholds` läge der Bonus dort ohnehin bei Tier 0 = leer). Der Epic-Thief-Bonus bleibt daher
  konsistent mit dem Bestandsverhalten außen vor; eine Nachrüstung wäre ein eigenständiges Feature.

## UI Mockups

Epic-Seite von Isolde nach Seed (Level 9 → Tier 4 aktiv), `DamageLevelCard`:

```
┌─ ✨ Schattentänzer                                    [ Angelegt ] ┐
│  Ein Artefakt, das seinen Träger mit den Schatten verschmelzen lässt│
│  ─────────────────────────────────────────────────────────────────│
│  Schadensstufe 4 von 4      ● ● ● ●                                 │
│  Aktuelle Auswirkungen: Stufe 9-10: Meister der Schatten …         │
│  [ +10% Verstecken ] [ +10% Schleichen ]      ← neue Badges        │
│                                                                     │
│  Zauber-Fähigkeiten                                                 │
│   • Schattenverschmelzung        [3×/Tag]  Verschwinde im Schatten…│
│   • Schattenreise (unbegrenzt)   [∞]       Bei Nacht/Dunkelheit …   │  ← replaces 3×/Tag
│   • Schutz der Schatten          [—]       Bei Rettungswurf gg. …   │
│  ▸ Alle Stufen                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

Play Mode → Checks-Panel, Diebesfähigkeiten (Bonus greift, amber hervorgehoben):

```
Diebesfähigkeiten
  Im Schatten verstecken   85%   ← Basiswert 75 + 10 (Epic-Bonus)
  Leise bewegen            80%   ← Basiswert 70 + 10 (Epic-Bonus)
  Schlösser öffnen         60%
```

Charakterbogen → Tab Diebesfähigkeiten (Bonus-Badge grün, analog zur bestehenden Penalty-Logik):

```
  Im Schatten verstecken  [ 75 ] %   → 85%   [Basiswert: 60%] [+5%]
                                       ▲ grüner Bonus-Badge (neu)
```

## Architecture and Code Reuse

**Wiederverwendung:**

- `ThiefSkillBonuses`-Typ aus `magic-items.ts:19-28` wird als Feldtyp für den neuen
  `EpicEffects.thiefBonuses` wiederverwendet (reiner Type-Import, kein Laufzeit-Cycle:
  `magic-items.ts` importiert nicht aus `epic-items.ts`).
- Slug-Parsing-Muster in `getEpicEffects` (`epic-items.ts:267-269`, `perception_bonus_<n>`) wird für
  `thief_bonus_<skill>_<n>` gespiegelt.
- Verrechnungs-Muster `applyThiefPenalty(x, epic) + (mtb.skill ?? 0)` wird symmetrisch um
  `+ (epicBonus.skill ?? 0)` erweitert.
- Seed-Muster 1:1 aus `00169_fix_larry_name_and_reseed.sql:8-42`.

**Betroffene Dateien (Signaturen):**

- `src/lib/rules/epic-items.ts`
  - `interface EpicEffects` — neues Feld `thiefBonuses: ThiefSkillBonuses`
  - `getEpicEffects()` — Init `thiefBonuses: {}` + Slug-Parsing `thief_bonus_hide_10`/`thief_bonus_move_10`
- `src/lib/rules/epic-items.test.ts` — neue Tests (TDD, zuerst)
- `src/lib/rules/character-computed.ts:270-286` — Epic-Bonus in `thiefSkills` addieren
- `src/components/play-mode/play-checks-panel.tsx` — `defaultEpic`-Literal + Bonus in `thiefSkills`
- `src/components/character-sheet/tab-thief-skills.tsx` — Bonus anwenden + grüner "→ X%"-Badge
- `src/components/epic-equipment/damage-level-card.tsx:37-61` — `getEffectBadges` um Bonus-Slugs
- `messages/de.json` + `messages/en.json` (`epic`) — Keys `thiefBonusHide`, `thiefBonusMove`
- `supabase/migrations/00224_seed_isolde_shadowdancer.sql` (neu)
- `supabase/migrations/00225_seed_isolde_ring_of_many_faces.sql` (neu)

**Datenfluss des neuen Bonus:**

```
damage_levels[tier].effects: ["thief_bonus_hide_10","thief_bonus_move_10"]
        │  getEpicEffects (kumulativ ab Tier 2)
        ▼
EpicEffects.thiefBonuses = { hideInShadows: 10, moveSilently: 10 }
        │
        ├─► character-computed.ts  applyThiefPenalty(base,epic) + magicBonus + epicBonus
        ├─► play-checks-panel.tsx  (dito)
        └─► tab-thief-skills.tsx   Anzeige "→ 85%" grün
```

## Performance Considerations

Keine relevanten Auswirkungen — reine additive Feldberechnung innerhalb der bestehenden
`getEpicEffects`-Schleife; keine zusätzlichen DB-Queries oder Renders.

## Migration Notes

- Seeds sind idempotent via `NOT EXISTS (… ei.slug …)`-Guard + `WHERE c.name = 'Isolde' LIMIT 1`.
- Anwendung lokal über `supabase db push`. Sollte kein Charakter `Isolde` existieren, fügt der Seed
  nichts ein (kein Fehler) — vor dem Push verifizieren, dass Isolde in der Ziel-DB vorhanden ist.
- Kein Rollback-Skript nötig; Entfernen ggf. per `DELETE FROM epic_items WHERE slug IN
('schattentaenzer','ring-der-vielen-gesichter')`.

---

## Phase 1: Epic-Thief-Bonus in der Regel-Engine (TDD)

Erweitert die reine Logikschicht um positive Thief-Boni. Keine UI. Strikt Test-First.

**Tasks**:

- [x] `epic-items.test.ts`: neuen `describe("thief bonuses")`-Block mit Helper `makeShadowdancer()`
      (analog `makeBladeOfWater`) — `simple_effects.level_thresholds=[3,5,7,9]`,
      `damage_levels["2"].effects = ["thief_bonus_hide_10","thief_bonus_move_10"]`.
- [x] `epic-items.ts`: `interface EpicEffects` um `thiefBonuses: ThiefSkillBonuses;` erweitern
      (Type-only Import `import type { ThiefSkillBonuses } from "./magic-items";`).
- [x] `epic-items.ts` `getEpicEffects`: Init `thiefBonuses: {}` im `result`-Literal (Zeile ~202-218).
- [x] `play-checks-panel.tsx`: `defaultEpic`-Literal (~69-88) um `thiefBonuses: {}` ergänzen.
- [x] `epic-items.ts` `getEpicEffects`: in der `effects`-Schleife (~261-273) Bonus-Slugs parsen:
  ```ts
  if (effect.startsWith("thief_bonus_")) {
    const [, , skill, amt] = effect.split("_"); // thief_bonus_hide_10 → ["thief","bonus","hide","10"]
    const n = parseInt(amt) || 0;
    if (skill === "hide")
      result.thiefBonuses.hideInShadows = (result.thiefBonuses.hideInShadows ?? 0) + n;
    if (skill === "move")
      result.thiefBonuses.moveSilently = (result.thiefBonuses.moveSilently ?? 0) + n;
  }
  ```

**Automated Verification**:

- [x] `epic-items.test.ts` neue Thief-Bonus-Tests (Unit) grün
- [x] bestehende `epic-items.test.ts`-Tests weiterhin grün (Regression) — 55/55 grün
- [x] `npm run typecheck` grün (neues Pflichtfeld an allen Literalen — deckt Phase 2 mit auf)

---

## Phase 2: Verrechnung & Anzeige des Bonus

Dependencies: **Phase 1**

Bringt den neuen Bonus in alle Diebeswert-Ausgaben und die Badge-/i18n-Anzeige.

**Tasks**:

- [x] `character-computed.ts` (~275-286): Epic-Bonus zu jedem Skill addieren, z.B.
  ```ts
  const etb = epicEffects.thiefBonuses;
  moveSilently: applyThiefPenalty(character.thief_move_silently, epicEffects)
    + (mtb.moveSilently ?? 0) + (etb.moveSilently ?? 0),
  hideInShadows: applyThiefPenalty(character.thief_hide_shadows, epicEffects)
    + (mtb.hideInShadows ?? 0) + (etb.hideInShadows ?? 0),
  ```
  (übrige Skills analog mit `?? 0`, damit generisch/zukunftssicher).
- [x] `play-checks-panel.tsx` (~217-256): dieselbe `+ (epic.thiefBonuses.<skill> ?? 0)`-Ergänzung in
      der lokalen `thiefSkills`-Berechnung.
- [x] `tab-thief-skills.tsx` (~76-110): `currentValue` um Epic-Bonus erweitern; Badge-Logik so
      anpassen, dass ein **positiver** Delta grün und ein negativer rot dargestellt wird
      (`bonusKey`-Mapping für `pickLocks`↔`openLocks`).
- [x] `damage-level-card.tsx` `getEffectBadges` (~37-61): Slugs abbilden
  ```ts
  else if (effect === "thief_bonus_hide_10")
    badges.push({ label: t("thiefBonusHide", { bonus: 10 }), variant: "blue" });
  else if (effect === "thief_bonus_move_10")
    badges.push({ label: t("thiefBonusMove", { bonus: 10 }), variant: "blue" });
  ```
- [x] `damage-level-card.tsx` `usesLabel` (~276-279): `usesPerDay === -1` (unbegrenzt) behandeln.
- [x] `messages/de.json` (`epic`): `thiefBonusHide`, `thiefBonusMove`, `unlimited`.
- [x] `messages/en.json` (`epic`): `thiefBonusHide`, `thiefBonusMove`, `unlimited`.

**Automated Verification**:

- [x] `character-computed.test.ts`: neuer Test — Charakter mit äquipiertem Shadowdancer (L9) →
      `thiefSkills.hideInShadows`/`moveSilently` enthalten +10 gegenüber Basiswert.
- [x] `npm run test` (Regel-Suite, 1192 Tests) grün
- [x] `npm run typecheck` grün; `eslint` auf allen geänderten Dateien grün (exit 0)

**Manual Verification** (nach Phase 3 / Seed):

- [ ] Nach Seed auf Isoldes Play Mode: Checks-Panel zeigt erhöhte Werte für
      "Im Schatten verstecken" / "Leise bewegen" (amber hervorgehoben).
- [ ] Charakterbogen → Tab Diebesfähigkeiten zeigt grünen "→ X%"-Bonus-Badge.

---

## Phase 3: Seed-Migrationen der zwei Items

Dependencies: **Phase 1** (Engine-Parsing der Bonus-Slugs; die reine Anzeige aus Phase 2 ist für die
DB-Seeds nicht erforderlich — die Seeds können unabhängig von Phase 2 gepusht werden)

Legt beide Items für Isolde an. Struktur exakt nach `00169`.

**Tasks**:

- [x] `supabase/migrations/00224_seed_isolde_shadowdancer.sql` — Item "Schattentänzer" /
      "Shadowdancer", `slug='schattentaenzer'`, `icon='sparkles'`, `equipped=true`, `damage_level=0`,
      `max_damage_level=4`, `WHERE c.name = 'Isolde'` + `NOT EXISTS`-Guard.
  - `damage_levels`: Tier `"0"` (Basis, effects `[]`), `"1"` L3-4, `"2"` L5-6 mit
    `effects: ["thief_bonus_hide_10","thief_bonus_move_10"]`, `"3"` L7-8, `"4"` L9-10 —
    je `description`/`description_en`. Die **Save-basierte Schadensausweichung** (bei Rettungswurf gg.
    Schaden: bei Erfolg kein HP-Verlust, bei Misserfolg halber Schaden) gehört in den
    `description`/`description_en`-Text von Tier `"2"` (**nicht** als Spell Ability — eine passive/
    reaktive Fähigkeit mit `usesPerDay:0/usesPerWeek:0` würde in der Card ein irreführendes
    "0×/Woche"-Badge rendern, siehe `damage-level-card.tsx:276-279`).
  - `simple_effects`:
    - `level_thresholds: [3,5,7,9]`
    - `spell_abilities` (bilingual, mit `replaces`):
      - `shadow_meld` (unlock 1, usesPerDay 3) — im Schatten verschwinden, auch beobachtet
      - `shadow_travel` (unlock 3, usesPerDay 3) — Schattenreise 300m +20m/Level; jederzeit in Schatten treten
      - `shadow_travel_unlimited` (unlock 4, usesPerDay -1, `replaces: "shadow_travel"`) — nachts/Dunkelheit
        beliebig oft (usesPerDay -1 = unbegrenzt; UI-Anzeige der ∞-Semantik in Phase 4 manuell prüfen)
- [x] `supabase/migrations/00225_seed_isolde_ring_of_many_faces.sql` — Item
      "Ring der vielen Gesichter" / "Ring of Many Faces", `slug='ring-der-vielen-gesichter'`,
      `icon='sparkles'`, gleiche Struktur, `WHERE c.name = 'Isolde'` + Guard.
  - `damage_levels`: Tier `"0"`-`"4"` je `description`/`description_en`, `effects: []`.
  - `simple_effects.level_thresholds: [3,5,7,9]`, `spell_abilities` (progressiv via `replaces`):
    - `alter_self` (unlock 1, 2×/Tag) — Dauer bis Form aufgegeben, Stimme verändert
    - `change_self` (unlock 2, 2×/Tag, `replaces: "alter_self"`)
    - `change_self_specific` (unlock 3, 2×/Tag, `replaces: "change_self"`) — bestimmte Personen imitieren
    - `polymorph_self` (unlock 4, 2×/Tag, `replaces: "change_self_specific"`)
- [x] `supabase db push` gegen die Live-DB ausgeführt (User-Freigabe erteilt; alle 4 ausstehenden
      Migrationen 00222–00225 angewandt). Verifiziert: beide Items für Isolde (id ff83f89d…, L9)
      eingefügt, `equipped=true`, `max_damage_level=4`.

**Automated Verification**:

- [x] `npm run build` grün (Migrationen sind reines SQL — kein TS-Impact, aber Gesamt-Build abgesichert)
- [x] JSONB-Smoke-Check: alle 4 `jsonb`-Blobs (2 pro Datei) parsen fehlerfrei (Node-Validierung)

**Manual Verification**:

- [ ] Isoldes Epic-Seite listet beide Items als `DamageLevelCard`.
- [ ] Bei Level 9 ist Tier 4 aktiv; Shadowdancer zeigt "Schattenreise (unbegrenzt)" statt der
      3×/Tag-Variante; Ring zeigt "Polymorph Self" statt der Change-Self-Vorstufen (replaces greift).
- [ ] Sprachumschaltung DE/EN zeigt korrekte bilinguale Namen/Effekte.

---

## Phase 4: Qualitätssicherung (RPI Phase 3+4)

Dependencies: **Phase 2**, **Phase 3**

**Tasks**:

- [x] Code-Review des eigenen Diffs (Sub-Agent-Review des Plans vorab; Bonus-Verrechnung generisch/DRY
      über `?? 0`-Kette an allen 3 Stellen; `bonusKey`-Mapping für Key-Mismatch).
- [ ] Explorative Tests via `playwright-cli` auf Epic-Seite, Play Mode, Charakterbogen-Tab —
      **blockiert bis Seed in einer DB mit Charakter "Isolde" angewandt ist** (Isolde nur in Live-DB).
- [ ] Für jeden gefundenen Bug: erst fehlschlagender Test, dann Fix.

**Automated Verification**:

- [x] `format:check` grün, `typecheck` grün, `npm test` grün (1604 Tests), `npm run build` grün.
- [x] `eslint src e2e` grün (exit 0) — aller getrackter Feature-Code lint-sauber.
- [~] `npm run lint` (gesamt): scheitert nur an **vorbestehenden** Lint-Fehlern in `scripts/`-Dateien
  (`scripts/spell-cards/*` sind gitignored/untracked; `scripts/screenshot-login-viewports.mjs` ist
  bereits auf `main` fehlerhaft, committet in #133) — **nicht durch dieses Feature verursacht**.

**Manual Verification**:

- [ ] Equip/Unequip des Shadowdancer verändert die Diebeswerte in Play Mode live (Bonus verschwindet
      bei „Abgelegt").

---

## References

- Research: `docs/agents/research/2026-07-24-epic-items-isolde-shadowdancer-ring-of-many-faces.md`
- Blaupause-Seed: `supabase/migrations/00169_fix_larry_name_and_reseed.sql:8-42`
- Tier-Fix-Konvention: `supabase/migrations/00166_fix_klinge_des_wassers_tiers.sql:1-4`
- Engine: `src/lib/rules/epic-items.ts:201-327` (getEpicEffects), `:352-366` (getUnlockedSpellAbilities)
- Verrechnung: `src/lib/rules/character-computed.ts:270-286`
- Magic-Bonus-Vorbild: `src/lib/rules/magic-items.ts:19-28,169-200`
- Tests-Vorbild: `src/lib/rules/epic-items.test.ts:360-495`
