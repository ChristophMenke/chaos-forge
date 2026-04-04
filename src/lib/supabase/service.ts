import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client with the Service Role key.
 * This client bypasses Row Level Security — use ONLY in Server Actions / Route Handlers.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim()
  );
}
