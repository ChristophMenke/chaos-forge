"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { getConstitutionModifiers } from "@/lib/rules/abilities";
import { CLASSES } from "@/lib/rules/classes";
import {
  buildLevelUpSummary,
  getLevelUpHitPoints,
  getLevelUpSkillPoints,
  getPendingLevelUps,
  validateSkillAllocation,
  THIEF_SKILL_KEYS,
  type PendingLevelUp,
  type SkillAllocation,
  type ThiefSkillKey,
} from "@/lib/rules/level-up";
import {
  applyLevelUp,
  buildLevelUpPlan,
  THIEF_SKILL_COLUMNS,
  type LevelUpPlan,
} from "@/lib/level-up/apply-level-up";
import { localized } from "@/lib/utils/localize";
import type { CharacterClassRow, CharacterRow, EpicItemRow } from "@/lib/supabase/types";
import type { ClassId } from "@/lib/rules/types";
import { LevelUpHpStep } from "./level-up-hp-step";
import { LevelUpSkillsStep } from "./level-up-skills-step";
import { LevelUpSummaryStep } from "./level-up-summary-step";

interface LevelUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: CharacterRow;
  classes: CharacterClassRow[];
  epicItems: EpicItemRow[];
  /** Called after a level was saved — the parent merges the plan into its state. */
  onApplied: (plan: LevelUpPlan) => void;
}

/**
 * Level-up assistant: one class level per run (hit points from the real die,
 * thief/bard skill points, summary). Further pending levels follow once the
 * parent has merged the applied plan into `classes`.
 */
export function LevelUpDialog(props: LevelUpDialogProps) {
  const pending = getPendingLevelUps(props.classes)[0];
  if (!pending) return null;
  // Remount per level so the steps start fresh for every level-up.
  return (
    <LevelUpRun key={`${pending.classRowId}-${pending.toLevel}`} pending={pending} {...props} />
  );
}

function LevelUpRun({
  open,
  onOpenChange,
  character,
  classes,
  epicItems,
  onApplied,
  pending,
}: LevelUpDialogProps & { pending: PendingLevelUp }) {
  const t = useTranslations("levelUpWizard");
  const locale = useLocale();

  const [step, setStep] = useState(0);
  const [rollInput, setRollInput] = useState("");
  const [allocation, setAllocation] = useState<SkillAllocation>({});
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const cls = CLASSES[pending.classId];
  const className = cls ? localized(cls.name, cls.name_en, locale) : pending.classId;

  const conHpAdj = getConstitutionModifiers(
    character.con,
    character.con_health,
    character.con_fitness
  ).hpAdj;
  const hpInput = {
    classId: pending.classId,
    newLevel: pending.toLevel,
    kit: character.kit,
    conHpAdj,
    classes,
  };
  const baseHitPoints = getLevelUpHitPoints(hpInput);
  const rollNumber = Number(rollInput);
  const rollValid =
    baseHitPoints.mode !== "roll" ||
    (rollInput !== "" &&
      Number.isInteger(rollNumber) &&
      rollNumber >= 1 &&
      rollNumber <= baseHitPoints.die);
  const hitPoints =
    baseHitPoints.mode === "roll" && rollValid
      ? getLevelUpHitPoints({ ...hpInput, dieRoll: rollNumber })
      : baseHitPoints;

  const skillRules = getLevelUpSkillPoints(pending.classId);
  const currentSkills = useMemo(
    () =>
      Object.fromEntries(
        THIEF_SKILL_KEYS.map((key) => [
          key,
          Number((character as unknown as Record<string, number>)[THIEF_SKILL_COLUMNS[key]] ?? 0),
        ])
      ) as Record<ThiefSkillKey, number>,
    [character]
  );
  const validation = skillRules
    ? validateSkillAllocation(currentSkills, allocation, skillRules)
    : null;

  const changes = useMemo(
    () =>
      buildLevelUpSummary({
        character: { level: character.level, priesthood: character.priesthood },
        classes,
        classRowId: pending.classRowId,
        epicItems,
      }),
    [character.level, character.priesthood, classes, pending.classRowId, epicItems]
  );

  const steps = skillRules ? (["hp", "skills", "summary"] as const) : (["hp", "summary"] as const);
  const current = steps[step];

  // The level after this one, if the XP already reach it (announced in the footer).
  const following = getPendingLevelUps(
    classes.map((cc) => (cc.id === pending.classRowId ? { ...cc, level: pending.toLevel } : cc))
  )[0];

  const canContinue =
    current === "hp"
      ? hitPoints.gain !== null
      : current === "skills"
        ? Boolean(validation?.valid)
        : true;

  async function handleApply() {
    if (hitPoints.gain === null) return;
    setSaving(true);
    setSaveFailed(false);
    const plan = buildLevelUpPlan({
      character: character as unknown as Parameters<typeof buildLevelUpPlan>[0]["character"],
      classes,
      classRowId: pending.classRowId,
      hpGain: hitPoints.gain,
      skillAllocation: allocation,
    });
    const result = await applyLevelUp(createClient(), plan);
    setSaving(false);
    if (!result.ok) {
      console.error("[LevelUpDialog] save failed:", result.errors);
      setSaveFailed(true);
      return;
    }
    toast.success(t("applied", { className, level: pending.toLevel }));
    onApplied(plan);
    if (!following) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
        data-testid="level-up-dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-heading">⬆ {t("title")}</DialogTitle>
          <DialogDescription>
            {t("subtitle", {
              name: character.name,
              className,
              from: pending.fromLevel,
              to: pending.toLevel,
            })}
            <span className="ml-2 text-xs">
              {t("step", { current: step + 1, total: steps.length })}
            </span>
          </DialogDescription>
        </DialogHeader>

        {current === "hp" && (
          <LevelUpHpStep
            hitPoints={hitPoints}
            toLevel={pending.toLevel}
            rollInput={rollInput}
            rollInvalid={rollInput !== "" && !rollValid}
            onRollInputChange={setRollInput}
            hpMax={character.hp_max}
          />
        )}
        {current === "skills" && skillRules && validation && (
          <LevelUpSkillsStep
            rules={skillRules}
            current={currentSkills}
            allocation={allocation}
            validation={validation}
            onChange={setAllocation}
          />
        )}
        {current === "summary" && (
          <LevelUpSummaryStep
            changes={changes}
            hpMax={character.hp_max}
            hpGain={hitPoints.gain ?? 0}
            skillAllocation={allocation}
            currentSkills={currentSkills}
            leftoverPoints={Math.max(0, validation?.remaining ?? 0)}
          />
        )}

        {saveFailed && (
          <p role="alert" className="text-sm text-destructive">
            {t("applyError")}
          </p>
        )}
        {following && (
          <p className="text-xs text-muted-foreground">
            {t("moreToCome", {
              className: localized(
                CLASSES[following.classId as ClassId]?.name ?? following.classId,
                CLASSES[following.classId as ClassId]?.name_en,
                locale
              ),
              from: following.fromLevel,
              to: following.toLevel,
            })}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("cancel")}
          </Button>
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={saving}>
              {t("back")}
            </Button>
          )}
          {current !== "summary" ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canContinue}>
              {t("next")}
            </Button>
          ) : (
            <Button
              onClick={handleApply}
              disabled={saving || hitPoints.gain === null}
              data-testid="level-up-apply"
            >
              {saving ? t("applying") : t("apply")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
