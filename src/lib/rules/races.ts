import type { RaceId, ClassId, ClassGroup, AbilityName, ClassAbility } from "./types";
import { getClassGroup } from "./classes";

export interface RaceDefinition {
  id: RaceId;
  name: string;
  name_en: string;
  abilityAdjustments: Partial<Record<AbilityName, number>>;
  allowedClasses: ClassId[];
  levelLimits: Partial<Record<ClassId, number>>; // missing = unlimited (humans)
  multiclassOptions: ClassId[][]; // available multiclass combinations
  infravision: number; // in feet, 0 = none
  baseMovement: number; // base movement rate (e.g. 12 for humans)
  abilityMinimums?: Partial<Record<AbilityName, number>>;
  abilityMaximums?: Partial<Record<AbilityName, number>>;
  racialAbilities: ClassAbility[];
  defaultLanguages: string[];
}

const ALL_CLASSES: ClassId[] = [
  "fighter",
  "ranger",
  "paladin",
  "mage",
  "abjurer",
  "conjurer",
  "diviner",
  "enchanter",
  "illusionist",
  "invoker",
  "necromancer",
  "transmuter",
  "cleric",
  "crusader",
  "druid",
  "monk",
  "shaman",
  "thief",
  "bard",
];

const MAGE_SPECIALISTS: ClassId[] = [
  "abjurer",
  "conjurer",
  "diviner",
  "enchanter",
  "illusionist",
  "invoker",
  "necromancer",
  "transmuter",
];

export const RACES: Record<RaceId, RaceDefinition> = {
  human: {
    id: "human",
    name: "Mensch",
    name_en: "Human",
    abilityAdjustments: {},
    allowedClasses: ALL_CLASSES,
    levelLimits: {},
    multiclassOptions: [],
    infravision: 0,
    baseMovement: 12,
    racialAbilities: [
      {
        name: "Keine Klassen- oder Level-Beschränkungen",
        name_en: "No Class or Level Restrictions",
        description:
          "Menschen können jede Klasse wählen und haben keine Stufenbegrenzung. Keine Attribut-Minima oder -Maxima durch die Rasse. Einzige Rasse ohne Multiclass-Option.",
        description_en:
          "Humans can choose any class and have no level limits. No racial ability minimums or maximums. The only race without multiclass options.",
      },
      {
        name: "Dualclass möglich (einzige Rasse)",
        name_en: "Dual-class Possible (Only Race)",
        description:
          "Nur Menschen können Dualclass werden: Sie geben ihre alte Klasse auf und beginnen in einer neuen bei Stufe 1. Fähigkeiten der alten Klasse werden nutzbar, sobald die neue Klasse eine höhere Stufe erreicht. Erfordert 15+ in den Prime Requisites der neuen Klasse und 17+ in den Prime Requisites der alten.",
        description_en:
          "Only humans can dual-class: abandon the old class and start a new one at level 1. Old class abilities become usable once the new class surpasses the old class level. Requires 15+ in the new class prime requisites and 17+ in the old.",
      },
    ],
    defaultLanguages: ["Common"],
  },

  elf: {
    id: "elf",
    name: "Elf",
    name_en: "Elf",
    abilityAdjustments: { dex: 1, con: -1 },
    allowedClasses: [
      "fighter",
      "ranger",
      "mage",
      ...MAGE_SPECIALISTS,
      "cleric",
      "crusader",
      "thief",
    ],
    levelLimits: {
      fighter: 12,
      ranger: 15,
      mage: 15,
      abjurer: 15,
      conjurer: 15,
      diviner: 15,
      enchanter: 15,
      illusionist: 15,
      invoker: 15,
      necromancer: 15,
      transmuter: 15,
      cleric: 12,
      thief: 12,
    },
    multiclassOptions: [
      ["fighter", "mage"],
      ["fighter", "thief"],
      ["mage", "thief"],
      ["fighter", "mage", "thief"],
    ],
    infravision: 60,
    baseMovement: 12,
    abilityMinimums: { int: 8, dex: 6 },
    abilityMaximums: { con: 17 },
    racialAbilities: [
      {
        name: "Infravision (18 m)",
        name_en: "Infravision (18 m)",
        description:
          "Elfen können im Dunkeln bis zu 18 m weit Wärmestrahlung wahrnehmen. Funktioniert nicht bei Tageslicht oder starken Lichtquellen.",
        description_en:
          "Elves can perceive heat radiation in the dark up to 18 m. Does not function in daylight or near strong light sources.",
      },
      {
        name: "Resistenz gegen Schlaf & Bezauberung (90%)",
        name_en: "Resistance to Sleep & Charm (90%)",
        description:
          "Elfen sind zu 90% resistent gegen Schlaf- und Bezauberungszauber. Gilt für alle magischen Schlafeffekte und geistbeeinflussende Verzauberungen.",
        description_en:
          "Elves are 90% resistant to sleep and charm spells. Applies to all magical sleep effects and mind-affecting enchantments.",
      },
      {
        name: "Geheimtüren entdecken",
        name_en: "Detect Secret Doors",
        description:
          "Verborgene Türen: 1-auf-6 beim Vorbeigehen (passiv), 2-auf-6 bei aktiver Suche, 3-auf-6 bei verborgenen (nicht geheimen) Türen.",
        description_en:
          "Hidden doors: 1-in-6 when passing by (passive), 2-in-6 when actively searching, 3-in-6 for concealed (not secret) doors.",
      },
      {
        name: "+1 Treffer mit Schwertern & Bögen",
        name_en: "+1 to Hit with Swords & Bows",
        description:
          "Elfen erhalten +1 auf Trefferwürfe mit Langschwertern, Kurzschwertern und allen Bogentypen (nicht Armbrüsten).",
        description_en:
          "Elves gain +1 to attack rolls with long swords, short swords, and all bow types (not crossbows).",
      },
    ],
    defaultLanguages: ["Common", "Elfisch"],
  },

  half_elf: {
    id: "half_elf",
    name: "Halbelf",
    name_en: "Half-Elf",
    abilityAdjustments: {},
    allowedClasses: [
      "fighter",
      "ranger",
      "mage",
      ...MAGE_SPECIALISTS,
      "cleric",
      "crusader",
      "druid",
      "thief",
      "bard",
    ],
    levelLimits: {
      fighter: 14,
      ranger: 16,
      mage: 12,
      abjurer: 12,
      conjurer: 12,
      diviner: 12,
      enchanter: 12,
      illusionist: 12,
      invoker: 12,
      necromancer: 12,
      transmuter: 12,
      cleric: 14,
      druid: 9,
      thief: 12,
      bard: 12,
    },
    multiclassOptions: [
      ["fighter", "cleric"],
      ["fighter", "thief"],
      ["fighter", "mage"],
      ["cleric", "mage"],
      ["cleric", "thief"],
      ["thief", "mage"],
      ["fighter", "mage", "cleric"],
      ["fighter", "mage", "thief"],
    ],
    infravision: 60,
    baseMovement: 12,
    abilityMinimums: { int: 4, con: 4 },
    racialAbilities: [
      {
        name: "Infravision (18 m)",
        name_en: "Infravision (18 m)",
        description:
          "Halbelfen können im Dunkeln bis zu 18 m weit sehen, indem sie Wärmestrahlung wahrnehmen. Gleiche Reichweite wie bei reinen Elfen.",
        description_en:
          "Half-elves can see in the dark up to 18 m by perceiving heat radiation. Same range as full elves.",
      },
      {
        name: "Resistenz gegen Schlaf- und Bezauberungszauber (30%)",
        name_en: "Resistance to Sleep and Charm Spells (30%)",
        description:
          "Halbelfen sind zu 30% resistent gegen Schlaf- und Bezauberungszauber (charm). Geringer als die 90% der Elfen, aber besser als nichts.",
        description_en:
          "Half-elves are 30% resistant to sleep and charm spells. Lower than the elven 90%, but still significant.",
      },
      {
        name: "Geheimtüren entdecken (1-auf-6 passiv, 2-auf-6 aktiv)",
        name_en: "Detect Secret Doors (1-in-6 passive, 2-in-6 active)",
        description:
          "Halbelfen können verborgene Türen mit elfischer Sensibilität aufspüren: 1-auf-6 beim bloßen Vorbeigehen, 2-auf-6 bei aktiver Suche.",
        description_en:
          "Half-elves can detect hidden doors with elven sensitivity: 1-in-6 when merely passing by, 2-in-6 when actively searching.",
      },
    ],
    defaultLanguages: ["Common", "Elfisch"],
  },

  dwarf: {
    id: "dwarf",
    name: "Zwerg",
    name_en: "Dwarf",
    abilityAdjustments: { con: 1, cha: -1 },
    allowedClasses: ["fighter", "cleric", "crusader", "thief"],
    levelLimits: { fighter: 15, cleric: 10, crusader: 12, thief: 12 },
    multiclassOptions: [
      ["fighter", "cleric"],
      ["fighter", "thief"],
    ],
    infravision: 60,
    baseMovement: 6,
    abilityMinimums: { str: 8, con: 11 },
    abilityMaximums: { cha: 16 },
    racialAbilities: [
      {
        name: "Infravision (18 m)",
        name_en: "Infravision (18 m)",
        description: "Zwerge können im Dunkeln bis zu 18 m weit Wärmestrahlung wahrnehmen.",
        description_en: "Dwarves can perceive heat radiation in the dark up to 18 m.",
      },
      {
        name: "Rettungswurf-Bonus gegen Gift & Magie",
        name_en: "Saving Throw Bonus vs. Poison & Magic",
        description:
          "Zwerge erhalten +1 auf Rettungswürfe gegen Gift, Stäbe, Ruten, Zauberstäbe und Zauber pro 3,5 Punkte KON. Bei KON 14 = +4, bei KON 17 = +4, bei KON 18 = +5.",
        description_en:
          "Dwarves gain +1 to saves vs. poison, rods, staves, wands, and spells per 3.5 points of CON. At CON 14 = +4, CON 17 = +4, CON 18 = +5.",
      },
      {
        name: "Steinbearbeitung erkennen",
        name_en: "Detect Stonework",
        description:
          "Unterirdisch: Neigungen erkennen (1–5 auf W6), neue Tunnel/Bauten (1–5 auf W6), gleitende/verschobene Wände (1–4 auf W6), Steinmechanismen und Fallen (1–3 auf W6). Erfordert Konzentration.",
        description_en:
          "Underground: detect slopes (1–5 on d6), new tunnels/construction (1–5 on d6), sliding/shifting walls (1–4 on d6), stone mechanisms and traps (1–3 on d6). Requires concentration.",
      },
      {
        name: "+1 Treffer gegen Orks, Halb-Orks, Goblins, Hobgoblins",
        name_en: "+1 to Hit vs. Orcs, Half-Orcs, Goblins, Hobgoblins",
        description:
          "Zwerge erhalten +1 auf Trefferwürfe gegen Orks, Halb-Orks, Goblins und Hobgoblins durch spezielle Kampfausbildung.",
        description_en:
          "Dwarves gain +1 to attack rolls vs. orcs, half-orcs, goblins, and hobgoblins due to special combat training.",
      },
      {
        name: "Große Gegner: −4 auf deren Angriffe",
        name_en: "Large Opponents: −4 to Their Attacks",
        description:
          "Oger, Trolle, Oger-Magier, Riesen und Titanen erleiden −4 auf ihre Trefferwürfe gegen Zwerge (kleine, gedrungene Ziele).",
        description_en:
          "Ogres, trolls, ogre magi, giants, and titans suffer −4 to attack rolls against dwarves (small, compact targets).",
      },
    ],
    defaultLanguages: ["Common", "Zwergisch"],
  },

  gnome: {
    id: "gnome",
    name: "Gnom",
    name_en: "Gnome",
    abilityAdjustments: { int: 1, wis: -1 },
    allowedClasses: ["fighter", "illusionist", "cleric", "thief"],
    levelLimits: { fighter: 11, illusionist: 15, cleric: 9, thief: 13 },
    multiclassOptions: [
      ["fighter", "cleric"],
      ["fighter", "thief"],
      ["cleric", "thief"],
      ["fighter", "illusionist"],
      ["illusionist", "thief"],
    ],
    infravision: 60,
    baseMovement: 6,
    abilityMinimums: { int: 6, con: 8 },
    abilityMaximums: { str: 17, wis: 17 },
    racialAbilities: [
      {
        name: "Infravision (18 m)",
        name_en: "Infravision (18 m)",
        description: "Gnome können im Dunkeln bis zu 18 m weit Wärmestrahlung wahrnehmen.",
        description_en: "Gnomes can perceive heat radiation in the dark up to 18 m.",
      },
      {
        name: "Rettungswurf-Bonus gegen Magie",
        name_en: "Saving Throw Bonus vs. Magic",
        description:
          "Gnome erhalten +1 auf Rettungswürfe gegen Stäbe, Ruten, Zauberstäbe und Zauber pro 3,5 Punkte KON. Gilt nicht gegen Gift (im Gegensatz zu Zwergen).",
        description_en:
          "Gnomes gain +1 to saves vs. rods, staves, wands, and spells per 3.5 points of CON. Does not apply to poison (unlike dwarves).",
      },
      {
        name: "+1 Treffer gegen Kobolde & Goblins",
        name_en: "+1 to Hit vs. Kobolds & Goblins",
        description:
          "Gnome erhalten +1 auf Trefferwürfe gegen Kobolde und Goblins durch spezielle Kampfausbildung.",
        description_en:
          "Gnomes gain +1 to attack rolls vs. kobolds and goblins due to special combat training.",
      },
      {
        name: "Große Gegner: −4 auf deren Angriffe",
        name_en: "Large Opponents: −4 to Their Attacks",
        description:
          "Oger, Trolle, Oger-Magier, Riesen und Titanen erleiden −4 auf ihre Trefferwürfe gegen Gnome.",
        description_en:
          "Ogres, trolls, ogre magi, giants, and titans suffer −4 to attack rolls against gnomes.",
      },
    ],
    defaultLanguages: ["Common", "Gnomisch"],
  },

  halfling: {
    id: "halfling",
    name: "Halbling",
    name_en: "Halfling",
    abilityAdjustments: { dex: 1, str: -1 },
    allowedClasses: ["fighter", "cleric", "thief"],
    levelLimits: { fighter: 9, cleric: 8, thief: 15 },
    multiclassOptions: [["fighter", "thief"]],
    infravision: 30,
    baseMovement: 6,
    abilityMinimums: { dex: 7, con: 10, str: 7 },
    abilityMaximums: { str: 17, wis: 17 },
    racialAbilities: [
      {
        name: "Infravision (9 m)",
        name_en: "Infravision (9 m)",
        description: "Halblinge können im Dunkeln bis zu 9 m weit Wärmestrahlung wahrnehmen.",
        description_en: "Halflings can perceive heat radiation in the dark up to 9 m.",
      },
      {
        name: "Rettungswurf-Bonus gegen Gift & Magie",
        name_en: "Saving Throw Bonus vs. Poison & Magic",
        description:
          "Halblinge erhalten +1 auf Rettungswürfe gegen Gift, Stäbe, Ruten, Zauberstäbe und Zauber pro 3,5 Punkte KON. Identisch mit Zwergen (inkl. Gift).",
        description_en:
          "Halflings gain +1 to saves vs. poison, rods, staves, wands, and spells per 3.5 points of CON. Identical to dwarves (including poison).",
      },
      {
        name: "+1 Treffer mit Schleudern & Wurfwaffen",
        name_en: "+1 to Hit with Slings & Thrown Weapons",
        description:
          "Halblinge erhalten +1 auf Trefferwürfe mit Schleudern und allen Wurfwaffen. Angeboren, stapelt mit anderen Boni.",
        description_en:
          "Halflings gain +1 to attack rolls with slings and all thrown weapons. Innate, stacks with other bonuses.",
      },
      {
        name: "Überraschungsbonus (−4 für Gegner)",
        name_en: "Surprise Bonus (−4 for Enemies)",
        description:
          "Gegner erleiden −4 auf Überraschungswürfe, wenn der Halbling allein oder nur mit Halblingen/Elfen unterwegs ist. Ohne schwere Rüstung: selbst +1 auf eigene Überraschungswürfe.",
        description_en:
          "Enemies suffer −4 to surprise rolls when the halfling is alone or with only halflings/elves. Without heavy armor: the halfling also gains +1 to own surprise rolls.",
      },
    ],
    defaultLanguages: ["Common", "Halblingisch"],
  },

  half_orc: {
    id: "half_orc",
    name: "Halb-Ork",
    name_en: "Half-Orc",
    abilityAdjustments: { str: 1, con: 1, cha: -2 },
    allowedClasses: ["fighter", "cleric", "thief"],
    levelLimits: { fighter: 12, cleric: 4, thief: 8 },
    multiclassOptions: [
      ["fighter", "cleric"],
      ["fighter", "thief"],
      ["cleric", "thief"],
    ],
    infravision: 60,
    baseMovement: 12,
    abilityMinimums: { str: 6, con: 13 },
    abilityMaximums: { int: 17, wis: 14, cha: 12 },
    racialAbilities: [
      {
        name: "Infravision (18 m)",
        name_en: "Infravision (18 m)",
        description: "Halb-Orks können im Dunkeln bis zu 18 m weit Wärmestrahlung wahrnehmen.",
        description_en: "Half-orcs can perceive heat radiation in the dark up to 18 m.",
      },
    ],
    defaultLanguages: ["Common", "Orkisch"],
  },

  kobold: {
    id: "kobold",
    name: "Kobold",
    name_en: "Kobold",
    abilityAdjustments: { str: -1, con: -1, cha: -2 },
    allowedClasses: ALL_CLASSES,
    levelLimits: {},
    multiclassOptions: [
      ["fighter", "thief"],
      ["fighter", "cleric"],
      ["cleric", "thief"],
    ],
    infravision: 60,
    baseMovement: 6,
    racialAbilities: [
      {
        name: "Infravision (18 m)",
        name_en: "Infravision (18 m)",
        description: "Kobolde können im Dunkeln bis zu 18 m weit Wärmestrahlung wahrnehmen.",
        description_en: "Kobolds can perceive heat radiation in the dark up to 18 m.",
      },
      {
        name: "Zuletzt angegriffen",
        name_en: "Attacked Last",
        description: "Feinde unterschätzen Kobolde und greifen sie im Kampf zuletzt an.",
        description_en:
          "Enemies dismiss kobolds as negligible threats, attacking them last in combat.",
      },
      {
        name: "Unterirdische Erkennung",
        name_en: "Mining Detection",
        description:
          "Kobolde können unterirdisch gleitende Wände, Neigungen und neue Konstruktionen erkennen, ähnlich wie Zwerge. Erfordert Konzentration.",
        description_en:
          "Kobolds can detect underground features such as sliding walls, slopes, and new construction, similar to dwarves. Requires concentration.",
      },
    ],
    defaultLanguages: ["Common", "Koboldisch", "Orkisch", "Untercommon"],
  },

  tiefling: {
    id: "tiefling",
    name: "Tiefling",
    name_en: "Tiefling",
    abilityAdjustments: { int: 1, cha: -1 },
    allowedClasses: ALL_CLASSES,
    levelLimits: {},
    multiclassOptions: [
      ["fighter", "mage"],
      ["fighter", "thief"],
      ["fighter", "cleric"],
      ["mage", "thief"],
      ["cleric", "thief"],
      ["cleric", "mage"],
    ],
    infravision: 60,
    baseMovement: 12,
    racialAbilities: [
      {
        name: "Infravision (18 m)",
        name_en: "Infravision (18 m)",
        description: "Tieflinge können im Dunkeln bis zu 18 m weit Wärmestrahlung wahrnehmen.",
        description_en: "Tieflings can perceive heat radiation in the dark up to 18 m.",
      },
      {
        name: "Kälteresistenz (halber Schaden)",
        name_en: "Cold Resistance (Half Damage)",
        description:
          "Tieflinge erleiden nur halben Schaden durch kältebasierte Angriffe. Angeboren, gilt für alle Kältequellen.",
        description_en:
          "Tieflings suffer only half damage from cold-based attacks. Innate, applies to all cold sources.",
      },
      {
        name: "Feuerresistenz (halber Schaden)",
        name_en: "Fire Resistance (Half Damage)",
        description:
          "Tieflinge erleiden nur halben Schaden durch feuerbasierte Angriffe. Angeboren, gilt für alle Feuerquellen.",
        description_en:
          "Tieflings suffer only half damage from fire-based attacks. Innate, applies to all fire sources.",
      },
      {
        name: "Elektrizitätsresistenz (halber Schaden)",
        name_en: "Electricity Resistance (Half Damage)",
        description:
          "Tieflinge erleiden nur halben Schaden durch elektrische Angriffe. Angeboren, gilt für alle elektrischen Quellen.",
        description_en:
          "Tieflings suffer only half damage from electrical attacks. Innate, applies to all electrical sources.",
      },
      {
        name: "Dunkelheit, 4,5 m Radius (1x pro Tag)",
        name_en: "Darkness, 4.5 m Radius (1/Day)",
        description:
          "Tieflinge können einmal pro Tag den Zauber Dunkelheit, 4,5 m Radius als angeborene Fähigkeit wirken. Dies erzeugt eine Sphäre magischer Dunkelheit.",
        description_en:
          "Tieflings can cast Darkness, 4.5 m Radius once per day as an innate ability. This creates a sphere of magical darkness.",
        usesPerDay: 1,
      },
      {
        name: "−2 Reaktionsmalus",
        name_en: "−2 Reaction Penalty",
        description:
          "Tieflinge erleiden −2 auf Reaktionswürfe bei NPC-Begegnungen durch ihre fiendische Erscheinung.",
        description_en:
          "Tieflings suffer −2 to reaction rolls during NPC encounters due to their fiendish appearance.",
      },
    ],
    defaultLanguages: ["Common", "Infernal"],
  },
};

export function getRace(raceId: RaceId): RaceDefinition {
  return RACES[raceId];
}

export function getAllRaces(): RaceDefinition[] {
  return Object.values(RACES);
}

export function canPlayClass(raceId: RaceId, classId: ClassId): boolean {
  return RACES[raceId].allowedClasses.includes(classId);
}

export function getLevelLimit(raceId: RaceId, classId: ClassId): number | null {
  const limit = RACES[raceId].levelLimits[classId];
  return limit ?? null; // null = unlimited
}

// ─── STARTING AGE (PHB Table 10) ────────────────────────────────────────────

export interface AgeRange {
  base: number;
  diceCount: number;
  diceSides: number;
}

// Base ages by race, keyed by class group
const STARTING_AGE: Record<RaceId, Record<ClassGroup, AgeRange>> = {
  human: {
    warrior: { base: 15, diceCount: 1, diceSides: 4 },
    wizard: { base: 20, diceCount: 2, diceSides: 8 },
    priest: { base: 18, diceCount: 1, diceSides: 4 },
    rogue: { base: 18, diceCount: 1, diceSides: 6 },
  },
  elf: {
    warrior: { base: 130, diceCount: 5, diceSides: 6 },
    wizard: { base: 150, diceCount: 5, diceSides: 6 },
    priest: { base: 140, diceCount: 5, diceSides: 6 },
    rogue: { base: 100, diceCount: 5, diceSides: 6 },
  },
  half_elf: {
    warrior: { base: 22, diceCount: 3, diceSides: 4 },
    wizard: { base: 30, diceCount: 2, diceSides: 8 },
    priest: { base: 40, diceCount: 2, diceSides: 4 },
    rogue: { base: 22, diceCount: 3, diceSides: 8 },
  },
  dwarf: {
    warrior: { base: 40, diceCount: 5, diceSides: 4 },
    wizard: { base: 75, diceCount: 2, diceSides: 20 },
    priest: { base: 250, diceCount: 2, diceSides: 20 },
    rogue: { base: 75, diceCount: 2, diceSides: 6 },
  },
  gnome: {
    warrior: { base: 60, diceCount: 5, diceSides: 4 },
    wizard: { base: 100, diceCount: 2, diceSides: 12 },
    priest: { base: 300, diceCount: 3, diceSides: 12 },
    rogue: { base: 80, diceCount: 5, diceSides: 4 },
  },
  halfling: {
    warrior: { base: 20, diceCount: 3, diceSides: 4 },
    wizard: { base: 40, diceCount: 2, diceSides: 8 },
    priest: { base: 40, diceCount: 2, diceSides: 4 },
    rogue: { base: 32, diceCount: 2, diceSides: 4 },
  },
  half_orc: {
    warrior: { base: 13, diceCount: 1, diceSides: 4 },
    wizard: { base: 16, diceCount: 1, diceSides: 6 },
    priest: { base: 14, diceCount: 1, diceSides: 4 },
    rogue: { base: 15, diceCount: 1, diceSides: 6 },
  },
  kobold: {
    warrior: { base: 8, diceCount: 1, diceSides: 4 },
    wizard: { base: 12, diceCount: 1, diceSides: 6 },
    priest: { base: 10, diceCount: 1, diceSides: 4 },
    rogue: { base: 10, diceCount: 1, diceSides: 4 },
  },
  tiefling: {
    warrior: { base: 15, diceCount: 1, diceSides: 4 },
    wizard: { base: 20, diceCount: 2, diceSides: 8 },
    priest: { base: 18, diceCount: 1, diceSides: 4 },
    rogue: { base: 18, diceCount: 1, diceSides: 6 },
  },
};

export function getStartingAge(raceId: RaceId, classId: ClassId): AgeRange {
  const group = getClassGroup(classId);
  return STARTING_AGE[raceId][group];
}

// ─── HEIGHT AND WEIGHT TABLES (PHB Table 10) ────────────────────────────────

export type Gender = "male" | "female";

export interface PhysicalRange {
  baseInches: number;
  diceCount: number;
  diceSides: number;
}

export interface WeightRange {
  baseLbs: number;
  diceCount: number;
  diceSides: number;
}

const HEIGHT_TABLE: Record<RaceId, Record<Gender, PhysicalRange>> = {
  human: {
    male: { baseInches: 60, diceCount: 2, diceSides: 10 },
    female: { baseInches: 59, diceCount: 2, diceSides: 10 },
  },
  elf: {
    male: { baseInches: 55, diceCount: 1, diceSides: 10 },
    female: { baseInches: 50, diceCount: 1, diceSides: 10 },
  },
  half_elf: {
    male: { baseInches: 60, diceCount: 2, diceSides: 6 },
    female: { baseInches: 58, diceCount: 2, diceSides: 6 },
  },
  dwarf: {
    male: { baseInches: 43, diceCount: 1, diceSides: 10 },
    female: { baseInches: 41, diceCount: 1, diceSides: 10 },
  },
  gnome: {
    male: { baseInches: 38, diceCount: 1, diceSides: 6 },
    female: { baseInches: 36, diceCount: 1, diceSides: 6 },
  },
  halfling: {
    male: { baseInches: 32, diceCount: 2, diceSides: 8 },
    female: { baseInches: 30, diceCount: 2, diceSides: 8 },
  },
  half_orc: {
    male: { baseInches: 58, diceCount: 2, diceSides: 10 },
    female: { baseInches: 56, diceCount: 2, diceSides: 10 },
  },
  kobold: {
    male: { baseInches: 30, diceCount: 1, diceSides: 6 },
    female: { baseInches: 28, diceCount: 1, diceSides: 6 },
  },
  tiefling: {
    male: { baseInches: 60, diceCount: 2, diceSides: 10 },
    female: { baseInches: 59, diceCount: 2, diceSides: 10 },
  },
};

const WEIGHT_TABLE: Record<RaceId, Record<Gender, WeightRange>> = {
  human: {
    male: { baseLbs: 140, diceCount: 6, diceSides: 10 },
    female: { baseLbs: 100, diceCount: 6, diceSides: 10 },
  },
  elf: {
    male: { baseLbs: 90, diceCount: 3, diceSides: 10 },
    female: { baseLbs: 70, diceCount: 3, diceSides: 10 },
  },
  half_elf: {
    male: { baseLbs: 110, diceCount: 3, diceSides: 12 },
    female: { baseLbs: 85, diceCount: 3, diceSides: 12 },
  },
  dwarf: {
    male: { baseLbs: 130, diceCount: 4, diceSides: 10 },
    female: { baseLbs: 105, diceCount: 4, diceSides: 10 },
  },
  gnome: {
    male: { baseLbs: 72, diceCount: 5, diceSides: 4 },
    female: { baseLbs: 68, diceCount: 5, diceSides: 4 },
  },
  halfling: {
    male: { baseLbs: 52, diceCount: 5, diceSides: 4 },
    female: { baseLbs: 48, diceCount: 5, diceSides: 4 },
  },
  half_orc: {
    male: { baseLbs: 130, diceCount: 5, diceSides: 10 },
    female: { baseLbs: 100, diceCount: 5, diceSides: 10 },
  },
  kobold: {
    male: { baseLbs: 40, diceCount: 2, diceSides: 4 },
    female: { baseLbs: 35, diceCount: 2, diceSides: 4 },
  },
  tiefling: {
    male: { baseLbs: 140, diceCount: 6, diceSides: 10 },
    female: { baseLbs: 100, diceCount: 6, diceSides: 10 },
  },
};

export function getHeightRange(raceId: RaceId, gender: Gender): PhysicalRange {
  return HEIGHT_TABLE[raceId][gender];
}

export function getWeightRange(raceId: RaceId, gender: Gender): WeightRange {
  return WEIGHT_TABLE[raceId][gender];
}

// ─── RACIAL SAVING THROW BONUSES (PHB Ch2) ──────────────────────────────────

/** Dwarves and gnomes get +1 save bonus per 3.5 CON points vs poison/magic */
export function getRacialSavingThrowBonus(raceId: RaceId, con: number): number {
  if (raceId !== "dwarf" && raceId !== "gnome") return 0;
  return Math.floor(con / 3.5);
}
