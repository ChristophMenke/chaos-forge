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
        name: "Waffenspezialisierung möglich",
        name_en: "Weapon Specialization",
        description:
          "Kämpfer können sich auf eine Waffe spezialisieren und erhalten +1 auf Treffer und +2 auf Schaden. Dies kostet einen zusätzlichen Waffenfertigkeits-Slot.",
        description_en:
          "Fighters can specialize in a weapon, gaining +1 to hit and +2 to damage. This costs an additional weapon proficiency slot.",
      },
      {
        name: "Mehrfachangriffe ab Stufe 7",
        name_en: "Multiple Attacks from Level 7",
        description:
          "Ab Stufe 7 erhält der Kämpfer 3/2 Angriffe pro Runde, ab Stufe 13 zwei Angriffe pro Runde mit Nahkampfwaffen.",
        description_en:
          "From level 7, the fighter gains 3/2 attacks per round, and from level 13, two attacks per round with melee weapons.",
      },
      {
        name: "Ausnahmestärke bei STR 18",
        name_en: "Exceptional Strength at STR 18",
        description:
          "Kämpfer mit Stärke 18 würfeln prozentuale Ausnahmestärke (18/01-18/00), die zusätzliche Boni auf Treffer, Schaden und Tragkraft gewährt.",
        description_en:
          "Fighters with Strength 18 roll percentile exceptional strength (18/01-18/00), granting additional bonuses to hit, damage, and carrying capacity.",
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
        name: "Spezialisierter Feind (+4 Treffer/Schaden)",
        name_en: "Favored Enemy (+4 Hit/Damage)",
        description:
          "Der Waldläufer wählt bei der Erstellung eine Kreaturenart als Erzfeind. Gegen diese erhält er +4 auf Treffer und Schaden.",
        description_en:
          "The ranger chooses a creature type as a favored enemy at creation. Against these, the ranger gains +4 to hit and damage.",
      },
      {
        name: "Fährtensuche",
        name_en: "Tracking",
        description:
          "Waldläufer können Spuren in der Wildnis verfolgen. Die Erfolgschance steigt mit der Stufe und wird durch Gelände und Wetter modifiziert.",
        description_en:
          "Rangers can track creatures in the wilderness. The success chance increases with level and is modified by terrain and weather.",
      },
      {
        name: "Zwei-Waffen-Kampf ohne Malus",
        name_en: "Two-Weapon Fighting without Penalty",
        description:
          "Waldläufer können mit zwei Waffen gleichzeitig kämpfen, ohne den üblichen Malus auf Trefferwürfe zu erleiden, solange sie keine schwere Rüstung tragen.",
        description_en:
          "Rangers can fight with two weapons simultaneously without the usual penalty to attack rolls, as long as they do not wear heavy armor.",
      },
      {
        name: "Begrenzte Druidenzauber ab Stufe 8",
        name_en: "Limited Druid Spells from Level 8",
        description:
          "Ab Stufe 8 erhält der Waldläufer Zugang zu einer begrenzten Anzahl von Priester-Zaubern aus den Sphären Pflanze, Tier und Elementar.",
        description_en:
          "From level 8, the ranger gains access to a limited number of priest spells from the Plant, Animal, and Elemental spheres.",
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
        name: "Böses erkennen (18 m)",
        name_en: "Detect Evil (18 m)",
        description:
          "Der Paladin kann durch Konzentration die Anwesenheit und Richtung von Bösem im Umkreis von 18 m erspüren. Diese Fähigkeit funktioniert ähnlich wie der Zauber 'Böses erkennen'.",
        description_en:
          "By concentrating, the paladin can sense the presence and direction of evil within 18 meters. This ability functions similarly to the Detect Evil spell.",
      },
      {
        name: "Handauflegen (2 HP/Stufe pro Tag)",
        name_en: "Lay on Hands (2 HP/Level per Day)",
        description:
          "Einmal pro Tag kann der Paladin durch Handauflegen 2 Trefferpunkte pro Stufe heilen. Die gesamte Heilung muss an einer Person auf einmal erfolgen.",
        description_en:
          "Once per day, the paladin can heal 2 hit points per level by laying on hands. The entire healing must be applied to one person at once.",
      },
      {
        name: "Immun gegen Krankheiten",
        name_en: "Immune to Diseases",
        description:
          "Paladine sind vollständig immun gegen alle Formen von Krankheit, einschließlich magisch verursachter Seuchen. Sie können jedoch Krankheiten trotzdem als Überträger weitergeben.",
        description_en:
          "Paladins are completely immune to all forms of disease, including magically caused plagues. However, they can still carry and transmit diseases.",
      },
      {
        name: "Untote vertreiben ab Stufe 3",
        name_en: "Turn Undead from Level 3",
        description:
          "Ab Stufe 3 kann der Paladin Untote vertreiben wie ein Kleriker zwei Stufen niedriger. Diese Fähigkeit wirkt über die heilige Ausstrahlung des Paladins.",
        description_en:
          "From level 3, the paladin can turn undead as a cleric two levels lower. This ability works through the paladin's holy aura.",
      },
      {
        name: "Begrenzte Klerikerzauber ab Stufe 9",
        name_en: "Limited Cleric Spells from Level 9",
        description:
          "Ab Stufe 9 erhält der Paladin Zugang zu einer begrenzten Anzahl von Priester-Zaubern aus der Kampf-, Erkenntnis-, Heil- und Schutzsphäre.",
        description_en:
          "From level 9, the paladin gains access to a limited number of priest spells from the Combat, Divination, Healing, and Protection spheres.",
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
          "Als Generalist kann der Magier Zauber aus allen acht Magieschulen erlernen und wirken. Er erhält jedoch keinen Bonus-Zauberplatz wie Spezialisten.",
        description_en:
          "As a generalist, the mage can learn and cast spells from all eight schools of magic. However, the mage does not receive a bonus spell slot like specialists.",
      },
      {
        name: "Zauber ins Zauberbuch schreiben",
        name_en: "Scribe Spells into Spellbook",
        description:
          "Magier notieren ihre Zauber in einem Zauberbuch und müssen neue Zauber aktiv erforschen oder von Schriftrollen kopieren. Die Chance auf Erfolg hängt von der Intelligenz ab.",
        description_en:
          "Mages record their spells in a spellbook and must actively research new spells or copy them from scrolls. The chance of success depends on Intelligence.",
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
          "Der Bannzauberer erhält einen zusätzlichen Zauberplatz pro Zauberstufe, der ausschließlich für Bannzauber verwendet werden muss. Sein Rettungswurf-Bonus gegen Bannzauber beträgt +1.",
        description_en:
          "The abjurer gains an additional spell slot per spell level that must be used exclusively for abjuration spells. The saving throw bonus against abjuration spells is +1.",
      },
      {
        name: "Verbotene Schulen: Verwandlung, Illusion",
        name_en: "Forbidden Schools: Alteration, Illusion",
        description:
          "Bannzauberer können keine Zauber aus den Schulen der Verwandlung und Illusion erlernen oder wirken. Dies ist der Preis für ihre Spezialisierung.",
        description_en:
          "Abjurers cannot learn or cast spells from the schools of Alteration and Illusion. This is the price of their specialization.",
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
          "Der Beschwörer erhält einen zusätzlichen Zauberplatz pro Zauberstufe, der ausschließlich für Beschwörungszauber verwendet werden muss.",
        description_en:
          "The conjurer gains an additional spell slot per spell level that must be used exclusively for conjuration spells.",
      },
      {
        name: "Verbotene Schulen: Erkenntnis, Anrufung",
        name_en: "Forbidden Schools: Divination, Invocation",
        description:
          "Beschwörer können keine Zauber aus den Schulen der Erkenntnis und Anrufung erlernen oder wirken. Dies ist der Preis für ihre Spezialisierung.",
        description_en:
          "Conjurers cannot learn or cast spells from the schools of Divination and Invocation. This is the price of their specialization.",
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
          "Der Seher erhält einen zusätzlichen Zauberplatz pro Zauberstufe, der ausschließlich für Erkenntniszauber verwendet werden muss.",
        description_en:
          "The diviner gains an additional spell slot per spell level that must be used exclusively for divination spells.",
      },
      {
        name: "Verbotene Schule: Beschwörung",
        name_en: "Forbidden School: Conjuration",
        description:
          "Seher können keine Zauber aus der Schule der Beschwörung erlernen oder wirken. Der Seher hat nur eine verbotene Schule statt zwei.",
        description_en:
          "Diviners cannot learn or cast spells from the school of Conjuration. The diviner has only one forbidden school instead of two.",
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
          "Der Verzauberer erhält einen zusätzlichen Zauberplatz pro Zauberstufe, der ausschließlich für Verzauberungszauber verwendet werden muss.",
        description_en:
          "The enchanter gains an additional spell slot per spell level that must be used exclusively for enchantment spells.",
      },
      {
        name: "Verbotene Schulen: Anrufung, Nekromantie",
        name_en: "Forbidden Schools: Invocation, Necromancy",
        description:
          "Verzauberer können keine Zauber aus den Schulen der Anrufung und Nekromantie erlernen oder wirken. Dies ist der Preis für ihre Spezialisierung.",
        description_en:
          "Enchanters cannot learn or cast spells from the schools of Invocation and Necromancy. This is the price of their specialization.",
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
          "Der Illusionist erhält einen zusätzlichen Zauberplatz pro Zauberstufe, der ausschließlich für Illusionszauber verwendet werden muss.",
        description_en:
          "The illusionist gains an additional spell slot per spell level that must be used exclusively for illusion spells.",
      },
      {
        name: "Verbotene Schulen: Nekromantie, Anrufung, Bannzauber",
        name_en: "Forbidden Schools: Necromancy, Invocation, Abjuration",
        description:
          "Illusionisten können keine Zauber aus den Schulen der Nekromantie, Anrufung und Bannzauber erlernen oder wirken. Der Illusionist hat drei verbotene Schulen.",
        description_en:
          "Illusionists cannot learn or cast spells from the schools of Necromancy, Invocation, and Abjuration. The illusionist has three forbidden schools.",
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
          "Der Anrufer erhält einen zusätzlichen Zauberplatz pro Zauberstufe, der ausschließlich für Anrufungszauber verwendet werden muss.",
        description_en:
          "The invoker gains an additional spell slot per spell level that must be used exclusively for invocation spells.",
      },
      {
        name: "Verbotene Schulen: Verzauberung, Beschwörung",
        name_en: "Forbidden Schools: Enchantment, Conjuration",
        description:
          "Anrufer können keine Zauber aus den Schulen der Verzauberung und Beschwörung erlernen oder wirken. Dies ist der Preis für ihre Spezialisierung.",
        description_en:
          "Invokers cannot learn or cast spells from the schools of Enchantment and Conjuration. This is the price of their specialization.",
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
          "Der Nekromant erhält einen zusätzlichen Zauberplatz pro Zauberstufe, der ausschließlich für Nekromantie-Zauber verwendet werden muss.",
        description_en:
          "The necromancer gains an additional spell slot per spell level that must be used exclusively for necromancy spells.",
      },
      {
        name: "Verbotene Schulen: Illusion, Verzauberung",
        name_en: "Forbidden Schools: Illusion, Enchantment",
        description:
          "Nekromanten können keine Zauber aus den Schulen der Illusion und Verzauberung erlernen oder wirken. Dies ist der Preis für ihre Spezialisierung.",
        description_en:
          "Necromancers cannot learn or cast spells from the schools of Illusion and Enchantment. This is the price of their specialization.",
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
          "Der Verwandler erhält einen zusätzlichen Zauberplatz pro Zauberstufe, der ausschließlich für Verwandlungszauber verwendet werden muss.",
        description_en:
          "The transmuter gains an additional spell slot per spell level that must be used exclusively for alteration spells.",
      },
      {
        name: "Verbotene Schulen: Bannzauber, Nekromantie",
        name_en: "Forbidden Schools: Abjuration, Necromancy",
        description:
          "Verwandler können keine Zauber aus den Schulen der Bannzauber und Nekromantie erlernen oder wirken. Dies ist der Preis für ihre Spezialisierung.",
        description_en:
          "Transmuters cannot learn or cast spells from the schools of Abjuration and Necromancy. This is the price of their specialization.",
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
          "Kleriker können Untote durch die Macht ihres Glaubens vertreiben oder vernichten. Die Erfolgschance und die betroffenen Untoten-Typen hängen von der Stufe des Klerikers ab.",
        description_en:
          "Clerics can turn or destroy undead through the power of their faith. The success chance and affected undead types depend on the cleric's level.",
      },
      {
        name: "Alle Rüstungen und Schilde erlaubt",
        name_en: "All Armor and Shields Allowed",
        description:
          "Kleriker dürfen jede Art von Rüstung und Schild tragen. Sie sind jedoch auf stumpfe Waffen beschränkt (Streitkolben, Flegel, etc.).",
        description_en:
          "Clerics may wear any type of armor and shield. However, they are restricted to blunt weapons (maces, flails, etc.).",
      },
      {
        name: "Zauber durch Gebet (keine Zauberbücher)",
        name_en: "Spells through Prayer (No Spellbooks)",
        description:
          "Kleriker erhalten ihre Zauber durch Gebet und göttliche Gunst. Sie benötigen kein Zauberbuch und haben Zugang zu allen Zaubern ihrer Stufe aus den erlaubten Sphären.",
        description_en:
          "Clerics receive their spells through prayer and divine favor. They do not need a spellbook and have access to all spells of their level from the allowed spheres.",
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
        name: "Gestaltwandel ab Stufe 7",
        name_en: "Shapechange from Level 7",
        description:
          "Ab Stufe 7 kann der Druide sich dreimal täglich in ein natürliches Tier verwandeln (Reptil, Vogel, Säugetier). Dabei heilt er 10-60% seines Schadens.",
        description_en:
          "From level 7, the druid can transform into a natural animal three times daily (reptile, bird, mammal). This heals 10-60% of the druid's damage.",
      },
      {
        name: "Immunität gegen Feenverzauberung",
        name_en: "Immunity to Fey Enchantment",
        description:
          "Ab Stufe 7 ist der Druide vollständig immun gegen Verzauberungszauber von Waldwesen wie Dryaden, Nixen und Sylphen.",
        description_en:
          "From level 7, the druid is completely immune to enchantment spells from woodland creatures such as dryads, nixies, and sylphs.",
      },
      {
        name: "Druidensprache",
        name_en: "Druidic Language",
        description:
          "Alle Druiden lernen eine geheime Sprache, die nur unter Druiden weitergegeben wird. Es ist verboten, diese Sprache Nicht-Druiden beizubringen.",
        description_en:
          "All druids learn a secret language that is only passed on among druids. It is forbidden to teach this language to non-druids.",
      },
      {
        name: "Waldläufer-Fähigkeiten in der Wildnis",
        name_en: "Woodland Abilities",
        description:
          "Druiden können sich ungehindert durch natürliches Dickicht bewegen und hinterlassen keine Spuren. Sie können Tierarten, Pflanzen und reines Wasser sicher identifizieren.",
        description_en:
          "Druids can move unhindered through natural undergrowth and leave no tracks. They can safely identify animal species, plants, and pure water.",
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
        name: "Schlösser öffnen",
        name_en: "Pick Locks",
        description:
          "Diebe können mechanische Schlösser mit Dietrichen knacken. Die Erfolgschance steigt mit der Stufe und wird durch DEX-Boni und Rassenboni modifiziert.",
        description_en:
          "Thieves can pick mechanical locks with lockpicks. The success chance increases with level and is modified by DEX bonuses and racial bonuses.",
      },
      {
        name: "Fallen finden/entschärfen",
        name_en: "Find/Remove Traps",
        description:
          "Diebe können kleine mechanische Fallen (Giftnadeln, Klingen) an Schlössern und Truhen aufspüren und entschärfen. Magische Fallen sind ausgenommen.",
        description_en:
          "Thieves can detect and disarm small mechanical traps (poison needles, blades) on locks and chests. Magical traps are excluded.",
      },
      {
        name: "Taschen leeren",
        name_en: "Pick Pockets",
        description:
          "Der Dieb kann versuchen, einem Ziel unbemerkt kleine Gegenstände aus Taschen oder Gürteln zu entwenden. Ein Fehlschlag bedeutet, dass der Diebstahl bemerkt wird.",
        description_en:
          "The thief can attempt to steal small items from a target's pockets or belt unnoticed. A failure means the theft is noticed.",
      },
      {
        name: "Lautlos bewegen",
        name_en: "Move Silently",
        description:
          "Der Dieb kann sich geräuschlos fortbewegen und so Wachen umgehen oder sich unbemerkt nähern. Die Erfolgschance wird durch Rüstung und Untergrund beeinflusst.",
        description_en:
          "The thief can move silently to bypass guards or approach unnoticed. The success chance is affected by armor and terrain.",
      },
      {
        name: "Im Schatten verbergen",
        name_en: "Hide in Shadows",
        description:
          "In Bereichen mit Schatten oder Dunkelheit kann sich der Dieb nahezu unsichtbar verbergen. Bewegung oder direkte Beobachtung beendet die Verbergung.",
        description_en:
          "In areas with shadows or darkness, the thief can hide almost invisibly. Movement or direct observation ends the concealment.",
      },
      {
        name: "Mauern erklimmen",
        name_en: "Climb Walls",
        description:
          "Diebe können glatte vertikale Oberflächen und Mauern erklettern, die für andere Klassen unüberwindbar wären. Keine Ausrüstung notwendig.",
        description_en:
          "Thieves can climb smooth vertical surfaces and walls that are impassable for other classes. No equipment needed.",
      },
      {
        name: "Hinterhältiger Angriff (Backstab)",
        name_en: "Backstab",
        description:
          "Wenn der Dieb ein Ziel von hinten angreift und unentdeckt ist, vervielfacht sich der Schaden: x2 auf Stufe 1-4, x3 auf Stufe 5-8, x4 auf Stufe 9-12, x5 ab Stufe 13.",
        description_en:
          "When the thief attacks a target from behind while undetected, damage is multiplied: x2 at levels 1-4, x3 at levels 5-8, x4 at levels 9-12, x5 from level 13.",
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
        name: "Bardenwissen",
        name_en: "Bard Lore",
        description:
          "Der Barde hat eine prozentuale Chance, Informationen über magische Gegenstände, legendäre Orte und berühmte Persönlichkeiten zu kennen. Die Chance steigt mit der Stufe.",
        description_en:
          "The bard has a percentage chance to know information about magical items, legendary places, and famous personalities. The chance increases with level.",
      },
      {
        name: "Bezaubernde Musik",
        name_en: "Charming Music",
        description:
          "Durch Musik und Gesang kann der Barde Zuhörer verzaubern, die Moral von Verbündeten stärken oder Gegner ablenken. Die Effekte variieren je nach Situation.",
        description_en:
          "Through music and song, the bard can charm listeners, boost allies' morale, or distract enemies. Effects vary depending on the situation.",
      },
      {
        name: "Begrenzte Diebes-Fähigkeiten",
        name_en: "Limited Thief Skills",
        description:
          "Barden beherrschen einige Diebes-Fähigkeiten auf reduziertem Niveau: Schlösser öffnen, Taschen leeren, Lautlos bewegen, Im Schatten verbergen, Mauern erklimmen und Geräusche hören.",
        description_en:
          "Bards have some thief skills at reduced levels: Pick Locks, Pick Pockets, Move Silently, Hide in Shadows, Climb Walls, and Detect Noise.",
      },
      {
        name: "Begrenzte Magierfähigkeiten ab Stufe 2",
        name_en: "Limited Wizard Spells from Level 2",
        description:
          "Ab Stufe 2 kann der Barde Magierzauber aus einem Zauberbuch wirken. Die verfügbaren Zauberstufen und -plätze sind jedoch deutlich geringer als bei einem echten Magier.",
        description_en:
          "From level 2, the bard can cast wizard spells from a spellbook. Available spell levels and slots are significantly fewer than those of an actual wizard.",
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
