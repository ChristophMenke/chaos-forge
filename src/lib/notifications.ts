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
