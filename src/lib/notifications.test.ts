import { describe, it, expect, vi } from "vitest";
import { createNotification } from "./notifications";
import type { NotificationType } from "@/lib/supabase/types";

function createMockSupabase() {
  const insertFn = vi.fn().mockResolvedValue({ error: null });
  return {
    client: {
      from: vi.fn().mockReturnValue({
        insert: insertFn,
      }),
    },
    insertFn,
  };
}

describe("createNotification", () => {
  const NOTIFICATION_TYPES: NotificationType[] = [
    "gm_item_received",
    "gm_gold_received",
    "party_item_received",
    "party_gold_received",
    "trade_item_received",
    "trade_gold_received",
  ];

  it.each(NOTIFICATION_TYPES)("creates notification with type %s", async (type) => {
    const { client, insertFn } = createMockSupabase();

    await createNotification(client as never, {
      userId: "user-123",
      characterId: "char-456",
      type,
      details: { item_name: "Longsword +1", quantity: 1 },
    });

    expect(client.from).toHaveBeenCalledWith("notifications");
    expect(insertFn).toHaveBeenCalledWith({
      user_id: "user-123",
      character_id: "char-456",
      type,
      details: { item_name: "Longsword +1", quantity: 1 },
    });
  });

  it("handles optional characterId (defaults to null)", async () => {
    const { client, insertFn } = createMockSupabase();

    await createNotification(client as never, {
      userId: "user-123",
      type: "gm_gold_received",
      details: { gp: 50 },
    });

    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        character_id: null,
      })
    );
  });

  it("passes gold details correctly", async () => {
    const { client, insertFn } = createMockSupabase();

    const goldDetails = { pp: 10, gp: 50, ep: 0, sp: 20, cp: 5, character_name: "Larry" };

    await createNotification(client as never, {
      userId: "user-123",
      characterId: "char-456",
      type: "gm_gold_received",
      details: goldDetails,
    });

    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        details: goldDetails,
      })
    );
  });

  it("passes trade details with from_character", async () => {
    const { client, insertFn } = createMockSupabase();

    await createNotification(client as never, {
      userId: "user-123",
      characterId: "char-456",
      type: "trade_item_received",
      details: {
        item_name: "Seil",
        quantity: 2,
        from_character: "Gor",
        character_name: "Larry",
      },
    });

    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        details: {
          item_name: "Seil",
          quantity: 2,
          from_character: "Gor",
          character_name: "Larry",
        },
      })
    );
  });
});
