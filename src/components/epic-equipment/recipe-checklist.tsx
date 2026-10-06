"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Coins, Minus, PackagePlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { localized } from "@/lib/utils/localize";
import { purseTotalInCP, type CoinPurse } from "@/lib/rules/equipment";
import { isRecipeComplete, type CraftableStock } from "@/lib/rules/sprocket-devices";

/** −/+ zum Korrigieren eines Bestands. */
export function StockControls({
  testId,
  count,
  disabled,
  onAdjust,
}: {
  testId: string;
  count: number;
  disabled?: boolean;
  onAdjust: (delta: number) => void;
}) {
  const t = useTranslations("epic");
  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        disabled={disabled || count <= 0}
        onClick={() => onAdjust(-1)}
        aria-label={t("stockDecrease")}
        data-testid={`${testId}-decrease`}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        disabled={disabled}
        onClick={() => onAdjust(1)}
        aria-label={t("stockIncrease")}
        data-testid={`${testId}-increase`}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface RecipeChecklistProps {
  testId: string;
  stock: CraftableStock;
  /** Börse für Rezepte mit Kosten. */
  purse: CoinPurse;
  locale: string;
  isOwner: boolean;
  disabled?: boolean;
  onToggle: (componentKey: string) => void;
  onCraft: () => void;
}

/**
 * Aufklappbares Rezept: Komponenten zum Abhaken (bleiben gespeichert),
 * Kosten aus der Börse, Ertrag und „Herstellen“ – erst aktiv, wenn alles da ist.
 */
export function RecipeChecklist({
  testId,
  stock,
  purse,
  locale,
  isOwner,
  disabled,
  onToggle,
  onCraft,
}: RecipeChecklistProps) {
  const t = useTranslations("epic");
  const [open, setOpen] = useState(false);
  const idPrefix = useId();
  const recipe = stock.recipe;
  if (!recipe) return null;

  const collected = stock.collected ?? [];
  const done = recipe.components.filter((c) => collected.includes(c.key)).length;
  const availableCp = purseTotalInCP(purse);
  const affordable = !recipe.cost_gp || availableCp >= recipe.cost_gp * 100;
  const canCraft = isRecipeComplete(stock) && affordable;
  const availableGp = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
    availableCp / 100
  );

  return (
    <div className="mt-1.5" data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
        aria-expanded={open}
        data-testid={`${testId}-toggle`}
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {t("recipeProgress", { done, total: recipe.components.length })}
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-1.5 rounded-md bg-background/30 p-2.5">
          {recipe.components.map((component) => {
            const id = `${idPrefix}-${component.key}`;
            return (
              <label key={component.key} htmlFor={id} className="flex items-start gap-2 text-sm">
                <input
                  id={id}
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  checked={collected.includes(component.key)}
                  disabled={!isOwner || disabled}
                  onChange={() => onToggle(component.key)}
                  data-testid={`${testId}-component-${component.key}`}
                />
                <span>
                  {localized(component.name, component.name_en, locale)}
                  <span className="text-muted-foreground">
                    {" – "}
                    {localized(component.source, component.source_en, locale)}
                  </span>
                </span>
              </label>
            );
          })}

          {recipe.cost_gp != null && recipe.cost_gp > 0 && (
            <p
              className={`flex items-center gap-1.5 text-sm ${affordable ? "" : "text-destructive"}`}
              data-testid={`${testId}-cost`}
            >
              <Coins className="h-4 w-4 shrink-0 text-amber-400" />
              {t("recipeCost", { cost: recipe.cost_gp, available: availableGp })}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {t("recipeYield", {
                count: recipe.yield,
                duration: localized(recipe.duration, recipe.duration_en, locale),
              })}
            </span>
            {isOwner && (
              <Button
                size="xs"
                onClick={onCraft}
                disabled={!canCraft || disabled}
                data-testid={`${testId}-craft`}
              >
                <PackagePlus className="mr-1 h-3.5 w-3.5" />
                {t("recipeCraft")}
              </Button>
            )}
          </div>
          {isOwner && !affordable && (
            <p className="text-xs text-destructive">{t("recipeNotEnoughMoney")}</p>
          )}
        </div>
      )}
    </div>
  );
}
