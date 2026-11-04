/**
 * Text and target of a notification — shared by the bell (useTranslations)
 * and the push dispatch on the server (createTranslator), so a push always
 * says exactly what the bell says. Pure: no React, no Supabase.
 */
import { formatGameDate } from "@/lib/game-dates";
import type { NotificationRow } from "@/lib/supabase/types";

/** Minimal translator shape both `useTranslations` and `createTranslator` satisfy. */
export type Translate = (key: string, values?: Record<string, string | number>) => string;

export interface NotificationDescription {
  message: string;
  subtitle: string;
  /** Where a click leads, or null when the notification has no target. */
  href: string | null;
}

function goldSubtitle(details: Record<string, unknown>): string {
  return (["pp", "gp", "sp", "cp"] as const)
    .map((coin) => [coin, (details[coin] as number) ?? 0] as const)
    .filter(([, amount]) => amount > 0)
    .map(([coin, amount]) => `${amount} ${coin.toUpperCase()}`)
    .join(", ");
}

function xpHref(notification: NotificationRow): string | null {
  if (!notification.character_id) return null;
  const xpAmount = (notification.details.xp_amount as number) ?? 0;
  const sessionId = (notification.details.session_id as string) ?? "";
  const params = new URLSearchParams({
    openXp: "1",
    ...(sessionId && { sessionId }),
    ...(xpAmount > 0 && { xpAmount: xpAmount.toString() }),
  });
  return `/characters/${notification.character_id}/manage?${params.toString()}`;
}

export function describeNotification(
  notification: NotificationRow,
  t: Translate,
  locale: string
): NotificationDescription {
  const { type, details } = notification;
  const character = (details.character_name as string) ?? "";
  const item = (details.item_name as string) ?? "";
  const from = (details.from_character as string) ?? "";
  const quantity = (details.quantity as number) ?? 1;
  const isGameDate = type.startsWith("game_date");
  const gameDate = (details.event_date as string) ?? "";
  const date = gameDate ? formatGameDate(gameDate, locale) : "";

  const messages: Record<string, () => string> = {
    gm_item_received: () => t("gmItemReceived", { character, item }),
    gm_gold_received: () => t("gmGoldReceived", { character }),
    party_item_received: () => t("partyItemReceived", { character, item }),
    party_gold_received: () => t("partyGoldReceived", { character }),
    trade_item_received: () => t("tradeItemReceived", { character, from, item }),
    trade_gold_received: () => t("tradeGoldReceived", { character, from }),
    session_xp_awarded: () =>
      t("sessionXpAwarded", {
        character,
        xp: ((details.xp_amount as number) ?? 0).toLocaleString(locale),
        sessionTitle: (details.session_title as string) ?? "",
      }),
    new_user_registered: () =>
      t("newUserRegistered", { email: (details.user_email as string) ?? "" }),
    user_approved: () => t("userApproved"),
    game_date_created: () => t("gameDateCreated", { date }),
    game_date_changed: () => t("gameDateChanged", { date }),
    game_date_cancelled: () => t("gameDateCancelled", { date }),
    push_test: () => t("pushTest"),
    gallery_images_added: () => t("galleryImagesAdded", { count: (details.count as number) ?? 1 }),
  };
  const message = messages[type]?.() ?? type;

  let subtitle = "";
  if (isGameDate) {
    const parts: string[] = [];
    const title = (details.title as string) ?? "";
    if (title) parts.push(title);
    const previous = (details.previous_event_date as string) ?? "";
    if (type === "game_date_changed" && previous) {
      parts.push(t("gameDatePrevious", { date: formatGameDate(previous, locale) }));
    }
    subtitle = parts.join(" · ");
  } else if (type.includes("gold") && !type.includes("item")) {
    subtitle = goldSubtitle(details);
  } else if (type !== "session_xp_awarded" && quantity > 1) {
    subtitle = t("quantityDetail", { count: quantity });
  }

  let href: string | null = null;
  if (isGameDate || type === "push_test") href = "/settings";
  else if (type === "session_xp_awarded") href = xpHref(notification);
  else if (type === "gallery_images_added") href = "/gallery";

  return { message, subtitle, href };
}
