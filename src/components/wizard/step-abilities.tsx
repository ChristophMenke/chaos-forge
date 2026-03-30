"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WizardState } from "./wizard-types";

interface StepAbilitiesProps {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
  showExceptionalStr: boolean;
}

const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"] as const;

export function StepAbilities({ state, onChange, showExceptionalStr }: StepAbilitiesProps) {
  const t = useTranslations("wizard");
  const ta = useTranslations("abilityNames");

  return (
    <div className="flex flex-col gap-4" data-testid="wizard-step-abilities">
      <p className="text-sm text-muted-foreground">{t("abilitiesHint")}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {ABILITY_KEYS.map((key) => (
          <div key={key} className="flex flex-col gap-1">
            <Label htmlFor={`ability-${key}`}>{ta(key)}</Label>
            <Input
              id={`ability-${key}`}
              type="number"
              min={3}
              max={25}
              value={state[key]}
              onChange={(e) => onChange({ [key]: parseInt(e.target.value) || 0 })}
              onBlur={(e) => {
                const val = Math.max(3, Math.min(25, parseInt(e.target.value) || 3));
                onChange({ [key]: val });
              }}
              data-testid={`wizard-ability-${key}`}
            />
          </div>
        ))}
      </div>

      {showExceptionalStr && state.str === 18 && (
        <div className="flex flex-col gap-1 rounded-md border border-primary/30 bg-primary/5 p-3">
          <Label htmlFor="str-exceptional">{t("exceptionalStrLabel")}</Label>
          <Input
            id="str-exceptional"
            type="number"
            min={1}
            max={100}
            value={state.strExceptional ?? ""}
            onChange={(e) => {
              onChange({ strExceptional: e.target.value ? parseInt(e.target.value) || 0 : null });
            }}
            onBlur={(e) => {
              const val = e.target.value
                ? Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
                : null;
              onChange({ strExceptional: val });
            }}
            placeholder="01-00 (100)"
            data-testid="wizard-ability-str-exceptional"
          />
          <p className="text-xs text-muted-foreground">{t("exceptionalStrHint")}</p>
        </div>
      )}
    </div>
  );
}
