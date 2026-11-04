import { createClient } from "@/lib/supabase/client";
import { disablePush } from "@/lib/push/client";

/**
 * Signs out in the browser. Push is turned off first: otherwise a shared device
 * keeps receiving the previous player's notifications.
 */
export async function signOut(): Promise<void> {
  await disablePush();
  await createClient().auth.signOut();
}
