"use client";

import { memo, useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getTurnTarget,
  resolveTurnAttempt,
  getPaladinTurnLevel,
  UNDEAD_TYPES,
  UNDEAD_LABELS,
  type UndeadType,
  type TurnTableResult,
} from "@/lib/rules/turn-undead";
import { localized } from "@/lib/utils/localize";

interface PlayTurnUndeadPanelProps {
  clericLevel: number;
  isPaladin?: boolean;
  isEvil?: boolean;
}

function formatResult(result: TurnTableResult): string {
  if (result === null) return "—";
  if (result === "T") return "T";
  if (result === "D") return "D";
  if (result === "D*") return "D*";
  return String(result);
}

function rollDice(sides: number, count: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

function PlayTurnUndeadPanelInner({
  clericLevel,
  isPaladin = false,
  isEvil = false,
}: PlayTurnUndeadPanelProps) {
  const t = useTranslations("playMode");
  const locale = useLocale();
  const [selectedUndead, setSelectedUndead] = useState<UndeadType>("skeleton");
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    result: string;
    affectedHD: number;
    extraAffected: number;
    targetNeeded: TurnTableResult;
    d20Roll: number;
  } | null>(null);

  const effectiveLevel = isPaladin ? getPaladinTurnLevel(clericLevel) : clericLevel;

  const target = useMemo(
    () => getTurnTarget(selectedUndead, effectiveLevel),
    [selectedUndead, effectiveLevel]
  );

  function handleTurn() {
    const d20 = rollDice(20, 1);
    const affectedHD = rollDice(6, 2);
    const extra = rollDice(4, 2);
    const result = resolveTurnAttempt(
      effectiveLevel,
      selectedUndead,
      d20,
      affectedHD,
      isEvil,
      extra
    );
    setLastResult({ ...result, d20Roll: d20 });
  }

  if (effectiveLevel <= 0) return null;

  const undeadLabel = localized(
    UNDEAD_LABELS[selectedUndead].name,
    UNDEAD_LABELS[selectedUndead].name_en,
    locale
  );

  return (
    <GlassCard className="flex flex-col gap-4" data-testid="turn-undead-panel">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg text-primary">
          {isEvil ? t("commandUndead") : t("turnUndead")}
        </h3>
        <Badge variant="secondary" data-testid="turn-undead-level">
          {t("level")} {effectiveLevel}
          {isPaladin && ` (Paladin ${clericLevel})`}
        </Badge>
      </div>

      {/* Undead type selector */}
      <div className="flex flex-col gap-2">
        <label htmlFor="undead-select" className="text-sm text-muted-foreground">
          {t("undeadType")}
        </label>
        <select
          id="undead-select"
          value={selectedUndead}
          onChange={(e) => {
            setSelectedUndead(e.target.value as UndeadType);
            setLastResult(null);
          }}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          data-testid="undead-type-select"
        >
          {UNDEAD_TYPES.map((type) => (
            <option key={type} value={type}>
              {localized(UNDEAD_LABELS[type].name, UNDEAD_LABELS[type].name_en, locale)} (
              {UNDEAD_LABELS[type].hd} HD)
            </option>
          ))}
        </select>
      </div>

      {/* Target info */}
      <div className="rounded-md bg-muted/50 p-3 text-sm">
        <span className="text-muted-foreground">{t("needed")}: </span>
        <span className="font-medium">
          {target === null && t("cannotTurn")}
          {target === "T" && t("autoTurn")}
          {target === "D" && t("autoDestroy")}
          {target === "D*" && t("destroyExtra")}
          {typeof target === "number" && `${target}+ ${t("onD20")}`}
        </span>
      </div>

      {/* Turn button */}
      <Button
        onClick={handleTurn}
        disabled={target === null}
        className="w-full"
        data-testid="turn-undead-button"
      >
        {isEvil ? t("commandButton") : t("turnButton")}
      </Button>

      {/* Result */}
      {lastResult && (
        <div
          className={`rounded-md p-3 text-sm ${
            lastResult.success ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"
          }`}
          data-testid="turn-undead-result"
        >
          {lastResult.success ? (
            <>
              {typeof lastResult.targetNeeded === "number" && (
                <div className="text-xs text-muted-foreground">
                  d20: {lastResult.d20Roll} (≥ {lastResult.targetNeeded})
                </div>
              )}
              <div className="font-medium">
                {lastResult.affectedHD} HD {undeadLabel}{" "}
                {lastResult.result === "destroyed"
                  ? t("destroyed")
                  : lastResult.result === "commanded"
                    ? t("commanded")
                    : t("turned")}
                !
              </div>
              {lastResult.extraAffected > 0 && (
                <div className="text-xs">+{lastResult.extraAffected} extra (D*)</div>
              )}
            </>
          ) : (
            <div className="font-medium">
              {t("failed")}
              {typeof lastResult.targetNeeded === "number" && (
                <span className="text-xs text-muted-foreground">
                  {" "}
                  (d20: {lastResult.d20Roll}, {t("needed").toLowerCase()} {lastResult.targetNeeded}
                  +)
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reference table */}
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          {t("referenceTable")}
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5">
          {UNDEAD_TYPES.map((type) => {
            const res = getTurnTarget(type, effectiveLevel);
            return (
              <div
                key={type}
                className={`flex justify-between ${type === selectedUndead ? "font-medium text-primary" : "text-muted-foreground"}`}
              >
                <span>
                  {localized(UNDEAD_LABELS[type].name, UNDEAD_LABELS[type].name_en, locale)}
                </span>
                <span>{formatResult(res)}</span>
              </div>
            );
          })}
        </div>
      </details>
    </GlassCard>
  );
}

export const PlayTurnUndeadPanel = memo(PlayTurnUndeadPanelInner);
