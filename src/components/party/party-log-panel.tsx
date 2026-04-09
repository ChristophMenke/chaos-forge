"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Trash2 } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
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

export function PartyLogPanel({ log: initialLog, userMap, characterMap }: PartyLogPanelProps) {
  const t = useTranslations("party");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [log, setLog] = useState(initialLog);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function formatEntry(entry: PartyLootLogRow): string {
    const details = entry.details;
    const user =
      typeof details.actor === "string" && details.actor
        ? details.actor
        : (userMap[entry.user_id] ?? "?");
    const character = entry.character_id ? (characterMap[entry.character_id] ?? "?") : "";
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
      case "remove_gold": {
        const reason = typeof details.reasonLabel === "string" ? details.reasonLabel : "?";
        return t("logRemoveGold", { user, amount: formatCoinAmount(details), reason });
      }
      default:
        return `${user}: ${entry.action}`;
    }
  }

  async function handleDelete(entryId: string) {
    setDeletingId(entryId);
    const supabase = createClient();
    const { error } = await supabase.from("party_loot_log").delete().eq("id", entryId);
    setDeletingId(null);
    if (error) {
      // Keep dialog open so user knows it failed
      return;
    }
    setLog((prev) => prev.filter((e) => e.id !== entryId));
    setConfirmDeleteId(null);
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
                className="group flex items-start gap-2 text-sm"
                data-testid={`party-log-entry-${entry.id}`}
              >
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{time}</span>
                <span className="flex-1 text-foreground/80">{formatEntry(entry)}</span>
                <button
                  onClick={() => setConfirmDeleteId(entry.id)}
                  className="shrink-0 rounded p-0.5 text-muted-foreground/50 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label={t("deleteLogEntry")}
                  data-testid={`party-log-delete-${entry.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
      >
        <DialogContent showCloseButton={false} data-testid="party-log-delete-dialog">
          <DialogTitle className="font-heading text-lg text-destructive">
            {t("deleteLogTitle")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{t("deleteLogConfirm")}</p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              disabled={deletingId === confirmDeleteId}
              data-testid="party-log-delete-confirm"
            >
              {deletingId === confirmDeleteId ? tc("saving") : t("deleteLogEntry")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => setConfirmDeleteId(null)}
              data-testid="party-log-delete-cancel"
            >
              {tc("cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}
