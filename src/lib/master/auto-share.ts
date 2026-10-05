import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Shares every active character with the GM so the GM's own views (RLS-bound
 * queries in the browser) can see them.
 *
 * Deliberately not a server action: it trusts its caller to have verified the
 * GM session. It reads no request cookies, so the master page can run it via
 * after() once the response has been sent.
 */
export async function shareActiveCharactersWith(userId: string): Promise<void> {
  const service = createServiceClient();

  const { data: characters } = await service.from("characters").select("id").eq("is_active", true);

  if (!characters || characters.length === 0) return;

  await service.from("character_shares").upsert(
    characters.map((c) => ({ character_id: c.id, shared_with_user_id: userId })),
    { onConflict: "character_id,shared_with_user_id", ignoreDuplicates: true }
  );
}
