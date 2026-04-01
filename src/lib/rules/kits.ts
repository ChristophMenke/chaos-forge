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
        description: "Der Barbar nutzt einen d12 statt d10 als Trefferwürfel. Erfordert STR 15+.",
        description_en: "The barbarian uses a d12 instead of d10 as hit die. Requires STR 15+.",
      },
      {
        name: "+3/−3 Reaktionsmodifikator",
        name_en: "+3/−3 Reaction Modifier",
        description:
          "Bei Begegnungswurf 8 oder weniger: +3 Reaktionsbonus. Bei 14+: −3 Reaktionsmalus. Stammeskultur wird als bedrohlich oder respekteinflößend wahrgenommen.",
        description_en:
          "On encounter roll 8 or less: +3 reaction bonus. On 14+: −3 reaction penalty. Tribal culture is perceived as threatening or awe-inspiring.",
      },
      {
        name: "Max. Kettenrüstung",
        name_en: "Chain Mail Maximum",
        description:
          "Darf zu Beginn keine Rüstung schwerer als Schienen-/Band-/Bronzeplattenpanzer tragen. Muss alles Startgold bis auf 3 GM ausgeben.",
        description_en:
          "Cannot wear armor heavier than splint/banded/bronze plate at start. Must spend all starting gold except 3 gp.",
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
        name: "Berittene Waffenboni (steigend)",
        name_en: "Mounted Weapon Bonuses (Scaling)",
        description:
          "Stufe 1: +1 Treffer mit Lanze (beritten), +1 pro 6 Stufen. Stufe 3: +1 mit gewähltem Schwerttyp. Stufe 5: +1 mit Reiterwaffe (Streitkolben/Flegel/Picke). Erfordert STR 15, DEX 15, KON 15, INT 10, WIS 10; gute Gesinnung.",
        description_en:
          "Level 1: +1 to hit with lance (mounted), +1 per 6 levels. Level 3: +1 with chosen sword type. Level 5: +1 with horseman's weapon (mace/flail/pick). Requires STR 15, DEX 15, CON 15, INT 10, WIS 10; good alignment.",
      },
      {
        name: "Furchtimmunität & Mut-Aura (3 m)",
        name_en: "Fear Immunity & Courage Aura (3 m)",
        description:
          "Immun gegen Furcht-Zauber. Strahlt Mut-Aura im 3-m-Radius aus (negiert Furcht bei Verbündeten). +4 auf Rettungswürfe gegen geistbeeinflussende Magie (Charm, Schlaf, etc.).",
        description_en:
          "Immune to fear spells. Radiates courage aura in 3 m radius (negates fear in allies). +4 to saves vs. mind-affecting magic (charm, sleep, etc.).",
      },
      {
        name: "Ritterlicher Ehrenkodex",
        name_en: "Code of Chivalry",
        description:
          "Muss stärksten Gegner angreifen; keine Fernwaffen wenn Nahkampf möglich; muss stets beste verfügbare Rüstung tragen. 3-Stufen-Regel bei Verstößen: Warnung → Verlust der Vorteile → permanenter Verlust.",
        description_en:
          "Must attack strongest foe; no ranged weapons if melee is possible; must always wear best available armor. 3-strike rule for violations: warning → loss of benefits → permanent loss.",
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
        name: "−2 RK-Bonus (leichte Rüstung)",
        name_en: "−2 AC Bonus (Light Armor)",
        description:
          "Erhält −2 RK-Bonus (besser) wenn keine Rüstung, Leder oder Wattierung getragen wird. Erfordert INT 13+, DEX 13+.",
        description_en:
          "Gains −2 AC bonus (better) when wearing no armor, leather, or padded armor. Requires INT 13+, DEX 13+.",
      },
      {
        name: "+2 Reaktion (anderes Geschlecht)",
        name_en: "+2 Reaction (Opposite Sex)",
        description:
          "+2 Reaktionsbonus von NSCs des anderen Geschlechts. Schurken-Fertigkeiten kosten normale Slots (nicht doppelt).",
        description_en:
          "+2 reaction bonus from NPCs of the opposite sex. Rogue proficiencies cost normal slots (not double).",
      },
      {
        name: "Akrobatik & Fechtwaffen",
        name_en: "Tumbling & Fencing Weapons",
        description:
          "Freie Fertigkeiten: Etikette, Akrobatik. 2 extra Waffen-Slots für Stilett, Parierdolch, Rapier oder Säbel; muss diese spezialisieren bevor andere Waffen gewählt werden.",
        description_en:
          "Free proficiencies: Etiquette, Tumbling. 2 extra weapon slots for stiletto, main-gauche, rapier, or sabre; must specialize these before choosing other weapons.",
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
        name: "Berserkergang (+1/+3/+5 TP)",
        name_en: "Berserker Rage (+1/+3/+5 HP)",
        description:
          "Nach 10 Runden Aufbau: +1 Treffer, +3 Schaden, +5 TP. Immun gegen Charm, Schlaf, Furcht, Hold Person und ähnliche Zauber. +4 auf Rettungswürfe gegen Blindheit, Hold Person, Charm Monster, Verwirrung. Erfordert STR 15+.",
        description_en:
          "After 10 rounds build-up: +1 to hit, +3 damage, +5 HP. Immune to charm, sleep, fear, hold person, and similar spells. +4 to saves vs. blindness, hold person, charm monster, confusion. Requires STR 15+.",
      },
      {
        name: "Raserei-Einschränkungen",
        name_en: "Rage Restrictions",
        description:
          "Im Berserkergang: keine Fernwaffen, muss nächsten Feind angreifen, keine Deckung, Heilzauber verzögert bis nach Raserei.",
        description_en:
          "While raging: no ranged weapons, must attack nearest foe, cannot take cover, healing spells delayed until after rage.",
      },
      {
        name: "Erschöpfung nach Raserei",
        name_en: "Post-Rage Exhaustion",
        description:
          "Die +5 TP gehen nach Raserei verloren (kann unter 0 fallen). Kollabiert 1 Runde pro Runde Raserei (entspricht Schwächestrahl, kein Rettungswurf). −3 Reaktion von allen NSCs.",
        description_en:
          "The +5 HP are lost after rage (can drop below 0). Collapses 1 round per round of rage (equivalent to ray of enfeeblement, no save). −3 reaction from all NPCs.",
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
        name: "Freie Waffenspezialisierung",
        name_en: "Free Weapon Specialization",
        description:
          "Kostenlose Spezialisierung in einer Arena-Waffe (Bogen, Cestus, Dolch, Lasso, Netz, Krummsäbel, Kurzschwert, Speer, Dreizack, Peitsche). Kostet keinen Fertigkeitsslot.",
        description_en:
          "Free specialization in one arena weapon (bow, cestus, dagger, lasso, net, scimitar, short sword, spear, trident, whip). Costs no proficiency slot.",
      },
      {
        name: "Akrobatik & Streitwagen",
        name_en: "Tumbling & Charioteering",
        description:
          "Kostenlose Fertigkeiten: Akrobatik und Streitwagenfahren. Pflichtwaffen: Kurzschwert (Gladius), Dreizack, Netz.",
        description_en:
          "Free proficiencies: Tumbling and Charioteering. Required weapons: short sword (gladius), trident, net.",
      },
      {
        name: "Leicht erkennbar",
        name_en: "Easily Recognized",
        description:
          "Gladiatoren sind leicht identifizierbar. Promoter und Manager mischen sich ständig ein und versuchen, Auftritte und Kämpfe zu arrangieren.",
        description_en:
          "Gladiators are easily identifiable. Promoters and managers constantly interfere, trying to arrange appearances and fights.",
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
        name: "Freie Waffenspezialisierung (Militär)",
        name_en: "Free Weapon Specialization (Military)",
        description:
          "Kostenlose Spezialisierung in einer Militärwaffe (Streitaxt, Bogen, Armbrust, Lanze, Stangenwaffe, Speer, Schwert). Unterstützung durch mächtigen Militärpatron.",
        description_en:
          "Free specialization in one military weapon (battle axe, bow, crossbow, lance, polearm, spear, sword). Support from a powerful military patron.",
      },
      {
        name: "Militärisches Auftreten",
        name_en: "Military Bearing",
        description:
          "Sofort erkennbares militärisches Auftreten — macht Myrmidon leicht identifizier- und verfolgbar.",
        description_en:
          "Instantly recognizable military bearing — makes the myrmidon easy to identify and track.",
      },
      {
        name: "Militärgeschichte & Feuerkunst",
        name_en: "Military History & Fire-Building",
        description: "Kostenlose Fertigkeiten: Alte Geschichte (Militär) und Feuermachen.",
        description_en: "Free proficiencies: Ancient History (Military) and Fire-Building.",
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
        name: "Gift identifizieren (Stufe × 5%)",
        name_en: "Identify Poison (Level × 5%)",
        description:
          "Basiswert = Stufe × 5%. INT 13–15: +5%, INT 16–17: +10%, INT 18: +15%. Methode beeinflusst Genauigkeit: Sicht −20%, Geruch −15% (10% Kontaktrisiko), Geschmack −5% (25–100% Kontaktrisiko). Erfordert STR 12, DEX 12, INT 11.",
        description_en:
          "Base chance = level × 5%. INT 13–15: +5%, INT 16–17: +10%, INT 18: +15%. Method affects accuracy: sight −20%, smell −15% (10% contact risk), taste −5% (25–100% contact risk). Requires STR 12, DEX 12, INT 11.",
      },
      {
        name: "Alle Waffen erlaubt",
        name_en: "All Weapons Allowed",
        description:
          "Darf im Gegensatz zu normalen Dieben alle Waffen verwenden (nicht auf Diebeswaffen beschränkt).",
        description_en:
          "Unlike standard thieves, may use any weapon (not restricted to thief weapons).",
      },
      {
        name: "Reduzierte Fertigkeitspunkte",
        name_en: "Reduced Skill Points",
        description:
          "Nur 40 frei verteilbare Fertigkeitspunkte auf Stufe 1 (statt 60) und nur 20 pro Stufe (statt 30). −4 Reaktion von nicht-bösen NSCs, die den Beruf kennen.",
        description_en:
          "Only 40 discretionary skill points at level 1 (instead of 60) and only 20 per level (instead of 30). −4 reaction from non-evil NPCs who know the profession.",
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
        name: "Fährtensuche (Pflichtfertigkeit)",
        name_en: "Tracking (Required Proficiency)",
        description:
          "Muss die Fertigkeit Fährtensuche erwerben. Erfordert alle Attribute 11+ außer CHA; nicht-rechtschaffen.",
        description_en:
          "Must acquire the Tracking proficiency. Requires all abilities 11+ except CHA; non-lawful alignment.",
      },
      {
        name: "Bonus-Waffenslot + alle Waffen",
        name_en: "Bonus Weapon Slot + All Weapons",
        description:
          "1 zusätzlicher Waffenfertigkeitsslot auf Stufe 1 (3 gesamt). Darf alle Waffen verwenden (Nicht-Diebeswaffen kosten 2 Slots).",
        description_en:
          "1 bonus weapon proficiency slot at level 1 (3 total). May use all weapons (non-thief weapons cost 2 slots).",
      },
      {
        name: "Fertigkeitsfokus: +5% Fallen",
        name_en: "Skill Focus: +5% Traps",
        description: "+5% auf Fallen finden/entschärfen als Kit-Bonus.",
        description_en: "+5% to Find/Remove Traps as kit bonus.",
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
        name: "Springen, Akrobatik, Seiltanz",
        name_en: "Jumping, Tumbling, Tightrope Walking",
        description:
          "Diese Fähigkeiten gelten als angeborene Talente (auch ohne NWP-System). +1 Bonus auf Fertigkeitswürfe, +2 ohne Rüstung. Erfordert STR 12+, DEX 14+. Keine Zwerge.",
        description_en:
          "These abilities are treated as innate talents (even without NWP system). +1 bonus to proficiency checks, +2 when unarmored. Requires STR 12+, DEX 14+. No dwarves.",
      },
      {
        name: "Fertigkeitsboni: +5% Mauern, +5% Taschen",
        name_en: "Skill Bonuses: +5% Walls, +5% Pockets",
        description:
          "+5% auf Mauern erklimmen und +5% auf Taschen leeren. −5% auf Schlösser öffnen, −5% auf Fallen, −5% auf Sprachen lesen.",
        description_en:
          "+5% to Climb Walls and +5% to Pick Pockets. −5% to Open Locks, −5% to Traps, −5% to Read Languages.",
      },
      {
        name: "Nur leichte Belastung",
        name_en: "Light Encumbrance Only",
        description: "Nur leichte Belastung erlaubt für volle Akrobatik-Vorteile.",
        description_en: "Light encumbrance only to gain full acrobatics benefits.",
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
        name: "+10% Schleichen/Verbergen (Wildnis)",
        name_en: "+10% Move Silently/Hide (Wilderness)",
        description:
          "+10% auf Lautlos bewegen und Im Schatten verbergen in der Wildnis. Elfenvariante: +15% im Wald, +5% in anderer Wildnis.",
        description_en:
          "+10% to Move Silently and Hide in Shadows in wilderness. Elven variant: +15% in forest, +5% in other wilderness.",
      },
      {
        name: "Bessere Überraschungschance (Wildnis)",
        name_en: "Better Surprise Chance (Wilderness)",
        description: "1-auf-6 bessere Überraschungschance in der Wildnis.",
        description_en: "1-in-6 better surprise chance in wilderness.",
      },
      {
        name: "−5% in Städten",
        name_en: "−5% in Urban Settings",
        description:
          "−5% auf alle Diebesfähigkeiten in städtischer Umgebung. Pflichtfertigkeiten: Richtungssinn, Fährtensuche.",
        description_en:
          "−5% to all thief skills in urban settings. Required proficiencies: Direction Sense, Tracking.",
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
        name: "Fertigkeitsfokus: +5% Schlösser",
        name_en: "Skill Focus: +5% Open Locks",
        description:
          "+5% auf Schlösser öffnen als Kit-Bonus. −5% auf Taschen leeren. Erfordert STR 10+, DEX 13+.",
        description_en:
          "+5% to Open Locks as kit bonus. −5% to Pick Pockets. Requires STR 10+, DEX 13+.",
      },
      {
        name: "Pflichtfertigkeiten: Wachsamkeit, Plündern",
        name_en: "Required: Alertness, Looting",
        description:
          "Pflichtfertigkeiten: Wachsamkeit und Plündern. Fokus auf Schlösser, Fallen, Schleichen, Verbergen, Geräusche hören, Mauern erklimmen.",
        description_en:
          "Required proficiencies: Alertness and Looting. Focus on locks, traps, stealth, hiding, detect noise, climb walls.",
      },
      {
        name: "Einbruchs-Spezialist",
        name_en: "Burglary Specialist",
        description:
          "Spezialisiert auf das Eindringen in Gebäude. Wertschätzung von Schätzen ist eine Kernkompetenz.",
        description_en:
          "Specialized in breaking into buildings. Appraising treasure is a core competency.",
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
        name: "Verkleidung, Informationsbeschaffung, Beobachtung",
        name_en: "Disguise, Information Gathering, Observation",
        description:
          "Pflichtfertigkeiten: Verkleidung, Informationsbeschaffung, Beobachtung. Erfordert INT 11+. Nichtmenschliche Spione haben Schwierigkeiten, sich als andere Rassen zu verkleiden.",
        description_en:
          "Required proficiencies: Disguise, Information Gathering, Observation. Requires INT 11+. Demihuman spies face difficulty disguising as other races.",
      },
      {
        name: "Lippenlesen",
        name_en: "Read Lips",
        description: "Kann Gespräche durch Lippenlesen auf Entfernung verfolgen.",
        description_en: "Can follow conversations at a distance by reading lips.",
      },
      {
        name: "Rollenspiel-Fokus",
        name_en: "Roleplay Focus",
        description:
          "Keine besonderen mechanischen Boni — Stärke des Kits liegt in sozialer Infiltration und Informationsgewinnung.",
        description_en:
          "No special mechanical bonuses — the kit's strength lies in social infiltration and intelligence gathering.",
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
        name: "Stufenbasierte Fähigkeiten (1×/Woche)",
        name_en: "Level-Based Abilities (1/Week)",
        description:
          "Stufe 3: Vertrauten rufen (1,6 km pro Stufe). Stufe 5: Beruhigungsmittel brauen (Schlaf-Gift, kein Effekt ab 8+ TW). Stufe 7: Gift brauen (Klasse L Kontaktgift). Stufe 9: Bezaubern (Charm ohne Rettungswurf, bis Stufe 8). Stufe 11: Flugsalbe. Stufe 13: Hexenfluch (kein Rettungswurf, 24 Std.).",
        description_en:
          "Level 3: Secure Familiar (1.6 km per level). Level 5: Brew Calmative (sleep-poison, no effect on 8+ HD). Level 7: Brew Poison (Class L contact). Level 9: Beguile (charm, no save, up to level 8). Level 11: Brew Flying Ointment. Level 13: Witch's Curse (no save, 24 hrs).",
      },
      {
        name: "Startzauber + magische Gegenstände",
        name_en: "Starting Spells + Magic Items",
        description:
          "Magie entdecken und Magie lesen kostenlos (zählen nicht gegen Slots). Bis zu 1.500 GM in magischen Gegenständen bei Start. Erfordert INT 13+, WIS 13+, KON 13+.",
        description_en:
          "Detect magic and read magic free (don't count against slots). Up to 1,500 gp of magic items at start. Requires INT 13+, WIS 13+, CON 13+.",
      },
      {
        name: "Keine Waffenfertigkeiten",
        name_en: "No Weapon Proficiencies",
        description: "Hexen dürfen niemals Waffenfertigkeiten erlernen.",
        description_en: "Witches may never learn weapon proficiencies.",
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
        name: "Bonus-Waffenslot + Krieger-Fertigkeiten",
        name_en: "Bonus Weapon Slot + Warrior Proficiencies",
        description:
          "1 kostenloser Waffenfertigkeitsslot. Krieger-Fertigkeiten kosten normale Slots (nicht doppelt). Erfordert STR 13+.",
        description_en:
          "1 free weapon proficiency slot. Warrior proficiencies cost normal slots (not double). Requires STR 13+.",
      },
      {
        name: "Zusätzliche verbotene Schulen",
        name_en: "Extra Opposition Schools",
        description:
          "Muss zusätzliche Magieschulen über normale Spezialist-Beschränkungen hinaus aufgeben. Magier-Variante: Wahl zwischen keine Stufe-8/9-Zauber, INT −2 behandelt, oder auf 5 Schulen beschränkt.",
        description_en:
          "Must give up additional magic schools beyond normal specialist restrictions. Mage variant: choose between no level 8/9 spells, treat INT as 2 lower, or limited to 5 schools.",
      },
      {
        name: "Zauberfehlschlag in Rüstung (20%)",
        name_en: "Spell Failure in Armor (20%)",
        description: "20% Zauberfehlschlag-Chance wenn Rüstung getragen wird.",
        description_en: "20% spell failure chance when wearing armor.",
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
        name: "Wahl-Fähigkeit (1×/Woche)",
        name_en: "Chosen Ability (1/Week)",
        description:
          "Bei Erstellung wählen: (1) Schutztalisman brauen (1 Std., wie Schutz vor Bösem, 1 Tag). (2) Tonpuppe (15 cm, 1W4 Schaden unabhängig von Entfernung, gleiche Ebene). (3) Omen lesen (günstig: +50% Bewegung, Gegner −1 Treffer; ungünstig: −1 Treffer/Rettungswürfe). Erfordert STR 11+, KON 13+.",
        description_en:
          "Choose at creation: (1) Brew protective talisman (1 hr, as Protection from Evil, 1 day). (2) Clay replicant (15 cm, 1d4 damage regardless of distance, same plane). (3) Read omen (favorable: +50% movement, opponents −1 to hit; unfavorable: −1 to hit/saves). Requires STR 11+, CON 13+.",
      },
      {
        name: "−2 Reaktion von Nichtstammesangehörigen",
        name_en: "−2 Reaction from Non-Tribal NPCs",
        description: "−2 Reaktionsmalus von allen NSCs, die nicht dem eigenen Stamm angehören.",
        description_en: "−2 reaction penalty from all NPCs not of own tribe.",
      },
      {
        name: "Reduziertes Startgold",
        name_en: "Reduced Starting Gold",
        description: "Startgeld: (1W4+1) × 5 GM.",
        description_en: "Starting money: (1d4+1) × 5 gp.",
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
        name: "+3 Reaktion von Gelehrten",
        name_en: "+3 Reaction from Scholars",
        description: "+3 Reaktionsbonus von Gelehrten, Forschern, Lehrern und Korrespondenten.",
        description_en:
          "+3 reaction bonus from scholars, researchers, teachers, and correspondents.",
      },
      {
        name: "+1 auf INT- und WIS-Würfe",
        name_en: "+1 to INT and WIS Checks",
        description: "+1 Bonus auf alle Intelligenz- und Weisheitswürfe (pauschale Option).",
        description_en: "+1 bonus to all Intelligence and Wisdom checks (flat option).",
      },
      {
        name: "−1 Treffer im ersten Nahkampf",
        name_en: "−1 to Hit on First Melee Blow",
        description: "−1 auf den ersten Nahkampf-Angriffswurf gegen jeden neuen Gegner.",
        description_en: "−1 to the first melee attack roll against each new opponent.",
      },
    ],
  },

  // ── Priest Kits ───────────────────────────────────────────────────────
  fighting_priest: {
    id: "fighting_priest",
    name: "Kampfmönch",
    name_en: "Fighting Monk",
    classId: "cleric",
    hitDieOverride: null,
    maxArmorAC: 10, // no armor allowed
    armorSpellFailure: null,
    abilities: [
      {
        name: "Waffenlose Kampfspezialisierung",
        name_en: "Unarmed Combat Specialization",
        description:
          "2 freie Waffenslots für Spezialisierung in einem waffenlosen Kampfstil (Faustkampf, Ringen oder Kampfkunst). Zugang zu allen 5 Fertigkeitsgruppen (keine doppelten Slot-Kosten). Erfordert DEX 12+.",
        description_en:
          "2 free weapon slots for specialization in one unarmed combat style (Punching, Wrestling, or Martial Arts). Crossover with all 5 proficiency groups (no double-slot cost). Requires DEX 12+.",
      },
      {
        name: "Keine Rüstung erlaubt",
        name_en: "No Armor Allowed",
        description:
          "Darf niemals Rüstung tragen. Mittlere Kampffähigkeit: max 3 Haupt-Sphärenzugänge (eine muss All sein) und 2 Neben-Zugänge.",
        description_en:
          "May never wear armor. Medium combat ability: max 3 major sphere accesses (one must be All) and 2 minor accesses.",
      },
      {
        name: "Minimaler Besitz",
        name_en: "Minimal Possessions",
        description: "Darf nie mehr besitzen, als auf dem Rücken getragen werden kann.",
        description_en: "May never own more than can be carried on one's back.",
      },
    ],
  },
  pacifist_priest: {
    id: "pacifist_priest",
    name: "Friedenspriester",
    name_en: "Pacifist Priest",
    classId: "cleric",
    hitDieOverride: null,
    maxArmorAC: 10, // no armor
    armorSpellFailure: null,
    abilities: [
      {
        name: "+2 CHA (max 18) & +2 Reaktion",
        name_en: "+2 CHA (Max 18) & +2 Reaction",
        description:
          "+2 auf Charisma (max 18). +2 Reaktion von allen, die der pazifistischen Philosophie nicht feindlich gegenüberstehen.",
        description_en:
          "+2 to Charisma (max 18). +2 reaction from anyone not opposed to pacifist philosophy.",
      },
      {
        name: "Absolutes Gewaltverbot",
        name_en: "Absolute Non-Violence",
        description:
          "Darf niemals Rüstung tragen, niemals Waffen/Zauber/Taktik einsetzen, um Kreaturen zu verletzen. Verstoß: Verlust aller Zauber für 1 Monat. Nur Bogen und Wurfpfeil (für Wettkampf).",
        description_en:
          "May never wear armor, never use weapons/spells/tactics to harm any creature. Violation: lose all spells for 1 month. Only bow and dart (for competition only).",
      },
      {
        name: "Friedensstiftung",
        name_en: "Peacemaking",
        description:
          "Natürliche Aura des Friedens hält Angreifer ab, solange der Priester nicht angreift.",
        description_en:
          "Natural aura of peace deters attackers as long as the priest does not attack.",
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
        name: "Tierempathie-Bonus",
        name_en: "Animal Empathy Bonus",
        description:
          "Verbesserte Tierempathie — wilde Tiere reagieren freundlicher. Tiergefährte unterstützt in Kampf und Erkundung.",
        description_en:
          "Enhanced animal empathy — wild animals react more favorably. Animal companion aids in combat and exploration.",
      },
      {
        name: "Mit Tieren sprechen (1×/Tag)",
        name_en: "Speak with Animals (1/Day)",
        description:
          "Kann einmal pro Tag mit Tieren sprechen, als wäre der gleichnamige Zauber gewirkt worden.",
        description_en:
          "Can speak with animals once per day as if the spell of the same name were cast.",
      },
      {
        name: "Nur Lederrüstung",
        name_en: "Leather Armor Only",
        description: "Darf nur Lederrüstung oder leichtere Rüstung tragen.",
        description_en: "May only wear leather armor or lighter.",
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
          "+1 auf Angriffswürfe mit einer gewählten Waffe durch kunstvolles Kampftraining.",
        description_en: "+1 to attack rolls with a chosen weapon through artistic combat training.",
      },
      {
        name: "Kampftanz",
        name_en: "Combat Dance",
        description: "Hypnotisierender Kampftanz der Gegner ablenkt und Verbündete inspiriert.",
        description_en: "Mesmerizing combat dance that distracts enemies and inspires allies.",
      },
      {
        name: "Klingenlied",
        name_en: "Blade Song",
        description:
          "Magisches Lied, das die Klinge mit Energie erfüllt und zusätzlichen Schaden verursacht.",
        description_en:
          "Magical song that infuses the blade with energy, dealing additional damage.",
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
        name: "Totem-Reittier & telepathische Bindung",
        name_en: "Totem Mount & Telepathic Bond",
        description:
          "Wählt eine Totem-Tierart als Reittier. Telepathische Bindung (emotionale Wahrnehmung und Richtungsgefühl auf jede Entfernung). Freie Fertigkeiten: Tiertraining + Reiten. Erfordert CHA 13+.",
        description_en:
          "Chooses a totem species as mount. Telepathic bond (emotional sense and directional awareness at any range). Free proficiencies: Animal Training + Riding. Requires CHA 13+.",
      },
      {
        name: "+5 Reaktion von Totem-Tierart",
        name_en: "+5 Reaction from Totem Species",
        description:
          "+5 Reaktionsbonus von Totem-Tierart. −3 Reaktion von NSCs anderer Kulturen. Tod des Reittiers: 2W6 Schaden + Rettungswurf gegen Zauber oder Schwachsinn für 2W6 Stunden.",
        description_en:
          "+5 reaction from totem species. −3 reaction from NPCs of other cultures. Mount death: 2d6 damage + save vs. spells or feeblemind for 2d6 hours.",
      },
      {
        name: "Startgold auf 3 GM beschränkt",
        name_en: "Starting Gold Limited to 3 gp",
        description: "Muss alles Startgold bis auf 3 GM ausgeben.",
        description_en: "Must spend all starting gold except 3 gp.",
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
        name: "+3 Reaktion & 225 GM extra",
        name_en: "+3 Reaction & 225 gp Extra",
        description:
          "+3 Reaktion von NSCs der eigenen Kultur. Startet mit 225 GM + Standard-Startgold. Kann Unterkunft für bis zu 2 × Stufe Begleiter fordern. Erfordert STR 13+, KON 13+.",
        description_en:
          "+3 reaction from own-culture NPCs. Starts with 225 gp + standard starting gold. Can demand shelter for up to 2 × level companions. Requires STR 13+, CON 13+.",
      },
      {
        name: "Niedere Gerichtsbarkeit",
        name_en: "Low Justice",
        description:
          "Niedere Gerichtsbarkeit über Gemeine im eigenen Land. Freie Fertigkeiten: Etikette, Heraldik, Reiten.",
        description_en:
          "Low justice over commoners in own land. Free proficiencies: Etiquette, Heraldry, Riding.",
      },
      {
        name: "Standesgemäße Ausgaben (+10%/Stufe)",
        name_en: "Noble Expenses (+10%/Level)",
        description:
          "Muss beste verfügbare Qualität kaufen — +10% pro Erfahrungsstufe über Basiskosten. Eid an einen Lehnsherrn (Pflicht zur Begleitung in den Kampf). Rufverlust: +3 wird zu −6.",
        description_en:
          "Must buy best available quality — +10% per experience level above base cost. Oath to a lord (duty to accompany into combat). Reputation loss: +3 becomes −6.",
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
        name: "Zuflucht in Heimatgemeinde",
        name_en: "Shelter in Home Community",
        description:
          "Erhält immer Unterkunft, Nahrung und Basishilfe (Dolche, 0-Stufe-Helfer) in der Heimatgemeinde. Muss alles Startgold bis auf 3 GM ausgeben.",
        description_en:
          "Always has shelter, food, and basic help (daggers, 0-level helpers) in home community. Must spend all starting gold except 3 gp.",
      },
      {
        name: "Pflicht gegenüber der Gemeinde",
        name_en: "Community Obligations",
        description:
          "Gemeinde ruft den Helden ständig um Hilfe. Verweigerung: −2 Reaktion von allen Bauern bis zur Versöhnung.",
        description_en:
          "Community constantly calls on the hero for help. Refusal: −2 reaction from all peasants until reconciled.",
      },
      {
        name: "Landwirtschaft & Wetterkunde",
        name_en: "Agriculture & Weather Sense",
        description:
          "Freie Fertigkeiten: Landwirtschaft oder Fischerei + Wetterkunde oder Tierkunde.",
        description_en:
          "Free proficiencies: Agriculture or Fishing + Weather Sense or Animal Lore.",
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
        name: "Kiai-Schrei (STR 19/00, 1×/Tag/Stufe)",
        name_en: "Kiai Shout (STR 19/00, 1/Day/Level)",
        description:
          "Einmal pro Tag pro Stufe: STR auf 19/00 für 1 Runde erhöhen (lauter Kiai-Schrei erforderlich). 2 extra Waffen-Slots bei Start (6 gesamt). Erfordert STR 13, WIS 13, KON 13, INT 14; rechtschaffen.",
        description_en:
          "Once per day per level: raise STR to 19/00 for 1 round (loud kiai shout required). 2 extra weapon slots at start (6 total). Requires STR 13, WIS 13, CON 13, INT 14; lawful alignment.",
      },
      {
        name: "Katana-Spezialisierung (Pflicht)",
        name_en: "Katana Specialization (Required)",
        description:
          "Muss spezialisieren: Katana (2 Slots) + Daikyu (3 Slots). 1 Restslot nur aus Samurai-Waffen. Freies Katana bei Start.",
        description_en:
          "Must specialize: katana (2 slots) + daikyu (3 slots). 1 remaining slot from samurai weapons only. Free katana at start.",
      },
      {
        name: "Bushido-Gehorsam / Ronin",
        name_en: "Bushido Obedience / Ronin",
        description:
          "Absoluter Gehorsam gegenüber Lehnsherrn (inkl. Selbstaufopferung). Ungehorsam: Seppuku erwartet. Verweigert: Ronin — verdient nur halbe EP bis neuer Eid.",
        description_en:
          "Absolute obedience to lord (including self-sacrifice). Disobeying: expected to commit seppuku. If refused: becomes ronin — earns half XP until sworn to a new lord.",
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
        name: "+5 Überlebenswurf (Heimat)",
        name_en: "+5 Survival Check (Home Terrain)",
        description: "+5 Bonus auf Überlebenswürfe im Heimatgelände. Erfordert KON 13+.",
        description_en:
          "+5 bonus to Survival proficiency checks in native terrain. Requires CON 13+.",
      },
      {
        name: "Ausdauer & Überleben (frei)",
        name_en: "Endurance & Survival (Free)",
        description: "Freie Fertigkeiten: Überleben (Heimatgelände) und Ausdauer.",
        description_en: "Free proficiencies: Survival (native environment) and Endurance.",
      },
      {
        name: "Kulturelle Fremdheit",
        name_en: "Cultural Unfamiliarity",
        description:
          "Unvertrautheit mit anderen Kulturen auf niedrigen Stufen (Rollenspiel-Einschränkung).",
        description_en: "Unfamiliarity with other cultures at early levels (roleplay restriction).",
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
        name: "Generalist (keine Einschränkungen)",
        name_en: "Generalist (No Restrictions)",
        description:
          "Keine besonderen Vorteile, aber auch keine Einschränkungen. Standard-Diebesfähigkeiten und -Progression.",
        description_en:
          "No special benefits, but also no restrictions. Standard thief skills and progression.",
      },
      {
        name: "Keine Kit-Boni oder -Mali",
        name_en: "No Kit Bonuses or Penalties",
        description:
          "Das reinste Dieb-Kit — maximale Flexibilität bei der Verteilung der Fertigkeitspunkte.",
        description_en: "The purest thief kit — maximum flexibility in distributing skill points.",
      },
      {
        name: "Standard-Ausrüstung",
        name_en: "Standard Equipment",
        description: "Keine Ausrüstungs- oder Startgeld-Einschränkungen.",
        description_en: "No equipment or starting gold restrictions.",
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
        name: "Pflichtfertigkeiten: Informationsbeschaffung, Beobachtung",
        name_en: "Required: Information Gathering, Observation",
        description: "Muss die Fertigkeiten Informationsbeschaffung und Beobachtung erwerben.",
        description_en: "Must acquire the Information Gathering and Observation proficiencies.",
      },
      {
        name: "Fertigkeitsfokus: −5% Taschen leeren",
        name_en: "Skill Focus: −5% Pick Pockets",
        description:
          "−5% auf Taschen leeren als Kit-Anpassung. Fokus liegt auf Ermittlung statt Diebstahl.",
        description_en:
          "−5% to Pick Pockets as kit adjustment. Focus is on investigation rather than theft.",
      },
      {
        name: "Ermittlungs-Spezialist",
        name_en: "Investigation Specialist",
        description:
          "Spezialisiert auf Tatort-Untersuchung, Verhörtechniken und das Zusammensetzen von Hinweisen.",
        description_en:
          "Specialized in crime scene examination, interrogation techniques, and piecing together clues.",
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
        name: "+1 Überraschungswurf",
        name_en: "+1 Surprise Roll",
        description: "+1 Bonus auf den Überraschungswurf.",
        description_en: "+1 bonus to surprise roll.",
      },
      {
        name: "Fertigkeitsfokus: −5% Taschen, −5% Schlösser",
        name_en: "Skill Focus: −5% Pockets, −5% Locks",
        description: "−5% auf Taschen leeren und −5% auf Schlösser öffnen als Kit-Anpassung.",
        description_en: "−5% to Pick Pockets and −5% to Open Locks as kit adjustment.",
      },
      {
        name: "Schmuggel-Spezialist",
        name_en: "Smuggling Specialist",
        description: "Spezialisiert auf das Verstecken von Fracht, geheime Routen und Bestechung.",
        description_en: "Specialized in concealing cargo, secret routes, and bribery.",
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
        name: "+3 Treffer/+3 Schaden (Erstangriff)",
        name_en: "+3 to Hit/+3 Damage (First Strike)",
        description:
          "Beim ersten Nahkampf gegen einen männlichen Gegner unter Stufe 5 (aus Kultur ohne Kriegerinnen): +3 Treffer und +3 Schaden auf den ersten Schlag. Nur weiblich.",
        description_en:
          "On first melee against a male opponent under level 5 (from culture with rare female warriors): +3 to hit and +3 damage on first blow. Female only.",
      },
      {
        name: "Amazonen-Kampftraining",
        name_en: "Amazon Combat Training",
        description:
          "Kriegerisches Training aus der Stammestradition. Komfortabel mit Waffen und Nahkampf.",
        description_en:
          "Warrior training from tribal tradition. Comfortable with weapons and melee combat.",
      },
      {
        name: "Stammesmagie",
        name_en: "Tribal Magic",
        description: "Spezialisiert auf naturnahe und elementare Zauber der Stammestradition.",
        description_en: "Specializes in nature-based and elemental spells from tribal tradition.",
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
        name: "Freie Unterkunft + +2 Reaktion",
        name_en: "Free Shelter + +2 Reaction",
        description:
          "Freie Nahrung und Unterkunft in der Heimat von Gemeinen (auch für Begleiter). +2 Reaktion von Bauern überall.",
        description_en:
          "Free food and shelter in homeland from commoners (extends to companions). +2 reaction from peasants anywhere.",
      },
      {
        name: "Besitzbeschränkung (max 75 GM)",
        name_en: "Possession Limit (Max 75 gp)",
        description:
          "Darf nur 1 Gegenstand bis 15 GM besitzen; alle anderen max 10 GM; Gesamtbesitz nie über 75 GM. Startgeld: (1W4+1) × 5 GM.",
        description_en:
          "May own only one item up to 15 gp; all others max 10 gp; total possessions never exceed 75 gp. Starting money: (1d4+1) × 5 gp.",
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
        name: "+3 Treffer/+3 Schaden (Erstangriff)",
        name_en: "+3 to Hit/+3 Damage (First Strike)",
        description:
          "+3 Treffer und +3 Schaden auf den ersten Schlag gegen männliche Gegner aus Kulturen ohne Kriegerinnen. Nicht gegen Krieger ab Stufe 5 oder andere Klassen ab Stufe 8.",
        description_en:
          "+3 to hit and +3 damage on first blow vs. male opponents from cultures with rare female fighters. Not vs. warriors level 5+ or other classes level 8+.",
      },
      {
        name: "Keine Krankheits-/Friedensgottheiten",
        name_en: "No Disease/Peace Deities",
        description:
          "Darf keiner Gottheit der Krankheit oder des Friedens dienen. Speer und Langbogen empfohlen.",
        description_en: "Cannot serve gods of Disease or Peace. Spear and long bow recommended.",
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
        name: "+1/+3 Reaktion",
        name_en: "+1/+3 Reaction",
        description:
          "+1 Reaktion von allen NSCs; +3 von Angehörigen der eigenen Kultur. Wenn Kultur Berserker hat: Berserkergang in Anwesenheit des Priesters in 5 Runden statt 10 erreichbar.",
        description_en:
          "+1 reaction from all NPCs; +3 from own culture members. If culture has berserkers: rage achievable in 5 rounds instead of 10 in priest's presence.",
      },
      {
        name: "Max. Schienen-/Bandpanzer zu Beginn",
        name_en: "Max Splint/Banded at Start",
        description:
          "Darf bei Erstellung keine Rüstung schwerer als Schienen-/Band-/Bronzeplattenpanzer tragen.",
        description_en: "Cannot start with armor heavier than splint/banded/bronze plate mail.",
      },
      {
        name: "Stammesrituale",
        name_en: "Tribal Rituals",
        description:
          "Kann schamanistische Rituale durchführen, die besondere göttliche Effekte hervorrufen.",
        description_en: "Can perform shamanistic rituals that invoke special divine effects.",
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
        name: "Waffenlose Kampfspezialisierung",
        name_en: "Unarmed Combat Specialization",
        description:
          "2 freie Waffenslots für Spezialisierung in einem waffenlosen Kampfstil (Faustkampf, Ringen oder Kampfkunst). Zugang zu allen 5 Fertigkeitsgruppen. Erfordert DEX 12+.",
        description_en:
          "2 free weapon slots for specialization in one unarmed style (Punching, Wrestling, or Martial Arts). Crossover with all 5 proficiency groups. Requires DEX 12+.",
      },
      {
        name: "Keine Rüstung, eingeschränkte Sphären",
        name_en: "No Armor, Limited Spheres",
        description:
          "Darf niemals Rüstung tragen. Mittlere Kampffähigkeit: max 3 Haupt-Sphärenzugänge (eine muss All sein) und 2 Neben-Zugänge.",
        description_en:
          "May never wear armor. Medium combat: max 3 major sphere accesses (one must be All) and 2 minor accesses.",
      },
      {
        name: "Minimaler Besitz",
        name_en: "Minimal Possessions",
        description: "Darf nie mehr besitzen, als auf dem Rücken getragen werden kann.",
        description_en: "May never own more than can be carried on one's back.",
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
        name: "+3/+2 Reaktion von Adligen",
        name_en: "+3/+2 Reaction from Nobles",
        description:
          "+3 Reaktion von Adligen der eigenen Kultur; +2 von Adligen anderer Kulturen. Kann Unterkunft für 2 × Stufe Personen im eigenen Land fordern. Startgold: 225 GM + Standard.",
        description_en:
          "+3 reaction from nobles of own culture; +2 from nobles of other cultures. Can demand shelter for 2 × level people in own land. Starting gold: 225 gp + standard.",
      },
      {
        name: "Standesgemäße Ausgaben (2× Mindestpreis)",
        name_en: "Noble Expenses (2× Minimum Price)",
        description:
          "Muss mindestens den doppelten Mindestpreis für alle Einkäufe zahlen. Andere Adelspriester können Unterkunft von ihm fordern.",
        description_en:
          "Must spend at least 2× minimum price on all purchases. Other nobleman priests can demand shelter from him.",
      },
      {
        name: "Kirchliche & Adlige Doppelpflicht",
        name_en: "Church & Noble Dual Duty",
        description:
          "Muss sowohl den Pflichten des Adels als auch der Kirche nachkommen — Konflikte vorprogrammiert.",
        description_en:
          "Must fulfill duties to both nobility and church — conflicts are inevitable.",
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
        name: "Keine übergeordnete Autorität",
        name_en: "No Superior Authority",
        description:
          "Nimmt keine Befehle von der Priesterhierarchie entgegen. Vollständig unabhängig.",
        description_en: "Takes no orders from the priestly hierarchy. Completely independent.",
      },
      {
        name: "Von Priestern & Behörden verfolgt",
        name_en: "Hunted by Priests & Authorities",
        description:
          "Wird von der normalen Priesterschaft bekämpft. Tempelbau immer zum vollen Preis (nie halber Preis). Gesucht von lokalen Autoritäten.",
        description_en:
          "Opposed by the normal priesthood. Temple construction always at full price (never half). Sought by local authorities.",
      },
      {
        name: "Schutz der Unterdrückten",
        name_en: "Protection of the Oppressed",
        description: "Genießt den Schutz und die Loyalität von Gesetzlosen und Unterdrückten.",
        description_en: "Enjoys the protection and loyalty of outlaws and the oppressed.",
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
        name: "Freie Unterkunft + +2 Reaktion",
        name_en: "Free Shelter + +2 Reaction",
        description:
          "Freie Unterkunft in der Heimatgemeinde (auch vor Behörden geschützt). +2 Reaktion von allen Bauern.",
        description_en:
          "Free shelter in home community (even protected from authorities). +2 reaction from all peasants.",
      },
      {
        name: "Besitzbeschränkung (max 75 GM)",
        name_en: "Possession Limit (Max 75 gp)",
        description:
          "Nur 1 Gegenstand bis 15 GM; alle anderen max 10 GM; Gesamtbesitz nie über 75 GM.",
        description_en:
          "Only one item up to 15 gp; all others max 10 gp; total possessions never exceed 75 gp.",
      },
      {
        name: "Kräuterkunde & Volksmedizin",
        name_en: "Herbalism & Folk Medicine",
        description: "Kennt Heilkräuter und einfache Hausmittel, die Heilzauber ergänzen.",
        description_en: "Knows healing herbs and simple remedies that complement healing spells.",
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
        name: "Prophezeiung (1×/Tag Trance)",
        name_en: "Prophecy (1/Day Trance)",
        description:
          "Erhält die Granted Power 'Prophezeiung' — SL kann jederzeit Visionen auslösen; Spieler kann 1×/Tag in Trance gehen. Erfordert WIS 15+. Kit kann nicht aufgegeben werden.",
        description_en:
          "Gains the Granted Power 'Prophecy' — DM may trigger visions at any time; player may enter trance 1/day. Requires WIS 15+. Kit cannot be abandoned.",
      },
      {
        name: "−2 Reaktion von normalen Leuten",
        name_en: "−2 Reaction from Normal People",
        description: "−2 Reaktionsanpassung von gewöhnlichen Menschen (Minimum: Vorsichtig).",
        description_en: "−2 reaction adjustment from normal people (minimum result: Cautious).",
      },
      {
        name: "Charismatische Predigt",
        name_en: "Charismatic Preaching",
        description:
          "Kann durch leidenschaftliche Predigten Massen begeistern und Anhänger gewinnen.",
        description_en: "Can inspire masses and gain followers through passionate preaching.",
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
        name: "Magie entdecken (1×/Tag pro Stufe)",
        name_en: "Detect Magic (1/Day per Level)",
        description:
          "Magie entdecken 1× pro Tag pro Stufe nutzbar (Stufe 5 = 5×/Tag). 10% Chance pro Stufe, die Sphäre der Magie zu identifizieren. Erfordert STR 11+, KON 13+.",
        description_en:
          "Detect magic usable once per day per level (level 5 = 5/day). 10% chance per level to identify the sphere of the magic. Requires STR 11+, CON 13+.",
      },
      {
        name: "−2 Reaktion von Zivilisierten",
        name_en: "−2 Reaction from Civilized NPCs",
        description:
          "−2 Reaktion von allen zivilisierten NSCs. Startgeld: 3W6 × 5 GM. Nur Lederrüstung + Schild zu Beginn.",
        description_en:
          "−2 reaction from all civilized NPCs. Starting gold: 3d6 × 5 gp. Only leather armor + shield at start.",
      },
      {
        name: "Tätowierungen als Heiliges Symbol",
        name_en: "Tattoos as Holy Symbol",
        description:
          "Tätowierungen/Narben dienen als heiliges Symbol für alle Zauber (kein physisches Symbol nötig).",
        description_en:
          "Tattoos/scars function as holy symbol for all spells (no physical symbol needed).",
        webResearched: true,
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
        name: "Waffen → Fertigkeitsslots + +3 Reaktion",
        name_en: "Weapons → Proficiency Slots + +3 Reaction",
        description:
          "Kann Waffenfertigkeitsslots in allgemeine Fertigkeitsslots umwandeln. +3 Reaktion von Gelehrten, Schriftstellern und Bewunderern der Bildung. Erfordert INT 13+.",
        description_en:
          "Can convert weapon proficiency slots into nonweapon proficiency slots. +3 reaction from scholars, writers, and admirers of learning. Requires INT 13+.",
      },
      {
        name: "1-auf-6 akademische Rivalität",
        name_en: "1-in-6 Academic Rivalry",
        description:
          "1-auf-6 Chance, dass ein Gelehrter statt +3 eine −6 Reaktion zeigt (alte akademische Rivalität).",
        description_en:
          "1-in-6 chance that a scholar shows −6 reaction instead of +3 (old academic rivalry).",
      },
      {
        name: "Theologisches Wissen",
        name_en: "Theological Knowledge",
        description:
          "Umfassendes Wissen über Religion, Geschichte und Mythologie aller Kulturen. Beherrscht alte und moderne Sprachen.",
        description_en:
          "Comprehensive knowledge of religion, history, and mythology. Fluent in ancient and modern languages.",
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
        webResearched: true,
      },
      {
        name: "Untote vertreiben (halbe Stufe)",
        name_en: "Turn Undead (Half Level)",
        description: "Kann Untote vertreiben wie ein Priester, allerdings auf halber Stufe.",
        description_en: "Can turn undead like a priest, but at half level.",
        webResearched: true,
      },
      {
        name: "Göttlicher Auftrag",
        name_en: "Divine Mission",
        description:
          "Dient einer Naturgottheit und erhält spezielle Aufgaben zum Schutz heiliger Orte.",
        description_en:
          "Serves a nature deity and receives special missions to protect sacred sites.",
        webResearched: true,
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
        name: "Erzfeind-Fokus",
        name_en: "Species Enemy Focus",
        description:
          "Konzentriert sich auf die Jagd und Vernichtung seines Erzfeindes als heilige Mission.",
        description_en: "Focuses on hunting and destroying his species enemy as a sacred mission.",
        webResearched: true,
      },
      {
        name: "Unerbittliche Jagd",
        name_en: "Relentless Pursuit",
        description:
          "Kann seinen Erzfeind über große Entfernungen verfolgen, ohne Erschöpfung zu erleiden.",
        description_en:
          "Can pursue his species enemy over great distances without suffering exhaustion.",
        webResearched: true,
      },
      {
        name: "Eingeschränkte Empathie",
        name_en: "Limited Empathy",
        description:
          "Der Hass auf den Erzfeind ist so stark, dass Tierempathie gegenüber verwandten Arten versagt.",
        description_en:
          "Hatred of species enemy is so intense that animal empathy fails against related species.",
        webResearched: true,
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
        name: "Raserei (+2/+2, RK 8 ungerüstet)",
        name_en: "Feral Rage (+2/+2, AC 8 Unarmored)",
        description:
          "Nach Schadensverursachung: Rettungswurf gegen Tod → Raserei für 2W6 Runden: +2 Treffer/Schaden, ungerüstet RK 8. Muss jeden Runde den Gegner angreifen. Erfordert KON 15+, STR 14+; nicht-rechtschaffen.",
        description_en:
          "After dealing damage: save vs. death magic → rage for 2d6 rounds: +2 attack/damage, unarmored AC 8. Must attack designated opponent every round. Requires CON 15+, STR 14+; non-lawful.",
      },
      {
        name: "+10% Schleichen/Verbergen, Klettern 60%",
        name_en: "+10% Stealth, Climbing 60%",
        description:
          "+10% Im Schatten verbergen, +10% Lautlos bewegen in natürlicher Umgebung. 60% Klettern (Bäume bei normaler Geschwindigkeit). Ruf der Wildnis: WIS + Stufe = % Chance, 1–4 Tiere rufen (1×/Tag).",
        description_en:
          "+10% hide in shadows, +10% move silently in natural surroundings. 60% climbing (trees at normal speed). Call of the Wild: WIS + level = % chance, 1–4 animals arrive (1/day).",
      },
      {
        name: "Eingeschränkte Magie & −3 Reaktion",
        name_en: "Limited Magic & −3 Reaction",
        description:
          "Nur Tier-Sphäre, max Stufe-2-Zauber. Gefolgsleute ab Stufe 5 (nicht 10). Max 1 humanoider Gefolgsmann. −3 Reaktion von NSCs.",
        description_en:
          "Animal sphere only, max level 2 spells. Followers from level 5 (not 10). Max 1 humanoid follower. −3 reaction from NPCs.",
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
        name: "Inspirieren (+2 Moral, +1 Erstangriff)",
        name_en: "Inspire (+2 Morale, +1 First Attack)",
        description:
          "1×/Tag nach 1W4+1 Runden Ansprache: CHA-Wurf → Begleiter (= Stufe Personen) erhalten +2 Moral für 3W4 Runden + +1 auf ersten Angriffswurf. Erfordert CHA 12+.",
        description_en:
          "1/day after 1d4+1 rounds speaking: CHA check → companions (= level persons) gain +2 morale for 3d4 rounds + +1 to first attack roll. Requires CHA 12+.",
      },
      {
        name: "+5% Schleichen/Verbergen",
        name_en: "+5% Stealth/Hide",
        description:
          "+5% Im Schatten verbergen, +5% Lautlos bewegen. Bonus-Waffenslot (Langbogen, Kampfstab, Langschwert oder Dolch). Persönlicher Erzfeind-NSC ab Stufe 4.",
        description_en:
          "+5% hide in shadows, +5% move silently. Bonus weapon slot (long bow, quarterstaff, long sword, or dagger). Personal nemesis NPC after level 4.",
      },
      {
        name: "+1 Reaktion von Bauern (Heimat)",
        name_en: "+1 Reaction from Peasants (Homeland)",
        description:
          "+1 Reaktion von Bauern (gut/neutral) im Heimatgebiet. Freie Unterkunft von Gemeinen. Risiko der Verhaftung; keine engen NSC-Beziehungen zu Politikern.",
        description_en:
          "+1 reaction from peasants (good/neutral) in homeland. Free shelter from commoners. Risk of arrest; no close NPC relationships with political figures.",
      },
    ],
  },
  greenwood_ranger: {
    id: "greenwood_ranger",
    name: "Grünwald-Waldläufer",
    name_en: "Greenwood Ranger",
    classId: "ranger",
    hitDieOverride: null,
    maxArmorAC: 10, // bark skin, no worn armor
    armorSpellFailure: null,
    abilities: [
      {
        name: "Rindenhaut (RK 5 → −6)",
        name_en: "Bark Skin (AC 5 → −6)",
        description:
          "Transformation ab Stufe 4 (göttliche Aufgabe). Rindenhaut ersetzt Rüstung: RK 5 ab Stufe 4, verbessert sich um 1 pro Stufe bis max RK −6 (Stufe 15). Nur Mensch. +2 auf Rettungswürfe gegen Pflanzenzauber.",
        description_en:
          "Transformation from level 4 (divine task). Bark skin replaces armor: AC 5 at level 4, improves by 1 per level to max AC −6 (level 15). Human only. +2 to saves vs. plant spells.",
      },
      {
        name: "Verwurzelung (Stufe 8, 1×/Woche)",
        name_en: "Rooting (Level 8, 1/Week)",
        description:
          "Füße 1–4 Std. vergraben → 3W4 TP heilen. Ab Stufe 10: Gliedmaßenwachstum (1×/Monat, 24 Std. Starre, 3. Arm für 1–4 Tage). Photosynthese statt Essen (1 Std. Sonne/Tag nötig).",
        description_en:
          "Bury feet 1–4 hrs → heal 3d4 HP. From level 10: Limbing (1/month, 24 hr suspended animation, 3rd arm for 1–4 days). Photosynthesis instead of eating (1 hr sunlight/day needed).",
      },
      {
        name: "Feuer-Verwundbarkeit & Steifheit",
        name_en: "Fire Vulnerability & Stiffness",
        description:
          "Feuer: Angreifer +4 Treffer, +1 pro Würfel Schaden; Waldläufer −4 auf Rettungswürfe gegen Feuer. −5% Lautlos bewegen; kein DEX-Bonus auf RK. Nur Pflanzensphäre. −3 Reaktion von NSCs.",
        description_en:
          "Fire: attackers +4 to hit, +1/die damage; ranger −4 to fire saves. −5% move silently; no DEX bonus to AC. Plant sphere only. −3 reaction from NPCs.",
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
        name: "Schutzgebiet + Bonus-Sphäre",
        name_en: "Domain + Bonus Sphere",
        description:
          "Schutzgebiet wächst mit Stufe (Stufe 1: wenige km²; Stufe 5: ~20–40 km; Stufe 15: kleines Land). Neben-Zugang zur Schutz-Sphäre.",
        description_en:
          "Domain grows with level (level 1: few km²; level 5: ~20–40 km; level 15: small country). Minor access to Protection sphere.",
      },
      {
        name: "Domain-Zauber",
        name_en: "Domain Spells",
        description:
          "Im Schutzgebiet: Böses entdecken 3×/Tag, Segnen und Naturverbindung je 1×/Woche. Pflanzen beleben: 9 m × Stufe pro Seite, 1×/Monat.",
        description_en:
          "In domain: detect evil 3/day, bless and commune with nature 1/week each. Revive plants: 9 m × level per side, 1/month.",
      },
      {
        name: "Abwesenheitsstrafe",
        name_en: "Absence Penalty",
        description:
          "Muss Stellvertreter arrangieren. Abwesenheit in Tagen = Verlust der Sonderfähigkeiten; in Wochen = Verlust aller Zauber. Rückkehr stellt alles wieder her.",
        description_en:
          "Must arrange caretaker. Absence of days = loss of special abilities; of weeks = loss of all spells. Returns restore everything.",
      },
    ],
  },
  mountain_man: {
    id: "mountain_man",
    name: "Bergmensch",
    name_en: "Mountain Man",
    classId: "ranger",
    hitDieOverride: null,
    maxArmorAC: 8, // handmade leather/fur
    armorSpellFailure: null,
    abilities: [
      {
        name: "Überlebenswille (+2 Todesrettung)",
        name_en: "Will to Live (+2 Death Save)",
        description:
          "+2 auf Rettungswürfe gegen Tod wenn tödlich. KON-Wurf bei 0 TP → auf 1 TP stabilisiert. Systemschock bei Tod → kämpft 1–4 weitere Runden. Erfordert STR 14+, KON 15+.",
        description_en:
          "+2 to death saves if fatal. CON check at 0 HP → stabilize at 1 HP. System shock on death → fight 1–4 more rounds. Requires STR 14+, CON 15+.",
      },
      {
        name: "Heilelixier brauen (ab Stufe 7)",
        name_en: "Brew Healing Elixir (from Level 7)",
        description:
          "1–4 Std. Kräuter sammeln + 1 Std. brauen = Heiltrank. Haltbar 24 Std. 1×/Tag. Handgemachte Lederrüstung (RK 8); −2 Angriff in Metallrüstung.",
        description_en:
          "1–4 hrs gathering herbs + 1 hr brewing = healing potion. Potent 24 hrs. 1/day. Handmade leather armor (AC 8); −2 attack in metal armor.",
      },
      {
        name: "Eingeschränkte Magie & Besitz",
        name_en: "Limited Magic & Possessions",
        description:
          "Zauber erst ab Stufe 10 (nicht 8); keine Stufe-3-Zauber. Max 1 Gegenstand über 15 GM; Gesamtbesitz max 100 GM. −1/−2 Reaktion von NSCs/Adligen.",
        description_en:
          "Spells from level 10 (not 8); no level 3 spells. Max 1 item over 15 gp; total possessions max 100 gp. −1/−2 reaction from NPCs/nobles.",
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
        name: "Wegesinn (−10% Verirrungschance)",
        name_en: "Trail Sense (−10% Lost Chance)",
        description:
          "−10% Verirrungschance; im Heimatgelände max 20% Basis. Muss mind. 6 m von der Gruppe entfernt sein. +1 Treffer mit gewählter Fernwaffe.",
        description_en:
          "−10% chance of getting lost; base in home terrain capped at 20%. Must be at least 6 m from party. +1 to hit with one chosen missile weapon.",
      },
      {
        name: "Gefahrenerkennung (10%/Stufe)",
        name_en: "Recognize Trail Hazard (10%/Level)",
        description:
          "10% pro Stufe (max 90% auf Stufe 9), natürliche Gefahren zu erkennen (Treibsand, Erdfälle, dünnes Eis, rutschige Hänge).",
        description_en:
          "10% per level (max 90% at level 9) to recognize natural hazards (quicksand, sinkholes, thin ice, slippery slopes).",
      },
      {
        name: "Überlandführung (reduzierte Reisekosten)",
        name_en: "Overland Guiding (Reduced Travel Cost)",
        description:
          "Nutzt reduzierte Geländekosten-Tabelle für Gruppenreisen. Nachteil: Getrennt von der Gruppe → höheres Hinterhaltrisiko.",
        description_en:
          "Uses reduced terrain cost table for group travel. Downside: separated from party → higher ambush risk.",
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
        name: "Seegang & Wasserkampf",
        name_en: "Sea Legs & Aquatic Combat",
        description:
          "Keine Angriffsabzüge auf schwankenden Decks/engen Balken; +2 auf Balance-Rettungswürfe. Keine Abzüge im Unterwasserkampf. Erfordert INT 12+. Heimatgelände: Aquatisch.",
        description_en:
          "No attack penalties on pitching decks/narrow beams; +2 to balance saves. No penalties in aquatic combat. Requires INT 12+. Home terrain: Aquatic.",
      },
      {
        name: "Landwitterung (80 km)",
        name_en: "Land Scent (80 km)",
        description:
          "Kann Land (inkl. Inseln) in bis zu 80 km Entfernung riechen. 10% pro Stufe, zuvor besuchtes Land zu identifizieren.",
        description_en:
          "Can smell land (including islands) within 80 km. 10% per level chance to identify previously visited land.",
      },
      {
        name: "Fischparlament (ab Stufe 12)",
        name_en: "Parliament of Fishes (from Level 12)",
        description:
          "1×/Woche: Am Wasser zwischen Sonnenuntergang und -aufgang 10 Runden konzentrieren. 10W10 Fische erscheinen; bei W10-Wurf 8–10 gewährt das Parlament eine Gunst (≈ Naturverbindung). 1×/Monat.",
        description_en:
          "1/week: At water between sunset and dawn, concentrate 10 rounds. 10d10 fish surface; on d10 roll 8–10, parliament grants a boon (≈ commune with nature). 1/month.",
      },
    ],
  },
  stalker: {
    id: "stalker",
    name: "Pirscher",
    name_en: "Stalker",
    classId: "ranger",
    hitDieOverride: null,
    maxArmorAC: 6, // can use stealth in armor AC 6+
    armorSpellFailure: null,
    abilities: [
      {
        name: "+10% Schleichen/Verbergen, volle Stadttarnung",
        name_en: "+10% Stealth/Hide, Full Urban Stealth",
        description:
          "+10% Im Schatten verbergen, +10% Lautlos bewegen. Volle (nicht halbe) Tarnung in Stadt/unnatürlicher Umgebung. Kann Tarnung in Rüstung RK 6+ nutzen. −3 auf Überraschungswürfe von Gegnern (mind. 27 m von nicht-leisen Gruppenmitgliedern). Erfordert INT 14+; nur Mensch.",
        description_en:
          "+10% hide in shadows, +10% move silently. Full (not half) stealth in urban/non-natural settings. Can use stealth in armor AC 6+. −3 to opponent's surprise (must be 27 m+ from non-silent party). Requires INT 14+; human only.",
      },
      {
        name: "Verhör & Fotografisches Gedächtnis",
        name_en: "Interrogation & Photographic Memory",
        description:
          "INT-Wurf (halber Wert): Gut/Böse-Ausrichtung erkennen ODER NSC-Ehrlichkeit prüfen. Ab Stufe 10: 1×/Tag fotografisches Gedächtnis (INT-Wurf −2).",
        description_en:
          "INT check (half score): detect good/evil alignment OR verify NPC honesty. From level 10: 1/day photographic memory (INT check −2).",
      },
      {
        name: "Nur verdeckte Waffen, wenige Gefolgsleute",
        name_en: "Concealed Weapons Only, Few Followers",
        description:
          "Waffen beschränkt auf leicht verbergbare: Blasrohr, Dolch, Wurfpfeil, Messer, Kurzschwert, Stab, Schleuder. Max 1 Gefolgsmann gleichzeitig (Karriere: 2W6), keine humanoiden, nur kleine Tiere.",
        description_en:
          "Weapons limited to easily concealed: blowgun, dagger, dart, knife, short sword, staff, sling. Max 1 follower at a time (career total 2d6), no humanoids, only small animals.",
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
