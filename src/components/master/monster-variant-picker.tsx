"use client";

/**
 * Post-scan selection UI for multi-variant monster imports.
 *
 * When the scan endpoint returns a `{ variants: [...] }` array with more than
 * one entry (e.g. Orc + Orog, dragon age categories, titan tiers), the user
 * is presented with this picker to:
 *   1. Check which variants should actually be imported
 *   2. Decide whether they become independent monsters or are linked as
 *      parent + children via `variant_of_id`
 *
 * Single-variant responses skip the picker entirely and flow straight into
 * the `MonsterForm`.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ScannedMonsterVariant } from "@/lib/scan/monster-scan-prompt";

export type VariantStrategy = "separate" | "parent-child";

export interface MonsterVariantPickerProps {
  variants: ScannedMonsterVariant[];
  /** User confirms selection. Receives the picked variants (in original order)
   *  plus the chosen linkage strategy. */
  onImport: (picked: ScannedMonsterVariant[], strategy: VariantStrategy) => void;
  onCancel: () => void;
}

export function MonsterVariantPicker({ variants, onImport, onCancel }: MonsterVariantPickerProps) {
  const t = useTranslations("master");
  const [selected, setSelected] = useState<Set<number>>(new Set(variants.map((_, i) => i)));
  const [strategy, setStrategy] = useState<VariantStrategy>(
    variants.length > 1 ? "parent-child" : "separate"
  );

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function handleImport() {
    const picked = variants.filter((_, i) => selected.has(i));
    if (picked.length === 0) return;
    onImport(picked, strategy);
  }

  return (
    <div className="space-y-4" data-testid="monster-variant-picker">
      <div>
        <h3 className="text-sm font-medium">
          {t("variantPickerTitle", { count: variants.length })}
        </h3>
        <p className="text-xs text-muted-foreground">{t("variantPickerSubtitle")}</p>
      </div>

      {/* Variant list */}
      <div className="space-y-2">
        {variants.map((v, i) => {
          const checked = selected.has(i);
          const displayName = v.variant_name ?? v.name_en ?? v.name;
          return (
            <label
              key={i}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/50 bg-background/20 p-3 transition-colors hover:bg-background/40"
              data-testid={`monster-variant-picker-item-${i}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(i)}
                className="mt-0.5 h-4 w-4"
              />
              <div className="flex-1 text-sm">
                <div className="font-medium">{displayName}</div>
                <div className="text-xs text-muted-foreground">
                  {t("monsterStatLine", {
                    hd: v.hit_dice,
                    ac: v.ac,
                    thac0: v.thac0,
                    damage: v.damage,
                  })}
                  {v.xp_value > 0 ? `, ${v.xp_value} ${t("monsterXP")}` : ""}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* Linkage strategy (only relevant when ≥ 2 variants selected) */}
      {selected.size >= 2 && (
        <fieldset className="space-y-2 rounded-lg border border-border/50 p-3">
          <legend className="text-xs text-muted-foreground">{t("variantPickerLinkage")}</legend>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="variant-strategy"
              value="parent-child"
              checked={strategy === "parent-child"}
              onChange={() => setStrategy("parent-child")}
              data-testid="monster-variant-picker-strategy-parent-child"
            />
            <span>
              <span className="font-medium">{t("variantPickerParentChild")}</span> —{" "}
              {t("variantPickerParentChildDesc")}
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="variant-strategy"
              value="separate"
              checked={strategy === "separate"}
              onChange={() => setStrategy("separate")}
              data-testid="monster-variant-picker-strategy-separate"
            />
            <span>
              <span className="font-medium">{t("variantPickerSeparate")}</span> —{" "}
              {t("variantPickerSeparateDesc")}
            </span>
          </label>
        </fieldset>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          data-testid="monster-variant-picker-cancel"
        >
          {t("cancel")}
        </Button>
        <Button
          type="button"
          onClick={handleImport}
          disabled={selected.size === 0}
          data-testid="monster-variant-picker-import"
        >
          {selected.size === 0
            ? t("variantPickerSelectAtLeast")
            : t("variantPickerImport", { count: selected.size })}
        </Button>
      </div>
    </div>
  );
}
