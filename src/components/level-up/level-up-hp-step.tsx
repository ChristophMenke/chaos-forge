"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LevelUpHitPoints } from "@/lib/rules/level-up";

interface LevelUpHpStepProps {
  hitPoints: LevelUpHitPoints;
  toLevel: number;
  rollInput: string;
  rollInvalid: boolean;
  onRollInputChange: (value: string) => void;
  hpMax: number;
}

/** Step 1: the player enters the real die result; the app adds Con and splits for multiclass. */
export function LevelUpHpStep({
  hitPoints,
  toLevel,
  rollInput,
  rollInvalid,
  onRollInputChange,
  hpMax,
}: LevelUpHpStepProps) {
  const t = useTranslations("levelUpWizard");
  const gain = hitPoints.gain;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="level-up-hp-title">
      <h3 id="level-up-hp-title" className="font-heading text-base text-primary">
        {t("hpTitle")}
      </h3>

      {hitPoints.mode === "roll" && (
        <div className="flex flex-col gap-2">
          <p>{t("rollPrompt", { die: hitPoints.die })}</p>
          <Label htmlFor="level-up-roll" className="text-xs text-muted-foreground">
            {t("rollLabel", { die: hitPoints.die })}
          </Label>
          <Input
            id="level-up-roll"
            type="number"
            inputMode="numeric"
            min={1}
            max={hitPoints.die}
            value={rollInput}
            onChange={(e) => onRollInputChange(e.target.value)}
            aria-invalid={rollInvalid}
            aria-describedby={rollInvalid ? "level-up-roll-error" : undefined}
            className="w-24 text-center font-mono text-lg"
            autoFocus
            data-testid="level-up-roll-input"
          />
          {rollInvalid && (
            <p id="level-up-roll-error" role="alert" className="text-xs text-destructive">
              {t("rollInvalid", { die: hitPoints.die })}
            </p>
          )}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">{t("die")}</dt>
            <dd className="font-mono">{rollInput && !rollInvalid ? rollInput : "–"}</dd>
            <dt className="text-muted-foreground">{t("conBonus")}</dt>
            <dd className="font-mono">
              {hitPoints.conBonus >= 0 ? `+${hitPoints.conBonus}` : hitPoints.conBonus}
            </dd>
            {hitPoints.divisor > 1 && (
              <>
                <dt className="text-muted-foreground" />
                <dd className="text-xs text-muted-foreground">
                  {t("divided", { count: hitPoints.divisor })}
                </dd>
              </>
            )}
          </dl>
        </div>
      )}

      {hitPoints.mode === "fixed" && <p>{t("fixedHp", { level: toLevel, gain: gain ?? 0 })}</p>}
      {hitPoints.mode === "none" && <p>{t("dormantHp")}</p>}

      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-border pt-3">
        <span>
          {t("gain")}:{" "}
          <strong className="font-mono" data-testid="level-up-hp-gain">
            {gain === null ? "–" : `+${gain}`}
          </strong>
        </span>
        <span>
          {t("hpMax")}:{" "}
          <strong className="font-mono" data-testid="level-up-hp-max">
            {hpMax} → {gain === null ? "–" : hpMax + gain}
          </strong>
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{t("currentHpUnchanged")}</p>
    </section>
  );
}
