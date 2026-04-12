"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NotificationItem } from "./notification-item";
import type { NotificationRow } from "@/lib/supabase/types";

interface NotificationBellProps {
  userId: string;
  /** "sidebar" = icon-only (desktop), "mobile" = full-width with label (mobile more panel) */
  variant?: "sidebar" | "mobile";
  onUnreadCountChange?: (count: number) => void;
}

export function NotificationBell({
  userId,
  variant = "sidebar",
  onUnreadCountChange,
}: NotificationBellProps) {
  const t = useTranslations("notifications");
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Notify parent about unread count changes
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  // Initial fetch + Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    async function fetchNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)
        .returns<NotificationRow[]>();
      if (data) setNotifications(data);
    }

    fetchNotifications();

    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as NotificationRow;
          setNotifications((prev) => [newNotification, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Click-outside handler
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setConfirmDeleteAll(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  async function markAsRead(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (!error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    }
  }

  async function markAllAsRead() {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  }

  async function deleteNotification(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  }

  async function deleteAllNotifications() {
    const supabase = createClient();
    const { error } = await supabase.from("notifications").delete().eq("user_id", userId);
    if (!error) {
      setNotifications([]);
    }
  }

  const isMobile = variant === "mobile";

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className={
          isMobile
            ? `flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors ${
                isOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`
            : `flex h-10 w-10 items-center justify-center rounded-lg transition-all xl:w-full xl:justify-start xl:gap-3 xl:px-3 ${
                isOpen
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`
        }
        aria-label={t("title")}
        data-testid="notification-bell"
      >
        <div className="relative">
          <Bell className={isMobile ? "h-4 w-4" : "h-5 w-5 shrink-0"} />
          {unreadCount > 0 && !isMobile && (
            <span
              className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white xl:hidden"
              data-testid="notification-badge"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        {/* Mobile: always show label; Desktop: show on xl (uses a shorter
            label to fit inside the narrow sidebar next to the badge) */}
        {isMobile ? (
          <span className="flex-1 text-left">{t("title")}</span>
        ) : (
          <span className="hidden min-w-0 flex-1 truncate text-left text-sm font-medium xl:inline-block">
            {t("navLabel")}
          </span>
        )}
        {unreadCount > 0 && (
          <span
            className={
              isMobile
                ? "rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white"
                : "hidden shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white xl:inline-flex"
            }
            data-testid={isMobile ? "notification-badge-mobile" : "notification-badge"}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={
            isMobile
              ? "absolute bottom-full left-0 right-0 z-50 mb-2 w-full rounded-lg border border-border bg-card shadow-xl"
              : "absolute left-full top-0 z-50 ml-2 w-96 rounded-lg border border-border bg-card shadow-xl"
          }
          data-testid="notification-dropdown"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("title")}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-primary"
                  data-testid="notification-mark-all-read"
                >
                  <CheckCheck className="h-3 w-3" />
                  {t("markAllRead")}
                </button>
              )}
              {notifications.length > 0 &&
                (confirmDeleteAll ? (
                  <span className="flex items-center gap-1.5 text-[10px]">
                    <button
                      onClick={() => {
                        void deleteAllNotifications();
                        setConfirmDeleteAll(false);
                      }}
                      className="font-medium text-red-400 hover:text-red-300"
                      data-testid="notification-delete-all-confirm"
                    >
                      {t("confirmDeleteAll")}
                    </button>
                    <span className="text-muted-foreground">·</span>
                    <button
                      onClick={() => setConfirmDeleteAll(false)}
                      className="text-muted-foreground hover:text-foreground"
                      data-testid="notification-delete-all-cancel"
                    >
                      {t("cancel")}
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteAll(true)}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-red-400"
                    data-testid="notification-delete-all"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t("deleteAll")}
                  </button>
                ))}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
