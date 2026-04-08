"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAuth } from "@/lib/supabase/auth";
import { createNotification } from "@/lib/notifications";
import type { SessionParticipantRow } from "@/lib/supabase/types";

export async function distributeSessionXp(
  sessionId: string,
  xpAmount: number
): Promise<{ success: boolean; error?: string; notifiedCount?: number }> {
  if (xpAmount <= 0) return { success: false, error: "Invalid XP amount" };

  const user = await requireAuth();
  const supabase = await createClient();

  // Verify session exists and user is creator
  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, created_by")
    .eq("id", sessionId)
    .single();

  if (!session) return { success: false, error: "Session not found" };
  if (session.created_by !== user.id) {
    return { success: false, error: "Unauthorized" };
  }

  const service = createServiceClient();

  // Save XP amount on session
  const { error: updateError } = await service
    .from("sessions")
    .update({ xp_awarded: xpAmount })
    .eq("id", sessionId);

  if (updateError) return { success: false, error: updateError.message };

  // Fetch all participants with character details
  const { data: participantRows } = await service
    .from("session_participants")
    .select("*")
    .eq("session_id", sessionId)
    .returns<SessionParticipantRow[]>();

  if (!participantRows || participantRows.length === 0) {
    return { success: true, notifiedCount: 0 };
  }

  const charIds = participantRows.map((p) => p.character_id);
  const { data: characters } = await service
    .from("characters")
    .select("id, user_id, name")
    .in("id", charIds);

  if (!characters) return { success: true, notifiedCount: 0 };

  // Send notifications concurrently to all participants
  await Promise.all(
    characters.map((char) =>
      createNotification(service, {
        userId: char.user_id,
        characterId: char.id,
        type: "session_xp_awarded",
        details: {
          xp_amount: xpAmount,
          session_id: sessionId,
          session_title: session.title,
          character_name: char.name,
        },
      })
    )
  );

  return { success: true, notifiedCount: characters.length };
}
