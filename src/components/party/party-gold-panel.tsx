"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

export interface ActiveCharacterPurse {
  id: string;
  name: string;
  gold_pp: number;
  gold_gp: number;
  gold_ep: number;
  gold_sp: number;
  gold_cp: number;
}

interface PartyGoldPanelProps {
  gold: PartyLootGoldRow;
  userId: string;
  characters: CharacterOption[];
  activeCharacter?: ActiveCharacterPurse | null;
}

type RemoveReason = "expense" | "theft" | "other";

export function PartyGoldPanel({
  gold,
  userId,
  characters,
  activeCharacter = null,
}: PartyGoldPanelProps) {
  const t = useTranslations("party");
  const supabase = createClient();
  const router = useRouter();
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

  const characterPurse: CoinPurse | null = activeCharacter
    ? {
        pp: activeCharacter.gold_pp,
        gp: activeCharacter.gold_gp,
        ep: activeCharacter.gold_ep,
        sp: activeCharacter.gold_sp,
        cp: activeCharacter.gold_cp,
      }
    : null;

  const logUser = activeCharacter?.name ?? "Unknown";

  async function handleAddGold() {
    const hasAny = COINS.some((c) => addAmounts[c.key] > 0);
    if (!hasAny || isSaving || !activeCharacter || !characterPurse) return;

    const exceeds = COINS.some((c) => addAmounts[c.key] > characterPurse[c.key]);
    if (exceeds) {
      setSaveError(t("insufficientCharacterGold"));
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const { error } = await supabase.rpc("give_character_gold_to_party", {
        p_character_id: activeCharacter.id,
        p_pp: addAmounts.pp,
        p_gp: addAmounts.gp,
        p_ep: addAmounts.ep,
        p_sp: addAmounts.sp,
        p_cp: addAmounts.cp,
      });

      if (error) {
        setSaveError(
          error.message.includes("insufficient") ? t("insufficientCharacterGold") : error.message
        );
        return;
      }

      const parts = COINS.filter((c) => addAmounts[c.key] > 0).map(
        (c) => `${addAmounts[c.key]} ${c.label}`
      );

      await supabase.from("party_loot_log").insert({
        action: "add_gold",
        user_id: userId,
        character_id: activeCharacter.id,
        details: { coins: { ...addAmounts }, amount: parts.join(", "), actor: logUser },
      });

      setAddAmounts({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
      setShowAddDialog(false);
      router.refresh();
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

      setRemoveAmounts({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
      setRemoveReason("expense");
      setShowRemoveDialog(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  function handleDistributed() {
    setShowDistributeDialog(false);
    router.refresh();
  }

  return (
    <GlassCard hover={false} data-testid="party-gold-panel">
      <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("goldPool")}
      </h3>

      {/* Coin display */}
      <div
        className="mb-2 grid grid-cols-2 gap-2 text-center sm:grid-cols-4 sm:gap-1"
        data-testid="party-gold-coins"
      >
        {COINS.map((coin) => (
          <div
            key={coin.key}
            className={`relative overflow-hidden rounded-md border px-1 py-1.5 ${coin.color}`}
          >
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-15"
              aria-hidden="true"
            >
              <Image src={coin.icon} alt="" width={36} height={36} />
            </div>
            <div className="relative text-[10px] font-medium opacity-70 md:text-xs">
              {coin.label}
            </div>
            <div
              className="relative font-mono text-lg font-bold"
              data-testid={`party-gold-${coin.key}`}
            >
              {gold[coin.key]}
            </div>
          </div>
        ))}
      </div>

      {/* Total in GP */}
      <div className="mb-3 rounded-md border border-primary/20 bg-primary/5 py-1.5 text-center text-sm">
        {t("totalGP")}: <span className="font-mono font-bold text-primary">{totalGP}</span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 sm:flex-row">
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
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent showCloseButton={false} data-testid="party-add-gold-dialog">
          <DialogTitle className="font-heading text-lg text-primary">
            {t("addGoldTitle")}
          </DialogTitle>
          {activeCharacter && characterPurse ? (
            <>
              <p className="text-xs text-muted-foreground">
                {t("addGoldSubtitle", { name: activeCharacter.name })}
              </p>
              <div
                className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                data-testid="party-add-gold-purse"
              >
                {COINS.map((coin) => {
                  const available = characterPurse[coin.key];
                  const current = addAmounts[coin.key];
                  return (
                    <div key={coin.key} className="text-center">
                      <label className="text-[10px] text-muted-foreground md:text-xs">
                        {coin.label}{" "}
                        <span className="opacity-70" data-testid={`party-add-gold-${coin.key}-max`}>
                          / {available}
                        </span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={available}
                        value={current || ""}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10) || 0;
                          setAddAmounts((prev) => ({
                            ...prev,
                            [coin.key]: Math.max(0, Math.min(available, n)),
                          }));
                        }}
                        disabled={available === 0}
                        className="w-full rounded-md border border-border bg-background px-1 py-1 text-center text-sm disabled:opacity-50"
                        aria-label={`${coin.label} (max ${available})`}
                        data-testid={`party-add-gold-${coin.key}`}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground" data-testid="party-add-gold-no-character">
              {t("addGoldNeedsCharacter")}
            </p>
          )}
          {saveError && <p className="text-xs text-red-400">{saveError}</p>}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleAddGold}
              disabled={isSaving || !activeCharacter}
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
        </DialogContent>
      </Dialog>

      {/* Remove Gold dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent showCloseButton={false} data-testid="party-remove-gold-dialog">
          <DialogTitle className="font-heading text-lg text-primary">
            {t("removeGoldTitle")}
          </DialogTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COINS.map((coin) => (
              <div key={coin.key} className="text-center">
                <label className="text-[10px] md:text-xs text-muted-foreground">{coin.label}</label>
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
        </DialogContent>
      </Dialog>

      {/* Distribute Gold dialog */}
      {showDistributeDialog && (
        <DistributeGoldDialog
          gold={gold}
          characters={characters}
          userId={userId}
          activeCharacterName={activeCharacter?.name ?? ""}
          onDistribute={handleDistributed}
          onClose={() => setShowDistributeDialog(false)}
        />
      )}
    </GlassCard>
  );
}
