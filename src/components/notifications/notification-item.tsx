"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Package,
  Coins,
  ArrowRightLeft,
  Sparkles,
  X,
  UserPlus,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Images,
  BellRing,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { describeNotification } from "@/lib/notifications/describe";
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
  const locale = useLocale();
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const details = notification.details;

  const { message, subtitle, href } = describeNotification(notification, t, locale);
  const isGameDate = notification.type.startsWith("game_date");

  const iconClassName = `mt-0.5 h-4 w-4 shrink-0 ${
    notification.is_read ? "text-muted-foreground" : "text-primary"
  }`;

  const icon = isGameDate ? (
    <CalendarDays className={iconClassName} />
  ) : notification.type === "gallery_images_added" ? (
    <Images className={iconClassName} />
  ) : notification.type === "push_test" ? (
    <BellRing className={iconClassName} />
  ) : notification.type === "new_user_registered" ? (
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
    if (href) router.push(href);
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
      className={`group relative flex w-full flex-col rounded-md px-3 py-2 text-left transition-colors hover:bg-accent/30 ${
        notification.is_read ? "opacity-60" : ""
      }`}
      data-testid={`notification-item-${notification.id}`}
    >
      <div className="flex w-full items-start gap-2.5">
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
      {notification.type === "new_user_registered" && (
        <div className="mt-2 flex flex-wrap items-center gap-2 pl-6">
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
                role="status"
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
                onClick={() => setConfirmReject(false)}
                disabled={rejecting}
                className="inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                data-testid={`notification-reject-cancel-${notification.id}`}
              >
                {t("cancel")}
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmReject(true)}
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
  );
}
