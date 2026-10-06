"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  getCoolingModifier,
  type OverclockAction,
  type OverclockState,
} from "@/lib/rules/sprocket-devices";
import { SkillCheckDialog, formatCheck } from "./skill-check-dialog";

interface OverclockControlsProps {
  state: OverclockState;
  /** Name der Probe (Ingenieurskunst). */
  skill: string;
  /** Zielwert der Fertigkeit ohne Erschwernis; null, wenn unbekannt. */
  baseTarget: number | null;
  healsPerHour: number;
  /** Abgelegt: Übertakten und Stunden sind gesperrt. */
  equipped: boolean;
  onAction: (action: OverclockAction) => void;
}

/** Text der nächsten Probe: Kühlungswurf für die laufende Stunde. */
export function nextCoolingCheck(state: OverclockState, skill: string, baseTarget: number | null) {
  const modifier = getCoolingModifier(state.hours + 1);
  return formatCheck(skill, modifier, baseTarget != null ? baseTarget + modifier : null);
}

/**
 * Knöpfe und Wurf-Dialoge fürs Übertakten (Besitzer): Start, „Eine Stunde
 * vergeht“, Beenden und nach misslungener Kühlung „Ein Tag ist vergangen“.
 */
export function OverclockControls({
  state,
  skill,
  baseTarget,
  healsPerHour,
  equipped,
  onAction,
}: OverclockControlsProps) {
  const t = useTranslations("epic");
  const [pending, setPending] = useState<"start" | "hour" | null>(null);
  const nextHour = state.hours + 1;

  function resolve(success: boolean) {
    if (pending) onAction({ type: pending, success });
    setPending(null);
  }

  if (state.cooldown && !state.active) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => onAction({ type: "cooldownEnd" })}
        data-testid="overclock-day-passed"
      >
        {t("overclockDayPassed")}
      </Button>
    );
  }

  return (
    <>
      {state.active ? (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => setPending("hour")}
            disabled={!equipped}
            data-testid="overclock-hour"
          >
            {t("overclockHourPassed")}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onAction({ type: "stop" })}
            data-testid="overclock-stop"
          >
            {t("overclockStop")}
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          onClick={() => setPending("start")}
          disabled={!equipped}
          data-testid="overclock-start"
        >
          {t("overclockStart")}
        </Button>
      )}

      <SkillCheckDialog
        open={pending !== null}
        title={pending === "hour" ? t("checkTitleCooling") : t("checkTitleStart")}
        check={
          pending === "hour"
            ? nextCoolingCheck(state, skill, baseTarget)
            : formatCheck(skill, 0, baseTarget)
        }
        hints={
          pending === "hour"
            ? [
                t("checkHintHourHealed", { hour: nextHour, hp: healsPerHour }),
                t("checkHintCoolingFail"),
              ]
            : [t("checkHintStartFail")]
        }
        onResult={resolve}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
