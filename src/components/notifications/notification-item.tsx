"use client";

import { useTranslations } from "next-intl";
import { Package, Coins, ArrowRightLeft } from "lucide-react";
import type { NotificationRow } from "@/lib/supabase/types";

interface NotificationItemProps {
  notification: NotificationRow;
  onMarkRead: (id: string) => void;
}

function getRelativeTime(
  dateStr: string,
  t: ReturnType<typeof useTranslations<"notifications">>
): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return t("timeJustNow");
  if (minutes < 60) return t("timeMinutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("timeHours", { count: hours });
  const days = Math.floor(hours / 24);
  return t("timeDays", { count: days });
}

function getNotificationIcon(type: string) {
  if (type.includes("gold")) return Coins;
  if (type.includes("trade")) return ArrowRightLeft;
  return Package;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const t = useTranslations("notifications");
  const details = notification.details;

  const character = (details.character_name as string) ?? "";
  const item = (details.item_name as string) ?? "";
  const from = (details.from_character as string) ?? "";
  const quantity = (details.quantity as number) ?? 1;

  const messageMap: Record<string, string> = {
    gm_item_received: t("gmItemReceived", { character, item }),
    gm_gold_received: t("gmGoldReceived", { character }),
    party_item_received: t("partyItemReceived", { character, item }),
    party_gold_received: t("partyGoldReceived", { character }),
    trade_item_received: t("tradeItemReceived", { character, from, item }),
    trade_gold_received: t("tradeGoldReceived", { character, from }),
  };

  const message = messageMap[notification.type] ?? notification.type;

  let subtitle = "";
  if (notification.type.includes("gold") && !notification.type.includes("item")) {
    const pp = (details.pp as number) ?? 0;
    const gp = (details.gp as number) ?? 0;
    const ep = (details.ep as number) ?? 0;
    const sp = (details.sp as number) ?? 0;
    const cp = (details.cp as number) ?? 0;
    const parts = [];
    if (pp > 0) parts.push(`${pp} PP`);
    if (gp > 0) parts.push(`${gp} GP`);
    if (ep > 0) parts.push(`${ep} EP`);
    if (sp > 0) parts.push(`${sp} SP`);
    if (cp > 0) parts.push(`${cp} CP`);
    subtitle = parts.join(", ");
  } else if (quantity > 1) {
    subtitle = t("quantityDetail", { count: quantity });
  }

  const Icon = getNotificationIcon(notification.type);

  return (
    <button
      className={`flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent/30 ${
        notification.is_read ? "opacity-60" : ""
      }`}
      onClick={() => !notification.is_read && onMarkRead(notification.id)}
      data-testid={`notification-item-${notification.id}`}
    >
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${
          notification.is_read ? "text-muted-foreground" : "text-primary"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{message}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {getRelativeTime(notification.created_at, t)}
        </p>
      </div>
      {!notification.is_read && (
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
          data-testid={`notification-unread-dot-${notification.id}`}
        />
      )}
    </button>
  );
}
