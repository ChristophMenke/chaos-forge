import { createClient } from "./server";

export interface UserNavContext {
  userId: string;
  userEmail: string;
  userAvatarUrl: string | null;
}

export async function getUserNavContext(userId: string, email: string): Promise<UserNavContext> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .maybeSingle();
    return {
      userId,
      userEmail: email,
      userAvatarUrl: data?.avatar_url ?? null,
    };
  } catch {
    return { userId, userEmail: email, userAvatarUrl: null };
  }
}
