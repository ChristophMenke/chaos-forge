import "server-only";
import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ADMIN_EMAIL } from "@/lib/admin";
import type { PushSubscriptionRow } from "@/lib/supabase/types";
import type { PushLocale, PushPayload } from "./payload";

type Sender = (
  subscription: webpush.PushSubscription,
  payload: string,
  options: webpush.RequestOptions
) => Promise<unknown>;

export interface PushResult {
  sent: number;
  removed: number;
  failed: number;
}

/** A day: a push about a game date or new scenes is still worth it the next morning. */
const TTL_SECONDS = 60 * 60 * 24;
/** The push service says the subscription is gone (browser unsubscribed, app removed). */
const GONE = new Set([404, 410]);

function configureVapid(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.error("[push] VAPID keys missing — push disabled");
    return false;
  }
  webpush.setVapidDetails(`mailto:${ADMIN_EMAIL}`, publicKey, privateKey);
  return true;
}

/**
 * Sends a push to every device of a user, each in the language it subscribed
 * with. Subscriptions the push service rejects as gone are deleted.
 */
export async function sendPushToUser(
  service: SupabaseClient,
  userId: string,
  buildPayload: (locale: PushLocale) => PushPayload,
  sender: Sender = webpush.sendNotification
): Promise<PushResult> {
  const result: PushResult = { sent: 0, removed: 0, failed: 0 };
  if (!configureVapid()) return result;

  const { data, error } = await service
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, locale")
    .eq("user_id", userId);
  if (error) {
    console.error("[push] loading subscriptions failed", error.message);
    return result;
  }
  const subscriptions = (data ?? []) as Pick<
    PushSubscriptionRow,
    "id" | "endpoint" | "p256dh" | "auth" | "locale"
  >[];

  const gone: string[] = [];
  const delivered: string[] = [];
  for (const sub of subscriptions) {
    try {
      await sender(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(buildPayload(sub.locale)),
        { TTL: TTL_SECONDS }
      );
      delivered.push(sub.id);
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode && GONE.has(statusCode)) {
        gone.push(sub.id);
      } else {
        result.failed++;
        console.error("[push] send failed", { statusCode });
      }
    }
  }

  if (gone.length > 0) await service.from("push_subscriptions").delete().in("id", gone);
  if (delivered.length > 0) {
    await service
      .from("push_subscriptions")
      .update({ last_used_at: new Date().toISOString() })
      .in("id", delivered);
  }
  result.sent = delivered.length;
  result.removed = gone.length;
  return result;
}
