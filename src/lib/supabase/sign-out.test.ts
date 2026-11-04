import { describe, it, expect, vi } from "vitest";

const calls: string[] = [];
vi.mock("@/lib/push/client", () => ({
  disablePush: vi.fn(async () => {
    calls.push("disablePush");
  }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn(async () => {
        calls.push("signOut");
      }),
    },
  }),
}));

const { signOut } = await import("./sign-out");

describe("signOut", () => {
  it("turns push off on this device before signing out", async () => {
    await signOut();
    // Afterwards the subscribe API would answer 401, so the order matters.
    expect(calls).toEqual(["disablePush", "signOut"]);
  });
});
