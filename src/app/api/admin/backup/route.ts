import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdminEmail } from "@/lib/admin";
import { loadBackupTables } from "@/lib/backup/load-tables";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Admin-only: all group data for the backup ZIP, which the admin's browser
 * builds (src/lib/backup/build-backup.ts). Images are not included here; the
 * browser downloads them from public storage.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Nicht authentifiziert." },
      { status: 401, headers: NO_STORE }
    );
  }
  // Login e-mail from the auth server, not profiles.email.
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403, headers: NO_STORE });
  }

  try {
    const tables = await loadBackupTables(createServiceClient());
    return NextResponse.json(
      { generatedAt: new Date().toISOString(), tables },
      { headers: NO_STORE }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Backup fehlgeschlagen" },
      { status: 500, headers: NO_STORE }
    );
  }
}
