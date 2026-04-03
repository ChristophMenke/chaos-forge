import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  AlignmentType,
  BorderStyle,
} from "docx";
import { RACES } from "@/lib/rules/races";
import { CLASSES, getClassGroup } from "@/lib/rules/classes";
import { getAlignmentLabel } from "@/lib/rules/alignment";
import { getXpForNextLevel } from "@/lib/rules/experience";
import type { ClassId, ClassGroup } from "@/lib/rules/types";
import { getMulticlassThac0, getMulticlassSaves } from "@/lib/rules/multiclass";
import {
  getAttacksPerRound,
  getAdjustedWeaponThac0,
  formatDamageWithBonus,
} from "@/lib/rules/combat";
import { getNonproficiencyPenalty } from "@/lib/rules/proficiencies";
import { findWeaponProf } from "@/lib/utils/proficiency-match";
import { hasThiefSkills, getBackstabMultiplier } from "@/lib/rules/thief";
import { getKit, getEffectiveHitDie } from "@/lib/rules/kits";
import { calculateAC, calculateEncumbrance, isShieldItem } from "@/lib/rules/equipment";
import { feetToMeters, lbsToKg } from "@/lib/utils/units";
import { localized, translateGender } from "@/lib/utils/localize";
import { spellRange, spellArea } from "@/lib/utils/spell-display";
import { getFightingStyle } from "@/lib/rules/fighting-styles";
import { isPriestCaster } from "@/lib/rules/magic";
import { getAllAbilityModifiers } from "@/lib/rules/abilities";
import { getEpicEffects } from "@/lib/rules/epic-items";
import type {
  CharacterRow,
  CharacterClassRow,
  CharacterEquipmentWithDetails,
  CharacterSpellWithDetails,
  CharacterWeaponProficiencyRow,
  CharacterNWPWithDetails,
  CharacterLanguageRow,
  CharacterFightingStyleRow,
  CharacterInventoryWithDetails,
  SpellRow,
  EpicItemRow,
} from "@/lib/supabase/types";
import type { PrintPreferences, PrintSectionId } from "@/lib/print-config";
import { DEFAULT_PRINT_PREFERENCES } from "@/lib/print-config";

export interface PrintSheetProps {
  character: CharacterRow;
  characterClasses: CharacterClassRow[];
  equipment: CharacterEquipmentWithDetails[];
  spells: CharacterSpellWithDetails[];
  weaponProficiencies: CharacterWeaponProficiencyRow[];
  nonweaponProficiencies: CharacterNWPWithDetails[];
  languages: CharacterLanguageRow[];
  fightingStyles: CharacterFightingStyleRow[];
  inventory: CharacterInventoryWithDetails[];
  epicItems?: EpicItemRow[];
  priestAvailableSpells?: SpellRow[];
  locale: string;
  preferences?: PrintPreferences;
}

// ─── Helper: bordered table cell ──────────────────────────────────────────────
const BORDER = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "999999",
};

const CELL_BORDERS = {
  top: BORDER,
  bottom: BORDER,
  left: BORDER,
  right: BORDER,
};

function cell(
  text: string,
  opts?: {
    bold?: boolean;
    width?: number;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    font?: string;
    size?: number;
    columnSpan?: number;
  }
): TableCell {
  return new TableCell({
    borders: CELL_BORDERS,
    width: opts?.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    columnSpan: opts?.columnSpan,
    children: [
      new Paragraph({
        alignment: opts?.alignment ?? AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: opts?.bold ?? false,
            font: opts?.font ?? "Calibri",
            size: opts?.size ?? 20, // 10pt
          }),
        ],
      }),
    ],
  });
}

function headerCell(
  text: string,
  opts?: {
    width?: number;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
  }
): TableCell {
  return cell(text, { bold: true, ...opts });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        font: "Calibri",
        size: 26, // 13pt
      }),
    ],
  });
}

function emptyParagraph(): Paragraph {
  return new Paragraph({ children: [] });
}

// ─── i18n for DOCX headings ──────────────────────────────────────────────────
const DOCX_I18N: Record<string, Record<string, string>> = {
  de: {
    abilities: "Attribute",
    combatValues: "Kampfwerte",
    savingThrows: "Rettungswürfe",
    racialAbilities: "Rassenfähigkeiten",
    classAbilities: "Klassenfähigkeiten",
    kitAbilities: "Kit-Fähigkeiten",
    acBreakdown: "RK-Aufschlüsselung",
    thiefSkills: "Diebesfähigkeiten",
    weapons: "Waffen",
    armorInventory: "Rüstung & Inventar",
    generalInventory: "Allgemeine Gegenstände",
    spellsKnown: "Bekannte Zauber",
    spellsMemorized: "Vorbereitete Zauber",
    proficiencies: "Fertigkeiten",
    weaponProf: "Waffenfertigkeiten",
    nwProf: "Allgemeine Fertigkeiten",
    languages: "Sprachen",
    fightingStyles: "Kampfstile",
    notes: "Notizen",
    gender: "Geschlecht",
    savePara: "Gift/Lähmung/Tod",
    saveRod: "Stab/Rute/Zepter",
    savePetri: "Versteinerung/Verwandlung",
    saveBreath: "Odemwaffe",
    saveSpell: "Zauber",
    base: "Basis",
    acShield: "Schild",
    acFinal: "Gesamt",
    unarmoredBonus: "Ungerüstet",
    epicAcBonus: "Episch",
    race: "Rasse",
    class: "Klasse",
    level: "Stufe",
    hitDie: "TW",
    hp: "TP",
    alignment: "Gesinnung",
    kit: "Kit",
    xp: "EP",
    treasure: "Schätze",
    player: "Spieler",
    age: "Alter",
    height: "Größe",
    weight: "Gewicht",
    footer: "Chaos Forge — AD&D 2nd Edition Manager",
    createdAt: "Erstellt am",
  },
  en: {
    abilities: "Abilities",
    combatValues: "Combat Values",
    savingThrows: "Saving Throws",
    racialAbilities: "Racial Abilities",
    classAbilities: "Class Abilities",
    kitAbilities: "Kit Abilities",
    acBreakdown: "AC Breakdown",
    thiefSkills: "Thief Skills",
    weapons: "Weapons",
    armorInventory: "Armor & Inventory",
    generalInventory: "General Inventory",
    spellsKnown: "Spells Known",
    spellsMemorized: "Spells Memorized",
    proficiencies: "Proficiencies",
    weaponProf: "Weapon Proficiencies",
    nwProf: "Non-Weapon Proficiencies",
    languages: "Languages",
    fightingStyles: "Fighting Styles",
    notes: "Notes",
    gender: "Gender",
    savePara: "Poison/Para/Death",
    saveRod: "Rod/Staff/Wand",
    savePetri: "Petrification/Polymorph",
    saveBreath: "Breath Weapon",
    saveSpell: "Spell",
    base: "Base",
    acShield: "Shield",
    acFinal: "Final",
    unarmoredBonus: "Unarmored",
    epicAcBonus: "Epic",
    race: "Race",
    class: "Class",
    level: "Level",
    hitDie: "Hit Die",
    hp: "HP",
    alignment: "Alignment",
    kit: "Kit",
    xp: "XP",
    treasure: "Treasure",
    player: "Player",
    age: "Age",
    height: "Height",
    weight: "Weight",
    footer: "Chaos Forge — AD&D 2nd Edition Manager",
    createdAt: "Created on",
  },
};

function getDocxT(locale: string): Record<string, string> {
  return DOCX_I18N[locale] ?? DOCX_I18N.en;
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export async function generateCharacterDocx(props: PrintSheetProps): Promise<Blob> {
  const {
    character,
    characterClasses,
    equipment,
    spells,
    weaponProficiencies,
    nonweaponProficiencies,
    languages,
    fightingStyles,
    inventory,
    priestAvailableSpells = [],
  } = props;

  const dt = getDocxT(props.locale);
  const race = character.race_id ? RACES[character.race_id as keyof typeof RACES] : null;
  const activeClasses = characterClasses.filter((cc) => cc.is_active);
  const classEntries = activeClasses.map((cc) => ({
    classId: cc.class_id as ClassId,
    level: cc.level,
  }));
  const classNames = activeClasses
    .map((cc) => {
      const cls = CLASSES[cc.class_id as ClassId];
      return cls ? localized(cls.name, cls.name_en, props.locale) : cc.class_id;
    })
    .join(" / ");
  const levelDisplay = activeClasses.map((cc) => cc.level).join("/");
  const hitDice = activeClasses
    .map((cc) => {
      const def = CLASSES[cc.class_id as ClassId];
      return def ? `d${getEffectiveHitDie(def.hitDie, character.kit)}` : "—";
    })
    .join("/");

  const thac0 = classEntries.length > 0 ? getMulticlassThac0(classEntries) : 20;
  const saves = classEntries.length > 0 ? getMulticlassSaves(classEntries) : null;
  const { strMods, dexMods, conMods, intMods, wisMods, chaMods } =
    getAllAbilityModifiers(character);

  const equippedArmorForAC = equipment.find(
    (e) => e.armor && e.equipped && !isShieldItem(e.armor.name)
  );
  const hasShieldForAC = equipment.some((e) => e.armor && e.equipped && isShieldItem(e.armor.name));
  const classGroups = activeClasses.map((cc) => getClassGroup(cc.class_id as ClassId));
  const totalWeight = equipment.reduce(
    (sum, e) => sum + (e.weapon?.weight ?? e.armor?.weight ?? 0),
    0
  );
  const encumbranceLevel = calculateEncumbrance(totalWeight, strMods.weightAllow);
  const isMagicalProtection = equippedArmorForAC?.armor?.is_magical_protection ?? false;
  const epicEffects = getEpicEffects(props.epicItems ?? []);
  const effectiveAC = calculateAC({
    equippedArmorAC: equippedArmorForAC?.armor?.ac ?? null,
    shieldEquipped: hasShieldForAC,
    dexDefenseAdj: dexMods.defensiveAdj,
    classGroups,
    encumbrance: encumbranceLevel,
    ignoreEncumbrance: character.ignore_encumbrance,
    isMagicalProtection,
    epicAcBonus: epicEffects.acBonus,
  });

  const strDisplay =
    character.str === 18 && character.str_exceptional
      ? `18/${character.str_exceptional === 100 ? "00" : String(character.str_exceptional).padStart(2, "0")}`
      : String(character.str);

  const attacksDisplay =
    classEntries.length > 0
      ? classEntries
          .map((ce) => getAttacksPerRound(CLASSES[ce.classId]?.group ?? "warrior", ce.level))
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(" / ")
      : "1";

  const kitDef = character.kit ? getKit(character.kit) : null;

  // ─── Pre-compute shared data ──────────────────────────────────────────────

  const xpDisplay =
    activeClasses.length > 0
      ? activeClasses
          .map((cc) => {
            const cls = CLASSES[cc.class_id as ClassId];
            const name = cls ? localized(cls.name, cls.name_en, props.locale) : cc.class_id;
            const next = getXpForNextLevel(cc.class_id as ClassId, cc.level);
            return `${name}: ${cc.xp_current.toLocaleString()}${next ? ` / ${next.toLocaleString()}` : " (Max)"}`;
          })
          .join("; ")
      : character.xp_current.toLocaleString();

  const treasureDisplay = [
    character.gold_pp > 0 ? `${character.gold_pp} PP` : "",
    `${character.gold_gp} GP`,
    character.gold_sp > 0 ? `${character.gold_sp} SP` : "",
    character.gold_cp > 0 ? `${character.gold_cp} CP` : "",
  ]
    .filter(Boolean)
    .join(", ");

  // ─── Section Generators ───────────────────────────────────────────────────

  const sectionGenerators: Record<PrintSectionId, () => (Paragraph | Table)[]> = {
    // ── 1. Personal / Header ──────────────────────────────────────────────────
    personal: () => {
      const result: Paragraph[] = [];

      result.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: character.name,
              bold: true,
              font: "Calibri",
              size: 36, // 18pt
            }),
          ],
        })
      );

      const headerLines: string[] = [
        `${dt.race}: ${race ? localized(race.name, race.name_en, props.locale) : "—"}  |  ${dt.class}: ${classNames || "—"}  |  ${dt.level}: ${levelDisplay || character.level}`,
        `${dt.hitDie}: ${hitDice || "—"}  |  ${dt.hp}: ${character.hp_current}/${character.hp_max}  |  ${dt.alignment}: ${getAlignmentLabel(character.alignment, props.locale)}`,
        ...(kitDef ? [`${dt.kit}: ${localized(kitDef.name, kitDef.name_en, props.locale)}`] : []),
        `${dt.xp}: ${xpDisplay}`,
        `${dt.treasure}: ${treasureDisplay}`,
      ];
      if (character.player_name) headerLines.push(`${dt.player}: ${character.player_name}`);
      if (character.age != null) headerLines.push(`${dt.age}: ${character.age}`);
      if (character.height_cm != null) headerLines.push(`${dt.height}: ${character.height_cm} cm`);
      if (character.weight_kg != null) headerLines.push(`${dt.weight}: ${character.weight_kg} kg`);
      if (character.gender)
        headerLines.push(`${dt.gender}: ${translateGender(character.gender, props.locale)}`);

      for (const line of headerLines) {
        result.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: line, font: "Calibri", size: 20 })],
          })
        );
      }

      return result;
    },

    // ── 2. Abilities Table ──────────────────────────────────────────────────
    abilities: () => {
      const result: (Paragraph | Table)[] = [];
      result.push(sectionHeading(dt.abilities));

      const abilityRows: { name: string; value: string; mods: string }[] = [
        {
          name: "Strength (STR)",
          value: strDisplay,
          mods: `Hit: ${strMods.hitAdj >= 0 ? "+" : ""}${strMods.hitAdj}, Damage: ${strMods.dmgAdj >= 0 ? "+" : ""}${strMods.dmgAdj}, Weight: ${lbsToKg(strMods.weightAllow)} kg, Max. Press: ${lbsToKg(strMods.maxPress)} kg, Doors: ${strMods.openDoors}, Bars: ${strMods.bendBars}%`,
        },
        {
          name: "Dexterity (DEX)",
          value: String(character.dex),
          mods: `Reaction: ${dexMods.reactionAdj >= 0 ? "+" : ""}${dexMods.reactionAdj}, Missile: ${dexMods.missileAdj >= 0 ? "+" : ""}${dexMods.missileAdj}, AC: ${dexMods.defensiveAdj >= 0 ? "+" : ""}${dexMods.defensiveAdj}${dexMods.pickPockets !== 0 || dexMods.openLocks !== 0 || dexMods.moveSilently !== 0 ? `, PP: ${dexMods.pickPockets >= 0 ? "+" : ""}${dexMods.pickPockets}%, OL: ${dexMods.openLocks >= 0 ? "+" : ""}${dexMods.openLocks}%, FT: ${dexMods.findTraps >= 0 ? "+" : ""}${dexMods.findTraps}%, MS: ${dexMods.moveSilently >= 0 ? "+" : ""}${dexMods.moveSilently}%, HS: ${dexMods.hideInShadows >= 0 ? "+" : ""}${dexMods.hideInShadows}%, CW: ${dexMods.climbWalls >= 0 ? "+" : ""}${dexMods.climbWalls}%` : ""}`,
        },
        {
          name: "Constitution (CON)",
          value: String(character.con),
          mods: `HP/Level: ${conMods.hpAdj >= 0 ? "+" : ""}${conMods.hpAdj}, System Shock: ${conMods.systemShock}%, Poison Save: ${conMods.poisonSave >= 0 ? "+" : ""}${conMods.poisonSave}, Resurrection: ${conMods.resurrectionSurvival}%`,
        },
        {
          name: "Intelligence (INT)",
          value: String(character.int),
          mods: `Languages: ${intMods.numberOfLanguages}${intMods.spellLevel ? `, Max Spell Level: ${intMods.spellLevel}` : ""}${intMods.chanceToLearn ? `, Learn Spell: ${intMods.chanceToLearn}%` : ""}${intMods.maxSpellsPerLevel ? `, Max Spells/Level: ${intMods.maxSpellsPerLevel}` : ""}${intMods.spellImmunity != null ? `, Illusion Immunity: Lvl ${intMods.spellImmunity}` : ""}${intMods.bonusProficiencies > 0 ? `, Bonus Prof.: ${intMods.bonusProficiencies}` : ""}`,
        },
        {
          name: "Wisdom (WIS)",
          value: String(character.wis),
          mods: `Mag. Defense: ${wisMods.magicalDefenseAdj >= 0 ? "+" : ""}${wisMods.magicalDefenseAdj}, Spell Failure: ${wisMods.spellFailure}%${wisMods.bonusSpells.length > 0 ? `, Bonus Spells: ${wisMods.bonusSpells.join("/")}` : ""}${wisMods.spellImmunity != null ? `, Spell Immunity: ${wisMods.spellImmunity}` : ""}`,
        },
        {
          name: "Charisma (CHA)",
          value: String(character.cha),
          mods: `Henchmen: ${chaMods.maxHenchmen}, Loyalty: ${chaMods.loyaltyBase >= 0 ? "+" : ""}${chaMods.loyaltyBase}, Reaction: ${chaMods.reactionAdj >= 0 ? "+" : ""}${chaMods.reactionAdj}`,
        },
      ];

      // Sub-stats for each ability (Player's Option)
      const subStats: { key: string; parts: string[] }[] = [
        {
          key: "str",
          parts: [
            ...(character.str_stamina != null ? [`Stamina: ${character.str_stamina}`] : []),
            ...(character.str_muscle != null ? [`Muscle: ${character.str_muscle}`] : []),
          ],
        },
        {
          key: "dex",
          parts: [
            ...(character.dex_aim != null ? [`Aim: ${character.dex_aim}`] : []),
            ...(character.dex_balance != null ? [`Balance: ${character.dex_balance}`] : []),
          ],
        },
        {
          key: "con",
          parts: [
            ...(character.con_health != null ? [`Health: ${character.con_health}`] : []),
            ...(character.con_fitness != null ? [`Fitness: ${character.con_fitness}`] : []),
          ],
        },
        {
          key: "int",
          parts: [
            ...(character.int_reason != null ? [`Reason: ${character.int_reason}`] : []),
            ...(character.int_knowledge != null ? [`Knowledge: ${character.int_knowledge}`] : []),
          ],
        },
        {
          key: "wis",
          parts: [
            ...(character.wis_intuition != null ? [`Intuition: ${character.wis_intuition}`] : []),
            ...(character.wis_willpower != null ? [`Willpower: ${character.wis_willpower}`] : []),
          ],
        },
        {
          key: "cha",
          parts: [
            ...(character.cha_leadership != null
              ? [`Leadership: ${character.cha_leadership}`]
              : []),
            ...(character.cha_appearance != null
              ? [`Appearance: ${character.cha_appearance}`]
              : []),
          ],
        },
      ];

      const abilityTableRows: TableRow[] = [];
      const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"];
      for (let i = 0; i < abilityRows.length; i++) {
        const row = abilityRows[i];
        abilityTableRows.push(
          new TableRow({
            children: [
              cell(row.name, { width: 25 }),
              cell(row.value, {
                width: 10,
                alignment: AlignmentType.CENTER,
                bold: true,
                font: "Courier New",
              }),
              cell(row.mods, { width: 65, size: 18 }),
            ],
          })
        );
        const sub = subStats.find((s) => s.key === abilityKeys[i]);
        if (sub && sub.parts.length > 0) {
          abilityTableRows.push(
            new TableRow({
              children: [
                cell(`    ${sub.parts.join(", ")}`, {
                  columnSpan: 3,
                  size: 16,
                }),
              ],
            })
          );
        }
      }

      result.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Ability", { width: 25 }),
                headerCell("Value", { width: 10, alignment: AlignmentType.CENTER }),
                headerCell("Modifiers", { width: 65 }),
              ],
            }),
            ...abilityTableRows,
          ],
        })
      );

      return result;
    },

    // ── 3. Combat Values ────────────────────────────────────────────────────
    combat: () => {
      const result: (Paragraph | Table)[] = [];
      result.push(sectionHeading(dt.combatValues));

      result.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("THAC0", { alignment: AlignmentType.CENTER }),
                headerCell("Armor Class", { alignment: AlignmentType.CENTER }),
                headerCell("Hit Mod", { alignment: AlignmentType.CENTER }),
                headerCell("Damage Mod", { alignment: AlignmentType.CENTER }),
                headerCell("Attacks/Round", { alignment: AlignmentType.CENTER }),
                headerCell("Initiative", { alignment: AlignmentType.CENTER }),
              ],
            }),
            new TableRow({
              children: [
                cell(String(thac0), {
                  alignment: AlignmentType.CENTER,
                  bold: true,
                  font: "Courier New",
                  size: 24,
                }),
                cell(String(effectiveAC), {
                  alignment: AlignmentType.CENTER,
                  bold: true,
                  font: "Courier New",
                  size: 24,
                }),
                cell(`${strMods.hitAdj >= 0 ? "+" : ""}${strMods.hitAdj}`, {
                  alignment: AlignmentType.CENTER,
                  bold: true,
                  font: "Courier New",
                  size: 24,
                }),
                cell(`${strMods.dmgAdj >= 0 ? "+" : ""}${strMods.dmgAdj}`, {
                  alignment: AlignmentType.CENTER,
                  bold: true,
                  font: "Courier New",
                  size: 24,
                }),
                cell(attacksDisplay, {
                  alignment: AlignmentType.CENTER,
                  bold: true,
                  font: "Courier New",
                  size: 24,
                }),
                cell(`${dexMods.reactionAdj >= 0 ? "+" : ""}${dexMods.reactionAdj}`, {
                  alignment: AlignmentType.CENTER,
                  bold: true,
                  font: "Courier New",
                  size: 24,
                }),
              ],
            }),
          ],
        })
      );

      return result;
    },

    // ── 4. Saving Throws ────────────────────────────────────────────────────
    saves: () => {
      if (!saves) return [];

      const result: (Paragraph | Table)[] = [];
      result.push(sectionHeading(dt.savingThrows));
      result.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell(dt.savePara, { alignment: AlignmentType.CENTER }),
                headerCell(dt.saveRod, { alignment: AlignmentType.CENTER }),
                headerCell(dt.savePetri, { alignment: AlignmentType.CENTER }),
                headerCell(dt.saveBreath, { alignment: AlignmentType.CENTER }),
                headerCell(dt.saveSpell, { alignment: AlignmentType.CENTER }),
              ],
            }),
            new TableRow({
              children: [
                cell(String(saves.paralyzation), {
                  alignment: AlignmentType.CENTER,
                  bold: true,
                  font: "Courier New",
                  size: 24,
                }),
                cell(String(saves.rod), {
                  alignment: AlignmentType.CENTER,
                  bold: true,
                  font: "Courier New",
                  size: 24,
                }),
                cell(String(saves.petrification), {
                  alignment: AlignmentType.CENTER,
                  bold: true,
                  font: "Courier New",
                  size: 24,
                }),
                cell(String(saves.breath), {
                  alignment: AlignmentType.CENTER,
                  bold: true,
                  font: "Courier New",
                  size: 24,
                }),
                cell(String(saves.spell), {
                  alignment: AlignmentType.CENTER,
                  bold: true,
                  font: "Courier New",
                  size: 24,
                }),
              ],
            }),
          ],
        })
      );

      return result;
    },

    // ── 4b. Racial & Class Abilities ────────────────────────────────────────
    racialClassAbilities: () => {
      const hasRacialAbilities = race?.racialAbilities && race.racialAbilities.length > 0;
      const classAbilitiesEntries = activeClasses
        .map((cc) => {
          const clsDef = CLASSES[cc.class_id as ClassId];
          return clsDef?.classAbilities?.length ? { clsDef, classId: cc.class_id } : null;
        })
        .filter(Boolean) as { clsDef: (typeof CLASSES)[ClassId]; classId: string }[];
      const kitAbilities = kitDef?.abilities?.length ? kitDef.abilities : [];

      if (!hasRacialAbilities && classAbilitiesEntries.length === 0 && kitAbilities.length === 0) {
        return [];
      }

      const result: (Paragraph | Table)[] = [];
      result.push(sectionHeading(dt.racialAbilities));

      if (hasRacialAbilities && race?.racialAbilities) {
        result.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: `Racial Abilities (${localized(race.name, race.name_en, props.locale)})`,
                bold: true,
                font: "Calibri",
                size: 22,
              }),
            ],
          })
        );
        for (const a of race.racialAbilities) {
          result.push(
            new Paragraph({
              spacing: { after: 20 },
              indent: { left: 360 },
              bullet: { level: 0 },
              children: [
                new TextRun({
                  text: localized(a.name, a.name_en, props.locale),
                  bold: true,
                  font: "Calibri",
                  size: 20,
                }),
                new TextRun({
                  text: ` — ${localized(a.description, a.description_en, props.locale)}`,
                  font: "Calibri",
                  size: 20,
                }),
              ],
            })
          );
        }
      }

      for (const entry of classAbilitiesEntries) {
        result.push(
          new Paragraph({
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: `Class Abilities (${localized(entry.clsDef.name, entry.clsDef.name_en, props.locale)})`,
                bold: true,
                font: "Calibri",
                size: 22,
              }),
            ],
          })
        );
        for (const a of entry.clsDef.classAbilities!) {
          result.push(
            new Paragraph({
              spacing: { after: 20 },
              indent: { left: 360 },
              bullet: { level: 0 },
              children: [
                new TextRun({
                  text: localized(a.name, a.name_en, props.locale),
                  bold: true,
                  font: "Calibri",
                  size: 20,
                }),
                new TextRun({
                  text: ` — ${localized(a.description, a.description_en, props.locale)}`,
                  font: "Calibri",
                  size: 20,
                }),
              ],
            })
          );
        }
      }

      if (kitAbilities.length > 0 && kitDef) {
        result.push(
          new Paragraph({
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: `Kit Abilities (${localized(kitDef.name, kitDef.name_en, props.locale)})`,
                bold: true,
                font: "Calibri",
                size: 22,
              }),
            ],
          })
        );
        for (const a of kitAbilities) {
          result.push(
            new Paragraph({
              spacing: { after: 20 },
              indent: { left: 360 },
              bullet: { level: 0 },
              children: [
                new TextRun({
                  text: localized(a.name, a.name_en, props.locale),
                  bold: true,
                  font: "Calibri",
                  size: 20,
                }),
                new TextRun({
                  text: ` — ${localized(a.description, a.description_en, props.locale)}`,
                  font: "Calibri",
                  size: 20,
                }),
              ],
            })
          );
        }
      }

      return result;
    },

    // ── 5. AC Breakdown ─────────────────────────────────────────────────────
    acBreakdown: () => {
      const result: (Paragraph | Table)[] = [];
      result.push(sectionHeading(dt.acBreakdown));

      // Build dynamic AC parts (same logic as play-combat-panel and print-sheet)
      const parts: { label: string; value: string }[] = [];
      parts.push({ label: dt.base ?? "Base", value: "10" });

      if (equippedArmorForAC?.armor) {
        const armorLabel = localized(
          equippedArmorForAC.armor.name,
          equippedArmorForAC.armor.name_en,
          props.locale
        );
        if (isMagicalProtection) {
          parts.push({ label: armorLabel, value: String(-equippedArmorForAC.armor.ac) });
        } else {
          const armorMod = equippedArmorForAC.armor.ac - 10;
          if (armorMod !== 0) {
            parts.push({ label: armorLabel, value: String(armorMod) });
          }
        }
      }
      if (hasShieldForAC) {
        parts.push({ label: dt.acShield ?? "Shield", value: "-1" });
      }
      if (dexMods.defensiveAdj !== 0) {
        const v = dexMods.defensiveAdj;
        parts.push({ label: "DEX", value: v >= 0 ? `+${v}` : String(v) });
      }
      const isEffectivelyUnarmored = !equippedArmorForAC?.armor || isMagicalProtection;
      if (isEffectivelyUnarmored) {
        const hasWarriorOrRogue = classGroups.some((g) => g === "warrior" || g === "rogue");
        const isUnencumbered = character.ignore_encumbrance || encumbranceLevel === "unencumbered";
        if (hasWarriorOrRogue && isUnencumbered) {
          parts.push({ label: dt.unarmoredBonus ?? "Unarmored", value: "-2" });
        }
      }
      if (epicEffects.acBonus) {
        parts.push({
          label: dt.epicAcBonus ?? "Epic",
          value: String(-epicEffects.acBonus),
        });
      }
      parts.push({ label: dt.acFinal ?? "Final", value: String(effectiveAC) });

      result.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: parts.map((p) => headerCell(p.label, { alignment: AlignmentType.CENTER })),
            }),
            new TableRow({
              children: parts.map((p) =>
                cell(p.value, {
                  alignment: AlignmentType.CENTER,
                  bold: true,
                  font: "Courier New",
                  size: 24,
                })
              ),
            }),
          ],
        })
      );

      return result;
    },

    // ── 5b. Thief Skills ────────────────────────────────────────────────────
    thiefSkills: () => {
      if (!hasThiefSkills(activeClasses.map((cc) => cc.class_id as ClassId))) {
        return [];
      }

      const result: (Paragraph | Table)[] = [];
      result.push(sectionHeading(dt.thiefSkills));
      const backstabLevel =
        activeClasses.find((cc) => cc.class_id === "thief" || cc.class_id === "bard")?.level ?? 1;
      const thiefData = [
        { label: "Pick Locks", value: `${character.thief_pick_locks}%` },
        { label: "Find Traps", value: `${character.thief_find_traps}%` },
        { label: "Move Silently", value: `${character.thief_move_silently}%` },
        { label: "Hide in Shadows", value: `${character.thief_hide_shadows}%` },
        { label: "Climb Walls", value: `${character.thief_climb_walls}%` },
        { label: "Detect Noise", value: `${character.thief_detect_noise}%` },
        { label: "Read Languages", value: `${character.thief_read_languages}%` },
        { label: "Backstab", value: `x${getBackstabMultiplier(backstabLevel)}` },
      ];
      result.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: thiefData.map((d) =>
                headerCell(d.label, { alignment: AlignmentType.CENTER })
              ),
            }),
            new TableRow({
              children: thiefData.map((d) =>
                cell(d.value, {
                  alignment: AlignmentType.CENTER,
                  bold: true,
                  font: "Courier New",
                  size: 24,
                })
              ),
            }),
          ],
        })
      );

      return result;
    },

    // ── 6. Weapons Table ────────────────────────────────────────────────────
    weapons: () => {
      const equippedWeapons = equipment.filter((e) => e.weapon && e.equipped);
      if (equippedWeapons.length === 0) return [];

      const result: (Paragraph | Table)[] = [];
      result.push(sectionHeading(dt.weapons));
      result.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Name"),
                headerCell("THAC0 Melee", { alignment: AlignmentType.CENTER }),
                headerCell("THAC0 Ranged", { alignment: AlignmentType.CENTER }),
                headerCell("Dmg S/M", { alignment: AlignmentType.CENTER }),
                headerCell("Dmg L", { alignment: AlignmentType.CENTER }),
                headerCell("Spd", { alignment: AlignmentType.CENTER }),
                headerCell("Range", { alignment: AlignmentType.CENTER }),
                headerCell("Atk/Rnd", { alignment: AlignmentType.CENTER }),
              ],
            }),
            ...(() => {
              const warriorClassEntry = classEntries.find(
                (ce) => getClassGroup(ce.classId) === "warrior"
              );
              const weaponClassGroup: ClassGroup = (() => {
                const groups = classEntries.map((ce) => getClassGroup(ce.classId));
                if (groups.includes("warrior")) return "warrior";
                if (groups.includes("priest")) return "priest";
                if (groups.includes("rogue")) return "rogue";
                return (groups[0] ?? "warrior") as ClassGroup;
              })();
              return equippedWeapons.map((e) => {
                const weapon = e.weapon!;
                const matchingProf = findWeaponProf(
                  weaponProficiencies,
                  weapon.name,
                  weapon.name_en
                );
                const isProficient = !!matchingProf;
                const isSpecialized = matchingProf?.specialization ?? false;
                const specHitBonus = isSpecialized ? 1 : 0;
                const specDmgBonus = isSpecialized ? 2 : 0;
                const penalty = isProficient ? 0 : getNonproficiencyPenalty(weaponClassGroup);
                const hitBonus = e.hit_bonus ?? 0;
                const dmgBonus = e.damage_bonus ?? 0;
                const weaponThac0 = getAdjustedWeaponThac0(
                  thac0,
                  strMods.hitAdj + specHitBonus,
                  dexMods.missileAdj + specHitBonus,
                  weapon.weapon_type,
                  penalty,
                  hitBonus
                );
                const rangeStr =
                  weapon.weapon_type !== "melee" &&
                  weapon.range_short != null &&
                  weapon.range_medium != null &&
                  weapon.range_long != null
                    ? `${feetToMeters(weapon.range_short)}/${feetToMeters(weapon.range_medium)}/${feetToMeters(weapon.range_long)}`
                    : "—";
                const weaponLabel = `${localized(weapon.name, weapon.name_en, props.locale)}${hitBonus > 0 ? ` +${hitBonus}` : ""}${!isProficient ? " *" : ""}`;

                return new TableRow({
                  children: [
                    cell(weaponLabel),
                    cell(String(weaponThac0.melee), {
                      alignment: AlignmentType.CENTER,
                      font: "Courier New",
                    }),
                    cell(weaponThac0.ranged !== null ? String(weaponThac0.ranged) : "—", {
                      alignment: AlignmentType.CENTER,
                      font: "Courier New",
                    }),
                    cell(
                      formatDamageWithBonus(
                        weapon.damage_sm,
                        strMods.dmgAdj + specDmgBonus,
                        dmgBonus
                      ),
                      {
                        alignment: AlignmentType.CENTER,
                        font: "Courier New",
                      }
                    ),
                    cell(
                      formatDamageWithBonus(
                        weapon.damage_l,
                        strMods.dmgAdj + specDmgBonus,
                        dmgBonus
                      ),
                      {
                        alignment: AlignmentType.CENTER,
                        font: "Courier New",
                      }
                    ),
                    cell(String(weapon.speed), {
                      alignment: AlignmentType.CENTER,
                      font: "Courier New",
                    }),
                    cell(rangeStr, {
                      alignment: AlignmentType.CENTER,
                      font: "Courier New",
                      size: 18,
                    }),
                    cell(
                      warriorClassEntry
                        ? getAttacksPerRound("warrior", warriorClassEntry.level, isSpecialized)
                        : isSpecialized
                          ? "3/2"
                          : "1",
                      { alignment: AlignmentType.CENTER, font: "Courier New" }
                    ),
                  ],
                });
              });
            })(),
          ],
        })
      );

      return result;
    },

    // ── 7. Equipment (Armor & Inventory) ────────────────────────────────────
    equipment: () => {
      const equipmentItems = equipment.filter((e) => e.armor || (e.weapon && !e.equipped));
      if (equipmentItems.length === 0) return [];

      const result: (Paragraph | Table)[] = [];
      result.push(sectionHeading(dt.armorInventory));
      result.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Item", { width: 40 }),
                headerCell("Type", { width: 20, alignment: AlignmentType.CENTER }),
                headerCell("Weight", { width: 20, alignment: AlignmentType.CENTER }),
                headerCell("Status", { width: 20, alignment: AlignmentType.CENTER }),
              ],
            }),
            ...equipmentItems.map(
              (e) =>
                new TableRow({
                  children: [
                    cell(
                      e.weapon
                        ? localized(e.weapon.name, e.weapon.name_en, props.locale)
                        : e.armor
                          ? localized(e.armor.name, e.armor.name_en, props.locale)
                          : "—",
                      { width: 40 }
                    ),
                    cell(e.weapon ? "Weapon" : "Armor", {
                      width: 20,
                      alignment: AlignmentType.CENTER,
                    }),
                    cell(`${lbsToKg(e.weapon?.weight ?? e.armor?.weight ?? 0)} kg`, {
                      width: 20,
                      alignment: AlignmentType.CENTER,
                    }),
                    cell(e.equipped ? "Equipped" : "Inventory", {
                      width: 20,
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                })
            ),
          ],
        })
      );

      return result;
    },

    // ── 7b. General Inventory ─────────────────────────────────────────────
    generalInventory: () => {
      if (inventory.length === 0) return [];

      const result: (Paragraph | Table)[] = [];
      result.push(sectionHeading(dt.generalInventory));
      result.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("Item", { width: 50 }),
                headerCell("Weight", { width: 25, alignment: AlignmentType.CENTER }),
                headerCell("Qty", { width: 25, alignment: AlignmentType.CENTER }),
              ],
            }),
            ...inventory.map(
              (inv) =>
                new TableRow({
                  children: [
                    cell(
                      inv.item
                        ? localized(inv.item.name, inv.item.name_en, props.locale)
                        : (inv.custom_name ?? "—"),
                      { width: 50 }
                    ),
                    cell(inv.item ? `${lbsToKg(inv.item.weight)} kg` : "—", {
                      width: 25,
                      alignment: AlignmentType.CENTER,
                    }),
                    cell(String(inv.quantity), {
                      width: 25,
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                })
            ),
          ],
        })
      );

      return result;
    },

    // ── 8. Spells Known (Table by level) ────────────────────────────────────
    spells: () => {
      const hasPriest = isPriestCaster(character.class_id as ClassId);

      // Priest: use available sphere spells
      if (hasPriest && priestAvailableSpells.length > 0) {
        const result: (Paragraph | Table)[] = [];
        result.push(sectionHeading(dt.spellsKnown));
        const byLevel: Record<number, SpellRow[]> = {};
        for (const s of priestAvailableSpells) {
          if (!byLevel[s.level]) byLevel[s.level] = [];
          byLevel[s.level].push(s);
        }
        const levels = Object.keys(byLevel)
          .map(Number)
          .sort((a, b) => a - b);
        for (const lvl of levels) {
          result.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  tableHeader: true,
                  children: [
                    headerCell(
                      props.locale === "de"
                        ? `Stufe ${lvl} Zauber (${byLevel[lvl].length})`
                        : `Level ${lvl} Spells (${byLevel[lvl].length})`,
                      { width: 25 }
                    ),
                    headerCell(props.locale === "de" ? "Wirkzeit" : "Cast Time", {
                      width: 15,
                      alignment: AlignmentType.CENTER,
                    }),
                    headerCell(props.locale === "de" ? "Reichweite" : "Range", {
                      width: 15,
                      alignment: AlignmentType.CENTER,
                    }),
                    headerCell(props.locale === "de" ? "Wirkungsbereich" : "Area of Effect", {
                      width: 25,
                      alignment: AlignmentType.CENTER,
                    }),
                    headerCell(props.locale === "de" ? "Komp." : "Comp.", {
                      width: 10,
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
                ...byLevel[lvl].map(
                  (spell) =>
                    new TableRow({
                      children: [
                        cell(localized(spell.name, spell.name_en, props.locale)),
                        cell(spell.casting_time || "—", {
                          alignment: AlignmentType.CENTER,
                          size: 18,
                        }),
                        cell(spellRange(spell) || "—", {
                          alignment: AlignmentType.CENTER,
                          size: 18,
                        }),
                        cell(spellArea(spell) || "—", {
                          alignment: AlignmentType.CENTER,
                          size: 18,
                        }),
                        cell((spell.components ?? []).join(", "), {
                          alignment: AlignmentType.CENTER,
                          size: 18,
                        }),
                      ],
                    })
                ),
              ],
            })
          );
          result.push(emptyParagraph());
        }
        return result;
      }

      // Wizard: show learned spells from character_spells
      if (spells.length === 0) return [];

      const result: (Paragraph | Table)[] = [];
      result.push(sectionHeading(dt.spellsKnown));

      // Group spells by level
      const spellsByLevel: Record<number, typeof spells> = {};
      for (const cs of spells) {
        const lvl = cs.spell.level;
        if (!spellsByLevel[lvl]) spellsByLevel[lvl] = [];
        spellsByLevel[lvl].push(cs);
      }

      const spellLevels = Object.keys(spellsByLevel)
        .map(Number)
        .sort((a, b) => a - b);
      for (const lvl of spellLevels) {
        const levelSpells = spellsByLevel[lvl];
        result.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  headerCell(
                    props.locale === "de" ? `Stufe ${lvl} Zauber` : `Level ${lvl} Spells`,
                    { width: 25 }
                  ),
                  headerCell(props.locale === "de" ? "Wirkzeit" : "Cast Time", {
                    width: 15,
                    alignment: AlignmentType.CENTER,
                  }),
                  headerCell(props.locale === "de" ? "Reichweite" : "Range", {
                    width: 15,
                    alignment: AlignmentType.CENTER,
                  }),
                  headerCell(props.locale === "de" ? "Wirkungsbereich" : "Area of Effect", {
                    width: 25,
                    alignment: AlignmentType.CENTER,
                  }),
                  headerCell(props.locale === "de" ? "Komp." : "Comp.", {
                    width: 10,
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              ...levelSpells.map(
                (cs) =>
                  new TableRow({
                    children: [
                      cell(
                        `${localized(cs.spell.name, cs.spell.name_en, props.locale)}${cs.prepared ? " \u2605" : ""}`,
                        { bold: cs.prepared }
                      ),
                      cell(cs.spell.casting_time || "—", {
                        alignment: AlignmentType.CENTER,
                        size: 18,
                      }),
                      cell(spellRange(cs.spell) || "—", {
                        alignment: AlignmentType.CENTER,
                        size: 18,
                      }),
                      cell(spellArea(cs.spell) || "—", {
                        alignment: AlignmentType.CENTER,
                        size: 18,
                      }),
                      cell((cs.spell.components ?? []).join(", "), {
                        alignment: AlignmentType.CENTER,
                        size: 18,
                      }),
                    ],
                  })
              ),
            ],
          })
        );
        result.push(emptyParagraph());
      }

      return result;
    },

    // ── 8b. Spells Memorized ────────────────────────────────────────────────
    spellsMemorized: () => {
      const preparedSpells = spells.filter((cs) => cs.prepared);
      if (preparedSpells.length === 0) return [];

      const result: (Paragraph | Table)[] = [];
      result.push(sectionHeading(dt.spellsMemorized));
      const preparedByLevel: Record<number, typeof spells> = {};
      for (const cs of preparedSpells) {
        const lvl = cs.spell.level;
        if (!preparedByLevel[lvl]) preparedByLevel[lvl] = [];
        preparedByLevel[lvl].push(cs);
      }
      for (const lvl of Object.keys(preparedByLevel)
        .map(Number)
        .sort((a, b) => a - b)) {
        result.push(
          new Paragraph({
            spacing: { before: 60, after: 40 },
            children: [
              new TextRun({
                text: props.locale === "de" ? `Stufe ${lvl}` : `Level ${lvl}`,
                bold: true,
                font: "Calibri",
                size: 20,
              }),
            ],
          })
        );
        for (const cs of preparedByLevel[lvl]) {
          result.push(
            new Paragraph({
              spacing: { after: 20 },
              indent: { left: 360 },
              bullet: { level: 0 },
              children: [
                new TextRun({
                  text: localized(cs.spell.name, cs.spell.name_en, props.locale),
                  font: "Calibri",
                  size: 20,
                }),
              ],
            })
          );
        }
      }

      return result;
    },

    // ── 9. Proficiencies ────────────────────────────────────────────────────
    proficiencies: () => {
      const hasFightingStyles = fightingStyles.length > 0;
      if (
        weaponProficiencies.length === 0 &&
        nonweaponProficiencies.length === 0 &&
        languages.length === 0 &&
        !hasFightingStyles
      ) {
        return [];
      }

      const result: (Paragraph | Table)[] = [];
      result.push(sectionHeading(dt.proficiencies));

      if (weaponProficiencies.length > 0) {
        result.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: dt.weaponProf, bold: true, font: "Calibri", size: 22 })],
          })
        );
        for (const wp of weaponProficiencies) {
          result.push(
            new Paragraph({
              spacing: { after: 20 },
              indent: { left: 360 },
              bullet: { level: 0 },
              children: [
                new TextRun({
                  text: `${wp.weapon_name}${wp.specialization ? " (Specialization)" : ""}`,
                  font: "Calibri",
                  size: 20,
                }),
              ],
            })
          );
        }
      }

      if (nonweaponProficiencies.length > 0) {
        result.push(
          new Paragraph({
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: dt.nwProf,
                bold: true,
                font: "Calibri",
                size: 22,
              }),
            ],
          })
        );
        for (const nwp of nonweaponProficiencies) {
          const modStr =
            nwp.proficiency.modifier >= 0
              ? `+${nwp.proficiency.modifier}`
              : String(nwp.proficiency.modifier);
          result.push(
            new Paragraph({
              spacing: { after: 20 },
              indent: { left: 360 },
              bullet: { level: 0 },
              children: [
                new TextRun({
                  text: `${localized(nwp.proficiency.name, nwp.proficiency.name_en, props.locale)} (${nwp.proficiency.ability} ${modStr})`,
                  font: "Calibri",
                  size: 20,
                }),
              ],
            })
          );
        }
      }

      if (hasFightingStyles) {
        result.push(
          new Paragraph({
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: dt.fightingStyles,
                bold: true,
                font: "Calibri",
                size: 22,
              }),
            ],
          })
        );
        for (const fs of fightingStyles) {
          const styleDef = getFightingStyle(fs.style_id);
          if (!styleDef) continue;
          const styleName = localized(styleDef.name, styleDef.name_en, props.locale);
          const benefit = styleDef.benefits.find((b) => b.slots <= fs.slots_invested);
          // Find highest applicable benefit
          const applicableBenefit = styleDef.benefits
            .filter((b) => b.slots <= fs.slots_invested)
            .sort((a, b) => b.slots - a.slots)[0];
          const benefitText = applicableBenefit
            ? localized(
                applicableBenefit.description,
                applicableBenefit.description_en,
                props.locale
              )
            : benefit
              ? localized(benefit.description, benefit.description_en, props.locale)
              : "";
          result.push(
            new Paragraph({
              spacing: { after: 20 },
              indent: { left: 360 },
              bullet: { level: 0 },
              children: [
                new TextRun({
                  text: `${styleName} (${fs.slots_invested} ${fs.slots_invested === 1 ? "Slot" : "Slots"})`,
                  bold: true,
                  font: "Calibri",
                  size: 20,
                }),
                ...(benefitText
                  ? [
                      new TextRun({
                        text: ` — ${benefitText}`,
                        font: "Calibri",
                        size: 20,
                      }),
                    ]
                  : []),
              ],
            })
          );
        }
      }

      if (languages.length > 0) {
        result.push(
          new Paragraph({
            spacing: { before: 120, after: 60 },
            children: [new TextRun({ text: dt.languages, bold: true, font: "Calibri", size: 22 })],
          })
        );
        result.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: languages.map((l) => l.language_name).join(", "),
                font: "Calibri",
                size: 20,
              }),
            ],
          })
        );
      }

      return result;
    },

    // ── 10. Notes ───────────────────────────────────────────────────────────
    notes: () => {
      if (!character.notes) return [];

      const result: (Paragraph | Table)[] = [];
      result.push(sectionHeading(dt.notes));
      const noteLines = character.notes.split("\n");
      for (const line of noteLines) {
        result.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: line || " ",
                font: "Calibri",
                size: 20,
              }),
            ],
          })
        );
      }

      return result;
    },
  };

  // ─── Build document sections using preferences ────────────────────────────
  const prefs = props.preferences ?? DEFAULT_PRINT_PREFERENCES;
  const children: (Paragraph | Table)[] = [];
  for (const section of prefs.sections) {
    if (!section.visible) continue;
    children.push(...sectionGenerators[section.id]());
  }

  // ── Footer (always appended) ──────────────────────────────────────────────
  children.push(emptyParagraph());
  children.push(
    new Paragraph({
      spacing: { before: 240 },
      children: [
        new TextRun({
          text: `Chaos Forge — AD&D 2nd Edition Manager  |  Created ${new Date(character.created_at).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" })}`,
          font: "Calibri",
          size: 16,
          color: "999999",
        }),
      ],
    })
  );

  // ── Create Document ───────────────────────────────────────────────────────
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}
