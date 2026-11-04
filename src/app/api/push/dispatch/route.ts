import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { sendPushToUser } from "@/lib/push/send";
import { buildPushPayload } from "@/lib/push/payload";
import type { NotificationRow } from "@/lib/supabase/types";

/** web-push signs with node:crypto. */
export const runtime = "nodejs";

function hasValidSecret(request: Request): boolean {
  const expected = process.env.PUSH_WEBHOOK_SECRET;
  const given = request.headers.get("x-push-secret");
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Called by the DB trigger dispatch_push_notification (pg_net) for every new
 * notification of a user with a push subscription. Only the id is trusted —
 * recipient and text come from the database.
 */
export async function POST(request: Request) {
  if (!hasValidSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { notification_id?: unknown } | null;
  const id = typeof body?.notification_id === "string" ? body.notification_id : null;
  if (!id) return NextResponse.json({ error: "notification_id missing" }, { status: 400 });

  const service = createServiceClient();
  const { data } = await service.from("notifications").select("*").eq("id", id).maybeSingle();
  const notification = data as NotificationRow | null;
  if (!notification) return NextResponse.json({ error: "not found" }, { status: 404 });

  const result = await sendPushToUser(service, notification.user_id, (locale) =>
    buildPushPayload(notification, locale)
  );
  console.info("[push] sent", {
    notificationId: id,
    devices: result.sent,
    removed: result.removed,
  });
  return NextResponse.json(result);
}
