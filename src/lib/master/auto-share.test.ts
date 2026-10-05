import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const upsert = vi.fn().mockResolvedValue({ error: null });
const characters = { data: [{ id: "c1" }, { id: "c2" }] as { id: string }[] | null };
const eq = vi.fn(() => Promise.resolve(characters));
const from = vi.fn((table: string) =>
  table === "characters" ? { select: () => ({ eq }) } : { upsert }
);

vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({ from }) }));

const cookies = vi.fn();
vi.mock("next/headers", () => ({ cookies }));

const { shareActiveCharactersWith } = await import("./auto-share");

describe("shareActiveCharactersWith", () => {
  beforeEach(() => {
    upsert.mockClear();
    eq.mockClear();
    characters.data = [{ id: "c1" }, { id: "c2" }];
  });

  it("shares every active character with the given user, keeping existing shares", async () => {
    await shareActiveCharactersWith("gm-user");

    expect(eq).toHaveBeenCalledWith("is_active", true);
    expect(upsert).toHaveBeenCalledWith(
      [
        { character_id: "c1", shared_with_user_id: "gm-user" },
        { character_id: "c2", shared_with_user_id: "gm-user" },
      ],
      { onConflict: "character_id,shared_with_user_id", ignoreDuplicates: true }
    );
  });

  it("skips the upsert when there are no active characters", async () => {
    characters.data = [];
    await shareActiveCharactersWith("gm-user");
    expect(upsert).not.toHaveBeenCalled();
  });

  // It runs inside after(), where reading cookies throws at runtime.
  it("never touches request cookies", async () => {
    await shareActiveCharactersWith("gm-user");
    expect(cookies).not.toHaveBeenCalled();
  });
});
