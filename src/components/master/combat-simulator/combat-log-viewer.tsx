"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Swords, Wand2, Shield, Skull, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import type { RoundLogEntry, ActionLogEntry } from "@/lib/combat-simulator";

interface CombatLogViewerProps {
  log: RoundLogEntry[];
}

export function CombatLogViewer({ log }: CombatLogViewerProps) {
  const t = useTranslations("master");
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  if (log.length === 0) return null;

  return (
    <GlassCard className="p-4" data-testid="gm-combat-log">
      <h3 className="mb-3 font-heading text-sm font-semibold text-foreground">{t("combatLog")}</h3>
      <div className="space-y-1">
        {log.map((round) => (
          <div key={round.round} data-testid={`gm-combat-round-${round.round}`}>
            <button
              onClick={() => setExpandedRound(expandedRound === round.round ? null : round.round)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-accent/30"
              aria-expanded={expandedRound === round.round}
              aria-controls={`combat-round-content-${round.round}`}
              data-testid={`gm-combat-round-toggle-${round.round}`}
            >
              <span className="font-medium text-foreground">
                {t("combatRound", { n: round.round })}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {round.actions.length} actions
                </span>
                {expandedRound === round.round ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </button>

            {expandedRound === round.round && (
              <div
                id={`combat-round-content-${round.round}`}
                className="ml-3 space-y-0.5 border-l border-border/50 pl-3 pb-2"
              >
                {round.actions.map((action, i) => (
                  <ActionEntry key={i} action={action} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function ActionEntry({ action }: { action: ActionLogEntry }) {
  const icon =
    action.type === "spell" ? (
      <Wand2 className="h-3 w-3 text-purple-400" />
    ) : action.type === "attack" ? (
      <Swords className="h-3 w-3 text-amber-400" />
    ) : action.type === "special" ? (
      <Sparkles className="h-3 w-3 text-emerald-400" />
    ) : (
      <Shield className="h-3 w-3 text-gray-400" />
    );

  const isKill = action.detail.includes("[KILLED]");

  return (
    <div className="flex items-start gap-2 py-0.5 text-xs">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-muted-foreground">
        <span className="font-medium text-foreground">{action.actorName}</span>
        {action.targetName && (
          <>
            {" → "}
            <span className={isKill ? "font-medium text-red-400" : "text-foreground"}>
              {action.targetName}
            </span>
          </>
        )}
        {" — "}
        {action.detail}
        {action.damage !== undefined && action.damage > 0 && (
          <span className="ml-1 font-medium text-red-400">({action.damage} dmg)</span>
        )}
        {isKill && <Skull className="ml-1 inline h-3 w-3 text-red-400" />}
      </span>
    </div>
  );
}
