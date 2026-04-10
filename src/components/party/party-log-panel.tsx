"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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

interface LogGroup {
  key: string;
  label: string;
  entries: PartyLootLogRow[];
}

function groupByDay(
  log: PartyLootLogRow[],
  locale: string,
  labels: { today: string; yesterday: string }
): LogGroup[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  const groups = new Map<string, LogGroup>();
  for (const entry of log) {
    const ts = new Date(entry.created_at).getTime();
    let key: string;
    let label: string;
    if (ts >= startOfToday) {
      key = "today";
      label = labels.today;
    } else if (ts >= startOfYesterday) {
      key = "yesterday";
      label = labels.yesterday;
    } else {
      const d = new Date(entry.created_at);
      key = d.toISOString().slice(0, 10);
      label = d.toLocaleDateString(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    let group = groups.get(key);
    if (!group) {
      group = { key, label, entries: [] };
      groups.set(key, group);
    }
    group.entries.push(entry);
  }
  return Array.from(groups.values());
}

export function PartyLogPanel({ log, userMap, characterMap }: PartyLogPanelProps) {
  const t = useTranslations("party");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const groups = useMemo(
    () =>
      groupByDay(log, locale, {
        today: t("today"),
        yesterday: t("yesterday"),
      }),
    [log, locale, t]
  );

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
    try {
      const supabase = createClient();
      const { error } = await supabase.from("party_loot_log").delete().eq("id", entryId);
      if (error) return;
      setConfirmDeleteId(null);
      router.refresh();
    } finally {
      setDeletingId(null);
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
        <div className="space-y-4" data-testid="party-log-entries">
          {groups.map((group) => (
            <section key={group.key}>
              <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {group.label}
              </h4>
              <ol className="relative space-y-2 border-l border-border pl-4">
                {group.entries.map((entry) => {
                  const time = new Date(entry.created_at).toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <li
                      key={entry.id}
                      className="group relative"
                      data-testid={`party-log-entry-${entry.id}`}
                    >
                      <span
                        className="absolute -left-[1.3rem] top-1.5 size-1.5 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      <div className="flex items-start gap-2 text-sm">
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {time}
                        </span>
                        <span className="flex-1 text-foreground/85">{formatEntry(entry)}</span>
                        <button
                          onClick={() => setConfirmDeleteId(entry.id)}
                          className="shrink-0 rounded p-0.5 text-muted-foreground/50 transition-opacity hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label={t("deleteLogEntry")}
                          data-testid={`party-log-delete-${entry.id}`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}

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
