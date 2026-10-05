/**
 * Claude-Vision Prompts für den Charakterbogen-Scan.
 *
 * Zwei Modi teilen sich denselben Endpoint:
 *  - `create` — der bestehende Import. Liest nur maschinengedruckte Werte und
 *    liefert ein flaches Objekt (unverändertes Verhalten).
 *  - `update` — der Rescan eines bestehenden Charakters. Liest gedruckte UND
 *    handschriftliche Werte und trennt sie, damit die Review-Liste die
 *    Herkunft jeder Änderung anzeigen kann.
 *
 * Extrahiert aus `src/app/api/scan-character/route.ts`, damit die Prompt-
 * Struktur unabhängig vom Route-Handler testbar ist — analog zu
 * `monster-scan-prompt.ts`.
 */

/** Woher ein Wert auf dem Bogen stammt. */
export type ValueSource = "printed" | "handwritten";

export interface ScannedClassEntry {
  class: string;
  level: number;
  xp: number;
}

export interface ScannedTraitEntry {
  name: string;
  description: string | null;
  cost: number | null;
}

/**
 * Die skalaren Felder eines Charakterbogens. Im Update-Modus einmal als
 * `printed` (vollständig) und einmal als `handwritten` (nur Abweichungen).
 */
export interface ScannedCharacterFields {
  name?: string;
  race?: string | null;
  classes?: ScannedClassEntry[];
  kit?: string | null;
  alignment?: string | null;
  str?: number;
  strExceptional?: number | null;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  strStamina?: number | null;
  strMuscle?: number | null;
  dexAim?: number | null;
  dexBalance?: number | null;
  conHealth?: number | null;
  conFitness?: number | null;
  intReason?: number | null;
  intKnowledge?: number | null;
  wisIntuition?: number | null;
  wisWillpower?: number | null;
  chaLeadership?: number | null;
  chaAppearance?: number | null;
  hpMax?: number;
  hpCurrent?: number;
  goldPp?: number;
  goldGp?: number;
  goldEp?: number;
  goldSp?: number;
  goldCp?: number;
  playerName?: string | null;
  age?: number | null;
  gender?: string | null;
  height?: string | null;
  weight?: number | null;
  deity?: string | null;
  priesthood?: string | null;
  notes?: string | null;
  traits?: ScannedTraitEntry[];
  disadvantages?: ScannedTraitEntry[];
}

export interface ScannedEquipmentItem {
  name: string;
  magicBonus: number;
  source: ValueSource;
}

export interface ScannedSpellItem {
  name: string;
  level: number;
  source: ValueSource;
}

export interface ScannedWeaponProfItem {
  name: string;
  specialized: boolean;
  source: ValueSource;
}

export interface ScannedNwpItem {
  name: string;
  source: ValueSource;
}

export interface ScannedLanguageItem {
  name: string;
  source: ValueSource;
}

/** Antwort-Shape des Endpoints im Update-Modus. */
export interface ScannedUpdatePayload {
  printed: ScannedCharacterFields;
  handwritten: Partial<ScannedCharacterFields>;
  equipment: ScannedEquipmentItem[];
  spells: ScannedSpellItem[];
  weaponProficiencies: ScannedWeaponProfItem[];
  nwps: ScannedNwpItem[];
  languages: ScannedLanguageItem[];
}

/** Platzhalter, den `buildCharacterScanPrompt()` ersetzt. */
const MULTI_FILE_PLACEHOLDER = "{{MULTI_FILE_HINT}}";

export const MULTI_FILE_HINT =
  "Dieser Charakterbogen erstreckt sich über mehrere Seiten/Dateien. Kombiniere die Informationen aus allen Seiten zu einem einzelnen Charakter.\n";

/** Enum-Listen, die beide Prompts teilen. */
const ID_RULES = `- "race" muss einer dieser IDs sein: human, elf, half_elf, dwarf, gnome, halfling, half_orc, kobold. "Stout Halfling" → "halfling", "Standard half-elf" → "half_elf". Subrassen werden auf die Hauptrasse gemappt
- "classes" ist ein ARRAY — Multiclass-Charaktere haben MEHRERE Einträge! Z.B. "Fighter/Thief" → [{"class":"fighter","level":4,"xp":8000},{"class":"thief","level":5,"xp":10330}]. "class" muss einer dieser IDs sein: fighter, ranger, paladin, mage, illusionist, abjurer, conjurer, diviner, enchanter, invoker, necromancer, transmuter, cleric, druid, thief, bard
- "kit" NUR verwenden wenn im Bogen explizit "Kit:" steht. Gültige Kits: barbarian, cavalier, swashbuckler, berserker, gladiator, myrmidon, assassin, bounty_hunter, acrobat, scout, burglar, spy, witch, militant_wizard, savage_wizard, academician, fighting_monk, pacifist_priest, beastmaster, blade. Wenn das Kit nicht in dieser Liste ist → null
- "alignment" muss eine ID sein: lawful_good, neutral_good, chaotic_good, lawful_neutral, true_neutral, chaotic_neutral, lawful_evil, neutral_evil, chaotic_evil`;

// ─── CREATE ────────────────────────────────────────────────────────────────
// Wortgleich zum bisherigen Inline-Prompt in route.ts. Verhalten unverändert.

export const CHARACTER_SCAN_PROMPT = `Analysiere diesen AD&D 2nd Edition Charakterbogen und extrahiere ALLE verfügbaren Werte als JSON.
Antworte NUR mit validem JSON, kein anderer Text.

WICHTIG: Verwende NUR die MASCHINENGEDRUCKTEN Werte aus dem Charakterbogen. IGNORIERE alle handschriftlichen Notizen, Durchstreichungen und handschriftlichen Korrekturen vollständig. Wenn ein gedruckter Wert durchgestrichen und ein neuer Wert handschriftlich daneben geschrieben wurde, verwende trotzdem den GEDRUCKTEN Wert.

${MULTI_FILE_PLACEHOLDER}
Erwartetes Format:
{
  "name": "Charaktername",
  "race": "human|elf|half_elf|dwarf|gnome|halfling|half_orc|kobold",
  "classes": [
    {"class": "fighter", "level": 3, "xp": 5500}
  ],
  "kit": null,
  "alignment": "chaotic_neutral",
  "str": 10,
  "strExceptional": null,
  "dex": 10,
  "con": 10,
  "int": 10,
  "wis": 10,
  "cha": 10,
  "strStamina": null,
  "strMuscle": null,
  "dexAim": null,
  "dexBalance": null,
  "conHealth": null,
  "conFitness": null,
  "intReason": null,
  "intKnowledge": null,
  "wisIntuition": null,
  "wisWillpower": null,
  "chaLeadership": null,
  "chaAppearance": null,
  "hpMax": 10,
  "hpCurrent": 10,
  "goldPp": 0,
  "goldGp": 0,
  "goldSp": 0,
  "goldCp": 0,
  "playerName": null,
  "age": null,
  "gender": null,
  "height": null,
  "weight": null,
  "weaponProficiencies": [],
  "equipment": [{"name": "Quarterstaff +2", "magicBonus": 2}],
  "nwps": [],
  "spells": []
}

Hinweise:
${ID_RULES}
- "strExceptional" ist nur relevant bei STR 18 und Krieger-Klassen (1-100, wobei 100 = "18/00")
- Sub-Stats (strStamina, strMuscle, etc.) sind Player's Option Werte. Extrahiere sie wenn vorhanden, sonst null
- "weaponProficiencies" MUSS ein Array von {"name": "Waffenname", "specialized": true/false} sein. NICHT detaillierte Stats — nur Name und ob Specialist (true) oder nicht (false). Wenn "(Specialist)" hinter dem Namen steht → specialized: true
- "equipment" ist ein Array von {"name": "Gegenstandsname", "magicBonus": 0}. Extrahiere ALLE Gegenstände aus ALLEN Inventar-Bereichen: "Items Carried", "Items Readied", "Items Worn", "Items Stored" und dem allgemeinen "Inventory"-Bereich. Dazu gehören Waffen, Rüstungen, Schilde, magische Gegenstände, Alltagsgegenstände (Backpack, Spellbook, Wineskin, etc.), Schmuck, Tiere und alles andere. Magische Gegenstände wie "Dagger +1" oder "Chain Mail +2" haben magicBonus > 0. Den Bonus aus dem Namen extrahieren (z.B. "+2" → magicBonus: 2). Wenn kein magischer Bonus → magicBonus: 0
- "nwps" ist ein Array von Strings mit den Non-Weapon Proficiency Namen
- "height" und "weight" als Strings/Zahlen wie im Bogen angegeben
- "xp" in "classes" ist der GEDRUCKTE "XP:"-Wert (NICHT "Next Level:"). Wenn "XP: 78,150" und "Next Level: 90,000" steht, verwende 78150
- Munition (quarrel, arrow, bolt, bullet) sind KEINE Waffen — nicht in weaponProficiencies aufnehmen
- "spells" ist ein Array von {"name": "Zaubername", "level": 1}. Extrahiere ALLE Zauber aus "Spells Known" oder ähnlichen Bereichen. Der Level ist die Zauberstufe (1st Level → 1, 2nd Level → 2, etc.). Zaubernamen EXAKT wie gedruckt übernehmen (üblicherweise Englisch)
- Wenn ein Wert nicht lesbar ist, verwende null
- Übersetze deutsche Bezeichnungen (z.B. "Mensch" → "human", "Kämpfer" → "fighter")`;

// ─── UPDATE ────────────────────────────────────────────────────────────────

export const CHARACTER_UPDATE_SCAN_PROMPT = `Analysiere diesen AD&D 2nd Edition Charakterbogen und extrahiere ALLE verfügbaren Werte als JSON.
Antworte NUR mit validem JSON, kein anderer Text.

WICHTIG — dieser Bogen gehört zu einem bereits erfassten Charakter. Ziel ist es, seit der letzten Erfassung eingetragene Änderungen zu finden. Handschriftliche Eintragungen sind daher NICHT ignorieren — sie sind meist die AKTUELLSTE Information und der eigentliche Grund für diesen Scan.

Trenne die Werte nach ihrer Herkunft:
- "printed": ALLE maschinengedruckten Werte des Bogens (vollständig).
- "handwritten": NUR die Felder, bei denen zusätzlich oder abweichend etwas handschriftlich eingetragen wurde — durchgestrichene und daneben korrigierte Werte, handschriftliche Nachträge, Randnotizen mit neuen Werten. Felder ohne handschriftliche Eintragung gehören NICHT in diesen Block.

Ist ein gedruckter Wert durchgestrichen und handschriftlich ersetzt, gehört der gedruckte Wert nach "printed" und der handschriftliche nach "handwritten".

${MULTI_FILE_PLACEHOLDER}
Erwartetes Format:
{
  "printed": {
    "name": "Charaktername",
    "race": "human|elf|half_elf|dwarf|gnome|halfling|half_orc|kobold",
    "classes": [{"class": "fighter", "level": 3, "xp": 5500}],
    "kit": null,
    "alignment": "chaotic_neutral",
    "str": 10, "strExceptional": null, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10,
    "strStamina": null, "strMuscle": null, "dexAim": null, "dexBalance": null,
    "conHealth": null, "conFitness": null, "intReason": null, "intKnowledge": null,
    "wisIntuition": null, "wisWillpower": null, "chaLeadership": null, "chaAppearance": null,
    "hpMax": 10, "hpCurrent": 10,
    "goldPp": 0, "goldGp": 0, "goldEp": 0, "goldSp": 0, "goldCp": 0,
    "playerName": null, "age": null, "gender": null, "height": null, "weight": null,
    "deity": null, "priesthood": null, "notes": null,
    "traits": [], "disadvantages": []
  },
  "handwritten": { "classes": [{"class": "fighter", "level": 4, "xp": 9200}] },
  "equipment": [{"name": "Quarterstaff +2", "magicBonus": 2, "source": "printed"}],
  "spells": [{"name": "Magic Missile", "level": 1, "source": "printed"}],
  "weaponProficiencies": [{"name": "Long Sword", "specialized": false, "source": "printed"}],
  "nwps": [{"name": "Rope Use", "source": "printed"}],
  "languages": [{"name": "Elvish", "source": "printed"}]
}

Hinweise:
${ID_RULES}
- Die fünf Listen ("equipment", "spells", "weaponProficiencies", "nwps", "languages") stehen AUSSERHALB von "printed"/"handwritten". Jeder Eintrag trägt stattdessen ein eigenes Feld "source" mit dem Wert "printed" | "handwritten" — je nachdem, ob er gedruckt oder handschriftlich auf dem Bogen steht
- "strExceptional" ist nur relevant bei STR 18 und Krieger-Klassen (1-100, wobei 100 = "18/00")
- Sub-Stats (strStamina, strMuscle, etc.) sind Player's Option Werte. Extrahiere sie wenn vorhanden, sonst null
- "weaponProficiencies": nur Name und ob Specialist. Wenn "(Specialist)" hinter dem Namen steht → specialized: true. Munition (quarrel, arrow, bolt, bullet) sind KEINE Waffen — nicht aufnehmen
- "equipment": ALLE Gegenstände aus ALLEN Inventar-Bereichen ("Items Carried", "Items Readied", "Items Worn", "Items Stored", "Inventory"). Waffen, Rüstungen, Schilde, magische und Alltagsgegenstände, Schmuck, Tiere. Den Bonus aus dem Namen extrahieren (z.B. "Dagger +1" → magicBonus: 1), sonst 0
- "spells": ALLE Zauber aus "Spells Known" oder ähnlichen Bereichen. Der Level ist die Zauberstufe (1st Level → 1). Zaubernamen EXAKT wie gedruckt übernehmen (üblicherweise Englisch)
- "languages": gesprochene Sprachen aus dem Sprachen-Bereich. "Common" NICHT aufnehmen
- "deity" ist der Name der Gottheit, "priesthood" die Priesterschaft/Orden — nur bei Priesterklassen
- "notes" ist der Freitext aus Notiz-/Hintergrund-Bereichen, sonst null
- "traits" und "disadvantages" sind Player's Option Vor-/Nachteile als [{"name": "...", "description": null, "cost": 0}], sonst leeres Array
- "height" und "weight" als Strings/Zahlen wie im Bogen angegeben
- "xp" in "classes" ist der eingetragene "XP:"-Wert (NICHT "Next Level:"). Wenn "XP: 78,150" und "Next Level: 90,000" steht, verwende 78150
- Felder, die auf dem Bogen nicht lesbar oder nicht vorhanden sind, WEGLASSEN oder auf null setzen — NIEMALS raten. Ein geratener Wert würde eine falsche Änderung vorschlagen
- Übersetze deutsche Bezeichnungen (z.B. "Mensch" → "human", "Kämpfer" → "fighter")`;

/** Setzt den Multi-File-Hinweis ein und wählt den Prompt zum Modus. */
export function buildCharacterScanPrompt(opts: {
  mode: "create" | "update";
  isMultiFile: boolean;
}): string {
  const base = opts.mode === "update" ? CHARACTER_UPDATE_SCAN_PROMPT : CHARACTER_SCAN_PROMPT;
  return base.replace(MULTI_FILE_PLACEHOLDER, opts.isMultiFile ? MULTI_FILE_HINT : "");
}

/** Felder, die im `printed`-Block stehen dürfen — für das Auto-Wrapping unten. */
const SCALAR_FIELD_HINTS = ["name", "race", "classes", "str", "hpMax", "alignment"];

/**
 * Liest eine der fünf annotierten Listen aus der Antwort. Fehlt sie, ergibt
 * das ein leeres Array; fehlt an einem Eintrag die `source`, gilt "printed" —
 * das ist der konservative Default, denn Gedrucktes ist der Normalfall.
 */
function asList<T>(value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const item = (entry ?? {}) as Record<string, unknown>;
    return {
      ...item,
      source: item.source === "handwritten" ? "handwritten" : "printed",
    };
  }) as T[];
}

/**
 * Parst die Modell-Antwort in ein `ScannedUpdatePayload`. Toleriert
 * ```json-Fences und Fließtext um das Objekt herum, ergänzt fehlende Listen
 * als leere Arrays und setzt eine fehlende `source` auf "printed".
 *
 * Wirft mit beschreibender Meldung, wenn die Antwort unbrauchbar ist.
 */
export function parseUpdateScanResponse(responseText: string): ScannedUpdatePayload {
  const fence = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  let jsonString = (fence ? fence[1] : responseText).trim();

  // Ohne Fence kann Fließtext um das Objekt stehen — das äußerste Objekt greifen.
  if (!jsonString.startsWith("{")) {
    const braced = jsonString.match(/\{[\s\S]*\}/);
    if (braced) jsonString = braced[0];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("Scan-Antwort ist kein gültiges JSON.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Scan-Antwort hat kein Objekt zurückgegeben.");
  }

  const record = parsed as Record<string, unknown>;

  // Rückfall: Das Modell hat den printed-Wrapper vergessen und die Felder flach
  // geliefert. Dann ist die gesamte Antwort der printed-Block.
  const hasWrapper = "printed" in record;
  const looksFlat = !hasWrapper && SCALAR_FIELD_HINTS.some((f) => f in record);
  const printed = (
    hasWrapper ? (record.printed ?? {}) : looksFlat ? record : {}
  ) as ScannedCharacterFields;

  const handwritten = (
    record.handwritten && typeof record.handwritten === "object" ? record.handwritten : {}
  ) as Partial<ScannedCharacterFields>;

  return {
    printed,
    handwritten,
    equipment: asList<ScannedEquipmentItem>(record.equipment),
    spells: asList<ScannedSpellItem>(record.spells),
    weaponProficiencies: asList<ScannedWeaponProfItem>(record.weaponProficiencies),
    nwps: asList<ScannedNwpItem>(record.nwps),
    languages: asList<ScannedLanguageItem>(record.languages),
  };
}
