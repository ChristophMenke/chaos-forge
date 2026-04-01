import type { ClassId, ClassGroup, AbilityName, ClassAbility } from "./types";

export interface ClassDefinition {
  id: ClassId;
  name: string;
  name_en: string;
  group: ClassGroup;
  hitDie: number; // e.g. 10 for d10
  abilityRequirements: Partial<Record<AbilityName, number>>;
  primeRequisites: AbilityName[];
  exceptionalStrength: boolean; // only warrior group
  classAbilities: ClassAbility[];
}

export const CLASSES: Record<ClassId, ClassDefinition> = {
  fighter: {
    id: "fighter",
    name: "Kämpfer",
    name_en: "Fighter",
    group: "warrior",
    hitDie: 10,
    abilityRequirements: { str: 9 },
    primeRequisites: ["str"],
    exceptionalStrength: true,
    classAbilities: [
      {
        name: "Waffenspezialisierung",
        name_en: "Weapon Specialization",
        description:
          "Nur Kämpfer können sich auf eine Waffe spezialisieren: +1 Treffer, +2 Schaden im Nahkampf. Kostet 2 Fertigkeitsslots (Nahkampf/Armbrust) bzw. 3 Slots (Bögen). Spezialisierte Nahkämpfer erhalten 3/2 Angriffe ab Stufe 1, 2/1 ab Stufe 7, 5/2 ab Stufe 13.",
        description_en:
          "Only fighters can specialize in a weapon: +1 to hit, +2 to damage in melee. Costs 2 proficiency slots (melee/crossbow) or 3 slots (bows). Specialized melee fighters gain 3/2 attacks from level 1, 2/1 from level 7, 5/2 from level 13.",
      },
      {
        name: "Mehrfachangriffe",
        name_en: "Multiple Attacks",
        description:
          "Alle Krieger erhalten Mehrfachangriffe mit Nahkampfwaffen: 1/Runde (Stufe 1–6), 3/2 (Stufe 7–12), 2/Runde (Stufe 13+). Fernkampfwaffen sind ausgenommen.",
        description_en:
          "All warriors gain extra melee attacks: 1/round (levels 1–6), 3/2 (levels 7–12), 2/round (levels 13+). Ranged weapons are excluded.",
      },
      {
        name: "Ausnahmestärke",
        name_en: "Exceptional Strength",
        description:
          "Krieger mit STR 18 würfeln Ausnahmestärke (18/01–18/00). Dies gewährt bis zu +3 Treffer, +6 Schaden und 152 kg Tragkraft (18/00). Nur für Krieger-Klassen verfügbar.",
        description_en:
          "Warriors with STR 18 roll exceptional strength (18/01–18/00), granting up to +3 to hit, +6 to damage, and 152 kg weight allowance (at 18/00). Only available to warrior classes.",
      },
      {
        name: "Gefolgsleute ab Stufe 9",
        name_en: "Followers from Level 9",
        description:
          "Ab Stufe 9 zieht der Kämpfer automatisch Soldaten und einen Leutnant an, sofern er eine Burg oder ein Anwesen besitzt.",
        description_en:
          "At 9th level, the fighter automatically attracts soldiers and a lieutenant, provided he owns a castle or freehold.",
      },
    ],
  },
  ranger: {
    id: "ranger",
    name: "Waldläufer",
    name_en: "Ranger",
    group: "warrior",
    hitDie: 10,
    abilityRequirements: { str: 13, dex: 13, con: 14, wis: 14 },
    primeRequisites: ["str", "dex", "wis"],
    exceptionalStrength: true,
    classAbilities: [
      {
        name: "Erzfeind (+4 Angriff)",
        name_en: "Species Enemy (+4 Attack)",
        description:
          "Der Waldläufer wählt eine Kreaturenart als Erzfeind und erhält +4 auf Angriffswürfe gegen diese. Allerdings erleidet er −4 auf Reaktionswürfe bei Begegnungen mit dieser Art und bevorzugt sie im Kampf.",
        description_en:
          "The ranger selects a species enemy and gains +4 to attack rolls against it. However, he suffers −4 to encounter reaction rolls with that species and will pursue it in combat above other foes.",
      },
      {
        name: "Fährtensuche",
        name_en: "Tracking",
        description:
          "Waldläufer erhalten die Fertigkeit Fährtensuche kostenlos und verbessern sich um +1 pro 3 Stufen. Die Chance wird durch Gelände, Wetter und Alter der Spur modifiziert.",
        description_en:
          "Rangers receive the Tracking proficiency for free and improve by +1 per 3 levels. The chance is modified by terrain, weather, and age of the trail.",
      },
      {
        name: "Zwei-Waffen-Kampf",
        name_en: "Two-Weapon Fighting",
        description:
          "Waldläufer können mit zwei Waffen gleichzeitig kämpfen, ohne den üblichen Angriffsmalus zu erleiden. Gilt nur in Lederrüstung oder leichterer Rüstung.",
        description_en:
          "Rangers can fight with two weapons without the usual attack penalties. Only applies when wearing studded leather or lighter armor.",
      },
      {
        name: "Verstecken & Schleichen",
        name_en: "Hide in Shadows & Move Silently",
        description:
          "In natürlicher Umgebung können Waldläufer sich verbergen und lautlos bewegen (wie ein Dieb). In unnatürlicher Umgebung (Krypta, Stadt) halbiert sich die Chance.",
        description_en:
          "In natural surroundings, rangers can hide in shadows and move silently (as a thief). In non-natural settings (crypt, city), the chance is halved.",
      },
      {
        name: "Druidenzauber ab Stufe 8",
        name_en: "Druid Spells from Level 8",
        description:
          "Ab Stufe 8 erhält der Waldläufer Priester-Zauber aus den Sphären Pflanze, Tier und Elementar. Kein Weisheitsbonus auf Zauberplätze; keine Schriftrollen nutzbar.",
        description_en:
          "From level 8, the ranger gains priest spells from the Plant, Animal, and Elemental spheres. No Wisdom bonus slots; cannot use clerical scrolls.",
      },
      {
        name: "Tierempathie",
        name_en: "Animal Empathy",
        description:
          "Domestizierte Tiere werden automatisch beruhigt. Wilde Tiere müssen einen Rettungswurf gegen Stäbe bestehen (−1 pro 3 Waldläufer-Stufen), sonst wird ihre Reaktion um eine Kategorie verschoben.",
        description_en:
          "Domestic animals are calmed automatically. Wild animals must save vs. rods at −1 per 3 ranger levels, or their reaction shifts one category.",
      },
    ],
  },
  paladin: {
    id: "paladin",
    name: "Paladin",
    name_en: "Paladin",
    group: "warrior",
    hitDie: 10,
    abilityRequirements: { str: 12, con: 9, wis: 13, cha: 17 },
    primeRequisites: ["str", "cha"],
    exceptionalStrength: true,
    classAbilities: [
      {
        name: "Böses erkennen (18 m Radius)",
        name_en: "Detect Evil (18 m Radius)",
        description:
          "Durch Konzentration kann der Paladin die Anwesenheit und Richtung von Bösem im Umkreis von 18 m erspüren. Jeder Versuch kostet 1 Runde; beliebig oft einsetzbar.",
        description_en:
          "By concentrating, the paladin can detect the presence and direction of evil within 18 m. Each attempt takes 1 round; may be used as often as desired.",
      },
      {
        name: "Handauflegen (2 TP/Stufe, 1×/Tag)",
        name_en: "Lay on Hands (2 HP/Level, 1/Day)",
        description:
          "Einmal pro Tag kann der Paladin durch Handauflegen 2 Trefferpunkte pro Erfahrungsstufe heilen. Die gesamte Heilung muss an einer Person auf einmal angewandt werden.",
        description_en:
          "Once per day, the paladin can heal 2 hit points per experience level by laying on hands. All healing must be applied to one person at once.",
        usesPerDay: 1,
      },
      {
        name: "Immun gegen Krankheiten",
        name_en: "Immune to Disease",
        description:
          "Paladine sind immun gegen alle Formen von Krankheit. Hinweis: Lykanthropie und Mumienfäule gelten als Flüche, nicht als Krankheiten.",
        description_en:
          "Paladins are immune to all forms of disease. Note: Lycanthropy and mummy rot are curses, not diseases.",
      },
      {
        name: "+2 auf alle Rettungswürfe",
        name_en: "+2 to All Saving Throws",
        description: "Der Paladin erhält einen Bonus von +2 auf alle Rettungswürfe.",
        description_en: "The paladin receives a +2 bonus to all saving throws.",
      },
      {
        name: "Schutzaura (3 m Radius)",
        name_en: "Protection Aura (3 m Radius)",
        description:
          "Beschworene und spezifisch böse Kreaturen erleiden −1 auf Angriffswürfe innerhalb eines 3-m-Radius um den Paladin.",
        description_en:
          "Summoned and specifically evil creatures suffer −1 to attack rolls within a 3 m radius of the paladin.",
      },
      {
        name: "Untote vertreiben ab Stufe 3",
        name_en: "Turn Undead from Level 3",
        description:
          "Ab Stufe 3 kann der Paladin Untote vertreiben wie ein Kleriker zwei Stufen niedriger (z.B. Stufe 3 = Kleriker Stufe 1). Wirkt auch gegen Teufel und Dämonen.",
        description_en:
          "From level 3, the paladin turns undead as a cleric two levels lower (e.g., level 3 = cleric level 1). Also affects devils and demons.",
      },
      {
        name: "Krankheit heilen (1×/Woche pro 5 Stufen)",
        name_en: "Cure Disease (1/Week per 5 Levels)",
        description:
          "Einmal pro Woche pro 5 Stufen kann der Paladin Krankheit heilen (1×/Woche auf Stufe 1–5, 2×/Woche auf Stufe 6–10 usw.).",
        description_en:
          "Once per week per 5 levels, the paladin can cure disease (1/week at levels 1–5, 2/week at levels 6–10, etc.).",
      },
      {
        name: "Klerikerzauber ab Stufe 9",
        name_en: "Cleric Spells from Level 9",
        description:
          "Ab Stufe 9 erhält der Paladin Priester-Zauber aus den Sphären Kampf, Erkenntnis, Heilung und Schutz. Kein Weisheitsbonus; keine Schriftrollen. Zauberstufe = Paladinenstufe − 8.",
        description_en:
          "From level 9, the paladin gains priest spells from the Combat, Divination, Healing, and Protective spheres. No Wisdom bonus; cannot use scrolls. Casting level = paladin level − 8.",
      },
    ],
  },
  mage: {
    id: "mage",
    name: "Magier",
    name_en: "Mage",
    group: "wizard",
    hitDie: 4,
    abilityRequirements: { int: 9 },
    primeRequisites: ["int"],
    exceptionalStrength: false,
    classAbilities: [
      {
        name: "Zauber aus allen 8 Schulen",
        name_en: "Spells from All 8 Schools",
        description:
          "Als Generalist kann der Magier Zauber aus allen acht Magieschulen erlernen und wirken. Er erhält keinen Bonus-Zauberplatz wie Spezialisten. Lernchance hängt von INT ab (INT 9 = 35%, INT 18 = 85%).",
        description_en:
          "As a generalist, the mage can learn and cast spells from all eight schools of magic. No bonus spell slot like specialists. Learn chance depends on INT (INT 9 = 35%, INT 18 = 85%).",
      },
      {
        name: "Zauberbuch & Schriftrollenherstellung",
        name_en: "Spellbook & Scroll Creation",
        description:
          "Magier notieren ihre Zauber in einem Zauberbuch und müssen neue Zauber erforschen oder von Schriftrollen kopieren. Ab Stufe 9 können sie Schriftrollen und magische Gegenstände herstellen.",
        description_en:
          "Mages record spells in a spellbook and must research new spells or copy them from scrolls. From level 9, they can create scrolls and magical items.",
      },
    ],
  },
  abjurer: {
    id: "abjurer",
    name: "Bannzauberer",
    name_en: "Abjurer",
    group: "wizard",
    hitDie: 4,
    abilityRequirements: { int: 9, wis: 15 },
    primeRequisites: ["int"],
    exceptionalStrength: false,
    classAbilities: [
      {
        name: "+1 Zauberplatz pro Stufe (Bannzauber)",
        name_en: "+1 Spell Slot per Level (Abjuration)",
        description:
          "Ein zusätzlicher Zauberplatz pro Zauberstufe, nur für Bannzauber. +15% Lernchance für Bannzauber, −15% für andere Schulen. +1 auf eigene Rettungswürfe gegen Bannzauber, Gegner erleiden −1.",
        description_en:
          "One extra spell slot per spell level, abjuration only. +15% learn chance for abjuration, −15% for other schools. +1 to own saves vs. abjuration, enemies suffer −1.",
      },
      {
        name: "Verbotene Schulen: Verwandlung, Illusion",
        name_en: "Forbidden Schools: Alteration, Illusion",
        description:
          "Bannzauberer können keine Zauber aus Verwandlung und Illusion erlernen oder wirken. Benötigt WIS 15 zusätzlich zu INT 9.",
        description_en:
          "Abjurers cannot learn or cast spells from Alteration and Illusion. Requires WIS 15 in addition to INT 9.",
      },
    ],
  },
  conjurer: {
    id: "conjurer",
    name: "Beschwörer",
    name_en: "Conjurer",
    group: "wizard",
    hitDie: 4,
    abilityRequirements: { int: 9, con: 15 },
    primeRequisites: ["int"],
    exceptionalStrength: false,
    classAbilities: [
      {
        name: "+1 Zauberplatz pro Stufe (Beschwörung)",
        name_en: "+1 Spell Slot per Level (Conjuration)",
        description:
          "Ein zusätzlicher Zauberplatz pro Zauberstufe, nur für Beschwörungszauber. +15% Lernchance für Beschwörung, −15% für andere Schulen. +1 auf Rettungswürfe gegen Beschwörung, Gegner −1.",
        description_en:
          "One extra spell slot per spell level, conjuration only. +15% learn chance for conjuration, −15% for other schools. +1 to saves vs. conjuration, enemies −1.",
      },
      {
        name: "Verbotene Schulen: Erkenntnis, Anrufung",
        name_en: "Forbidden Schools: Greater Divination, Invocation",
        description:
          "Beschwörer können keine Zauber aus Erkenntnis (höhere) und Anrufung erlernen oder wirken. Benötigt KON 15 zusätzlich zu INT 9.",
        description_en:
          "Conjurers cannot learn or cast spells from Greater Divination and Invocation. Requires CON 15 in addition to INT 9.",
      },
    ],
  },
  diviner: {
    id: "diviner",
    name: "Seher",
    name_en: "Diviner",
    group: "wizard",
    hitDie: 4,
    abilityRequirements: { int: 9, wis: 16 },
    primeRequisites: ["int"],
    exceptionalStrength: false,
    classAbilities: [
      {
        name: "+1 Zauberplatz pro Stufe (Erkenntnis)",
        name_en: "+1 Spell Slot per Level (Divination)",
        description:
          "Ein zusätzlicher Zauberplatz pro Zauberstufe, nur für Erkenntniszauber. +15% Lernchance für Erkenntnis, −15% für andere Schulen. +1 auf Rettungswürfe gegen Erkenntnis, Gegner −1.",
        description_en:
          "One extra spell slot per spell level, divination only. +15% learn chance for divination, −15% for other schools. +1 to saves vs. divination, enemies −1.",
      },
      {
        name: "Verbotene Schule: Beschwörung",
        name_en: "Forbidden School: Conjuration",
        description:
          "Seher haben nur eine verbotene Schule (Beschwörung) statt zwei. Benötigt WIS 16 zusätzlich zu INT 9.",
        description_en:
          "Diviners have only one forbidden school (Conjuration) instead of two. Requires WIS 16 in addition to INT 9.",
      },
    ],
  },
  enchanter: {
    id: "enchanter",
    name: "Verzauberer",
    name_en: "Enchanter",
    group: "wizard",
    hitDie: 4,
    abilityRequirements: { int: 9, cha: 16 },
    primeRequisites: ["int"],
    exceptionalStrength: false,
    classAbilities: [
      {
        name: "+1 Zauberplatz pro Stufe (Verzauberung)",
        name_en: "+1 Spell Slot per Level (Enchantment)",
        description:
          "Ein zusätzlicher Zauberplatz pro Zauberstufe, nur für Verzauberungszauber. +15% Lernchance für Verzauberung, −15% für andere Schulen. +1 auf Rettungswürfe gegen Verzauberung, Gegner −1.",
        description_en:
          "One extra spell slot per spell level, enchantment only. +15% learn chance for enchantment, −15% for other schools. +1 to saves vs. enchantment, enemies −1.",
      },
      {
        name: "Verbotene Schulen: Anrufung, Nekromantie",
        name_en: "Forbidden Schools: Invocation, Necromancy",
        description:
          "Verzauberer können keine Zauber aus Anrufung und Nekromantie erlernen oder wirken. Benötigt CHA 16 zusätzlich zu INT 9.",
        description_en:
          "Enchanters cannot learn or cast spells from Invocation and Necromancy. Requires CHA 16 in addition to INT 9.",
      },
    ],
  },
  illusionist: {
    id: "illusionist",
    name: "Illusionist",
    name_en: "Illusionist",
    group: "wizard",
    hitDie: 4,
    abilityRequirements: { int: 9, dex: 16 },
    primeRequisites: ["int"],
    exceptionalStrength: false,
    classAbilities: [
      {
        name: "+1 Zauberplatz pro Stufe (Illusion)",
        name_en: "+1 Spell Slot per Level (Illusion)",
        description:
          "Ein zusätzlicher Zauberplatz pro Zauberstufe, nur für Illusionszauber. +15% Lernchance für Illusionen, −15% für andere Schulen. +1 auf Rettungswürfe gegen Illusionen, Gegner −1.",
        description_en:
          "One extra spell slot per spell level, illusion only. +15% learn chance for illusion, −15% for other schools. +1 to saves vs. illusion, enemies −1.",
      },
      {
        name: "Verbotene Schulen: Nekromantie, Anrufung, Bannzauber",
        name_en: "Forbidden Schools: Necromancy, Invocation, Abjuration",
        description:
          "Illusionisten haben drei verbotene Schulen — mehr als jeder andere Spezialist. Benötigt DEX 16 zusätzlich zu INT 9.",
        description_en:
          "Illusionists have three forbidden schools — more than any other specialist. Requires DEX 16 in addition to INT 9.",
      },
    ],
  },
  invoker: {
    id: "invoker",
    name: "Anrufer",
    name_en: "Invoker",
    group: "wizard",
    hitDie: 4,
    abilityRequirements: { int: 9, con: 16 },
    primeRequisites: ["int"],
    exceptionalStrength: false,
    classAbilities: [
      {
        name: "+1 Zauberplatz pro Stufe (Anrufung)",
        name_en: "+1 Spell Slot per Level (Invocation)",
        description:
          "Ein zusätzlicher Zauberplatz pro Zauberstufe, nur für Anrufungszauber. +15% Lernchance für Anrufung, −15% für andere Schulen. +1 auf Rettungswürfe gegen Anrufung, Gegner −1.",
        description_en:
          "One extra spell slot per spell level, invocation only. +15% learn chance for invocation, −15% for other schools. +1 to saves vs. invocation, enemies −1.",
      },
      {
        name: "Verbotene Schulen: Verzauberung, Beschwörung",
        name_en: "Forbidden Schools: Enchantment, Conjuration",
        description:
          "Anrufer können keine Zauber aus Verzauberung und Beschwörung erlernen oder wirken. Benötigt KON 16 zusätzlich zu INT 9.",
        description_en:
          "Invokers cannot learn or cast spells from Enchantment and Conjuration. Requires CON 16 in addition to INT 9.",
      },
    ],
  },
  necromancer: {
    id: "necromancer",
    name: "Nekromant",
    name_en: "Necromancer",
    group: "wizard",
    hitDie: 4,
    abilityRequirements: { int: 9, wis: 16 },
    primeRequisites: ["int"],
    exceptionalStrength: false,
    classAbilities: [
      {
        name: "+1 Zauberplatz pro Stufe (Nekromantie)",
        name_en: "+1 Spell Slot per Level (Necromancy)",
        description:
          "Ein zusätzlicher Zauberplatz pro Zauberstufe, nur für Nekromantie-Zauber. +15% Lernchance für Nekromantie, −15% für andere Schulen. +1 auf Rettungswürfe gegen Nekromantie, Gegner −1.",
        description_en:
          "One extra spell slot per spell level, necromancy only. +15% learn chance for necromancy, −15% for other schools. +1 to saves vs. necromancy, enemies −1.",
      },
      {
        name: "Verbotene Schulen: Illusion, Verzauberung",
        name_en: "Forbidden Schools: Illusion, Enchantment",
        description:
          "Nekromanten können keine Zauber aus Illusion und Verzauberung erlernen oder wirken. Benötigt WIS 16 zusätzlich zu INT 9.",
        description_en:
          "Necromancers cannot learn or cast spells from Illusion and Enchantment. Requires WIS 16 in addition to INT 9.",
      },
    ],
  },
  transmuter: {
    id: "transmuter",
    name: "Verwandler",
    name_en: "Transmuter",
    group: "wizard",
    hitDie: 4,
    abilityRequirements: { int: 9, dex: 15 },
    primeRequisites: ["int"],
    exceptionalStrength: false,
    classAbilities: [
      {
        name: "+1 Zauberplatz pro Stufe (Verwandlung)",
        name_en: "+1 Spell Slot per Level (Alteration)",
        description:
          "Ein zusätzlicher Zauberplatz pro Zauberstufe, nur für Verwandlungszauber. +15% Lernchance für Verwandlung, −15% für andere Schulen. +1 auf Rettungswürfe gegen Verwandlung, Gegner −1.",
        description_en:
          "One extra spell slot per spell level, alteration only. +15% learn chance for alteration, −15% for other schools. +1 to saves vs. alteration, enemies −1.",
      },
      {
        name: "Verbotene Schulen: Bannzauber, Nekromantie",
        name_en: "Forbidden Schools: Abjuration, Necromancy",
        description:
          "Verwandler können keine Zauber aus Bannzauber und Nekromantie erlernen oder wirken. Benötigt DEX 15 zusätzlich zu INT 9.",
        description_en:
          "Transmuters cannot learn or cast spells from Abjuration and Necromancy. Requires DEX 15 in addition to INT 9.",
      },
    ],
  },
  cleric: {
    id: "cleric",
    name: "Kleriker",
    name_en: "Cleric",
    group: "priest",
    hitDie: 8,
    abilityRequirements: { wis: 9 },
    primeRequisites: ["wis"],
    exceptionalStrength: false,
    classAbilities: [
      {
        name: "Untote vertreiben",
        name_en: "Turn Undead",
        description:
          "Kleriker können Untote vertreiben oder vernichten. Stufe 1 vertreibt Skelette (10+), Stufe 3 vertreibt Ghule, Stufe 5 vertreibt Schatten. Ab Stufe 9 werden schwache Untote automatisch vernichtet (D).",
        description_en:
          "Clerics can turn or destroy undead. Level 1 turns Skeletons (10+), level 3 turns Ghouls, level 5 turns Shadows. From level 9, weak undead are automatically destroyed (D).",
      },
      {
        name: "Alle Rüstungen, nur stumpfe Waffen",
        name_en: "All Armor, Blunt Weapons Only",
        description:
          "Kleriker dürfen jede Art von Rüstung und Schild tragen. Als Waffen sind nur stumpfe erlaubt: Streitkolben, Flegel, Kriegshammer, Kampfstab und Schleuder.",
        description_en:
          "Clerics may wear any armor and shield. Weapons are restricted to blunt types: mace, flail, war hammer, quarterstaff, and sling.",
      },
      {
        name: "Göttliche Zauber ab Stufe 1",
        name_en: "Divine Spells from Level 1",
        description:
          "Kleriker erhalten Zauber durch Gebet — kein Zauberbuch nötig. Zugang zu allen Zaubern ihrer Stufe aus den Sphären All, Astral, Charm, Combat, Creation, Divination, Guardian, Healing, Necromantic, Protection, Summoning, Sun.",
        description_en:
          "Clerics receive spells through prayer — no spellbook needed. Access to all spells of their level from the spheres All, Astral, Charm, Combat, Creation, Divination, Guardian, Healing, Necromantic, Protection, Summoning, Sun.",
      },
    ],
  },
  crusader: {
    id: "crusader",
    name: "Kreuzritter",
    name_en: "Crusader",
    group: "priest", // PO:S&M: priest group — saves, APR, spell slots as priest; only THAC0 uses warrior rate
    hitDie: 8,
    abilityRequirements: { wis: 9, str: 12, cha: 12 },
    primeRequisites: ["wis", "str"],
    // PO:S&M: Crusader is priest group — no exceptional strength despite warrior-like THAC0
    exceptionalStrength: false,
    classAbilities: [
      {
        name: "Krieger-ETW0-Progression",
        name_en: "Warrior THAC0 Progression",
        description:
          "Der ETW0 des Kreuzritters verbessert sich mit der Rate eines Kriegers (1 pro Stufe) statt der eines Priesters.",
        description_en:
          "The crusader's THAC0 improves at the warrior's rate of 1 per level instead of the priest's rate.",
      },
      {
        name: "Alle Waffen und Rüstungen",
        name_en: "All Weapons and Armor",
        description:
          "Kreuzritter dürfen jede Art von Waffe, Rüstung und Schild verwenden — anders als normale Priester, die auf stumpfe Waffen beschränkt sind.",
        description_en:
          "Crusaders may use any weapon, armor, and shield — unlike regular priests who are restricted to blunt weapons.",
      },
      {
        name: "Last erleichtern (ab Stufe 3)",
        name_en: "Lighten Load (from Level 3)",
        description:
          "Einmal pro Tag kann der Kreuzritter das Gewicht der Ausrüstung einer Gruppe für einen Tag halbieren.",
        description_en:
          "Once per day, the crusader can halve the weight of a party's equipment for one day.",
        usesPerDay: 1,
      },
      {
        name: "Eilmarsch (ab Stufe 7)",
        name_en: "Easy March (from Level 7)",
        description:
          "Einmal pro Woche kann der Kreuzritter einer kleinen Gruppe einen Gewaltmarsch ohne Erschöpfung ermöglichen.",
        description_en:
          "Once per week, the crusader can allow a small party to force march without accumulating fatigue.",
        usesPerDay: 1,
      },
      {
        name: "Kein Untote vertreiben",
        name_en: "No Turn Undead",
        description:
          "Kreuzritter können keine Untoten vertreiben oder befehligen. Stattdessen erhalten sie ihre Granted Powers.",
        description_en:
          "Crusaders cannot turn or command undead. Instead, they receive their granted powers.",
      },
    ],
  },
  druid: {
    id: "druid",
    name: "Druide",
    name_en: "Druid",
    group: "priest",
    hitDie: 8,
    abilityRequirements: { wis: 12, cha: 15 },
    primeRequisites: ["wis", "cha"],
    exceptionalStrength: false,
    classAbilities: [
      {
        name: "Gestaltwandel ab Stufe 7 (3×/Tag)",
        name_en: "Shapechange from Level 7 (3/Day)",
        description:
          "Ab Stufe 7 kann der Druide sich 3× täglich in ein natürliches Tier verwandeln — je einmal Reptil, Vogel, Säugetier. Jede Verwandlung heilt 1W6×10% des erlittenen Schadens. Ausrüstung verschmilzt mit der Tierform.",
        description_en:
          "From level 7, the druid can shapechange 3 times daily — once each into a reptile, bird, and mammal. Each transformation heals 1d6×10% of damage taken. Equipment melds into the animal form.",
      },
      {
        name: "Immunität gegen Feenverzauberung (ab Stufe 7)",
        name_en: "Immunity to Fey Charm (from Level 7)",
        description:
          "Ab Stufe 7 ist der Druide vollständig immun gegen Verzauberungszauber von Waldwesen wie Dryaden, Nixen und Sylphen.",
        description_en:
          "From level 7, the druid is completely immune to charm spells from woodland creatures such as dryads, nixies, and sylphs.",
      },
      {
        name: "Nur Lederrüstung & Holzschild",
        name_en: "Leather Armor & Wooden Shield Only",
        description:
          "Druiden dürfen nur Lederrüstung und Holzschilde tragen. Erlaubte Waffen: Keule, Sichel, Wurfpfeil, Speer, Dolch, Krummsäbel, Schleuder, Kampfstab.",
        description_en:
          "Druids may only wear leather armor and wooden shields. Allowed weapons: club, sickle, dart, spear, dagger, scimitar, sling, quarterstaff.",
      },
      {
        name: "Druidensprache & Waldwissen",
        name_en: "Druidic Language & Woodland Lore",
        description:
          "Druiden lernen eine geheime Sprache (darf Nicht-Druiden nicht beigebracht werden). Ab Stufe 3 können sie sich ungehindert durch natürliches Dickicht bewegen, hinterlassen keine Spuren und identifizieren Tiere, Pflanzen und reines Wasser fehlerfrei.",
        description_en:
          "Druids learn a secret language (forbidden to teach to non-druids). From level 3, they can move unhindered through natural undergrowth, leave no tracks, and identify animals, plants, and pure water without fail.",
      },
    ],
  },
  thief: {
    id: "thief",
    name: "Dieb",
    name_en: "Thief",
    group: "rogue",
    hitDie: 6,
    abilityRequirements: { dex: 9 },
    primeRequisites: ["dex"],
    exceptionalStrength: false,
    classAbilities: [
      {
        name: "Diebesfähigkeiten (7 Fertigkeiten)",
        name_en: "Thief Skills (7 Abilities)",
        description:
          "Sieben Grundfertigkeiten ab Stufe 1: Taschen leeren (15%), Schlösser öffnen (10%), Fallen finden/entschärfen (5%), Lautlos bewegen (10%), Im Schatten verbergen (5%), Geräusche hören (15%), Mauern erklimmen (60%). Basiswerte steigen pro Stufe; modifiziert durch DEX und Rasse.",
        description_en:
          "Seven base skills from level 1: Pick Pockets (15%), Open Locks (10%), Find/Remove Traps (5%), Move Silently (10%), Hide in Shadows (5%), Detect Noise (15%), Climb Walls (60%). Base values increase per level; modified by DEX and race.",
      },
      {
        name: "Hinterhältiger Angriff (Backstab)",
        name_en: "Backstab",
        description:
          "Bei einem Angriff von hinten auf ein ahnungsloses Ziel wird der Schaden vervielfacht: ×2 (Stufe 1–4), ×3 (Stufe 5–8), ×4 (Stufe 9–12), ×5 (Stufe 13+). Zusätzlich +4 auf den Angriffswurf. Gilt nur für den ersten Angriff.",
        description_en:
          "When attacking an unaware target from behind, damage is multiplied: ×2 (levels 1–4), ×3 (levels 5–8), ×4 (levels 9–12), ×5 (level 13+). Also +4 to the attack roll. Applies only to the first attack.",
      },
      {
        name: "Sprachen lesen ab Stufe 4",
        name_en: "Read Languages from Level 4",
        description:
          "Ab Stufe 4 kann der Dieb Texte in unbekannten Sprachen entziffern (Basiswert 20%). Gilt für geschriebene Texte, nicht für gesprochene Sprache oder magische Schriften.",
        description_en:
          "From level 4, the thief can decipher texts in unknown languages (base 20%). Applies to written texts, not spoken language or magical writings.",
      },
      {
        name: "Schriftrollen benutzen ab Stufe 10",
        name_en: "Use Scrolls from Level 10",
        description:
          "Ab Stufe 10 kann der Dieb Magier- und Priester-Schriftrollen verwenden. Bei einem Fehlschlag (25% Chance) wird der Zaubereffekt verdreht oder umgekehrt.",
        description_en:
          "From level 10, the thief can use wizard and priest scrolls. On failure (25% chance), the spell effect is twisted or reversed.",
      },
      {
        name: "Nur Lederrüstung",
        name_en: "Leather Armor Only",
        description:
          "Diebe sind auf Lederrüstung beschränkt (kein Schild). Schwerere Rüstung verhindert die Nutzung aller Diebesfähigkeiten. Elfische Kettenhemden sind eine Ausnahme.",
        description_en:
          "Thieves are restricted to leather armor (no shield). Heavier armor prevents use of all thief skills. Elven chain mail is an exception.",
      },
    ],
  },
  bard: {
    id: "bard",
    name: "Barde",
    name_en: "Bard",
    group: "rogue",
    hitDie: 6,
    abilityRequirements: { dex: 12, int: 13, cha: 15 },
    primeRequisites: ["dex", "cha"],
    exceptionalStrength: false,
    classAbilities: [
      {
        name: "Bardenwissen (5%/Stufe)",
        name_en: "Bard Lore (5%/Level)",
        description:
          "5% Chance pro Stufe, Informationen über magische Gegenstände, legendäre Orte und berühmte Persönlichkeiten zu kennen. Stufe 10 = 50%, Stufe 20 = 100%.",
        description_en:
          "5% chance per level to know information about magical items, legendary places, and famous personalities. Level 10 = 50%, level 20 = 100%.",
      },
      {
        name: "Verbündete inspirieren / Gegengesang",
        name_en: "Inspire Allies / Counter Song",
        description:
          "Nach 3+ Runden Gesang erhalten Verbündete +1 auf Angriffswürfe, +1 auf Rettungswürfe oder +2 Moral. Reichweite: 3 m pro Stufe. Gegengesang: Im Umkreis von 9 m schützt das Lied gegen magische Lieder und Gedichte.",
        description_en:
          "After 3+ rounds of singing, allies gain +1 to attack rolls, +1 to saving throws, or +2 morale. Range: 3 m per level. Counter Song: within 9 m, protects against magical songs and verse-based attacks.",
      },
      {
        name: "Diebesfähigkeiten (reduziert)",
        name_en: "Thief Skills (Reduced)",
        description:
          "Barden beherrschen Diebesfähigkeiten auf reduziertem Niveau: Mauern erklimmen (50%), Geräusche hören (20%), Taschen leeren (10%), Sprachen lesen (5%). Basis + 20 frei verteilbare Punkte auf Stufe 1.",
        description_en:
          "Bards have thief skills at reduced levels: Climb Walls (50%), Detect Noise (20%), Pick Pockets (10%), Read Languages (5%). Base + 20 discretionary points at level 1.",
      },
      {
        name: "Magierzauber ab Stufe 2",
        name_en: "Wizard Spells from Level 2",
        description:
          "Ab Stufe 2 erhält der Barde Magierzauber aus einem Zauberbuch. Max. Zauberstufe 6. Schriftrollen nutzbar ab Stufe 10 (15% Fehlerchance). Rüstungsbeschränkung: Kettenhemd oder leichter, kein Schild.",
        description_en:
          "From level 2, the bard gains wizard spells from a spellbook. Max spell level 6. Scrolls usable from level 10 (15% failure chance). Armor restriction: chain mail or lighter, no shield.",
      },
    ],
  },
};

export function getClass(classId: ClassId): ClassDefinition {
  return CLASSES[classId];
}

export function getAllClasses(): ClassDefinition[] {
  return Object.values(CLASSES);
}

export function getClassGroup(classId: ClassId): ClassGroup {
  return CLASSES[classId].group;
}

export function meetsAbilityRequirements(
  classId: ClassId,
  abilities: Record<AbilityName, number>
): boolean {
  const reqs = CLASSES[classId].abilityRequirements;
  return Object.entries(reqs).every(
    ([ability, min]) => abilities[ability as AbilityName] >= (min as number)
  );
}

/** Returns specific ability requirement failures for a class */
export function getAbilityRequirementFailures(
  classId: ClassId,
  abilities: Record<AbilityName, number>
): { ability: AbilityName; required: number; actual: number }[] {
  const reqs = CLASSES[classId].abilityRequirements;
  return Object.entries(reqs)
    .filter(([ability, min]) => abilities[ability as AbilityName] < (min as number))
    .map(([ability, min]) => ({
      ability: ability as AbilityName,
      required: min as number,
      actual: abilities[ability as AbilityName],
    }));
}
