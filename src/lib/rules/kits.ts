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
        name: "Bezaubern & Schwindeln",
        name_en: "Charm & Swindle",
        description:
          "Bezaubern: Gruppe bis Stufe Personen, 1W10 Runden Plauderei, Rettungswurf gegen Lähmung −1/3 Stufen. Schwindeln: Taschendiebstahl-Wurf → zahlt nur den %-Anteil des Preises. Max 10 GM/Stufe ohne Rollenspiel.",
        description_en:
          "Charm: group up to level persons, 1d10 rounds mingling, save vs. paralyzation −1/3 levels. Swindle: pick pockets roll → pay only that % of cost. Max 10 gp/level without roleplay.",
      },
      {
        name: "Verkleidung vortäuschen & Fälschung erkennen",
        name_en: "Masquerade & Detect Fakery",
        description:
          "Kann jede NWP/Sekundärfertigkeit vortäuschen (Rettungswurf gegen Lähmung −1/3 Stufen bei Verdacht; INT−10: funktioniert sogar echt). CHA-Wurf erkennt Lügen; CHA−10 erkennt Gesinnung (1W10 Runden Beobachtung).",
        description_en:
          "Can fake any NWP/secondary skill (save vs. paralyzation −1/3 levels if suspicious; INT−10: actually functions). CHA check detects lies; CHA−10 detects alignment (1d10 rounds observation).",
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
        name: "Essenz der Reinheit (+1 TP/Stufe)",
        name_en: "Essence of Purity (+1 HP/Level)",
        description:
          "+1 TP pro Stufe (über KON-Bonus hinaus). Bei tödlichem Rettungswurf: erneuter Wurf. Wenn bei Verteidigung von Liebe/Unschuld getötet: kämpft 1W4 weitere Runden. Nicht neutral böse.",
        description_en:
          "+1 HP per level (beyond CON bonus). On fatal save: reroll for second chance. If slain while defending love/innocence: fights 1d4 more rounds. Not neutral evil.",
      },
      {
        name: "Kodex des Galanten (+2 Bonus)",
        name_en: "Code of the Gallant (+2 Bonus)",
        description:
          "Bei Kodex-Einhaltung: +2 einmal pro Runde auf Treffer, Schaden, RK oder Rettungswurf (vor dem Wurf gewählt). Kodex-Bruch: Verlust bis Sühne.",
        description_en:
          "When following code: +2 once per round to attack, damage, AC, or save (chosen before roll). Code violation: lose bonus until atonement.",
      },
      {
        name: "Romantische Anziehung & Poetischer Charme",
        name_en: "Romantic Appeal & Poetic Charm",
        description:
          "Nicht-feindliche Begegnungen: Reaktion eine Stufe freundlicher (Rettungswurf −1/3 Stufen). Poetischer Charme: min. 1W10 Runden + 1 Gedicht → Charm-Effekt (nicht-magisch, kein Zeitablauf). Keine Festung; Knappe ab Stufe 5.",
        description_en:
          "Non-hostile encounters: reaction one level friendlier (save −1/3 levels). Poetic Charm: min. 1d10 turns + 1 poem → charm effect (non-magical, doesn't expire). No stronghold; squire from level 5.",
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
        name: "Tierverbundenheit & Zauber",
        name_en: "Animal Rapport & Spells",
        description:
          "Freie Fertigkeiten: Tierumgang, Tierkunde, Tiertraining, Reiten. Stufe 5: Tierfreundschaft 1×/Tag. Stufe 10: Tiere/Pflanzen finden 1×/Tag. Stufe 15: Mit Tieren sprechen 1×/Tag.",
        description_en:
          "Free proficiencies: Animal Handling, Animal Lore, Animal Training, Riding. Level 5: animal friendship 1/day. Level 10: locate animals/plants 1/day. Level 15: speak with animals 1/day.",
      },
      {
        name: "Verlockung (Gruppenverzauberung)",
        name_en: "Allure (Group Enchantment)",
        description:
          "3+ Gypsy-Barden oder williges Publikum nötig; 1W10 Runden; Effekt = jeder Verzauberung/Charme-Schulzauber (Hauptsänger muss Stufe+Zauberbuch haben). +10% Taschen leeren, +5% Lautlos, −10% Mauern, −5% Verbergen.",
        description_en:
          "3+ Gypsy-bards or willing audience needed; 1d10 turns; effect = any enchantment/charm school spell (main performer must have level+spellbook). +10% pick pockets, +5% move silently, −10% climb walls, −5% hide.",
      },
      {
        name: "Wahrsagerei (1 Frage/5 Stufen/Tag)",
        name_en: "Fortune Telling (1 Question/5 Levels/Day)",
        description:
          "1 Augury-Frage pro 5 Stufen pro Tag mit jedem Wahrsage-Gegenstand. Deck of Many Things schadet dem Gypsy-Barden nie beim Wahrsagen.",
        description_en:
          "1 augury-style question per 5 levels per day using any divination item. Deck of Many Things never harms the Gypsy-bard during fortune telling.",
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
        name: "Linguist (jede Sprache verstehen)",
        name_en: "Linguist (Understand Any Language)",
        description:
          "Kann mit jeder Kreatur ab niedriger INT mit gesprochener Sprache kommunizieren, auch in unbekannten Sprachen (3 m Entfernung, kein Kampf). Sprachen lesen separat für Senden und Empfangen.",
        description_en:
          "Can attempt to communicate with any creature of low INT+ with spoken language, even unknown languages (3 m distance, no combat). Read languages rolled separately for sending and receiving.",
      },
      {
        name: "Menge überzeugen",
        name_en: "Persuade Crowd",
        description:
          "Muss Sprache der Menge sprechen; 1W10 Minuten; Rettungswurf gegen Lähmung −1/3 Stufen; Versagen = Reaktion eine Stufe Richtung Herold-Meinung verschoben. Nichtmenschen max Stufe 6.",
        description_en:
          "Must speak crowd's language; 1d10 minutes; save vs. paralyzation −1/3 levels; failure = reaction shifted one level toward Herald's opinion. Demihumans max level 6.",
      },
      {
        name: "Wappenkunde & Diplomatie",
        name_en: "Heraldry & Diplomacy",
        description:
          "Kennt alle Wappen, Siegel und Flaggen. Als offizieller Bote genießt der Herold Schutz vor Angriffen.",
        description_en:
          "Knows all coats of arms, seals, and flags. As official messenger, the herald enjoys protection from attacks.",
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
        name: "Narrenglück (+1 auf fast alles)",
        name_en: "Fool's Luck (+1 to Almost Everything)",
        description:
          "+1 (+5%) auf Rettungswürfe, Initiative, Überraschung, Fertigkeiten, Diebesfähigkeiten, Attributswürfe. +1 auf RK. Gilt NICHT für Angriffs-/Schadenswürfe, Charaktererstellung, Trefferwürfel.",
        description_en:
          "+1 (+5%) to saves, initiative, surprise, proficiency checks, thief skills, ability checks. +1 to AC. Does NOT apply to attack/damage rolls, character generation, hit dice.",
      },
      {
        name: "Spott & Provokation (9 m)",
        name_en: "Taunting & Provocation (9 m)",
        description:
          "Im 9-m-Radius: Rettungswurf gegen Lähmung −1/3 Stufen; Versagen = Ziel muss den Narren sofort angreifen (ignoriert Kampfstrategie). Witze: 1W10 Runden → Reaktion ±1 Stufe.",
        description_en:
          "Within 9 m: save vs. paralyzation −1/3 levels; failure = target must immediately try to strike Jester (ignores combat strategy). Jokes: 1d10 rounds → reaction ±1 level.",
      },
      {
        name: "Narrenverstand (Charme-Immunität)",
        name_en: "Jester's Mind (Charm Immunity)",
        description:
          "Immun gegen Wahnsinn. Rettungswurf-Bonus = Stufe gegen Verzauberungs-/Charme-Zauber. Gedankenleser: %-Chance = Stufe, Verwirrung im Leser auszulösen.",
        description_en:
          "Immune to insanity. Save bonus = level vs. enchantment/charm spells. Mind readers: % chance = level to cause confusion in the reader.",
      },
    ],
  },
  loremaster: {
    id: "loremaster",
    name: "Hüter des Wissens",
    name_en: "Loremaster",
    classId: "bard",
    hitDieOverride: null,
    maxArmorAC: 8, // leather only
    armorSpellFailure: null,
    abilities: [
      {
        name: "Arkanes Wissen (jedes Magie-Item nutzen)",
        name_en: "Arcane Lore (Use Any Magic Item)",
        description:
          "WIS-Wurf → kann jedes magische Item verwenden. Zaubert als eine Stufe höher (Stufe 1 = Stufe 2 für Zauber). Erfordert INT 14+, WIS 14+. Elfen max Stufe 12. Nur Lederrüstung.",
        description_en:
          "WIS check → can use any magical item. Casts spells as one level higher (level 1 = level 2 for spells). Requires INT 14+, WIS 14+. Elves max level 12. Leather armor only.",
      },
      {
        name: "Etymologie (alte Sprachen, Runen)",
        name_en: "Etymology (Ancient Languages, Runes)",
        description:
          "Sprachen lesen 2× für alte Sprachen. Liest Runen, Glyphen, Piktogramme. Alte-Sprachen-Fertigkeit: rudimentäres Verständnis (1/10 Normalrate).",
        description_en:
          "Read languages rolled twice for ancient languages. Reads runes, glyphs, pictograms. Ancient Languages proficiency: elementary understanding (1/10 normal rate).",
      },
      {
        name: "Überzeugung (Reaktion ±1)",
        name_en: "Persuasion (Reaction ±1)",
        description:
          "1W10 Runden; Rettungswurf gegen Lähmung −1/3 Stufen; Versagen = Reaktion eine Stufe verschoben. Natürliche 20 = starke Ablehnung, Reaktion eine Stufe in Gegenrichtung.",
        description_en:
          "1d10 rounds; save vs. paralyzation −1/3 levels; failure = reaction shifted one level. Natural 20 = strong disagreement, reaction shifted one level opposite.",
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
        name: "Tierbegleiter-Lieder (Stufe 1/5/10)",
        name_en: "Animal Companion Songs (Level 1/5/10)",
        description:
          "Stufe 1: Kleines Tier (Sensorik-Übertragung). Stufe 5: Mittleres Tier (Gliedmaßen-Verwandlung für waffenlosen Kampf). Stufe 10: Großes Tier (Gestaltwandel 1×/Tag). Begleiter-Tod: Systemschock oder Tod. Elfen max Stufe 15.",
        description_en:
          "Level 1: Tiny/small animal (sensory transfer). Level 5: Small/medium (limb transformation for unarmed combat). Level 10: Medium/large (shapechange 1/day). Companion death: system shock or death. Elves max level 15.",
      },
      {
        name: "Lied des Schutzes (Tiere meiden)",
        name_en: "Song of Sanction (Animals Avoid)",
        description:
          "Angreifende Tiere/Monster: Rettungswurf gegen Lähmung −1/3 Stufen oder ignorieren den Meistersänger und alle im Umkreis von 0,3 m/Stufe. Endet bei Bewegung oder Angriff.",
        description_en:
          "Attacking animals/monsters: save vs. paralyzation −1/3 levels or ignore Meistersinger and those within 0.3 m/level. Ends on movement or attack.",
      },
      {
        name: "Tierverzauberung",
        name_en: "Animal Charm",
        description:
          "1W10 Runden Gesang → Rettungswurf gegen Lähmung −1/3 Stufen; Versagen = Charm. Nur Tiere mit TW <= Stufe. Gesamt-TW Verzauberter max 2× Stufe. Keine Festung; keine Standard-Gefolgsleute.",
        description_en:
          "1d10 rounds singing → save vs. paralyzation −1/3 levels; failure = charm. Only animals with HD <= level. Total charmed HD max 2× level. No stronghold; no standard followers.",
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
        name: "Gesunder Menschenverstand (+1 auf alles)",
        name_en: "Common Sense (+1 to Everything)",
        description:
          "+1 auf RK, Rettungswürfe, Initiative, Angriff, Schaden, Fertigkeiten, Diebesfähigkeiten, Attributswürfe. Gilt NICHT für Überraschung, Charaktererstellung, TW, Monsterchaden. Erfordert INT 15+.",
        description_en:
          "+1 to AC, saves, initiative, attack, damage, proficiency checks, thief skills, ability checks. Does NOT apply to surprise, character generation, HD, monster damage. Requires INT 15+.",
      },
      {
        name: "Wahrscheinlicher Pfad (INT-Wurf)",
        name_en: "Probable Path (INT Check)",
        description:
          "INT-Wurf (kumulativ −1 pro Nutzung/Tag); Erfolg = SL enthüllt alle relevanten Hinweise. Natürliche 20 = irreführende Information. Rätsel: doppelte Versuche, 1 freier Fehler.",
        description_en:
          "INT check (cumulative −1 per use/day); success = DM reveals all relevant clues. Natural 20 = misleading info. Puzzles: twice as many attempts, 1 free mistake.",
      },
      {
        name: "+10% Zauber lernen, Items ab Stufe 8",
        name_en: "+10% Spell Learning, Items from Level 8",
        description:
          "+10% auf Zauber lernen (max 95%). Magische Schriftrollen nutzbar ab Stufe 8 (statt 10). Gnome max Stufe 8; Halblinge max Stufe 9.",
        description_en:
          "+10% to learn spells (max 95%). Written magic items usable at level 8 (instead of 10). Gnomes max level 8; halflings max level 9.",
      },
    ],
  },
  skald: {
    id: "skald",
    name: "Skalde",
    name_en: "Skald",
    classId: "bard",
    hitDieOverride: null,
    maxArmorAC: 4, // up to bronze plate + shields
    armorSpellFailure: null,
    abilities: [
      {
        name: "Kriegsgesang (6 Effekte, 3 m/Stufe)",
        name_en: "War Chant (6 Effects, 3 m/Level)",
        description:
          "3 Runden vor Kampf beginnen; Reichweite 3 m/Stufe; endet bei erster Verwundung. Stufe 1: 1 Effekt, Stufe 3: 2, Stufe 6: 3 etc. 6 Optionen: +Bonus-TP = TW des Skalden; Moral +1/6 Stufen; +1 Angriff; +1 Schaden; +1 Rettungswürfe; −1 RK aller.",
        description_en:
          "Begin 3 rounds before combat; range 3 m/level; ends on first wound. Level 1: 1 effect, level 3: 2, level 6: 3 etc. 6 options: +bonus HP = Skald's HD; morale +1/6 levels; +1 attack; +1 damage; +1 saves; −1 everyone's AC.",
      },
      {
        name: "Kampfgesang (+1 Angriff/+1 Schaden)",
        name_en: "Battle Chant (+1 Attack/+1 Damage)",
        description:
          "+1 Angriff beim Singen/Chanten im Kampf. +1 Schaden mit Breitschwert, Axt oder Speer (wenn geübt). Bis Bronzeplatte + Schild erlaubt. Zwerge max Stufe 12.",
        description_en:
          "+1 attack when singing/chanting in combat. +1 damage with broadsword, axe, or spear (if proficient). Up to bronze plate + shield allowed. Dwarves max level 12.",
      },
      {
        name: "Eingeschränkte Magie & Schriftlichkeit",
        name_en: "Limited Magic & Literacy",
        description:
          "Keine Schriftsprache zu Beginn; kein Sprachen lesen auf Stufe 3; keine magischen Schriftgegenstände auf Stufe 10. Keine Zauber bis Kontakt mit Magiekultur (dann ab nächster Stufe als Stufe-2-Zauberer).",
        description_en:
          "No written language initially; no read languages at level 3; no written magic items at level 10. No spells until contact with spellcasting culture (then begins as level 2 caster at next level gained).",
      },
    ],
  },
  thespian: {
    id: "thespian",
    name: "Schauspieler",
    name_en: "Thespian",
    classId: "bard",
    hitDieOverride: null,
    maxArmorAC: null, // any armor, but +1 AC penalty for non-standard
    armorSpellFailure: null,
    abilities: [
      {
        name: "Schauspielerei & Zauber-Schauspiel",
        name_en: "Acting & Spell Acting",
        description:
          "Publikum glaubt Darstellung sofern nicht skeptisch (Rettungswurf gegen Zauber −1/3 Stufen). Zauber-Schauspiel (mit Zauberkunst-Fertigkeit): 1 Runde Gesten → Moralwurf oder Flucht; gleichzeitiger Blitzzauber: Malus = Zauberstufe.",
        description_en:
          "Audience believes performance unless skeptical (save vs. spell −1/3 levels). Spell Acting (requires Spellcraft): 1 round gestures → morale check or flee; simultaneous flashy spell: penalty = spell level.",
      },
      {
        name: "Bewegungen beobachten (+2 RK/Rettung)",
        name_en: "Observe Motions (+2 AC/Save)",
        description:
          "In Runden mit gewonnener Initiative: +2 auf RK und Rettungswürfe, +1 auf Angriff (nur diese Runde). Waffen: Dolch (Stufe 1), Messer (Stufe 2), Kurzschwert (Stufe 5); alle anderen nur −2 statt normal.",
        description_en:
          "In rounds with won initiative: +2 to AC and saves, +1 to attack (that round only). Weapons: dagger (level 1), knife (level 2), short sword (level 5); all others at only −2 instead of standard.",
      },
      {
        name: "Alle Rüstungen (mit +1 RK-Malus)",
        name_en: "All Armor (with +1 AC Penalty)",
        description:
          "Jede Rüstung und Schild erlaubt, aber +1 RK-Malus für nicht-standard Barden-Rüstung. Schilde gewähren keinen RK-Bonus.",
        description_en:
          "Any armor and shield allowed, but +1 AC penalty for non-standard bard armor. Shields grant no AC bonus.",
      },
    ],
  },

  // ── Paladin Kits (PHBR12) ──────────────────────────────────────────────
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
        name: "Befehlskette",
        name_en: "Chain of Command",
        description:
          "Gehorcht/kommandiert andere Chevaliere nach Stufe im selben Königreich. Unterkunft in verbündeten Festungen für bis zu 3 Tage, für sich + Begleiter = Stufe.",
        description_en:
          "Obeys/commands other Chevaliers by level in same kingdom. Sanctuary in allied strongholds for up to 3 days, for self + companions = level.",
      },
      {
        name: "Ritterlicher Kampfbonus",
        name_en: "Chivalric Combat Bonus",
        description:
          "Boni auf berittene Lanzenstöße und Turnierkampf. Bürokratische Pflichten gegenüber dem Lehnsherrn.",
        description_en:
          "Bonuses to mounted lance charges and tournament combat. Bureaucratic duties toward the liege.",
      },
      {
        name: "Feinde des Lehnsherrn",
        name_en: "Enemies of the Liege",
        description: "Muss höherstufigen Chevalieren gehorchen. Ziel für Feinde des Lehnsherrn.",
        description_en: "Must obey higher-level Chevaliers. Target for enemies of the liege.",
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
        name: "Extra Sphäre (Charme/Wächter/Sonne)",
        name_en: "Extra Sphere (Charm/Guardian/Sun)",
        description:
          "Ab Stufe 1: Zugang zu einer zusätzlichen Zaubersphäre (Charme, Wächter oder Sonne) über Standard-Paladin-Sphären hinaus. Kirchenbau zum halben Preis (ca. Stufe 12).",
        description_en:
          "From level 1: access to one additional spell sphere (Charm, Guardian, or Sun) beyond standard paladin spheres. Church construction at half price (~level 12).",
      },
      {
        name: "20% Einkommen spenden + 1 Std. Meditation/Tag",
        name_en: "Donate 20% Income + 1 Hr Meditation/Day",
        description:
          "Muss 20% aller Einnahmen (min. 1–10 GM/Monat) an die Kirche spenden. 1 Std. Meditation täglich (bei Unterbrechung von 2+ Runden: Neustart). Ohne Meditation: keine Zauber am nächsten Tag.",
        description_en:
          "Must donate 20% of all income (min. 1–10 gp/month) to the church. 1 hr meditation daily (interrupted by 2+ rounds: restart). No meditation = no spells next day.",
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
        name: "+2 Reaktion + diplomatische Privilegien",
        name_en: "+2 Reaction + Diplomatic Privileges",
        description:
          "+2 Reaktion von allen NSCs. Volle diplomatische Privilegien (Unterkunft, Sicherheit, Verhaftungsimmunität, Religionsfreiheit, geschützte Korrespondenz). Erfordert INT 12+.",
        description_en:
          "+2 reaction from all NPCs. Full diplomatic privileges (shelter, safety, arrest immunity, religious freedom, protected correspondence). Requires INT 12+.",
      },
      {
        name: "Nur 2 Waffenfertigkeiten (Karriere)",
        name_en: "Only 2 Weapon Proficiencies (Career)",
        description:
          "Nur 2 Waffenfertigkeiten für die gesamte Karriere. Muss feindliches Gebiet unbewaffnet betreten als Geste des guten Willens. Muss böse NSCs verhaften statt töten.",
        description_en:
          "Only 2 weapon proficiencies for entire career. Must enter hostile areas unarmed as gesture of good faith. Must arrest evil NPCs rather than kill.",
      },
      {
        name: "Ziel für Attentäter & Entführer",
        name_en: "Target for Assassins & Kidnappers",
        description: "Als Diplomat ein bevorzugtes Ziel für Attentäter und Entführer.",
        description_en: "As a diplomat, a preferred target for assassins and kidnappers.",
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
        name: "Böses bannen & Lähmung aufheben",
        name_en: "Dispel Evil & Remove Paralysis",
        description:
          "Böses bannen (angeboren, ohne Komponenten): Stufe 5–9=1×/Tag, 10–14=2×, 15–19=3×, 20+=4×. Lähmung aufheben: Stufe 1–4=3×/Tag, 5–9=4×, 10–14=5×. 95% Immunität gegen Untoten-Lähmung.",
        description_en:
          "Dispel Evil (innate, no components): levels 5–9=1/day, 10–14=2, 15–19=3, 20+=4. Remove Paralysis: levels 1–4=3/day, 5–9=4, 10–14=5. 95% immunity to undead paralysis.",
      },
      {
        name: "Volle Kleriker-Vertreibung",
        name_en: "Full Cleric Turning",
        description:
          "Vertreibt Untote als Kleriker gleicher Stufe (nicht 2 Stufen niedriger wie normal). Gottheit kann Zugang zu Schwert +3 Reiniger vor Stufe 6 arrangieren.",
        description_en:
          "Turns undead as cleric of same level (not 2 levels lower as normal). Deity may arrange access to Sword +3 Purifier before level 6.",
      },
      {
        name: "Kein Handauflegen, keine Zauber",
        name_en: "No Lay on Hands, No Spells",
        description:
          "Kann nicht Handauflegen, keine Priesterzauber, keine Krankheitsimmunität, keine Krankheitsheilung.",
        description_en:
          "Cannot lay on hands, no priest spells, no disease immunity, cannot cure diseases.",
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
        name: "Verbesserte Heilkunst",
        name_en: "Enhanced Healing",
        description:
          "+1 auf Diagnostik (+4 mit Kräuterkunde). +1 auf Heilkunde; erfolgreicher Wurf heilt 1W4 TP innerhalb 3 Runden (statt 1–3 in 1 Runde). Patient erholt +1 TP/Tag extra. Erfordert INT 10+.",
        description_en:
          "+1 to Diagnostics (+4 with Herbalism). +1 to Healing; successful check restores 1d4 HP within 3 rounds (instead of 1–3 in 1 round). Patient recovers +1 HP/day extra. Requires INT 10+.",
      },
      {
        name: "Gegengift (+4 Rettungswurf)",
        name_en: "Antidote (+4 Poison Save)",
        description:
          "5 aufeinanderfolgende Runden Behandlung eines Vergifteten: +4 Bonus auf Giftrettungswurf des Patienten (Wurf am Ende der 5 Runden).",
        description_en:
          "5 consecutive rounds treating a poisoned patient: +4 bonus to patient's poison save (rolled at end of 5 rounds).",
      },
      {
        name: "Jährliche Fortbildung (1W4+1 Wochen)",
        name_en: "Annual Training (1d4+1 Weeks)",
        description:
          "1× pro Jahr 1W4+1 Wochen in einer rechtschaffen guten Institution für religiöse/medizinische Fortbildung. Ohne: Verlust aller Fertigkeitsboni, Krankheitsimmunität, Handauflegen.",
        description_en:
          "Once/year 1d4+1 weeks at a lawful good institution for training. Without: loss of all proficiency bonuses, disease immunity, laying on hands.",
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
        name: "Berittener Kampfbonus (+1/+2 Stufe)",
        name_en: "Mounted Combat Bonus (+1/+2 Level)",
        description:
          "Beritten: Angriff als 1 Stufe höher; auf gebundenem Reittier als 2 Stufen höher. Ab Stufe 19: +1 unabhängig vom Reittier. +1 Schaden mit Lieblingswaffe. Erfordert DEX 12+, KON 12+.",
        description_en:
          "Mounted: attack as 1 level higher; on bonded mount as 2 levels higher. At level 19: +1 regardless of mount. +1 damage with preferred weapon. Requires DEX 12+, CON 12+.",
      },
      {
        name: "+2 Reaktion + Stufenbasierte Ehren",
        name_en: "+2 Reaction + Level-Based Honors",
        description:
          "+2 Reaktion von guten/neutralen NSCs der eigenen Kultur. Stufe 2: Bankett, Stufe 3: Helmzier, Stufe 5: Halskette, Stufe 7: zinslose Darlehen bis 500 GM, Stufe 9: Landzuweisung, Stufe 10: geprüfte Söldner.",
        description_en:
          "+2 reaction from good/neutral own-culture NPCs. Level 2: banquet, level 3: helmet crest, level 5: coif, level 7: interest-free loans up to 500 gp, level 9: land grant, level 10: pre-screened hirelings.",
      },
      {
        name: "1 Std. Training/Tag Pflicht",
        name_en: "1 Hr Training/Day Required",
        description:
          "Muss täglich 1 Std. Kampf- und Reittraining absolvieren (Ausfall: Verlust der berittenen Boni am nächsten Tag). Muss alle 6 Monate zum Heimatstützpunkt zurückkehren.",
        description_en:
          "Must practice combat and riding 1 hr/day (miss: lose mounted bonuses next day). Must report to home base at least once every 6 months.",
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
        name: "Luftkampf (+1 Nahkampf fliegend)",
        name_en: "Aerial Combat (+1 Melee Flying)",
        description:
          "+1 Treffer für alle Nahkampfangriffe von Reiter und Reittier. +2 auf Flugreiten-Fertigkeitswürfe mit gebundenem Reittier. Bindung hält 15 Jahre (statt 10). Trick-Training in 1W4+1 Tagen.",
        description_en:
          "+1 to hit for all melee attacks by rider and mount. +2 to airborne riding checks with bonded mount. Bond lasts 15 years (vs. 10). Trick training in 1d4+1 days.",
      },
      {
        name: "Telepathie mit Reittier (ab Stufe 12)",
        name_en: "Mount Telepathy (from Level 12)",
        description:
          "Ab Stufe 12: telepathische Kommunikation mit gebundenem Reittier; Reichweite = 3 m × Stufe.",
        description_en:
          "From level 12: telepathic communication with bonded mount; range = 3 m × level.",
      },
      {
        name: "Trauer bei Reittierverlust",
        name_en: "Mourning on Mount Loss",
        description:
          "Bei Verlust durch eigenes Verschulden: 1W4+1 Monate Trauer mit −2 auf alle Würfe. Bei natürlichem Abschied: 2W4 Wochen Trauer.",
        description_en:
          "If mount lost through own actions: 1d4+1 months mourning with −2 to all rolls. On natural departure: 2d4 weeks mourning.",
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
        name: "Frühere Zauber (ab Stufe 6 statt 9)",
        name_en: "Earlier Spells (from Level 6 vs. 9)",
        description:
          "Beginnt ab Stufe 6 mit Priesterzaubern (2 Stufen früher als normal). Progressiv mehr Zauberplätze als Standard-Paladin durch alle Stufen.",
        description_en:
          "Starts casting priest spells at level 6 (2 levels earlier than standard). Progressively more spell slots than standard paladin through all levels.",
      },
      {
        name: "Verhasster Glaube (+4 Angriff)",
        name_en: "Hated Faith (+4 Attack)",
        description:
          "+4 auf Angriffswürfe gegen Priester und Anhänger eines gewählten bösen Glaubens (bei Erstellung festgelegt, nie änderbar).",
        description_en:
          "+4 to attack rolls when fighting priests or followers of one designated evil faith (chosen at level 1, never changes).",
      },
      {
        name: "50% Einkommen spenden, Zölibat",
        name_en: "50% Income Donation, Celibacy",
        description:
          "−2 Reaktion von RG-Priestern anderer Glaubensrichtungen; −4 von neutralen Priestern. Muss 50% aller Einnahmen spenden. Zölibat. Keine Festung, keine Söldner.",
        description_en:
          "−2 reaction from LG priests of other faiths; −4 from neutral priests. Must donate 50% of all income. Vow of celibacy. No stronghold, no hirelings.",
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
        name: "Schadensbonus = Stufe vs. Hauptfeind",
        name_en: "Damage Bonus = Level vs. Principal Foe",
        description:
          "Schadensbonus gegen Hauptfeind-Drachenart = eigene Stufe (Stufe 6 = +6 Schaden). +1 Schaden gegen andere böse Drachen. Gebundenes Reittier: doppelter Schaden vs. Hauptfeind. Min. Plattenrüstung + mittlerer Schild (Schild: bei Rettungswurf Erfolg = 0 Schaden von Odemwaffe).",
        description_en:
          "Damage bonus vs. principal dragon foe = own level (level 6 = +6 damage). +1 damage vs. other evil dragons. Bonded mount: double damage vs. principal foe. Min. plate mail + medium shield (shield: successful breath save = 0 damage).",
      },
      {
        name: "Drachensprache + Furchtimmunität",
        name_en: "Dragon Language + Fear Immunity",
        description:
          "Spricht alle bösen Drachensprachen. Immun gegen Furchtaura des Hauptfeindes; +4 Rettungswurf gegen Furcht aller anderen bösen Drachen. Gebundenes Reittier teilt Immunität.",
        description_en:
          "Speaks all evil dragon languages. Immune to fear aura of principal foe; +4 save vs. fear from all other evil dragons. Bonded mount shares immunity.",
      },
      {
        name: "−4 Reaktion vom Hauptfeind",
        name_en: "−4 Reaction from Principal Foe",
        description:
          "−4 Reaktion vom Hauptfeind; muss diesen im Kampf über alle anderen Ziele bevorzugen. Kann keine Untoten vertreiben.",
        description_en:
          "−4 reaction from principal foe; must target it above all others in combat. Cannot turn undead.",
      },
    ],
  },

  // ── Druid Kits (PHBR13) ────────────────────────────────────────────────
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
        name: "1 freier Waffen-Slot",
        name_en: "1 Free Weapon Slot",
        description:
          "1 zusätzlicher freier Waffenfertigkeitsslot (jede erlaubte Druiden-Waffe des Zweigs).",
        description_en:
          "1 additional free weapon proficiency slot (any allowed druid weapon of the branch).",
      },
      {
        name: "−1 Reaktion, keine Gefolgsleute bis 13",
        name_en: "−1 Reaction, No Followers Until 13",
        description:
          "−1 Reaktion in allen Begegnungen (grimmiges Auftreten). Keine Gefolgsleute, Söldner oder Diener bis Stufe 13. Überschüssiger Besitz muss gespendet werden.",
        description_en:
          "−1 reaction in all encounters (grim demeanor). No henchmen, hirelings, or servants until level 13. Excess possessions must go to a worthy cause.",
      },
      {
        name: "Einzelgänger-Rächer",
        name_en: "Lone Avenger",
        description: "Handelt allein als Beschützer der Natur gegen deren Zerstörer.",
        description_en: "Operates alone as protector of nature against its destroyers.",
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
        name: "+1 Rettungswürfe/Angriff im Schutzgebiet",
        name_en: "+1 Saves/Attack in Guardianship",
        description:
          "+1 auf Rettungswürfe und Angriffswürfe beim Kampf zum Schutz des Gebiets. Feinde −2 auf Rettungswürfe im Protektorat. +1 Reaktion von Druiden im eigenen Zirkel.",
        description_en:
          "+1 to saves and attack rolls when fighting to protect guardianship. Enemies −2 to saves in protectorate. +1 reaction from druids in own circle.",
      },
      {
        name: "Versagen = −1 auf alles bis Sühne",
        name_en: "Failure = −1 to Everything Until Atonement",
        description:
          "Bei Versagen das Gebiet zu schützen: −1 auf Angriff, Rettungswürfe, Fertigkeiten bis Sühne. −2 Reaktion von anderen Druiden. Depression 1W4+1 Jahre.",
        description_en:
          "Failing to protect guardianship: −1 to attack, saves, proficiency checks until atonement. −2 reaction from other druids. Depression 1d4+1 years.",
      },
      {
        name: "Gebietspflicht",
        name_en: "Area Duty",
        description:
          "Muss ein Schutzgebiet verteidigen. Pflanzen und Tiere im Gebiet warnen vor Eindringlingen.",
        description_en:
          "Must defend a guardianship area. Plants and animals in the area warn of intruders.",
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
        name: "+4 Rettungswurf vs. Gift & Insektenzauber +3",
        name_en: "+4 Save vs. Poison & Insect Spells +3",
        description:
          "+4 auf Rettungswürfe gegen Insekten-/Spinnentiergift (inkl. Riesenversionen). Effektive Zauberstufe +3 bei Insekten rufen, Rieseninsekt, Krabbelndes Unheil, Insektenplage. Passiert alle Spinnweben frei (inkl. Netzzauber).",
        description_en:
          "+4 to saves vs. insect/arachnid poison (including giant versions). Effective caster level +3 for summon insects, giant insect, creeping doom, insect plague. Passes through all spider webs freely (including web spell).",
      },
      {
        name: "Rieseninsekt-Gestaltwandel (ab Stufe 7)",
        name_en: "Giant Insect Shapechange (from Level 7)",
        description:
          "Ab Stufe 7: 1×/Tag Gestaltwandel in Rieseninsekt/-spinnentier (Ameise, Tausendfüßler, Spinne, Wespe). Ersetzt eine der 3 normalen täglichen Verwandlungen.",
        description_en:
          "From level 7: 1/day shapechange into giant insect/arachnid (ant, centipede, spider, wasp). Replaces one of the 3 normal daily transformations.",
      },
      {
        name: "−3 auf Tier-Fertigkeiten (Nicht-Insekten)",
        name_en: "−3 to Animal Skills (Non-Insects)",
        description:
          "+4 auf Tierfertigkeiten für Insekten/Spinnentiere; −3 für alle anderen Tiere. Tierfreundschaft, Mit Tieren sprechen, Tiere rufen nur auf Insekten/Spinnentiere beschränkt.",
        description_en:
          "+4 to animal skills for insects/arachnids; −3 for all other creatures. Animal friendship, speak with animals, summon animals limited to insects/arachnids only.",
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
        name: "Neben-Zugang Nekromantie-Sphäre",
        name_en: "Minor Necromancy Sphere Access",
        description:
          "Neben-Zugang zur Nekromantie-Sphäre. Ab Stufe 6: Tote Tiere beleben 1×/Tag (1 TW normale Tiere pro Druidenstufe).",
        description_en:
          "Minor access to Necromancy sphere. From level 6: animate dead animals 1/day (1 HD of normal animals per druid level).",
      },
      {
        name: "Nur umgekehrte Heil-/Heilungszauber",
        name_en: "Only Reversed Heal/Cure Spells",
        description:
          "Kann nur umgekehrte Versionen von Heil-/Heilungszaubern wirken. Kann nie Großdruide werden oder zum Hierophanten aufsteigen.",
        description_en:
          "Can only cast reversed versions of heal/cure spells. Can never attain Grand Druid status or advance to hierophant.",
      },
      {
        name: "−4 Reaktion von Waldläufern & Druiden",
        name_en: "−4 Reaction from Rangers & Druids",
        description:
          "−4 Reaktion von Waldläufern und anderen Druiden-Kits (−2 von anderen Verlorenen Druiden). Die meisten Druiden betrachten sie als Feinde.",
        description_en:
          "−4 reaction from rangers and other druid kits (−2 from other Lost Druids). Most druids consider them enemies.",
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
        name: "Waffen → Fertigkeitsslots",
        name_en: "Weapons → Proficiency Slots",
        description:
          "Kann Waffenfertigkeitsslots nutzen, um allgemeine Fertigkeiten zu kaufen (erlaubt Mehrfach-Slots in einer Fertigkeit für Spezialisierung). Erfordert INT 15+.",
        description_en:
          "Can use weapon proficiency slots to purchase nonweapon proficiencies (allows multiple slots in a single proficiency for specialization). Requires INT 15+.",
      },
      {
        name: "Neugier-Zwang",
        name_en: "Curiosity Compulsion",
        description:
          "Muss neue Kreaturen studieren statt zu fliehen oder zu kämpfen. Rätsel sind unwiderstehlich und können zu Risiken führen (Rollenspiel-Pflicht).",
        description_en:
          "Must study new creatures rather than flee or fight. Puzzles are irresistible and may lead to risks (roleplay requirement).",
      },
      {
        name: "Keine Arktis-/Dschungel-Druiden",
        name_en: "No Arctic/Jungle Druids",
        description: "Arktis- und Dschungel-Druiden können dieses Kit nicht wählen.",
        description_en: "Arctic and jungle druids cannot take this kit.",
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
        name: "Keine besonderen Vorteile",
        name_en: "No Special Benefits",
        description:
          "Keine mechanischen Boni. Stärke liegt in der Freiheit von druidischer Hierarchie.",
        description_en: "No mechanical bonuses. Strength lies in freedom from druidic hierarchy.",
      },
      {
        name: "Ständig verfolgt",
        name_en: "Constantly Hunted",
        description:
          "Wird ständig von lokalen Behörden gejagt. Gefangennahme = Gefängnis oder Tod. Muss alles Startgold für Ausrüstung ausgeben (über 1 GM geht verloren).",
        description_en:
          "Constantly hunted by local authorities. Capture = imprisonment or death. Must spend all starting gold on equipment (unspent above 1 gp is lost).",
      },
      {
        name: "Waldvolk-Anführer",
        name_en: "Woodland Band Leader",
        description: "Kann eine Gruppe von Waldläufern und Gesetzlosen anführen.",
        description_en: "Can lead a band of woodsmen and outlaws.",
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
        name: "Beruhigende Worte (Stufe ×/Tag)",
        name_en: "Soothing Words (Level/Day)",
        description:
          "Nutzbar = Stufe pro Tag. Jede Nutzung: 1 Furcht-Zauber negieren; 1 Berserkergang beenden; oder Gruppe beruhigen (max 2× Stufe kombinierte TW) für 1W4+1 Runden. Waffen → Fertigkeitsslots möglich.",
        description_en:
          "Usable = level per day. Each use: negate 1 fear spell; halt 1 berserker rage; or calm a group (max 2× level combined HD) for 1d4+1 rounds. Weapons → proficiency slots allowed.",
      },
      {
        name: "Absolutes Gewaltverbot",
        name_en: "Absolute Non-Violence",
        description:
          "Darf nie eine Person oder ein Tier verletzen (Untote zerstören erlaubt). Muss Begleiter zu minimalem Gewalteinsatz ermutigen. Nur vegetarische Ernährung. Startwaffen: nur Wurfpfeil oder Stab.",
        description_en:
          "May never harm a person or animal (destroying undead allowed). Must encourage companions to use minimum force. Vegetarian only. Starting weapons: only dart or staff.",
      },
      {
        name: "Friedens-Einschränkungen",
        name_en: "Peace Restrictions",
        description:
          "Keine Waffenschmied-, Jäger-, Fallensteller- oder Rüstungsschmied-Fertigkeiten. Muss alles Startgold für Ausrüstung ausgeben.",
        description_en:
          "No weaponsmith, hunter, trapper, or armorer proficiencies. Must spend all starting gold on equipment.",
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
        name: "Tätowierungen als Heiliges Symbol",
        name_en: "Tattoos as Holy Symbol",
        description:
          "Tätowierungen und zeremonielle Narben dienen als heiliges Symbol für alle Zauber (kein physisches Symbol nötig).",
        description_en:
          "Tattoos and ceremonial scars function as holy symbol for all spells (no physical symbol needed).",
      },
      {
        name: "−2 Reaktion von Zivilisierten",
        name_en: "−2 Reaction from Civilized NPCs",
        description:
          "−2 Reaktion von allen zivilisierten NSCs (seltsamer Akzent, Tätowierungen, Narben markieren ihn als Fremden).",
        description_en:
          "−2 reaction from all civilized NPCs (strange accent, tattoos, scars mark them as foreigners).",
      },
      {
        name: "Primitiver Überlebenskämpfer",
        name_en: "Primitive Survivalist",
        description: "Lebt in den härtesten Umgebungen. Kennt uralte Stammesrituale.",
        description_en: "Lives in the harshest environments. Knows ancient tribal rituals.",
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
        name: "Gestaltwandel ab Stufe 1 (halbe TW)",
        name_en: "Shapechange from Level 1 (Half HD)",
        description:
          "Gestaltwandel ab Stufe 1 (nicht 7). Bis Stufe 7: nur Formen mit TW <= halbe Stufe. Doppelte Anzahl Verwandlungen pro Tag vs. Standard. Nur Wald-, Ebenen- und Gebirgsdruiden.",
        description_en:
          "Shapechange from level 1 (not 7). Until level 7: only forms with HD <= half level. Double the number of daily transformations vs. standard. Forest, plains, and mountain druids only.",
      },
      {
        name: "Teilverwandlung (ab Stufe 7)",
        name_en: "Partial Transformation (from Level 7)",
        description:
          "Ab Stufe 7: Schlangenzähne (1W2 Biss + Gift), Vogelflügel (BW 21), oder Bärentatzen (2 Angriffe, 1W3 + STR-Bonus). Jede zählt als eine tägliche Verwandlung.",
        description_en:
          "From level 7: snake fangs (1d2 bite + poison), bird wings (MV 21), or bear claws (2 attacks, 1d3 + STR bonus). Each counts as one daily transformation.",
      },
      {
        name: "Risiko der permanenten Verwandlung",
        name_en: "Risk of Permanent Transformation",
        description:
          "Über 3 Verwandlungen/Tag: Rettungswurf gegen Zauber nach jeder Extra-Nutzung; Versagen = aktuelle Form bis nächsten Tag gesperrt (−1 pro aufeinanderfolgendem Versagen). 3 aufeinanderfolgende Versagen = permanente Tierform.",
        description_en:
          "Over 3 transformations/day: save vs. spell after each extra use; failure = locked in current form until next day (−1 per consecutive failure). 3 consecutive failures = permanent animal form.",
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
        name: "Totem-Gestaltwandel (Stufe÷3 +1 ×/Tag)",
        name_en: "Totem Shapechange (Level÷3 +1/Day)",
        description:
          "Verwandlung in Totemtier (Stufe÷3, abgerundet, +1) mal pro Tag. Stufe 1–2: 1×, Stufe 3–5: 2×, Stufe 6–8: 3× etc. TP werden NICHT beim Wechsel geheilt. Zusätzlich zu normalen Gestaltwandel-Powers.",
        description_en:
          "Transform into totem animal (level÷3, rounded down, +1) times per day. Levels 1–2: 1×, 3–5: 2×, 6–8: 3× etc. HP NOT regained when shifting. In addition to normal shapechange powers.",
      },
      {
        name: "Totem-Kommunikation & +4 Tierkunde",
        name_en: "Totem Communication & +4 Animal Lore",
        description:
          "Freie Kommunikation mit allen normalen und Riesen-Exemplaren der Totem-Art (wie Mit Tieren sprechen, immer aktiv). +4 auf Heilkunde, Tiertraining, Tierkunde, Tierhandhabung bezüglich Totem.",
        description_en:
          "Free communication with all normal and giant examples of totem species (as speak with animals, always active). +4 to healing, animal training, animal lore, animal handling regarding totem.",
      },
      {
        name: "1 weniger Fertigkeitsslot, Totem-Tabu",
        name_en: "1 Fewer Proficiency Slot, Totem Taboo",
        description:
          "Startet mit 1 weniger allgemeinem Fertigkeitsslot. Darf die Totemtierart nie jagen oder essen.",
        description_en:
          "Starts with 1 fewer nonweapon proficiency slot. May never hunt or eat the totem species.",
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
        name: "Schnellreise (+33%/+17% Gruppe)",
        name_en: "Fast Travel (+33%/+17% Group)",
        description:
          "Reist ein Drittel schneller als normal (z.B. 51,5 km/Tag statt 38,6 km). Als Führer erhöht er die Reisegeschwindigkeit der Gruppe um ein Sechstel. Keine Gefolgsleute bis Stufe 12 (Tierbegleiter erlaubt).",
        description_en:
          "Travels one-third faster than normal (e.g. 51.5 km/day instead of 38.6 km). As guide, increases party travel speed by one-sixth. No followers until level 12 (animal companions allowed).",
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
        name: "+2 Reaktion + kostenloser Lebensunterhalt",
        name_en: "+2 Reaction + Free Living",
        description:
          "+2 Reaktion von Dorfbewohnern und Haustieren. Mittelklasse-Lebensstandard kostenlos vom Dorf. Dorfbewohner liefern lokale Informationen.",
        description_en:
          "+2 reaction from villagers and domestic animals. Middle-class lifestyle provided free by village. Villagers provide local information.",
      },
      {
        name: "1 Tag/Woche Dorfpflichten",
        name_en: "1 Day/Week Village Duties",
        description:
          "Muss 1 Tag/Woche für Dorfpflichten aufwenden. Verpasste Woche: Reaktionsbonus sinkt um 1 (min 0), Lebensstandard sinkt eine Stufe. Stellvertreter (anderer Druide/Waldläufer) möglich.",
        description_en:
          "Must spend 1 day/week on village duties. Missed week: reaction bonus drops by 1 (min 0), living standard drops one step. Substitute (another druid/ranger) possible.",
      },
      {
        name: "Dorfschutz-Pflicht",
        name_en: "Village Protection Duty",
        description:
          "Versagen beim Schutz des Dorfes kann Reaktionsbonus und Lebensstil weiter reduzieren oder eliminieren.",
        description_en:
          "Failing to protect the village may further reduce or eliminate reaction bonus and living standard.",
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
