"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Package,
  Coins,
  ArrowRightLeft,
  Sparkles,
  X,
  UserPlus,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { NotificationRow } from "@/lib/supabase/types";

interface NotificationItemProps {
  notification: NotificationRow;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
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

export function NotificationItem({ notification, onMarkRead, onDelete }: NotificationItemProps) {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
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
    session_xp_awarded: t("sessionXpAwarded", {
      character,
      xp: ((details.xp_amount as number) ?? 0).toLocaleString(),
      sessionTitle: (details.session_title as string) ?? "",
    }),
    new_user_registered: t("newUserRegistered", {
      email: (details.user_email as string) ?? "",
    }),
    user_approved: t("userApproved"),
  };

  const message = messageMap[notification.type] ?? notification.type;

  let subtitle = "";
  if (notification.type.includes("gold") && !notification.type.includes("item")) {
    const pp = (details.pp as number) ?? 0;
    const gp = (details.gp as number) ?? 0;
    const sp = (details.sp as number) ?? 0;
    const cp = (details.cp as number) ?? 0;
    const parts = [];
    if (pp > 0) parts.push(`${pp} PP`);
    if (gp > 0) parts.push(`${gp} GP`);
    if (sp > 0) parts.push(`${sp} SP`);
    if (cp > 0) parts.push(`${cp} CP`);
    subtitle = parts.join(", ");
  } else if (notification.type !== "session_xp_awarded" && quantity > 1) {
    subtitle = t("quantityDetail", { count: quantity });
  }

  const iconClassName = `mt-0.5 h-4 w-4 shrink-0 ${
    notification.is_read ? "text-muted-foreground" : "text-primary"
  }`;

  const icon =
    notification.type === "new_user_registered" ? (
      <UserPlus className={iconClassName} />
    ) : notification.type === "user_approved" ? (
      <CheckCircle2 className={iconClassName} />
    ) : notification.type === "session_xp_awarded" ? (
      <Sparkles className={iconClassName} />
    ) : notification.type.includes("gold") ? (
      <Coins className={iconClassName} />
    ) : notification.type.includes("trade") ? (
      <ArrowRightLeft className={iconClassName} />
    ) : (
      <Package className={iconClassName} />
    );

  function handleClick() {
    if (!notification.is_read) {
      onMarkRead(notification.id);
    }

    // Navigate to XP dialog for session_xp_awarded notifications
    if (notification.type === "session_xp_awarded" && notification.character_id) {
      const xpAmount = (details.xp_amount as number) ?? 0;
      const sessionId = (details.session_id as string) ?? "";
      const params = new URLSearchParams({
        openXp: "1",
        ...(sessionId && { sessionId }),
        ...(xpAmount > 0 && { xpAmount: xpAmount.toString() }),
      });
      router.push(`/characters/${notification.character_id}/manage?${params.toString()}`);
    }
  }

  async function handleApprove(e: React.MouseEvent) {
    e.stopPropagation();
    const targetUserId = (details.user_id as string) ?? null;
    const targetEmail = (details.user_email as string) ?? "";
    if (!targetUserId || approving) return;
    setApproving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("approve_user", { target_user_id: targetUserId });
      if (error) throw error;
      toast.success(t("approveSuccess", { email: targetEmail }));
      onMarkRead(notification.id);
    } catch {
      toast.error(t("approveError"));
    } finally {
      setApproving(false);
    }
  }

  async function handleReject(e: React.MouseEvent) {
    e.stopPropagation();
    const targetUserId = (details.user_id as string) ?? null;
    const targetEmail = (details.user_email as string) ?? "";
    if (!targetUserId || rejecting) return;
    setRejecting(true);
    try {
      const res = await fetch(`/api/admin/reject-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(t("rejectSuccess", { email: targetEmail }));
      onDelete(notification.id);
    } catch {
      toast.error(t("rejectError"));
    } finally {
      setRejecting(false);
      setConfirmReject(false);
    }
  }

  return (
    <div
      className={`group relative flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent/30 ${
        notification.is_read ? "opacity-60" : ""
      }`}
      data-testid={`notification-item-${notification.id}`}
    >
      <div
        role="button"
        tabIndex={0}
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 text-left"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {icon}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground">{message}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {getRelativeTime(notification.created_at, t)}
          </p>
          {notification.type === "new_user_registered" && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={handleApprove}
                disabled={approving || rejecting}
                className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                data-testid={`notification-approve-${notification.id}`}
              >
                <CheckCircle2 className="h-3 w-3" />
                {t("approveNow")}
              </button>
              {confirmReject ? (
                <>
                  <span
                    className="text-[11px] text-destructive"
                    data-testid={`notification-reject-confirm-${notification.id}`}
                  >
                    {t("rejectConfirm", { email: (details.user_email as string) ?? "" })}
                  </span>
                  <button
                    onClick={handleReject}
                    disabled={rejecting || approving}
                    className="inline-flex items-center gap-1 rounded-md border border-destructive/50 bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                    data-testid={`notification-reject-submit-${notification.id}`}
                  >
                    <XCircle className="h-3 w-3" />
                    {t("rejectConfirmYes")}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmReject(false);
                    }}
                    disabled={rejecting}
                    className="inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                    data-testid={`notification-reject-cancel-${notification.id}`}
                  >
                    {t("cancel")}
                  </button>
                </>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmReject(true);
                  }}
                  disabled={approving || rejecting}
                  className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-[11px] font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  data-testid={`notification-reject-${notification.id}`}
                >
                  <XCircle className="h-3 w-3" />
                  {t("rejectNow")}
                </button>
              )}
            </div>
          )}
        </div>
        {!notification.is_read && (
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
            data-testid={`notification-unread-dot-${notification.id}`}
          />
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
        aria-label={t("delete")}
        data-testid={`notification-delete-${notification.id}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
