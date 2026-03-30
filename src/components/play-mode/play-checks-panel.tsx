"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { GlassCard } from "@/components/glass-card";
import { Badge } from "@/components/ui/badge";
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
import { localized } from "@/lib/utils/localize";

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
}

export function PlayChecksPanel({
  saves,
  character,
  strMods,
  dexMods,
  conMods,
  intMods,
  wisMods,
  chaMods,
  showThiefSkills,
  nonweaponProficiencies,
  epicEffects,
}: PlayChecksPanelProps) {
  const t = useTranslations("playMode");
  const te = useTranslations("epic");
  const ts = useTranslations("sheet");
  const locale = useLocale();

  const defaultEpic: EpicEffects = useMemo(
    () => ({
      statOverrides: {},
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
    }),
    []
  );
  const epic = epicEffects ?? defaultEpic;
  const eo = epic.statOverrides;

  // Helper: scale sub-stat if main stat is overridden
  function sub(base: number, baseSub: number | null, override: number | undefined): number | null {
    if (baseSub == null) return null;
    if (override != null) return scaleSubStat(base, baseSub, override);
    return baseSub;
  }

  // Ability scores with names (using effective stats from epic overrides)
  const abilities = useMemo(
    () => [
      {
        name: "STR",
        score: eo.str ?? character.str,
        modified: eo.str != null,
        subScores: [
          character.str_muscle != null
            ? { name: ts("muscle"), score: sub(character.str, character.str_muscle, eo.str) }
            : null,
          character.str_stamina != null
            ? { name: ts("stamina"), score: sub(character.str, character.str_stamina, eo.str) }
            : null,
        ].filter(Boolean),
      },
      {
        name: "DEX",
        score: eo.dex ?? character.dex,
        modified: eo.dex != null,
        subScores: [
          character.dex_aim != null
            ? { name: ts("aim"), score: sub(character.dex, character.dex_aim, eo.dex) }
            : null,
          character.dex_balance != null
            ? { name: ts("balance"), score: sub(character.dex, character.dex_balance, eo.dex) }
            : null,
        ].filter(Boolean),
      },
      {
        name: "CON",
        score: eo.con ?? character.con,
        modified: eo.con != null,
        subScores: [
          character.con_health != null
            ? { name: ts("health"), score: sub(character.con, character.con_health, eo.con) }
            : null,
          character.con_fitness != null
            ? { name: ts("fitness"), score: sub(character.con, character.con_fitness, eo.con) }
            : null,
        ].filter(Boolean),
      },
      {
        name: "INT",
        score: eo.int ?? character.int,
        modified: eo.int != null,
        subScores: [
          character.int_knowledge != null
            ? { name: ts("knowledge"), score: sub(character.int, character.int_knowledge, eo.int) }
            : null,
          character.int_reason != null
            ? { name: ts("reason"), score: sub(character.int, character.int_reason, eo.int) }
            : null,
        ].filter(Boolean),
      },
      {
        name: "WIS",
        score: eo.wis ?? character.wis,
        modified: eo.wis != null,
        subScores: [
          character.wis_intuition != null
            ? { name: ts("intuition"), score: sub(character.wis, character.wis_intuition, eo.wis) }
            : null,
          character.wis_willpower != null
            ? { name: ts("willpower"), score: sub(character.wis, character.wis_willpower, eo.wis) }
            : null,
        ].filter(Boolean),
      },
      {
        name: "CHA",
        score: eo.cha ?? character.cha,
        modified: eo.cha != null,
        subScores: [
          character.cha_leadership != null
            ? {
                name: ts("leadership"),
                score: sub(character.cha, character.cha_leadership, eo.cha),
              }
            : null,
          character.cha_appearance != null
            ? {
                name: ts("appearance"),
                score: sub(character.cha, character.cha_appearance, eo.cha),
              }
            : null,
        ].filter(Boolean),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [character, ts, eo]
  );

  // Thief skills (using existing sheet i18n keys)
  const thiefSkills = useMemo(() => {
    if (!showThiefSkills) return [];
    return [
      {
        name: ts("pickLocks"),
        base: character.thief_pick_locks,
        value: applyThiefPenalty(character.thief_pick_locks, epic),
      },
      {
        name: ts("findTraps"),
        base: character.thief_find_traps,
        value: applyThiefPenalty(character.thief_find_traps, epic),
      },
      {
        name: ts("moveSilently"),
        base: character.thief_move_silently,
        value: applyThiefPenalty(character.thief_move_silently, epic),
      },
      {
        name: ts("hideInShadows"),
        base: character.thief_hide_shadows,
        value: applyThiefPenalty(character.thief_hide_shadows, epic),
      },
      {
        name: ts("climbWalls"),
        base: character.thief_climb_walls,
        value: applyThiefPenalty(character.thief_climb_walls, epic),
      },
      {
        name: ts("detectNoise"),
        base: character.thief_detect_noise,
        value: applyThiefPenalty(character.thief_detect_noise, epic),
      },
      {
        name: ts("readLanguages"),
        base: character.thief_read_languages,
        value: applyThiefPenalty(character.thief_read_languages, epic),
      },
    ];
  }, [showThiefSkills, character, ts, epic]);

  // NWP checks with target numbers (using effective stats from epic overrides)
  const nwpChecks = useMemo(() => {
    const abilityMap: Record<string, number> = {
      str: eo.str ?? character.str,
      dex: eo.dex ?? character.dex,
      con: eo.con ?? character.con,
      int: eo.int ?? character.int,
      wis: eo.wis ?? character.wis,
      cha: eo.cha ?? character.cha,
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
      };
    });
  }, [nonweaponProficiencies, character, locale, eo]);

  return (
    <GlassCard hover={false} data-testid="play-checks-panel">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("checks")}
        </h3>
        {epic.perceptionBonus > 0 && (
          <div
            className="rounded-md border border-purple-500/50 bg-purple-500/5 px-2 py-1 text-[10px] text-purple-400"
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
        <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">{t("savingThrows")}</h4>
        <div className="grid grid-cols-5 gap-1 text-center">
          {[
            { key: "paralyzation", label: t("paralyzation"), value: saves.paralyzation },
            { key: "rod", label: t("rod"), value: saves.rod },
            { key: "petrification", label: t("petrification"), value: saves.petrification },
            { key: "breath", label: t("breath"), value: saves.breath },
            { key: "spell", label: t("spell"), value: saves.spell },
          ].map((save) => (
            <div
              key={save.key}
              className="rounded-md border border-border px-1 py-1.5"
              data-testid={`play-save-${save.key}`}
            >
              <div className="truncate text-[9px] text-muted-foreground">{save.label}</div>
              <div className="font-mono text-lg font-bold">{save.value}</div>
            </div>
          ))}
        </div>
        {wisMods.magicalDefenseAdj !== 0 && (
          <div className="mt-1 text-[10px] text-muted-foreground">
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
              <div className="text-[10px] font-medium text-muted-foreground">{ab.name}</div>
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
                        <div key={sub.name} className="text-[9px] text-muted-foreground">
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
        <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">{t("perception")}</h4>
        <div
          className="rounded-md border border-border px-3 py-1.5 text-center"
          style={{ width: "fit-content" }}
        >
          <div className="text-[10px] text-muted-foreground">{t("perceptionFormula")}</div>
          <div className="font-mono text-lg font-bold">
            {Math.floor(((eo.int ?? character.int) + (eo.wis ?? character.wis)) / 2)}
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
          <div className="space-y-1">
            {nwpChecks.map((nwp) => (
              <div
                key={nwp.name}
                className="flex items-center justify-between rounded-md border border-border px-2 py-1"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-xs">{nwp.name}</span>
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    ({nwp.ability} {nwp.baseScore}
                    {nwp.modifier !== 0 ? ` ${nwp.modifier > 0 ? "+" : ""}${nwp.modifier}` : ""})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{t("target")}:</span>
                  <span className="font-mono text-sm font-bold">{nwp.target}</span>
                </div>
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
