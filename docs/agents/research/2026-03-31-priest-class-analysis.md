---
date: 2026-03-31T06:47:15Z
git_commit: f28f0f3
branch: feat/multiclass-armor-warnings
topic: "Priester-Grundklasse und Varianten — Ist-Zustand und Lückenanalyse"
tags: [research, codebase, priest, cleric, druid, spheres, kits, ad&d-2e]
status: complete
---

# Research: Priester-Grundklasse und Varianten — Ist-Zustand und Lückenanalyse

## Research Question

Wie funktioniert die Priest-Klasse (Cleric, Druid und Varianten) in AD&D 2e im Vergleich zu den anderen Klassen, und was fehlt in der App, damit sie über die gesamte Applikation korrekt funktioniert?

## Summary

Die App hat bereits eine **solide Grundimplementierung** für die zwei PHB-Priesterklassen (Cleric & Druid) mit Sphären-System, Spell Slots/Points und 22 Kits. Allerdings fehlen mehrere systemische Priester-Features, die über die gesamte App hinweg wirken müssten. Die größten Lücken betreffen:

1. **Turn Undead** — nur als Text-Ability definiert, keine mechanische Implementierung (Tabelle, Würfelmechanik, UI)
2. **Priests of Specific Mythoi** — das Konzept individuell konfigurierbarer Sphären-Zuweisungen pro Gottheit fehlt komplett
3. **Druid-Branches** (Arctic, Desert, Jungle, Mountain, Swamp) — fehlen komplett
4. **Granted Powers** — das System aus dem Complete Priest's Handbook (High/Medium/Low Powers) existiert nicht
5. **Druid-Hierarchie** — Hierophant-Stufen und Druid-Organisation nicht abgebildet
6. **Waffen-/Rüstungsrestriktionen** — pro Priester-Typ unterschiedlich, aber nicht dynamisch konfigurierbar

## Detailed Findings

### 1. PHB-Priester-Klassenstruktur (Regelbuch-Referenz)

Das PHB definiert die Priest-Gruppe mit folgender Hierarchie:

```
Priest (Gruppe)
├── Cleric (Standardklasse)
│   ├── WIS 9 Minimum
│   ├── Alle Rüstungen + Schilde
│   ├── Nur stumpfe Waffen
│   ├── 12 Major + 2 Minor Sphären (NICHT: Animal, Plant, Weather; Minor: Elemental)
│   ├── Turn Undead
│   └── Followers ab Stufe 8, Stronghold ab Stufe 9
│
├── Druid (Priest of Specific Mythos — Natur)
│   ├── WIS 12, CHA 15 Minimum
│   ├── Nur Lederrüstung + Holzschild
│   ├── Nur: Club, Sickle, Dart, Spear, Dagger, Scimitar, Sling, Staff
│   ├── 6 Major + 1 Minor Sphäre (All, Animal, Elemental, Healing, Plant, Weather; Minor: Divination)
│   ├── KEIN Turn Undead
│   ├── +2 Rettungswurf vs. Feuer/Elektrizität
│   ├── Ab L3: Pflanzen/Tiere/Wasser identifizieren, spurlos durch Dickicht
│   ├── Ab L3: Waldkreaturensprachen lernen (+1/Stufe)
│   ├── Ab L7: Immunität vs. Fey Charm, Gestaltwandel 3x/Tag
│   └── Hierarchie: Initiates (1-11), Druids (12), Archdruids (13), Great Druid (14), Grand Druid (15), Hierophant (16+)
│
└── Priests of Specific Mythoi (DM-definiert)
    ├── Individuelle Ability-Anforderungen
    ├── Individuelle Waffen/Rüstungen
    ├── Individuelle Sphären-Zuweisung (Major/Minor)
    ├── Individuelle Granted Powers
    └── Individuelles Ethos/Alignment
```

**Quelle:** PHB Lines 5712-6610

### 2. Aktueller Implementierungs-Zustand in der App

#### 2.1 Klassen-Definitionen (`src/lib/rules/classes.ts:400-479`)

**Cleric** (L400-435):

- `id: "cleric"`, `group: "priest"`, `hitDie: 8`
- `abilityRequirements: { wis: 9 }`
- 3 Class Abilities: Turn Undead, All Armor/Shields, Spells through Prayer

**Druid** (L436-479):

- `id: "druid"`, `group: "priest"`, `hitDie: 8`
- `abilityRequirements: { wis: 12, cha: 15 }`
- 4 Class Abilities: Shapechange L7, Fey Immunity, Druidic Language, Woodland Abilities

#### 2.2 Sphären-System (`src/lib/rules/magic.ts:56-109`)

Korrekt implementiert:

```typescript
CLERIC_SPHERES: 12 Major (all, astral, charm, combat, creation, divination,
                          guardian, healing, necromantic, protection, summoning, sun)
                2 Minor (elemental, weather)

DRUID_SPHERES:  6 Major (all, animal, elemental, healing, plant, weather)
                1 Minor (divination)
```

**Abweichung vom PHB:** PHB-Cleric hat **Animal, Plant, Weather als "kein Zugang"** und nur **Elemental als Minor**. Die App hat `weather: "minor"` — das ist korrekt, es fehlt aber die Dokumentation, dass Clerics explizit KEINEN Zugang zu Animal und Plant haben.

`getPriestSpheres(classId)` gibt nur für "cleric" und "druid" Sphären zurück — alle anderen Priester-Varianten bekommen ein leeres Objekt.

#### 2.3 Spell Slots & Points (`src/lib/rules/spellslots.ts:51-187`)

- **Priest Spell Slots** (PHB Table 24): L1-L20, 7 Spell Levels — korrekt
- **Bonus Slots** (WIS): via `getWisdomModifiers()` — korrekt
- **Spell Points** (Player's Option): L1-L20 mit WIS-Bonus — korrekt
- **Spell Point Cost**: L1=1, L2=2, L3=4, L4=6, L5=8, L6=10, L7=12 — korrekt
- **Ranger Druid Slots**: L8-20, 3 Spell Levels — korrekt
- **Paladin Priest Slots**: L9-20, 4 Spell Levels — korrekt

#### 2.4 Spell Learning (`src/lib/rules/spellslots.ts:278-327`)

`canLearnSpell()` validiert:

- Klasse muss Wizard/Priest/Bard sein
- Bei Priestern: Sphären-Check via `hasSphereAccess()`
- Minor Sphere → max Level 3
- **Limitation:** Nur Cleric und Druid haben Sphären definiert; andere Priester-Typen können de facto keine Zauber lernen

#### 2.5 Kits (`src/lib/rules/kits.ts`)

**11 Cleric-Kits:** fighting_priest, pacifist_priest, amazon_priestess, barbarian_priest, fighting_monk, nobleman_priest, outlaw_priest, peasant_priest, prophet, savage_priest, scholar_priest

**11 Druid-Kits:** avenger_druid, guardian_druid, hivemaster, lost_druid, natural_philosopher, outlaw_druid, pacifist_druid, savage_druid, shapeshifter_druid, totemic_druid, village_druid

#### 2.6 TypeScript-Typen (`src/lib/rules/types.ts`)

- `ClassId`: Enthält `"cleric" | "druid"` — keine weiteren Priester-Varianten
- `ClassGroup`: `"priest"` ist definiert
- `PriestSphere`: Alle 16 Sphären korrekt definiert
- `SphereAccess`: `"major" | "minor"` — korrekt

#### 2.7 Datenbank-Schema

- `classes` Tabelle: `class_group` Check-Constraint erlaubt `'priest'`
- `spells` Tabelle: `sphere text` Feld für Priester-Sphären
- `character_classes` Junction-Table für Multiclass
- Seed-Daten: Cleric und Druid mit korrekten Attributen

#### 2.8 UI-Integration

- **Play Mode** (`play-spellbook-panel.tsx:70-123`): Erkennt Priest-Gruppe, zeigt Spell Points/Slots
- **Character Sheet** (`tab-spells.tsx`): Sphären-Filter für Priester, Spell-Learning-Validierung
- **Character Wizard** (`step-class.tsx`): Klassen-Auswahl generisch, keine Priester-spezifische Logik

### 3. Complete Priest's Handbook — Konzepte und Lücken

Das PHBR03 definiert ein umfangreiches Framework für **Priests of Specific Mythoi**:

#### 3.1 Das "Designing Faiths"-System (PHBR03 Lines 3596-4600)

Jeder Priester-Typ einer spezifischen Gottheit wird durch folgende Konfiguration definiert:

- **Alignment** des Gottes und erlaubte Priester-Alignments
- **Minimum Ability Scores** (immer WIS + optional weitere)
- **Races Allowed**
- **Required/Recommended Proficiencies**
- **Weapon & Armor Restrictions** (Good/Medium/Poor Combat Abilities)
- **Spheres of Influence** (Major/Minor, variiert nach Combat Rating)
- **Granted Powers** (High/Medium/Low — kompensieren schwache Sphären)
- **Followers & Strongholds**
- **Ethos & Duties**

#### 3.2 Granted Powers System (PHBR03 Lines 3626-4600)

Drei Stufen von Granted Powers:

**High Powers** (häufig nützlich):

- Charm/Fascination (wie Suggestion, 3x/Tag)
- Immunities (gegen eine Wizard-Schule, Priester-Sphäre, oder alle Gifte)
- Inspire Fear (Aura, 3x/Tag)
- Turn Undead (Standard-Cleric-Ability)

**Medium Powers:**

- Incite Berserker Rage (+2 Angriff/Schaden)
- Soothing Word (Furcht entfernen, feindliche Reaktionen beeinflussen)
- Laying On of Hands (2 HP/Stufe, 1x/Tag)
- Prophecy/Visions

**Low Powers:**

- Detection/Identification
- Analysis (spezialisiert auf Gottheit-Attribut)
- Bonus NWPs

#### 3.3 Sample Priesthoods (PHBR03 Lines 6435-16000+)

Über **60 vollständige Priester-Klassen** mit individuellen Konfigurationen, darunter:

Agriculture, Ancestors, Animals, Arts/Crafts, Birth/Children, Community, Death, Disease, Divinity of Mankind, Elemental Forces, Evil, Fate/Destiny, Fertility, Fire, Fortune, Good, Guardianship, Healing, Hunt, Justice/Revenge, Life-Death-Rebirth, Light, Love, Magic, Metalwork, Mischief/Trickery, Moon, Nature, Oceans/Rivers, Oracles/Prophecy, Peace, Prosperity, Race, Rain, Redemption, Rulership/Kingship, Seasons, Sky/Weather, Stars, Strength, Sun, Thunder, Travelers, Vegetation, War, Wisdom, Wind

**Beispiel — Agriculture Priesthood (PHBR03 L6769-6950):**

- WIS 11, CON 12
- Races: Gnomes, Half-elves, Halflings, Humans
- Waffen: Bill, Flails, Hand-throwing axe, Scythe, Sickle (Poor Combat)
- Rüstung: Nur nicht-magische, nicht-metallische Rüstung + Schilde
- Major Spheres: All, Creation, Divination, Plant, Summoning
- Minor Spheres: Animal, Healing, Protection, Sun, Weather
- Granted Powers: Crop Analysis, Create Food & Water 1x/Tag extra, Food Poisoning Immunity, Heroes' Feast ab L8

### 4. Complete Druid's Handbook — Konzepte und Lücken

#### 4.1 Druid Branches (PHBR13)

Fünf alternative Druiden-Varianten mit angepassten Fähigkeiten:

| Branch                     | Besonderheiten                                              |
| -------------------------- | ----------------------------------------------------------- |
| **Arctic Druid** (L1011)   | Shapechange in arktische Tiere (Karibu, Eisbär, Schneeeule) |
| **Desert Druid** (L1132)   | Wüsten-spezifische Formen und Umgebungs-Fähigkeiten         |
| **Jungle Druid** (L1539)   | Tropische Kreaturen, Dschungel-Bewegung                     |
| **Mountain Druid** (L1627) | Elementar-/Wetter-Sphären-Bonus in Bergen                   |
| **Swamp Druid** (L1828)    | Feuchtgebiet-spezifische Formen                             |

Zusätzlich referenziert: Forest, Plains, Underground, Coastal/Gray Druid

#### 4.2 Druid Kits (PHBR13 ab L2358)

14 Kits definiert (die App hat 11 davon implementiert):

| Kit                 | In App?                    |
| ------------------- | -------------------------- |
| Adviser             | Nein                       |
| Avenger             | Ja (`avenger_druid`)       |
| Beastfriend         | Nein                       |
| Guardian            | Ja (`guardian_druid`)      |
| Hivemaster          | Ja (`hivemaster`)          |
| Lost Druid          | Ja (`lost_druid`)          |
| Natural Philosopher | Ja (`natural_philosopher`) |
| Outlaw              | Ja (`outlaw_druid`)        |
| Pacifist            | Ja (`pacifist_druid`)      |
| Savage              | Ja (`savage_druid`)        |
| Shapeshifter        | Ja (`shapeshifter_druid`)  |
| Totemic Druid       | Ja (`totemic_druid`)       |
| Village Druid       | Ja (`village_druid`)       |
| Wanderer            | Nein                       |

#### 4.3 Hierophant-Druiden (PHBR13 L5118+, L11769+)

Hierarchie-Stufen ab Level 16:

1. Hierophant Initiate
2. Hierophant Adept
3. Hierophant Master
4. Numinous Hierophant
5. Mystic Hierophant
6. Arcane Hierophant
7. Hierophant of the Cabal

**Nicht in der App abgebildet.**

### 5. Vergleich: Wizard vs. Priest — Architektur-Unterschiede

| Feature                | Wizard (App-Status)                            | Priest (App-Status)                       |
| ---------------------- | ---------------------------------------------- | ----------------------------------------- |
| Basis-Klasse           | Mage ✅                                        | Cleric ✅                                 |
| Spezialisierungen      | 8 Specialist-Schulen (Abjurer...Transmuter) ✅ | Priests of Specific Mythoi ❌             |
| Spell-Filter           | School-basiert ✅                              | Sphere-basiert ✅                         |
| Opposition/Restriction | `getOppositionSchools()` ✅                    | Sphere-Exclusion nur für Cleric/Druid ⚠️  |
| Specialist-Definition  | `SPECIALISTS[]` Array mit School+Opposition ✅ | Kein Äquivalent für Priester-Varianten ❌ |
| Spell Learning         | INT-Check + School-Validierung ✅              | Sphere-Check, aber nur 2 Klassen ⚠️       |
| Kits                   | 10+ Wizard-Kits ✅                             | 22 Priest-Kits ✅                         |
| Sub-Classes in Types   | 8 ClassIds (abjurer...transmuter) ✅           | Nur 2 ClassIds (cleric, druid) ⚠️         |

### 6. Was fehlt — Systematische Lückenanalyse

#### 6.1 Turn Undead (Cleric-Kernmechanik)

**PHB-Regel:** Clerics können Untote vertreiben/vernichten basierend auf Stufe vs. Untoten-HD. Erfordert:

- Turn Undead Tabelle (Cleric Level vs. Undead Type)
- Würfelmechanik (2d6 für Anzahl betroffener HD)
- Evil Clerics: Command Undead statt Turn
- Paladin: Turn als Cleric -2 Level
- Druids: KEIN Turn Undead

**App-Status:** Nur als Text in `classAbilities` — keine Tabelle, keine Mechanik, keine UI.

#### 6.2 Priests of Specific Mythoi (Konfigurierbares Sphären-System)

**PHB + PHBR03:** Über 60 verschiedene Priester-Typen mit jeweils individuellem Sphären-Zugang, Waffen/Rüstung, Granted Powers.

**App-Status:** `getPriestSpheres(classId)` hat nur einen `switch` mit `"cleric"` und `"druid"` Cases. Jede neue Priester-Variante müsste als eigene ClassId + Hardcoded Sphären-Map hinzugefügt werden.

**Architektur-Problem:** Es gibt kein generisches Daten-Modell, das es erlaubt, eine Gottheit/Faith mit ihren Sphären-Zuweisungen zu definieren und einem Charakter zuzuordnen.

#### 6.3 Granted Powers

**PHBR03:** 3-stufiges System (High/Medium/Low) mit über 20 verschiedenen Powers.

**App-Status:** Nicht implementiert. Class Abilities (Turn Undead, Shapechange) sind hardcoded Text-Descriptions.

#### 6.4 Druid Branches

**PHBR13:** 5+ alternative Druiden-Varianten mit modifizierten Shapechange-Formen und Umgebungs-Fähigkeiten.

**App-Status:** Nicht implementiert — nur ein generischer Druid.

#### 6.5 Druid-spezifische Kits (fehlend)

Aus PHBR13 fehlen:

- **Adviser** — Berater-Druide
- **Beastfriend** — Tierfreund
- **Wanderer** — Reisender Druide

#### 6.6 Waffen- und Rüstungsrestriktionen pro Priester-Typ

**PHB/PHBR03:** Jeder Priester-Typ hat unterschiedliche erlaubte Waffen und Rüstungen:

- Cleric: Alle Rüstungen, nur stumpfe Waffen
- Druid: Nur Leder + Holzschild, nur bestimmte Waffen
- Agriculture: Nur nicht-metallische Rüstung, Bill/Flail/Scythe/Sickle
- War: Alle Waffen und Rüstungen
- etc.

**App-Status:** Waffen-/Rüstungs-Restrictions sind als Text in `classAbilities` beschrieben, aber nicht als validierbare Datenstruktur implementiert.

#### 6.7 Druid-Hierarchie und Level-Restriktionen

**PHB:** Ab Level 12 gibt es eine strenge Hierarchie (max. 9 Druids, 3 Archdruids, 1 Great Druid pro Region). Aufstieg erfordert Kampf gegen bestehende Druiden.

**App-Status:** Nicht implementiert (wahrscheinlich auch nicht nötig für die Chaos RPG-Gruppe, da Hausregel "keine Einschränkungen").

#### 6.8 Priester-XP-Tabelle (Unterschied Cleric vs. Druid)

**PHB Table 23:** Cleric und Druid haben VERSCHIEDENE XP-Tabellen:

- Cleric: 1.500 / 3.000 / 6.000 / 13.000 / 27.500 / 55.000 / 110.000 / 225.000 / 450.000...
- Druid: 2.000 / 4.000 / 7.500 / 12.500 / 20.000 / 35.000 / 60.000 / 90.000 / 125.000...

**App-Status:** Müsste in `src/lib/rules/experience.ts` überprüft werden, ob beide Tabellen korrekt sind.

#### 6.9 Saving Throw Besonderheit: Druid +2 vs. Feuer/Elektrizität

**PHB:** Druiden erhalten +2 auf alle Rettungswürfe gegen Feuer- oder Elektroangriffe.

**App-Status:** In `classAbilities` als Text erwähnt, aber unklar ob in der Saving-Throw-Mechanik tatsächlich angewendet.

#### 6.10 Gestaltwandel-UI (Druid L7+)

**PHB:** 3x/Tag in Reptil, Vogel, Säugetier verwandeln. Heilt 10-60%.

**App-Status:** Im Play Mode erwähnt aber keine dedizierten UI-Elemente oder Mechanik.

## Code References

- `src/lib/rules/classes.ts:400-479` — Cleric & Druid Class Definitions
- `src/lib/rules/magic.ts:56-109` — Sphere System (CLERIC_SPHERES, DRUID_SPHERES, getPriestSpheres, hasSphereAccess)
- `src/lib/rules/spellslots.ts:51-93` — Priest Spell Slot Progression Table
- `src/lib/rules/spellslots.ts:143-187` — Priest Spell Point System
- `src/lib/rules/spellslots.ts:278-327` — canLearnSpell() with sphere validation
- `src/lib/rules/spellslots.ts:329-392` — Ranger/Paladin priest spell access
- `src/lib/rules/kits.ts:518-570` — Fighting Priest + Pacifist Priest Kits
- `src/lib/rules/kits.ts:1024-1350` — 9 weitere Cleric Kits
- `src/lib/rules/kits.ts:2271-2621` — 11 Druid Kits
- `src/lib/rules/types.ts:96-112` — ClassId (nur cleric + druid als Priester)
- `src/lib/rules/types.ts:126-142` — PriestSphere (16 Sphären)
- `supabase/migrations/00002_core_rules_schema.sql` — DB Schema mit class_group + sphere
- `supabase/migrations/00003_seed_data.sql` — Cleric/Druid Seed Data
- `src/components/play-mode/play-spellbook-panel.tsx:70-123` — Priest spell UI logic
- `src/components/character-sheet/tab-spells.tsx` — Sphere filter for priests

## Architecture Documentation

### Aktuelle Architektur: Hardcoded Priest Classes

Die App verwendet einen **Enum-basierten Ansatz** für Priester-Klassen:

1. `ClassId` TypeScript Union Type definiert die erlaubten Klassen
2. `CLASSES` Objekt in `classes.ts` enthält alle Klassen-Definitionen
3. `getPriestSpheres()` verwendet einen `switch` auf ClassId
4. Jede neue Priester-Variante erfordert Änderungen an Types, Classes, Magic, und ggf. SpellSlots

### Vergleich mit Wizard-Architektur

Die Wizard-Spezialisierung ist eleganter gelöst:

- `SPECIALISTS[]` Array definiert pro Spezialist: School + Opposition Schools
- `getSpecialist(classId)` und `getOppositionSchools(classId)` sind generisch
- Neue Spezialisten erfordern nur einen Array-Eintrag

Für Priester fehlt ein äquivalentes System — z.B. ein `PRIESTHOODS[]` Array mit:

```typescript
interface PriesthoodDefinition {
  classId: ClassId;
  deity: string;
  spheres: SphereMap;
  grantedPowers: GrantedPower[];
  allowedWeapons: string[];
  allowedArmor: string[];
  turnUndead: boolean;
}
```

## Open Questions

1. **Scope-Frage:** Sollen die 60+ Sample Priesthoods aus dem Complete Priest's Handbook alle implementiert werden, oder reicht ein konfigurierbares System, in das der DM eigene Priesthoods eintragen kann?
2. **Turn Undead:** Soll die vollständige Mechanik implementiert werden (Tabelle + Würfel + UI im Play Mode), oder reicht ein vereinfachter Ansatz?
3. **Druid Branches:** Sind Arctic/Desert/Jungle/Mountain/Swamp Druids für die Chaos RPG-Gruppe relevant?
4. **Granted Powers:** Sollen diese als mechanische Effekte implementiert werden (wie Epic Items) oder als reine Text-Beschreibungen?
5. **XP-Tabellen:** Nutzen Cleric und Druid tatsächlich unterschiedliche XP-Tabellen in der aktuellen Implementierung?
6. **Druid Saving Throw Bonus:** Wird der +2 vs. Fire/Electricity aktuell in der Saving-Throw-Berechnung berücksichtigt?
7. **Fehlende Druid-Kits:** Sollen Adviser, Beastfriend und Wanderer noch ergänzt werden?
