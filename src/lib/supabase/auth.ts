import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./server";

/** The identity a page or layout needs: who is logged in. */
export interface AuthUser {
  id: string;
  email: string | null;
}

function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

const DEV_USER: AuthUser = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "dev@chaosforge.local",
};

/**
 * Verifies the session JWT locally against the project's asymmetric signing
 * keys — no round trip to the Supabase auth server. React's cache() shares the
 * result between the layout and the page of the same server request.
 *
 * Trade-off: a token revoked on the server stays valid until it expires (1h).
 * PostgREST/RLS verifies the same way, so the data layer is unaffected; API
 * routes that need the auth server's verdict call supabase.auth.getUser().
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  if (isDev() && !isSupabaseConfigured()) {
    return DEV_USER;
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) {
    return null;
  }

  return { id: claims.sub, email: claims.email ?? null };
});

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getOptionalUser(): Promise<AuthUser | null> {
  return getAuthUser();
}
