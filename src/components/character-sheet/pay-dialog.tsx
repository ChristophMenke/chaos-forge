"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculatePayment, purseTotalInCP, type CoinPurse } from "@/lib/rules/equipment";

interface PayDialogProps {
  purse: CoinPurse;
  onPay: (remaining: CoinPurse) => void;
  onClose: () => void;
}

export function PayDialog({ purse, onPay, onClose }: PayDialogProps) {
  const t = useTranslations("sheet");
  const tcom = useTranslations("common");
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const [gpAmount, setGpAmount] = useState(0);
  const [advancedCost, setAdvancedCost] = useState<CoinPurse>({
    pp: 0,
    gp: 0,
    ep: 0,
    sp: 0,
    cp: 0,
  });

  const costInCP = useMemo(() => {
    if (mode === "simple") return gpAmount * 100;
    return purseTotalInCP(advancedCost);
  }, [mode, gpAmount, advancedCost]);

  const result = useMemo(() => {
    if (costInCP <= 0) return null;
    return calculatePayment(purse, costInCP);
  }, [purse, costInCP]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      role="presentation"
      data-testid="pay-dialog"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-dialog-title"
        className="mx-4 flex w-full max-w-md flex-col gap-4 rounded-lg border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="pay-dialog-title" className="font-heading text-xl text-primary">
          {t("payTitle")}
        </h3>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === "simple" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("simple")}
            data-testid="pay-mode-simple"
          >
            {t("paySimple")}
          </Button>
          <Button
            variant={mode === "advanced" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("advanced")}
            data-testid="pay-mode-advanced"
          >
            {t("payAdvanced")}
          </Button>
        </div>

        {/* Simple mode: GP input */}
        {mode === "simple" && (
          <div className="flex flex-col gap-2">
            <Label>{t("payAmountGP")}</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={gpAmount || ""}
              onChange={(e) => setGpAmount(parseFloat(e.target.value) || 0)}
              className="font-mono"
              data-testid="pay-gp-input"
              autoFocus
            />
          </div>
        )}

        {/* Advanced mode: all coin types */}
        {mode === "advanced" && (
          <div className="grid grid-cols-4 gap-2">
            {(["pp", "gp", "sp", "cp"] as const).map((coin) => (
              <div key={coin} className="flex flex-col gap-1">
                <Label className="text-center text-xs">{coin.toUpperCase()}</Label>
                <Input
                  type="number"
                  min={0}
                  value={advancedCost[coin] || ""}
                  onChange={(e) =>
                    setAdvancedCost((prev) => ({
                      ...prev,
                      [coin]: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="text-center font-mono text-sm"
                  data-testid={`pay-${coin}-input`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Current purse */}
        <div className="rounded-md border border-border p-3">
          <p className="mb-1 text-xs text-muted-foreground">{t("currentPurse")}</p>
          <p className="font-mono text-sm">
            {purse.pp} PP, {purse.gp} GP, {purse.ep} EP, {purse.sp} SP, {purse.cp} CP
          </p>
        </div>

        {/* Preview */}
        {result && (
          <div
            className={`rounded-md border p-3 ${result.success ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}
            data-testid="pay-preview"
          >
            {result.success ? (
              <>
                <p className="mb-1 text-xs text-muted-foreground">{t("remainingAfterPay")}</p>
                <p className="font-mono text-sm">
                  {result.remaining.pp} PP, {result.remaining.gp} GP, {result.remaining.ep} EP,{" "}
                  {result.remaining.sp} SP, {result.remaining.cp} CP
                </p>
              </>
            ) : (
              <p className="text-sm text-destructive">
                {t("insufficientFunds", {
                  shortfall: (result.shortfall / 100).toFixed(2),
                })}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} data-testid="pay-cancel">
            {tcom("cancel")}
          </Button>
          <Button
            onClick={() => result?.success && onPay(result.remaining)}
            disabled={!result?.success || costInCP <= 0}
            data-testid="pay-confirm"
          >
            {t("payConfirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}
