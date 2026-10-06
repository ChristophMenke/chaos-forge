"use client";

import { useTranslations, useLocale } from "next-intl";
import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { localized } from "@/lib/utils/localize";
import type { OverclockAbility } from "@/lib/rules/epic-items";
import type { OverclockAction, OverclockState } from "@/lib/rules/sprocket-devices";
import {
  OverclockControls,
  nextCoolingCheck,
} from "@/components/epic-equipment/overclock-controls";
import { formatCheck } from "@/components/epic-equipment/skill-check-dialog";

interface PlayOverclockBannerProps {
  ability: OverclockAbility;
  state: OverclockState;
  /** Ingenieurskunst-Zielwert ohne Erschwernis; null ohne die Fertigkeit. */
  baseTarget: number | null;
  isOwner: boolean;
  onAction: (action: OverclockAction) => void;
}

/**
 * Übertakten im Spielmodus: aktiv als Banner mit Stunde, Wirkung und nächstem
 * Kühlungswurf; sonst eine schmale Startzeile für den Besitzer.
 */
export function PlayOverclockBanner({
  ability,
  state,
  baseTarget,
  isOwner,
  onAction,
}: PlayOverclockBannerProps) {
  const t = useTranslations("playMode");
  const locale = useLocale();
  const name = localized(ability.name, ability.name_en, locale);
  const skill = localized(ability.requiresCheck, ability.requiresCheck_en, locale);

  const controls = isOwner && (
    <OverclockControls
      state={state}
      skill={skill}
      baseTarget={baseTarget}
      healsPerHour={ability.healsPerHour}
      equipped
      onAction={onAction}
    />
  );

  if (!state.active) {
    return (
      <div
        className="mx-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2"
        data-testid="play-overclock-idle"
      >
        <span className="flex items-center gap-2 text-sm text-amber-400">
          <Zap className="h-4 w-4 shrink-0" />
          {name} · {state.cooldown ? t("overclockCooldown") : formatCheck(skill, 0, baseTarget)}
        </span>
        {controls}
      </div>
    );
  }

  return (
    <div
      className="mx-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3"
      data-testid="play-overclock"
    >
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 shrink-0 text-amber-400" />
        <span className="text-sm font-bold text-amber-400">
          {name} — {t("overclockActive")} · {t("overclockHour", { hour: state.hours + 1 })}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge variant="outline" className="border-amber-500/50 text-amber-400">
          {t("overclockConOverride", { value: ability.conOverride })}
        </Badge>
        <Badge variant="outline" className="border-red-500/50 text-red-400">
          {t("overclockPoisonPenalty", { penalty: ability.poisonSavePenalty })}
        </Badge>
        <Badge variant="outline" className="border-green-500/50 text-green-400">
          {t("overclockHealing", { hp: ability.healsPerHour })}
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm" data-testid="play-overclock-next-check">
          {t("overclockNextCooling", { check: nextCoolingCheck(state, skill, baseTarget) })}
        </p>
        {controls}
      </div>
    </div>
  );
}
