/**
 * AD&D 2nd Edition — Player's Handbook Character Creation Rules Specification
 *
 * This file catalogs every character creation rule from the PHB with a unique ID.
 * Each rule maps to implementation files/functions and expected test scenarios.
 * The coverage meta-test (coverage.test.ts) verifies that every "implemented" rule
 * has corresponding tests, enabling 100% rule coverage verification.
 */

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export type RuleStatus = "implemented" | "partial" | "missing";

export interface RuleScenario {
  /** Short description of the test scenario */
  description: string;
  /** Optional example assertion, e.g. "getStrengthModifiers(18, 100).bendBars === 40" */
  example?: string;
}

export interface RuleEntry {
  /** Unique rule ID, e.g. "ABILITY-001" */
  id: string;
  /** PHB chapter reference */
  chapter: string;
  /** PHB page/table reference */
  phbReference: string;
  /** Human-readable rule description */
  description: string;
  /** Implementation status */
  status: RuleStatus;
  /** Source files that implement this rule (relative to src/lib/rules/) */
  implementationFiles: string[];
  /** Exported functions that implement this rule */
  implementationFunctions: string[];
  /** Test files that cover this rule (relative to src/lib/rules/) */
  testFiles: string[];
  /** Concrete test scenarios that should exist */
  scenarios: RuleScenario[];
  /** Edge cases, house rules, or other notes */
  notes?: string;
}

// ---------------------------------------------------------------------------
// Rule Catalog
// ---------------------------------------------------------------------------

export const CHARACTER_CREATION_RULES: readonly RuleEntry[] = [
  // =========================================================================
  // ABILITY SCORES (Chapter 1)
  // =========================================================================
  {
    id: "ABILITY-001",
    chapter: "ch1-abilities",
    phbReference: "Table 1: Strength",
    description:
      "STR-Modifikatoren für Werte 3-18: Hit Adj, Dmg Adj, Weight Allow, Max Press, Open Doors, Bend Bars",
    status: "implemented",
    implementationFiles: ["abilities.ts"],
    implementationFunctions: ["getStrengthModifiers"],
    testFiles: ["abilities.test.ts"],
    scenarios: [
      {
        description: "STR 3 gibt hitAdj -3, dmgAdj -1",
        example: "getStrengthModifiers(3).hitAdj === -3",
      },
      {
        description: "STR 10 gibt keine Modifikatoren",
        example: "getStrengthModifiers(10).hitAdj === 0",
      },
      {
        description: "STR 18 gibt hitAdj +1, dmgAdj +2",
        example: "getStrengthModifiers(18).hitAdj === 1",
      },
      { description: "Boundary: STR 1 wirft oder gibt Minimum-Werte" },
      { description: "Boundary: STR 18 ohne Exceptional ist nicht 18/01" },
    ],
  },
  {
    id: "ABILITY-002",
    chapter: "ch1-abilities",
    phbReference: "Table 1: Strength (Exceptional)",
    description: "Ausnahmestärke 18/01-18/00 für Krieger-Klassen: erweiterte STR-Modifikatoren",
    status: "implemented",
    implementationFiles: ["abilities.ts"],
    implementationFunctions: ["getStrengthModifiers"],
    testFiles: ["abilities.test.ts"],
    scenarios: [
      {
        description: "STR 18/01 gibt hitAdj +1, dmgAdj +3",
        example: "getStrengthModifiers(18, 1).dmgAdj === 3",
      },
      {
        description: "STR 18/50 (Range 01-50)",
        example: "getStrengthModifiers(18, 50).dmgAdj === 3",
      },
      {
        description: "STR 18/51 (Range 51-75)",
        example: "getStrengthModifiers(18, 51).dmgAdj === 3",
      },
      {
        description: "STR 18/76 (Range 76-90)",
        example: "getStrengthModifiers(18, 76).dmgAdj === 4",
      },
      {
        description: "STR 18/91 (Range 91-99)",
        example: "getStrengthModifiers(18, 91).dmgAdj === 5",
      },
      {
        description: "STR 18/00 (100) gibt bendBars 40%",
        example: "getStrengthModifiers(18, 100).bendBars === 40",
      },
    ],
  },
  {
    id: "ABILITY-003",
    chapter: "ch1-abilities",
    phbReference: "Table 2: Dexterity",
    description: "DEX-Modifikatoren: Reaction Adj, Missile Adj, Defensive Adj",
    status: "implemented",
    implementationFiles: ["abilities.ts"],
    implementationFunctions: ["getDexterityModifiers"],
    testFiles: ["abilities.test.ts"],
    scenarios: [
      {
        description: "DEX 3 gibt defensiveAdj +4 (schlechter)",
        example: "getDexterityModifiers(3).defensiveAdj === 4",
      },
      {
        description: "DEX 16 gibt defensiveAdj -2 (besser)",
        example: "getDexterityModifiers(16).defensiveAdj === -2",
      },
      {
        description: "DEX 18 gibt defensiveAdj -4",
        example: "getDexterityModifiers(18).defensiveAdj === -4",
      },
    ],
  },
  {
    id: "ABILITY-004",
    chapter: "ch1-abilities",
    phbReference: "Table 3: Constitution",
    description:
      "CON-Modifikatoren: HP Adj, System Shock, Resurrection Survival, Poison Save, Regeneration",
    status: "implemented",
    implementationFiles: ["abilities.ts"],
    implementationFunctions: ["getConstitutionModifiers"],
    testFiles: ["abilities.test.ts"],
    scenarios: [
      {
        description: "CON 3 gibt hpAdj -2, systemShock 35%",
        example: "getConstitutionModifiers(3).hpAdj === -2",
      },
      { description: "CON 16 gibt hpAdj +2", example: "getConstitutionModifiers(16).hpAdj === 2" },
      {
        description: "CON 18 gibt hpAdj +4 (nur Krieger bekommen +4)",
        example: "getConstitutionModifiers(18).hpAdj === 4",
      },
      { description: "Regeneration nur bei CON 20+ (oder null)" },
    ],
  },
  {
    id: "ABILITY-005",
    chapter: "ch1-abilities",
    phbReference: "Table 4: Intelligence",
    description:
      "INT-Modifikatoren: Number of Languages, Max Spell Level, Chance to Learn, Max Spells/Level, Spell Immunity",
    status: "implemented",
    implementationFiles: ["abilities.ts"],
    implementationFunctions: ["getIntelligenceModifiers"],
    testFiles: ["abilities.test.ts"],
    scenarios: [
      {
        description: "INT 9 gibt maxSpellLevel 4, chanceToLearn 35%",
        example: "getIntelligenceModifiers(9).spellLevel === 4",
      },
      {
        description: "INT 18 gibt maxSpellLevel 9, chanceToLearn 85%",
        example: "getIntelligenceModifiers(18).spellLevel === 9",
      },
      { description: "INT 3 gibt 0 Sprachen, null spellLevel" },
    ],
  },
  {
    id: "ABILITY-006",
    chapter: "ch1-abilities",
    phbReference: "Table 5: Wisdom",
    description: "WIS-Modifikatoren: Magical Defense Adj, Bonus Spells (Priester), Spell Failure %",
    status: "implemented",
    implementationFiles: ["abilities.ts"],
    implementationFunctions: ["getWisdomModifiers"],
    testFiles: ["abilities.test.ts"],
    scenarios: [
      {
        description: "WIS 13 gibt 1 Bonuszauber Stufe 1",
        example: "getWisdomModifiers(13).bonusSpells[0] === 1",
      },
      { description: "WIS 18 gibt Bonuszauber auf Stufen 1-4" },
      {
        description: "WIS 3 gibt spellFailure 100%",
        example: "getWisdomModifiers(3).spellFailure === 100",
      },
    ],
  },
  {
    id: "ABILITY-007",
    chapter: "ch1-abilities",
    phbReference: "Table 6: Charisma",
    description: "CHA-Modifikatoren: Max Henchmen, Loyalty Base, Reaction Adj",
    status: "implemented",
    implementationFiles: ["abilities.ts"],
    implementationFunctions: ["getCharismaModifiers"],
    testFiles: ["abilities.test.ts"],
    scenarios: [
      {
        description: "CHA 3 gibt maxHenchmen 1, reactionAdj -5",
        example: "getCharismaModifiers(3).maxHenchmen === 1",
      },
      {
        description: "CHA 18 gibt maxHenchmen 15, reactionAdj +7",
        example: "getCharismaModifiers(18).reactionAdj === 7",
      },
    ],
  },
  {
    id: "ABILITY-008",
    chapter: "ch1-abilities",
    phbReference: "Chapter 1: Strength (Exceptional)",
    description:
      "Ausnahmestärke ist nur für Klassen der Krieger-Gruppe verfügbar (Fighter, Ranger, Paladin)",
    status: "implemented",
    implementationFiles: ["classes.ts"],
    implementationFunctions: ["getClass"],
    testFiles: ["classes.test.ts"],
    scenarios: [
      { description: "Fighter hat exceptionalStrength: true" },
      { description: "Ranger hat exceptionalStrength: true" },
      { description: "Paladin hat exceptionalStrength: true" },
      { description: "Mage hat exceptionalStrength: false" },
      { description: "Thief hat exceptionalStrength: false" },
    ],
  },
  {
    id: "ABILITY-009",
    chapter: "ch1-abilities",
    phbReference: "Chapter 1: Method I",
    description: "Würfelmethode I: 3d6 in Reihenfolge für STR, DEX, CON, INT, WIS, CHA",
    status: "implemented",
    implementationFiles: ["abilities.ts"],
    implementationFunctions: ["rollAbilityScoresMethodI"],
    testFiles: ["abilities.test.ts"],
    scenarios: [
      { description: "Erzeugt 6 Werte zwischen 3-18" },
      { description: "Jeder Wert ist Summe von 3 Würfeln (d6)" },
    ],
  },
  {
    id: "ABILITY-010",
    chapter: "ch1-abilities",
    phbReference: "Chapter 1: Method II",
    description: "Würfelmethode II: 3d6 zweimal pro Attribut, bestes Ergebnis wählen",
    status: "implemented",
    implementationFiles: ["abilities.ts"],
    implementationFunctions: ["rollAbilityScoresMethodII"],
    testFiles: ["abilities.test.ts"],
    scenarios: [{ description: "Pro Attribut 2 Rolls, höherer wird genommen" }],
  },
  {
    id: "ABILITY-011",
    chapter: "ch1-abilities",
    phbReference: "Chapter 1: Method III",
    description: "Würfelmethode III: 3d6 sechsmal, Spieler ordnet frei zu",
    status: "implemented",
    implementationFiles: ["abilities.ts"],
    implementationFunctions: ["rollAbilityScoresMethodIII"],
    testFiles: ["abilities.test.ts"],
    scenarios: [{ description: "6 Rolls erzeugen, Spieler ordnet zu" }],
  },
  {
    id: "ABILITY-012",
    chapter: "ch1-abilities",
    phbReference: "Chapter 1: Method IV",
    description: "Würfelmethode IV: 3d6 zwölfmal, beste 6 wählen und frei zuordnen",
    status: "implemented",
    implementationFiles: ["abilities.ts"],
    implementationFunctions: ["rollAbilityScoresMethodIV"],
    testFiles: ["abilities.test.ts"],
    scenarios: [{ description: "12 Rolls, beste 6 auswählen" }],
  },
  {
    id: "ABILITY-013",
    chapter: "ch1-abilities",
    phbReference: "Chapter 1: Method V",
    description: "Würfelmethode V: 4d6 drop lowest, sechsmal, frei zuordnen",
    status: "implemented",
    implementationFiles: ["abilities.ts"],
    implementationFunctions: ["rollAbilityScoresMethodV"],
    testFiles: ["abilities.test.ts"],
    scenarios: [
      { description: "4d6 minus niedrigster Würfel, Range 3-18" },
      { description: "Statistisch höhere Werte als Method I" },
    ],
  },
  {
    id: "ABILITY-014",
    chapter: "ch1-abilities",
    phbReference: "Table 4: Intelligence — Number of Languages",
    description: "Anzahl erlernbarer Sprachen basierend auf INT-Wert",
    status: "implemented",
    implementationFiles: ["abilities.ts"],
    implementationFunctions: ["getIntelligenceModifiers", "getTotalLanguageSlots"],
    testFiles: ["abilities.test.ts"],
    scenarios: [
      { description: "INT 3 gibt 0 zusätzliche Sprachen" },
      { description: "INT 12 gibt 3 zusätzliche Sprachen" },
      { description: "INT 18 gibt 7 zusätzliche Sprachen" },
    ],
  },

  // =========================================================================
  // RACES (Chapter 2)
  // =========================================================================
  {
    id: "RACE-001",
    chapter: "ch2-races",
    phbReference: "Chapter 2: Player Character Races",
    description: "7 spielbare Rassen: Human, Elf, Half-Elf, Dwarf, Gnome, Halfling, Half-Orc",
    status: "implemented",
    implementationFiles: ["races.ts"],
    implementationFunctions: ["getRace", "getAllRaces"],
    testFiles: ["races.test.ts"],
    scenarios: [
      { description: "getAllRaces() gibt exakt 7 Rassen zurück" },
      { description: "Jede Rasse hat id, name, name_en" },
    ],
  },
  {
    id: "RACE-002",
    chapter: "ch2-races",
    phbReference: "Chapter 2: Ability Score Adjustments",
    description: "Rassen-spezifische Attributs-Anpassungen (z.B. Elf: +1 DEX, -1 CON)",
    status: "implemented",
    implementationFiles: ["races.ts"],
    implementationFunctions: ["getRace"],
    testFiles: ["races.test.ts"],
    scenarios: [
      { description: "Elf: DEX +1, CON -1" },
      { description: "Dwarf: CON +1, CHA -1" },
      { description: "Halfling: DEX +1, STR -1" },
      { description: "Half-Orc: STR +1, CON +1, CHA -2" },
      { description: "Human: keine Anpassungen" },
    ],
  },
  {
    id: "RACE-003",
    chapter: "ch2-races",
    phbReference: "Chapter 2: Ability Score Minimums",
    description: "Mindest-Attributwerte pro Rasse (z.B. Dwarf min CON 11)",
    status: "implemented",
    implementationFiles: ["races.ts"],
    implementationFunctions: ["getRace"],
    testFiles: ["races.test.ts"],
    scenarios: [
      { description: "Elf hat min DEX 6, INT 8, CON 7, CHA 8" },
      { description: "Dwarf hat min STR 8, CON 11" },
      { description: "Human hat keine Minima" },
    ],
  },
  {
    id: "RACE-004",
    chapter: "ch2-races",
    phbReference: "Chapter 2: Ability Score Maximums",
    description: "Maximal-Attributwerte pro Rasse (z.B. Halfling max STR 17)",
    status: "implemented",
    implementationFiles: ["races.ts"],
    implementationFunctions: ["getRace"],
    testFiles: ["races.test.ts"],
    scenarios: [
      { description: "Halfling hat max STR 17" },
      { description: "Elf hat max CON 17" },
      { description: "Human hat keine Maxima (alle 18)" },
    ],
  },
  {
    id: "RACE-005",
    chapter: "ch2-races",
    phbReference: "Table 7: Racial Class Limitations",
    description: "Erlaubte Klassen pro Rasse (z.B. Halfling: Fighter, Thief, Cleric)",
    status: "implemented",
    implementationFiles: ["races.ts"],
    implementationFunctions: ["canPlayClass"],
    testFiles: ["races.test.ts"],
    scenarios: [
      { description: "Human darf alle 16 Klassen spielen" },
      { description: "Halfling darf kein Mage spielen" },
      { description: "Dwarf darf kein Druid spielen" },
    ],
    notes: "Hausregel: Warnung statt Blockierung bei nicht-standardkonformen Kombinationen",
  },
  {
    id: "RACE-006",
    chapter: "ch2-races",
    phbReference: "Table 8: Racial Level Limits",
    description: "Level-Caps pro Rasse/Klasse-Kombination (z.B. Elf Fighter max Level 12)",
    status: "implemented",
    implementationFiles: ["races.ts"],
    implementationFunctions: ["getLevelLimit"],
    testFiles: ["races.test.ts"],
    scenarios: [
      { description: "Human hat kein Level-Limit (null)" },
      { description: "Elf Fighter hat Limit 12" },
      { description: "Dwarf Thief hat kein Limit (unlimited für Dwarves)" },
    ],
  },
  {
    id: "RACE-007",
    chapter: "ch2-races",
    phbReference: "Chapter 2: Multiclass Combinations",
    description:
      "Erlaubte Multiclass-Kombinationen pro Rasse (z.B. Elf: Fighter/Mage, Fighter/Thief, etc.)",
    status: "implemented",
    implementationFiles: ["races.ts"],
    implementationFunctions: ["getRace"],
    testFiles: ["races.test.ts", "multiclass.test.ts"],
    scenarios: [
      { description: "Elf hat 4 Multiclass-Optionen" },
      { description: "Half-Elf hat 8 Multiclass-Optionen" },
      { description: "Human hat keine Multiclass-Optionen" },
      { description: "Halfling hat 1 Multiclass-Option (Fighter/Thief)" },
    ],
    notes: "Hausregel: Alle Rassen duerfen Multiclass ohne Blockierung, nur Warnungen",
  },
  {
    id: "RACE-008",
    chapter: "ch2-races",
    phbReference: "Chapter 2: Infravision",
    description: "Infrarot-Sicht nach Rasse (z.B. Elf 60 ft, Human 0 ft)",
    status: "implemented",
    implementationFiles: ["races.ts"],
    implementationFunctions: ["getRace"],
    testFiles: ["races.test.ts"],
    scenarios: [
      { description: "Human hat 0 ft Infravision" },
      { description: "Elf hat 60 ft Infravision" },
      { description: "Dwarf hat 60 ft Infravision" },
      { description: "Half-Elf hat 30 ft Infravision" },
    ],
  },
  {
    id: "RACE-009",
    chapter: "ch2-races",
    phbReference: "Chapter 2: Movement Rate",
    description: "Basis-Bewegungsrate nach Rasse (z.B. Human 12, Dwarf 6)",
    status: "implemented",
    implementationFiles: ["races.ts"],
    implementationFunctions: ["getRace"],
    testFiles: ["races.test.ts"],
    scenarios: [
      { description: "Human hat Bewegungsrate 12" },
      { description: "Dwarf hat Bewegungsrate 6" },
      { description: "Elf hat Bewegungsrate 12" },
      { description: "Halfling hat Bewegungsrate 6" },
    ],
  },
  {
    id: "RACE-010",
    chapter: "ch2-races",
    phbReference: "Chapter 2: Languages",
    description: "Standard-Sprachen pro Rasse (z.B. Elf: Common, Elvish)",
    status: "implemented",
    implementationFiles: ["races.ts"],
    implementationFunctions: ["getRace"],
    testFiles: ["races.test.ts"],
    scenarios: [
      { description: "Human hat Common als Standardsprache" },
      { description: "Elf hat Common und Elvish" },
      { description: "Dwarf hat Common und Dwarvish" },
    ],
  },
  {
    id: "RACE-011",
    chapter: "ch2-races",
    phbReference: "Chapter 2: Racial Abilities",
    description:
      "Rassen-spezifische Fähigkeiten (z.B. Elf: Detect Secret Doors, Dwarf: Mining Detection)",
    status: "implemented",
    implementationFiles: ["races.ts"],
    implementationFunctions: ["getRace"],
    testFiles: ["races.test.ts"],
    scenarios: [
      { description: "Elf hat Detect Secret Doors Ability" },
      { description: "Dwarf hat Mining Detection Abilities" },
      { description: "Alle Abilities haben name + name_en + description + description_en" },
    ],
  },
  {
    id: "RACE-012",
    chapter: "ch2-races",
    phbReference: "Table 10: Average Height and Weight",
    description: "Startalter-Tabelle nach Rasse und Klasse",
    status: "implemented",
    implementationFiles: ["races.ts"],
    implementationFunctions: ["getStartingAge"],
    testFiles: ["races.test.ts"],
    scenarios: [
      { description: "Human Fighter startet mit 15+1d4 Jahren" },
      { description: "Elf Mage startet mit 150+5d6 Jahren" },
    ],
  },
  {
    id: "RACE-013",
    chapter: "ch2-races",
    phbReference: "Table 10: Average Height and Weight",
    description: "Größen-Tabelle nach Rasse und Geschlecht (Base + Modifier)",
    status: "implemented",
    implementationFiles: ["races.ts"],
    implementationFunctions: ["getHeightRange"],
    testFiles: ["races.test.ts"],
    scenarios: [
      { description: "Human Male: 60 + 2d10 inches" },
      { description: "Elf Female: 55 + 1d10 inches" },
      { description: "Dwarf Male: 43 + 1d10 inches" },
    ],
  },
  {
    id: "RACE-014",
    chapter: "ch2-races",
    phbReference: "Table 10: Average Height and Weight",
    description: "Gewichts-Tabelle nach Rasse und Geschlecht (Base + Modifier)",
    status: "implemented",
    implementationFiles: ["races.ts"],
    implementationFunctions: ["getWeightRange"],
    testFiles: ["races.test.ts"],
    scenarios: [
      { description: "Human Male: 140 + 6d10 lbs" },
      { description: "Halfling Female: 50 + 5d4 lbs" },
    ],
  },
  {
    id: "RACE-015",
    chapter: "ch2-races",
    phbReference: "Chapter 2: Racial Saving Throw Bonuses",
    description: "Zwerge/Gnome: +1 Rettungswurf pro 3.5 CON-Punkte vs Gift/Magie/Stäbe/Zauberstäbe",
    status: "implemented",
    implementationFiles: ["races.ts"],
    implementationFunctions: ["getRacialSavingThrowBonus"],
    testFiles: ["races.test.ts"],
    scenarios: [
      { description: "Dwarf CON 14 gibt +4 vs Gift/Magie" },
      { description: "Gnome CON 10 gibt +3 vs Gift/Magie" },
      { description: "Elf bekommt keinen Bonus" },
    ],
  },

  // =========================================================================
  // CLASSES (Chapter 3)
  // =========================================================================
  {
    id: "CLASS-001",
    chapter: "ch3-classes",
    phbReference: "Chapters 3: Warrior, Wizard, Priest, Rogue",
    description: "16 Klassen-Definitionen mit ID, Name, Gruppe, Trefferwürfel, Fähigkeiten",
    status: "implemented",
    implementationFiles: ["classes.ts"],
    implementationFunctions: ["getClass", "getAllClasses"],
    testFiles: ["classes.test.ts"],
    scenarios: [
      { description: "getAllClasses() gibt 16 Klassen zurück" },
      { description: "3 Krieger: Fighter, Ranger, Paladin" },
      { description: "8 Magier: Mage + 7 Spezialisten" },
      { description: "2 Priester: Cleric, Druid" },
      { description: "2 Schurken: Thief, Bard" },
    ],
  },
  {
    id: "CLASS-002",
    chapter: "ch3-classes",
    phbReference: "Table 9: Class Ability Requirements",
    description: "Mindest-Attributwerte pro Klasse (z.B. Paladin: STR 12, CON 9, WIS 13, CHA 17)",
    status: "implemented",
    implementationFiles: ["classes.ts"],
    implementationFunctions: ["meetsAbilityRequirements"],
    testFiles: ["classes.test.ts"],
    scenarios: [
      { description: "Fighter braucht nur STR 9" },
      { description: "Paladin braucht STR 12, CON 9, WIS 13, CHA 17" },
      { description: "Ranger braucht STR 13, DEX 13, CON 14, WIS 14" },
      { description: "Bard braucht DEX 12, INT 13, CHA 15" },
      { description: "Charakter mit zu niedrigen Werten erfüllt Requirements nicht" },
    ],
  },
  {
    id: "CLASS-003",
    chapter: "ch3-classes",
    phbReference: "Chapters 3: Hit Die by Class",
    description: "Trefferwürfel pro Klasse: Krieger d10, Priester d8, Schurken d6, Magier d4",
    status: "implemented",
    implementationFiles: ["classes.ts"],
    implementationFunctions: ["getClass"],
    testFiles: ["classes.test.ts"],
    scenarios: [
      { description: "Fighter/Ranger/Paladin haben d10" },
      { description: "Cleric/Druid haben d8" },
      { description: "Thief/Bard haben d6" },
      { description: "Mage und alle Spezialisten haben d4" },
    ],
  },
  {
    id: "CLASS-004",
    chapter: "ch3-classes",
    phbReference: "Chapter 3: Class Groups",
    description: "Klassengruppen-Zuordnung: Warrior, Wizard, Priest, Rogue",
    status: "implemented",
    implementationFiles: ["classes.ts"],
    implementationFunctions: ["getClassGroup"],
    testFiles: ["classes.test.ts"],
    scenarios: [
      { description: "Fighter/Ranger/Paladin → warrior" },
      { description: "Mage und alle Spezialisten → wizard" },
      { description: "Cleric/Druid → priest" },
      { description: "Thief/Bard → rogue" },
    ],
  },
  {
    id: "CLASS-005",
    chapter: "ch3-classes",
    phbReference: "Chapter 3: Prime Requisites",
    description: "Prime Requisites für XP-Bonus (z.B. Fighter: STR, Mage: INT)",
    status: "implemented",
    implementationFiles: ["classes.ts"],
    implementationFunctions: ["getClass"],
    testFiles: ["classes.test.ts"],
    scenarios: [
      { description: "Fighter Prime Requisite: STR" },
      { description: "Mage Prime Requisite: INT" },
      { description: "Bard Prime Requisites: DEX, CHA" },
    ],
  },
  {
    id: "CLASS-006",
    chapter: "ch3-classes",
    phbReference: "Chapters 3: Class Abilities",
    description: "Klassen-Fähigkeiten mit deutschen und englischen Beschreibungen",
    status: "implemented",
    implementationFiles: ["classes.ts"],
    implementationFunctions: ["getClass"],
    testFiles: ["classes.test.ts"],
    scenarios: [
      { description: "Jede Klasse hat mindestens 1 Ability" },
      { description: "Abilities haben name, name_en, description, description_en" },
      { description: "Paladin hat Lay on Hands, Detect Evil, etc." },
    ],
  },
  {
    id: "CLASS-007",
    chapter: "ch3-classes",
    phbReference: "Chapter 3: Ranger — Spellcasting",
    description: "Waldläufer: Druid-Zauber ab Stufe 8, Wizard-Zauber ab Stufe 9",
    status: "implemented",
    implementationFiles: ["spellslots.ts"],
    implementationFunctions: ["getRangerSpellSlots"],
    testFiles: ["spellslots.test.ts"],
    scenarios: [
      { description: "Ranger L7 hat keine Zauber" },
      { description: "Ranger L8 hat 1 Druid-Zauber Stufe 1" },
      { description: "Ranger L9 hat 1 Wizard-Zauber Stufe 1" },
      { description: "Ranger L16 hat Druid-Zauber bis Stufe 3, Wizard bis Stufe 2" },
    ],
  },
  {
    id: "CLASS-008",
    chapter: "ch3-classes",
    phbReference: "Chapter 3: Paladin — Spellcasting",
    description: "Paladin: Priester-Zauber ab Stufe 9",
    status: "implemented",
    implementationFiles: ["spellslots.ts"],
    implementationFunctions: ["getPaladinSpellSlots"],
    testFiles: ["spellslots.test.ts"],
    scenarios: [
      { description: "Paladin L8 hat keine Zauber" },
      { description: "Paladin L9 hat 1 Priester-Zauber Stufe 1" },
      { description: "Paladin L20 hat Zauber bis Stufe 4" },
    ],
  },
  {
    id: "CLASS-009",
    chapter: "ch3-classes",
    phbReference: "Chapter 3: Bard — Spellcasting",
    description: "Barde: Wizard-Zauber ab Stufe 2, eigene Slot-Tabelle",
    status: "implemented",
    implementationFiles: ["spellslots.ts"],
    implementationFunctions: ["getBardSpellSlots"],
    testFiles: ["spellslots.test.ts"],
    scenarios: [
      { description: "Bard L1 hat keine Zauber" },
      { description: "Bard L2 hat 1 Wizard-Zauber Stufe 1" },
      { description: "Bard Slot-Progression unterscheidet sich von Mage" },
    ],
  },
  {
    id: "CLASS-010",
    chapter: "ch3-classes",
    phbReference: "Chapter 3: Hit Points at 1st Level",
    description: "TP-Berechnung auf Stufe 1: Trefferwürfel-Maximum + CON-Modifikator",
    status: "implemented",
    implementationFiles: ["hitpoints.ts"],
    implementationFunctions: ["calculateHitPointsLevel1"],
    testFiles: ["hitpoints.test.ts"],
    scenarios: [
      { description: "Fighter mit CON 16: 10 + 2 = 12 HP" },
      { description: "Mage mit CON 10: 4 + 0 = 4 HP" },
      { description: "Minimum 1 HP auch bei negativem CON-Mod" },
    ],
  },
  {
    id: "CLASS-011",
    chapter: "ch3-classes",
    phbReference: "Chapter 3: Hit Points Beyond 1st Level",
    description:
      "TP-Gewinn ab Stufe 2: CON-Bonus-Cap +2 für Nicht-Krieger, nur Krieger bekommen +3/+4",
    status: "implemented",
    implementationFiles: ["hitpoints.ts"],
    implementationFunctions: ["getConBonusCap"],
    testFiles: ["hitpoints.test.ts"],
    scenarios: [
      { description: "Krieger CON 18: +4 HP pro Level" },
      { description: "Priester CON 18: nur +2 HP pro Level (Cap)" },
      { description: "Magier CON 18: nur +2 HP pro Level (Cap)" },
      { description: "Nach Level 9 nur noch feste HP (kein CON-Bonus)" },
    ],
  },
  {
    id: "CLASS-012",
    chapter: "ch3-classes",
    phbReference: "Chapter 3: Dual-Class Benefits",
    description:
      "Dual-Class Regeln: Voraussetzungen, Original-Klasse muss ≥15 in Prime Req der neuen Klasse",
    status: "implemented",
    implementationFiles: ["multiclass.ts", "types.ts"],
    implementationFunctions: ["meetsDualclassRequirements", "isDualclassDormant"],
    testFiles: ["multiclass.test.ts"],
    scenarios: [
      { description: "Fighter→Mage braucht STR 15+ und INT 17+" },
      { description: "Original-Klasse Level-Fähigkeiten ruhen bis neue Klasse höher" },
    ],
    notes: "Hausregel: Dualclass für alle Rassen, nicht nur Menschen.",
  },
  {
    id: "CLASS-013",
    chapter: "ch3-classes",
    phbReference: "Chapter 3: Dual-Class Restrictions",
    description:
      "Dual-Class Einschränkungen während der Transition: keine Fähigkeiten der alten Klasse",
    status: "implemented",
    implementationFiles: ["multiclass.ts"],
    implementationFunctions: ["isDualclassDormant", "getDualclassThac0", "getDualclassSaves"],
    testFiles: ["multiclass.test.ts"],
    scenarios: [
      { description: "Alte Klasse-Fähigkeiten ruhen während Transition" },
      { description: "XP wird nur für neue Klasse gezählt" },
      { description: "Wenn neue Klasse höheres Level erreicht: alte Fähigkeiten kommen zurück" },
    ],
    notes: "Hausregel: Dualclass für alle Rassen, nicht nur Menschen.",
  },

  // =========================================================================
  // ALIGNMENT (Chapter 4)
  // =========================================================================
  {
    id: "ALIGN-001",
    chapter: "ch4-alignment",
    phbReference: "Chapter 4: Alignment",
    description: "9 Gesinnungen: LG, LN, LE, NG, TN, NE, CG, CN, CE",
    status: "implemented",
    implementationFiles: ["alignment.ts"],
    implementationFunctions: ["getAlignmentLabel"],
    testFiles: ["alignment.test.ts"],
    scenarios: [
      { description: "Alle 9 Alignments haben Labels" },
      { description: "Labels sind auf Deutsch" },
    ],
  },
  {
    id: "ALIGN-002",
    chapter: "ch4-alignment",
    phbReference: "Chapter 4: Class Alignment Restrictions",
    description: "Gesinnungs-Restriktionen pro Klasse",
    status: "implemented",
    implementationFiles: ["alignment.ts"],
    implementationFunctions: ["getAllowedAlignments"],
    testFiles: ["alignment.test.ts"],
    scenarios: [
      { description: "Fighter darf alle 9 Gesinnungen haben" },
      { description: "Paladin nur Lawful Good" },
      { description: "Ranger nur Good-Gesinnungen (LG, NG, CG)" },
      { description: "Druid nur True Neutral" },
      { description: "Bard nicht Lawful (6 Gesinnungen)" },
    ],
  },
  {
    id: "ALIGN-003",
    chapter: "ch4-alignment",
    phbReference: "Chapter 3: Paladin",
    description: "Paladin muss Lawful Good sein",
    status: "implemented",
    implementationFiles: ["alignment.ts"],
    implementationFunctions: ["getAllowedAlignments"],
    testFiles: ["alignment.test.ts"],
    scenarios: [{ description: "getAllowedAlignments('paladin') === ['lawful_good']" }],
  },
  {
    id: "ALIGN-004",
    chapter: "ch4-alignment",
    phbReference: "Chapter 3: Ranger",
    description: "Waldläufer muss Good sein",
    status: "implemented",
    implementationFiles: ["alignment.ts"],
    implementationFunctions: ["getAllowedAlignments"],
    testFiles: ["alignment.test.ts"],
    scenarios: [{ description: "getAllowedAlignments('ranger') enthält nur good-Alignments" }],
  },
  {
    id: "ALIGN-005",
    chapter: "ch4-alignment",
    phbReference: "Chapter 3: Druid",
    description: "Druide muss True Neutral sein",
    status: "implemented",
    implementationFiles: ["alignment.ts"],
    implementationFunctions: ["getAllowedAlignments"],
    testFiles: ["alignment.test.ts"],
    scenarios: [{ description: "getAllowedAlignments('druid') === ['true_neutral']" }],
  },
  {
    id: "ALIGN-006",
    chapter: "ch4-alignment",
    phbReference: "Chapter 3: Bard",
    description: "Barde darf nicht Lawful sein",
    status: "implemented",
    implementationFiles: ["alignment.ts"],
    implementationFunctions: ["getAllowedAlignments"],
    testFiles: ["alignment.test.ts"],
    scenarios: [{ description: "getAllowedAlignments('bard') enthält kein lawful_*" }],
  },

  // =========================================================================
  // PROFICIENCIES (Chapter 5)
  // =========================================================================
  {
    id: "PROF-001",
    chapter: "ch5-proficiencies",
    phbReference: "Table 34: Proficiency Slots",
    description:
      "Waffenfertigkeits-Slots: Warriors 4 + floor((L-1)/3), Priests/Rogues 2 + floor((L-1)/4), Wizards 1 + floor((L-1)/6)",
    status: "implemented",
    implementationFiles: ["proficiencies.ts"],
    implementationFunctions: ["getWeaponProficiencySlots"],
    testFiles: ["proficiencies.test.ts"],
    scenarios: [
      {
        description: "Warrior L1: 4 Slots",
        example: "getWeaponProficiencySlots('warrior', 1) === 4",
      },
      { description: "Warrior L4: 5 Slots" },
      { description: "Priest L1: 2 Slots" },
      { description: "Wizard L1: 1 Slot" },
    ],
  },
  {
    id: "PROF-002",
    chapter: "ch5-proficiencies",
    phbReference: "Table 34: Proficiency Slots",
    description:
      "Allgemeine Fertigkeits-Slots: Priests/Wizards 4 base, Others 3 base, + floor((L-1)/3)",
    status: "implemented",
    implementationFiles: ["proficiencies.ts"],
    implementationFunctions: ["getNonweaponProficiencySlots"],
    testFiles: ["proficiencies.test.ts"],
    scenarios: [
      { description: "Warrior L1: 3 Slots" },
      { description: "Priest L1: 4 Slots" },
      { description: "Wizard L1: 4 Slots" },
      { description: "Rogue L4: 4 Slots" },
    ],
  },
  {
    id: "PROF-003",
    chapter: "ch5-proficiencies",
    phbReference: "Table 34: Non-Proficiency Penalty",
    description: "Abzug bei Nutzung unbekannter Waffen: Warriors -2, Priests/Rogues -3, Wizards -5",
    status: "implemented",
    implementationFiles: ["proficiencies.ts"],
    implementationFunctions: ["getNonproficiencyPenalty"],
    testFiles: ["proficiencies.test.ts"],
    scenarios: [
      { description: "Warrior: -2", example: "getNonproficiencyPenalty('warrior') === -2" },
      { description: "Wizard: -5", example: "getNonproficiencyPenalty('wizard') === -5" },
    ],
  },
  {
    id: "PROF-004",
    chapter: "ch5-proficiencies",
    phbReference: "Chapter 5: Weapon Specialization",
    description:
      "Nur Fighter dürfen sich auf eine Waffe spezialisieren (nicht Ranger, nicht Paladin)",
    status: "implemented",
    implementationFiles: ["proficiencies.ts"],
    implementationFunctions: ["canSpecialize"],
    testFiles: ["proficiencies.test.ts"],
    scenarios: [
      { description: "Fighter: canSpecialize true" },
      { description: "Ranger: canSpecialize false" },
      { description: "Paladin: canSpecialize false" },
      { description: "Thief: canSpecialize false" },
    ],
  },
  {
    id: "PROF-005",
    chapter: "ch5-proficiencies",
    phbReference: "Chapter 9: Weapon Speed Factor",
    description: "Waffengeschwindigkeit beeinflusst Initiative-Berechnung",
    status: "implemented",
    implementationFiles: ["proficiencies.ts"],
    implementationFunctions: ["getWeaponSpeedFactor"],
    testFiles: ["proficiencies.test.ts"],
    scenarios: [
      { description: "Dolch hat Speed Factor 2" },
      { description: "Zweihandschwert hat Speed Factor 10" },
    ],
  },

  // =========================================================================
  // EQUIPMENT (Chapter 6)
  // =========================================================================
  {
    id: "EQUIP-001",
    chapter: "ch6-equipment",
    phbReference: "Chapter 6: Armor Class",
    description: "RK-Berechnung: Basis-RK der Rüstung + Schild (-1) + DEX-Defensive-Adj",
    status: "implemented",
    implementationFiles: ["equipment.ts"],
    implementationFunctions: ["calculateAC"],
    testFiles: ["equipment.test.ts"],
    scenarios: [
      { description: "Keine Rüstung: AC 10", example: "calculateAC(null, false, 0) === 10" },
      { description: "Chain Mail (AC 5) + Schild: AC 4" },
      { description: "Plate Mail (AC 3) + DEX 18 (-4): AC -1" },
    ],
  },
  {
    id: "EQUIP-002",
    chapter: "ch6-equipment",
    phbReference: "Table 47: Encumbrance",
    description: "Belastungs-Berechnung: 5 Stufen basierend auf Gewicht vs STR-Tragfähigkeit",
    status: "implemented",
    implementationFiles: ["equipment.ts"],
    implementationFunctions: ["calculateEncumbrance"],
    testFiles: ["equipment.test.ts"],
    scenarios: [
      { description: "0-33% Tragfähigkeit: unencumbered" },
      { description: "33-50%: light" },
      { description: "50-66%: moderate" },
      { description: "66-100%: heavy" },
      { description: ">100%: severe" },
    ],
  },
  {
    id: "EQUIP-003",
    chapter: "ch6-equipment",
    phbReference: "Table 47: Movement Rate by Encumbrance",
    description:
      "Bewegungsrate-Reduktion: Unencumbered 100%, Light 75%, Moderate 50%, Heavy 33%, Severe min 1",
    status: "implemented",
    implementationFiles: ["equipment.ts"],
    implementationFunctions: ["getMovementRate"],
    testFiles: ["equipment.test.ts"],
    scenarios: [
      { description: "Base 12 + unencumbered = 12" },
      { description: "Base 12 + heavy = 4" },
      { description: "Base 6 + severe = 1" },
    ],
  },
  {
    id: "EQUIP-004",
    chapter: "ch6-equipment",
    phbReference: "Table 44: Starting Money",
    description: "Startgold nach Klasse (z.B. Fighter: 5d4×10 gp, Mage: 1d4+1×10 gp)",
    status: "implemented",
    implementationFiles: ["equipment.ts"],
    implementationFunctions: ["getStartingGold"],
    testFiles: ["equipment.test.ts"],
    scenarios: [
      { description: "Fighter: 5d4×10 = 50-200 gp" },
      { description: "Mage: (1d4+1)×10 = 20-50 gp" },
      { description: "Thief: 2d6×10 = 20-120 gp" },
      { description: "Cleric: 3d6×10 = 30-180 gp" },
    ],
  },

  // =========================================================================
  // MAGIC (Chapter 7)
  // =========================================================================
  {
    id: "MAGIC-001",
    chapter: "ch7-magic",
    phbReference: "Table 22: Specialist Wizards",
    description: "8 Magier-Spezialisten mit zugehöriger Schule",
    status: "implemented",
    implementationFiles: ["magic.ts"],
    implementationFunctions: ["getSpecialist"],
    testFiles: ["magic.test.ts"],
    scenarios: [
      { description: "Abjurer spezialisiert auf Abjuration" },
      { description: "Illusionist spezialisiert auf Illusion" },
      { description: "Mage (Generalist) gibt null zurück" },
    ],
  },
  {
    id: "MAGIC-002",
    chapter: "ch7-magic",
    phbReference: "Table 22: Opposition Schools",
    description:
      "Oppositions-Schulen pro Spezialist (z.B. Illusionist: Necromancy, Invocation, Abjuration)",
    status: "implemented",
    implementationFiles: ["magic.ts"],
    implementationFunctions: ["getOppositionSchools"],
    testFiles: ["magic.test.ts"],
    scenarios: [
      { description: "Illusionist hat 3 Oppositionsschulen" },
      { description: "Diviner hat nur 1 Oppositionsschule (Conjuration)" },
      { description: "Mage hat keine Oppositionsschulen" },
    ],
  },
  {
    id: "MAGIC-003",
    chapter: "ch7-magic",
    phbReference: "Chapter 3: Cleric — Spheres of Access",
    description:
      "Kleriker-Sphären: 12 Major (All, Astral, Charm, Combat, etc.), 2 Minor (Elemental, Weather)",
    status: "implemented",
    implementationFiles: ["magic.ts"],
    implementationFunctions: ["getPriestSpheres", "hasSphereAccess"],
    testFiles: ["magic.test.ts"],
    scenarios: [
      { description: "Cleric hat Major Zugang zu Healing" },
      { description: "Cleric hat Minor Zugang zu Elemental" },
      { description: "Cleric hat keinen Zugang zu Animal oder Plant" },
    ],
  },
  {
    id: "MAGIC-004",
    chapter: "ch7-magic",
    phbReference: "Chapter 3: Druid — Spheres of Access",
    description:
      "Druiden-Sphären: 6 Major (All, Animal, Elemental, Healing, Plant, Weather), 1 Minor (Divination)",
    status: "implemented",
    implementationFiles: ["magic.ts"],
    implementationFunctions: ["getPriestSpheres", "hasSphereAccess"],
    testFiles: ["magic.test.ts"],
    scenarios: [
      { description: "Druid hat Major Zugang zu Animal und Plant" },
      { description: "Druid hat Minor Zugang zu Divination" },
      { description: "Druid hat keinen Zugang zu Necromantic oder Sun" },
    ],
  },
  {
    id: "MAGIC-005",
    chapter: "ch7-magic",
    phbReference: "Chapter 7: Learning Spells",
    description: "Zauber-Lern-Validierung: Opposition Schools, Sphere Access, INT-Cap",
    status: "implemented",
    implementationFiles: ["spellslots.ts"],
    implementationFunctions: ["canLearnSpell"],
    testFiles: ["spellslots.test.ts"],
    scenarios: [
      { description: "Mage darf Zauber jeder Schule lernen" },
      { description: "Illusionist darf keine Necromancy-Zauber lernen" },
      { description: "Cleric darf nur Zauber aus zugänglichen Sphären lernen" },
      { description: "INT-Cap: INT 9 maximal Stufe 4 Zauber" },
    ],
  },
  {
    id: "MAGIC-006",
    chapter: "ch7-magic",
    phbReference: "Chapter 3: Minor Sphere Access",
    description: "Minor-Sphären: Priester können nur bis Zauberstufe 3 aus Minor-Sphären lernen",
    status: "implemented",
    implementationFiles: ["spellslots.ts"],
    implementationFunctions: ["canLearnSpell"],
    testFiles: ["spellslots.test.ts"],
    scenarios: [
      { description: "Cleric lernt Elemental (minor) Stufe 3: erlaubt" },
      { description: "Cleric lernt Elemental (minor) Stufe 4: blockiert" },
    ],
  },
  {
    id: "MAGIC-007",
    chapter: "ch7-magic",
    phbReference: "Table 21: Wizard Spell Progression",
    description: "Magier-Zauberslots pro Level und Zauberstufe (L1-9, 20 Character-Levels)",
    status: "implemented",
    implementationFiles: ["spellslots.ts"],
    implementationFunctions: ["getWizardSpellSlots"],
    testFiles: ["spellslots.test.ts"],
    scenarios: [
      {
        description: "L1 Mage: 1 Slot Stufe 1",
        example: "getWizardSpellSlots(1) === [1,0,0,0,0,0,0,0,0]",
      },
      { description: "L5 Mage: 4/2/1 Slots" },
      { description: "L20 Mage: maximale Slots" },
    ],
  },
  {
    id: "MAGIC-008",
    chapter: "ch7-magic",
    phbReference: "Table 24: Priest Spell Progression",
    description: "Priester-Zauberslots pro Level und Zauberstufe (L1-7, 20 Character-Levels)",
    status: "implemented",
    implementationFiles: ["spellslots.ts"],
    implementationFunctions: ["getPriestSpellSlots"],
    testFiles: ["spellslots.test.ts"],
    scenarios: [
      {
        description: "L1 Cleric: 1 Slot Stufe 1",
        example: "getPriestSpellSlots(1) === [1,0,0,0,0,0,0]",
      },
      { description: "L9 Cleric: Zugang zu Stufe 5 Zaubern" },
    ],
  },
  {
    id: "MAGIC-009",
    chapter: "ch7-magic",
    phbReference: "Table 5: Wisdom — Bonus Spells",
    description: "Priester-Bonusslots aus WIS-Wert (z.B. WIS 13: +1 Stufe 1)",
    status: "implemented",
    implementationFiles: ["spellslots.ts"],
    implementationFunctions: ["getPriestBonusSlots"],
    testFiles: ["spellslots.test.ts"],
    scenarios: [
      { description: "WIS 12: kein Bonus" },
      { description: "WIS 13: +1 Stufe 1" },
      { description: "WIS 18: +1 auf Stufen 1-4" },
    ],
  },
  {
    id: "MAGIC-010",
    chapter: "ch7-magic",
    phbReference: "Player's Option: Spells & Magic — Spell Points",
    description:
      "Alternatives Priester-Zauberpunkte-System: Punkte statt Slots, Kosten pro Zauberstufe",
    status: "implemented",
    implementationFiles: ["spellslots.ts"],
    implementationFunctions: [
      "getPriestSpellPoints",
      "getPriestBonusSpellPoints",
      "getPriestSpellCost",
    ],
    testFiles: ["spellslots.test.ts"],
    scenarios: [
      { description: "L1 Priester: Basispunkte laut Tabelle" },
      { description: "WIS-Bonus auf Gesamtpunkte" },
      { description: "Kosten: L1=1, L2=2, L3=4, L4=6, L5=8, L6=10, L7=12" },
    ],
  },
  {
    id: "MAGIC-011",
    chapter: "ch7-magic",
    phbReference: "Chapter 7: Specialist Bonus",
    description: "Spezialisten bekommen +1 Zauberslot pro Zauberstufe in ihrer Schule",
    status: "implemented",
    implementationFiles: ["spellslots.ts"],
    implementationFunctions: ["getSpecialistBonusSlots"],
    testFiles: ["spellslots.test.ts"],
    scenarios: [
      { description: "Abjurer bekommt +1 Abjuration-Slot pro Stufe" },
      { description: "Generalist (Mage) bekommt keinen Bonus" },
    ],
  },
  {
    id: "MAGIC-012",
    chapter: "ch7-magic",
    phbReference: "Table 4: Intelligence — Spell Abilities",
    description: "INT bestimmt max. Zauberstufe, Lernchance und max. Zauber pro Stufe für Magier",
    status: "implemented",
    implementationFiles: ["abilities.ts"],
    implementationFunctions: ["getIntelligenceModifiers"],
    testFiles: ["abilities.test.ts"],
    scenarios: [
      { description: "INT 9: maxSpellLevel 4, chanceToLearn 35%" },
      { description: "INT 14: maxSpellLevel 7, chanceToLearn 60%" },
      { description: "INT 18: maxSpellLevel 9, chanceToLearn 85%" },
    ],
  },

  // =========================================================================
  // EXPERIENCE (Chapter 8)
  // =========================================================================
  {
    id: "XP-001",
    chapter: "ch8-experience",
    phbReference: "Tables 14-20: Experience Tables",
    description: "XP-Tabellen für alle Klassen, 20 Stufen (Spezialisten nutzen Mage-Tabelle)",
    status: "implemented",
    implementationFiles: ["experience.ts"],
    implementationFunctions: ["getXpThreshold"],
    testFiles: ["experience.test.ts"],
    scenarios: [
      { description: "Fighter L2: 2000 XP" },
      { description: "Mage L2: 2500 XP" },
      { description: "Thief L2: 1250 XP" },
      { description: "Spezialisten nutzen Mage-Tabelle" },
    ],
  },
  {
    id: "XP-002",
    chapter: "ch8-experience",
    phbReference: "Tables 14-20: Experience Tables",
    description: "XP für nächste Stufe berechnen",
    status: "implemented",
    implementationFiles: ["experience.ts"],
    implementationFunctions: ["getXpForNextLevel"],
    testFiles: ["experience.test.ts"],
    scenarios: [
      { description: "Fighter L1 braucht 2000 XP für L2" },
      { description: "Level 20 gibt null zurück (Max)" },
    ],
  },
  {
    id: "XP-003",
    chapter: "ch8-experience",
    phbReference: "Tables 14-20: Experience Tables",
    description: "Kumulative XP-Schwelle für eine bestimmte Stufe",
    status: "implemented",
    implementationFiles: ["experience.ts"],
    implementationFunctions: ["getXpThreshold"],
    testFiles: ["experience.test.ts"],
    scenarios: [
      { description: "Stufe 1 braucht 0 XP" },
      { description: "Fighter L10 braucht kumulativ 500000 XP" },
    ],
  },

  // =========================================================================
  // COMBAT (Chapter 9)
  // =========================================================================
  {
    id: "COMBAT-001",
    chapter: "ch9-combat",
    phbReference: "Table 53: THAC0 Advancement",
    description:
      "THAC0-Progression: Warriors -1/Level, Priests -2/3Lvl, Rogues -1/2Lvl, Wizards -1/3Lvl",
    status: "implemented",
    implementationFiles: ["combat.ts"],
    implementationFunctions: ["getThac0"],
    testFiles: ["combat.test.ts"],
    scenarios: [
      { description: "Warrior L1: THAC0 20", example: "getThac0('warrior', 1) === 20" },
      { description: "Warrior L10: THAC0 11" },
      { description: "Wizard L1: THAC0 20" },
      { description: "Wizard L6: THAC0 18" },
    ],
  },
  {
    id: "COMBAT-002",
    chapter: "ch9-combat",
    phbReference: "Chapter 9: Attack Rolls",
    description: "Angriffswurf berechnen: THAC0 - Ziel-RK = nötiger d20-Wurf",
    status: "implemented",
    implementationFiles: ["combat.ts"],
    implementationFunctions: ["getAttackRoll"],
    testFiles: ["combat.test.ts"],
    scenarios: [
      { description: "THAC0 20 vs AC 5: braucht 15", example: "getAttackRoll(20, 5) === 15" },
      { description: "THAC0 10 vs AC -3: braucht 13" },
    ],
  },
  {
    id: "COMBAT-003",
    chapter: "ch9-combat",
    phbReference: "Tables 60-63: Saving Throws",
    description: "Rettungswürfe für 4 Klassengruppen × 5 Kategorien × Level-Bereiche",
    status: "implemented",
    implementationFiles: ["combat.ts"],
    implementationFunctions: ["getSavingThrows"],
    testFiles: ["combat.test.ts"],
    scenarios: [
      { description: "Warrior L1: Paralyzation 14, Rod 16, etc." },
      { description: "Wizard L1: andere Werte als Warrior" },
      { description: "Verbesserung mit höherem Level" },
    ],
  },
  {
    id: "COMBAT-004",
    chapter: "ch9-combat",
    phbReference: "Chapter 9: Attacks per Round",
    description:
      "Angriffe pro Runde: Warriors 1/1 (L1-6), 3/2 (L7-12), 2/1 (L13+). Alle anderen: 1/1",
    status: "implemented",
    implementationFiles: ["combat.ts"],
    implementationFunctions: ["getAttacksPerRound"],
    testFiles: ["combat.test.ts"],
    scenarios: [
      { description: "Warrior L1: '1/1'", example: "getAttacksPerRound('warrior', 1) === '1/1'" },
      { description: "Warrior L7: '3/2'" },
      { description: "Warrior L13: '2/1'" },
      { description: "Wizard L20: '1/1'" },
    ],
  },

  // =========================================================================
  // MULTICLASS (Chapter 3)
  // =========================================================================
  {
    id: "MULTI-001",
    chapter: "ch3-classes",
    phbReference: "Chapter 3: Multiclass — Combat Values",
    description: "Multiclass THAC0: bestes (niedrigstes) THAC0 aller aktiven Klassen",
    status: "implemented",
    implementationFiles: ["multiclass.ts"],
    implementationFunctions: ["getMulticlassThac0"],
    testFiles: ["multiclass.test.ts"],
    scenarios: [
      { description: "Fighter 5 / Mage 5: THAC0 des Fighters (besser)" },
      { description: "Single-Class: THAC0 dieser Klasse" },
    ],
  },
  {
    id: "MULTI-002",
    chapter: "ch3-classes",
    phbReference: "Chapter 3: Multiclass — Saving Throws",
    description: "Multiclass Rettungswürfe: bestes (niedrigstes) in jeder Kategorie",
    status: "implemented",
    implementationFiles: ["multiclass.ts"],
    implementationFunctions: ["getMulticlassSaves"],
    testFiles: ["multiclass.test.ts"],
    scenarios: [
      { description: "Fighter/Mage: beste Paralyzation vom Fighter, beste Spell vom Mage" },
    ],
  },
  {
    id: "MULTI-003",
    chapter: "ch3-classes",
    phbReference: "Chapter 3: Multiclass — Hit Points",
    description: "Multiclass TP-Divisor: HP jeder Klasse geteilt durch Anzahl Klassen",
    status: "implemented",
    implementationFiles: ["multiclass.ts"],
    implementationFunctions: ["getMulticlassHpDivisor"],
    testFiles: ["multiclass.test.ts"],
    scenarios: [
      { description: "2 Klassen: Divisor 2" },
      { description: "3 Klassen: Divisor 3" },
      { description: "1 Klasse: Divisor 1" },
    ],
  },
  {
    id: "MULTI-004",
    chapter: "ch3-classes",
    phbReference: "Chapter 3: Multiclass Combinations",
    description:
      "Multiclass-Regeltreue-Check: Validierung gegen erlaubte Rasse/Klasse-Kombinationen",
    status: "implemented",
    implementationFiles: ["multiclass.ts"],
    implementationFunctions: ["isRuleCompliantMulticlass"],
    testFiles: ["multiclass.test.ts"],
    scenarios: [
      { description: "Elf Fighter/Mage: regelkonform" },
      { description: "Human Fighter/Mage: nicht regelkonform (nur Warnung)" },
      { description: "Dwarf Mage/Thief: nicht regelkonform (nur Warnung)" },
    ],
    notes: "Hausregel: Gibt nur true/false zurück, blockiert nie. UI zeigt Warnung.",
  },
  {
    id: "MULTI-005",
    chapter: "ch3-classes",
    phbReference: "Chapter 3: Multiclass — Exceptional Strength",
    description: "Ausnahmestärke in Multiclass: erlaubt wenn EINE der Klassen Krieger-Gruppe ist",
    status: "implemented",
    implementationFiles: ["multiclass.ts"],
    implementationFunctions: ["multiclassHasExceptionalStr"],
    testFiles: ["multiclass.test.ts"],
    scenarios: [
      { description: "Fighter/Mage: true" },
      { description: "Thief/Mage: false" },
      { description: "Cleric/Fighter: true" },
    ],
  },

  // =========================================================================
  // THIEF SKILLS (Chapter 3)
  // =========================================================================
  {
    id: "THIEF-001",
    chapter: "ch3-classes",
    phbReference: "Table 19: Base Thief Skills",
    description:
      "7 Basis-Diebesfähigkeiten: Pick Locks 15%, Find Traps 5%, Move Silently 10%, Hide 5%, Climb 60%, Detect Noise 15%, Read Languages 0%",
    status: "implemented",
    implementationFiles: ["thief.ts"],
    implementationFunctions: ["getBaseThiefSkills"],
    testFiles: ["thief.test.ts"],
    scenarios: [
      {
        description: "L1: pickLocks 15, climbWalls 60",
        example: "getBaseThiefSkills(1).pickLocks === 15",
      },
      { description: "30 Punkte pro Level zum Verteilen" },
    ],
  },
  {
    id: "THIEF-002",
    chapter: "ch3-classes",
    phbReference: "Table 27: Racial Thief Skill Adjustments",
    description:
      "Rassen-Anpassungen für Diebesfähigkeiten (z.B. Elf: +5% Pick Pockets, +5% Move Silently)",
    status: "implemented",
    implementationFiles: ["thief.ts"],
    implementationFunctions: ["getRacialThiefAdjustments"],
    testFiles: ["thief.test.ts"],
    scenarios: [
      { description: "Elf bekommt Bonus auf bestimmte Skills" },
      { description: "Dwarf bekommt Bonus auf Find Traps" },
      { description: "Human hat keine Anpassungen (alles 0)" },
    ],
  },
  {
    id: "THIEF-003",
    chapter: "ch3-classes",
    phbReference: "Chapter 3: Thief — Backstab",
    description: "Backstab-Multiplikator: L1-4: ×2, L5-8: ×3, L9-12: ×4, L13+: ×5",
    status: "implemented",
    implementationFiles: ["thief.ts"],
    implementationFunctions: ["getBackstabMultiplier"],
    testFiles: ["thief.test.ts"],
    scenarios: [
      { description: "L1: ×2", example: "getBackstabMultiplier(1) === 2" },
      { description: "L5: ×3" },
      { description: "L9: ×4" },
      { description: "L13: ×5" },
    ],
  },
  {
    id: "THIEF-004",
    chapter: "ch3-classes",
    phbReference: "Chapter 3: Thief/Bard Skills",
    description: "Prüfung ob Klassen-Kombination Diebesfähigkeiten hat (Thief oder Bard)",
    status: "implemented",
    implementationFiles: ["thief.ts"],
    implementationFunctions: ["hasThiefSkills"],
    testFiles: ["thief.test.ts"],
    scenarios: [
      { description: "['thief']: true" },
      { description: "['bard']: true" },
      { description: "['fighter']: false" },
      { description: "['fighter', 'thief']: true (Multiclass)" },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// Helper: Summary counts
// ---------------------------------------------------------------------------

export function getRuleSummary() {
  const rules = CHARACTER_CREATION_RULES;
  const implemented = rules.filter((r) => r.status === "implemented").length;
  const partial = rules.filter((r) => r.status === "partial").length;
  const missing = rules.filter((r) => r.status === "missing").length;
  return { total: rules.length, implemented, partial, missing };
}

export function getRulesByChapter() {
  const chapters = new Map<
    string,
    { implemented: number; partial: number; missing: number; total: number }
  >();
  for (const rule of CHARACTER_CREATION_RULES) {
    const entry = chapters.get(rule.chapter) ?? {
      implemented: 0,
      partial: 0,
      missing: 0,
      total: 0,
    };
    entry.total++;
    entry[rule.status]++;
    chapters.set(rule.chapter, entry);
  }
  return chapters;
}
