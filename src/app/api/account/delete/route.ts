import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const ADMIN_EMAIL = "christoph.menke@gmail.com";

/**
 * Self-service account deletion (DSGVO Art. 17 Recht auf Löschung).
 * Deletes the calling user's own auth account. Profile + notifications +
 * owned characters are removed via FK ON DELETE CASCADE.
 *
 * The admin cannot delete themselves via this route — removing the last
 * admin would break approval-related automation.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  if (user.email === ADMIN_EMAIL) {
    return NextResponse.json({ error: "cannot_delete_admin" }, { status: 400 });
  }

  const service = createServiceClient();
  const { error: deleteError } = await service.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const webhookUrl = process.env.DISCORD_ADMIN_WEBHOOK_URL;
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `🗑️ **Account selbst gelöscht:** ${user.email}`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
