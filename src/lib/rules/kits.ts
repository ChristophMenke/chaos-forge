import type { ClassId } from "./types";

export interface KitDefinition {
  id: string;
  name: string;
  name_en: string;
  classId: ClassId;
  hitDieOverride: number | null;
  maxArmorAC: number | null; // minimum AC value allowed (e.g., 5 for chain mail)
  armorSpellFailure: number | null; // spell failure % when wearing armor (e.g., militant_wizard: 20)
  abilities: {
    name: string;
    name_en: string;
    description: string;
    description_en: string;
    webResearched?: boolean;
  }[];
}

export const KITS: Record<string, KitDefinition> = {
  // ── Fighter Kits ──────────────────────────────────────────────────────
  barbarian: {
    id: "barbarian",
    name: "Barbar",
    name_en: "Barbarian",
    classId: "fighter",
    hitDieOverride: 12,
    maxArmorAC: 5, // chain mail or lighter
    armorSpellFailure: null,
    abilities: [
      {
        name: "d12 Trefferwürfel",
        name_en: "d12 Hit Die",
        description: "Der Barbar nutzt einen d12 statt d10 als Trefferwürfel.",
        description_en: "The barbarian uses a d12 instead of d10 as hit die.",
      },
      {
        name: "Mehrfache Spezialisierung",
        name_en: "Multiple Specialization",
        description: "Der Barbar kann sich auf mehrere Waffen spezialisieren.",
        description_en: "The barbarian can specialize in multiple weapons.",
      },
      {
        name: "Eingeschränkte Rüstung",
        name_en: "Limited Armor",
        description: "Der Barbar darf keine Rüstung schwerer als Kettenpanzer tragen.",
        description_en: "The barbarian may not wear armor heavier than chain mail.",
      },
    ],
  },
  cavalier: {
    id: "cavalier",
    name: "Kavalier",
    name_en: "Cavalier",
    classId: "fighter",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Berittener Kampfbonus",
        name_en: "Mounted Combat Bonus",
        description: "Der Kavalier erhält +1 auf Angriff und Schaden, wenn er beritten kämpft.",
        description_en: "The cavalier gains +1 to hit and damage while fighting mounted.",
      },
      {
        name: "Reitkunst",
        name_en: "Horsemanship",
        description: "Meisterhafte Reitfähigkeiten erlauben besondere Manöver im Sattel.",
        description_en: "Masterful riding skills allow special maneuvers while mounted.",
      },
      {
        name: "Ehrenkodex",
        name_en: "Code of Honor",
        description:
          "Der Kavalier folgt einem strengen Ehrenkodex, der sein Verhalten im Kampf und Alltag bestimmt.",
        description_en:
          "The cavalier follows a strict code of honor that governs conduct in battle and daily life.",
      },
    ],
  },
  swashbuckler: {
    id: "swashbuckler",
    name: "Musketier",
    name_en: "Swashbuckler",
    classId: "fighter",
    hitDieOverride: null,
    maxArmorAC: 5, // chain mail or lighter
    armorSpellFailure: null,
    abilities: [
      {
        name: "Rüstungsklasse-Bonus",
        name_en: "AC Bonus",
        description: "Erhält +1 auf die Rüstungsklasse, wenn nur leichte Rüstung getragen wird.",
        description_en: "Gains +1 AC bonus when wearing light armor only.",
      },
      {
        name: "Akrobatik",
        name_en: "Tumbling",
        description: "Kann akrobatische Manöver im Kampf einsetzen, um Angriffen auszuweichen.",
        description_en: "Can use acrobatic maneuvers in combat to dodge attacks.",
      },
      {
        name: "Charme und Auftreten",
        name_en: "Charm/Panache",
        description:
          "Natürliches Charisma und elegantes Auftreten beeindrucken Verbündete und Gegner.",
        description_en: "Natural charisma and elegant demeanor impress allies and foes alike.",
      },
    ],
  },
  berserker: {
    id: "berserker",
    name: "Berserker",
    name_en: "Berserker",
    classId: "fighter",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Berserkergang",
        name_en: "Berserker Rage",
        description:
          "Im Kampfrausch erhält der Berserker +2 auf Angriff und Schaden, erleidet aber -2 auf die Rüstungsklasse.",
        description_en:
          "While raging, the berserker gains +2 to hit and damage but suffers -2 AC penalty.",
      },
      {
        name: "Furchtimmunität",
        name_en: "Immune to Fear in Rage",
        description: "Während des Berserkergangs ist der Berserker immun gegen Furcht-Effekte.",
        description_en: "While raging, the berserker is immune to all fear effects.",
      },
      {
        name: "Erschöpfung nach Raserei",
        name_en: "Rage Exhaustion",
        description:
          "Nach dem Berserkergang erleidet der Berserker Erschöpfung und Abzüge auf Angriffswürfe.",
        description_en:
          "After the rage ends, the berserker suffers exhaustion and attack roll penalties.",
      },
    ],
  },
  gladiator: {
    id: "gladiator",
    name: "Gladiator",
    name_en: "Gladiator",
    classId: "fighter",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Arenakampf",
        name_en: "Arena Combat",
        description: "Der Gladiator erhält +1 auf Angriffswürfe im Einzelkampf.",
        description_en: "The gladiator gains +1 to attack rolls in one-on-one combat.",
      },
      {
        name: "Waffenvorführung",
        name_en: "Weapon Display",
        description:
          "Kann eine einschüchternde Waffenvorführung durchführen, um Gegner zu demoralisieren.",
        description_en: "Can perform an intimidating weapon display to demoralize opponents.",
      },
      {
        name: "Publikumswirkung",
        name_en: "Crowd Appeal",
        description:
          "Beherrscht die Kunst, ein Publikum zu begeistern und deren Gunst zu gewinnen.",
        description_en: "Masters the art of thrilling an audience and winning their favor.",
      },
    ],
  },
  myrmidon: {
    id: "myrmidon",
    name: "Myrmidon",
    name_en: "Myrmidon",
    classId: "fighter",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Militärische Ausbildung",
        name_en: "Military Training",
        description:
          "Professionelle militärische Ausbildung verleiht Vorteile in Formation und Disziplin.",
        description_en:
          "Professional military training provides advantages in formation fighting and discipline.",
      },
      {
        name: "Gefolgsleute-Bonus",
        name_en: "Follower Bonus",
        description: "Zieht mehr Gefolgsleute an und kann diese effektiver befehligen.",
        description_en: "Attracts more followers and can command them more effectively.",
      },
      {
        name: "Taktische Disziplin",
        name_en: "Tactical Discipline",
        description:
          "Kann taktische Manöver koordinieren, die der gesamten Gruppe im Kampf zugutekommen.",
        description_en:
          "Can coordinate tactical maneuvers that benefit the entire party in combat.",
      },
    ],
  },

  // ── Thief Kits ────────────────────────────────────────────────────────
  assassin: {
    id: "assassin",
    name: "Meuchelmörder",
    name_en: "Assassin",
    classId: "thief",
    hitDieOverride: null,
    maxArmorAC: 8, // leather or lighter
    armorSpellFailure: null,
    abilities: [
      {
        name: "Attentat",
        name_en: "Assassination Attempt",
        description:
          "Kann einen tödlichen Überraschungsangriff durchführen, der sofortigen Tod verursachen kann.",
        description_en: "Can perform a deadly surprise attack that may cause instant death.",
      },
      {
        name: "Giftgebrauch",
        name_en: "Poison Use",
        description: "Beherrscht den sicheren Umgang mit Giften, ohne sich selbst zu gefährden.",
        description_en:
          "Skilled in the safe handling and application of poisons without risk to self.",
      },
      {
        name: "Meisterhafte Verkleidung",
        name_en: "Disguise Mastery",
        description: "Kann überzeugende Verkleidungen anlegen, um unerkannt zu bleiben.",
        description_en: "Can create convincing disguises to remain undetected.",
      },
    ],
  },
  bounty_hunter: {
    id: "bounty_hunter",
    name: "Kopfgeldjäger",
    name_en: "Bounty Hunter",
    classId: "thief",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Spurenlesen",
        name_en: "Tracking Proficiency",
        description:
          "Beherrscht das Spurenlesen und kann Zielpersonen über weite Strecken verfolgen.",
        description_en: "Proficient in tracking and can follow targets over long distances.",
      },
      {
        name: "Fangbonus",
        name_en: "Capture Bonus",
        description: "Erhält Boni beim Versuch, Ziele lebend zu fangen statt zu töten.",
        description_en: "Gains bonuses when attempting to capture targets alive rather than kill.",
      },
      {
        name: "Informantennetzwerk",
        name_en: "Information Network",
        description:
          "Unterhält ein Netzwerk von Informanten, das bei der Suche nach Zielpersonen hilft.",
        description_en: "Maintains a network of informants that aids in locating targets.",
      },
    ],
  },
  acrobat: {
    id: "acrobat",
    name: "Akrobat",
    name_en: "Acrobat",
    classId: "thief",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Akrobatik",
        name_en: "Tumbling",
        description: "Akrobatische Fähigkeiten reduzieren Fallschaden um 1W6 Punkte.",
        description_en: "Acrobatic skills reduce falling damage by 1d6 points.",
      },
      {
        name: "Seiltanz",
        name_en: "Tightrope Walking",
        description: "Kann sicher über Seile, Simse und schmale Oberflächen balancieren.",
        description_en: "Can safely balance across ropes, ledges, and narrow surfaces.",
      },
      {
        name: "Ausweichbonus",
        name_en: "Evasion Bonus",
        description:
          "Erhält einen Bonus auf Rettungswürfe gegen Flächenangriffe durch geschicktes Ausweichen.",
        description_en: "Gains a saving throw bonus against area attacks through skillful evasion.",
      },
    ],
  },
  scout: {
    id: "scout",
    name: "Kundschafter",
    name_en: "Scout",
    classId: "thief",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Wildnistarnung",
        name_en: "Wilderness Stealth",
        description: "Kann sich in natürlicher Umgebung nahezu unsichtbar machen.",
        description_en: "Can become nearly invisible in natural environments.",
      },
      {
        name: "Überraschungsbonus",
        name_en: "Surprise Bonus",
        description: "Gegner erleiden -1 auf ihre Überraschungswürfe gegen den Kundschafter.",
        description_en: "Enemies suffer -1 on their surprise rolls against the scout.",
      },
      {
        name: "Wegzeichen",
        name_en: "Trail Signs",
        description:
          "Kann geheime Wegzeichen hinterlassen und lesen, um Verbündeten den Weg zu weisen.",
        description_en: "Can leave and read secret trail signs to guide allies.",
      },
    ],
  },
  burglar: {
    id: "burglar",
    name: "Einbrecher",
    name_en: "Burglar",
    classId: "thief",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Schloss-/Fallenbonus",
        name_en: "Lock/Trap Bonus",
        description: "Erhält +10% auf Schlösser öffnen und Fallen finden/entschärfen.",
        description_en: "Gains +10% bonus to Open Locks and Find/Remove Traps.",
      },
      {
        name: "Wertschätzung",
        name_en: "Appraise Value",
        description: "Kann den Wert von Schätzen und Gegenständen zuverlässig einschätzen.",
        description_en: "Can reliably appraise the value of treasures and items.",
      },
      {
        name: "Fluchtwege",
        name_en: "Escape Routes",
        description:
          "Plant stets Fluchtwege und kann sich schnell aus gefährlichen Situationen zurückziehen.",
        description_en:
          "Always plans escape routes and can quickly withdraw from dangerous situations.",
      },
    ],
  },
  spy: {
    id: "spy",
    name: "Spion",
    name_en: "Spy",
    classId: "thief",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Verkleidungsfertigkeit",
        name_en: "Disguise Proficiency",
        description:
          "Beherrscht die Kunst der Verkleidung und kann verschiedene Identitäten annehmen.",
        description_en: "Masters the art of disguise and can assume various identities.",
      },
      {
        name: "Lippenlesen",
        name_en: "Read Lips",
        description: "Kann Gespräche durch Lippenlesen auf Entfernung verfolgen.",
        description_en: "Can follow conversations at a distance by reading lips.",
      },
      {
        name: "Informationsbeschaffung",
        name_en: "Information Gathering",
        description:
          "Besonders geschickt darin, Informationen und Gerüchte in besiedelten Gebieten zu sammeln.",
        description_en: "Especially adept at gathering information and rumors in settled areas.",
      },
    ],
  },

  // ── Wizard Kits ───────────────────────────────────────────────────────
  witch: {
    id: "witch",
    name: "Hexe",
    name_en: "Witch",
    classId: "mage",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Tränke brauen",
        name_en: "Brew Potions",
        description: "Kann magische Tränke und Salben aus natürlichen Zutaten herstellen.",
        description_en: "Can brew magical potions and salves from natural ingredients.",
      },
      {
        name: "Verbesserter Vertrauter",
        name_en: "Familiar Enhancement",
        description:
          "Der Vertraute der Hexe erhält zusätzliche Fähigkeiten und ist widerstandsfähiger.",
        description_en: "The witch's familiar gains additional abilities and is more resilient.",
      },
      {
        name: "Verfluchung",
        name_en: "Curse Ability",
        description:
          "Kann mächtige Flüche aussprechen, die Feinde auf verschiedene Weise schwächen.",
        description_en: "Can bestow powerful curses that weaken enemies in various ways.",
      },
    ],
  },
  militant_wizard: {
    id: "militant_wizard",
    name: "Kampfmagier",
    name_en: "Militant Wizard",
    classId: "mage",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: 20,
    abilities: [
      {
        name: "Zusätzliche Waffenfertigkeit",
        name_en: "Weapon Proficiency",
        description:
          "Erhält einen zusätzlichen Waffenfertigkeits-Slot bei der Charaktererstellung.",
        description_en: "Gains one additional weapon proficiency slot at character creation.",
      },
      {
        name: "Leichte Rüstung",
        name_en: "Light Armor Use",
        description:
          "Kann leichte Rüstung tragen und dabei weiterhin Zauber wirken, allerdings mit erhöhter Fehlschlagchance.",
        description_en:
          "Can wear light armor while still casting spells, albeit with an increased failure chance.",
      },
      {
        name: "Kampfzauberei",
        name_en: "Combat Casting",
        description: "Kann Zauber unter Beschuss wirken, ohne den Konzentrationswurf zu verlieren.",
        description_en: "Can cast spells under fire without losing the concentration check.",
      },
    ],
  },
  savage_wizard: {
    id: "savage_wizard",
    name: "Wildnismagier",
    name_en: "Savage Wizard",
    classId: "mage",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Naturfokus",
        name_en: "Nature Focus",
        description: "Spezialisiert auf naturbasierte Magie mit Boni auf entsprechende Zauber.",
        description_en: "Specializes in nature-based magic with bonuses to related spells.",
      },
      {
        name: "Eingeschränkte Zauberschulen",
        name_en: "Limited Spell Schools",
        description:
          "Hat nur Zugang zu bestimmten Zauberschulen, die mit der Natur verbunden sind.",
        description_en: "Has access only to certain spell schools connected to nature.",
      },
      {
        name: "Kräuterkunde",
        name_en: "Herbal Knowledge",
        description:
          "Besitzt umfangreiches Wissen über Kräuter und deren magische sowie heilende Eigenschaften.",
        description_en:
          "Possesses extensive knowledge of herbs and their magical and healing properties.",
      },
    ],
  },
  academician: {
    id: "academician",
    name: "Gelehrter",
    name_en: "Academician",
    classId: "mage",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Forschungsbonus",
        name_en: "Research Bonus",
        description: "Erhält +15% auf die Chance, neue Zauber zu erlernen.",
        description_en: "Gains +15% bonus to Learn Spell chance.",
      },
      {
        name: "Gelehrtenwissen",
        name_en: "Sage Knowledge",
        description: "Verfügt über breites Wissen in einem gewählten Fachgebiet wie ein Weiser.",
        description_en: "Possesses broad knowledge in a chosen field of study, similar to a sage.",
      },
      {
        name: "Bibliothekszugang",
        name_en: "Library Access",
        description:
          "Hat Zugang zu akademischen Bibliotheken, die das Erlernen und Erforschen von Zaubern erleichtern.",
        description_en:
          "Has access to academic libraries that facilitate learning and researching spells.",
      },
    ],
  },

  // ── Priest Kits ───────────────────────────────────────────────────────
  fighting_priest: {
    id: "fighting_priest",
    name: "Kriegspriester",
    name_en: "Fighting Priest",
    classId: "cleric",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Zusätzliche Waffenfertigkeit",
        name_en: "Extra Weapon Proficiency",
        description:
          "Erhält einen zusätzlichen Waffenfertigkeits-Slot und darf Klingenwaffen führen.",
        description_en: "Gains an extra weapon proficiency slot and may wield bladed weapons.",
      },
      {
        name: "Kampfsegen",
        name_en: "Combat Blessing",
        description: "Kann Verbündete vor dem Kampf segnen und ihnen kurzzeitige Boni verleihen.",
        description_en: "Can bless allies before combat, granting them short-term bonuses.",
      },
      {
        name: "Taktische Führung",
        name_en: "Tactical Leadership",
        description: "Kann Verbündete im Kampf koordinieren und taktische Anweisungen erteilen.",
        description_en: "Can coordinate allies in combat and issue tactical commands.",
      },
    ],
  },
  pacifist_priest: {
    id: "pacifist_priest",
    name: "Friedenspriester",
    name_en: "Pacifist Priest",
    classId: "cleric",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Verbesserte Heilung",
        name_en: "Enhanced Healing",
        description: "Heilzauber heilen +1 Trefferpunkt pro Würfel zusätzlich.",
        description_en: "Healing spells restore +1 hit point per die rolled.",
      },
      {
        name: "Schutzaura",
        name_en: "Sanctuary Aura",
        description:
          "Strahlt eine Aura des Friedens aus, die Gegner von Angriffen abhält, solange der Priester nicht angreift.",
        description_en:
          "Radiates an aura of peace that deters enemies from attacking as long as the priest does not attack.",
      },
      {
        name: "Keine Klingenwaffen",
        name_en: "No Edged Weapons",
        description:
          "Darf keine Klingenwaffen verwenden, erhält dafür aber verstärkte göttliche Heilkräfte.",
        description_en:
          "May not use edged weapons but receives enhanced divine healing powers in return.",
      },
    ],
  },

  // ── Ranger Kit ────────────────────────────────────────────────────────
  beastmaster: {
    id: "beastmaster",
    name: "Tiermeister",
    name_en: "Beastmaster",
    classId: "ranger",
    hitDieOverride: null,
    maxArmorAC: 8, // leather or lighter
    armorSpellFailure: null,
    abilities: [
      {
        name: "Tiergefährte",
        name_en: "Animal Companion",
        description:
          "Erhält einen loyalen Tiergefährten, der im Kampf und bei der Erkundung hilft.",
        description_en: "Gains a loyal animal companion that aids in combat and exploration.",
      },
      {
        name: "Mit Tieren sprechen",
        name_en: "Speak with Animals",
        description:
          "Kann einmal pro Tag mit Tieren sprechen, als wäre der gleichnamige Zauber gewirkt worden.",
        description_en:
          "Can speak with animals once per day as if the spell of the same name were cast.",
      },
      {
        name: "Tierempathie-Bonus",
        name_en: "Animal Empathy Bonus",
        description:
          "Erhält einen Bonus auf Tierempathie-Würfe, um wilde Tiere zu beruhigen oder zu beeinflussen.",
        description_en: "Gains a bonus to animal empathy checks to calm or influence wild animals.",
      },
    ],
  },

  // ── Bard Kit ──────────────────────────────────────────────────────────
  blade: {
    id: "blade",
    name: "Klingentänzer",
    name_en: "Blade",
    classId: "bard",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Waffenperformance",
        name_en: "Weapon Performance",
        description:
          "Erhält +1 auf Angriffswürfe mit einer gewählten Waffe durch kunstvolles Kampftraining.",
        description_en:
          "Gains +1 to attack rolls with a chosen weapon through artistic combat training.",
      },
      {
        name: "Kampftanz",
        name_en: "Combat Dance",
        description:
          "Kann einen hypnotisierenden Kampftanz aufführen, der Gegner ablenkt und Verbündete inspiriert.",
        description_en:
          "Can perform a mesmerizing combat dance that distracts enemies and inspires allies.",
      },
      {
        name: "Klingenlied",
        name_en: "Blade Song",
        description:
          "Ein magisches Lied, das die Klinge mit Energie erfüllt und zusätzlichen Schaden verursacht.",
        description_en:
          "A magical song that infuses the blade with energy, dealing additional damage.",
      },
    ],
  },

  // ── Fighter Kits (new) ────────────────────────────────────────────────
  beast_rider: {
    id: "beast_rider",
    name: "Reittiermeister",
    name_en: "Beast Rider",
    classId: "fighter",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Exotisches Reittier",
        name_en: "Exotic Mount",
        description:
          "Der Reittiermeister kann ein exotisches Reittier wie einen Riesenwolf oder Hippogryph zähmen und reiten.",
        description_en:
          "The beast rider can tame and ride an exotic mount such as a dire wolf or hippogriff.",
      },
      {
        name: "Berittener Kampfbonus",
        name_en: "Mounted Combat Bonus",
        description: "Erhält +2 auf Angriffswürfe, wenn er sein besonderes Reittier reitet.",
        description_en: "Gains +2 to attack rolls when riding his special mount.",
      },
      {
        name: "Tierbindung",
        name_en: "Animal Bond",
        description: "Die enge Bindung zum Reittier ermöglicht instinktive Kommunikation im Kampf.",
        description_en:
          "The close bond with the mount allows instinctive communication during combat.",
      },
    ],
  },
  noble_warrior: {
    id: "noble_warrior",
    name: "Adelskrieger",
    name_en: "Noble Warrior",
    classId: "fighter",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Adliger Stand",
        name_en: "Noble Birth",
        description:
          "Entstammt dem Adel und verfügt über politische Kontakte, Land und Ressourcen.",
        description_en: "Born into nobility with political contacts, land holdings, and resources.",
      },
      {
        name: "Führungsautorität",
        name_en: "Leadership Authority",
        description:
          "Kann Gefolgsleute und Soldaten leichter anwerben und befehligen als andere Kämpfer.",
        description_en:
          "Can recruit and command followers and soldiers more easily than other fighters.",
      },
      {
        name: "Noblesse Oblige",
        name_en: "Noblesse Oblige",
        description: "Muss einen standesgemäßen Lebensstil pflegen, was hohe Ausgaben verursacht.",
        description_en: "Must maintain a lifestyle befitting nobility, incurring high expenses.",
      },
    ],
  },
  peasant_hero: {
    id: "peasant_hero",
    name: "Bauernheld",
    name_en: "Peasant Hero",
    classId: "fighter",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Volksverbundenheit",
        name_en: "Common Touch",
        description:
          "Das einfache Volk vertraut dem Bauernhelden und gewährt bereitwillig Unterschlupf und Hilfe.",
        description_en:
          "Common folk trust the peasant hero and readily provide shelter and assistance.",
      },
      {
        name: "Improvisation",
        name_en: "Improvised Weapons",
        description:
          "Kann Alltagsgegenstände wie Dreschflegel, Sensen und Knüppel effektiv als Waffen einsetzen.",
        description_en:
          "Can effectively wield everyday objects like flails, scythes, and clubs as weapons.",
      },
      {
        name: "Zähigkeit",
        name_en: "Hardy Constitution",
        description:
          "Jahre harter Arbeit verleihen einen Bonus auf Ausdauer- und Konstitutionswürfe.",
        description_en: "Years of hard labor grant a bonus to endurance and constitution checks.",
      },
    ],
  },
  samurai: {
    id: "samurai",
    name: "Samurai",
    name_en: "Samurai",
    classId: "fighter",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Kiai-Schrei",
        name_en: "Kiai Shout",
        description:
          "Kann einen übernatürlichen Kampfschrei ausstoßen, der Gegner für eine Runde lähmt.",
        description_en:
          "Can unleash a supernatural battle shout that paralyzes opponents for one round.",
      },
      {
        name: "Ehre des Bushido",
        name_en: "Bushido Honor",
        description:
          "Folgt dem Bushido-Kodex — Verlust der Ehre bedeutet schwerwiegende soziale Konsequenzen.",
        description_en:
          "Follows the Bushido code — loss of honor carries severe social consequences.",
      },
      {
        name: "Katana-Meisterschaft",
        name_en: "Katana Mastery",
        description:
          "Kann sich auf das Katana spezialisieren und erhält erweiterte Kampftechniken damit.",
        description_en:
          "Can specialize in the katana and gains advanced combat techniques with it.",
      },
    ],
  },
  wilderness_warrior: {
    id: "wilderness_warrior",
    name: "Wildniskrieger",
    name_en: "Wilderness Warrior",
    classId: "fighter",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Wildnisüberleben",
        name_en: "Wilderness Survival",
        description: "Kann in der Wildnis mühelos überleben und Nahrung sowie Unterschlupf finden.",
        description_en:
          "Can survive effortlessly in the wilderness, finding food and shelter with ease.",
      },
      {
        name: "Tiersinn",
        name_en: "Animal Sense",
        description:
          "Kann die Anwesenheit von Tieren in der Umgebung spüren und deren Verhalten deuten.",
        description_en: "Can sense the presence of animals nearby and interpret their behavior.",
      },
      {
        name: "Primitiver Kampfstil",
        name_en: "Primitive Combat Style",
        description:
          "Bevorzugt primitive Waffen und erhält Boni im Umgang mit selbstgefertigten Waffen.",
        description_en: "Prefers primitive weapons and gains bonuses when using self-crafted arms.",
      },
    ],
  },

  // ── Thief Kits (new) ─────────────────────────────────────────────────
  adventurer: {
    id: "adventurer",
    name: "Abenteurer",
    name_en: "Adventurer",
    classId: "thief",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Vielseitigkeit",
        name_en: "Versatility",
        description:
          "Der Abenteurer ist ein Allrounder, der keine Diebesfähigkeit besonders bevorzugt, aber alle solide beherrscht.",
        description_en:
          "The adventurer is a generalist who favors no single thief skill but is competent in all.",
      },
      {
        name: "Gerüchteküche",
        name_en: "Streetwise",
        description:
          "Findet in jeder Stadt schnell Kontakte und erfährt lokale Gerüchte und Geheimnisse.",
        description_en: "Quickly finds contacts in any city and learns local rumors and secrets.",
      },
      {
        name: "Schatzjäger-Instinkt",
        name_en: "Treasure Hunter's Instinct",
        description: "Hat ein untrügliches Gespür für verborgene Schätze und geheime Durchgänge.",
        description_en: "Has an unerring sense for hidden treasures and secret passages.",
      },
    ],
  },
  investigator: {
    id: "investigator",
    name: "Ermittler",
    name_en: "Investigator",
    classId: "thief",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Spurenanalyse",
        name_en: "Clue Analysis",
        description:
          "Kann Tatorte untersuchen und aus Hinweisen Rückschlüsse auf Täter und Hergang ziehen.",
        description_en: "Can examine crime scenes and deduce perpetrators and events from clues.",
      },
      {
        name: "Verhörtechnik",
        name_en: "Interrogation",
        description:
          "Beherrscht verschiedene Verhörtechniken, um Verdächtigen Informationen zu entlocken.",
        description_en:
          "Masters various interrogation techniques to extract information from suspects.",
      },
      {
        name: "Kontaktnetzwerk",
        name_en: "Contact Network",
        description: "Unterhält ein Netzwerk aus Informanten in Behörden und der Unterwelt.",
        description_en:
          "Maintains a network of informants in both official circles and the underworld.",
      },
    ],
  },
  smuggler: {
    id: "smuggler",
    name: "Schmuggler",
    name_en: "Smuggler",
    classId: "thief",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Verborgene Fracht",
        name_en: "Concealed Cargo",
        description:
          "Kann Gegenstände so geschickt verstecken, dass sie bei Durchsuchungen kaum gefunden werden.",
        description_en:
          "Can conceal objects so skillfully that they are nearly undetectable during searches.",
      },
      {
        name: "Geheime Routen",
        name_en: "Secret Routes",
        description:
          "Kennt geheime Handelsrouten und Schmugglerpfade, die anderen verborgen bleiben.",
        description_en: "Knows secret trade routes and smuggling paths hidden from others.",
      },
      {
        name: "Bestechungskunst",
        name_en: "Bribery Expertise",
        description:
          "Weiß genau, wem man wie viel anbieten muss, um Wachen und Beamte zu bestechen.",
        description_en:
          "Knows exactly how much to offer to bribe guards and officials effectively.",
      },
    ],
  },

  // ── Wizard Kits (new) ────────────────────────────────────────────────
  amazon_sorceress: {
    id: "amazon_sorceress",
    name: "Amazonenzauberin",
    name_en: "Amazon Sorceress",
    classId: "mage",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Kriegerisches Training",
        name_en: "Warrior Training",
        description:
          "Erhält einen zusätzlichen Waffenfertigkeits-Slot und darf nicht-standardmäßige Magierwaffen führen.",
        description_en:
          "Gains an extra weapon proficiency slot and may wield non-standard wizard weapons.",
      },
      {
        name: "Kampfzauberei",
        name_en: "Battle Magic",
        description: "Kann Kampfzauber unter Druck wirken, ohne Konzentrationswürfe zu verlieren.",
        description_en:
          "Can cast combat spells under pressure without losing concentration checks.",
      },
      {
        name: "Stammesmagie",
        name_en: "Tribal Magic",
        description: "Spezialisiert auf naturnahe und elementare Zauber ihrer Stammestradition.",
        description_en:
          "Specializes in nature-based and elemental spells from her tribal tradition.",
      },
    ],
  },
  peasant_wizard: {
    id: "peasant_wizard",
    name: "Bauernmagier",
    name_en: "Peasant Wizard",
    classId: "mage",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Volksmagie",
        name_en: "Folk Magic",
        description:
          "Beherrscht einfache, praktische Zauber, die im Alltag des Landlebens nützlich sind.",
        description_en: "Masters simple, practical spells useful in everyday rural life.",
      },
      {
        name: "Bescheidene Herkunft",
        name_en: "Humble Origins",
        description:
          "Wird von der magischen Gemeinschaft nicht anerkannt, genießt aber das Vertrauen des einfachen Volkes.",
        description_en:
          "Not recognized by the magical community but enjoys the trust of common folk.",
      },
      {
        name: "Zähigkeit des Landvolks",
        name_en: "Peasant Toughness",
        description:
          "Jahre körperlicher Arbeit verleihen bessere Trefferpunkte als bei typischen Magiern.",
        description_en: "Years of physical labor grant better hit points than typical wizards.",
      },
    ],
  },
  wild_mage: {
    id: "wild_mage",
    name: "Wildmagier",
    name_en: "Wild Mage",
    classId: "mage",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Wilde Magie",
        name_en: "Wild Magic",
        description:
          "Zauber können unvorhersehbare Effekte haben — stärker oder schwächer als beabsichtigt.",
        description_en: "Spells can have unpredictable effects — stronger or weaker than intended.",
      },
      {
        name: "Stufenschwankung",
        name_en: "Level Variation",
        description:
          "Die effektive Zauberstufe schwankt zufällig um bis zu 3 Stufen nach oben oder unten.",
        description_en: "Effective caster level varies randomly by up to 3 levels higher or lower.",
      },
      {
        name: "Wilde Woge",
        name_en: "Wild Surge",
        description:
          "Bei einem Patzer auf der Wilden-Magie-Tabelle treten bizarre und unkontrollierbare Effekte auf.",
        description_en:
          "On a roll on the Wild Magic table, bizarre and uncontrollable effects may occur.",
      },
    ],
  },

  // ── Cleric Kits (new) ────────────────────────────────────────────────
  amazon_priestess: {
    id: "amazon_priestess",
    name: "Amazonenpriesterin",
    name_en: "Amazon Priestess",
    classId: "cleric",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Kriegerinnenpriesterin",
        name_en: "Warrior Priestess",
        description:
          "Darf Klingenwaffen und Bögen verwenden, die normalen Priestern verwehrt sind.",
        description_en: "May use bladed weapons and bows normally forbidden to priests.",
      },
      {
        name: "Göttinnensegen",
        name_en: "Goddess's Blessing",
        description: "Erhält einen Bonus auf Rettungswürfe gegen Bezauberung und Beherrschung.",
        description_en: "Gains a bonus to saving throws against charm and domination effects.",
      },
      {
        name: "Stammesführung",
        name_en: "Tribal Leadership",
        description: "Kann weibliche Krieger und Stammesangehörige als Gefolgsleute anwerben.",
        description_en: "Can recruit female warriors and tribal members as followers.",
      },
    ],
  },
  barbarian_priest: {
    id: "barbarian_priest",
    name: "Barbarenpriester",
    name_en: "Barbarian Priest",
    classId: "cleric",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Stammesritual",
        name_en: "Tribal Ritual",
        description:
          "Kann schamanistische Rituale durchführen, die besondere göttliche Effekte hervorrufen.",
        description_en: "Can perform shamanistic rituals that invoke special divine effects.",
      },
      {
        name: "Wildnisüberleben",
        name_en: "Wilderness Survival",
        description:
          "Beherrscht das Überleben in der Wildnis und kann Nahrung und Heilkräuter finden.",
        description_en: "Skilled at wilderness survival and can find food and healing herbs.",
      },
      {
        name: "Geisterbeschwörung",
        name_en: "Spirit Summoning",
        description: "Kann Ahnengeister und Naturgeister um Rat und Hilfe anrufen.",
        description_en: "Can call upon ancestral spirits and nature spirits for guidance and aid.",
      },
    ],
  },
  fighting_monk: {
    id: "fighting_monk",
    name: "Kampfmönch",
    name_en: "Fighting Monk",
    classId: "cleric",
    hitDieOverride: null,
    maxArmorAC: 10, // no armor
    armorSpellFailure: null,
    abilities: [
      {
        name: "Waffenloser Kampf",
        name_en: "Unarmed Combat",
        description:
          "Beherrscht waffenlosen Kampf mit spezialisierten Kampfkünsten, die mehr Schaden verursachen.",
        description_en:
          "Masters unarmed combat with specialized martial arts that deal increased damage.",
      },
      {
        name: "Keine Rüstung",
        name_en: "No Armor",
        description: "Darf keine Rüstung tragen, erhält aber einen stufenbasierten RK-Bonus.",
        description_en: "May not wear armor but gains a level-based AC bonus.",
      },
      {
        name: "Klösterliche Disziplin",
        name_en: "Monastic Discipline",
        description:
          "Strenge geistige Schulung verleiht Boni auf Rettungswürfe gegen Geistesmagie.",
        description_en:
          "Strict mental training grants bonuses to saving throws against mind-affecting magic.",
      },
    ],
  },
  nobleman_priest: {
    id: "nobleman_priest",
    name: "Adelspriester",
    name_en: "Nobleman Priest",
    classId: "cleric",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Adliger Einfluss",
        name_en: "Noble Influence",
        description:
          "Politische Verbindungen und Adelstitel verschaffen Zugang zu Mächtigen und Ressourcen.",
        description_en:
          "Political connections and noble titles grant access to the powerful and to resources.",
      },
      {
        name: "Kirchliche Autorität",
        name_en: "Ecclesiastical Authority",
        description:
          "Kombiniert weltliche und geistliche Macht, um anderen Geistlichen Anweisungen zu erteilen.",
        description_en: "Combines secular and spiritual power to issue commands to other clergy.",
      },
      {
        name: "Standesgemäße Pflichten",
        name_en: "Noblesse Oblige",
        description:
          "Muss sowohl den Pflichten des Adels als auch der Kirche nachkommen, was zu Konflikten führen kann.",
        description_en:
          "Must fulfill duties to both nobility and church, which can cause conflicts.",
      },
    ],
  },
  outlaw_priest: {
    id: "outlaw_priest",
    name: "Gesetzloser Priester",
    name_en: "Outlaw Priest",
    classId: "cleric",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Verfolgt",
        name_en: "Hunted",
        description:
          "Wird von den Autoritäten verfolgt, genießt aber den Schutz der Unterdrückten.",
        description_en: "Hunted by authorities but enjoys the protection of the oppressed.",
      },
      {
        name: "Verbotene Praktiken",
        name_en: "Forbidden Practices",
        description: "Praktiziert eine verbotene Religion oder ketzerische Lehre im Verborgenen.",
        description_en: "Practices a forbidden religion or heretical doctrine in secret.",
      },
      {
        name: "Untergrundnetzwerk",
        name_en: "Underground Network",
        description: "Verfügt über ein Netzwerk von Anhängern und sicheren Häusern.",
        description_en: "Commands a network of followers and safe houses.",
      },
    ],
  },
  peasant_priest: {
    id: "peasant_priest",
    name: "Dorfpriester",
    name_en: "Peasant Priest",
    classId: "cleric",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Gemeindepflege",
        name_en: "Community Care",
        description:
          "Ist das geistliche Zentrum einer Dorfgemeinschaft und genießt großes Vertrauen der Landbevölkerung.",
        description_en:
          "Serves as the spiritual center of a village community, enjoying great trust from rural folk.",
      },
      {
        name: "Kräuterheilkunde",
        name_en: "Herbal Healing",
        description: "Kennt Heilkräuter und einfache Hausmittel, die Heilzauber ergänzen.",
        description_en: "Knows healing herbs and simple remedies that complement healing spells.",
      },
      {
        name: "Bescheidene Mittel",
        name_en: "Humble Means",
        description:
          "Verfügt über wenig Geld und Ausrüstung, kann aber auf die Gastfreundschaft der Landbevölkerung zählen.",
        description_en:
          "Has little money and equipment but can count on the hospitality of rural communities.",
      },
    ],
  },
  prophet: {
    id: "prophet",
    name: "Prophet",
    name_en: "Prophet",
    classId: "cleric",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Göttliche Visionen",
        name_en: "Divine Visions",
        description:
          "Empfängt regelmäßig prophetische Visionen von der Gottheit, die Hinweise auf die Zukunft geben.",
        description_en:
          "Regularly receives prophetic visions from the deity that hint at the future.",
      },
      {
        name: "Charismatische Predigt",
        name_en: "Charismatic Preaching",
        description:
          "Kann durch leidenschaftliche Predigten Massen begeistern und Anhänger gewinnen.",
        description_en: "Can inspire masses and gain followers through passionate preaching.",
      },
      {
        name: "Fanatischer Glaube",
        name_en: "Fanatical Faith",
        description:
          "Der unerschütterliche Glaube verleiht Immunität gegen Furcht, kann aber zu Engstirnigkeit führen.",
        description_en:
          "Unwavering faith grants immunity to fear but can lead to narrow-mindedness.",
      },
    ],
  },
  savage_priest: {
    id: "savage_priest",
    name: "Stammespriester",
    name_en: "Savage Priest",
    classId: "cleric",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Naturgottheit",
        name_en: "Nature Deity",
        description:
          "Dient einer primitiven Naturgottheit und hat Zugang zu speziellen Naturzaubern.",
        description_en: "Serves a primitive nature deity and has access to special nature spells.",
      },
      {
        name: "Totemtier",
        name_en: "Totem Animal",
        description: "Besitzt ein heiliges Totemtier, das als göttlicher Bote und Berater dient.",
        description_en:
          "Possesses a sacred totem animal that serves as a divine messenger and advisor.",
      },
      {
        name: "Ritualmagie",
        name_en: "Ritual Magic",
        description:
          "Kann durch aufwendige Stammesrituale mächtigere Versionen seiner Zauber wirken.",
        description_en:
          "Can cast more powerful versions of spells through elaborate tribal rituals.",
      },
    ],
  },
  scholar_priest: {
    id: "scholar_priest",
    name: "Gelehrtenpriester",
    name_en: "Scholar Priest",
    classId: "cleric",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Theologisches Wissen",
        name_en: "Theological Knowledge",
        description: "Umfassendes Wissen über Religion, Geschichte und Mythologie aller Kulturen.",
        description_en:
          "Comprehensive knowledge of religion, history, and mythology across all cultures.",
      },
      {
        name: "Sprachkenntnisse",
        name_en: "Linguistic Skills",
        description: "Beherrscht mehrere alte und moderne Sprachen, einschließlich toter Sprachen.",
        description_en:
          "Fluent in multiple ancient and modern languages, including dead languages.",
      },
      {
        name: "Forschungsbonus",
        name_en: "Research Bonus",
        description:
          "Erhält Boni beim Identifizieren magischer Gegenstände und beim Entziffern alter Texte.",
        description_en:
          "Gains bonuses when identifying magical items and deciphering ancient texts.",
      },
    ],
  },

  // ── Ranger Kits (new) ────────────────────────────────────────────────
  cleric_ranger: {
    id: "cleric_ranger",
    name: "Priester-Waldläufer",
    name_en: "Cleric Ranger",
    classId: "ranger",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Erweiterte Priesterzauber",
        name_en: "Enhanced Priest Spells",
        description: "Erhält Zugang zu Priesterzaubern eine Stufe früher als normale Waldläufer.",
        description_en: "Gains access to priest spells one level earlier than standard rangers.",
      },
      {
        name: "Untote vertreiben",
        name_en: "Turn Undead",
        description: "Kann Untote vertreiben wie ein Priester, allerdings auf halber Stufe.",
        description_en: "Can turn undead like a priest, but at half level.",
      },
      {
        name: "Göttlicher Auftrag",
        name_en: "Divine Mission",
        description:
          "Dient einer Naturgottheit und erhält spezielle Aufgaben zum Schutz heiliger Orte.",
        description_en:
          "Serves a nature deity and receives special missions to protect sacred sites.",
      },
    ],
  },
  crusader_ranger: {
    id: "crusader_ranger",
    name: "Kreuzritter-Waldläufer",
    name_en: "Crusader Ranger",
    classId: "ranger",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Erzfeind-Bonus",
        name_en: "Species Enemy Bonus",
        description: "Erhält einen erhöhten Angriffsbonus gegen seinen Erzfeind (+4 statt +4).",
        description_en: "Gains an enhanced attack bonus against his species enemy.",
      },
      {
        name: "Unerbittliche Jagd",
        name_en: "Relentless Pursuit",
        description:
          "Kann seinen Erzfeind über große Entfernungen verfolgen, ohne Erschöpfung zu erleiden.",
        description_en:
          "Can pursue his species enemy over great distances without suffering exhaustion.",
      },
      {
        name: "Eingeschränkte Empathie",
        name_en: "Limited Empathy",
        description:
          "Der Hass auf den Erzfeind ist so stark, dass Tierempathie gegenüber verwandten Arten versagt.",
        description_en:
          "Hatred of the species enemy is so intense that animal empathy fails against related species.",
      },
    ],
  },
  feralan: {
    id: "feralan",
    name: "Feralan",
    name_en: "Feralan",
    classId: "ranger",
    hitDieOverride: null,
    maxArmorAC: 10, // no armor
    armorSpellFailure: null,
    abilities: [
      {
        name: "Tierfamilie",
        name_en: "Familial Species",
        description:
          "Wurde von wilden Tieren aufgezogen und kann deren Sprache sprechen und ihre Gesellschaft genießen.",
        description_en:
          "Raised by wild animals, can speak their language and enjoys their company.",
      },
      {
        name: "Naturinstinkt",
        name_en: "Natural Instinct",
        description:
          "Überlegene Sinne und Instinkte gewähren Boni auf Überraschungswürfe und Wahrnehmung.",
        description_en:
          "Superior senses and instincts grant bonuses to surprise rolls and perception.",
      },
      {
        name: "Keine Rüstung",
        name_en: "No Armor",
        description:
          "Kann keine Rüstung und keinen Schild tragen; kämpft nur mit primitiven Waffen.",
        description_en: "Cannot wear armor or carry a shield; fights only with primitive weapons.",
      },
    ],
  },
  forest_runner: {
    id: "forest_runner",
    name: "Waldläufer",
    name_en: "Forest Runner",
    classId: "ranger",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Waldgeschwindigkeit",
        name_en: "Forest Speed",
        description:
          "Kann sich im Wald ohne Geschwindigkeitsabzug bewegen, auch durch dichtes Unterholz.",
        description_en:
          "Can move through forest terrain at full speed, even through dense undergrowth.",
      },
      {
        name: "Baumklettern",
        name_en: "Tree Climbing",
        description:
          "Klettert auf Bäume mit der Geschicklichkeit einer Diebesfertigkeit (85% Basis).",
        description_en: "Climbs trees with the skill of a thief ability (85% base).",
      },
      {
        name: "Waldbotschafter",
        name_en: "Forest Ambassador",
        description: "Dient als Vermittler zwischen Waldvölkern und der Zivilisation.",
        description_en: "Serves as a mediator between forest peoples and civilization.",
      },
    ],
  },
  greenwood_ranger: {
    id: "greenwood_ranger",
    name: "Grünwald-Waldläufer",
    name_en: "Greenwood Ranger",
    classId: "ranger",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Pflanzenfreund",
        name_en: "Plant Ally",
        description:
          "Kann mit Pflanzen kommunizieren und deren Hilfe erbitten, um Feinde zu behindern.",
        description_en: "Can communicate with plants and request their aid to hinder enemies.",
      },
      {
        name: "Waldtarnung",
        name_en: "Forest Camouflage",
        description: "Wird im Wald praktisch unsichtbar und erhält +20% auf Verbergen im Schatten.",
        description_en: "Becomes virtually invisible in forests with +20% to Hide in Shadows.",
      },
      {
        name: "Naturheilung",
        name_en: "Natural Healing",
        description:
          "Kennt die heilenden Eigenschaften von Waldpflanzen und kann damit Wunden behandeln.",
        description_en:
          "Knows the healing properties of forest plants and can use them to treat wounds.",
      },
    ],
  },
  guardian_ranger: {
    id: "guardian_ranger",
    name: "Wächter-Waldläufer",
    name_en: "Guardian Ranger",
    classId: "ranger",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Schutzgebiet",
        name_en: "Protected Area",
        description:
          "Bewacht ein bestimmtes Gebiet und kennt jeden Pfad, jede Höhle und jeden Bewohner darin.",
        description_en:
          "Guards a specific area and knows every path, cave, and inhabitant within it.",
      },
      {
        name: "Alarmbereitschaft",
        name_en: "Vigilance",
        description:
          "Kann in seinem Schutzgebiet nicht überrascht werden und bemerkt Eindringlinge sofort.",
        description_en:
          "Cannot be surprised in his protected area and detects intruders immediately.",
      },
      {
        name: "Ortsbindung",
        name_en: "Area Bond",
        description:
          "Erhält Kampfboni in seinem Schutzgebiet, ist aber ungern weit davon entfernt.",
        description_en:
          "Gains combat bonuses in his protected area but is reluctant to stray far from it.",
      },
    ],
  },
  mountain_man: {
    id: "mountain_man",
    name: "Bergmensch",
    name_en: "Mountain Man",
    classId: "ranger",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Gebirgsbewegung",
        name_en: "Mountain Movement",
        description:
          "Kann sich in bergigem Gelände ohne Abzüge bewegen und steile Felswände erklimmen.",
        description_en:
          "Can move through mountainous terrain without penalties and scale steep cliff faces.",
      },
      {
        name: "Kälteresistenz",
        name_en: "Cold Resistance",
        description: "Abgehärtet gegen Kälte und erhält Boni auf Rettungswürfe gegen Kälteeffekte.",
        description_en:
          "Hardened against cold and gains bonuses to saving throws against cold effects.",
      },
      {
        name: "Einsiedler",
        name_en: "Loner",
        description:
          "Bevorzugt die Einsamkeit der Berge; erhält Mali in sozialen Situationen in Städten.",
        description_en:
          "Prefers the solitude of the mountains; suffers penalties in social situations in cities.",
      },
    ],
  },
  pathfinder: {
    id: "pathfinder",
    name: "Pfadfinder",
    name_en: "Pathfinder",
    classId: "ranger",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Spurenlesen-Meisterschaft",
        name_en: "Tracking Mastery",
        description:
          "Erhält +3 auf alle Spurenlesen-Würfe und kann selbst auf Stein Spuren verfolgen.",
        description_en: "Gains +3 to all tracking checks and can follow tracks even on stone.",
      },
      {
        name: "Kartographie",
        name_en: "Cartography",
        description:
          "Kann präzise Karten erstellen und verliert sich selbst in unbekanntem Terrain nie.",
        description_en: "Can create precise maps and never gets lost, even in unfamiliar terrain.",
      },
      {
        name: "Reiseführer",
        name_en: "Trail Guide",
        description:
          "Gruppen unter seiner Führung reisen schneller und sicherer durch die Wildnis.",
        description_en:
          "Groups under his guidance travel faster and more safely through the wilderness.",
      },
    ],
  },
  sea_ranger: {
    id: "sea_ranger",
    name: "See-Waldläufer",
    name_en: "Sea Ranger",
    classId: "ranger",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Seefahrt",
        name_en: "Seamanship",
        description:
          "Meisterhafte Seefahrtskenntnisse und die Fähigkeit, Schiffe in stürmischer See zu navigieren.",
        description_en:
          "Masterful seamanship and the ability to navigate ships through stormy seas.",
      },
      {
        name: "Meeresempathie",
        name_en: "Marine Empathy",
        description: "Kann mit Meerestieren kommunizieren und ihre Hilfe erbitten.",
        description_en: "Can communicate with sea creatures and request their assistance.",
      },
      {
        name: "Unterwasserkampf",
        name_en: "Underwater Combat",
        description:
          "Erleidet keine Abzüge beim Kampf unter Wasser und kann länger die Luft anhalten.",
        description_en: "Suffers no penalties when fighting underwater and can hold breath longer.",
      },
    ],
  },
  stalker: {
    id: "stalker",
    name: "Pirscher",
    name_en: "Stalker",
    classId: "ranger",
    hitDieOverride: null,
    maxArmorAC: 8, // leather or lighter
    armorSpellFailure: null,
    abilities: [
      {
        name: "Stadtschleicher",
        name_en: "Urban Stealth",
        description:
          "Kann sich in städtischer Umgebung genauso geschickt verbergen wie in der Wildnis.",
        description_en:
          "Can hide and move silently in urban environments as effectively as in the wilderness.",
      },
      {
        name: "Diebesfähigkeiten",
        name_en: "Thief Skills",
        description:
          "Erhält eingeschränkte Diebesfähigkeiten wie Schleichen und Verbergen im Schatten.",
        description_en: "Gains limited thief skills such as Move Silently and Hide in Shadows.",
      },
      {
        name: "Leichte Rüstung",
        name_en: "Light Armor Only",
        description:
          "Darf nur Lederrüstung oder leichtere Rüstungen tragen, um beweglich zu bleiben.",
        description_en: "May only wear leather armor or lighter to maintain mobility.",
      },
    ],
  },

  // ── Bard Kits (new) ──────────────────────────────────────────────────
  charlatan: {
    id: "charlatan",
    name: "Scharlatan",
    name_en: "Charlatan",
    classId: "bard",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Täuschungskunst",
        name_en: "Deception",
        description:
          "Meister der Täuschung — kann andere von fast allem überzeugen, egal wie unwahrscheinlich.",
        description_en:
          "Master of deception — can convince others of almost anything, no matter how unlikely.",
      },
      {
        name: "Falsche Identitäten",
        name_en: "False Identities",
        description:
          "Unterhält mehrere falsche Identitäten mit überzeugenden Hintergrundgeschichten.",
        description_en: "Maintains multiple false identities with convincing background stories.",
      },
      {
        name: "Ablenkungsmanöver",
        name_en: "Misdirection",
        description: "Kann die Aufmerksamkeit aller Anwesenden geschickt auf etwas anderes lenken.",
        description_en: "Can skillfully redirect everyone's attention to something else.",
      },
    ],
  },
  gallant: {
    id: "gallant",
    name: "Galant",
    name_en: "Gallant",
    classId: "bard",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Höfische Manieren",
        name_en: "Courtly Manners",
        description: "Perfektes Benehmen bei Hofe verleiht Boni auf Reaktionswürfe bei Adligen.",
        description_en: "Perfect courtly behavior grants reaction bonuses with nobility.",
      },
      {
        name: "Romantische Inspiration",
        name_en: "Romantic Inspiration",
        description:
          "Kann Verbündete durch leidenschaftliche Reden und romantische Gesten inspirieren.",
        description_en: "Can inspire allies through passionate speeches and romantic gestures.",
      },
      {
        name: "Duellkunst",
        name_en: "Dueling Expertise",
        description: "Erhält +1 auf Angriffswürfe im ehrenhaften Einzelkampf.",
        description_en: "Gains +1 to attack rolls in honorable one-on-one combat.",
      },
    ],
  },
  gypsy_bard: {
    id: "gypsy_bard",
    name: "Wanderbarde",
    name_en: "Gypsy Bard",
    classId: "bard",
    hitDieOverride: null,
    maxArmorAC: 8, // leather or lighter
    armorSpellFailure: null,
    abilities: [
      {
        name: "Wahrsagerei",
        name_en: "Fortune Telling",
        description:
          "Kann die Zukunft aus Karten, Handlinien oder Sternen lesen — manchmal sogar korrekt.",
        description_en:
          "Can read the future from cards, palm lines, or stars — sometimes even accurately.",
      },
      {
        name: "Wandervolk",
        name_en: "Traveling People",
        description:
          "Kennt Wanderrouten und hat Kontakte in fahrenden Völkern über das ganze Land.",
        description_en:
          "Knows travel routes and has contacts among traveling peoples across the land.",
      },
      {
        name: "Böser Blick",
        name_en: "Evil Eye",
        description:
          "Kann einen Fluch durch intensiven Blickkontakt wirken, der das Opfer verunsichert.",
        description_en: "Can cast a curse through intense eye contact that unnerves the victim.",
      },
    ],
  },
  herald: {
    id: "herald",
    name: "Herold",
    name_en: "Herald",
    classId: "bard",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Wappenkunde",
        name_en: "Heraldry",
        description:
          "Kennt alle Wappen, Siegel und Flaggen und kann Adelshäuser, Orden und Gilden identifizieren.",
        description_en:
          "Knows all coats of arms, seals, and flags, and can identify noble houses, orders, and guilds.",
      },
      {
        name: "Diplomatische Immunität",
        name_en: "Diplomatic Immunity",
        description:
          "Als offizieller Bote genießt der Herold Schutz vor Angriffen, selbst in Kriegszeiten.",
        description_en:
          "As an official messenger, the herald enjoys protection from attacks, even in wartime.",
      },
      {
        name: "Proklamation",
        name_en: "Proclamation",
        description:
          "Kann offizielle Ankündigungen machen, die von allen als autoritativ anerkannt werden.",
        description_en: "Can make official announcements recognized as authoritative by all.",
      },
    ],
  },
  jester: {
    id: "jester",
    name: "Narr",
    name_en: "Jester",
    classId: "bard",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Spott",
        name_en: "Mockery",
        description:
          "Kann durch beißenden Spott Gegner so provozieren, dass sie Abzüge auf Angriffswürfe erleiden.",
        description_en:
          "Can provoke enemies through biting mockery, inflicting penalties to their attack rolls.",
      },
      {
        name: "Akrobatik und Jonglage",
        name_en: "Tumbling and Juggling",
        description:
          "Beherrscht akrobatische Kunststücke und Jonglage, die auch im Kampf nützlich sein können.",
        description_en: "Masters acrobatic feats and juggling that can also be useful in combat.",
      },
      {
        name: "Narrenfreiheit",
        name_en: "Fool's Privilege",
        description: "Kann ungestraft Wahrheiten aussprechen, die anderen den Kopf kosten würden.",
        description_en: "Can speak truths without punishment that would cost others their heads.",
      },
    ],
  },
  loremaster: {
    id: "loremaster",
    name: "Hüter des Wissens",
    name_en: "Loremaster",
    classId: "bard",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Legendenkunde",
        name_en: "Legend Lore",
        description:
          "Erhält einen erhöhten Bonus auf Sagenkunde-Würfe, um Gegenstände und Orte zu identifizieren.",
        description_en:
          "Gains an enhanced bonus to legend lore checks to identify items and places.",
      },
      {
        name: "Alte Sprachen",
        name_en: "Ancient Languages",
        description:
          "Beherrscht zahlreiche alte und tote Sprachen und kann vergessene Schriften entziffern.",
        description_en:
          "Fluent in numerous ancient and dead languages and can decipher forgotten scripts.",
      },
      {
        name: "Magische Analyse",
        name_en: "Magical Analysis",
        description:
          "Kann magische Gegenstände durch Untersuchung identifizieren, ohne Zauber dafür zu benötigen.",
        description_en: "Can identify magical items through examination without needing spells.",
      },
    ],
  },
  meistersinger: {
    id: "meistersinger",
    name: "Meistersänger",
    name_en: "Meistersinger",
    classId: "bard",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Meistergesang",
        name_en: "Master Song",
        description:
          "Die Bardenlieder haben verstärkte Wirkung — Inspiration und Faszination dauern länger an.",
        description_en:
          "Bardic songs have enhanced effects — inspiration and fascination last longer.",
      },
      {
        name: "Naturverbundenheit",
        name_en: "Nature Affinity",
        description:
          "Kann durch Gesang Tiere anlocken und beruhigen wie mit einem Tierempathie-Zauber.",
        description_en:
          "Can attract and calm animals through song as if using an animal empathy spell.",
      },
      {
        name: "Wandermusikant",
        name_en: "Wandering Musician",
        description:
          "Überall willkommen als Unterhalter; erhält kostenlose Unterkunft und Verpflegung in Gasthäusern.",
        description_en:
          "Welcome everywhere as an entertainer; receives free room and board at inns.",
      },
    ],
  },
  riddlemaster: {
    id: "riddlemaster",
    name: "Rätselmeister",
    name_en: "Riddlemaster",
    classId: "bard",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Rätselwettstreit",
        name_en: "Riddle Contest",
        description:
          "Kann Gegner in einen Rätselwettstreit verwickeln und bei Sieg einen Bonus oder Zugeständnis erlangen.",
        description_en:
          "Can engage opponents in a riddle contest and gain a bonus or concession upon winning.",
      },
      {
        name: "Logisches Denken",
        name_en: "Logical Reasoning",
        description:
          "Überlegenes logisches Denken hilft beim Lösen von Rätseln, Fallen und Puzzles.",
        description_en: "Superior logical reasoning helps solve riddles, traps, and puzzles.",
      },
      {
        name: "Verwirrende Rede",
        name_en: "Confounding Speech",
        description: "Kann durch verwirrende Wortspiele und Rätsel Gegner ablenken und verwirren.",
        description_en:
          "Can distract and confuse opponents through bewildering wordplay and riddles.",
      },
    ],
  },
  skald: {
    id: "skald",
    name: "Skalde",
    name_en: "Skald",
    classId: "bard",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Kriegslied",
        name_en: "War Chant",
        description:
          "Kann ein nordisches Kriegslied anstimmen, das Verbündeten +1 auf Angriff und Moral verleiht.",
        description_en: "Can intone a Norse war chant that grants allies +1 to attack and morale.",
      },
      {
        name: "Runenmagie",
        name_en: "Rune Magic",
        description:
          "Kennt die Geheimnisse der alten Runen und kann magische Runen in Gegenstände ritzen.",
        description_en:
          "Knows the secrets of ancient runes and can inscribe magical runes into objects.",
      },
      {
        name: "Sagenwächter",
        name_en: "Saga Keeper",
        description:
          "Bewahrt die mündliche Geschichte seines Volkes und kann Heldentaten in epische Erzählungen fassen.",
        description_en:
          "Preserves the oral history of his people and can weave heroic deeds into epic tales.",
      },
    ],
  },
  thespian: {
    id: "thespian",
    name: "Schauspieler",
    name_en: "Thespian",
    classId: "bard",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Meisterhafte Verkleidung",
        name_en: "Master of Disguise",
        description: "Kann jede Rolle perfekt spielen und erhält +30% auf Verkleidungswürfe.",
        description_en: "Can play any role perfectly and gains +30% to disguise checks.",
      },
      {
        name: "Emotionale Manipulation",
        name_en: "Emotional Manipulation",
        description: "Kann durch Schauspielkunst die Emotionen des Publikums gezielt steuern.",
        description_en: "Can deliberately control audience emotions through acting skill.",
      },
      {
        name: "Dramatische Inspiration",
        name_en: "Dramatic Inspiration",
        description:
          "Inspirierende Aufführungen verleihen Verbündeten Boni auf Moral und Rettungswürfe.",
        description_en: "Inspiring performances grant allies bonuses to morale and saving throws.",
      },
    ],
  },

  // ── Paladin Kits ─────────────────────────────────────────────────────
  chevalier: {
    id: "chevalier",
    name: "Chevalier",
    name_en: "Chevalier",
    classId: "paladin",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Ritterlicher Kampf",
        name_en: "Chivalric Combat",
        description: "Erhält +1 auf Angriff und Schaden bei berittenen Lanzenstößen und Turnieren.",
        description_en: "Gains +1 to hit and damage on mounted lance charges and in tournaments.",
      },
      {
        name: "Edler Ruf",
        name_en: "Noble Reputation",
        description:
          "Sein Ruf als ehrenhafter Ritter eilt ihm voraus und verbessert Reaktionswürfe bei Verbündeten.",
        description_en:
          "His reputation as an honorable knight precedes him, improving reaction rolls with allies.",
      },
      {
        name: "Turnier-Erfahrung",
        name_en: "Tournament Experience",
        description: "Meisterhaft im ritterlichen Turnierkampf mit Boni auf Jousting-Würfe.",
        description_en: "Masterful in chivalric tournament combat with bonuses to jousting rolls.",
      },
    ],
  },
  divinate: {
    id: "divinate",
    name: "Göttlicher Seher",
    name_en: "Divinate",
    classId: "paladin",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Göttliche Einsicht",
        name_en: "Divine Insight",
        description:
          "Erhält regelmäßig göttliche Eingebungen, die auf verborgene Gefahren oder Böses hinweisen.",
        description_en:
          "Regularly receives divine inspirations that point to hidden dangers or evil.",
      },
      {
        name: "Verstärkte Bösesdetektion",
        name_en: "Enhanced Detect Evil",
        description:
          "Die Fähigkeit, Böses zu erkennen, hat eine erhöhte Reichweite und liefert mehr Details.",
        description_en: "The ability to detect evil has increased range and provides more detail.",
      },
      {
        name: "Prophetische Träume",
        name_en: "Prophetic Dreams",
        description: "Empfängt im Schlaf prophetische Träume, die zukünftige Ereignisse andeuten.",
        description_en: "Receives prophetic dreams during sleep that hint at future events.",
      },
    ],
  },
  envoy: {
    id: "envoy",
    name: "Gesandter",
    name_en: "Envoy",
    classId: "paladin",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Diplomatisches Geschick",
        name_en: "Diplomatic Skill",
        description:
          "Meister der Verhandlung — kann selbst verfeindete Parteien an einen Tisch bringen.",
        description_en: "Master negotiator — can bring even hostile parties to the table.",
      },
      {
        name: "Sichere Passage",
        name_en: "Safe Passage",
        description:
          "Als göttlicher Gesandter genießt er Schutz und freies Geleit, selbst in feindlichem Gebiet.",
        description_en:
          "As a divine envoy, enjoys protection and safe conduct, even in hostile territory.",
      },
      {
        name: "Sprachbegabung",
        name_en: "Language Gift",
        description: "Beherrscht viele Sprachen und kann sich mit fast jedem verständigen.",
        description_en: "Fluent in many languages and can communicate with almost anyone.",
      },
    ],
  },
  ghosthunter: {
    id: "ghosthunter",
    name: "Geisterjäger",
    name_en: "Ghosthunter",
    classId: "paladin",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Untote spüren",
        name_en: "Sense Undead",
        description:
          "Kann Untote in einem Radius von 60 Fuß spüren, selbst wenn sie unsichtbar oder versteckt sind.",
        description_en: "Can sense undead within a 60-foot radius, even when invisible or hidden.",
      },
      {
        name: "Verstärktes Vertreiben",
        name_en: "Enhanced Turning",
        description: "Erhält +2 auf Würfe zum Vertreiben von Untoten.",
        description_en: "Gains +2 to turning undead rolls.",
      },
      {
        name: "Geisterklinge",
        name_en: "Ghost Blade",
        description:
          "Die Waffe des Geisterjägers kann ätherische und körperlose Untote wie normale Feinde treffen.",
        description_en:
          "The ghosthunter's weapon can strike ethereal and incorporeal undead as if they were corporeal.",
      },
    ],
  },
  medician: {
    id: "medician",
    name: "Heiler-Paladin",
    name_en: "Medician",
    classId: "paladin",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Verstärktes Handauflegen",
        name_en: "Enhanced Lay on Hands",
        description:
          "Kann doppelt so viele Trefferpunkte durch Handauflegen heilen wie ein normaler Paladin.",
        description_en:
          "Can heal twice as many hit points through laying on hands as a standard paladin.",
      },
      {
        name: "Krankenheilung",
        name_en: "Cure Disease",
        description:
          "Kann Krankheiten häufiger heilen als andere Paladine — einmal pro Stufe pro Woche.",
        description_en:
          "Can cure diseases more often than other paladins — once per level per week.",
      },
      {
        name: "Chirurgisches Geschick",
        name_en: "Surgical Skill",
        description:
          "Beherrscht mundane Heilkunst und kann Wunden versorgen, auch ohne göttliche Magie.",
        description_en:
          "Masters mundane healing arts and can treat wounds even without divine magic.",
      },
    ],
  },
  militarist: {
    id: "militarist",
    name: "Militarist",
    name_en: "Militarist",
    classId: "paladin",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Taktische Führung",
        name_en: "Tactical Command",
        description:
          "Meisterhafte Kriegstaktik — kann Truppen und Verbündete effektiv im Großkampf koordinieren.",
        description_en:
          "Masterful war tactics — can effectively coordinate troops and allies in large-scale combat.",
      },
      {
        name: "Festungsbaumeister",
        name_en: "Fortification Expert",
        description:
          "Versteht Befestigungsanlagen und kann Verteidigungsstellungen errichten und angreifen.",
        description_en: "Understands fortifications and can build and assault defensive positions.",
      },
      {
        name: "Truppengeist",
        name_en: "Troop Morale",
        description: "Truppen unter seinem Befehl erhalten einen Moralbonus und fliehen seltener.",
        description_en: "Troops under his command gain a morale bonus and are less likely to flee.",
      },
    ],
  },
  skyrider: {
    id: "skyrider",
    name: "Himmelsreiter",
    name_en: "Skyrider",
    classId: "paladin",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Fliegendes Reittier",
        name_en: "Flying Mount",
        description:
          "Erhält ein fliegendes Reittier wie einen Pegasus oder Hippogryph als göttliches Geschenk.",
        description_en: "Receives a flying mount such as a pegasus or hippogriff as a divine gift.",
      },
      {
        name: "Luftkampf",
        name_en: "Aerial Combat",
        description: "Erhält Kampfboni im Luftkampf und kann Sturzflug-Angriffe durchführen.",
        description_en: "Gains combat bonuses in aerial combat and can perform diving attacks.",
      },
      {
        name: "Himmelsblick",
        name_en: "Sky Sense",
        description: "Kann Wetter vorhersagen und Luftgefahren frühzeitig erkennen.",
        description_en: "Can predict weather and detect aerial dangers ahead of time.",
      },
    ],
  },
  votary: {
    id: "votary",
    name: "Geweihter",
    name_en: "Votary",
    classId: "paladin",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Erweiterte Priestermagie",
        name_en: "Enhanced Priest Magic",
        description:
          "Erhält Zugang zu Priesterzaubern früher als andere Paladine und mehr Zauberplätze.",
        description_en:
          "Gains access to priest spells earlier than other paladins and more spell slots.",
      },
      {
        name: "Heiliges Symbol",
        name_en: "Holy Symbol",
        description: "Sein heiliges Symbol verstärkt die Wirkung seiner göttlichen Zauber.",
        description_en: "His holy symbol amplifies the effect of his divine spells.",
      },
      {
        name: "Gottesdienst",
        name_en: "Divine Service",
        description:
          "Muss regelmäßig Gottesdienste abhalten und kann durch Gebet besondere Segen empfangen.",
        description_en:
          "Must regularly conduct worship services and can receive special blessings through prayer.",
      },
    ],
  },
  wyrmslayer: {
    id: "wyrmslayer",
    name: "Drachentöter",
    name_en: "Wyrmslayer",
    classId: "paladin",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Drachenjäger",
        name_en: "Dragon Hunter",
        description: "Erhält +2 auf Angriff und Schaden gegen alle Drachenarten.",
        description_en: "Gains +2 to hit and damage against all types of dragons.",
      },
      {
        name: "Drachenwissen",
        name_en: "Dragon Lore",
        description:
          "Umfassendes Wissen über Drachenarten, ihre Schwächen, Schätze und Verhaltensweisen.",
        description_en:
          "Comprehensive knowledge of dragon types, weaknesses, treasures, and behaviors.",
      },
      {
        name: "Furchtresistenz",
        name_en: "Fear Resistance",
        description:
          "Immun gegen den übernatürlichen Schrecken von Drachen und gewährt Verbündeten in der Nähe +2 auf Rettungswürfe.",
        description_en:
          "Immune to the supernatural dread of dragons and grants nearby allies +2 to saving throws.",
      },
    ],
  },

  // ── Druid Kits ───────────────────────────────────────────────────────
  avenger_druid: {
    id: "avenger_druid",
    name: "Rächer-Druide",
    name_en: "Avenger Druid",
    classId: "druid",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Racheschwur",
        name_en: "Vow of Vengeance",
        description:
          "Schwört Rache gegen Zerstörer der Natur und erhält Kampfboni gegen solche Feinde.",
        description_en:
          "Swears vengeance against destroyers of nature and gains combat bonuses against such foes.",
      },
      {
        name: "Erweiterte Kampffähigkeit",
        name_en: "Enhanced Combat",
        description: "Kann Schwerter und andere normalerweise für Druiden verbotene Waffen führen.",
        description_en: "Can wield swords and other weapons normally forbidden to druids.",
      },
      {
        name: "Einzelgänger",
        name_en: "Loner",
        description: "Handelt allein und wird von druidischen Zirkeln als Außenseiter betrachtet.",
        description_en: "Operates alone and is considered an outsider by druidic circles.",
      },
    ],
  },
  guardian_druid: {
    id: "guardian_druid",
    name: "Hüter-Druide",
    name_en: "Guardian Druid",
    classId: "druid",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Heiliges Hainland",
        name_en: "Sacred Grove",
        description:
          "Beschützt einen heiligen Hain und erhält dort Boni auf alle Zauber und Fähigkeiten.",
        description_en:
          "Protects a sacred grove and gains bonuses to all spells and abilities within it.",
      },
      {
        name: "Natürliche Warnung",
        name_en: "Nature's Warning",
        description: "Pflanzen und Tiere im Hain warnen den Druiden vor Eindringlingen.",
        description_en: "Plants and animals in the grove warn the druid of intruders.",
      },
      {
        name: "Haingebunden",
        name_en: "Grove Bound",
        description:
          "Verlässt nur ungern seinen Hain und erleidet Abzüge auf Zauber, je weiter er sich entfernt.",
        description_en:
          "Reluctant to leave the grove and suffers spell penalties the farther away he travels.",
      },
    ],
  },
  hivemaster: {
    id: "hivemaster",
    name: "Schwarmmeister",
    name_en: "Hivemaster",
    classId: "druid",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Insektenherrschaft",
        name_en: "Insect Mastery",
        description: "Kann Insektenschwärme herbeirufen und kontrollieren, um Feinde zu plagen.",
        description_en: "Can summon and control insect swarms to plague enemies.",
      },
      {
        name: "Giftimmunität",
        name_en: "Poison Immunity",
        description: "Immun gegen natürliche Insekten- und Spinnentiergifte.",
        description_en: "Immune to natural insect and arachnid poisons.",
      },
      {
        name: "Schwarmgestalt",
        name_en: "Swarm Shape",
        description:
          "Kann sich in einen Schwarm von Insekten verwandeln statt in größere Tierformen.",
        description_en: "Can transform into a swarm of insects instead of larger animal forms.",
      },
    ],
  },
  lost_druid: {
    id: "lost_druid",
    name: "Verlorener Druide",
    name_en: "Lost Druid",
    classId: "druid",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Verlorenes Land",
        name_en: "Lost Land",
        description:
          "Stammt aus einem zerstörten Ökosystem und sucht nach einem Weg, es wiederherzustellen.",
        description_en: "Comes from a destroyed ecosystem and seeks a way to restore it.",
      },
      {
        name: "Ödlandmagie",
        name_en: "Wasteland Magic",
        description:
          "Kann druidische Zauber in verwüsteten Gebieten wirken, wo andere Druiden versagen würden.",
        description_en:
          "Can cast druidic spells in devastated areas where other druids would fail.",
      },
      {
        name: "Heimatlose Wanderung",
        name_en: "Homeless Wandering",
        description:
          "Wandert ruhelos auf der Suche nach einem neuen Hain und hat kein festes Territorium.",
        description_en: "Wanders restlessly in search of a new grove with no fixed territory.",
      },
    ],
  },
  natural_philosopher: {
    id: "natural_philosopher",
    name: "Naturphilosoph",
    name_en: "Natural Philosopher",
    classId: "druid",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Naturwissenschaft",
        name_en: "Natural Science",
        description:
          "Studiert die Natur systematisch und kann Pflanzen, Tiere und Mineralien präzise bestimmen.",
        description_en:
          "Studies nature systematically and can precisely identify plants, animals, and minerals.",
      },
      {
        name: "Alchemie",
        name_en: "Alchemy",
        description:
          "Beherrscht grundlegende Alchemie und kann Heiltränke und Naturgifte herstellen.",
        description_en: "Masters basic alchemy and can brew healing potions and natural poisons.",
      },
      {
        name: "Gelehrter Rat",
        name_en: "Scholarly Counsel",
        description:
          "Kann als Berater fungieren und erhält Boni auf Wissenswürfe zu natürlichen Phänomenen.",
        description_en:
          "Can serve as an advisor and gains bonuses to knowledge checks about natural phenomena.",
      },
    ],
  },
  outlaw_druid: {
    id: "outlaw_druid",
    name: "Gesetzloser Druide",
    name_en: "Outlaw Druid",
    classId: "druid",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Waldgesetz",
        name_en: "Forest Law",
        description:
          "Lebt nach dem Gesetz des Waldes und widersetzt sich aktiv den Gesetzen der Zivilisation.",
        description_en:
          "Lives by the law of the forest and actively defies the laws of civilization.",
      },
      {
        name: "Guerillataktik",
        name_en: "Guerrilla Tactics",
        description: "Meister des Hinterhalts und der Guerillakriegsführung im Wald.",
        description_en: "Master of ambush and guerrilla warfare in the forest.",
      },
      {
        name: "Waldvolk-Anführer",
        name_en: "Woodland Band Leader",
        description: "Kann eine Gruppe von Waldläufern und Gesetzlosen anführen und koordinieren.",
        description_en: "Can lead and coordinate a band of woodsmen and outlaws.",
      },
    ],
  },
  pacifist_druid: {
    id: "pacifist_druid",
    name: "Friedens-Druide",
    name_en: "Pacifist Druid",
    classId: "druid",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Verstärkte Heilung",
        name_en: "Enhanced Healing",
        description: "Heilzauber heilen +2 Trefferpunkte pro Würfel zusätzlich.",
        description_en: "Healing spells restore +2 extra hit points per die rolled.",
      },
      {
        name: "Friedensaura",
        name_en: "Peace Aura",
        description: "Strahlt eine beruhigende Aura aus, die Kampflust bei Mensch und Tier dämpft.",
        description_en:
          "Radiates a calming aura that dampens aggression in both humans and animals.",
      },
      {
        name: "Gewaltlosigkeit",
        name_en: "Non-Violence",
        description:
          "Darf keine Waffen tragen und keinen Schaden direkt zufügen; verstößt er dagegen, verliert er Zauberkraft.",
        description_en:
          "May not carry weapons or deal damage directly; violating this causes loss of spell power.",
      },
    ],
  },
  savage_druid: {
    id: "savage_druid",
    name: "Wilder Druide",
    name_en: "Savage Druid",
    classId: "druid",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Primitiver Überlebenskampf",
        name_en: "Primitive Survival",
        description:
          "Lebt wie die wildesten Tiere und überlebt in den härtesten Umgebungen ohne Ausrüstung.",
        description_en:
          "Lives like the wildest animals and survives in the harshest environments without equipment.",
      },
      {
        name: "Verstärkte Tiergestalt",
        name_en: "Enhanced Wild Shape",
        description: "Kann sich früher und öfter in Tierformen verwandeln als andere Druiden.",
        description_en: "Can assume animal forms earlier and more often than other druids.",
      },
      {
        name: "Stammesrituale",
        name_en: "Tribal Rituals",
        description: "Kennt uralte Stammesrituale, die besondere druidische Effekte hervorrufen.",
        description_en: "Knows ancient tribal rituals that invoke special druidic effects.",
      },
    ],
  },
  shapeshifter_druid: {
    id: "shapeshifter_druid",
    name: "Gestaltwandler-Druide",
    name_en: "Shapeshifter Druid",
    classId: "druid",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Meistergestaltwandlung",
        name_en: "Master Shapeshifting",
        description:
          "Kann sich bereits auf niedriger Stufe in Tierformen verwandeln und behält mehr Kontrolle.",
        description_en: "Can assume animal forms at lower levels and retains more control.",
      },
      {
        name: "Erweiterte Formen",
        name_en: "Extended Forms",
        description:
          "Kann sich in exotischere Tierformen verwandeln, einschließlich magischer Tierwesen.",
        description_en: "Can transform into more exotic animal forms, including magical beasts.",
      },
      {
        name: "Formgedächtnis",
        name_en: "Form Memory",
        description:
          "Behält Erinnerungen und volle Intelligenz in Tiergestalt ohne Einschränkungen.",
        description_en:
          "Retains memories and full intelligence in animal form without restrictions.",
      },
    ],
  },
  totemic_druid: {
    id: "totemic_druid",
    name: "Totem-Druide",
    name_en: "Totemic Druid",
    classId: "druid",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Totemtier",
        name_en: "Totem Animal",
        description: "Wählt ein Totemtier, das besondere Kräfte und Einschränkungen verleiht.",
        description_en: "Chooses a totem animal that grants special powers and restrictions.",
      },
      {
        name: "Totemgestalt",
        name_en: "Totem Shape",
        description:
          "Kann sich ausschließlich in sein Totemtier verwandeln, erhält dabei aber Boni.",
        description_en: "Can only transform into the totem animal but gains bonuses when doing so.",
      },
      {
        name: "Totemgeist",
        name_en: "Totem Spirit",
        description:
          "Kann den Geist seines Totemtiers anrufen, um Rat und übernatürliche Hilfe zu erhalten.",
        description_en:
          "Can call upon the spirit of the totem animal for guidance and supernatural aid.",
      },
    ],
  },
  adviser_druid: {
    id: "adviser_druid",
    name: "Berater-Druide",
    name_en: "Adviser",
    classId: "druid",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Berater des Herrschers",
        name_en: "Counselor to a Ruler",
        description:
          "Dient als Berater eines Herrschers (Ritter, König, etc.) und nutzt seinen Einfluss, um die Natur zu schützen. Erhält freie Unterkunft am Hof.",
        description_en:
          "Serves as counselor to a ruler (knight, king, etc.) and uses influence to protect nature. Receives free lodging at court.",
      },
      {
        name: "Verkleidungskunst",
        name_en: "Disguise Skill",
        description:
          "Kann die Diebes-Fertigkeit Verkleidung zu normalen Kosten (statt doppelt) erlernen.",
        description_en:
          "Can purchase the rogue's disguise proficiency at normal rather than double cost.",
      },
      {
        name: "Augen in der Wildnis",
        name_en: "Eyes in the Wilderness",
        description:
          "Nutzt Tiere und Naturgeister als Informanten, um über Geschehnisse in der Umgebung informiert zu bleiben.",
        description_en:
          "Uses animals and nature spirits as informants to stay aware of events in the surrounding area.",
      },
    ],
  },
  beastfriend: {
    id: "beastfriend",
    name: "Tierfreund",
    name_en: "Beastfriend",
    classId: "druid",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Tierreaktion beeinflussen",
        name_en: "Animal Reaction Modification",
        description:
          "Kann die Reaktion von Tieren durch furchtloses Auftreten beeinflussen. Tiere erhalten -1 pro 4 Stufen auf ihren Rettungswurf gegen diesen Effekt.",
        description_en:
          "Can modify animal reactions through fearless approach. Animals suffer -1 per 4 levels on their saving throw against this effect.",
      },
      {
        name: "Tierkunde-Bonus",
        name_en: "Animal Lore Bonus",
        description:
          "Erhält +4 auf Würfe für Tierkunde, Tiertraining und Tierhandhabung. Kann diese Fertigkeiten auch ohne Slots nutzen (ohne Bonus).",
        description_en:
          "Gains +4 on animal lore, animal training, and animal handling checks. Can use these proficiencies even without slots (without bonus).",
      },
      {
        name: "Lykanthropen erkennen",
        name_en: "Recognize Lycanthropes",
        description:
          "Kann Lykanthropen in jeder Form erkennen, wenn ein Tierkunde-Wurf nach einer Runde Präsenz gelingt.",
        description_en:
          "Can recognize lycanthropes in any form on a successful animal lore check after one round of presence.",
      },
    ],
  },
  wanderer_druid: {
    id: "wanderer_druid",
    name: "Wanderer",
    name_en: "Wanderer",
    classId: "druid",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Schnellreise",
        name_en: "Fast Travel",
        description:
          "Reist ein Drittel schneller als normal über lange Distanzen. Als Führer erhöht er die Reisegeschwindigkeit der Gruppe um ein Sechstel.",
        description_en:
          "Travels one-third faster than normal over long distances. As a guide, increases the party's travel speed by one-sixth.",
      },
      {
        name: "Reisende Freundschaft",
        name_en: "Traveler's Friendship",
        description:
          "Erhält +1 Reaktionsbonus von Barden, Waldläufern und fahrendem Volk (Kesselflicker, Wandervolk).",
        description_en:
          "Gains +1 reaction adjustment bonus from bards, rangers, and traveling folk (tinkers, Gypsies).",
      },
      {
        name: "Geselliger Naturschützer",
        name_en: "Gregarious Naturalist",
        description:
          "Geselliger als andere Druiden — genießt den Kontakt mit Menschen, besonders der Landbevölkerung. Wird oft als Bote oder Missionar der druidischen Führung eingesetzt.",
        description_en:
          "More gregarious than most druids — enjoys meeting people, especially rural folk. Often used as messenger or missionary by druidic leaders.",
      },
    ],
  },
  village_druid: {
    id: "village_druid",
    name: "Dorf-Druide",
    name_en: "Village Druid",
    classId: "druid",
    hitDieOverride: null,
    maxArmorAC: null,
    armorSpellFailure: null,
    abilities: [
      {
        name: "Gemeinschaftshüter",
        name_en: "Community Guardian",
        description: "Dient als geistlicher Berater und Heiler einer Dorfgemeinschaft.",
        description_en: "Serves as a spiritual advisor and healer for a village community.",
      },
      {
        name: "Erntesegen",
        name_en: "Harvest Blessing",
        description: "Kann Felder segnen, um bessere Ernten zu erzielen, und Viehseuchen heilen.",
        description_en: "Can bless fields for better harvests and cure livestock diseases.",
      },
      {
        name: "Volksvertrauen",
        name_en: "Folk Trust",
        description:
          "Genießt das Vertrauen der Landbevölkerung und erhält bereitwillig Hilfe und Unterschlupf.",
        description_en: "Enjoys the trust of rural folk and readily receives help and shelter.",
      },
    ],
  },
};

/**
 * Get all kits available for a given class.
 */
export function getKitsForClass(classId: ClassId): KitDefinition[] {
  return Object.values(KITS).filter((kit) => kit.classId === classId);
}

/**
 * Get the effective hit die for a class, considering kit overrides.
 */
export function getEffectiveHitDie(baseHitDie: number, kit: string | null): number {
  if (!kit) return baseHitDie;
  const kitDef = KITS[kit];
  if (!kitDef || kitDef.hitDieOverride == null) return baseHitDie;
  return kitDef.hitDieOverride;
}

/**
 * Get kit definition by ID, or null if not found.
 */
export function getKit(kitId: string | null): KitDefinition | null {
  if (!kitId) return null;
  return KITS[kitId] ?? null;
}

/**
 * Check if equipped armor violates a kit's armor restriction.
 * Returns the kit's name_en if violated, null otherwise.
 * AD&D: lower AC = better armor, so equippedAC < maxArmorAC means too heavy.
 */
export function getKitArmorWarning(
  kit: string | null,
  equippedArmorAC: number | null
): { kitName: string; kitNameEn: string; maxAC: number } | null {
  if (!kit || equippedArmorAC == null) return null;
  const kitDef = KITS[kit];
  if (!kitDef?.maxArmorAC) return null;
  if (equippedArmorAC < kitDef.maxArmorAC) {
    return { kitName: kitDef.name, kitNameEn: kitDef.name_en, maxAC: kitDef.maxArmorAC };
  }
  return null;
}

/**
 * Get spell failure percentage for a kit when wearing armor.
 * Returns 0 if no spell failure or no kit.
 */
export function getKitSpellFailure(kit: string | null, wearsArmor: boolean): number {
  if (!kit || !wearsArmor) return 0;
  const kitDef = KITS[kit];
  return kitDef?.armorSpellFailure ?? 0;
}
