"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { MagicEffectBadges } from "@/components/shared/magic-effect-badges";
import type { CharacterEquipmentWithDetails } from "@/lib/supabase/types";
import type { ConsumableType } from "@/lib/rules/consumables";

interface UseConsumableDialogProps {
  item: CharacterEquipmentWithDetails;
  consumableType: ConsumableType;
  hpCurrent: number;
  hpMax: number;
  onUse: (result: { hpHealed?: number; chargesUsed?: number }) => void;
  onCancel: () => void;
}

export function UseConsumableDialog({
  item,
  consumableType,
  hpCurrent,
  hpMax,
  onUse,
  onCancel,
}: UseConsumableDialogProps) {
  const t = useTranslations("equipment");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const itemName = item.custom_label?.replace(/\s*\([^)]+\)\s*$/, "") ?? "";
  const fx = item.magic_effects;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onCancel}
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
      data-testid="use-consumable-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consumable-dialog-title"
    >
      <div
        className="mx-4 flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="consumable-dialog-title" className="font-heading text-xl text-primary">
          {itemName}
        </h3>

        {fx && <MagicEffectBadges effects={fx} />}

        {consumableType === "potion" && (
          <PotionContent
            hpCurrent={hpCurrent}
            hpMax={hpMax}
            inputRef={inputRef}
            onUse={onUse}
            onCancel={onCancel}
            t={t}
          />
        )}
        {consumableType === "scroll" && <ScrollContent onUse={onUse} onCancel={onCancel} t={t} />}
        {consumableType === "charged" && (
          <ChargedContent fx={fx} inputRef={inputRef} onUse={onUse} onCancel={onCancel} t={t} />
        )}
      </div>
    </div>
  );
}

// ─── Potion ────────────────────────────────────────────────────────

function PotionContent({
  hpCurrent,
  hpMax,
  inputRef,
  onUse,
  onCancel,
  t,
}: {
  hpCurrent: number;
  hpMax: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onUse: (result: { hpHealed?: number }) => void;
  onCancel: () => void;
  t: ReturnType<typeof useTranslations<"equipment">>;
}) {
  const [hpValue, setHpValue] = useState("");

  const amount = parseInt(hpValue, 10);
  const isValid = !isNaN(amount) && amount > 0;

  function handleSubmit() {
    if (isValid) onUse({ hpHealed: amount });
  }

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("useHpHealed")}</label>
        <input
          ref={inputRef}
          type="number"
          min="1"
          value={hpValue}
          onChange={(e) => setHpValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          data-testid="consumable-hp-input"
        />
        <p className="text-xs text-muted-foreground">
          {t("useCurrentHp", { current: hpCurrent, max: hpMax })}
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} data-testid="consumable-cancel">
          {t("useCancel")}
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid} data-testid="consumable-confirm">
          {t("usePotion")}
        </Button>
      </div>
    </>
  );
}

// ─── Scroll ────────────────────────────────────────────────────────

function ScrollContent({
  onUse,
  onCancel,
  t,
}: {
  onUse: (result: { hpHealed?: number; chargesUsed?: number }) => void;
  onCancel: () => void;
  t: ReturnType<typeof useTranslations<"equipment">>;
}) {
  return (
    <>
      <p className="text-sm text-muted-foreground">{t("useScrollConfirm")}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} data-testid="consumable-cancel">
          {t("useCancel")}
        </Button>
        <Button onClick={() => onUse({})} data-testid="consumable-confirm">
          {t("useScroll")}
        </Button>
      </div>
    </>
  );
}

// ─── Charged (Wand/Rod/Staff) ──────────────────────────────────────

function ChargedContent({
  fx,
  inputRef,
  onUse,
  onCancel,
  t,
}: {
  fx: CharacterEquipmentWithDetails["magic_effects"];
  inputRef: React.RefObject<HTMLInputElement | null>;
  onUse: (result: { chargesUsed?: number }) => void;
  onCancel: () => void;
  t: ReturnType<typeof useTranslations<"equipment">>;
}) {
  const [chargeValue, setChargeValue] = useState("1");
  const currentCharges = fx?.current_charges ?? 0;
  const maxCharges = fx?.max_charges ?? 0;

  const amount = parseInt(chargeValue, 10);
  const isValid = !isNaN(amount) && amount > 0 && amount <= currentCharges;

  function handleSubmit() {
    if (isValid) onUse({ chargesUsed: amount });
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {t("useChargesRemaining", { current: currentCharges, max: maxCharges })}
      </p>
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("useChargesUsed")}</label>
        <input
          ref={inputRef}
          type="number"
          min="1"
          max={currentCharges}
          value={chargeValue}
          onChange={(e) => setChargeValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          data-testid="consumable-charges-input"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} data-testid="consumable-cancel">
          {t("useCancel")}
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid} data-testid="consumable-confirm">
          {t("useCharged")}
        </Button>
      </div>
    </>
  );
}
