"use client";

import { useTranslations, useLocale } from "next-intl";
import { GlassCard } from "@/components/glass-card";
import type { PartyLootLogRow } from "@/lib/supabase/types";

interface PartyLogPanelProps {
  log: PartyLootLogRow[];
  userMap: Record<string, string>;
  characterMap: Record<string, string>;
}

function formatCoinAmount(details: Record<string, unknown>): string {
  if (typeof details.amount === "string") return details.amount;
  const coins = details.coins as Record<string, number> | undefined;
  if (!coins) return "";
  const parts: string[] = [];
  for (const [key, val] of Object.entries(coins)) {
    if (val > 0) parts.push(`${val} ${key.toUpperCase()}`);
  }
  return parts.join(", ");
}

export function PartyLogPanel({ log, userMap, characterMap }: PartyLogPanelProps) {
  const t = useTranslations("party");
  const locale = useLocale();

  function formatEntry(entry: PartyLootLogRow): string {
    const user = userMap[entry.user_id] ?? "?";
    const character = entry.character_id ? (characterMap[entry.character_id] ?? "?") : "";
    const details = entry.details;
    const item =
      (typeof details.item_name === "string" ? details.item_name : null) ??
      (typeof details.custom_name === "string" ? details.custom_name : null) ??
      "?";
    const quantity = typeof details.quantity === "number" ? details.quantity : 1;

    switch (entry.action) {
      case "add_gold":
        return t("logAddGold", { user, amount: formatCoinAmount(details) });
      case "add_item":
        return t("logAddItem", { user, quantity, item });
      case "distribute_gold":
        return t("logDistributeGold", { user, amount: formatCoinAmount(details), character });
      case "distribute_item":
        return t("logDistributeItem", { user, quantity, item, character });
      case "remove_item":
        return t("logRemoveItem", { user, quantity, item });
      default:
        return `${user}: ${entry.action}`;
    }
  }

  return (
    <GlassCard hover={false} data-testid="party-log-panel">
      <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("log")}
      </h3>

      {log.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noLog")}</p>
      ) : (
        <div className="space-y-1.5" data-testid="party-log-entries">
          {log.map((entry) => {
            const time = new Date(entry.created_at).toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <div
                key={entry.id}
                className="flex items-start gap-2 text-sm"
                data-testid={`party-log-entry-${entry.id}`}
              >
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{time}</span>
                <span className="text-foreground/80">{formatEntry(entry)}</span>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
