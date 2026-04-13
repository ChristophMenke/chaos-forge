import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Called from the login flow after successful OTP verify.
 * If the user is unapproved, pings the admin via Discord webhook.
 *
 * "First login" is derived from `profiles.last_login_at IS NULL`. The OTP flow
 * creates the auth.users row (and profile via trigger) when the code is
 * REQUESTED, but this endpoint only runs when the code is VERIFIED — the gap
 * is unbounded (user reads mail, types code), so a time-window check on the
 * notification timestamp is unreliable.
 */
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
    .select("is_approved, email, last_login_at")
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
  const isFirstLogin = profile?.last_login_at == null;

  // Update last_login_at AFTER reading it (own row, RLS allows this)
  await supabase
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", user.id);

  const webhookUrl = process.env.DISCORD_ADMIN_WEBHOOK_URL;
  if (!webhookUrl) {
    return Response.json({ ok: true, skipped: "no_webhook" });
  }

  // Ensure an in-app admin notification exists so the "Freischalten"-Button
  // is available (it may have been deleted, or the trigger missed it).
  try {
    const service = createServiceClient();
    const { data: regNotif } = await service
      .from("notifications")
      .select("id")
      .eq("type", "new_user_registered")
      .eq("details->>user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (!regNotif) {
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
    // Non-critical — fall through to the Discord ping
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adnd-chaos-forge.vercel.app";
  const approveLink = `${siteUrl}/admin/approve/${user.id}`;

  const content = isFirstLogin
    ? `🆕 **Neuer Schergen-Kandidat:** ${userEmail}\n→ Direkt freischalten: ${approveLink}`
    : `⏳ ${userEmail} hat sich eingeloggt, wartet noch auf Freigabe.\n→ ${approveLink}`;

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
