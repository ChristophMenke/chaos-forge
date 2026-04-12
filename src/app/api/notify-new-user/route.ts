import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Called from the login flow after successful OTP verify.
 * If the user is unapproved, pings the admin via Discord webhook.
 *
 * "Fresh registration" (first login) is derived server-side from the
 * `new_user_registered` notification timestamp written by the
 * `handle_new_user` trigger — no trust placed in the client payload.
 */
const FRESH_REGISTRATION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export async function POST() {
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

  // Legacy self-heal: auth.users row exists but no profile was created by the
  // trigger. Create one as unapproved — the admin will see the banner-and-
  // approve flow on the next login.
  if (!profile) {
    const service = createServiceClient();
    await service.from("profiles").insert({
      id: user.id,
      display_name: user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "Abenteurer",
      email: user.email,
      is_approved: false,
      skip_tutorials: false,
    });
    // fall through so the rest of the flow (admin notification + Discord ping) runs
  } else if (profile.is_approved) {
    return Response.json({ ok: true, skipped: "approved" });
  }

  const userEmail = profile?.email ?? user.email ?? "";

  // Update last_login_at regardless (own row, RLS allows this)
  await supabase
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", user.id);

  const webhookUrl = process.env.DISCORD_ADMIN_WEBHOOK_URL;
  if (!webhookUrl) {
    return Response.json({ ok: true, skipped: "no_webhook" });
  }

  // Look up the registration notification (service client bypasses RLS).
  // Also recreate the in-app notification if the admin accidentally deleted it
  // — this way the "Freischalten"-Button reappears on the next login.
  let isNewRegistration = false;
  try {
    const service = createServiceClient();

    const { data: regNotif } = await service
      .from("notifications")
      .select("created_at")
      .eq("type", "new_user_registered")
      .eq("details->>user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (regNotif?.created_at) {
      const age = Date.now() - new Date(regNotif.created_at).getTime();
      isNewRegistration = age < FRESH_REGISTRATION_WINDOW_MS;
    } else {
      // No existing notification for this user — recreate it so the admin
      // always has an "approve" action in the in-app notifications panel.
      const { data: admin } = await service
        .from("profiles")
        .select("id")
        .eq("email", "christoph.menke@gmail.com")
        .maybeSingle();
      if (admin?.id) {
        await service.from("notifications").insert({
          user_id: admin.id,
          type: "new_user_registered",
          details: { user_email: userEmail, user_id: user.id },
        });
      }
    }
  } catch {
    // If lookup fails, fall back to the generic "still waiting" message
  }

  const content = isNewRegistration
    ? `🆕 **Neuer Schergen-Kandidat:** ${userEmail}\nIn der App unter Benachrichtigungen freischalten.`
    : `⏳ ${userEmail} hat sich eingeloggt, wartet noch auf Freigabe.`;

  // Fire-and-forget — don't block the response on the webhook
  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  }).catch(() => {
    // Webhook failure is non-critical
  });

  return Response.json({ ok: true });
}
