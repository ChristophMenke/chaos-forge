---
date: 2026-07-24T12:40:33Z
git_commit: bc2c8b3802c79edeb6a9099d1e31bc775e420030
branch: main
topic: "Epic-Item-Modellierung für zwei neue Isolde-Items (Shadowdancer + Ring of many faces)"
tags: [research, codebase, epic-items, spell-abilities, thief-skills, level-unlock]
status: complete
---

# Research: Epic-Item-Modellierung für zwei neue Isolde-Items

## Research Question

Wie werden epische Items in Chaos Forge modelliert (DB-Schema, Spell Abilities, Level-Unlock,
Thief-Boni/-Penalties, Perception, Shapeshift), sodass zwei neue level-basierte Items für den
Charakter **Isolde** angelegt werden können:

1. **Shadowdancer** — Schatten-Verstecken, +10% Verstecken/Schleichen, Schadensausweichen, Schattenreise
2. **Ring of many faces** — Alter Self / Change Self / Polymorph Self, level-gestaffelt

Zusätzlich zu klären: Ist "Isolde" der korrekte Charakter (das Bild ist mit "Mascha" beschriftet)?

## Summary

Chaos Forge modelliert epische Items in der Tabelle `public.epic_items`, die **direkt per
`character_id`** an genau einen Charakter gebunden ist (keine Junction-Tabelle). Die gesamte
Item-Semantik steckt in zwei JSONB-Feldern: `damage_levels` (Stufen-/Tier-Objekt) und
`simple_effects` (freier Container für Level-Schwellen, Spell Abilities, Shapeshift-Formen etc.).

Für **level-gestaffelte** Items (genau der Fall beider Isolde-Items) ist die **"Klinge des Wassers"**
(`00165`/`00166`/`00169`) die exakte Blaupause: `max_damage_level = 4`, `simple_effects.level_thresholds
= [3, 5, 7, 9]`, und eine `simple_effects.spell_abilities`-Liste mit `unlock_level` + `replaces`-Logik.
Diese Struktur bildet die "Lvl 3-4 / 5-6 / 7-8 / 9-10"-Progression der handschriftlichen Vorlage 1:1 ab.

**Namensfrage geklärt:** "Isolde" ist der Charakter (Tiefling-**Diebin**, Level 9), "Mascha" ist der
`player_name` (die reale Person hinter der Figur). Die Item-Beschriftung "Mascha (…)" meint also die
Items der Spielerin Mascha für ihren Charakter Isolde. Die Anweisung ist korrekt.

**Eine faktische Lücke** relevant für die Umsetzung: Das Epic-System kennt nur Thief-**Penalties**
(`thief_penalty_10`, `thief_disabled`), aber **keinen** positiven Thief-Bonus. Der von Shadowdancer
geforderte "+10% Im Schatten verstecken / Leise bewegen" (Tier 2) wird von der Epic-Effekt-Engine
(`getEpicEffects`) nicht als Skill-Bonus verrechnet. Positive Thief-Boni existieren im Code
ausschließlich im **separaten Magic-Items-System** (`character_equipment.magic_effects` →
`ThiefSkillBonuses`, verrechnet in `play-checks-panel.tsx`).

### Datei-Übersicht

```
supabase/migrations/
  00049_epic_items.sql                 # Tabellen-DDL + initiale RLS
  00050_seed_sprocket_epic_items.sql   # Seed-Bsp: Brille (perception) + Kondensator (Degradation)
  00056/00057_gor_epic_items(_v2).sql  # Seed-Bsp: shapeshift_forms, special_attacks, level_thresholds
  00114_rls_epic_items_shared_only.sql # SELECT nur Owner + geteilte User (Items sind "geheim")
  00165/00166/00169_..klinge_des_wassers  # ★ BLAUPAUSE: level_thresholds + spell_abilities + replaces
  00217_approval_enforcement_triggers.sql # enforce_approval-Trigger auch auf epic_items
  00223_...                            # zuletzt vergebene Migrationsnummer (nächste frei: 00224)

src/lib/rules/
  epic-items.ts        # ★ Effekt-Engine: getEpicEffects, getAutoUnlockedLevel,
                       #   getUnlockedSpellAbilities (replaces-Logik), applyThiefPenalty
  magic-items.ts       # Separates System: getMagicItemEffects → ThiefSkillBonuses (positiv!)

src/lib/supabase/
  types.ts:343-367     # EpicItemRow, DamageLevelEffect

src/components/epic-equipment/
  epic-equipment-view.tsx  # Container; wählt Card-Typ; DB-Writes (nur update/delete, KEIN insert)
  damage-level-card.tsx    # ★ Einzige Card, die spell_abilities rendert (max_damage_level > 0)
  simple-epic-card.tsx     # Card ohne Tiers → rendert KEINE spell_abilities
  blade-system-card.tsx    # Sonderfall Klingen-System

src/app/characters/[id]/epic/page.tsx  # Server-Load; nutzt HÖCHSTES Klassenlevel für Auto-Unlock
src/components/play-mode/play-checks-panel.tsx  # kombiniert epic thiefPenalty + magic thiefBonus
messages/{de,en}.json → "epic"         # i18n-Keys (spellAbilities, perDay, perWeek, thiefPenalty …)
```

### Tier-/Unlock-Datenfluss (ASCII)

```
Charakterlevel (höchstes Klassenlevel)
        │  epic/page.tsx:71-74  Math.max(classLevels)
        ▼
getAutoUnlockedLevel(item, level)          epic-items.ts:134-143
   zählt, wie viele level_thresholds ≤ level  →  unlockedLevel (0..max_damage_level)
        │
        ├─► getCumulativeEffects()   kumuliert damage_levels["0".."N"].effects + stat_overrides
        │        └─► effects[] Slugs → thiefPenalty/spellFailure/acBonus/perception… (KEIN thief-BONUS)
        │
        └─► getUnlockedSpellAbilities(item, unlockedLevel)   epic-items.ts:352-366
                 filtert spell_abilities[] auf unlock_level ≤ unlockedLevel
                 wendet replaces an (ersetzte key werden ausgeblendet)
                        ▼
                 DamageLevelCard rendert Spell-Ability-Zeilen  damage-level-card.tsx:269-322
```

## Detailed Findings

### 1. Charakter- vs. Spielernamen-Klärung

- **Isolde** existiert als echter Spieler-Charakter nur in der Live-DB / Backup, nicht in Migrationen:
  `backup-2026-04-07/characters.json:513-574` — ID `ff83f89d-3db1-44d3-898e-3f57afa7e2ae`, Klasse
  `thief`, Rasse `tiefling`, Level 9, HP 40/40, `is_public: true`, `is_active: true`, **kein** NPC.
- **Mascha** kommt ausschließlich als `"player_name": "Mascha"` (`characters.json:540`) im selben
  Charakter-Objekt vor — also die reale Person hinter Isolde, **kein** Item/NPC/Waffe.
- Isolde wird zusätzlich in Avatar-Generierungs-Skripten als "Tiefling-Diebin mit Hörnern"
  referenziert (`scripts/generate-login-party-from-avatars.ts:42-43` u.a.).
- Namenskollision ohne Bezug zur Figur: der Zauber "Isolde's Answer"
  (`00043_complete_spell_compendium.sql:2295`).

**Konsequenz für die Umsetzung:** Ein Seed muss den Charakter über den **Namen** `Isolde` (oder die
ID) referenzieren — analog zu `WHERE c.name = 'Larry'` bei der Klinge des Wassers. Es gibt keine
Migration mit Isolde-Charakterdaten; die Figur lebt nur in der Live-DB.

### 2. Tabelle `public.epic_items` (Schema)

`supabase/migrations/00049_epic_items.sql:2-21`:

- `character_id uuid → characters(id) ON DELETE CASCADE NOT NULL` (1:n, keine Junction-Tabelle)
- `slug text NOT NULL` mit `UNIQUE(character_id, slug)` → Seeds nutzen `ON CONFLICT (character_id, slug) DO NOTHING` bzw. `NOT EXISTS`-Guards
- `name`, `name_en`, `description`, `description_en` (bilingual)
- `icon text DEFAULT 'sparkles'` — gemappt in `epic-icon.tsx` (`glasses`, `heart-pulse`, `sparkles`, `swords`, `paw-print`, `flame`; Fallback `Sparkles`)
- `equipped boolean DEFAULT false` — alle Seeds setzen `true`
- `damage_level integer DEFAULT 0` / `max_damage_level integer DEFAULT 0` mit CHECK `0 ≤ damage_level ≤ max_damage_level`
- `damage_levels jsonb DEFAULT '{}'` — Tier-Objekt
- `simple_effects jsonb DEFAULT '{}'` — freier Container
- `notes text`

**Es gibt keine `unlocked_level`-Spalte.** Das Auto-Unlock passiert rein applikationsseitig aus
`simple_effects.level_thresholds` (siehe §4). In Seeds steht `damage_level` auf `0` mit Kommentar
`will be auto-calculated from character level`.

Index: `idx_epic_items_character_id` (`00158_add_fk_indexes.sql:28-29`).

### 3. JSONB-Shapes

**`damage_levels`** — Keys `"0"`, `"1"`, … als String; jeder Wert ist ein `DamageLevelEffect`
(`types.ts:343-348`):

```ts
{ stat_overrides?: Partial<Record<"str"|"dex"|"con"|"int"|"wis"|"cha", number>>;
  description: string; description_en?: string; effects?: string[] }
```

Das Feld wird für **zwei** Semantiken genutzt: echte Degradation (Kondensator, höhere Stufe = schlechter)
und Level-Unlock-Tiers (Klinge des Wassers/Totem, höhere Stufe = mächtiger).

**Effekt-Slugs in `effects[]`**, interpretiert von `getEpicEffects` (`epic-items.ts:261-273`) und
`getEffectBadges` (`damage-level-card.tsx:37-61`):
`thief_disabled`, `thief_penalty_10`, `spell_failure_10`, `wild_magic_50`, `ac_bonus_<n>`,
`perception_bonus_<n>`, `str_override_<n>`, `speak_with_animals`, `electric_damage_1`,
`save_vs_death`, `device_offline`, `cold_damage_1d6`.
→ **Kein positiver Thief-Bonus-Slug existiert.**

**`simple_effects`** — u.a.:

- `level_thresholds: number[]` (Auto-Unlock, fast überall `[3,5,7,9]`)
- `spell_abilities: (SpellAbility & { unlock_level:number; replaces?:string })[]`
- `shapeshift_forms[]`, `special_attacks[]` (jeweils mit `unlock_level`)
- `overclock{}`, `fragility{}`, `repair_skill`, `perception_bonus` (flach), `base_<stat>`
- `type: "blade_system"` (Sonderfall)

**`SpellAbility`-Shape** (`epic-items.ts:51-59`), echtes Beispiel aus `00166`/`00169`:

```json
{ "key": "water_walk", "name": "Water Walk", "name_en": "Water Walk",
  "unlock_level": 1, "usesPerDay": 1, "usesPerWeek": 0,
  "effect": "…", "effect_en": "…" }
// höheres Tier ersetzt das schwächere:
{ "key": "water_walk_3", "unlock_level": 2, "usesPerDay": 3, "replaces": "water_walk", … }
```

### 4. Auto-Unlock-Mechanik

`getAutoUnlockedLevel(item, characterLevel)` (`epic-items.ts:134-143`): zählt, wie viele Werte in
`simple_effects.level_thresholds` `≤ characterLevel` sind, geklemmt auf `max_damage_level`. Ohne
`level_thresholds` fällt es auf `item.damage_level` zurück.

**Off-by-one-Konvention (wichtig, dokumentiert im Fix `00166:1-4`):** Bei `[3,5,7,9]` und
`max_damage_level = 4` ergibt sich:

- Level < 3 → Tier 0 (Basis)
- Level 3-4 → Tier 1
- Level 5-6 → Tier 2
- Level 7-8 → Tier 3
- Level 9+ → Tier 4

D.h. es braucht ein **Basis-Tier "0"** in `damage_levels` und die `unlock_level` der Abilities laufen
von 1..4. Isolde ist Level 9 → aktuell wäre Tier 4 aktiv (alle Fähigkeiten freigeschaltet). Die Seite
nutzt das **höchste Klassenlevel** (`epic/page.tsx:71-74`).

### 5. Spell Abilities & `replaces`-Logik

`getUnlockedSpellAbilities(item, unlockedLevel)` (`epic-items.ts:352-366`):

1. filtert `spell_abilities` auf `unlock_level ≤ unlockedLevel`,
2. sammelt alle `replaces`-Referenzen der freigeschalteten Abilities,
3. blendet jede Ability aus, deren `key` von einer anderen freigeschalteten Ability ersetzt wird.

So erscheint z.B. bei Tier ≥ 2 nur noch "Water Walk 3×/Tag", nicht mehr die 1×/Tag-Variante. **Diese
Logik bildet die Progression der Isolde-Items (Change Self ersetzt/erweitert Alter Self; unbegrenzte
Schattenreise ersetzt 3×/Tag) direkt ab** — sofern man den `replaces`-Key setzt.

**Rendering ausschließlich in `DamageLevelCard`** (`damage-level-card.tsx:269-322`): Name +
`perDay`/`perWeek`-Badge + Effekt-Text + Owner-Toggle "verwendet/verfügbar" (nur lokaler React-State,
**nicht** persistiert). → Beide Items **müssen** `max_damage_level > 0` haben, sonst rendert die
`SimpleEpicCard` (`simple-epic-card.tsx`) die Spell Abilities gar nicht.

### 6. Thief-Skills: Penalty (Epic) vs. Bonus (Magic Items)

- **Epic-Seite:** `applyThiefPenalty(baseValue, effects)` (`epic-items.ts:415-419`) kann nur
  **abziehen** (`thiefPenalty`) oder auf 0 setzen (`thiefDisabled`). Kein Bonus.
- **Magic-Items-Seite:** `getMagicItemEffects(equipment)` (`magic-items.ts:80-243`) liest
  `character_equipment.magic_effects` und liefert `ThiefSkillBonuses` (`magic-items.ts:19-28`) mit
  **positiven** Feldern wie `hideInShadows`, `moveSilently` (JSONB-Keys `hide_in_shadows`,
  `move_silently`).
- **Kombination** in `play-checks-panel.tsx:217-256`:
  `applyThiefPenalty(character.thief_hide_shadows, epic) + (mt.hideInShadows ?? 0)`.
  Ebenso in `tab-thief-skills.tsx` (nur Epic-Penalty) und `character-sheet.tsx`.

Faktische Beobachtung: Ein "+10% Verstecken/Schleichen" über ein **Epic**-Item hat aktuell **keinen
Verrechnungspfad**. Positiv-Boni auf Thief-Skills werden im Code nur über das Magic-Items-System
(`character_equipment` + `magic_effects`) angewandt. (Wie Isolde damit umgeht, ist eine Design-/Plan-
Entscheidung, kein Research-Ergebnis.)

### 7. Erstellung, Persistenz, Sichtbarkeit

- **Keine Create-UI.** Im gesamten `src/` gibt es keinen `insert` auf `epic_items` — nur `select`
  (Seiten-Loads) und `update`/`delete` (Equip-Toggle, Damage-Level, Overclock, Blade-State) in
  `epic-equipment-view.tsx` und `blade-system-card.tsx`. Items entstehen **ausschließlich per
  Migration/Seed**.
- **RLS:** `00114_rls_epic_items_shared_only.sql:6-17` beschränkt SELECT auf Owner + via
  `character_shares` geteilte User (Epic Items sind "geheim", **nicht** über `is_public` sichtbar).
  INSERT/UPDATE/DELETE nur Owner (`00049:29-39`). `00217:44` hängt den `enforce_approval`-Trigger an.
- **CON→HP-Nachführung:** `persistHpAfterConChange` (`epic-equipment-view.tsx:79-124`) — nur relevant
  bei Items mit `stat_overrides` auf CON; beide Isolde-Items haben keine.

### 8. Referenz-Seed (Blaupause) — Klinge des Wassers

`00169_fix_larry_name_and_reseed.sql:8-42` zeigt das vollständige Muster:
`INSERT … SELECT c.id, 'slug', 'Name', 'Name EN', …, true, 0, 4, '{…damage_levels…}'::jsonb,
'{ "level_thresholds":[3,5,7,9], "spell_abilities":[ …unlock_level/replaces… ] }'::jsonb, ''
FROM characters c WHERE c.name = 'Larry' AND NOT EXISTS (…) LIMIT 1;`

Das `damage_levels`-Objekt enthält Tier `"0"` (Basis) bis `"4"`, jeweils mit `description`/
`description_en` und optional `effects` (z.B. `["cold_damage_1d6"]`).

## Code References

- `supabase/migrations/00049_epic_items.sql:2-39` — Schema + RLS
- `supabase/migrations/00114_rls_epic_items_shared_only.sql:6-17` — SELECT-Policy (Owner + Shares)
- `supabase/migrations/00166_fix_klinge_des_wassers_tiers.sql:1-90` — 5-Tier-Struktur, unlock_level-Shift
- `supabase/migrations/00169_fix_larry_name_and_reseed.sql:8-42` — vollständige Seed-Blaupause
- `src/lib/rules/epic-items.ts:134-143` — `getAutoUnlockedLevel`
- `src/lib/rules/epic-items.ts:352-366` — `getUnlockedSpellAbilities` (replaces-Logik)
- `src/lib/rules/epic-items.ts:261-273` — Effekt-Slug-Interpretation (kein Thief-Bonus)
- `src/lib/rules/epic-items.ts:415-419` — `applyThiefPenalty` (nur Abzug)
- `src/lib/rules/magic-items.ts:19-28,169-200` — `ThiefSkillBonuses` (positiv, Magic-Items-System)
- `src/lib/supabase/types.ts:343-367` — `DamageLevelEffect`, `EpicItemRow`
- `src/components/epic-equipment/damage-level-card.tsx:269-322` — Spell-Ability-Rendering
- `src/components/epic-equipment/simple-epic-card.tsx:19-132` — Card ohne Tiers (rendert keine Spell Abilities)
- `src/components/epic-equipment/epic-equipment-view.tsx:126-215` — DB-Writes (update/delete)
- `src/app/characters/[id]/epic/page.tsx:71-80` — höchstes Klassenlevel + epic_items-Load
- `src/components/play-mode/play-checks-panel.tsx:217-256` — Kombination Epic-Penalty + Magic-Bonus
- `messages/de.json` → `epic` — i18n-Keys (`spellAbilities`, `perDay`, `perWeek`, `thiefPenalty`, …)
- `backup-2026-04-07/characters.json:513-574` — Charakter Isolde (player_name Mascha)

## Architecture Documentation

- **Datenhaltung vor Logik:** Epic Items sind reine Daten (zwei JSONB-Blobs). Die gesamte Semantik
  (welcher Slug was bedeutet, wie Tiers freischalten, wie `replaces` wirkt) liegt in `epic-items.ts`
  als reine TS-Funktionen — konsistent mit dem Projektprinzip "Regelwerk-Engine ohne DB-Zugriff".
- **Zwei getrennte Item-Systeme:** `epic_items` (Overrides, Tiers, geheim, per Migration) vs.
  `character_equipment.magic_effects` (additive Boni inkl. Thief-Boni, via UI editierbar über
  `magic-item-form.tsx`). Play-Mode/Character-Sheet aggregieren beide getrennt und addieren die
  Ergebnisse.
- **Bilingualität** durchgängig über `name`/`name_en`, `description`/`description_en`,
  `effect`/`effect_en` + `localized()`.
- **Seed-Konvention:** `INSERT … SELECT … FROM characters c WHERE c.name = '<Name>' AND NOT EXISTS(…)
LIMIT 1` mit `ON CONFLICT`/`NOT EXISTS`-Idempotenz.

## Open Questions

Diese Punkte sind **Design-/Plan-Entscheidungen** (kein Research-Ergebnis), die sich aus dem
Ist-Zustand ergeben:

1. **Shadowdancer "+10% Verstecken/Schleichen" (Tier 2):** Das Epic-System hat keinen positiven
   Thief-Bonus-Pfad. Möglich wären u.a. (a) rein informativ als Spell-Ability-/Effekt-Text (GM/Spieler
   tracken manuell), (b) Erweiterung der Epic-Engine um Thief-Boni analog `ThiefSkillBonuses`, oder
   (c) ein zusätzliches Magic-Item in `character_equipment`. Zu klären im Plan.
2. **Shadowdancer "kein/halber Schaden bei Rettungswurf" (Tier 2):** Es gibt keinen strukturierten
   Save-Bonus-Mechanismus im Epic-System dafür — vermutlich am ehesten als Spell-Ability-/Effekt-Text
   abzubilden.
3. **Ring of many faces — `replaces`-Semantik:** Ob Change Self (Tier 2) die Alter-Self-Zeile (Tier 1)
   ersetzt oder beide angezeigt werden, und ob "Change Self kann bestimmte Personen imitieren" (Tier 3)
   als neue Ability oder als Text-Upgrade der Tier-2-Ability modelliert wird.
4. **Icon-Wahl:** verfügbare Icons sind auf die `epic-icon.tsx`-Map beschränkt
   (`glasses`, `heart-pulse`, `sparkles`, `swords`, `paw-print`, `flame`).
5. **Nutzungs-Tracking der Spell Abilities** ist nur lokaler UI-State (nicht persistiert) — für
   "3×/Tag" gibt es kein serverseitiges Zähl-/Reset-System.
