/**
 * Push content for a notification: the same text and target as the bell,
 * rendered on the server in the language the subscription was made in.
 */
import { createTranslator } from "next-intl";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import { describeNotification, type Translate } from "@/lib/notifications/describe";
import type { NotificationRow } from "@/lib/supabase/types";

export type PushLocale = "de" | "en";

export interface PushPayload {
  title: string;
  body: string;
  /** Path the click opens. */
  url: string;
  /** Replaces an earlier push of the same notification instead of stacking. */
  tag: string;
}

const MESSAGES = { de, en } as const;

export function buildPushPayload(notification: NotificationRow, locale: PushLocale): PushPayload {
  const t = createTranslator({
    locale,
    messages: MESSAGES[locale],
    namespace: "notifications",
  }) as unknown as Translate;
  const { message, subtitle, href } = describeNotification(notification, t, locale);
  return {
    title: "Chaos Forge",
    body: subtitle ? `${message} – ${subtitle}` : message,
    url: href ?? "/dashboard",
    tag: notification.id,
  };
}
