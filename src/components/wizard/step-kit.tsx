"use client";

import { useTranslations, useLocale } from "next-intl";
import { localized } from "@/lib/utils/localize";
import { KITS } from "@/lib/rules/kits";
import type { WizardState } from "./wizard-types";

interface StepKitProps {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}

export function StepKit({ state, onChange }: StepKitProps) {
  const t = useTranslations("wizard");
  const locale = useLocale();

  const availableKits = Object.values(KITS).filter((kit) => state.classIds.includes(kit.classId));

  if (availableKits.length === 0) {
    return (
      <div className="text-center text-muted-foreground" data-testid="no-kits-available">
        <p>{t("noKitsAvailable")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="step-kit">
      <p className="text-sm text-muted-foreground">{t("kitDescription")}</p>

      <button
        type="button"
        className={`rounded-lg border p-4 text-left transition-all ${
          state.kit === null
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50"
        }`}
        onClick={() => onChange({ kit: null })}
        data-testid="kit-option-none"
      >
        <div className="font-heading text-lg">{t("noKit")}</div>
        <div className="text-sm text-muted-foreground">{t("noKitDesc")}</div>
      </button>

      {availableKits.map((kit) => (
        <button
          key={kit.id}
          type="button"
          className={`rounded-lg border p-4 text-left transition-all ${
            state.kit === kit.id
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
          onClick={() => onChange({ kit: kit.id })}
          data-testid={`kit-option-${kit.id}`}
        >
          <div className="font-heading text-lg">{localized(kit.name, kit.name_en, locale)}</div>
          <ul className="mt-2 flex flex-col gap-1">
            {kit.abilities.map((ability, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {localized(ability.name, ability.name_en, locale)}
                </span>
                {" — "}
                {localized(ability.description, ability.description_en, locale)}
              </li>
            ))}
          </ul>
          {(kit.maxArmorAC != null || kit.armorSpellFailure != null) && (
            <div className="mt-2 flex flex-wrap gap-2" data-testid={`kit-restrictions-${kit.id}`}>
              {kit.maxArmorAC != null && (
                <span className="inline-block rounded-md bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">
                  {kit.maxArmorAC === 10
                    ? t("kitNoArmor")
                    : kit.maxArmorAC === 8
                      ? t("kitMaxArmor", {
                          armorName: locale === "de" ? "Leder" : "Leather",
                          ac: kit.maxArmorAC,
                        })
                      : kit.maxArmorAC === 5
                        ? t("kitMaxArmor", {
                            armorName: locale === "de" ? "Kettenhemd" : "Chain Mail",
                            ac: kit.maxArmorAC,
                          })
                        : t("kitMaxArmor", {
                            armorName: `AC ${kit.maxArmorAC}`,
                            ac: kit.maxArmorAC,
                          })}
                </span>
              )}
              {kit.armorSpellFailure != null && (
                <span className="inline-block rounded-md bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">
                  {t("kitSpellFailureHint", { percent: kit.armorSpellFailure })}
                </span>
              )}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
