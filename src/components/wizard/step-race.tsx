"use client";

import { useTranslations, useLocale } from "next-intl";
import { localized } from "@/lib/utils/localize";
import { feetToMeters } from "@/lib/utils/units";
import { getAllRaces, canPlayClass } from "@/lib/rules/races";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2Icon } from "lucide-react";
import type { WizardState } from "./wizard-types";
import type { RaceId } from "@/lib/rules/types";

interface StepRaceProps {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}

export function StepRace({ state, onChange }: StepRaceProps) {
  const t = useTranslations("wizard");
  const locale = useLocale();
  const races = getAllRaces();

  function handleSelect(raceId: RaceId) {
    // Don't reset class — allow all combinations, show warnings instead
    onChange({ raceId });
  }

  return (
    <div className="flex flex-col gap-4" data-testid="wizard-step-race">
      <p className="text-sm text-muted-foreground">{t("selectRace")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {races.map((race) => {
          const isSelected = state.raceId === race.id;
          const adjustments = Object.entries(race.abilityAdjustments);

          return (
            <Card
              key={race.id}
              className={`cursor-pointer transition-all ${isSelected ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-[0_0_15px_rgba(var(--primary-rgb,234,179,8),0.15)]" : "hover:border-primary/30"}`}
              onClick={() => handleSelect(race.id)}
              data-testid={`wizard-race-${race.id}`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {localized(race.name, race.name_en, locale)}
                  {isSelected && <CheckCircle2Icon className="h-5 w-5 shrink-0 text-primary" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {adjustments.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {adjustments.map(([ability, mod]) => (
                      <Badge key={ability} variant={mod > 0 ? "default" : "destructive"}>
                        {ability.toUpperCase()} {mod > 0 ? `+${mod}` : mod}
                      </Badge>
                    ))}
                  </div>
                )}
                {race.infravision > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {t("infravision")}: {feetToMeters(race.infravision)} m
                  </span>
                )}
                {race.racialAbilities.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {race.racialAbilities.map((ability, idx) => (
                      <span
                        key={idx}
                        className="text-xs text-muted-foreground"
                        title={localized(ability.description, ability.description_en, locale)}
                      >
                        {localized(ability.name, ability.name_en, locale)}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
