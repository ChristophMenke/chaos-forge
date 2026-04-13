"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { GlassCard } from "@/components/glass-card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  SavingThrows,
  StrengthModifiers,
  DexterityModifiers,
  ConstitutionModifiers,
  IntelligenceModifiers,
  WisdomModifiers,
  CharismaModifiers,
} from "@/lib/rules/types";
import type { CharacterRow, CharacterNWPWithDetails } from "@/lib/supabase/types";
import { applyThiefPenalty, scaleSubStat } from "@/lib/rules/epic-items";
import type { EpicEffects } from "@/lib/rules/epic-items";
import type { ThiefSkillBonuses } from "@/lib/rules/magic-items";
import { localized } from "@/lib/utils/localize";

type StatKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

interface PlayChecksPanelProps {
  saves: SavingThrows;
  character: CharacterRow;
  strMods: StrengthModifiers;
  dexMods: DexterityModifiers;
  conMods: ConstitutionModifiers;
  intMods: IntelligenceModifiers;
  wisMods: WisdomModifiers;
  chaMods: CharismaModifiers;
  showThiefSkills: boolean;
  nonweaponProficiencies: CharacterNWPWithDetails[];
  epicEffects?: EpicEffects;
  poisonSavePenalty?: number;
  magicPerceptionBonus?: number;
  magicSaveBonuses?: Partial<SavingThrows>;
  magicThiefBonuses?: ThiefSkillBonuses;
  magicStatOverrides?: Partial<Record<StatKey, number>>;
  magicStatBonuses?: Partial<Record<StatKey, number>>;
}

function PlayChecksPanelInner({
  saves,
  character,
  strMods: _strMods,
  dexMods: _dexMods,
  conMods: _conMods,
  intMods: _intMods,
  wisMods,
  chaMods: _chaMods,
  showThiefSkills,
  nonweaponProficiencies,
  epicEffects,
  poisonSavePenalty = 0,
  magicPerceptionBonus: _magicPerceptionBonus = 0,
  magicSaveBonuses: _magicSaveBonuses = {},
  magicThiefBonuses = {},
  magicStatOverrides = {},
  magicStatBonuses = {},
}: PlayChecksPanelProps) {
  const t = useTranslations("playMode");
  const te = useTranslations("epic");
  const ts = useTranslations("sheet");
  const locale = useLocale();

  const defaultEpic: EpicEffects = useMemo(
    () => ({
      statOverrides: {},
      forceStatOverrides: {},
      miscEffects: [],
      thiefPenalty: 0,
      thiefDisabled: false,
      spellFailure: 0,
      wildMagic: 0,
      perceptionBonus: 0,
      acBonus: 0,
      temporaryStrOverride: null,
      shapeshiftForms: [],
      specialAttacks: [],
      passiveAbilities: [],
      overclockAbility: null,
      spellAbilities: [],
    }),
    []
  );
  const epic = epicEffects ?? defaultEpic;
  const eo = epic.statOverrides;
  const fo = epic.forceStatOverrides;
  const mo = magicStatOverrides;
  const mb = magicStatBonuses;

  // Resolve effective stat: force ?? max(base, epicOverride, magicOverride) + magicBonus.
  // Force-overrides (z.B. Kondensator) ersetzen den Base-Wert unbedingt.
  // Memoized so that abilities and nwpChecks can reference it in their dep arrays
  // instead of inlining a duplicate resolver body.
  const eff = useCallback(
    (base: number, stat: StatKey): number => {
      const resolved = fo[stat] ?? Math.max(base, eo[stat] ?? 0, mo[stat] ?? 0);
      return resolved + (mb[stat] ?? 0);
    },
    [fo, eo, mo, mb]
  );

  // Is a stat modified by any override or bonus?
  const isModified = useCallback(
    (base: number, stat: StatKey): boolean => eff(base, stat) !== base,
    [eff]
  );

  // Helper: scale sub-stat if main stat is overridden by any source
  const sub = useCallback(
    (base: number, baseSub: number | null, stat: StatKey): number | null => {
      if (baseSub == null) return null;
      const effective = eff(base, stat);
      if (effective !== base) return scaleSubStat(base, baseSub, effective);
      return baseSub;
    },
    [eff]
  );

  // Ability scores with names (using effective stats from epic + magic overrides + bonuses)
  const abilities = useMemo(
    () => [
      {
        name: "STR",
        score: eff(character.str, "str"),
        modified: isModified(character.str, "str"),
        subScores: [
          character.str_muscle != null
            ? { name: ts("muscle"), score: sub(character.str, character.str_muscle, "str") }
            : null,
          character.str_stamina != null
            ? { name: ts("stamina"), score: sub(character.str, character.str_stamina, "str") }
            : null,
        ].filter(Boolean),
      },
      {
        name: "DEX",
        score: eff(character.dex, "dex"),
        modified: isModified(character.dex, "dex"),
        subScores: [
          character.dex_aim != null
            ? { name: ts("aim"), score: sub(character.dex, character.dex_aim, "dex") }
            : null,
          character.dex_balance != null
            ? { name: ts("balance"), score: sub(character.dex, character.dex_balance, "dex") }
            : null,
        ].filter(Boolean),
      },
      {
        name: "CON",
        score: eff(character.con, "con"),
        modified: isModified(character.con, "con"),
        subScores: [
          character.con_health != null
            ? { name: ts("health"), score: sub(character.con, character.con_health, "con") }
            : null,
          character.con_fitness != null
            ? { name: ts("fitness"), score: sub(character.con, character.con_fitness, "con") }
            : null,
        ].filter(Boolean),
      },
      {
        name: "INT",
        score: eff(character.int, "int"),
        modified: isModified(character.int, "int"),
        subScores: [
          character.int_knowledge != null
            ? { name: ts("knowledge"), score: sub(character.int, character.int_knowledge, "int") }
            : null,
          character.int_reason != null
            ? { name: ts("reason"), score: sub(character.int, character.int_reason, "int") }
            : null,
        ].filter(Boolean),
      },
      {
        name: "WIS",
        score: eff(character.wis, "wis"),
        modified: isModified(character.wis, "wis"),
        subScores: [
          character.wis_intuition != null
            ? { name: ts("intuition"), score: sub(character.wis, character.wis_intuition, "wis") }
            : null,
          character.wis_willpower != null
            ? { name: ts("willpower"), score: sub(character.wis, character.wis_willpower, "wis") }
            : null,
        ].filter(Boolean),
      },
      {
        name: "CHA",
        score: eff(character.cha, "cha"),
        modified: isModified(character.cha, "cha"),
        subScores: [
          character.cha_leadership != null
            ? {
                name: ts("leadership"),
                score: sub(character.cha, character.cha_leadership, "cha"),
              }
            : null,
          character.cha_appearance != null
            ? {
                name: ts("appearance"),
                score: sub(character.cha, character.cha_appearance, "cha"),
              }
            : null,
        ].filter(Boolean),
      },
    ],
    [character, ts, eff, isModified, sub]
  );

  // Thief skills (epic penalties + magic item bonuses)
  const mt = magicThiefBonuses;
  const thiefSkills = useMemo(() => {
    if (!showThiefSkills) return [];
    return [
      {
        name: ts("pickLocks"),
        base: character.thief_pick_locks,
        value: applyThiefPenalty(character.thief_pick_locks, epic) + (mt.openLocks ?? 0),
      },
      {
        name: ts("findTraps"),
        base: character.thief_find_traps,
        value: applyThiefPenalty(character.thief_find_traps, epic) + (mt.findTraps ?? 0),
      },
      {
        name: ts("moveSilently"),
        base: character.thief_move_silently,
        value: applyThiefPenalty(character.thief_move_silently, epic) + (mt.moveSilently ?? 0),
      },
      {
        name: ts("hideInShadows"),
        base: character.thief_hide_shadows,
        value: applyThiefPenalty(character.thief_hide_shadows, epic) + (mt.hideInShadows ?? 0),
      },
      {
        name: ts("climbWalls"),
        base: character.thief_climb_walls,
        value: applyThiefPenalty(character.thief_climb_walls, epic) + (mt.climbWalls ?? 0),
      },
      {
        name: ts("detectNoise"),
        base: character.thief_detect_noise,
        value: applyThiefPenalty(character.thief_detect_noise, epic) + (mt.detectNoise ?? 0),
      },
      {
        name: ts("readLanguages"),
        base: character.thief_read_languages,
        value: applyThiefPenalty(character.thief_read_languages, epic) + (mt.readLanguages ?? 0),
      },
    ];
  }, [showThiefSkills, character, ts, epic, mt]);

  // NWP checks with target numbers (using effective stats from epic + magic overrides + bonuses).
  const nwpChecks = useMemo(() => {
    const abilityMap: Record<string, number> = {
      str: eff(character.str, "str"),
      dex: eff(character.dex, "dex"),
      con: eff(character.con, "con"),
      int: eff(character.int, "int"),
      wis: eff(character.wis, "wis"),
      cha: eff(character.cha, "cha"),
    };
    return nonweaponProficiencies.map((nwp) => {
      const ability = nwp.proficiency.ability.toLowerCase();
      const baseScore = abilityMap[ability] ?? 10;
      const target = baseScore + nwp.proficiency.modifier;
      return {
        name: localized(nwp.proficiency.name, nwp.proficiency.name_en, locale),
        ability: nwp.proficiency.ability.toUpperCase(),
        baseScore,
        modifier: nwp.proficiency.modifier,
        target,
        description: nwp.proficiency.description
          ? localized(nwp.proficiency.description, nwp.proficiency.description_en, locale)
          : null,
      };
    });
  }, [nonweaponProficiencies, character, locale, eff]);

  const [expandedNwp, setExpandedNwp] = useState<string | null>(null);

  return (
    <GlassCard hover={false} data-testid="play-checks-panel">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("checks")}
        </h3>
        {epic.perceptionBonus > 0 && (
          <div
            className="rounded-md border border-purple-500/50 bg-purple-500/5 px-2 py-1 text-[10px] md:text-xs text-purple-400"
            data-testid="play-perception-bonus"
          >
            {t("perceptionBonus", { bonus: epic.perceptionBonus })}
          </div>
        )}
      </div>

      {/* Epic Thief Warnings */}
      {epic.thiefDisabled && showThiefSkills && (
        <div
          className="mb-3 rounded-lg border border-red-500/50 bg-red-500/10 p-2 text-xs text-red-400"
          data-testid="play-thief-disabled-warning"
        >
          {te("thiefDisabled")}
        </div>
      )}
      {epic.thiefPenalty > 0 && !epic.thiefDisabled && showThiefSkills && (
        <div
          className="mb-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-2 text-xs text-amber-400"
          data-testid="play-thief-penalty-warning"
        >
          {te("thiefPenalty", { penalty: `-${epic.thiefPenalty}` })}
        </div>
      )}

      {/* Saving Throws */}
      <div className="mb-4" data-testid="play-saving-throws">
        <Tooltip>
          <TooltipTrigger
            render={<h4 />}
            className="mb-1.5 cursor-help text-xs font-medium text-muted-foreground"
          >
            {t("savingThrows")}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">{t("savingThrowsTooltip")}</p>
          </TooltipContent>
        </Tooltip>
        <div className="grid grid-cols-4 gap-1 text-center">
          {[
            {
              key: "paralyzation",
              label: t("paralyzation"),
              value: saves.paralyzation,
              penalty: poisonSavePenalty,
            },
            {
              key: "poison",
              label: t("poison"),
              value: saves.paralyzation,
              penalty: poisonSavePenalty,
            },
            { key: "deathMagic", label: t("deathMagic"), value: saves.paralyzation, penalty: 0 },
            {
              key: "rodStaffWand",
              label: `${t("rod")}/${t("staff")}`,
              value: saves.rod,
              penalty: 0,
            },
            {
              key: "petrification",
              label: t("petrification"),
              value: saves.petrification,
              penalty: 0,
            },
            { key: "polymorph", label: t("polymorph"), value: saves.petrification, penalty: 0 },
            { key: "breath", label: t("breath"), value: saves.breath, penalty: 0 },
            { key: "spell", label: t("spell"), value: saves.spell, penalty: 0 },
          ].map((save) => {
            const effective = save.value + save.penalty;
            const hasPenalty = save.penalty > 0;
            return (
              <div
                key={save.key}
                className={`rounded-md border px-1 py-1.5 ${hasPenalty ? "border-amber-500/50 bg-amber-500/5" : "border-border"}`}
                data-testid={`play-save-${save.key}`}
              >
                <div className="truncate text-[9px] md:text-xs text-muted-foreground">
                  {save.label}
                </div>
                <div
                  className={`font-mono text-lg font-bold ${hasPenalty ? "text-amber-400" : ""}`}
                >
                  {effective}
                </div>
                {hasPenalty && (
                  <div className="text-[8px] md:text-[10px] text-amber-400/80">+{save.penalty}</div>
                )}
              </div>
            );
          })}
        </div>
        {wisMods.magicalDefenseAdj !== 0 && (
          <div className="mt-1 text-[10px] md:text-xs text-muted-foreground">
            {t("wisMagicalDefense")}: {wisMods.magicalDefenseAdj > 0 ? "+" : ""}
            {wisMods.magicalDefenseAdj}
          </div>
        )}
      </div>

      {/* Ability Checks */}
      <div className="mb-4" data-testid="play-ability-checks">
        <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">{t("abilityChecks")}</h4>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {abilities.map((ab) => (
            <div
              key={ab.name}
              className={`rounded-md border px-2 py-1.5 text-center ${ab.modified ? "border-purple-500/50 bg-purple-500/5" : "border-border"}`}
            >
              <div className="text-[10px] md:text-xs font-medium text-muted-foreground">
                {ab.name}
              </div>
              <div
                className={`font-mono text-lg font-bold ${ab.modified ? "text-purple-400" : ""}`}
              >
                {ab.score}
              </div>
              {ab.subScores.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  {ab.subScores.map(
                    (sub) =>
                      sub && (
                        <div key={sub.name} className="text-[9px] md:text-xs text-muted-foreground">
                          {sub.name}: {sub.score}
                        </div>
                      )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Perception Check (house rule: (INT + WIS) / 2 rounded down) */}
      <div className="mb-4" data-testid="play-perception">
        <Tooltip>
          <TooltipTrigger
            render={<h4 />}
            className="mb-1.5 cursor-help text-xs font-medium text-muted-foreground"
          >
            {t("perception")}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">{t("perceptionTooltip")}</p>
          </TooltipContent>
        </Tooltip>
        <div
          className="rounded-md border border-border px-3 py-1.5 text-center"
          style={{ width: "fit-content" }}
        >
          <div className="text-[10px] md:text-xs text-muted-foreground">
            {t("perceptionFormula")}
          </div>
          <div className="font-mono text-lg font-bold">
            {Math.floor((eff(character.int, "int") + eff(character.wis, "wis")) / 2)}
          </div>
        </div>
      </div>

      {/* Thief Skills */}
      {showThiefSkills && thiefSkills.length > 0 && (
        <div className="mb-4" data-testid="play-thief-skills">
          <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">{t("thiefSkills")}</h4>
          <div className="grid grid-cols-2 gap-1">
            {thiefSkills.map((skill) => (
              <div
                key={skill.name}
                className={`flex items-center justify-between rounded-md border px-2 py-1 ${epic.thiefDisabled ? "border-red-500/30 opacity-50" : skill.value !== skill.base ? "border-amber-500/30" : "border-border"}`}
              >
                <span className="text-xs">{skill.name}</span>
                <span
                  className={`font-mono text-sm font-bold ${epic.thiefDisabled ? "text-red-400 line-through" : skill.value !== skill.base ? "text-amber-400" : ""}`}
                >
                  {skill.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NWP Checks */}
      {nwpChecks.length > 0 && (
        <div data-testid="play-nwp-checks">
          <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">{t("nwpChecks")}</h4>
          <span id="nwp-toggle-hint" className="sr-only">
            {t("toggleDescription")}
          </span>
          <div className="space-y-1">
            {nwpChecks.map((nwp) => (
              <div
                key={nwp.name}
                role={nwp.description ? "button" : undefined}
                tabIndex={nwp.description ? 0 : undefined}
                aria-expanded={nwp.description ? expandedNwp === nwp.name : undefined}
                aria-describedby={nwp.description ? "nwp-toggle-hint" : undefined}
                className={`rounded-md border border-border px-2 py-1 ${nwp.description ? "cursor-pointer" : ""}`}
                onClick={
                  nwp.description
                    ? () => setExpandedNwp(expandedNwp === nwp.name ? null : nwp.name)
                    : undefined
                }
                onKeyDown={
                  nwp.description
                    ? (e: React.KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setExpandedNwp(expandedNwp === nwp.name ? null : nwp.name);
                        }
                      }
                    : undefined
                }
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs">{nwp.name}</span>
                    <span className="ml-1 text-[10px] md:text-xs text-muted-foreground">
                      ({nwp.ability} {nwp.baseScore}
                      {nwp.modifier !== 0 ? ` ${nwp.modifier > 0 ? "+" : ""}${nwp.modifier}` : ""})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] md:text-xs text-muted-foreground">
                      {t("target")}:
                    </span>
                    <span className="font-mono text-sm font-bold">{nwp.target}</span>
                  </div>
                </div>
                {expandedNwp === nwp.name && nwp.description && (
                  <p className="mt-1 pb-0.5 text-[10px] md:text-xs text-muted-foreground">
                    {nwp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {nonweaponProficiencies.length === 0 && !showThiefSkills && (
        <p className="text-sm text-muted-foreground">{t("noProficiencies")}</p>
      )}

      {/* Passive Epic Abilities */}
      {epic.passiveAbilities.length > 0 && (
        <div className="mt-3 border-t border-border pt-3" data-testid="play-passive-abilities">
          <p className="mb-2 text-sm font-medium text-muted-foreground">{t("passiveAbilities")}</p>
          <div className="flex flex-wrap gap-2">
            {epic.passiveAbilities.map((ability) => (
              <Badge
                key={ability}
                variant="outline"
                className="border-green-500/50 text-green-400"
                data-testid={`passive-${ability}`}
              >
                {t(`passive_${ability}`)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {epic.acBonus > 0 && (
        <div className="mt-3 border-t border-border pt-3" data-testid="play-ac-bonus">
          <Badge variant="outline" className="border-purple-500/50 text-purple-400">
            AC {t("epicAcBonus", { bonus: epic.acBonus })}
          </Badge>
        </div>
      )}
    </GlassCard>
  );
}

export const PlayChecksPanel = memo(PlayChecksPanelInner);
