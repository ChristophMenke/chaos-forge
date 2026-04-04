"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Coins } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { AvatarDisplay } from "@/components/avatar-display";
import { distributeGold } from "@/app/master/actions";
import type { CharacterRow } from "@/lib/supabase/types";

interface MasterGoldPanelProps {
  characters: CharacterRow[];
}

const COIN_TYPES = ["pp", "gp", "ep", "sp", "cp"] as const;

export function MasterGoldPanel({ characters }: MasterGoldPanelProps) {
  const t = useTranslations("master");
  const [selectedCharId, setSelectedCharId] = useState<string>(characters[0]?.id ?? "");
  const [coins, setCoins] = useState({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const hasCoins = Object.values(coins).some((v) => v > 0);

  async function handleSend() {
    if (!selectedCharId || !hasCoins) return;
    setSending(true);
    const result = await distributeGold(selectedCharId, coins);
    setSending(false);
    if (result.success) {
      setCoins({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
      showToast(t("goldSent"), "success");
    } else {
      showToast(t("goldFailed"), "error");
    }
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div data-testid="gm-gold-panel">
      {/* Character Selector */}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {characters.map((char) => (
          <button
            key={char.id}
            onClick={() => setSelectedCharId(char.id)}
            className={`flex items-center gap-2 rounded-lg border p-2 transition-colors ${
              selectedCharId === char.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background/30 text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`gm-gold-char-${char.id}`}
          >
            <AvatarDisplay name={char.name} avatarUrl={char.avatar_url} size={28} />
            <span className="truncate text-sm font-medium">{char.name}</span>
          </button>
        ))}
      </div>

      {/* Coin Inputs */}
      <GlassCard hover={false} className="p-4" data-testid="gm-gold-inputs">
        <div className="mb-3 flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-400" />
          <span className="font-heading text-sm text-foreground">{t("goldDistribute")}</span>
        </div>

        <div className="mb-4 grid grid-cols-5 gap-2">
          {COIN_TYPES.map((coin) => (
            <div key={coin} className="text-center">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                {t(`gold${coin.toUpperCase()}`)}
              </label>
              <input
                type="number"
                min={0}
                value={coins[coin] || ""}
                onChange={(e) =>
                  setCoins({ ...coins, [coin]: Math.max(0, Number(e.target.value) || 0) })
                }
                className="w-full rounded-md border border-border bg-background/50 px-2 py-2 text-center font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0"
                data-testid={`gm-gold-${coin}`}
              />
            </div>
          ))}
        </div>

        <Button
          className="w-full"
          disabled={sending || !hasCoins || !selectedCharId}
          onClick={handleSend}
          data-testid="gm-gold-send"
        >
          {sending ? "..." : t("sendGold")}
        </Button>
      </GlassCard>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg sm:bottom-4 ${
            toast.type === "success"
              ? "bg-green-900/90 text-green-200"
              : "bg-red-900/90 text-red-200"
          }`}
          data-testid="gm-gold-toast"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
