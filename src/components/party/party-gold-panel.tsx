"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { DistributeGoldDialog } from "@/components/party/distribute-gold-dialog";
import { createClient } from "@/lib/supabase/client";
import { purseTotalInCP, type CoinPurse } from "@/lib/rules/equipment";
import { COINS } from "@/components/party/party-constants";
import type { PartyLootGoldRow } from "@/lib/supabase/types";

interface CharacterOption {
  id: string;
  name: string;
  user_id: string;
}

interface PartyGoldPanelProps {
  gold: PartyLootGoldRow;
  userId: string;
  characters: CharacterOption[];
  activeCharacterName?: string;
}

type RemoveReason = "expense" | "theft" | "other";

export function PartyGoldPanel({
  gold: initialGold,
  userId,
  characters,
  activeCharacterName = "",
}: PartyGoldPanelProps) {
  const t = useTranslations("party");
  const supabase = createClient();
  const [gold, setGold] = useState(initialGold);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showDistributeDialog, setShowDistributeDialog] = useState(false);
  const [addAmounts, setAddAmounts] = useState<CoinPurse>({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
  const [removeAmounts, setRemoveAmounts] = useState<CoinPurse>({
    pp: 0,
    gp: 0,
    ep: 0,
    sp: 0,
    cp: 0,
  });
  const [removeReason, setRemoveReason] = useState<RemoveReason>("expense");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const purse: CoinPurse = { pp: gold.pp, gp: gold.gp, ep: gold.ep, sp: gold.sp, cp: gold.cp };
  const totalGP = (purseTotalInCP(purse) / 100).toFixed(1);

  const logUser = activeCharacterName || "Unknown";

  async function handleAddGold() {
    const hasAny = COINS.some((c) => addAmounts[c.key] > 0);
    if (!hasAny || isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const { error } = await supabase.rpc("add_party_gold", {
        p_id: gold.id,
        p_pp: addAmounts.pp,
        p_gp: addAmounts.gp,
        p_ep: addAmounts.ep,
        p_sp: addAmounts.sp,
        p_cp: addAmounts.cp,
      });

      if (error) {
        setSaveError(error.message);
        return;
      }

      const parts = COINS.filter((c) => addAmounts[c.key] > 0).map(
        (c) => `${addAmounts[c.key]} ${c.label}`
      );

      await supabase.from("party_loot_log").insert({
        action: "add_gold",
        user_id: userId,
        details: { coins: { ...addAmounts }, amount: parts.join(", "), actor: logUser },
      });

      setGold({
        ...gold,
        pp: gold.pp + addAmounts.pp,
        gp: gold.gp + addAmounts.gp,
        ep: gold.ep + addAmounts.ep,
        sp: gold.sp + addAmounts.sp,
        cp: gold.cp + addAmounts.cp,
      });
      setAddAmounts({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
      setShowAddDialog(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveGold() {
    const hasAny = COINS.some((c) => removeAmounts[c.key] > 0);
    if (!hasAny || isSaving) return;

    // Check sufficient gold
    const exceeds = COINS.some((c) => removeAmounts[c.key] > gold[c.key]);
    if (exceeds) {
      setSaveError(t("insufficientGold"));
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const { data: success, error } = await supabase.rpc("deduct_party_gold", {
        p_id: gold.id,
        p_pp: removeAmounts.pp,
        p_gp: removeAmounts.gp,
        p_ep: removeAmounts.ep,
        p_sp: removeAmounts.sp,
        p_cp: removeAmounts.cp,
      });

      if (error || !success) {
        setSaveError(t("insufficientGold"));
        return;
      }

      const parts = COINS.filter((c) => removeAmounts[c.key] > 0).map(
        (c) => `${removeAmounts[c.key]} ${c.label}`
      );

      const reasonLabel =
        removeReason === "expense"
          ? t("reasonExpense")
          : removeReason === "theft"
            ? t("reasonTheft")
            : t("reasonOther");

      await supabase.from("party_loot_log").insert({
        action: "remove_gold",
        user_id: userId,
        details: {
          coins: { ...removeAmounts },
          amount: parts.join(", "),
          reason: removeReason,
          reasonLabel,
          actor: logUser,
        },
      });

      setGold({
        ...gold,
        pp: gold.pp - removeAmounts.pp,
        gp: gold.gp - removeAmounts.gp,
        ep: gold.ep - removeAmounts.ep,
        sp: gold.sp - removeAmounts.sp,
        cp: gold.cp - removeAmounts.cp,
      });
      setRemoveAmounts({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
      setRemoveReason("expense");
      setShowRemoveDialog(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handleDistributed(updatedGold: PartyLootGoldRow) {
    setGold(updatedGold);
    setShowDistributeDialog(false);
  }

  return (
    <GlassCard hover={false} data-testid="party-gold-panel">
      <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("goldPool")}
      </h3>

      {/* Coin display */}
      <div className="mb-2 grid grid-cols-5 gap-1 text-center" data-testid="party-gold-coins">
        {COINS.map((coin) => (
          <div key={coin.key} className="rounded-md border border-border px-1 py-1.5">
            <div className="text-[10px] font-medium text-muted-foreground">{coin.label}</div>
            <div className="font-mono text-lg font-bold" data-testid={`party-gold-${coin.key}`}>
              {gold[coin.key]}
            </div>
          </div>
        ))}
      </div>

      {/* Total in GP */}
      <div className="mb-3 text-center text-xs text-muted-foreground">
        {t("totalGP")}: <span className="font-mono font-medium text-primary">{totalGP}</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setShowAddDialog(true)}
          data-testid="party-add-gold-btn"
        >
          {t("addGold")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setShowRemoveDialog(true)}
          data-testid="party-remove-gold-btn"
        >
          {t("removeGold")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setShowDistributeDialog(true)}
          data-testid="party-distribute-gold-btn"
        >
          {t("distributeGold")}
        </Button>
      </div>

      {/* Add Gold dialog */}
      {showAddDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowAddDialog(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowAddDialog(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-gold-dialog-title"
          tabIndex={-1}
          data-testid="party-add-gold-dialog"
        >
          <div
            className="mx-4 flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-card p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="add-gold-dialog-title" className="font-heading text-lg text-primary">
              {t("addGoldTitle")}
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {COINS.map((coin) => (
                <div key={coin.key} className="text-center">
                  <label className="text-[10px] text-muted-foreground">{coin.label}</label>
                  <input
                    type="number"
                    min="0"
                    value={addAmounts[coin.key] || ""}
                    onChange={(e) =>
                      setAddAmounts((prev) => ({
                        ...prev,
                        [coin.key]: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="w-full rounded-md border border-border bg-background px-1 py-1 text-center text-sm"
                    aria-label={coin.label}
                    data-testid={`party-add-gold-${coin.key}`}
                  />
                </div>
              ))}
            </div>
            {saveError && <p className="text-xs text-red-400">{saveError}</p>}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={handleAddGold}
                disabled={isSaving}
                data-testid="party-add-gold-confirm"
              >
                {isSaving ? t("saving") : t("apply")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setShowAddDialog(false)}
                data-testid="party-add-gold-cancel"
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Gold dialog */}
      {showRemoveDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowRemoveDialog(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowRemoveDialog(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-gold-dialog-title"
          tabIndex={-1}
          data-testid="party-remove-gold-dialog"
        >
          <div
            className="mx-4 flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-card p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="remove-gold-dialog-title" className="font-heading text-lg text-primary">
              {t("removeGoldTitle")}
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {COINS.map((coin) => (
                <div key={coin.key} className="text-center">
                  <label className="text-[10px] text-muted-foreground">{coin.label}</label>
                  <input
                    type="number"
                    min="0"
                    value={removeAmounts[coin.key] || ""}
                    onChange={(e) =>
                      setRemoveAmounts((prev) => ({
                        ...prev,
                        [coin.key]: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="w-full rounded-md border border-border bg-background px-1 py-1 text-center text-sm"
                    aria-label={coin.label}
                    data-testid={`party-remove-gold-${coin.key}`}
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t("reason")}</label>
              <select
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value as RemoveReason)}
                className="mt-1 w-full rounded-md border border-input bg-input px-3 py-1.5 text-sm"
                data-testid="party-remove-gold-reason"
              >
                <option value="expense">{t("reasonExpense")}</option>
                <option value="theft">{t("reasonTheft")}</option>
                <option value="other">{t("reasonOther")}</option>
              </select>
            </div>
            {saveError && <p className="text-xs text-red-400">{saveError}</p>}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={handleRemoveGold}
                disabled={isSaving}
                data-testid="party-remove-gold-confirm"
              >
                {isSaving ? t("saving") : t("apply")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setShowRemoveDialog(false)}
                data-testid="party-remove-gold-cancel"
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Distribute Gold dialog */}
      {showDistributeDialog && (
        <DistributeGoldDialog
          gold={gold}
          characters={characters}
          userId={userId}
          activeCharacterName={activeCharacterName}
          onDistribute={handleDistributed}
          onClose={() => setShowDistributeDialog(false)}
        />
      )}
    </GlassCard>
  );
}
