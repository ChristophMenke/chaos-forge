import { describe, it, expect, vi, beforeEach } from "vitest";

// React's client build (used by Vitest) turns cache() into a pass-through, so
// we stand in a memoising version to verify the per-request deduplication.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => {
      let called = false;
      let result: ReturnType<T>;
      const memo = ((...args: Parameters<T>) => {
        if (!called) {
          called = true;
          result = fn(...args) as ReturnType<T>;
        }
        return result;
      }) as T & { reset: () => void };
      memo.reset = () => {
        called = false;
      };
      return memo;
    },
  };
});

const getClaims = vi.fn();
const getUser = vi.fn();

vi.mock("./server", () => ({
  createClient: async () => ({ auth: { getClaims, getUser } }),
}));

const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirect(path) }));

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_test";

const auth = await import("./auth");

function resetCache() {
  (auth.getAuthUser as unknown as { reset: () => void }).reset();
}

describe("getAuthUser", () => {
  beforeEach(() => {
    getClaims.mockReset();
    getUser.mockReset();
    redirect.mockClear();
    resetCache();
  });

  it("maps verified JWT claims to an AuthUser", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1", email: "held@example.test" } },
      error: null,
    });

    await expect(auth.getAuthUser()).resolves.toEqual({
      id: "user-1",
      email: "held@example.test",
    });
  });

  it("returns null when the token cannot be verified", async () => {
    getClaims.mockResolvedValue({ data: null, error: new Error("invalid JWT") });

    await expect(auth.getAuthUser()).resolves.toBeNull();
  });

  it("returns a null email when the claim is missing", async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: "user-2" } }, error: null });

    await expect(auth.getAuthUser()).resolves.toEqual({ id: "user-2", email: null });
  });

  it("never asks the auth server", async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } }, error: null });

    await auth.requireAuth();
    await auth.getOptionalUser();

    expect(getUser).not.toHaveBeenCalled();
  });

  it("verifies the token only once per request", async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } }, error: null });

    await auth.requireAuth();
    await auth.getOptionalUser();
    await auth.getAuthUser();

    expect(getClaims).toHaveBeenCalledTimes(1);
  });
});

describe("requireAuth", () => {
  beforeEach(() => {
    getClaims.mockReset();
    redirect.mockClear();
    resetCache();
  });

  it("redirects to /login without a verified user", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });

    await expect(auth.requireAuth()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("returns the user when the token is valid", async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: "user-3" } }, error: null });

    await expect(auth.requireAuth()).resolves.toEqual({ id: "user-3", email: null });
  });
});

describe("getOptionalUser", () => {
  beforeEach(() => {
    getClaims.mockReset();
    resetCache();
  });

  it("returns null instead of redirecting", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });

    await expect(auth.getOptionalUser()).resolves.toBeNull();
  });
});
