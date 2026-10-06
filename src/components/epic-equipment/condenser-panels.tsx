"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { FlaskConical, Wrench, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { localized } from "@/lib/utils/localize";
import type { CoinPurse } from "@/lib/rules/equipment";
import {
  readOverclockState,
  type NamedStock,
  type OverclockAction,
  type SimpleEffects,
  type StockChange,
} from "@/lib/rules/sprocket-devices";
import { OverclockControls, nextCoolingCheck } from "./overclock-controls";
import { SkillCheckDialog, formatCheck } from "./skill-check-dialog";
import { RecipeChecklist, StockControls } from "./recipe-checklist";

function text(se: Record<string, unknown>, key: string, locale: string): string {
  return localized(
    (se[key] as string | undefined) ?? "",
    se[`${key}_en`] as string | undefined,
    locale
  );
}

/** Übertakten auf der Epic-Seite: Zustand, Wirkung und Bedienung. */
export function OverclockPanel({
  se,
  equipped,
  locale,
  isOwner,
  onAction,
}: {
  se: SimpleEffects;
  equipped: boolean;
  locale: string;
  isOwner: boolean;
  onAction: (action: OverclockAction) => void;
}) {
  const t = useTranslations("epic");
  const overclock = se.overclock as Record<string, unknown>;
  const state = readOverclockState(se);
  const skill = text(overclock, "requires_check", locale);
  const healsPerHour = (overclock.heals_per_hour as number) ?? 0;

  return (
    <>
      <Separator className="my-3" />
      <div
        className={`rounded-lg border p-3 ${
          state.active
            ? "border-amber-500/50 bg-amber-500/10"
            : "border-amber-500/20 bg-amber-500/5"
        }`}
        data-testid="epic-overclock-panel"
      >
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="font-medium text-amber-400">{text(overclock, "name", locale)}</span>
          {state.active && (
            <Badge
              variant="outline"
              className="border-amber-500/50 text-amber-400"
              data-testid="overclock-hour-badge"
            >
              {t("overclockHourLabel", { hour: state.hours + 1 })}
            </Badge>
          )}
        </div>

        {state.active ? (
          <>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                {t("overclockConOverride", { value: overclock.con_override as number })}
              </Badge>
              <Badge variant="outline" className="border-red-500/50 text-red-400">
                {t("overclockPoisonPenalty", { penalty: overclock.poison_save_penalty as number })}
              </Badge>
              <Badge variant="outline" className="border-green-500/50 text-green-400">
                {t("overclockHealing", { hp: healsPerHour })}
              </Badge>
            </div>
            <p className="mt-2 text-sm" data-testid="overclock-next-check">
              {t("overclockNextCooling", { check: nextCoolingCheck(state, skill, null) })}
            </p>
          </>
        ) : state.cooldown ? (
          <p className="mt-1.5 text-sm text-amber-400" data-testid="overclock-cooldown">
            {t("overclockCooldown")}
          </p>
        ) : (
          <div className="mt-1.5">
            <p className="text-sm text-muted-foreground">
              {text(overclock, "description", locale)}
            </p>
            <p className="mt-1 text-xs text-amber-400/70">
              {t("overclockRequiresCheck", { skill })}
            </p>
          </div>
        )}

        {isOwner && !equipped && (
          <p className="mt-2 text-xs text-muted-foreground" data-testid="overclock-not-equipped">
            {t("overclockNotEquipped")}
          </p>
        )}
        {isOwner && (
          <div className="mt-3 flex justify-end">
            <OverclockControls
              state={state}
              skill={skill}
              baseTarget={null}
              healsPerHour={healsPerHour}
              equipped={equipped}
              onAction={onAction}
            />
          </div>
        )}
      </div>
    </>
  );
}

/** Reparatur: Ingenieurskunst − Schadensstufe, optional mit Kupferelixier. */
export function RepairPanel({
  se,
  damageLevel,
  elixir,
  locale,
  isOwner,
  onRepair,
}: {
  se: SimpleEffects;
  damageLevel: number;
  elixir: NamedStock | null;
  locale: string;
  isOwner: boolean;
  onRepair: (input: { useElixir: boolean; success: boolean }) => void;
}) {
  const t = useTranslations("epic");
  const [open, setOpen] = useState(false);
  const [useElixir, setUseElixir] = useState(false);
  const checkboxId = useId();
  const skill = text(se, "repair_skill", locale);
  const time = text(se, "repair_time", locale);
  const bonus = elixir?.bonus ?? 0;
  const elixirCount = elixir?.count ?? 0;
  const modifier = -damageLevel + (useElixir ? bonus : 0);

  function close() {
    setOpen(false);
    setUseElixir(false);
  }

  return (
    <>
      <Separator className="my-3" />
      <div
        className="flex items-start justify-between gap-3 text-sm"
        data-testid="epic-repair-panel"
      >
        <div className="flex items-start gap-2 text-muted-foreground">
          <Wrench className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium text-foreground">{t("repair")}</p>
            <p>{t("repairDescription", { check: formatCheck(skill, -damageLevel), time })}</p>
          </div>
        </div>
        {isOwner && damageLevel > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen(true)}
            data-testid="repair-open"
          >
            {t("repairButton")}
          </Button>
        )}
      </div>

      <SkillCheckDialog
        open={open}
        title={t("repair")}
        check={formatCheck(skill, modifier)}
        onResult={(success) => {
          onRepair({ useElixir, success });
          close();
        }}
        onCancel={close}
      >
        {elixir && (
          <label htmlFor={checkboxId} className="flex items-center gap-2 text-sm">
            <input
              id={checkboxId}
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={useElixir}
              disabled={elixirCount <= 0}
              onChange={(e) => setUseElixir(e.target.checked)}
              data-testid="repair-use-elixir"
            />
            {t("repairUseElixir", {
              name: localized(elixir.name, elixir.name_en, locale),
              bonus,
              count: elixirCount,
            })}
          </label>
        )}
      </SkillCheckDialog>
    </>
  );
}

/** Kupferelixier: Bestand, Korrektur und Rezept. */
export function ElixirStock({
  elixir,
  purse,
  locale,
  isOwner,
  onChange,
}: {
  elixir: NamedStock;
  purse: CoinPurse;
  locale: string;
  isOwner: boolean;
  onChange: (change: StockChange) => void;
}) {
  const t = useTranslations("epic");
  const bonus = elixir.bonus;

  return (
    <>
      <Separator className="my-3" />
      <div data-testid="epic-elixir">
        <div className="flex flex-wrap items-center gap-2">
          <FlaskConical className="h-4 w-4 shrink-0 text-orange-400" />
          <span className="text-sm font-medium">
            {localized(elixir.name, elixir.name_en, locale)}
          </span>
          <Badge variant="outline" className="text-xs" data-testid="epic-elixir-count">
            {elixir.count}×
          </Badge>
          {isOwner && (
            <StockControls
              testId="epic-elixir"
              count={elixir.count}
              onAdjust={(delta) => onChange({ type: "adjust", delta })}
            />
          )}
          {bonus != null && (
            <span className="text-xs text-amber-400/80">{t("elixirBonus", { bonus })}</span>
          )}
        </div>
        <RecipeChecklist
          testId="epic-elixir-recipe"
          stock={elixir}
          purse={purse}
          locale={locale}
          isOwner={isOwner}
          onToggle={(key) => onChange({ type: "toggle", key })}
          onCraft={() => onChange({ type: "craft" })}
        />
      </div>
    </>
  );
}
