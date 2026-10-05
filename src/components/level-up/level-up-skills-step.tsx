"use client";

import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  SkillAllocation,
  SkillAllocationResult,
  SkillPointRules,
  ThiefSkillKey,
} from "@/lib/rules/level-up";

const STEP = 5;

interface LevelUpSkillsStepProps {
  rules: SkillPointRules;
  current: Record<ThiefSkillKey, number>;
  allocation: SkillAllocation;
  validation: SkillAllocationResult;
  onChange: (allocation: SkillAllocation) => void;
}

/** Step 2: thieves and bards distribute their discretionary skill points. */
export function LevelUpSkillsStep({
  rules,
  current,
  allocation,
  validation,
  onChange,
}: LevelUpSkillsStepProps) {
  const t = useTranslations("levelUpWizard");
  const ts = useTranslations("sheet");

  /** Room left for a skill: per-level maximum, 95% cap and the unspent points. */
  function maxFor(skill: ThiefSkillKey): number {
    const points = allocation[skill] ?? 0;
    return Math.max(
      0,
      Math.min(
        rules.maxPerSkill,
        rules.cap - current[skill],
        points + Math.max(0, validation.remaining)
      )
    );
  }

  function change(skill: ThiefSkillKey, delta: number) {
    const points = allocation[skill] ?? 0;
    onChange({ ...allocation, [skill]: Math.max(0, Math.min(points + delta, maxFor(skill))) });
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="level-up-skills-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="level-up-skills-title" className="font-heading text-base text-primary">
          {t("skillsTitle")}
        </h3>
        <span className="font-mono text-sm" aria-live="polite">
          {t("remaining", { remaining: validation.remaining, points: rules.points })}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("skillRules", { max: rules.maxPerSkill, cap: rules.cap })}
      </p>

      <ul className="flex flex-col gap-2">
        {rules.skills.map((skill) => {
          const points = allocation[skill] ?? 0;
          const label = ts(skill);
          const canIncrease = points < maxFor(skill);
          const error = validation.errors.find((e) => e.skill === skill);
          return (
            <li
              key={skill}
              className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-md border border-border px-3 py-2 sm:grid-cols-[1fr_auto_auto]"
              data-testid={`level-up-skill-${skill}`}
            >
              <span className="text-sm">
                {label} <span className="font-mono text-muted-foreground">{current[skill]} %</span>
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => change(skill, -STEP)}
                  disabled={points === 0}
                  aria-label={t("decrease", { skill: label })}
                >
                  <Minus className="h-3 w-3" aria-hidden />
                </Button>
                <span className="w-10 text-center font-mono">+{points}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => change(skill, STEP)}
                  disabled={!canIncrease}
                  aria-label={t("increase", { skill: label })}
                >
                  <Plus className="h-3 w-3" aria-hidden />
                </Button>
              </div>
              <span className="col-span-2 font-mono text-sm sm:col-span-1 sm:w-16 sm:text-right">
                → {current[skill] + points} %
                {error && (
                  <span className="ml-2 text-xs text-destructive">
                    {error.reason === "cap"
                      ? t("errorCap", { cap: rules.cap })
                      : t("errorMaxPerSkill", { max: rules.maxPerSkill })}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
