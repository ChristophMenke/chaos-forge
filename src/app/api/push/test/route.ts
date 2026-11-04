import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createNotification } from "@/lib/notifications";

/**
 * "Send test notification" in the settings: a normal notification for the
 * user, so the test runs through the same webhook as every real push.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { count } = await service
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (!count) return NextResponse.json({ error: "noSubscription" }, { status: 409 });

  await createNotification(service, { userId: user.id, type: "push_test", details: {} });
  return NextResponse.json({ ok: true });
}
