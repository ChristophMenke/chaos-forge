"use client";

import { memo, useMemo, useState } from "react";
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
import { applyThiefPenalty } from "@/lib/rules/epic-items";
import type { EffectiveStats } from "@/lib/rules/effective-stats";
import { ABILITY_KEYS, SAVE_KEYS, type EffectSummary } from "@/lib/rules/temporary-effects";
import { formatModifier, signed } from "@/components/effects/effect-format";
import type { EpicEffects } from "@/lib/rules/epic-items";
import type { ThiefSkillBonuses } from "@/lib/rules/magic-items";
import { localized } from "@/lib/utils/localize";
import { getNwpCheckTarget } from "@/lib/rules/proficiencies";

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
  magicThiefBonuses?: ThiefSkillBonuses;
  /** Effective ability scores (items + temporary effects) from the shared resolver. */
  effective: EffectiveStats;
  /** Aggregated temporary effects (sources, conditional hints, check modifiers). */
  effectSummary: EffectSummary;
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
  magicThiefBonuses = {},
  effective,
  effectSummary,
}: PlayChecksPanelProps) {
  const tfx = useTranslations("effects");
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
      thiefBonuses: {},
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
      bonusSpellPoints: 0,
      hpToSpConversion: null,
    }),
    []
  );
  const epic = epicEffects ?? defaultEpic;
  // Ability scores with names (using effective stats from epic + magic overrides + bonuses)
  const abilities = useMemo(
    () => [
      {
        name: "STR",
        score: effective.values.str,
        modified: effective.modified.str,
        subScores: [
          character.str_muscle != null
            ? { name: ts("muscle"), score: effective.subs.str[0] }
            : null,
          character.str_stamina != null
            ? { name: ts("stamina"), score: effective.subs.str[1] }
            : null,
        ].filter(Boolean),
      },
      {
        name: "DEX",
        score: effective.values.dex,
        modified: effective.modified.dex,
        subScores: [
          character.dex_aim != null ? { name: ts("aim"), score: effective.subs.dex[0] } : null,
          character.dex_balance != null
            ? { name: ts("balance"), score: effective.subs.dex[1] }
            : null,
        ].filter(Boolean),
      },
      {
        name: "CON",
        score: effective.values.con,
        modified: effective.modified.con,
        subScores: [
          character.con_health != null
            ? { name: ts("health"), score: effective.subs.con[0] }
            : null,
          character.con_fitness != null
            ? { name: ts("fitness"), score: effective.subs.con[1] }
            : null,
        ].filter(Boolean),
      },
      {
        name: "INT",
        score: effective.values.int,
        modified: effective.modified.int,
        subScores: [
          character.int_knowledge != null
            ? { name: ts("knowledge"), score: effective.subs.int[0] }
            : null,
          character.int_reason != null
            ? { name: ts("reason"), score: effective.subs.int[1] }
            : null,
        ].filter(Boolean),
      },
      {
        name: "WIS",
        score: effective.values.wis,
        modified: effective.modified.wis,
        subScores: [
          character.wis_intuition != null
            ? { name: ts("intuition"), score: effective.subs.wis[0] }
            : null,
          character.wis_willpower != null
            ? { name: ts("willpower"), score: effective.subs.wis[1] }
            : null,
        ].filter(Boolean),
      },
      {
        name: "CHA",
        score: effective.values.cha,
        modified: effective.modified.cha,
        subScores: [
          character.cha_leadership != null
            ? {
                name: ts("leadership"),
                score: effective.subs.cha[0],
              }
            : null,
          character.cha_appearance != null
            ? {
                name: ts("appearance"),
                score: effective.subs.cha[1],
              }
            : null,
        ].filter(Boolean),
      },
    ],
    [character, ts, effective]
  );

  // Thief skills (epic penalties + magic item bonuses + epic bonuses)
  const mt = magicThiefBonuses;
  const et = epic.thiefBonuses;
  const thiefSkills = useMemo(() => {
    if (!showThiefSkills) return [];
    return [
      {
        name: ts("pickLocks"),
        base: character.thief_pick_locks,
        value:
          applyThiefPenalty(character.thief_pick_locks, epic) +
          (mt.openLocks ?? 0) +
          (et.openLocks ?? 0) +
          effectSummary.thiefSkills,
      },
      {
        name: ts("findTraps"),
        base: character.thief_find_traps,
        value:
          applyThiefPenalty(character.thief_find_traps, epic) +
          (mt.findTraps ?? 0) +
          (et.findTraps ?? 0) +
          effectSummary.thiefSkills,
      },
      {
        name: ts("moveSilently"),
        base: character.thief_move_silently,
        value:
          applyThiefPenalty(character.thief_move_silently, epic) +
          (mt.moveSilently ?? 0) +
          (et.moveSilently ?? 0) +
          effectSummary.thiefSkills,
      },
      {
        name: ts("hideInShadows"),
        base: character.thief_hide_shadows,
        value:
          applyThiefPenalty(character.thief_hide_shadows, epic) +
          (mt.hideInShadows ?? 0) +
          (et.hideInShadows ?? 0) +
          effectSummary.thiefSkills,
      },
      {
        name: ts("climbWalls"),
        base: character.thief_climb_walls,
        value:
          applyThiefPenalty(character.thief_climb_walls, epic) +
          (mt.climbWalls ?? 0) +
          (et.climbWalls ?? 0) +
          effectSummary.thiefSkills,
      },
      {
        name: ts("detectNoise"),
        base: character.thief_detect_noise,
        value:
          applyThiefPenalty(character.thief_detect_noise, epic) +
          (mt.detectNoise ?? 0) +
          (et.detectNoise ?? 0) +
          effectSummary.thiefSkills,
      },
      {
        name: ts("readLanguages"),
        base: character.thief_read_languages,
        value:
          applyThiefPenalty(character.thief_read_languages, epic) +
          (mt.readLanguages ?? 0) +
          (et.readLanguages ?? 0) +
          effectSummary.thiefSkills,
      },
    ];
  }, [showThiefSkills, character, ts, epic, mt, et, effectSummary.thiefSkills]);

  // NWP checks with target numbers (using effective stats from epic + magic overrides + bonuses).
  const nwpChecks = useMemo(() => {
    const abilityMap: Record<string, number> = effective.values;
    return nonweaponProficiencies.map((nwp) => {
      const baseScore = abilityMap[nwp.proficiency.ability.toLowerCase()] ?? 10;
      // Effects on ability/proficiency checks (e.g. heat exhaustion −2) apply here too.
      const target = getNwpCheckTarget(nwp, abilityMap, effectSummary.abilityChecks);
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
  }, [nonweaponProficiencies, locale, effective, effectSummary.abilityChecks]);

  const [expandedNwp, setExpandedNwp] = useState<string | null>(null);

  // Where effect changes on saves come from, and the "vs. …" ones that are
  // only hints (the app cannot know what a save is against).
  const saveSources = useMemo(() => {
    const byEffect = new Map<string, { value: number; keys: Set<string> }>();
    for (const key of SAVE_KEYS) {
      for (const src of effectSummary.sources[key] ?? []) {
        const entry = byEffect.get(src.effectName) ?? { value: src.value, keys: new Set<string>() };
        entry.keys.add(key);
        byEffect.set(src.effectName, entry);
      }
    }
    return [...byEffect].map(([name, { value, keys }]) =>
      keys.size === SAVE_KEYS.length
        ? `${name} ${signed(value)}`
        : `${name} ${signed(value)} (${[...keys].map((k) => t(k)).join(", ")})`
    );
  }, [effectSummary.sources, t]);
  // "Seuche: Stärke −2, Geschicklichkeit −2" — which effect changed which ability.
  const abilitySources = useMemo(() => {
    const byEffect = new Map<string, string[]>();
    for (const key of ABILITY_KEYS) {
      for (const src of effectSummary.sources[key] ?? []) {
        const parts = byEffect.get(src.effectName) ?? [];
        parts.push(formatModifier({ target: key, op: src.op, value: src.value }, tfx));
        byEffect.set(src.effectName, parts);
      }
    }
    return [...byEffect].map(([name, parts]) => `${name}: ${parts.join(", ")}`);
  }, [effectSummary.sources, tfx]);
  const saveConditions = useMemo(
    () =>
      effectSummary.conditionalNotes
        .filter((n) => n.target.startsWith("save"))
        .map(
          (n) =>
            `${tfx("conditional", { value: signed(n.value), condition: n.condition })} (${n.effectName})`
        ),
    [effectSummary.conditionalNotes, tfx]
  );

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
        {(saveSources.length > 0 || saveConditions.length > 0) && (
          <ul
            className="mt-1 flex flex-col gap-0.5 text-[10px] md:text-xs"
            data-testid="play-save-effects"
          >
            {saveSources.map((line) => (
              <li key={line} className="text-purple-400">
                {line}
              </li>
            ))}
            {saveConditions.map((line) => (
              <li key={line} className="text-muted-foreground">
                {line}
              </li>
            ))}
          </ul>
        )}
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
        {effectSummary.abilityChecks !== 0 && (
          <p
            className="mb-1 text-[10px] md:text-xs text-purple-400"
            data-testid="play-check-effect"
          >
            {`${tfx("targets.abilityChecks")} ${signed(effectSummary.abilityChecks)} (${tfx("fromEffects")})`}
          </p>
        )}
        {abilitySources.length > 0 && (
          <ul
            className="mb-1 flex flex-col gap-0.5 text-[10px] md:text-xs text-purple-400"
            data-testid="play-ability-effects"
          >
            {abilitySources.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-3 gap-1.5 lg:grid-cols-6">
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
            {Math.floor((effective.values.int + effective.values.wis) / 2) +
              effectSummary.perception}
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
