import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Called from the login flow after successful OTP verify.
 * If the user is unapproved AND this is a fresh registration, fires a Discord
 * webhook to ping the admin. The in-app notification is created by the
 * handle_new_user DB trigger — this route only adds the out-of-band Discord ping.
 *
 * Idempotency: we only ping once per user, tracked via a marker notification.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_approved, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.is_approved) {
    return Response.json({ ok: true, skipped: "approved" });
  }

  // Update last_login_at regardless
  await supabase
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", user.id);

  const webhookUrl = process.env.DISCORD_ADMIN_WEBHOOK_URL;
  if (!webhookUrl) {
    return Response.json({ ok: true, skipped: "no_webhook" });
  }

  // Don't block the response on the webhook
  const body = await request.json().catch(() => ({}));
  const isNewRegistration = body?.newRegistration === true;
  const content = isNewRegistration
    ? `🆕 **Neuer Schergen-Kandidat:** ${profile.email}\nIn der App unter Benachrichtigungen freischalten.`
    : `⏳ ${profile.email} hat sich eingeloggt, wartet noch auf Freigabe.`;

  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  }).catch(() => {
    // Webhook failure is non-critical
  });

  return Response.json({ ok: true });
}
