"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { localized } from "@/lib/utils/localize";
import type { OverclockAbility } from "@/lib/rules/epic-items";

interface PlayOverclockBannerProps {
  ability: OverclockAbility;
  endTime: number | null;
}

export function PlayOverclockBanner({ ability, endTime }: PlayOverclockBannerProps) {
  const t = useTranslations("playMode");
  const locale = useLocale();

  // Timer countdown (read-only display)
  const [minutesLeft, setMinutesLeft] = useState<number | null>(() => {
    if (!endTime) return null;
    return Math.max(0, Math.ceil((endTime - Date.now()) / 60000));
  });

  useEffect(() => {
    if (!endTime) {
      setMinutesLeft(() => null);
      return;
    }
    setMinutesLeft(() => Math.max(0, Math.ceil((endTime - Date.now()) / 60000)));
    const interval = setInterval(() => {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        clearInterval(interval);
        setMinutesLeft(0);
      } else {
        setMinutesLeft(Math.ceil(remaining / 60000));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div
      className="mx-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3"
      data-testid="play-overclock"
    >
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 shrink-0 text-amber-400" />
        <span className="text-sm font-bold text-amber-400">
          {localized(ability.name, ability.name_en, locale)} — {t("overclockActive")}
        </span>
        {minutesLeft != null && (
          <Badge
            variant="outline"
            className="border-amber-500/50 text-amber-400"
            data-testid="overclock-timer"
          >
            {t("overclockTimer", { minutes: minutesLeft })}
          </Badge>
        )}
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
    </div>
  );
}
