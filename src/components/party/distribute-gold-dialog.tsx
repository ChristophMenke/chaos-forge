"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { createNotification } from "@/lib/notifications";
import { COINS } from "@/components/party/party-constants";
import type { CoinPurse } from "@/lib/rules/equipment";
import type { PartyLootGoldRow } from "@/lib/supabase/types";

interface CharacterOption {
  id: string;
  name: string;
  user_id: string;
}

interface DistributeGoldDialogProps {
  gold: PartyLootGoldRow;
  characters: CharacterOption[];
  userId: string;
  activeCharacterName?: string;
  onDistribute: (updatedGold: PartyLootGoldRow) => void;
  onClose: () => void;
}

export function DistributeGoldDialog({
  gold,
  characters,
  userId,
  activeCharacterName = "",
  onDistribute,
  onClose,
}: DistributeGoldDialogProps) {
  const t = useTranslations("party");
  const supabase = createClient();
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [amounts, setAmounts] = useState<CoinPurse>({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const hasAny = COINS.some((c) => amounts[c.key] > 0);
  const exceeds = COINS.some((c) => amounts[c.key] > gold[c.key]);

  async function handleDistribute() {
    if (!selectedCharacterId || !hasAny || exceeds || isSaving) return;

    setIsSaving(true);
    setError("");

    try {
      // Atomic deduct from party gold via RPC (returns false if insufficient)
      const { data: success, error: deductError } = await supabase.rpc("deduct_party_gold", {
        p_id: gold.id,
        p_pp: amounts.pp,
        p_gp: amounts.gp,
        p_ep: amounts.ep,
        p_sp: amounts.sp,
        p_cp: amounts.cp,
      });

      if (deductError) {
        setError(deductError.message);
        return;
      }

      if (!success) {
        setError(t("insufficientGold"));
        return;
      }

      // Atomic add to character gold via RPC
      const { error: charError } = await supabase.rpc("add_character_gold", {
        p_character_id: selectedCharacterId,
        p_pp: amounts.pp,
        p_gp: amounts.gp,
        p_ep: amounts.ep,
        p_sp: amounts.sp,
        p_cp: amounts.cp,
      });

      if (charError) {
        setError(charError.message);
        return;
      }

      // Log
      const parts = COINS.filter((c) => amounts[c.key] > 0).map(
        (c) => `${amounts[c.key]} ${c.label}`
      );
      await supabase.from("party_loot_log").insert({
        action: "distribute_gold",
        user_id: userId,
        character_id: selectedCharacterId,
        details: { coins: { ...amounts }, amount: parts.join(", "), actor: activeCharacterName },
      });

      // Notification for recipient
      const recipient = characters.find((c) => c.id === selectedCharacterId);
      if (recipient) {
        await createNotification(supabase, {
          userId: recipient.user_id,
          characterId: selectedCharacterId,
          type: "party_gold_received",
          details: { ...amounts, character_name: recipient.name },
        });
      }

      const updatedGold: PartyLootGoldRow = {
        ...gold,
        pp: gold.pp - amounts.pp,
        gp: gold.gp - amounts.gp,
        ep: gold.ep - amounts.ep,
        sp: gold.sp - amounts.sp,
        cp: gold.cp - amounts.cp,
      };
      onDistribute(updatedGold);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="distribute-gold-dialog-title"
      tabIndex={-1}
      data-testid="party-distribute-gold-dialog"
    >
      <div
        className="mx-4 flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-card p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="distribute-gold-dialog-title" className="font-heading text-lg text-primary">
          {t("distributeGoldTitle")}
        </h3>

        {/* Character selector */}
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t("toCharacter")}</label>
          <select
            value={selectedCharacterId}
            onChange={(e) => setSelectedCharacterId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            data-testid="party-distribute-gold-character"
          >
            <option value="">{t("selectCharacter")}</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Coin inputs */}
        <div className="grid grid-cols-5 gap-2">
          {COINS.map((coin) => (
            <div key={coin.key} className="text-center">
              <label className="text-[10px] md:text-xs text-muted-foreground">
                {coin.label} ({gold[coin.key]})
              </label>
              <input
                type="number"
                min="0"
                max={gold[coin.key]}
                value={amounts[coin.key] || ""}
                onChange={(e) =>
                  setAmounts((prev) => ({
                    ...prev,
                    [coin.key]: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className={`w-full rounded-md border bg-background px-1 py-1 text-center text-sm ${
                  amounts[coin.key] > gold[coin.key] ? "border-red-500" : "border-border"
                }`}
                aria-label={coin.label}
                data-testid={`party-distribute-gold-${coin.key}`}
              />
            </div>
          ))}
        </div>

        {exceeds && (
          <p className="text-xs text-red-400" data-testid="party-distribute-gold-error">
            {t("insufficientGold")}
          </p>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={handleDistribute}
            disabled={!selectedCharacterId || !hasAny || exceeds || isSaving}
            data-testid="party-distribute-gold-confirm"
          >
            {isSaving ? t("saving") : t("distribute")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={onClose}
            data-testid="party-distribute-gold-cancel"
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
