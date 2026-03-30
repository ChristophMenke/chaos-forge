"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getMulticlassThac0,
  getMulticlassSaves,
  getMulticlassHpDivisor,
} from "@/lib/rules/multiclass";
import { getDexterityModifiers } from "@/lib/rules/abilities";
import { CLASSES } from "@/lib/rules/classes";
import { getKit, getEffectiveHitDie } from "@/lib/rules/kits";
import type { ClassId } from "@/lib/rules/types";
import type { WizardState } from "./wizard-types";

interface StepCombatProps {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}

export function StepCombat({ state, onChange }: StepCombatProps) {
  const t = useTranslations("wizard");
  const ts = useTranslations("sheet");

  const classEntries = state.classIds.map((id) => ({ classId: id, level: state.level }));
  const thac0 = classEntries.length > 0 ? getMulticlassThac0(classEntries) : 20;
  const saves = classEntries.length > 0 ? getMulticlassSaves(classEntries) : null;
  const dexMods = getDexterityModifiers(state.dex);
  const baseAC = 10 + dexMods.defensiveAdj;
  const hpDivisor = getMulticlassHpDivisor(state.classIds.length);

  return (
    <div className="flex flex-col gap-6" data-testid="wizard-step-combat">
      <p className="text-sm text-muted-foreground">{t("combatHint")}</p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="hp-max">{t("hpLabel")}</Label>
        <Input
          id="hp-max"
          type="number"
          min={1}
          value={state.hpMax}
          onChange={(e) => onChange({ hpMax: Math.max(1, parseInt(e.target.value) || 1) })}
          data-testid="wizard-hp-max"
        />
        {hpDivisor > 1 && (
          <p className="text-xs text-yellow-400" data-testid="wizard-hp-divisor-hint">
            {t("multiclassHpHint", { count: hpDivisor })}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-md border border-border p-3 text-center">
          <div className="text-xs text-muted-foreground">{t("thac0")}</div>
          <div className="font-heading text-2xl text-primary" data-testid="wizard-thac0">
            {thac0}
          </div>
        </div>
        <div className="rounded-md border border-border p-3 text-center">
          <div className="text-xs text-muted-foreground">{t("ac")}</div>
          <div className="font-heading text-2xl text-primary" data-testid="wizard-ac">
            {baseAC}
          </div>
          <div className="text-xs text-muted-foreground">{t("acBase")}</div>
        </div>
        <div className="rounded-md border border-border p-3 text-center">
          <div className="text-xs text-muted-foreground">{t("hp")}</div>
          <div className="font-heading text-2xl text-primary" data-testid="wizard-hp-display">
            {state.hpMax}
          </div>
        </div>
        {state.classIds.length > 0 && (
          <div className="rounded-md border border-border p-3 text-center">
            <div className="text-xs text-muted-foreground">Hit Die</div>
            <div className="font-heading text-2xl text-primary" data-testid="wizard-hit-die">
              {state.classIds
                .map((classId) => {
                  const cls = CLASSES[classId];
                  if (!cls) return null;
                  const effectiveDie = getEffectiveHitDie(cls.hitDie, state.kit);
                  return `d${effectiveDie}`;
                })
                .filter(Boolean)
                .join(" / ")}
            </div>
            {state.kit &&
              (() => {
                const kitDef = getKit(state.kit);
                if (!kitDef?.hitDieOverride) return null;
                return (
                  <div
                    className="text-xs text-yellow-400"
                    data-testid="wizard-kit-hit-die-override"
                  >
                    {t("kitHitDieOverride", { die: kitDef.hitDieOverride })}
                  </div>
                );
              })()}
          </div>
        )}
      </div>

      {saves && (
        <div>
          <h3 className="mb-2 font-heading text-lg">{t("savingThrows")}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              { key: "saveParalyzation", value: saves.paralyzation },
              { key: "saveRod", value: saves.rod },
              { key: "savePetrification", value: saves.petrification },
              { key: "saveBreath", value: saves.breath },
              { key: "saveSpell", value: saves.spell },
            ].map(({ key, value }) => (
              <div key={key} className="rounded-md border border-border p-2 text-center">
                <div className="text-xs text-muted-foreground">{ts(key)}</div>
                <div className="font-mono text-lg" data-testid={`wizard-save-${key}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
