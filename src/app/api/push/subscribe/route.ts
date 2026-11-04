import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const MAX_FIELD = 2048;

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function isEndpoint(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("https://") && value.length <= MAX_FIELD;
}

function isKey(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_FIELD;
}

/**
 * Registers this device for push. Writes with the service client after
 * getUser(): the endpoint is unique, so a second account signing in on the
 * same browser takes the subscription over.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
    locale?: unknown;
  } | null;
  if (!isEndpoint(body?.endpoint) || !isKey(body?.keys?.p256dh) || !isKey(body?.keys?.auth)) {
    return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
  }

  const { error } = await createServiceClient()
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        locale: body.locale === "en" ? "en" : "de",
        user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
      { onConflict: "endpoint" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Unsubscribes this device (only if it belongs to the current user). */
export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;
  if (!isEndpoint(body?.endpoint)) {
    return NextResponse.json({ error: "invalid endpoint" }, { status: 400 });
  }

  const { error } = await createServiceClient()
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
