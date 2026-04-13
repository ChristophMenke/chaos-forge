import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const ADMIN_EMAIL = "christoph.menke@gmail.com";

/**
 * Admin-only: rejects a pending user by deleting their auth account.
 * Cascades to profile + notifications via FK ON DELETE CASCADE.
 * Fires an optional Discord ping so the admin sees a record of the action.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const { data: self } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();
  if (self?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const userId = body?.userId;
  if (typeof userId !== "string") {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const service = createServiceClient();

  // Safety: don't delete an approved user or the admin themselves accidentally.
  const { data: target } = await service
    .from("profiles")
    .select("email, is_approved")
    .eq("id", userId)
    .maybeSingle();
  if (!target) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }
  if (target.email === ADMIN_EMAIL) {
    return NextResponse.json({ error: "cannot_reject_admin" }, { status: 400 });
  }
  if (target.is_approved) {
    return NextResponse.json({ error: "already_approved" }, { status: 400 });
  }

  // Delete the auth user — CASCADE removes profile + notifications rows.
  const { error: deleteError } = await service.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Discord ping (fire-and-forget)
  const webhookUrl = process.env.DISCORD_ADMIN_WEBHOOK_URL;
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `❌ **Abgelehnt & gelöscht:** ${target.email}` }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
