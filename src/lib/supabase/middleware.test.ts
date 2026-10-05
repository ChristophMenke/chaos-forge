import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

const getClaims = vi.fn().mockResolvedValue({ data: { claims: { sub: "user-1" } }, error: null });
const getUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getClaims, getUser } }),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_test";

const { updateSession } = await import("./middleware");

describe("updateSession", () => {
  it("refreshes the session via local JWT verification instead of the auth server", async () => {
    await updateSession(new NextRequest("https://chaosforge.test/dashboard"));

    expect(getClaims).toHaveBeenCalledTimes(1);
    expect(getUser).not.toHaveBeenCalled();
  });
});
