"use client";

import { useLocale, useTranslations } from "next-intl";
import { localized } from "@/lib/utils/localize";
import { RACES } from "@/lib/rules/races";
import { CLASSES } from "@/lib/rules/classes";
import { getAlignmentLabel } from "@/lib/rules/alignment";
import {
  getStrengthModifiers,
  getDexterityModifiers,
  getConstitutionModifiers,
} from "@/lib/rules/abilities";
import { getMulticlassThac0 } from "@/lib/rules/multiclass";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { WizardState } from "./wizard-types";

interface StepSummaryProps {
  state: WizardState;
}

export function StepSummary({ state }: StepSummaryProps) {
  const locale = useLocale();
  const t = useTranslations("wizard");
  const race = state.raceId ? RACES[state.raceId] : null;
  const classEntries = state.classIds.map((id) => ({ classId: id, level: state.level }));
  const thac0 = classEntries.length > 0 ? getMulticlassThac0(classEntries) : 20;
  const strMods = getStrengthModifiers(state.str, state.strExceptional ?? undefined);
  const dexMods = getDexterityModifiers(state.dex);
  const conMods = getConstitutionModifiers(state.con);

  const classNames = state.classIds
    .map((id) => localized(CLASSES[id].name, CLASSES[id].name_en, locale))
    .join(" / ");

  return (
    <div className="flex flex-col gap-4" data-testid="wizard-step-summary">
      <h2 className="font-heading text-2xl text-primary">{state.name || t("unnamed")}</h2>

      <div className="flex flex-wrap gap-2">
        {race && <Badge>{localized(race.name, race.name_en, locale)}</Badge>}
        {classNames && <Badge>{classNames}</Badge>}
        <Badge variant="outline">{t("levelBadge", { level: state.level })}</Badge>
        <Badge variant="outline">{getAlignmentLabel(state.alignment, locale)}</Badge>
      </div>

      <Separator />

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {[
          {
            label: "STR",
            value: state.str,
            extra: state.strExceptional
              ? `/${state.strExceptional === 100 ? "00" : String(state.strExceptional).padStart(2, "0")}`
              : "",
          },
          { label: "DEX", value: state.dex, extra: "" },
          { label: "CON", value: state.con, extra: "" },
          { label: "INT", value: state.int, extra: "" },
          { label: "WIS", value: state.wis, extra: "" },
          { label: "CHA", value: state.cha, extra: "" },
        ].map(({ label, value, extra }) => (
          <div key={label} className="rounded-md border border-border p-2 text-center">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="font-mono text-lg">
              {value}
              {extra}
            </div>
          </div>
        ))}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-border p-2 text-center">
          <div className="text-xs text-muted-foreground">{t("thac0Short")}</div>
          <div className="font-mono text-lg">{thac0}</div>
        </div>
        <div className="rounded-md border border-border p-2 text-center">
          <div className="text-xs text-muted-foreground">{t("acShort")}</div>
          <div className="font-mono text-lg">{10 + dexMods.defensiveAdj}</div>
        </div>
        <div className="rounded-md border border-border p-2 text-center">
          <div className="text-xs text-muted-foreground">HP</div>
          <div className="font-mono text-lg">{state.hpMax}</div>
        </div>
        <div className="rounded-md border border-border p-2 text-center">
          <div className="text-xs text-muted-foreground">{t("hitDamage")}</div>
          <div className="font-mono text-lg">
            {strMods.hitAdj >= 0 ? "+" : ""}
            {strMods.hitAdj}/{strMods.dmgAdj >= 0 ? "+" : ""}
            {strMods.dmgAdj}
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {t("hpModPerLevel", { mod: `${conMods.hpAdj >= 0 ? "+" : ""}${conMods.hpAdj}` })}
      </div>
    </div>
  );
}
