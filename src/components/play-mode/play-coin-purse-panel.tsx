"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { PayDialog } from "@/components/character-sheet/pay-dialog";
import { SendGoldDialog } from "./send-gold-dialog";
import { purseTotalInCP, type CoinPurse } from "@/lib/rules/equipment";

interface TradeCharacter {
  id: string;
  name: string;
  user_id: string;
}

interface PlayCoinPursePanelProps {
  characterId: string;
  characterName?: string;
  coinPurse: CoinPurse;
  readOnly: boolean;
  tradeCharacters?: TradeCharacter[];
  onCoinChange: (purse: CoinPurse) => void;
}

export function PlayCoinPursePanel({
  characterId,
  characterName = "",
  coinPurse,
  readOnly,
  tradeCharacters,
  onCoinChange,
}: PlayCoinPursePanelProps) {
  const t = useTranslations("playMode");
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [receiveAmounts, setReceiveAmounts] = useState<CoinPurse>({
    pp: 0,
    gp: 0,
    ep: 0,
    sp: 0,
    cp: 0,
  });

  const totalGP = (purseTotalInCP(coinPurse) / 100).toFixed(1);

  function handlePay(remaining: CoinPurse) {
    onCoinChange(remaining);
    setShowPayDialog(false);
  }

  function handleReceive() {
    const newPurse: CoinPurse = {
      pp: coinPurse.pp + receiveAmounts.pp,
      gp: coinPurse.gp + receiveAmounts.gp,
      ep: coinPurse.ep + receiveAmounts.ep,
      sp: coinPurse.sp + receiveAmounts.sp,
      cp: coinPurse.cp + receiveAmounts.cp,
    };
    onCoinChange(newPurse);
    setShowReceiveDialog(false);
    setReceiveAmounts({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
  }

  function handleGoldSent(deducted: CoinPurse) {
    const newPurse: CoinPurse = {
      pp: coinPurse.pp - deducted.pp,
      gp: coinPurse.gp - deducted.gp,
      ep: coinPurse.ep - deducted.ep,
      sp: coinPurse.sp - deducted.sp,
      cp: coinPurse.cp - deducted.cp,
    };
    onCoinChange(newPurse);
    setShowSendDialog(false);
  }

  const coins = [
    { key: "pp" as const, label: "PP", value: coinPurse.pp },
    { key: "gp" as const, label: "GP", value: coinPurse.gp },
    { key: "ep" as const, label: "EP", value: coinPurse.ep },
    { key: "sp" as const, label: "SP", value: coinPurse.sp },
    { key: "cp" as const, label: "CP", value: coinPurse.cp },
  ];

  const canTrade = !readOnly && tradeCharacters && tradeCharacters.length > 0;

  return (
    <GlassCard hover={false} data-testid="play-coin-purse-panel">
      <h3 className="mb-2 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("coinPurse")}
      </h3>

      {/* Coin display */}
      <div className="mb-2 grid grid-cols-5 gap-1 text-center" data-testid="play-coins">
        {coins.map((coin) => (
          <div key={coin.key} className="rounded-md border border-border px-1 py-1.5">
            <div className="text-[10px] md:text-xs font-medium text-muted-foreground">
              {coin.label}
            </div>
            <div className="font-mono text-lg font-bold" data-testid={`play-coin-${coin.key}`}>
              {coin.value}
            </div>
          </div>
        ))}
      </div>

      {/* Total in GP */}
      <div className="mb-3 text-center text-xs text-muted-foreground">
        {t("totalGP")}: <span className="font-mono font-medium text-primary">{totalGP}</span>
      </div>

      {/* Action buttons */}
      {!readOnly && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setShowPayDialog(true)}
            data-testid="play-pay-btn"
          >
            {t("pay")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setShowReceiveDialog(true)}
            data-testid="play-receive-btn"
          >
            {t("receive")}
          </Button>
          {canTrade && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowSendDialog(true)}
              data-testid="play-send-gold-btn"
            >
              {t("sendGold")}
            </Button>
          )}
        </div>
      )}

      {/* Pay dialog */}
      {showPayDialog && (
        <PayDialog purse={coinPurse} onPay={handlePay} onClose={() => setShowPayDialog(false)} />
      )}

      {/* Receive dialog */}
      {showReceiveDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowReceiveDialog(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowReceiveDialog(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t("receiveTitle")}
          data-testid="play-receive-dialog"
        >
          <div
            className="mx-4 flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-card p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-heading text-lg text-primary">{t("receiveTitle")}</h3>
            <div className="grid grid-cols-5 gap-2">
              {coins.map((coin) => (
                <div key={coin.key} className="text-center">
                  <label className="text-[10px] md:text-xs text-muted-foreground">
                    {coin.label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={receiveAmounts[coin.key] || ""}
                    onChange={(e) =>
                      setReceiveAmounts((prev) => ({
                        ...prev,
                        [coin.key]: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="w-full rounded-md border border-border bg-background px-1 py-1 text-center text-sm"
                    aria-label={coin.label}
                    data-testid={`play-receive-${coin.key}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={handleReceive}
                data-testid="play-receive-confirm"
              >
                {t("apply")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setShowReceiveDialog(false)}
                data-testid="play-receive-cancel"
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send gold dialog */}
      {showSendDialog && tradeCharacters && (
        <SendGoldDialog
          senderCharacterId={characterId}
          senderCharacterName={characterName}
          coinPurse={coinPurse}
          characters={tradeCharacters}
          onSend={handleGoldSent}
          onClose={() => setShowSendDialog(false)}
        />
      )}
    </GlassCard>
  );
}
