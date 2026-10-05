---
date: "2026-07-30T13:54:19.157754+00:00"
git_commit: 23263cce96bc2a1177d2abd526b6556c52650bca
branch: feat/character-sheet-rescan
topic: "Epic Items für Nowi: Tricksters Choice & Netherese Blooded"
tags: [research, epic-items, spell-points, multiclass, nowi]
status: complete
---

# Research: Epic Items für Nowi — "Tricksters Choice" & "Netherese Blooded"

## Research Question

Wie funktioniert das Epic-Items-System aktuell, und was wird gebraucht, um zwei neue Items für den Charakter "Nowi" anzulegen:

1. **Tricksters Choice** — silberner W6, 3×/Tag Portal zu einem levelabhängigen extradimensionalen Raum (Truhe → Hütte → Haus).
2. **Netherese Blooded** (nur Magier) — Stufe×2 Bonus-Spellpoints, levelabhängige Zauber-Sonderfähigkeiten (freier Zauber, maximierter Zauber, gesteigerter Zauber mit Magick-Kostentabelle, TP→SP-Umwandlung).

Beide Items sind laut handschriftlicher Vorlage für den Spieler "Carsten" notiert.

## Zusammenfassung der wichtigsten Erkenntnisse

- **Nowi Tarja** existiert nur live in Supabase (keine Seed-Migration), ID `58299456-112f-4455-8b12-60d7ed258150`, Spielername `player_name = "C. Tapken"` — das erklärt die scheinbare Namensdiskrepanz: "Carsten" auf dem Notizzettel ist vermutlich der Vorname des Spielers hinter "C. Tapken", Nowi ist dessen Charakter.
- Nowi ist **Elf, Multiclass Mage(L9)/Thief(L7)**, `is_active: true` für beide Klassen, `int: 18`, `wis: 15`, `hp_max/hp_current: 23`. Die für Epic-Item-Auto-Unlock verwendete "Charakterstufe" ist `Math.max(9, 7) = 9` (siehe `src/app/characters/[id]/epic/page.tsx:70-74`) — passt zufällig exakt mit ihrer Magier-Stufe zusammen, es gibt aber **kein Mechanismus, der Epic-Item-Effekte auf eine einzelne Klasse beschränkt** ("mage only" wäre rein narrativ/aus dem Kontext heraus korrekt, da Nowi ohnehin Magierin ist).
- Nowi hat aktuell **keine Epic Items** in der DB.
- **Kritischer Befund:** Nowis `spell_system` steht auf `"slots"`, nicht `"points"`. Das Wizard-Spellpoints-System (Player's Option Table 17-19) existiert zwar vollständig in `src/lib/rules/spellslots.ts:238-325` und wird in `play-spellbook-panel.tsx` sowie `tab-spells.tsx` genutzt — aber **nur wenn `character.spell_system === "points"`**. "Netherese Blooded" dreht sich mechanisch komplett um Spellpoints (Bonus-SP, Zauberkosten-Tabelle, TP→SP-Umwandlung). Ohne Wechsel auf Points-Mode hätten die meisten Effekte des Items im UI keine Wirkung.
- Das bestehende Epic-Items-System kennt **kein Feld für "Bonus-Spellpoints"** oder für "freie/maximierte/gesteigerte Zauber pro Tag" — das wäre eine Erweiterung von `EpicEffects` (`src/lib/rules/epic-items.ts`) plus Verdrahtung in `play-spellbook-panel.tsx`.
- Epic Items werden **ausschließlich per SQL-Migration** angelegt (kein GM-Formular, keine API-Route). Muster: `INSERT INTO epic_items SELECT c.id, ... FROM characters c WHERE c.name = 'Nowi Tarja'`.
- Waffen-/Zahlen-Boni (falls nötig) laufen nie über `epic_items`, sondern separat über `character_equipment.hit_bonus/damage_bonus` — für beide Nowi-Items voraussichtlich nicht relevant, da keine Waffenboni beschrieben sind.

## Detaillierte Befunde

### 1. Epic-Items-Datenmodell

**Schema** (`supabase/migrations/00049_epic_items.sql`):

```sql
CREATE TABLE public.epic_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  name_en text,
  description text NOT NULL DEFAULT '',
  description_en text,
  icon text NOT NULL DEFAULT 'sparkles',
  equipped boolean NOT NULL DEFAULT false,
  damage_level integer NOT NULL DEFAULT 0,
  max_damage_level integer NOT NULL DEFAULT 0,
  damage_levels jsonb NOT NULL DEFAULT '{}',
  simple_effects jsonb NOT NULL DEFAULT '{}',
  notes text NOT NULL DEFAULT '',
  UNIQUE(character_id, slug)
);
```

`damage_levels`: `{"0": {description, description_en, effects[], stat_overrides?}, "1": {...}, ...}`
`simple_effects`: freier Container — bekannte Keys: `level_thresholds`, `spell_abilities[]`, `shapeshift_forms[]`, `special_attacks[]`, `overclock{}`, `fragility{}`, `base_<stat>`, `perception_bonus`, `weapon_stats{}`.

### 2. Auto-Unlock nach Charakterlevel

`src/lib/rules/epic-items.ts:134-143` (`getAutoUnlockedLevel`): `simple_effects.level_thresholds = [3, 5, 7, 9]` schaltet Tier 1-4 frei, sobald `characterLevel >= threshold[i]`. Genau dieses Muster passt 1:1 auf die vier Levelbänder in beiden Nowi-Items (Lvl 3-4 / 5-6 / 7-8 / 9-10 → Tier 0-3, Thresholds `[3, 5, 7, 9]`, identisch zu allen bestehenden Items).

Bei `level_thresholds` werden Effekte **kumulativ** über `getCumulativeEffects()` (Zeilen 163-195) aggregiert — jede höhere Stufe behält die Fähigkeiten der niedrigeren. Das passt für "Tricksters Choice" (jede Stufe bekommt einen _besseren_ Portal-Zieltyp, kein Stacking mehrerer Truhen gleichzeitig nötig, da nur der aktuelle Tier-Effekt beschrieben werden muss) und für "Netherese Blooded" mit Vorsicht: Laut Vorlage sind die Fähigkeiten pro Levelband **unterschiedliche Fähigkeiten** (Lvl 3-4: freier Zauber; Lvl 5-6: maximierter Zauber; Lvl 7-8: gesteigerter Zauber; Lvl 9-10: TP→SP), keine additiven Boni — das muss in der Planungsphase geklärt werden, ob z. B. Nowi (Stufe 9 aus Magier-Sicht) **nur** die Lvl-9-10-Fähigkeit erhält oder **alle vier kumulativ** (letzteres folgt dem Code-Standardverhalten, wirkt aber inhaltlich unpassend, da die handschriftliche Vorlage eher "ab dieser Stufe gilt diese EINE neue Fähigkeit" suggeriert — ähnlich wie bei den `shapeshift_forms`/`special_attacks`, die ja auch bewusst additiv gedacht sind, sodass alte Formen erhalten bleiben).

### 3. `spell_abilities` — bereits volles Feature

`src/lib/rules/epic-items.ts:51-59` (Interface), `:352-366` (`getUnlockedSpellAbilities`):

```typescript
export interface SpellAbility {
  key: string;
  name: string;
  name_en: string;
  usesPerDay: number; // -1 = unlimited
  usesPerWeek: number;
  effect: string;
  effect_en: string;
}
```

Unterstützt `unlock_level` pro Fähigkeit und eine `replaces`-Kette (neue Fähigkeit ersetzt alte, wenn beide freigeschaltet wären) — siehe Referenzimplementierung "Klinge des Wassers" (`supabase/migrations/00165_seed_larry_klinge_des_wassers.sql`, `00166`, `00169`): Water Walk/Water Breathing/Cone of Cold mit `usesPerWeek: 1`. Dieses Pattern passt strukturell gut auf "Tricksters Choice" (3×/Tag Portal, `usesPerDay: 3`), aber die **Portal-Zielbeschreibung ändert sich pro Tier komplett** (Truhe → Hütte → Haus), nicht nur die Nutzungsanzahl — am saubersten als **eine** `spell_ability` mit `unlock_level: 0` und tierabhängigem `effect`-Text über die normalen `damage_levels`-Beschreibungsfelder gelöst (jeder Tier-Eintrag beschreibt das aktuelle Portal-Ziel), kombiniert mit einer festen `usesPerDay: 3`-Angabe. Alternativ: 4 separate `spell_abilities`-Einträge mit `replaces`-Kette, exakt wie bei Isolde's Ring der vielen Gesichter (siehe unten).

### 4. Referenzbeispiele (bestehende Items)

| Item                                                | Migration                                                                                                 | Muster                                                                                                                                                                               |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Gor's Totem Warrior                                 | `00057_gor_epic_items_v2.sql`                                                                             | `shapeshift_forms[]` mit `unlock_level`, `usesPerDay`                                                                                                                                |
| Gor's Tattoo                                        | `00057_gor_epic_items_v2.sql`                                                                             | `special_attacks[]` mit `unlock_level`, `usesPerDay` (kein `usesPerWeek`)                                                                                                            |
| Sprocket's Kondensator                              | `00150`/`00157`                                                                                           | `base_<stat>` (biologischer Fallback-Wert bei Unequip)                                                                                                                               |
| Klinge des Wassers (Larry)                          | `00165`, `00166`, `00169`                                                                                 | `level_thresholds [3,5,7,9]`, `spell_abilities[]` inkl. `usesPerWeek`, **zusätzlich** separates `character_equipment`-Insert mit `hit_bonus`/`damage_bonus` für die Waffenkomponente |
| Schattentänzer / Ring der vielen Gesichter (Isolde) | `00224`, `00225` — **NICHT in main, nur in offenem PR #166** (`feat/isolde-epic-items-shadowdancer-ring`) | `spell_abilities[]` mit `replaces`-Ketten (`alter_self → change_self → change_self_specific → polymorph_self`), neue `thief_bonus_hide_10`/`thief_bonus_move_10`-Effekt-Slugs        |

Alle Items nutzen exakt `level_thresholds: [3, 5, 7, 9]` für 4-Tier-Progressionen — identisch zu den in der Vorlage vorgegebenen Levelbändern (3-4 / 5-6 / 7-8 / 9-10).

### 5. `getEpicEffects()` — was fehlt für Netherese Blooded

`src/lib/rules/epic-items.ts:61-96` (`EpicEffects`-Interface) kennt aktuell **keine** Felder für:

- Bonus-Spellpoints (`statOverrides`/`forceStatOverrides` decken nur STR/DEX/CON/INT/WIS/CHA ab, keine abgeleiteten Ressourcen)
- "X-mal/Tag einen Zauber kostenlos/maximiert/gesteigert wirken" als strukturierte, UI-gebundene Fähigkeit (im Gegensatz zu `spellAbilities`, die feste vordefinierte Zaubereffekte sind — hier geht es um eine _Modifikation des Zaubersystems selbst_, nicht um einen zusätzlichen Zauber)
- TP→SP-Umwandlung

Diese drei Punkte sind mechanisch komplexer als alles bisher im Epic-System Abgebildete und würden entweder (a) rein narrativ als `description`/`notes`-Text im Item hinterlegt werden (Spieler/GM wenden das manuell am Tisch an, kein UI-Automatismus — Modell folgt dem aktuellen Stand für "Tricksters Choice"-artige Freitext-Fähigkeiten), oder (b) eine echte Erweiterung von `EpicEffects` + `play-spellbook-panel.tsx` erfordern. Das ist eine zentrale Entscheidung für die Planungsphase.

### 6. Spellpoints-System (Player's Option) — bereits vollständig implementiert, aber optional

`src/lib/rules/spellslots.ts:238-325`:

```typescript
export function getWizardSpellPoints(level: number): number { ... }        // Table 17
export function getWizardSpecialistBonusPoints(level: number): number { ... }
export function getWizardBonusSpellPoints(intScore: number): number { ... } // Table 19
export function getWizardSpellCost(spellLevel: number, isFree = false): number { ... } // Table 18
export function getWizardMaxMemorized(level: number): number { ... }
```

`WIZARD_SPELL_POINT_COST` (Tabelle 18, Zeilen 270-280) hat exakt die Struktur `{fixed, free}` pro Spelllevel 1-9 — strukturell identisch zur handschriftlichen "Fixed Magick / Free-Powered-fixed Magick / Powered-free Magick"-Tabelle aus der Vorlage (die App-Tabelle hat aber nur 2 Spalten, die Vorlage 3 — "Powered free Magick" für gesteigerte UND kostenlose Zauber gleichzeitig existiert im App-Code noch nicht).

**Aktivierung nur per Character-Flag:** `src/components/play-mode/play-spellbook-panel.tsx:89` — `const isPointsMode = character.spell_system === "points";`. Nowis `characters.spell_system` steht aktuell auf `"slots"`. Ohne Umschalten zeigt Play Mode weiterhin klassische Slots (`getWizardSpellSlots`), und `character.spell_points_used` (aktuell `0`) bleibt unbenutzt.

`totalPoints`-Berechnung (Zeile 108-115):

```typescript
if (isWizard) {
  return getWizardSpellPoints(casterLevel) + getWizardBonusSpellPoints(character.int);
}
```

`pointsRemaining = totalPoints - character.spell_points_used` (Zeile 119). Ein Epic-Item-Bonus (Stufe×2 SP) müsste hier additiv einfließen — aktuell gibt es dafür keinen Hook.

### 7. Charakterklassen-Auflösung für Multiclass

`characters.class_id`/`.level` sind **deprecated** seit `supabase/migrations/00015_multiclass.sql` — maßgeblich ist die Junction-Tabelle `character_classes` (`character_id, class_id, level, xp_current, is_active`). Für Nowi:

```json
[
  { "class_id": "mage", "level": 9, "xp_current": 40000, "is_active": true },
  { "class_id": "thief", "level": 7, "xp_current": 40000, "is_active": true }
]
```

Epic-Item-Seite verwendet `Math.max(...classesForLevel.map(c => c.level))` als `character.level` für Auto-Unlock (`src/app/characters/[id]/epic/page.tsx:70-74`) — für Nowi also **9**, was zufällig ihrer Magier-Stufe entspricht (da Mage > Thief). Beide neuen Items würden bei ihr sofort auf Tier "Lvl 9-10" (Tier 3, höchste Stufe) freigeschaltet erscheinen.

### 8. Wie Items angelegt werden (kein GM-Formular)

Kein Insert-Formular/API-Route für `epic_items` gefunden (`grep -rl "epic_items" src/` zeigt nur `.select()`/`.update()` in `epic-equipment-view.tsx`, `damage-level-card.tsx`, sowie einen reinen Kopier-Helper `copyRelated("epic_items")` in `src/app/master/actions.ts:877-935` für den Charakter→NPC-Konvertierungsflow). Neue Items entstehen ausschließlich über neue SQL-Migrationsdateien.

**Namens-Subquery-Pattern** (`supabase/migrations/00165_seed_larry_klinge_des_wassers.sql:9-134`):

```sql
INSERT INTO public.epic_items (
  character_id, slug, name, name_en, description, description_en, icon,
  equipped, damage_level, max_damage_level, damage_levels, simple_effects, notes
)
SELECT
  c.id, 'slug-hier', 'Name (DE)', 'Name (EN)', 'Beschreibung DE', 'Beschreibung EN',
  'icon-name', true, 0, 3, '{...}'::jsonb, '{...}'::jsonb, ''
FROM public.characters c
WHERE c.name = 'Nowi Tarja'
LIMIT 1;
```

Für Nowi wäre `WHERE c.name = 'Nowi Tarja'` zu verwenden (exakter Name aus der DB bestätigt, siehe Abschnitt "Zusammenfassung"). Ein `NOT EXISTS`-Guard auf `(character_id, slug)` (UNIQUE-Constraint deckt das ohnehin ab) macht die Migration idempotent-sicher wiederholbar.

### 9. Icons

`src/components/epic-equipment/epic-icon.tsx` — unterstützte Namen: `glasses`, `heart-pulse`, `sparkles`, `swords`, `paw-print`, `flame` (Fallback: `sparkles`). Für "Tricksters Choice" (Würfel/Portal) und "Netherese Blooded" (Magie) gibt es kein perfekt passendes Icon in der aktuellen Map — `sparkles` ist der neutrale Standard-Fallback, den auch die Isolde-Items nutzen, ohne die Icon-Map zu erweitern.

### 10. Betroffene Anzeige-Oberflächen

Analog zu allen bestehenden Items:

- `src/app/characters/[id]/epic/page.tsx` — lädt Items serverseitig
- `src/components/epic-equipment/epic-equipment-view.tsx` → `damage-level-card.tsx` — Haupt-UI (Equip-Toggle, Tier-Anzeige, `spellAbilities`/`specialAttacks` mit Use-Tracking, `usesPerDay`/`usesPerWeek`-Label)
- `src/components/play-mode/play-combat-panel.tsx:611-763` — zeigt `shapeshiftForms`/`specialAttacks` in Play Mode (spellAbilities dort nicht extra behandelt, nur im Epic-Equipment-Tab)
- Print Sheet / DOCX Export nutzen bislang **nur** `epicEffects.acBonus` — individuelle Items/Fähigkeiten erscheinen dort nicht (gilt für alle bestehenden Items gleichermaßen, keine Nowi-spezifische Lücke)

## Code-Referenzen

- `supabase/migrations/00049_epic_items.sql` — Schema
- `supabase/migrations/00015_multiclass.sql` — `character_classes`-Tabelle
- `supabase/migrations/00057_gor_epic_items_v2.sql` — `shapeshift_forms`/`special_attacks`-Vorbild
- `supabase/migrations/00165_seed_larry_klinge_des_wassers.sql`, `00166`, `00169` — `spell_abilities` inkl. `usesPerWeek`, Namens-Subquery-Pattern
- `supabase/migrations/00224_seed_isolde_shadowdancer.sql`, `00225_seed_isolde_ring_of_many_faces.sql` — `replaces`-Ketten (nur im offenen PR #166, nicht in main)
- `src/lib/rules/epic-items.ts:51-96` — `SpellAbility`/`EpicEffects`-Typen
- `src/lib/rules/epic-items.ts:134-195` — Auto-Unlock + kumulative Effekte
- `src/lib/rules/epic-items.ts:352-366` — `getUnlockedSpellAbilities` (`replaces`-Logik)
- `src/lib/rules/spellslots.ts:238-325` — Wizard-Spellpoints-System (Player's Option Tables 17-19)
- `src/components/play-mode/play-spellbook-panel.tsx:89,108-119,205-225` — `isPointsMode`-Gate, `totalPoints`/`pointsRemaining`-Berechnung, Zauberkosten
- `src/app/characters/[id]/epic/page.tsx:70-74` — Highest-Class-Level-Berechnung für Multiclass
- `src/components/epic-equipment/epic-icon.tsx` — Icon-Map
- `src/app/master/actions.ts:877-935` — `copyRelated("epic_items")` (einziger Nicht-Migrations-Insert-Pfad, nur für NPC-Konvertierung)

## Architektur-Dokumentation

### Epic-Items-Datenfluss

```
SQL-Migration (INSERT, WHERE c.name = 'Nowi Tarja')
  → epic_items (DB)
    → epic/page.tsx (Server, lädt Items + Math.max(class-levels))
      → EpicEquipmentView → DamageLevelCard (Tier-Anzeige, Equip, Use-Tracking)
      → getEpicEffects(items, level) → EpicEffects
        → Play Mode (shapeshiftForms, specialAttacks, spellAbilities-Liste)
        → Character Sheet / Print / DOCX (nur acBonus wird dort verwendet)
```

### Spellpoints-Datenfluss (nur bei `spell_system = "points"`)

```
character.spell_system ("slots" | "points")
  → play-spellbook-panel.tsx: isPointsMode
    → totalPoints = getWizardSpellPoints(level) + getWizardBonusSpellPoints(int)
    → pointsRemaining = totalPoints - character.spell_points_used
    → getWizardSpellCost(spellLevel, isFree) beim Wirken
```

Ein Epic-Item-Bonus für Spellpoints hat aktuell **keinen Einhängepunkt** in dieser Kette — `getEpicEffects()` und `play-spellbook-panel.tsx` kennen sich gegenseitig nicht für Spellpoints (im Gegensatz zu z. B. `perceptionBonus`, das bereits durchverdrahtet ist).

## Offene Fragen für die Planungsphase

1. **Spell-System-Umschaltung:** Soll Nowi für "Netherese Blooded" auf `spell_system = "points"` umgestellt werden (damit Bonus-SP/Kostenlogik im UI überhaupt sichtbar/nutzbar sind), oder bleibt sie in "slots" und das Item wird rein narrativ (Text im Item, manuelle Anwendung am Spieltisch) hinterlegt?
2. **Kumulativ vs. Tier-exklusiv:** Sollen bei "Netherese Blooded" alle bis zur aktuellen Stufe freigeschalteten Fähigkeiten gleichzeitig gelten (Code-Standardverhalten bei `level_thresholds`), oder nur die für die aktuelle Stufe spezifische EINE Fähigkeit? Die Vorlage liest sich eher wie "ab dieser Stufe gilt X", nicht "zusätzlich zu den vorherigen Boni".
3. **Automatisierungsgrad:** Sollen die neuen, mechanisch komplexen Fähigkeiten (freier Zauber 3×/Tag, maximierter Zauber, gesteigerter Zauber mit Magick-Kosten, TP→SP) als reine Beschreibungstexte im Item hinterlegt werden (kein Code-Änderungsbedarf, konsistent mit "Tricksters Choice") oder soll das UI sie aktiv unterstützen (Buttons/Zähler in Play Mode, wie bei `specialAttacks`)? Letzteres würde signifikante Erweiterungen an `EpicEffects` und `play-spellbook-panel.tsx` erfordern.
4. **Magick-Kostentabelle vollständig:** Die dritte Spalte "Powered free Magick" (gesteigert UND kostenlos kombiniert) kommt in der Vorlage vor, wird aber laut Text erst ab Lvl 9-10 nutzbar ("Freie Zauber der Stufe 1 kosten nun nur noch 4 Spellpoints") — die Tabelle selbst wird nicht explizit im Fließtext für Lvl 7-8 referenziert außer für "Powered fixed" (Spalte 2). Sollte die volle 3-Spalten-Tabelle dennoch komplett in `notes`/`description` übernommen werden, oder reicht ein Verweis auf die im Fließtext beschriebene Mechanik?
5. **"Mage only"-Hinweis:** Da es keinen Enforcement-Mechanismus für klassenbeschränkte Items gibt und Nowi ohnehin Magierin ist, ist die Einschränkung praktisch bedeutungslos (nur relevant, falls Nowi später die Magier-Klasse wechselt/aufgibt) — reicht ein Hinweistext in der Beschreibung?
6. **Icon-Wahl:** Für beide Items gibt es kein exakt passendes Icon in der aktuellen Map (`glasses`, `heart-pulse`, `sparkles`, `swords`, `paw-print`, `flame`) — reicht der Fallback `sparkles` für beide, oder soll die Icon-Map erweitert werden (z. B. `dice` für Tricksters Choice, `wand` für Netherese Blooded)?
