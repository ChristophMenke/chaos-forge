import { createServiceClient } from "@/lib/supabase/service";
import { isAuthorizedCronRequest } from "./cron-auth";

// The point of this route is to hit the database on every invocation, so it
// must never be prerendered or cached.
export const dynamic = "force-dynamic";

/**
 * Keeps the Supabase free-tier project awake.
 *
 * Supabase pauses free projects after 7 days without a single request. The group
 * plays every few weeks, so the project kept pausing between sessions and had to
 * be restored by hand. A daily cron (see `vercel.json`) hits this route and
 * resets that inactivity timer.
 *
 * Uses the service client so the query runs regardless of RLS — an anonymous
 * read would return zero rows and tell us nothing about the database being up.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("races").select("id").limit(1);

  if (error) {
    // Answering non-2xx marks the run as failed in the Vercel dashboard — a
    // silently broken keep-alive would only surface once the project is paused.
    console.error("[keep-alive] Supabase query failed:", error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, pingedAt: new Date().toISOString() });
}
