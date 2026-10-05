"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ALLOWED_OPS, FACTOR_CHOICES } from "@/lib/rules/temporary-effects";
import type { EffectModifier, EffectOp, EffectTarget } from "@/lib/supabase/types";

export const TARGET_GROUPS: { key: string; targets: EffectTarget[] }[] = [
  { key: "abilities", targets: ["str", "dex", "con", "int", "wis", "cha", "allAbilities"] },
  {
    key: "saves",
    targets: [
      "savesAll",
      "saveParalyzation",
      "saveRod",
      "savePetrification",
      "saveBreath",
      "saveSpell",
    ],
  },
  { key: "combat", targets: ["attack", "damage", "ac", "movement", "attacksPerRound", "tempHp"] },
  { key: "other", targets: ["perception", "abilityChecks", "thiefSkills", "spellFailure"] },
];

const FACTOR_LABELS: Record<string, string> = {
  "2": "×2",
  [String(2 / 3)]: "×⅔",
  "0.5": "×½",
  [String(1 / 3)]: "×⅓",
  "0": "×0",
};

export function factorLabel(value: number): string {
  return FACTOR_LABELS[String(value)] ?? `×${Math.round(value * 100) / 100}`;
}

/** Default value when the operation changes, so the row stays valid. */
function defaultValue(op: EffectOp): number {
  return op === "factor" ? 0.5 : op === "set" ? 10 : 0;
}

interface ModifierRowProps {
  modifier: EffectModifier;
  readOnly?: boolean;
  onChange: (modifier: EffectModifier) => void;
  onRemove: () => void;
}

export function ModifierRow({ modifier, readOnly, onChange, onRemove }: ModifierRowProps) {
  const t = useTranslations("effects");
  const id = useId();

  function changeTarget(target: EffectTarget) {
    const ops = ALLOWED_OPS[target];
    const op = ops.includes(modifier.op) ? modifier.op : ops[0];
    onChange({ target, op, value: op === modifier.op ? modifier.value : defaultValue(op) });
  }

  function changeOp(op: EffectOp) {
    onChange({
      ...modifier,
      op,
      value: defaultValue(op),
      condition: op === "delta" ? modifier.condition : undefined,
    });
  }

  return (
    <div
      className="grid grid-cols-2 gap-2 rounded-md border border-border p-2 sm:grid-cols-[1.6fr_0.9fr_0.8fr_1.2fr_auto] sm:items-end"
      data-testid="modifier-row"
    >
      <label className="flex flex-col gap-1 text-xs text-muted-foreground" htmlFor={`${id}-target`}>
        {t("target")}
        <select
          id={`${id}-target`}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
          value={modifier.target}
          disabled={readOnly}
          onChange={(e) => changeTarget(e.target.value as EffectTarget)}
        >
          {TARGET_GROUPS.map((group) => (
            <optgroup key={group.key} label={t(`targetGroups.${group.key}`)}>
              {group.targets.map((target) => (
                <option key={target} value={target}>
                  {t(`targets.${target}`)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted-foreground" htmlFor={`${id}-op`}>
        {t("op")}
        <select
          id={`${id}-op`}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
          value={modifier.op}
          disabled={readOnly}
          onChange={(e) => changeOp(e.target.value as EffectOp)}
        >
          {ALLOWED_OPS[modifier.target].map((op) => (
            <option key={op} value={op}>
              {t(`ops.${op}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted-foreground" htmlFor={`${id}-value`}>
        {t("amount")}
        {modifier.op === "factor" ? (
          <select
            id={`${id}-value`}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            value={String(modifier.value)}
            disabled={readOnly}
            onChange={(e) => onChange({ ...modifier, value: Number(e.target.value) })}
          >
            {FACTOR_CHOICES.map((f) => (
              <option key={f} value={String(f)}>
                {factorLabel(f)}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={`${id}-value`}
            type="number"
            inputMode="numeric"
            step={1}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            value={Number.isFinite(modifier.value) ? modifier.value : ""}
            disabled={readOnly}
            onChange={(e) =>
              onChange({
                ...modifier,
                value: e.target.value === "" ? 0 : Math.trunc(Number(e.target.value)),
              })
            }
          />
        )}
      </label>

      <label
        className="flex flex-col gap-1 text-xs text-muted-foreground"
        htmlFor={`${id}-condition`}
      >
        {t("condition")}
        <input
          id={`${id}-condition`}
          type="text"
          maxLength={40}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground disabled:opacity-50"
          placeholder={t("conditionPlaceholder")}
          value={modifier.condition ?? ""}
          disabled={readOnly || modifier.op !== "delta"}
          title={t("conditionHint")}
          onChange={(e) => onChange({ ...modifier, condition: e.target.value || undefined })}
        />
      </label>

      {!readOnly && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="justify-self-end"
          onClick={onRemove}
          aria-label={t("removeModifier")}
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      )}
    </div>
  );
}
