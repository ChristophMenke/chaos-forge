"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { distributeSessionXp } from "@/app/sessions/actions";

interface SessionXpDistributeProps {
  sessionId: string;
  currentXpAwarded: number | null;
  participantCount: number;
}

export function SessionXpDistribute({
  sessionId,
  currentXpAwarded,
  participantCount,
}: SessionXpDistributeProps) {
  const t = useTranslations("sessions");
  const [xpAmount, setXpAmount] = useState(currentXpAwarded?.toString() ?? "");
  const [distributing, setDistributing] = useState(false);
  const [distributed, setDistributed] = useState(currentXpAwarded !== null);
  const [lastDistributed, setLastDistributed] = useState(currentXpAwarded);
  const [distributeError, setDistributeError] = useState<string | null>(null);

  async function handleDistribute() {
    const amount = parseInt(xpAmount, 10);
    if (isNaN(amount) || amount <= 0) return;

    setDistributing(true);
    setDistributeError(null);
    const result = await distributeSessionXp(sessionId, amount);
    setDistributing(false);

    if (result.success) {
      setDistributed(true);
      setLastDistributed(amount);
    } else {
      setDistributeError(result.error ?? "Unknown error");
    }
  }

  const hasParticipants = participantCount > 0;

  return (
    <div className="flex flex-col gap-3" data-testid="xp-distribute-section">
      <h2 className="flex items-center gap-2 font-heading text-xl">
        <Sparkles className="h-5 w-5 text-primary" />
        {t("distributeXp")}
      </h2>

      {!hasParticipants ? (
        <p className="text-sm text-amber-400" data-testid="xp-no-participants-warning">
          {t("noParticipantsWarning")}
        </p>
      ) : (
        <>
          {distributed && lastDistributed && (
            <p className="text-sm text-green-400" data-testid="xp-already-distributed">
              {t("xpAlreadyDistributed", { xp: lastDistributed.toLocaleString() })}
            </p>
          )}

          {distributeError && (
            <p className="text-sm text-destructive" role="alert" data-testid="xp-distribute-error">
              {distributeError}
            </p>
          )}

          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="xp-amount" className="text-sm text-muted-foreground">
                {t("xpAmount")}
              </label>
              <Input
                id="xp-amount"
                type="number"
                min={1}
                value={xpAmount}
                onChange={(e) => setXpAmount(e.target.value)}
                className="w-36"
                placeholder="0"
                data-testid="xp-distribute-amount"
              />
            </div>
            <Button
              onClick={handleDistribute}
              disabled={distributing || !xpAmount || parseInt(xpAmount, 10) <= 0}
              data-testid="xp-distribute-button"
            >
              {distributing ? <Spinner className="mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {distributed ? t("xpUpdateDistribution") : t("distributeXp")}
            </Button>
          </div>

          {distributed && lastDistributed && (
            <p className="text-xs text-muted-foreground">
              {t("xpDistributed", { count: participantCount })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
