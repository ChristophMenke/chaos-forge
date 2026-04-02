"use client";

import { Fragment, type ReactNode } from "react";
import { useTranslations, useLocale } from "next-intl";
import { localized } from "@/lib/utils/localize";
import type { PrintPreferences, PrintSectionId } from "@/lib/print-config";
import { DEFAULT_PRINT_PREFERENCES } from "@/lib/print-config";
import { usePrintPreferences } from "@/lib/hooks/use-print-preferences";
import { computeSectionDataPresence } from "@/lib/print-config";
import { PrintCustomizationPanel } from "@/components/print-sheet/print-customization-panel";
import { spellRange, spellArea } from "@/lib/utils/spell-display";
import { RACES } from "@/lib/rules/races";
import { CLASSES, getClassGroup } from "@/lib/rules/classes";
import { getAlignmentLabel } from "@/lib/rules/alignment";
import { getXpForNextLevel } from "@/lib/rules/experience";
import type { ClassId } from "@/lib/rules/types";
import { getMulticlassThac0, getMulticlassSaves } from "@/lib/rules/multiclass";
import {
  getAttacksPerRound,
  getAdjustedWeaponThac0,
  formatDamageWithBonus,
} from "@/lib/rules/combat";
import { getNonproficiencyPenalty } from "@/lib/rules/proficiencies";
import { hasThiefSkills, getBackstabMultiplier } from "@/lib/rules/thief";
import { getKit, getEffectiveHitDie } from "@/lib/rules/kits";
import { calculateAC, calculateEncumbrance, isShieldItem } from "@/lib/rules/equipment";
import { feetToMeters } from "@/lib/utils/units";
import { getAllAbilityModifiers } from "@/lib/rules/abilities";
import { lbsToKg } from "@/lib/utils/units";
import { findWeaponProf } from "@/lib/utils/proficiency-match";
import type {
  CharacterRow,
  CharacterClassRow,
  CharacterEquipmentWithDetails,
  CharacterSpellWithDetails,
  CharacterWeaponProficiencyRow,
  CharacterNWPWithDetails,
  CharacterLanguageRow,
  CharacterFightingStyleRow,
  SpellRow,
} from "@/lib/supabase/types";
import { isPriestCaster } from "@/lib/rules/magic";
import { getFightingStyle } from "@/lib/rules/fighting-styles";

export interface PrintSheetProps {
  character: CharacterRow;
  characterClasses: CharacterClassRow[];
  equipment: CharacterEquipmentWithDetails[];
  spells: CharacterSpellWithDetails[];
  weaponProficiencies: CharacterWeaponProficiencyRow[];
  nonweaponProficiencies: CharacterNWPWithDetails[];
  languages: CharacterLanguageRow[];
  fightingStyles: CharacterFightingStyleRow[];
  priestAvailableSpells?: SpellRow[];
}

interface PrintSheetInternalProps extends PrintSheetProps {
  preferences: PrintPreferences;
  toolbar: ReactNode;
}

export function PrintSheet({
  character,
  characterClasses,
  equipment,
  spells,
  weaponProficiencies,
  nonweaponProficiencies,
  languages,
  fightingStyles,
  priestAvailableSpells = [],
  preferences = DEFAULT_PRINT_PREFERENCES,
  toolbar,
}: PrintSheetInternalProps) {
  const t = useTranslations("print");
  const locale = useLocale();
  const race = character.race_id ? RACES[character.race_id as keyof typeof RACES] : null;

  const activeClasses = characterClasses.filter((cc) => cc.is_active);
  const classEntries = activeClasses.map((cc) => ({
    classId: cc.class_id as ClassId,
    level: cc.level,
  }));
  const classNames = activeClasses
    .map((cc) => {
      const cls = CLASSES[cc.class_id as ClassId];
      return cls ? localized(cls.name, cls.name_en, locale) : cc.class_id;
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
  // Correct AC with equipped armor + shield + DEX
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
  const effectiveAC = calculateAC({
    equippedArmorAC: equippedArmorForAC?.armor?.ac ?? null,
    shieldEquipped: hasShieldForAC,
    dexDefenseAdj: dexMods.defensiveAdj,
    classGroups,
    encumbrance: encumbranceLevel,
    ignoreEncumbrance: character.ignore_encumbrance,
    isMagicalProtection: equippedArmorForAC?.armor?.is_magical_protection ?? false,
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

  // ── Spell computations (shared by spells + spellsMemorized renderers) ──
  const spellsByLevel: Record<number, typeof spells> = {};
  for (const cs of spells) {
    const lvl = cs.spell.level;
    if (!spellsByLevel[lvl]) spellsByLevel[lvl] = [];
    spellsByLevel[lvl].push(cs);
  }
  const sortedLevels = Object.keys(spellsByLevel)
    .map(Number)
    .sort((a, b) => a - b);
  const preparedSpells = spells.filter((cs) => cs.prepared);

  // ── Section Renderers ──────────────────────────────────────────
  const sectionRenderers: Record<PrintSectionId, () => ReactNode | null> = {
    personal: () => (
      <section className="mb-4 border-b-2 border-black pb-3" data-testid="print-section-personal">
        <div className="flex items-start gap-4">
          {character.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={character.avatar_url}
              alt={character.name}
              width={72}
              height={72}
              className="rounded border border-gray-300 object-cover"
              style={{ width: 72, height: 72 }}
            />
          )}
          <div className="flex-1">
            <h1 className="font-serif text-2xl font-bold">{character.name}</h1>
            <div className="mt-1 grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
              <div>
                <span className="font-semibold">{t("race")}:</span>{" "}
                {race ? localized(race.name, race.name_en, locale) : "—"}
              </div>
              <div>
                <span className="font-semibold">{t("class")}:</span> {classNames || "—"}
              </div>
              <div>
                <span className="font-semibold">{t("level")}:</span>{" "}
                {levelDisplay || character.level}
              </div>
              <div>
                <span className="font-semibold">{t("hitDie")}:</span> {hitDice || "—"}
              </div>
              <div>
                <span className="font-semibold">{t("hp")}:</span> {character.hp_current}/
                {character.hp_max}
              </div>
              <div>
                <span className="font-semibold">{t("alignment")}:</span>{" "}
                {getAlignmentLabel(character.alignment, locale)}
              </div>
              {character.kit &&
                (() => {
                  const kitDef = getKit(character.kit);
                  return kitDef ? (
                    <div data-testid="print-kit">
                      <span className="font-semibold">{t("kit")}:</span>{" "}
                      {localized(kitDef.name, kitDef.name_en, locale)}
                    </div>
                  ) : null;
                })()}
              <div>
                <span className="font-semibold">{t("xp")}:</span>{" "}
                {activeClasses.length > 0
                  ? activeClasses
                      .map((cc) => {
                        const cls = CLASSES[cc.class_id as ClassId];
                        const name = cls ? localized(cls.name, cls.name_en, locale) : cc.class_id;
                        const next = getXpForNextLevel(cc.class_id as ClassId, cc.level);
                        return `${name}: ${cc.xp_current.toLocaleString()}${next ? ` / ${next.toLocaleString()}` : " (Max)"}`;
                      })
                      .join("; ")
                  : character.xp_current.toLocaleString()}
              </div>
              <div>
                <span className="font-semibold">{t("treasure")}:</span>{" "}
                {character.gold_pp > 0 ? `${character.gold_pp} PP, ` : ""}
                {character.gold_gp} GP
                {character.gold_sp > 0 ? `, ${character.gold_sp} SP` : ""}
                {character.gold_cp > 0 ? `, ${character.gold_cp} CP` : ""}
              </div>
              {character.player_name && (
                <div>
                  <span className="font-semibold">{t("player")}:</span> {character.player_name}
                </div>
              )}
              {character.age != null && (
                <div>
                  <span className="font-semibold">{t("age")}:</span> {character.age}
                </div>
              )}
              {character.height_cm != null && (
                <div>
                  <span className="font-semibold">{t("height")}:</span> {character.height_cm} cm
                </div>
              )}
              {character.weight_kg != null && (
                <div>
                  <span className="font-semibold">{t("weight")}:</span> {character.weight_kg} kg
                </div>
              )}
              {character.gender && (
                <div>
                  <span className="font-semibold">{t("gender")}:</span> {character.gender}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    ),

    abilities: () => (
      <section className="mb-4" data-testid="print-section-abilities">
        <h2 className="mb-2 border-b border-gray-400 font-serif text-lg font-bold">
          {t("abilities")}
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left">
              <th className="py-1 font-semibold">{t("attribute")}</th>
              <th className="py-1 text-center font-semibold">{t("value")}</th>
              <th className="py-1 font-semibold">{t("modifiers")}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-1">{t("strName")}</td>
              <td className="py-1 text-center font-mono font-bold">{strDisplay}</td>
              <td className="py-1 text-xs">
                {t("hit")}: {strMods.hitAdj >= 0 ? "+" : ""}
                {strMods.hitAdj}, {t("damage")}: {strMods.dmgAdj >= 0 ? "+" : ""}
                {strMods.dmgAdj}, {t("weightAllow")}: {lbsToKg(strMods.weightAllow)} kg,{" "}
                {t("maxPress")}: {lbsToKg(strMods.maxPress)} kg, {t("doors")}: {strMods.openDoors},{" "}
                {t("bars")}: {strMods.bendBars}%
              </td>
            </tr>
            {(character.str_stamina != null || character.str_muscle != null) && (
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="py-0.5 pl-4 text-xs text-gray-500" colSpan={3}>
                  {character.str_stamina != null && `${t("stamina")}: ${character.str_stamina}`}
                  {character.str_stamina != null && character.str_muscle != null && ", "}
                  {character.str_muscle != null && `${t("muscle")}: ${character.str_muscle}`}
                </td>
              </tr>
            )}
            <tr className="border-b border-gray-200">
              <td className="py-1">{t("dexName")}</td>
              <td className="py-1 text-center font-mono font-bold">{character.dex}</td>
              <td className="py-1 text-xs">
                {t("reaction")}: {dexMods.reactionAdj >= 0 ? "+" : ""}
                {dexMods.reactionAdj}, {t("missile")}: {dexMods.missileAdj >= 0 ? "+" : ""}
                {dexMods.missileAdj}, {t("ac")}: {dexMods.defensiveAdj >= 0 ? "+" : ""}
                {dexMods.defensiveAdj}
                {(dexMods.pickPockets !== 0 ||
                  dexMods.openLocks !== 0 ||
                  dexMods.moveSilently !== 0) && (
                  <>
                    , {t("pickPockets")}: {dexMods.pickPockets >= 0 ? "+" : ""}
                    {dexMods.pickPockets}%, {t("openLocks")}: {dexMods.openLocks >= 0 ? "+" : ""}
                    {dexMods.openLocks}%, {t("findTraps")}: {dexMods.findTraps >= 0 ? "+" : ""}
                    {dexMods.findTraps}%, {t("moveSilently")}:{" "}
                    {dexMods.moveSilently >= 0 ? "+" : ""}
                    {dexMods.moveSilently}%, {t("hideInShadows")}:{" "}
                    {dexMods.hideInShadows >= 0 ? "+" : ""}
                    {dexMods.hideInShadows}%, {t("climbWalls")}:{" "}
                    {dexMods.climbWalls >= 0 ? "+" : ""}
                    {dexMods.climbWalls}%
                  </>
                )}
              </td>
            </tr>
            {(character.dex_aim != null || character.dex_balance != null) && (
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="py-0.5 pl-4 text-xs text-gray-500" colSpan={3}>
                  {character.dex_aim != null && `${t("aim")}: ${character.dex_aim}`}
                  {character.dex_aim != null && character.dex_balance != null && ", "}
                  {character.dex_balance != null && `${t("balance")}: ${character.dex_balance}`}
                </td>
              </tr>
            )}
            <tr className="border-b border-gray-200">
              <td className="py-1">{t("conName")}</td>
              <td className="py-1 text-center font-mono font-bold">{character.con}</td>
              <td className="py-1 text-xs">
                {t("hpPerLevel")}: {conMods.hpAdj >= 0 ? "+" : ""}
                {conMods.hpAdj}, {t("systemShock")}: {conMods.systemShock}%, {t("poisonSave")}:{" "}
                {conMods.poisonSave >= 0 ? "+" : ""}
                {conMods.poisonSave}, {t("resurrection")}: {conMods.resurrectionSurvival}%
              </td>
            </tr>
            {(character.con_health != null || character.con_fitness != null) && (
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="py-0.5 pl-4 text-xs text-gray-500" colSpan={3}>
                  {character.con_health != null && `${t("health")}: ${character.con_health}`}
                  {character.con_health != null && character.con_fitness != null && ", "}
                  {character.con_fitness != null && `${t("fitness")}: ${character.con_fitness}`}
                </td>
              </tr>
            )}
            <tr className="border-b border-gray-200">
              <td className="py-1">{t("intName")}</td>
              <td className="py-1 text-center font-mono font-bold">{character.int}</td>
              <td className="py-1 text-xs">
                {t("languages")}: {intMods.numberOfLanguages}
                {intMods.spellLevel ? `, ${t("maxSpellLevel")}: ${intMods.spellLevel}` : ""}
                {intMods.chanceToLearn ? `, ${t("learnSpell")}: ${intMods.chanceToLearn}%` : ""}
                {intMods.maxSpellsPerLevel
                  ? `, ${t("maxSpellsPerLevel")}: ${intMods.maxSpellsPerLevel}`
                  : ""}
                {intMods.spellImmunity != null
                  ? `, ${t("illusionImmunity")}: Lvl ${intMods.spellImmunity}`
                  : ""}
                {intMods.bonusProficiencies > 0
                  ? `, ${t("bonusProficiencies")}: ${intMods.bonusProficiencies}`
                  : ""}
              </td>
            </tr>
            {(character.int_reason != null || character.int_knowledge != null) && (
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="py-0.5 pl-4 text-xs text-gray-500" colSpan={3}>
                  {character.int_reason != null && `${t("reason")}: ${character.int_reason}`}
                  {character.int_reason != null && character.int_knowledge != null && ", "}
                  {character.int_knowledge != null &&
                    `${t("knowledge")}: ${character.int_knowledge}`}
                </td>
              </tr>
            )}
            <tr className="border-b border-gray-200">
              <td className="py-1">{t("wisName")}</td>
              <td className="py-1 text-center font-mono font-bold">{character.wis}</td>
              <td className="py-1 text-xs">
                {t("magDefense")}: {wisMods.magicalDefenseAdj >= 0 ? "+" : ""}
                {wisMods.magicalDefenseAdj}, {t("spellFailure")}: {wisMods.spellFailure}%
                {wisMods.bonusSpells.length > 0 &&
                  `, ${t("bonusSpells")}: ${wisMods.bonusSpells.join("/")}`}
                {wisMods.spellImmunity != null &&
                  `, ${t("spellImmunityWis")}: ${wisMods.spellImmunity}`}
              </td>
            </tr>
            {(character.wis_intuition != null || character.wis_willpower != null) && (
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="py-0.5 pl-4 text-xs text-gray-500" colSpan={3}>
                  {character.wis_intuition != null &&
                    `${t("intuition")}: ${character.wis_intuition}`}
                  {character.wis_intuition != null && character.wis_willpower != null && ", "}
                  {character.wis_willpower != null &&
                    `${t("willpower")}: ${character.wis_willpower}`}
                </td>
              </tr>
            )}
            <tr className="border-b border-gray-200">
              <td className="py-1">{t("chaName")}</td>
              <td className="py-1 text-center font-mono font-bold">{character.cha}</td>
              <td className="py-1 text-xs">
                {t("henchmen")}: {chaMods.maxHenchmen}, {t("loyalty")}:{" "}
                {chaMods.loyaltyBase >= 0 ? "+" : ""}
                {chaMods.loyaltyBase}, {t("reaction")}: {chaMods.reactionAdj >= 0 ? "+" : ""}
                {chaMods.reactionAdj}
              </td>
            </tr>
            {(character.cha_leadership != null || character.cha_appearance != null) && (
              <tr className="border-b border-gray-200 bg-gray-50">
                <td className="py-0.5 pl-4 text-xs text-gray-500" colSpan={3}>
                  {character.cha_leadership != null &&
                    `${t("leadership")}: ${character.cha_leadership}`}
                  {character.cha_leadership != null && character.cha_appearance != null && ", "}
                  {character.cha_appearance != null &&
                    `${t("appearance")}: ${character.cha_appearance}`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    ),

    combat: () => (
      <section className="mb-4" data-testid="print-section-combat">
        <h2 className="mb-2 border-b border-gray-400 font-serif text-lg font-bold">
          {t("combatValues")}
        </h2>
        <div className="grid grid-cols-4 gap-3 text-center text-sm">
          <div className="rounded border border-gray-300 p-2">
            <div className="text-xs text-gray-500">THAC0</div>
            <div className="font-mono text-xl font-bold">{thac0}</div>
          </div>
          <div className="rounded border border-gray-300 p-2">
            <div className="text-xs text-gray-500">{t("armorClass")}</div>
            <div className="font-mono text-xl font-bold">{effectiveAC}</div>
            <div className="text-xs text-gray-500">{t("base")}</div>
          </div>
          <div className="rounded border border-gray-300 p-2">
            <div className="text-xs text-gray-500">{t("hitMod")}</div>
            <div className="font-mono text-xl font-bold">
              {strMods.hitAdj >= 0 ? "+" : ""}
              {strMods.hitAdj}
            </div>
          </div>
          <div className="rounded border border-gray-300 p-2">
            <div className="text-xs text-gray-500">{t("damageMod")}</div>
            <div className="font-mono text-xl font-bold">
              {strMods.dmgAdj >= 0 ? "+" : ""}
              {strMods.dmgAdj}
            </div>
          </div>
          <div className="rounded border border-gray-300 p-2">
            <div className="text-xs text-gray-500">{t("attacksPerRound")}</div>
            <div className="font-mono text-xl font-bold">{attacksDisplay}</div>
          </div>
          <div className="rounded border border-gray-300 p-2">
            <div className="text-xs text-gray-500">{t("initiative")}</div>
            <div className="font-mono text-xl font-bold">
              {dexMods.reactionAdj >= 0 ? "+" : ""}
              {dexMods.reactionAdj}
            </div>
          </div>
        </div>
      </section>
    ),

    saves: () => {
      if (!saves) return null;
      return (
        <section className="mb-4" data-testid="print-section-saves">
          <h2 className="mb-2 border-b border-gray-400 font-serif text-lg font-bold">
            {t("savingThrows")}
          </h2>
          <div className="grid grid-cols-5 gap-x-4 gap-y-0.5 text-sm">
            {[
              { label: "Paralyzation", value: saves.paralyzation },
              { label: "Poison", value: saves.paralyzation },
              { label: "Death Magic", value: saves.paralyzation },
              { label: "Petrification", value: saves.petrification },
              { label: "Polymorph", value: saves.petrification },
              { label: "Rod", value: saves.rod },
              { label: "Staff", value: saves.rod },
              { label: "Wand", value: saves.rod },
              { label: t("saveBreath"), value: saves.breath },
              { label: t("saveSpell"), value: saves.spell },
            ].map(({ label, value }) => (
              <div key={label}>
                {label}: <span className="font-bold">{value}</span>
              </div>
            ))}
          </div>
        </section>
      );
    },

    racialClassAbilities: () => {
      if (!(race?.racialAbilities?.length || activeClasses.length > 0)) return null;
      return (
        <section className="mb-4" data-testid="print-section-abilities-list">
          <h2 className="mb-2 border-b border-gray-400 font-serif text-lg font-bold">
            {t("abilities_section")}
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {race?.racialAbilities && race.racialAbilities.length > 0 && (
              <div>
                <h3 className="font-semibold">
                  {t("racialAbilities")} ({localized(race.name, race.name_en, locale)})
                </h3>
                <ul className="mt-1 list-inside list-disc text-xs">
                  {race.racialAbilities.map((a, i) => (
                    <li key={i}>
                      <span className="font-medium">{localized(a.name, a.name_en, locale)}</span>
                      {" — "}
                      {localized(a.description, a.description_en, locale)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activeClasses.map((cc) => {
              const clsDef = CLASSES[cc.class_id as ClassId];
              if (!clsDef?.classAbilities?.length) return null;
              return (
                <div key={cc.class_id}>
                  <h3 className="font-semibold">
                    {t("classAbilities")} ({localized(clsDef.name, clsDef.name_en, locale)})
                  </h3>
                  <ul className="mt-1 list-inside list-disc text-xs">
                    {clsDef.classAbilities.map((a, i) => (
                      <li key={i}>
                        <span className="font-medium">{localized(a.name, a.name_en, locale)}</span>
                        {" — "}
                        {localized(a.description, a.description_en, locale)}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {character.kit &&
              (() => {
                const kitDef = getKit(character.kit);
                if (!kitDef?.abilities?.length) return null;
                return (
                  <div data-testid="print-kit-abilities">
                    <h3 className="font-semibold">
                      {t("kitAbilities")} ({localized(kitDef.name, kitDef.name_en, locale)})
                    </h3>
                    <ul className="mt-1 list-inside list-disc text-xs">
                      {kitDef.abilities.map((a, i) => (
                        <li key={i}>
                          <span className="font-medium">
                            {localized(a.name, a.name_en, locale)}
                          </span>
                          {" — "}
                          {localized(a.description, a.description_en, locale)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
          </div>
        </section>
      );
    },

    thiefSkills: () => {
      if (!hasThiefSkills(activeClasses.map((cc) => cc.class_id as ClassId))) return null;
      return (
        <section className="mb-4" data-testid="print-section-thief">
          <h2 className="mb-2 border-b border-gray-400 font-serif text-lg font-bold">
            {t("thiefSkills")}
          </h2>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            {[
              { label: t("locks"), value: character.thief_pick_locks },
              { label: t("traps"), value: character.thief_find_traps },
              { label: t("silent"), value: character.thief_move_silently },
              { label: t("hide"), value: character.thief_hide_shadows },
              { label: t("climb"), value: character.thief_climb_walls },
              { label: t("noise"), value: character.thief_detect_noise },
              { label: t("readLang"), value: character.thief_read_languages },
              {
                label: t("backstab"),
                value: `x${getBackstabMultiplier(activeClasses.find((cc) => cc.class_id === "thief" || cc.class_id === "bard")?.level ?? 1)}`,
              },
            ].map(({ label, value }) => (
              <div key={label} className="rounded border border-gray-300 p-2">
                <div className="text-xs text-gray-500">{label}</div>
                <div className="font-mono text-lg font-bold">
                  {typeof value === "number" ? `${value}%` : value}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    },

    acBreakdown: () => (
      <section className="mb-4" data-testid="print-section-ac-breakdown">
        <h2 className="mb-2 border-b border-gray-400 font-serif text-lg font-bold">
          {t("acBreakdown")}
        </h2>
        {(() => {
          const equippedArmorItem = equipment.find(
            (e) => e.armor && e.equipped && !isShieldItem(e.armor.name)
          );
          const shieldEquipped = equipment.some(
            (e) => e.armor && e.equipped && isShieldItem(e.armor.name)
          );
          const finalAC = calculateAC({
            equippedArmorAC: equippedArmorItem?.armor?.ac ?? null,
            shieldEquipped,
            dexDefenseAdj: dexMods.defensiveAdj,
            classGroups,
            encumbrance: encumbranceLevel,
            ignoreEncumbrance: character.ignore_encumbrance,
            isMagicalProtection: equippedArmorItem?.armor?.is_magical_protection ?? false,
          });
          return (
            <div
              className="grid grid-cols-5 gap-2 text-center text-sm"
              data-testid="print-ac-breakdown-grid"
            >
              <div className="rounded border border-gray-300 p-2">
                <div className="text-xs text-gray-500">{t("base")}</div>
                <div className="font-mono text-lg font-bold" data-testid="print-ac-base">
                  10
                </div>
              </div>
              <div className="rounded border border-gray-300 p-2">
                <div className="text-xs text-gray-500">{t("acArmor")}</div>
                <div className="font-mono text-lg font-bold" data-testid="print-ac-armor">
                  {equippedArmorItem ? `${-(10 - equippedArmorItem.armor!.ac)}` : "—"}
                </div>
                {equippedArmorItem && (
                  <div className="text-[9px] text-gray-400 truncate">
                    {localized(
                      equippedArmorItem.armor!.name,
                      equippedArmorItem.armor!.name_en,
                      locale
                    )}
                  </div>
                )}
              </div>
              <div className="rounded border border-gray-300 p-2">
                <div className="text-xs text-gray-500">{t("acShield")}</div>
                <div className="font-mono text-lg font-bold" data-testid="print-ac-shield">
                  {shieldEquipped ? "-1" : "—"}
                </div>
              </div>
              <div className="rounded border border-gray-300 p-2">
                <div className="text-xs text-gray-500">{t("acDex")}</div>
                <div className="font-mono text-lg font-bold" data-testid="print-ac-dex">
                  {dexMods.defensiveAdj !== 0
                    ? `${dexMods.defensiveAdj >= 0 ? "+" : ""}${dexMods.defensiveAdj}`
                    : "—"}
                </div>
              </div>
              <div className="rounded border border-gray-400 p-2">
                <div className="text-xs text-gray-500">{t("acFinal")}</div>
                <div className="font-mono text-lg font-bold" data-testid="print-ac-final">
                  {finalAC}
                </div>
              </div>
            </div>
          );
        })()}
      </section>
    ),

    weapons: () => {
      if (equipment.filter((e) => e.weapon && e.equipped).length === 0) return null;
      return (
        <section className="mb-4" data-testid="print-section-weapons">
          <h2 className="mb-2 border-b border-gray-400 font-serif text-lg font-bold">
            {t("weaponsTitle")}
          </h2>
          <table className="w-full text-sm" data-testid="print-weapons-table">
            <thead>
              <tr className="border-b border-gray-300 text-left text-xs">
                <th className="py-1">{t("name")}</th>
                <th className="py-1 text-center">{t("thac0Melee")}</th>
                <th className="py-1 text-center">{t("thac0Ranged")}</th>
                <th className="py-1 text-center">{t("damageSM")}</th>
                <th className="py-1 text-center">{t("damageL")}</th>
                <th className="py-1 text-center">{t("speed")}</th>
                <th className="py-1 text-center">{t("range")}</th>
                <th className="py-1 text-center">{t("attacksPerRound")}</th>
              </tr>
            </thead>
            <tbody>
              {equipment
                .filter((e) => e.weapon && e.equipped)
                .map((e) => {
                  const weapon = e.weapon!;
                  const matchingProf = findWeaponProf(
                    weaponProficiencies,
                    weapon.name,
                    weapon.name_en
                  );
                  const isProficient = !!matchingProf;
                  const isSpecialized = matchingProf?.specialization ?? false;
                  const weaponClassGroup =
                    activeClasses.length > 0
                      ? (CLASSES[activeClasses[0].class_id as ClassId]?.group ?? "warrior")
                      : "warrior";
                  const weaponLevel = activeClasses[0]?.level ?? 1;
                  const weaponApr = getAttacksPerRound(
                    weaponClassGroup,
                    weaponLevel,
                    isSpecialized
                  );
                  const penalty = isProficient
                    ? 0
                    : getNonproficiencyPenalty(
                        activeClasses.length > 0
                          ? (CLASSES[activeClasses[0].class_id as ClassId]?.group ?? "warrior")
                          : "warrior"
                      );
                  const hitBonus = e.hit_bonus ?? 0;
                  const dmgBonus = e.damage_bonus ?? 0;
                  const weaponThac0 = getAdjustedWeaponThac0(
                    thac0,
                    strMods.hitAdj,
                    dexMods.missileAdj,
                    weapon.weapon_type,
                    penalty,
                    hitBonus
                  );
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-gray-200"
                      data-testid={`print-weapon-row-${e.id}`}
                    >
                      <td className="py-1" data-testid={`print-weapon-name-${e.id}`}>
                        {localized(weapon.name, weapon.name_en, locale)}
                        {hitBonus > 0 && (
                          <span className="text-xs text-gray-500"> +{hitBonus}</span>
                        )}
                        {!isProficient && <span className="text-xs text-gray-400"> *</span>}
                      </td>
                      <td
                        className="py-1 text-center font-mono"
                        data-testid={`print-weapon-thac0-melee-${e.id}`}
                      >
                        {weaponThac0.melee}
                      </td>
                      <td
                        className="py-1 text-center font-mono"
                        data-testid={`print-weapon-thac0-ranged-${e.id}`}
                      >
                        {weaponThac0.ranged !== null ? weaponThac0.ranged : "—"}
                      </td>
                      <td
                        className="py-1 text-center font-mono"
                        data-testid={`print-weapon-damage-sm-${e.id}`}
                      >
                        {formatDamageWithBonus(weapon.damage_sm, strMods.dmgAdj, dmgBonus)}
                      </td>
                      <td
                        className="py-1 text-center font-mono"
                        data-testid={`print-weapon-damage-l-${e.id}`}
                      >
                        {formatDamageWithBonus(weapon.damage_l, strMods.dmgAdj, dmgBonus)}
                      </td>
                      <td
                        className="py-1 text-center font-mono"
                        data-testid={`print-weapon-speed-${e.id}`}
                      >
                        {weapon.speed}
                      </td>
                      <td
                        className="py-1 text-center font-mono text-xs"
                        data-testid={`print-weapon-range-${e.id}`}
                      >
                        {weapon.weapon_type !== "melee" &&
                        weapon.range_short != null &&
                        weapon.range_medium != null &&
                        weapon.range_long != null
                          ? `${feetToMeters(weapon.range_short)}/${feetToMeters(weapon.range_medium)}/${feetToMeters(weapon.range_long)}`
                          : "—"}
                      </td>
                      <td
                        className="py-1 text-center font-mono"
                        data-testid={`print-weapon-apr-${e.id}`}
                      >
                        {weaponApr}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </section>
      );
    },

    equipment: () => {
      if (equipment.filter((e) => e.armor || !e.equipped).length === 0) return null;
      return (
        <section className="mb-4" data-testid="print-section-equipment">
          <h2 className="mb-2 border-b border-gray-400 font-serif text-lg font-bold">
            {t("armorTitle")}
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-left text-xs">
                <th className="py-1">{t("itemLabel")}</th>
                <th className="py-1 text-center">{t("typeLabel")}</th>
                <th className="py-1 text-center">{t("weight")}</th>
                <th className="py-1 text-center">{t("statusLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {equipment
                .filter((e) => e.armor || (e.weapon && !e.equipped))
                .map((e) => (
                  <tr key={e.id} className="border-b border-gray-200">
                    <td className="py-1">
                      {e.weapon
                        ? localized(e.weapon.name, e.weapon.name_en, locale)
                        : e.armor
                          ? localized(e.armor.name, e.armor.name_en, locale)
                          : "—"}
                    </td>
                    <td className="py-1 text-center text-xs">
                      {e.weapon ? t("weaponType") : t("armorType")}
                    </td>
                    <td className="py-1 text-center text-xs">
                      {lbsToKg(e.weapon?.weight ?? e.armor?.weight ?? 0)} kg
                    </td>
                    <td className="py-1 text-center text-xs">
                      {e.equipped ? t("equippedStatus") : t("inventoryStatus")}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      );
    },

    spells: () => {
      const isPriest = isPriestCaster(character.class_id as ClassId);
      const priestSpells = priestAvailableSpells;

      // Priests: show all available sphere spells
      if (isPriest && priestSpells.length > 0) {
        const byLevel: Record<number, SpellRow[]> = {};
        for (const s of priestSpells) {
          if (!byLevel[s.level]) byLevel[s.level] = [];
          byLevel[s.level].push(s);
        }
        const levels = Object.keys(byLevel)
          .map(Number)
          .sort((a, b) => a - b);
        return (
          <section className="mb-4" data-testid="print-section-spells">
            <h2 className="mb-2 border-b border-gray-400 font-serif text-lg font-bold">
              {t("spellsKnown")}
            </h2>
            {levels.map((lvl) => (
              <div key={lvl} className="mb-3">
                <h3 className="mb-1 text-sm font-bold">
                  {t("spellLevel", { level: lvl })} ({byLevel[lvl].length})
                </h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-300 text-left">
                      <th className="py-0.5">{t("spellName")}</th>
                      <th className="py-0.5 text-center">{t("castTime")}</th>
                      <th className="py-0.5 text-center">{t("range")}</th>
                      <th className="py-0.5 text-center">{t("areaOfEffect")}</th>
                      <th className="py-0.5 text-center">{t("components")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byLevel[lvl].map((spell) => (
                      <tr key={spell.id} className="border-b border-gray-200">
                        <td className="py-0.5">{localized(spell.name, spell.name_en, locale)}</td>
                        <td className="py-0.5 text-center">{spell.casting_time || "—"}</td>
                        <td className="py-0.5 text-center">{spellRange(spell) || "—"}</td>
                        <td className="py-0.5 text-center">{spellArea(spell) || "—"}</td>
                        <td className="py-0.5 text-center">
                          {(spell.components ?? []).join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </section>
        );
      }

      // Wizard: show learned spells (from character_spells)
      if (spells.length === 0) return null;
      return (
        <section className="mb-4" data-testid="print-section-spells">
          <h2 className="mb-2 border-b border-gray-400 font-serif text-lg font-bold">
            {t("spellsKnown")}
          </h2>
          {sortedLevels.map((lvl) => (
            <div key={lvl} className="mb-3">
              <h3 className="mb-1 text-sm font-bold">{t("spellLevel", { level: lvl })}</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-300 text-left">
                    <th className="py-0.5">{t("spellName")}</th>
                    <th className="py-0.5 text-center">{t("castTime")}</th>
                    <th className="py-0.5 text-center">{t("range")}</th>
                    <th className="py-0.5 text-center">{t("areaOfEffect")}</th>
                    <th className="py-0.5 text-center">{t("components")}</th>
                  </tr>
                </thead>
                <tbody>
                  {spellsByLevel[lvl].map((cs) => (
                    <tr key={cs.spell.id} className="border-b border-gray-200">
                      <td className={`py-0.5 ${cs.prepared ? "font-semibold" : ""}`}>
                        {localized(cs.spell.name, cs.spell.name_en, locale)}
                        {cs.prepared && <span className="ml-1 text-gray-500">★</span>}
                      </td>
                      <td className="py-0.5 text-center">{cs.spell.casting_time || "—"}</td>
                      <td className="py-0.5 text-center">{spellRange(cs.spell) || "—"}</td>
                      <td className="py-0.5 text-center">{spellArea(cs.spell) || "—"}</td>
                      <td className="py-0.5 text-center">
                        {(cs.spell.components ?? []).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      );
    },

    spellsMemorized: () => {
      if (preparedSpells.length === 0) return null;
      return (
        <section className="mb-4" data-testid="print-section-spells-memorized">
          <h2 className="mb-2 border-b border-gray-400 font-serif text-lg font-bold">
            {t("spellsMemorized")}
          </h2>
          {sortedLevels
            .filter((lvl) => spellsByLevel[lvl].some((cs) => cs.prepared))
            .map((lvl) => (
              <div key={lvl} className="mb-2">
                <h3 className="text-sm font-bold">{t("spellLevel", { level: lvl })}</h3>
                <ul className="ml-4 list-disc text-sm">
                  {spellsByLevel[lvl]
                    .filter((cs) => cs.prepared)
                    .map((cs) => (
                      <li key={cs.spell.id}>
                        {localized(cs.spell.name, cs.spell.name_en, locale)}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
        </section>
      );
    },

    proficiencies: () => {
      if (
        !(
          weaponProficiencies.length > 0 ||
          nonweaponProficiencies.length > 0 ||
          fightingStyles.length > 0
        )
      )
        return null;
      return (
        <section className="mb-4" data-testid="print-section-proficiencies">
          <h2 className="mb-2 border-b border-gray-400 font-serif text-lg font-bold">
            {t("proficiencies")}
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {weaponProficiencies.length > 0 && (
              <div>
                <h3 className="font-semibold">{t("weaponProf")}</h3>
                <ul className="mt-1 list-inside list-disc text-xs">
                  {weaponProficiencies.map((wp) => (
                    <li key={wp.id}>
                      {wp.weapon_name}
                      {wp.specialization && ` (${t("specialization")})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {fightingStyles.length > 0 && (
              <div>
                <h3 className="font-semibold">{t("fightingStyles")}</h3>
                <ul className="mt-1 list-inside list-disc text-xs">
                  {fightingStyles.map((fs) => {
                    const style = getFightingStyle(fs.style_id);
                    if (!style) return null;
                    const benefit = style.benefits.find((b) => b.slots === fs.slots_invested);
                    return (
                      <li key={fs.id}>
                        {localized(style.name, style.name_en, locale)}
                        {benefit &&
                          ` — ${localized(benefit.description, benefit.description_en, locale)}`}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {nonweaponProficiencies.length > 0 && (
              <div>
                <h3 className="font-semibold">{t("nwProf")}</h3>
                <ul className="mt-1 list-inside list-disc text-xs">
                  {nonweaponProficiencies.map((nwp) => (
                    <li key={nwp.id}>
                      {localized(nwp.proficiency.name, nwp.proficiency.name_en, locale)} (
                      {nwp.proficiency.ability}{" "}
                      {nwp.proficiency.modifier >= 0
                        ? `+${nwp.proficiency.modifier}`
                        : nwp.proficiency.modifier}
                      )
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {languages.length > 0 && (
            <div className="mt-2">
              <h3 className="font-semibold text-sm">{t("languagesLabel")}</h3>
              <p className="text-xs">{languages.map((l) => l.language_name).join(", ")}</p>
            </div>
          )}
        </section>
      );
    },

    notes: () => {
      if (!character.notes) return null;
      return (
        <section className="mb-4" data-testid="print-section-notes">
          <h2 className="mb-2 border-b border-gray-400 font-serif text-lg font-bold">
            {t("notes")}
          </h2>
          <p className="whitespace-pre-wrap text-sm">{character.notes}</p>
        </section>
      );
    },
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      {toolbar}

      <div
        className="mx-auto max-w-[210mm] bg-white p-6 text-black print:m-0 print:max-w-none print:p-4"
        data-testid="print-sheet"
      >
        {preferences.sections
          .filter((s) => s.visible)
          .map((s) => (
            <Fragment key={s.id}>{sectionRenderers[s.id]()}</Fragment>
          ))}

        {/* ── Footer ────────────────────────────────────────────── */}
        <footer className="mt-6 flex items-center justify-between border-t border-gray-300 pt-2 text-xs text-gray-400">
          <span>{t("footer")}</span>
          <span>
            {t("createdAt")}{" "}
            {new Date(character.created_at).toLocaleDateString(undefined, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        </footer>
      </div>
    </>
  );
}

// ── Container (owns toolbar + preferences) ───────────────────────
export function PrintSheetContainer({
  character,
  characterClasses,
  equipment,
  spells,
  weaponProficiencies,
  nonweaponProficiencies,
  languages,
  fightingStyles,
  priestAvailableSpells = [],
}: PrintSheetProps) {
  const t = useTranslations("print");
  const locale = useLocale();
  const { preferences, moveSection, toggleSection, resetPreferences } = usePrintPreferences(
    character.id
  );

  const activeClasses = characterClasses.filter((cc) => cc.is_active);
  const classIds = activeClasses.map((cc) => cc.class_id as ClassId);
  const race = character.race_id ? RACES[character.race_id as keyof typeof RACES] : null;

  const hasData = computeSectionDataPresence({
    character,
    characterClasses,
    equipment,
    spells,
    weaponProficiencies,
    nonweaponProficiencies,
    languages,
    fightingStyles,
    hasThiefSkills: hasThiefSkills(classIds),
    hasRacialClassAbilities: !!(
      (race?.racialAbilities?.length ?? 0) > 0 || activeClasses.length > 0
    ),
    hasSaves: activeClasses.length > 0,
  });

  const toolbar = (
    <div className="print:hidden">
      <div className="flex justify-center gap-4 p-4">
        <button
          onClick={() => window.print()}
          className="rounded bg-gray-800 px-6 py-2 text-white hover:bg-gray-700"
          data-testid="print-trigger-button"
        >
          {t("print")}
        </button>
        <button
          onClick={async () => {
            const { generateCharacterDocx } = await import("@/lib/utils/docx-export");
            const { saveAs } = await import("file-saver");
            const blob = await generateCharacterDocx({
              character,
              characterClasses,
              equipment,
              spells,
              weaponProficiencies,
              nonweaponProficiencies,
              languages,
              fightingStyles,
              priestAvailableSpells,
              locale,
              preferences,
            });
            saveAs(blob, `${character.name}.docx`);
          }}
          className="rounded bg-gray-800 px-6 py-2 text-white hover:bg-gray-700"
          data-testid="export-word-button"
        >
          {t("exportWord")}
        </button>
        <button
          onClick={() => window.history.back()}
          className="rounded border border-gray-400 px-6 py-2 hover:bg-gray-100"
        >
          {t("back")}
        </button>
      </div>
      <PrintCustomizationPanel
        preferences={preferences}
        hasData={hasData}
        onToggle={toggleSection}
        onMove={moveSection}
        onReset={resetPreferences}
      />
    </div>
  );

  return (
    <PrintSheet
      character={character}
      characterClasses={characterClasses}
      equipment={equipment}
      spells={spells}
      weaponProficiencies={weaponProficiencies}
      nonweaponProficiencies={nonweaponProficiencies}
      languages={languages}
      fightingStyles={fightingStyles}
      priestAvailableSpells={priestAvailableSpells}
      preferences={preferences}
      toolbar={toolbar}
    />
  );
}
