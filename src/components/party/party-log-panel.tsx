"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
  HandCoins,
  PackagePlus,
  Send,
  PackageX,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
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

type ActionStyle = {
  icon: LucideIcon;
  ring: string;
  tint: string;
  accent: string;
};

const ACTION_STYLES: Record<string, ActionStyle> = {
  add_gold: {
    icon: ArrowDownToLine,
    ring: "border-amber-400/50 bg-amber-500/15 text-amber-200 shadow-[0_0_12px_-4px_rgba(251,191,36,0.6)]",
    tint: "hover:border-amber-400/30 hover:bg-amber-500/5",
    accent: "text-amber-200",
  },
  remove_gold: {
    icon: ArrowUpFromLine,
    ring: "border-rose-400/50 bg-rose-500/15 text-rose-200 shadow-[0_0_12px_-4px_rgba(244,63,94,0.5)]",
    tint: "hover:border-rose-400/30 hover:bg-rose-500/5",
    accent: "text-rose-200",
  },
  distribute_gold: {
    icon: HandCoins,
    ring: "border-amber-400/50 bg-amber-500/15 text-amber-200 shadow-[0_0_12px_-4px_rgba(251,191,36,0.6)]",
    tint: "hover:border-amber-400/30 hover:bg-amber-500/5",
    accent: "text-amber-200",
  },
  add_item: {
    icon: PackagePlus,
    ring: "border-teal-400/50 bg-teal-500/15 text-teal-200 shadow-[0_0_12px_-4px_rgba(45,212,191,0.5)]",
    tint: "hover:border-teal-400/30 hover:bg-teal-500/5",
    accent: "text-teal-200",
  },
  distribute_item: {
    icon: Send,
    ring: "border-teal-400/50 bg-teal-500/15 text-teal-200 shadow-[0_0_12px_-4px_rgba(45,212,191,0.5)]",
    tint: "hover:border-teal-400/30 hover:bg-teal-500/5",
    accent: "text-teal-200",
  },
  remove_item: {
    icon: PackageX,
    ring: "border-zinc-400/50 bg-zinc-500/15 text-zinc-200",
    tint: "hover:border-zinc-400/30 hover:bg-zinc-500/5",
    accent: "text-zinc-300",
  },
};

const FALLBACK_STYLE: ActionStyle = {
  icon: ScrollText,
  ring: "border-border bg-muted text-muted-foreground",
  tint: "hover:bg-muted/40",
  accent: "text-muted-foreground",
};

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
      {/* Ornate header */}
      <div className="mb-4 flex items-center gap-2 border-b border-primary/15 pb-3">
        <div className="rounded-full border border-primary/30 bg-primary/10 p-1.5 text-primary">
          <ScrollText className="size-3.5" />
        </div>
        <h3 className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          {t("chronicleTitle")}
        </h3>
        <div className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground/60">
          {t("chronicleSubtitle")}
        </div>
      </div>

      {log.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <ScrollText className="size-10 text-muted-foreground/30" />
          <p className="text-sm italic text-muted-foreground">{t("noLog")}</p>
        </div>
      ) : (
        <div className="space-y-5" data-testid="party-log-entries">
          {groups.map((group) => (
            <section key={group.key}>
              {/* Ornamental day divider */}
              <div className="relative mb-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
                <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.25em] text-primary/80">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/30" />
              </div>

              <ol className="space-y-1.5">
                {group.entries.map((entry) => {
                  const time = new Date(entry.created_at).toLocaleTimeString(locale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const style = ACTION_STYLES[entry.action] ?? FALLBACK_STYLE;
                  const Icon = style.icon;
                  return (
                    <li
                      key={entry.id}
                      className={`group relative flex items-start gap-3 rounded-lg border border-transparent p-2 transition-all ${style.tint}`}
                      data-testid={`party-log-entry-${entry.id}`}
                    >
                      <div
                        className={`mt-0.5 shrink-0 rounded-full border p-1.5 ${style.ring}`}
                        aria-hidden="true"
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-foreground/90">
                          {formatEntry(entry)}
                        </p>
                        <p
                          className={`mt-0.5 font-mono text-[10px] uppercase tracking-wider opacity-70 ${style.accent}`}
                        >
                          {time}
                        </p>
                      </div>
                      <button
                        onClick={() => setConfirmDeleteId(entry.id)}
                        className="mt-0.5 shrink-0 rounded p-1 text-muted-foreground/40 transition-opacity hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label={t("deleteLogEntry")}
                        data-testid={`party-log-delete-${entry.id}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
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
