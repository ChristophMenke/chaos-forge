"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { getEffectPreset } from "@/lib/rules/effect-presets";
import {
  getStackingWarnings,
  getThresholdWarnings,
  type AbilityKey,
} from "@/lib/rules/temporary-effects";
import { localized } from "@/lib/utils/localize";
import type { CharacterEffectRow } from "@/lib/supabase/types";

interface EffectWarningsProps {
  effects: CharacterEffectRow[];
  /** Effective ability scores after all effects. */
  values: Record<AbilityKey, number>;
}

/** Rule thresholds and stacking — hints only, the app applies nothing itself. */
export function EffectWarnings({ effects, values }: EffectWarningsProps) {
  const t = useTranslations("effects");
  const locale = useLocale();
  const thresholds = getThresholdWarnings(values);
  const stacking = getStackingWarnings(effects);
  if (thresholds.length === 0 && stacking.length === 0) return null;

  return (
    <ul
      className="flex flex-col gap-0.5 text-xs text-amber-300"
      title={t("warnings.hint")}
      data-testid="effect-warnings"
    >
      {thresholds.map((w) => (
        <li key={w.ability} className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
          {t(`warnings.${w.level}`, { ability: t(`targets.${w.ability}`), value: w.value })}
        </li>
      ))}
      {stacking.map((key) => {
        const preset = getEffectPreset(key);
        const name = preset ? localized(preset.name, preset.name_en, locale) : key;
        return (
          <li key={key} className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
            {t("warnings.stacking", { name })}
          </li>
        );
      })}
    </ul>
  );
}
