"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { createNotification } from "@/lib/notifications";
import { COINS } from "@/components/party/party-constants";
import type { CoinPurse } from "@/lib/rules/equipment";

interface TradeCharacter {
  id: string;
  name: string;
  user_id: string;
}

interface SendGoldDialogProps {
  senderCharacterId: string;
  senderCharacterName: string;
  coinPurse: CoinPurse;
  characters: TradeCharacter[];
  onSend: (deducted: CoinPurse) => void;
  onClose: () => void;
}

export function SendGoldDialog({
  senderCharacterId,
  senderCharacterName,
  coinPurse,
  characters,
  onSend,
  onClose,
}: SendGoldDialogProps) {
  const t = useTranslations("playMode");
  const supabase = createClient();
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [amounts, setAmounts] = useState<CoinPurse>({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const hasAny = COINS.some((c) => amounts[c.key] > 0);
  const exceeds = COINS.some((c) => amounts[c.key] > coinPurse[c.key]);

  async function handleSend() {
    if (!selectedCharacterId || !hasAny || exceeds || isSaving) return;

    setIsSaving(true);
    setError("");

    try {
      // Add to recipient FIRST (safer: duplicate gold > lost gold on partial failure)
      const { error: addError } = await supabase.rpc("add_character_gold", {
        p_character_id: selectedCharacterId,
        p_pp: amounts.pp,
        p_gp: amounts.gp,
        p_ep: amounts.ep,
        p_sp: amounts.sp,
        p_cp: amounts.cp,
      });

      if (addError) {
        setError(addError.message);
        return;
      }

      // Deduct from sender SECOND
      const { error: deductError } = await supabase
        .from("characters")
        .update({
          gold_pp: coinPurse.pp - amounts.pp,
          gold_gp: coinPurse.gp - amounts.gp,
          gold_ep: coinPurse.ep - amounts.ep,
          gold_sp: coinPurse.sp - amounts.sp,
          gold_cp: coinPurse.cp - amounts.cp,
        })
        .eq("id", senderCharacterId);

      if (deductError) {
        setError(deductError.message);
        return;
      }

      // Notification for recipient
      const recipient = characters.find((c) => c.id === selectedCharacterId);
      if (recipient) {
        await createNotification(supabase, {
          userId: recipient.user_id,
          characterId: selectedCharacterId,
          type: "trade_gold_received",
          details: {
            ...amounts,
            from_character: senderCharacterName,
            character_name: recipient.name,
          },
        });
      }

      onSend(amounts);
    } finally {
      setIsSaving(false);
    }
  }

  const availableCharacters = characters.filter((c) => c.id !== senderCharacterId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-gold-dialog-title"
      tabIndex={-1}
      data-testid="play-send-gold-dialog"
    >
      <div
        className="mx-4 flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-card p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="send-gold-dialog-title" className="font-heading text-lg text-primary">
          {t("sendGoldTitle")}
        </h3>

        {/* Character selector */}
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">{t("toCharacter")}</label>
          <select
            value={selectedCharacterId}
            onChange={(e) => setSelectedCharacterId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            data-testid="play-send-gold-character"
          >
            <option value="">{t("selectCharacter")}</option>
            {availableCharacters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Coin inputs */}
        <div className="grid grid-cols-4 gap-2">
          {COINS.map((coin) => (
            <div key={coin.key} className="text-center">
              <label className="text-[10px] text-muted-foreground">
                {coin.label} ({coinPurse[coin.key]})
              </label>
              <input
                type="number"
                min="0"
                max={coinPurse[coin.key]}
                value={amounts[coin.key] || ""}
                onChange={(e) =>
                  setAmounts((prev) => ({
                    ...prev,
                    [coin.key]: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className={`w-full rounded-md border bg-background px-1 py-1 text-center text-sm ${
                  amounts[coin.key] > coinPurse[coin.key] ? "border-red-500" : "border-border"
                }`}
                aria-label={coin.label}
                data-testid={`play-send-gold-${coin.key}`}
              />
            </div>
          ))}
        </div>

        {exceeds && (
          <p className="text-xs text-red-400" data-testid="play-send-gold-error">
            {t("insufficientFunds")}
          </p>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={handleSend}
            disabled={!selectedCharacterId || !hasAny || exceeds || isSaving}
            data-testid="play-send-gold-confirm"
          >
            {isSaving ? t("saving") : t("sendConfirm")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={onClose}
            data-testid="play-send-gold-cancel"
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
