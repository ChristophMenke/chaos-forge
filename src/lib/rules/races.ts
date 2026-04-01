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
          "Menschen können jede Klasse wählen und haben keine Stufenbegrenzung. Sie sind die vielseitigste Rasse in AD&D 2e.",
        description_en:
          "Humans can choose any class and have no level restrictions. They are the most versatile race in AD&D 2e.",
      },
      {
        name: "Dualclass möglich (einzige Rasse)",
        name_en: "Dual-class Possible (Only Race)",
        description:
          "Nur Menschen können Dualclass werden: Sie geben ihre alte Klasse auf und beginnen in einer neuen bei Stufe 1. Die Fähigkeiten der alten Klasse werden erst wieder verfügbar, wenn die neue Klasse eine höhere Stufe erreicht.",
        description_en:
          "Only humans can dual-class: They abandon their old class and start a new one at level 1. The abilities of the old class become available again only when the new class reaches a higher level.",
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
          "Elfen können im Dunkeln bis zu 18 m weit sehen, indem sie Wärmestrahlung wahrnehmen. Infravision funktioniert nicht bei Tageslicht oder in der Nähe starker Lichtquellen.",
        description_en:
          "Elves can see in the dark up to 18 meters by perceiving heat radiation. Infravision does not work in daylight or near strong light sources.",
      },
      {
        name: "Resistenz gegen Schlaf- und Bezauberungszauber (90%)",
        name_en: "Resistance to Sleep and Charm Spells (90%)",
        description:
          "Elfen sind zu 90% resistent gegen Schlaf- und Bezauberungszauber (charm). Dies gilt für alle magischen Schlafeffekte und geistbeeinflussende Verzauberungen.",
        description_en:
          "Elves are 90% resistant to sleep and charm spells. This applies to all magical sleep effects and mind-affecting enchantments.",
      },
      {
        name: "Geheimtüren entdecken (1-auf-6 passiv, 2-auf-6 aktiv)",
        name_en: "Detect Secret Doors (1-in-6 passive, 2-in-6 active)",
        description:
          "Elfen entdecken versteckte und geheime Türen mit erhöhter Wahrscheinlichkeit. Beim bloßen Vorbeigehen spüren sie Verborgenes mit 1-auf-6, bei aktiver Suche mit 2-auf-6.",
        description_en:
          "Elves detect hidden and secret doors with increased probability. When merely passing by, they sense hidden things on 1-in-6; when actively searching, on 2-in-6.",
      },
      {
        name: "+1 Treffer mit Langschwertern und Bögen",
        name_en: "+1 Hit with Long Swords and Bows",
        description:
          "Elfen erhalten aufgrund ihrer langen Übungstradition +1 auf Trefferwürfe mit Langschwertern, Kurzschwertern und allen Bogentypen (außer Armbrüsten).",
        description_en:
          "Elves receive +1 to attack rolls with long swords, short swords, and all bow types (except crossbows) due to their long tradition of practice.",
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
    infravision: 30,
    baseMovement: 12,
    abilityMinimums: { int: 4, con: 4 },
    racialAbilities: [
      {
        name: "Infravision (9 m)",
        name_en: "Infravision (9 m)",
        description:
          "Halbelfen können im Dunkeln bis zu 9 m weit sehen, indem sie Wärmestrahlung wahrnehmen. Die Reichweite ist geringer als bei reinen Elfen.",
        description_en:
          "Half-elves can see in the dark up to 9 meters by perceiving heat radiation. The range is shorter than that of pure elves.",
      },
      {
        name: "Resistenz gegen Schlaf- und Bezauberungszauber (30%)",
        name_en: "Resistance to Sleep and Charm Spells (30%)",
        description:
          "Halbelfen sind zu 30% resistent gegen Schlaf- und Bezauberungszauber. Diese geringere Resistenz spiegelt ihr gemischtes Erbe wider.",
        description_en:
          "Half-elves are 30% resistant to sleep and charm spells. This lower resistance reflects their mixed heritage.",
      },
      {
        name: "Geheimtüren entdecken (1-auf-6 passiv, 2-auf-6 aktiv)",
        name_en: "Detect Secret Doors (1-in-6 passive, 2-in-6 active)",
        description:
          "Halbelfen haben die elfische Fähigkeit, verborgene Türen zu entdecken. Beim Vorbeigehen mit 1-auf-6, bei aktiver Suche mit 2-auf-6.",
        description_en:
          "Half-elves have the elven ability to detect hidden doors. When passing by on 1-in-6, when actively searching on 2-in-6.",
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
        description:
          "Zwerge können im Dunkeln bis zu 18 m weit sehen, indem sie Wärmestrahlung wahrnehmen. Diese Fähigkeit stammt von ihrem Leben unter der Erde.",
        description_en:
          "Dwarves can see in the dark up to 18 meters by perceiving heat radiation. This ability stems from their life underground.",
      },
      {
        name: "Rettungswurf-Bonus gegen Gift und Magie (+1 pro 3,5 CON)",
        name_en: "Saving Throw Bonus vs. Poison and Magic (+1 per 3.5 CON)",
        description:
          "Zwerge erhalten einen Bonus auf Rettungswürfe gegen Gift, Stäbe, Ruten, Zepter, Zauberstäbe und Zauber. Der Bonus beträgt +1 pro 3,5 Punkte Konstitution.",
        description_en:
          "Dwarves receive a bonus to saving throws against poison, rods, staves, wands, and spells. The bonus is +1 per 3.5 points of Constitution.",
      },
      {
        name: "Steinbearbeitung erkennen (Neigung, neue Tunnel, Fallen)",
        name_en: "Detect Stonework (Slopes, New Tunnels, Traps)",
        description:
          "Zwerge können unterirdisch Neigungen, neue Tunnel, gleitende Wände und Steinmechanismen auf einer 1-5 auf W6 erkennen. Diese Fähigkeit erfordert Konzentration.",
        description_en:
          "Dwarves can detect underground slopes, new tunnels, sliding walls, and stone mechanisms on a 1-5 on d6. This ability requires concentration.",
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
        description:
          "Gnome können im Dunkeln bis zu 18 m weit sehen, indem sie Wärmestrahlung wahrnehmen. Diese Fähigkeit stammt von ihrem unterirdischen Erbe.",
        description_en:
          "Gnomes can see in the dark up to 18 meters by perceiving heat radiation. This ability stems from their subterranean heritage.",
      },
      {
        name: "Rettungswurf-Bonus gegen Magie (+1 pro 3,5 CON)",
        name_en: "Saving Throw Bonus vs. Magic (+1 per 3.5 CON)",
        description:
          "Gnome erhalten einen Bonus auf Rettungswürfe gegen Stäbe, Ruten, Zepter, Zauberstäbe und Zauber. Der Bonus beträgt +1 pro 3,5 Punkte Konstitution.",
        description_en:
          "Gnomes receive a bonus to saving throws vs. rods, staves, wands, and spells. The bonus is +1 per 3.5 points of Constitution.",
      },
      {
        name: "+1 Treffer gegen Kobolde und Goblins",
        name_en: "+1 Hit vs. Kobolds and Goblins",
        description:
          "Gnome erhalten +1 auf Trefferwürfe gegen Kobolde und Goblins aufgrund ihrer langen Feindschaft und speziellen Kampfausbildung gegen diese Kreaturen.",
        description_en:
          "Gnomes gain +1 to attack rolls against kobolds and goblins due to their long enmity and special combat training against these creatures.",
      },
      {
        name: "Große Gegner (Oger, Trolle) haben -4 auf Angriffe",
        name_en: "Large Opponents (Ogres, Trolls) Suffer -4 to Attack",
        description:
          "Gnome sind kleine Ziele. Große humanoide Gegner wie Oger, Trolle, Oger-Magier und Riesen erleiden -4 auf ihre Trefferwürfe gegen Gnome.",
        description_en:
          "Gnomes are small targets. Large humanoid opponents such as ogres, trolls, ogre magi, and giants suffer -4 to their attack rolls against gnomes.",
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
        description:
          "Halblinge können im Dunkeln bis zu 9 m weit sehen, indem sie Wärmestrahlung wahrnehmen.",
        description_en:
          "Halflings can see in the dark up to 9 meters by perceiving heat radiation.",
      },
      {
        name: "Rettungswurf-Bonus gegen Gift und Magie (+1 pro 3,5 CON)",
        name_en: "Saving Throw Bonus vs. Poison and Magic (+1 per 3.5 CON)",
        description:
          "Halblinge erhalten einen Bonus auf Rettungswürfe gegen Gift, Stäbe, Ruten, Zepter, Zauberstäbe und Zauber. Der Bonus beträgt +1 pro 3,5 Punkte Konstitution.",
        description_en:
          "Halflings receive a bonus to saving throws vs. poison, rods, staves, wands, and spells. The bonus is +1 per 3.5 points of Constitution.",
      },
      {
        name: "+1 Treffer mit Schleudern und Wurfwaffen",
        name_en: "+1 Hit with Slings and Thrown Weapons",
        description:
          "Halblinge sind natürliche Schützen und erhalten +1 auf Trefferwürfe mit Schleudern und allen Wurfwaffen. Diese Fähigkeit ist angeboren und stapelt mit anderen Boni.",
        description_en:
          "Halflings are natural marksmen and gain +1 to attack rolls with slings and all thrown weapons. This innate ability stacks with other bonuses.",
      },
      {
        name: "Überraschungsbonus: -4 auf feindliche Überraschungswürfe",
        name_en: "Surprise Bonus: -4 to Enemy Surprise Rolls",
        description:
          "Halblinge sind so leise und unauffällig, dass Gegner -4 auf ihre Überraschungswürfe erleiden, wenn der Halbling allein oder nur mit anderen Halblingen/Elfen unterwegs ist.",
        description_en:
          "Halflings are so quiet and inconspicuous that enemies suffer -4 to their surprise rolls when the halfling is alone or accompanied only by other halflings or elves.",
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
        description:
          "Halb-Orks können im Dunkeln bis zu 18 m weit sehen, indem sie Wärmestrahlung wahrnehmen. Dieses Erbe stammt von ihrem orkischen Elternteil.",
        description_en:
          "Half-orcs can see in the dark up to 18 meters by perceiving heat radiation. This heritage comes from their orcish parent.",
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
        description:
          "Kobolde können im Dunkeln bis zu 18 m weit sehen, indem sie Wärmestrahlung wahrnehmen. Diese Fähigkeit stammt von ihrem unterirdischen Lebensraum.",
        description_en:
          "Kobolds can see in the dark up to 18 meters by perceiving heat radiation. This ability stems from their subterranean habitat.",
      },
      {
        name: "Zuletzt angegriffen",
        name_en: "Attacked Last",
        description:
          "Feinde unterschätzen Kobolde und betrachten sie als vernachlässigbare Bedrohung. Dadurch werden Kobolde im Kampf zuletzt angegriffen.",
        description_en:
          "Enemies dismiss kobolds as negligible threats, attacking them last in combat.",
      },
      {
        name: "Unterirdische Erkennung",
        name_en: "Mining Detection",
        description:
          "Kobolde können unterirdisch gleitende Wände, Neigungen und neue Konstruktionen erkennen, ähnlich wie Zwerge. Diese Fähigkeit erfordert Konzentration.",
        description_en:
          "Kobolds can detect underground features such as sliding walls, slopes, and new construction, similar to dwarves. This ability requires concentration.",
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
        description:
          "Tieflinge können im Dunkeln bis zu 18 m weit sehen, indem sie Wärmestrahlung wahrnehmen. Dieses Erbe stammt von ihren fiendischen Vorfahren.",
        description_en:
          "Tieflings can see in the dark up to 18 meters by perceiving heat radiation. This heritage comes from their fiendish ancestors.",
      },
      {
        name: "Kälteresistenz (halber Schaden)",
        name_en: "Cold Resistance (Half Damage)",
        description:
          "Tieflinge erleiden nur halben Schaden durch kältebasierte Angriffe. Diese Resistenz ist angeboren und gilt für alle Kältequellen.",
        description_en:
          "Tieflings suffer only half damage from cold-based attacks. This resistance is innate and applies to all cold sources.",
      },
      {
        name: "Feuerresistenz (halber Schaden)",
        name_en: "Fire Resistance (Half Damage)",
        description:
          "Tieflinge erleiden nur halben Schaden durch feuerbasierte Angriffe. Diese Resistenz ist angeboren und gilt für alle Feuerquellen.",
        description_en:
          "Tieflings suffer only half damage from fire-based attacks. This resistance is innate and applies to all fire sources.",
      },
      {
        name: "Elektrizitätsresistenz (halber Schaden)",
        name_en: "Electricity Resistance (Half Damage)",
        description:
          "Tieflinge erleiden nur halben Schaden durch elektrische Angriffe. Diese Resistenz ist angeboren und gilt für alle elektrischen Quellen.",
        description_en:
          "Tieflings suffer only half damage from electrical attacks. This resistance is innate and applies to all electrical sources.",
      },
      {
        name: "Dunkelheit, 4,5 m Radius (1x pro Tag)",
        name_en: "Darkness, 15' Radius (1x per Day)",
        description:
          "Tieflinge können einmal pro Tag den Zauber Dunkelheit, 4,5 m Radius als angeborene Fähigkeit wirken. Dies erzeugt eine Sphäre magischer Dunkelheit.",
        description_en:
          "Tieflings can cast Darkness, 15' Radius once per day as an innate ability. This creates a sphere of magical darkness.",
        usesPerDay: 1,
      },
      {
        name: "-2 Reaktionsmalus",
        name_en: "-2 Reaction Penalty",
        description:
          "Aufgrund ihres fiendischen Erbes erleiden Tieflinge einen -2 Malus auf Reaktionswürfe bei NPC-Begegnungen. Ihre unheimliche Erscheinung löst Misstrauen aus.",
        description_en:
          "Due to their fiendish heritage, tieflings suffer a -2 penalty to reaction rolls during NPC encounters. Their unsettling appearance provokes distrust.",
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
