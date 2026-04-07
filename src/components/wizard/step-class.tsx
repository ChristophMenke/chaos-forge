"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { localized } from "@/lib/utils/localize";
import { getAllClasses, getAbilityRequirementFailures } from "@/lib/rules/classes";
import { canPlayClass, getLevelLimit } from "@/lib/rules/races";
import { isRuleCompliantMulticlass } from "@/lib/rules/multiclass";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Square } from "lucide-react";
import type { WizardState } from "./wizard-types";
import type { ClassId, AbilityName } from "@/lib/rules/types";

const CLASS_IMAGE_MAP: Record<string, string> = {
  abjurer: "mage",
  conjurer: "mage",
  diviner: "mage",
  enchanter: "mage",
  illusionist: "mage",
  invoker: "mage",
  necromancer: "mage",
  transmuter: "mage",
};

function classImage(classId: string): string {
  return `/images/classes/${CLASS_IMAGE_MAP[classId] ?? classId}.webp`;
}

interface StepClassProps {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}

export function StepClass({ state, onChange }: StepClassProps) {
  const t = useTranslations("wizard");
  const locale = useLocale();
  const classes = getAllClasses();
  const abilities: Record<AbilityName, number> = {
    str: state.str,
    dex: state.dex,
    con: state.con,
    int: state.int,
    wis: state.wis,
    cha: state.cha,
  };

  function toggleClass(classId: ClassId) {
    const isSelected = state.classIds.includes(classId);
    if (isSelected) {
      onChange({ classIds: state.classIds.filter((id) => id !== classId) });
    } else {
      onChange({ classIds: [...state.classIds, classId] });
    }
  }

  function getWarnings(classId: ClassId): string[] {
    const warnings: string[] = [];
    if (state.raceId && !canPlayClass(state.raceId, classId)) {
      warnings.push(t("notRuleConformRace"));
    }
    const failures = getAbilityRequirementFailures(classId, abilities);
    if (failures.length > 0) {
      const details = failures
        .map((f) => `${f.ability.toUpperCase()} ${f.actual} < ${f.required}`)
        .join(", ");
      warnings.push(`${t("abilityReqNotMet")}: ${details}`);
    }
    return warnings;
  }

  // Check if the current multi-selection is rule-compliant
  const isMulticlass = state.classIds.length > 1;
  const isMultiCompliant =
    isMulticlass && state.raceId ? isRuleCompliantMulticlass(state.raceId, state.classIds) : true;

  return (
    <div className="flex flex-col gap-4" data-testid="wizard-step-class">
      <p className="text-sm text-muted-foreground">{t("selectClassHint")}</p>

      {isMulticlass && (
        <div className="flex items-center gap-2">
          <Badge data-testid="multiclass-badge">{t("multiclass")}</Badge>
          {!isMultiCompliant && (
            <Badge
              className="bg-yellow-800/50 text-yellow-200"
              variant="secondary"
              data-testid="multiclass-warning"
            >
              {t("multiclassWarning")}
            </Badge>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {classes.map((cls) => {
          const isSelected = state.classIds.includes(cls.id);
          const warnings = getWarnings(cls.id);
          const levelLimit = state.raceId ? getLevelLimit(state.raceId, cls.id) : null;

          return (
            <Card
              key={cls.id}
              className={`cursor-pointer overflow-hidden transition-colors ${
                isSelected ? "border-primary bg-primary/5" : "hover:border-primary/30"
              }`}
              onClick={() => toggleClass(cls.id)}
              data-testid={`wizard-class-${cls.id}`}
            >
              <div className="flex">
                {/* Class illustration */}
                <div className="relative h-[120px] w-[90px] shrink-0 overflow-hidden rounded-l-xl">
                  <Image
                    src={classImage(cls.id)}
                    alt={localized(cls.name, cls.name_en, locale)}
                    width={90}
                    height={120}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 shadow-[inset_-12px_0_20px_-8px_rgba(0,0,0,0.4)]" />
                </div>
                {/* Content */}
                <div className="flex flex-1 flex-col gap-1 py-2 pr-3">
                  <div className="flex items-center gap-2 px-3 text-lg font-semibold">
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 shrink-0 text-primary" />
                    ) : (
                      <Square className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    {localized(cls.name, cls.name_en, locale)}
                  </div>
                  <div className="flex flex-col gap-1 px-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">{cls.group}</Badge>
                      <Badge variant="outline">d{cls.hitDie}</Badge>
                      {levelLimit && (
                        <Badge variant="secondary">
                          {t("maxLevel")} {levelLimit}
                        </Badge>
                      )}
                    </div>
                    {warnings.length > 0 && (
                      <div className="mt-1 flex items-center gap-1">
                        <Badge className="bg-yellow-800/50 text-yellow-200" variant="secondary">
                          {t("warning")}
                        </Badge>
                        <span className="text-xs text-yellow-400">{warnings.join(". ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
