---
date: 2026-03-31T20:10:07.070521+00:00
git_commit: e92dbcbf0437c3e3bfe5239620090de1db04cc3c
branch: feat/polish-fixes
topic: "Crusader-Klasse aus Player's Option: Spells & Magic"
tags: [research, codebase, classes, kits, priesthoods, crusader]
status: complete
---

# Research: Crusader-Klasse aus Player's Option: Spells & Magic

## Research Question

Wie ist der Crusader im AD&D 2e Regelwerk definiert, und was muss in Chaos Forge geändert werden, um ihn hinzuzufügen?

## Summary

Der **Crusader** ist in Player's Option: Spells & Magic (PO:S&M) als **eigenständige Priester-Klasse** definiert — nicht als Kit für Clerics. Er steht auf derselben Ebene wie Cleric, Druid, Monk und Shaman. In Chaos Forge muss er daher als **neuer ClassId** im Klassensystem ergänzt werden (analog zu wie `druid` neben `cleric` existiert), zusammen mit einer eigenen XP-Tabelle, angepasster THAC0-Progression (Warrior-Rate), Sphären-Zugang, und Granted Powers. Da der Crusader **keine Untoten vertreiben** kann, aber Warrior-THAC0 nutzt und alle Waffen/Rüstungen tragen darf, ist er ein Hybrid zwischen Warrior und Priest.

## Detailed Findings

### 1. Crusader im AD&D 2e Regelwerk (PO:S&M S.50-51)

**Quelle:** `ressources/books/TSR Inc - AD&D 2nd Edition - Player's Option - Spells & Magic_djvu.txt:3699-3786`

| Eigenschaft               | Wert                                                                              |
| ------------------------- | --------------------------------------------------------------------------------- |
| **Typ**                   | Eigenständige Priester-Klasse (nicht Kit)                                         |
| **Ability Requirements**  | WIS 9, STR 12, CHA 12                                                             |
| **Prime Requisites**      | Wisdom, Strength                                                                  |
| **Races Allowed**         | Human, Dwarf, Elf                                                                 |
| **Hit Die**               | d8 (Priester-Standard)                                                            |
| **XP-Tabelle**            | Gleich wie Cleric (Table 23: Priest Experience Levels)                            |
| **Alignment**             | Muss lawful oder chaotic sein; NICHT NE, NG oder TN                               |
| **XP-Bonus**              | 10% wenn WIS und STR beide ≥ 16                                                   |
| **THAC0**                 | **Warrior-Rate** (1 pro Stufe, 20→19→18→...)                                      |
| **Rüstung**               | Alle Rüstungen und Schilde erlaubt                                                |
| **Waffen**                | Alle Waffen erlaubt                                                               |
| **Proficiency Crossover** | NWP-Crossover mit Warrior-Gruppe (kein Extra-Slot-Kosten)                         |
| **Magische Items**        | Alles was Priester ODER Kämpfer nutzen dürfen                                     |
| **Turn Undead**           | **NEIN** — Crusader können keine Untoten vertreiben                               |
| **Followers**             | 20-200 fanatische Soldaten ab Stufe 8 (wie Cleric, aber ohne festen Tempel nötig) |
| **Stronghold**            | Ab Stufe 9 darf er eine befestigte Tempe-Festung errichten                        |

**Sphären-Zugang:**

| Zugang            | Sphären                                    |
| ----------------- | ------------------------------------------ |
| Major             | All, Combat, Guardian, Healing, War, Wards |
| Minor             | Necromantic, Protection                    |
| Alignment-basiert | Lawful → major Law; Chaotic → major Chaos  |

**Granted Powers:**

| Stufe | Power        | Beschreibung                                                            |
| ----- | ------------ | ----------------------------------------------------------------------- |
| 3     | Lighten Load | 1×/Tag — halbiert das Gewicht der Ausrüstung einer Gruppe für einen Tag |
| 7     | Easy March   | 1×/Woche — Gruppe kann Gewaltmarsch ohne Erschöpfung                    |

### 2. Aktuelle Klassenarchitektur in Chaos Forge

#### ClassDefinition Interface (`classes.ts:3-13`)

```typescript
export interface ClassDefinition {
  id: ClassId;
  name: string;
  name_en: string;
  group: ClassGroup; // "warrior" | "priest" | "rogue" | "wizard"
  hitDie: number;
  abilityRequirements: Partial<Record<AbilityName, number>>;
  primeRequisites: AbilityName[];
  exceptionalStrength: boolean;
  classAbilities: ClassAbility[];
}
```

Der Crusader passt gut in dieses Schema:

- `group: "priest"` (nutzt Priester-Spell-Slots, ist Priest-Caster)
- `hitDie: 8`
- `exceptionalStrength: false` (Priester-Klasse, kein Warrior)
- `abilityRequirements: { wis: 9, str: 12, cha: 12 }`

**Problem: THAC0-Progression.** `getThac0()` in `combat.ts:12-31` nutzt nur `ClassGroup`, nicht `ClassId`. Der Crusader ist `group: "priest"` braucht aber Warrior-THAC0. Dies erfordert einen **ClassId-spezifischen Override** in `getThac0()`.

#### ClassId Union (`types.ts:97-113`)

Aktuell 16 Klassen. Der Crusader muss als `"crusader"` ergänzt werden.

#### XP-Tabellen (`experience.ts:6-39`)

Per-ClassId definiert. Da der Crusader die Cleric-Tabelle nutzt, kann `getXpTable()` analog zu den Wizard-Spezialisten auf `XP_TABLES.cleric` mappen.

### 3. Kit-System vs. Klassen-System

#### KitDefinition Interface (`kits.ts:3-12`)

```typescript
export interface KitDefinition {
  id: string;
  name: string;
  name_en: string;
  classId: ClassId;
  hitDieOverride: number | null;
  maxArmorAC: number | null;
  armorSpellFailure: number | null;
  abilities: { name: string; name_en: string; description: string; description_en: string }[];
}
```

Kits haben **keine** eigenen THAC0-Overrides, Sphären, Proficiency-Crossover, oder Granted Powers. Das Kit-System ist zu limitiert für den Crusader, der eigene THAC0-Progression, Sphären und Granted Powers braucht.

**Es gibt bereits 11 Cleric-Kits** (`fighting_priest`, `pacifist_priest`, `amazon_priestess`, `barbarian_priest`, `fighting_monk`, `nobleman_priest`, `outlaw_priest`, `peasant_priest`, `prophet`, `savage_priest`, `scholar_priest`). Der `fighting_priest` Kit sieht dem Crusader ähnlich, hat aber keine Warrior-THAC0 oder eigene Sphären.

**Fazit:** Der Crusader muss als **eigenständige Klasse** implementiert werden, nicht als Kit.

### 4. Priesthood/Sphären-System

#### PriesthoodDefinition (`priesthoods.ts:5-18`)

```typescript
export interface PriesthoodDefinition {
  id: string;
  name: string; name_en: string;
  deityAlignment: AlignmentId;
  priestAlignments: AlignmentId[];
  minAbilities: Partial<Record<...>>;
  spheres: SphereMap;
  grantedPowers: GrantedPower[];
  combatRating: CombatRating;
  allowedWeapons: string[];
  allowedArmor: string;
  source: string;
}
```

Dieses System ist für **Priesthood-Spezialisierungen** innerhalb einer Priester-Klasse gedacht (z.B. ein Cleric von Tempus bekommt die Priesthood "War").

Der Crusader hat eigene Standard-Sphären, die **nicht** über eine Priesthood definiert werden, sondern direkt zur Klasse gehören (wie `CLERIC_SPHERES` und `DRUID_SPHERES` in `magic.ts:62-87`). Zusätzlich kann ein Crusader aber eine Priesthood wählen, die seine Sphären weiter modifiziert.

#### magic.ts: getPriestSpheres (`magic.ts:96-116`)

Aktuell hardcoded für `cleric`, `druid`, `ranger`, `paladin`. Der Crusader braucht einen weiteren Branch in dieser Funktion mit eigenen Standard-Sphären.

#### magic.ts: isPriestCaster (`magic.ts:90-94`)

`PRIEST_CASTER_IDS` muss um `"crusader"` erweitert werden.

### 5. Combat-System Anpassungen

#### THAC0 (`combat.ts:12-31`)

Aktuell rein ClassGroup-basiert. Für den Crusader braucht `getThac0()` einen ClassId-Override:

```
if classId === "crusader" → Warrior-THAC0 (21 - level)
```

Alternativ: Eine separate `getThac0ForClass(classId, level)` Funktion, die ClassId und ClassGroup berücksichtigt.

#### Attacks Per Round (`combat.ts:162-181`)

Crusader bekommt **NICHT** die Warrior-Mehrfachangriffe. Er hat 1 Angriff/Runde wie alle Priester. Nur die THAC0-Progression ist Warrior-Rate.

#### Saving Throws

Der Crusader nutzt die Priester-Saving-Throw-Tabelle (nicht Warrior). Er ist `group: "priest"`, also funktioniert das bestehende System.

### 6. DB-Änderungen

#### classes-Tabelle (`supabase/migrations/00002_core_rules_schema.sql`)

```sql
CREATE TABLE classes (
  id text PRIMARY KEY,
  name text NOT NULL,
  class_group text CHECK (class_group IN ('warrior','priest','rogue','wizard')),
  hit_die integer NOT NULL,
  ability_requirements jsonb,
  prime_requisites text[],
  exceptional_strength boolean DEFAULT false
);
```

**Migration nötig:** `INSERT INTO classes VALUES ('crusader', 'Kreuzritter', 'priest', 8, ...)`.

#### character_classes-Tabelle (`supabase/migrations/00015_multiclass.sql`)

Hat Foreign Key auf `classes(id)`. Daher MUSS der DB-Seed VOR dem Erstellen eines Crusader-Charakters erfolgen.

#### Rassen-Beschränkung

Laut Regelwerk: Human, Dwarf, Elf. In Chaos Forge werden Einschränkungen nur als **Warnung** gezeigt (Hausregel), nicht blockiert. Die `races.ts`-Definition und `canPlayClass()` müssten den Crusader berücksichtigen.

### 7. Wizard-Step und UI-Integration

#### step-class.tsx

Importiert `getAllClasses()` und zeigt alle Klassen als auswählbare Cards. Wenn der Crusader in `CLASSES` ergänzt wird, erscheint er automatisch.

#### step-kit.tsx

Filtert Kits per `kit.classId`. Crusader-Kits könnten optional ergänzt werden (PO:S&M definiert keine spezifischen Crusader-Kits).

### 8. Zusammenfassung der nötigen Änderungen

| Datei                          | Änderung                                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `types.ts`                     | `"crusader"` zu `ClassId` Union hinzufügen                                                |
| `classes.ts`                   | `ClassDefinition` für Crusader in `CLASSES`                                               |
| `combat.ts`                    | `getThac0()` um ClassId-Override für Crusader erweitern (Warrior-Rate)                    |
| `magic.ts`                     | `CRUSADER_SPHERES` konstante + `getPriestSpheres()` Branch + `isPriestCaster()` erweitern |
| `experience.ts`                | `getXpTable()` auf `cleric`-Tabelle mappen                                                |
| `races.ts`                     | `canPlayClass()` für Crusader bei Human/Dwarf/Elf (Warnung bei anderen)                   |
| `priesthoods.ts`               | Keine Änderung nötig (Crusader kann existierende Priesthoods nutzen)                      |
| `supabase/migrations/`         | Neue Migration: `INSERT INTO classes` für Crusader                                        |
| `messages/de.json` + `en.json` | Translations für Klassenname und Fähigkeiten                                              |
| `step-class.tsx`               | Keine Änderung nötig (automatisch via `getAllClasses()`)                                  |

## Code References

- `src/lib/rules/types.ts:97-113` — ClassId Union Type
- `src/lib/rules/classes.ts:3-13` — ClassDefinition Interface
- `src/lib/rules/classes.ts:400-435` — Cleric-Definition (als Vorlage)
- `src/lib/rules/combat.ts:12-31` — getThac0() Funktion (braucht Override)
- `src/lib/rules/magic.ts:62-77` — CLERIC_SPHERES (Vorlage für CRUSADER_SPHERES)
- `src/lib/rules/magic.ts:90-94` — PRIEST_CASTER_IDS Liste
- `src/lib/rules/magic.ts:96-116` — getPriestSpheres() (braucht Crusader-Branch)
- `src/lib/rules/experience.ts:42-50` — getXpTable() (braucht Crusader→Cleric Mapping)
- `src/lib/rules/kits.ts:3-12` — KitDefinition Interface (zu limitiert für Crusader)
- `src/lib/rules/priesthoods.ts:5-18` — PriesthoodDefinition Interface
- `src/components/wizard/step-class.tsx` — Automatisch via getAllClasses()
- `ressources/books/TSR Inc - AD&D 2nd Edition - Player's Option - Spells & Magic_djvu.txt:3699-3786` — Crusader-Regeln

## Architecture Documentation

### Klassen vs. Kits

- **Klassen** (`ClassDefinition`): Bestimmen ClassGroup (→ THAC0, Saves, Spell Progression), Hit Die, Ability Requirements. 16 Klassen aktuell.
- **Kits** (`KitDefinition`): Modifikationen auf bestehenden Klassen. Haben `hitDieOverride`, `maxArmorAC`, `armorSpellFailure`, und Abilities. 84 Kits aktuell.
- **Priesthoods** (`PriesthoodDefinition`): Deity-spezifische Sphären und Granted Powers für Priester-Klassen. 20+ Priesthoods.

### THAC0-Override-Architektur

Die aktuelle Architektur kennt keinen ClassId-spezifischen THAC0. `getThac0(classGroup, level)` nimmt nur ClassGroup. Für den Crusader muss entweder:

1. Eine neue Funktion `getThac0ForClass(classId, level)` geschaffen werden, die `getThac0` wrapped
2. Oder `getThac0` erweitert werden um einen optionalen `classId`-Parameter

Option 2 ist minimal-invasiver, da alle bestehenden Aufrufer unverändert bleiben können.

### Spell-System

Der Crusader ist ein Full-Priest-Caster (Spell Level 1-7 wie Cleric). Er nutzt dieselbe Spell-Slot-Tabelle und das Spell-Points-System wie alle Priester. Seine Sphären-Zugang unterscheidet sich aber deutlich vom Standard-Cleric (weniger Sphären, aber inkl. War und Wards).

## Open Questions

1. **Alignment-abhängige Sphären:** Der Crusader bekommt Law ODER Chaos Sphere je nach Alignment. Wie wird das technisch gelöst? Aktuell sind Sphären klassen-/priesthoodbasiert, nicht alignment-basiert. Mögliche Lösung: `getPriestSpheres()` um alignment-Parameter erweitern, oder zwei Priesthood-Varianten (lawful_crusader / chaotic_crusader).

2. **Crusader-spezifische Kits:** PO:S&M definiert keine expliziten Crusader-Kits. Sollen die bestehenden Cleric-Kits für Crusader verfügbar sein, oder nur die Crusader-eigenen Fähigkeiten?

3. **Granted Powers vs. Priesthood:** Der Crusader hat eigene Granted Powers (Lighten Load, Easy March). Diese könnten als `classAbilities` im ClassDefinition modelliert werden (wie bei Paladin "Handauflegen"), ODER über das GrantedPower-System der Priesthoods. Da der Crusader auch eine Priesthood wählen kann (die eigene Granted Powers bringt), wäre `classAbilities` für die Klassen-eigenen Powers klarer.

4. **"All Weapons" Implementierung:** Chaos Forge hat bisher keine Waffen-Restriktionen pro Klasse im Code (der Cleric hat keine Waffen-Blockierung). Falls Waffen-Restriktionen in Zukunft implementiert werden, muss der Crusader als "alle Waffen erlaubt" markiert sein.
