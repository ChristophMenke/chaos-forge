"use client";

import { useTranslations, useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALL_ALIGNMENTS, getAlignmentLabel, getAllowedAlignments } from "@/lib/rules/alignment";
import type { AlignmentId } from "@/lib/rules/alignment";
import type { WizardState } from "./wizard-types";

interface StepBasicsProps {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}

export function StepBasics({ state, onChange }: StepBasicsProps) {
  const t = useTranslations("wizard");
  const locale = useLocale();
  const primaryClassId = state.classIds.length > 0 ? state.classIds[0] : null;
  const allowedAlignments = primaryClassId ? getAllowedAlignments(primaryClassId) : ALL_ALIGNMENTS;
  const isAlignmentWarning = primaryClassId && !allowedAlignments.includes(state.alignment);

  return (
    <div className="flex flex-col gap-4" data-testid="wizard-step-basics">
      <div className="flex flex-col gap-2">
        <Label htmlFor="char-name">{t("nameLabel")}</Label>
        <Input
          id="char-name"
          value={state.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={t("namePlaceholder")}
          data-testid="wizard-name-input"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="char-level">{t("levelLabel")}</Label>
        <Input
          id="char-level"
          type="number"
          min={1}
          max={20}
          value={state.level}
          onChange={(e) => onChange({ level: parseInt(e.target.value) || 0 })}
          onBlur={(e) =>
            onChange({ level: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) })
          }
          data-testid="wizard-level-input"
        />
        <p className="text-xs text-muted-foreground">{t("levelHint")}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="char-alignment">{t("alignmentLabel")}</Label>
        <select
          id="char-alignment"
          value={state.alignment}
          onChange={(e) => onChange({ alignment: e.target.value as AlignmentId })}
          className="rounded-md border border-input bg-input px-3 py-2 text-sm"
          data-testid="wizard-alignment-select"
        >
          {ALL_ALIGNMENTS.map((id) => (
            <option key={id} value={id}>
              {getAlignmentLabel(id, locale)}
            </option>
          ))}
        </select>
        {isAlignmentWarning && <p className="text-xs text-yellow-400">{t("alignmentWarning")}</p>}
      </div>
    </div>
  );
}
