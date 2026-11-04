import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationType } from "@/lib/supabase/types";

interface CreateNotificationParams {
  userId: string;
  characterId?: string;
  type: NotificationType;
  details: Record<string, unknown>;
}

export async function createNotification(
  supabase: SupabaseClient,
  params: CreateNotificationParams
): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    character_id: params.characterId ?? null,
    type: params.type,
    details: params.details,
  });
  if (error) {
    console.error("[createNotification] Failed to insert notification:", error.message);
  }
}

interface NotifyApprovedUsersParams {
  /** The acting user gets no notification about their own action. */
  exceptUserId: string | null;
  type: NotificationType;
  details: Record<string, unknown>;
}

/**
 * Fan-out to every approved player, for server code that writes with the
 * service client. DB triggers can't do this there: auth.uid() is NULL, so the
 * game_dates-style triggers skip the system context. Errors are only logged —
 * a missing bell entry must never fail the action that caused it.
 */
export async function notifyApprovedUsers(
  supabase: SupabaseClient,
  { exceptUserId, type, details }: NotifyApprovedUsersParams
): Promise<void> {
  const { data, error } = await supabase.from("profiles").select("id").eq("is_approved", true);
  if (error) {
    console.error("[notifyApprovedUsers] Failed to load recipients:", error.message);
    return;
  }

  const rows = ((data ?? []) as { id: string }[])
    .filter((p) => p.id !== exceptUserId)
    .map((p) => ({ user_id: p.id, character_id: null, type, details }));
  if (rows.length === 0) return;

  const { error: insertError } = await supabase.from("notifications").insert(rows);
  if (insertError) {
    console.error("[notifyApprovedUsers] Failed to insert notifications:", insertError.message);
  }
}
