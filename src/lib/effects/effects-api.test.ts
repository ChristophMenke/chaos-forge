import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createEffect, endAllEffects, endEffect, saveTempHp, updateEffect } from "./effects-api";
import type { CharacterEffectRow } from "@/lib/supabase/types";

type Call = { table: string; action: string; values?: unknown; filters: [string, unknown][] };

function fakeSupabase(
  result: { data?: unknown; error?: { message: string; code?: string } | null } = {}
) {
  const calls: Call[] = [];
  const client = {
    from: (table: string) => {
      const call: Call = { table, action: "", filters: [] };
      calls.push(call);
      const builder = {
        insert(values: unknown) {
          call.action = "insert";
          call.values = values;
          return builder;
        },
        update(values: unknown) {
          call.action = "update";
          call.values = values;
          return builder;
        },
        eq(column: string, value: unknown) {
          call.filters.push([column, value]);
          return builder;
        },
        is(column: string, value: unknown) {
          call.filters.push([column, value]);
          return builder;
        },
        select() {
          return builder;
        },
        single() {
          return Promise.resolve({ data: result.data ?? null, error: result.error ?? null });
        },
        then(resolve: (v: unknown) => unknown) {
          return Promise.resolve({ data: result.data ?? null, error: result.error ?? null }).then(
            resolve
          );
        },
      };
      return builder;
    },
  };
  return { client: client as unknown as SupabaseClient, calls };
}

const draft = {
  name: "Segen",
  notes: "",
  duration_text: "6 Runden",
  preset_key: "bless",
  modifiers: [{ target: "attack" as const, op: "delta" as const, value: 1 }],
  flags: [],
};

describe("effects api", () => {
  it("creates an effect with its starting temporary hit points", async () => {
    const created = { id: "e1", ...draft } as unknown as CharacterEffectRow;
    const { client, calls } = fakeSupabase({ data: created });
    const result = await createEffect(client, "c1", {
      ...draft,
      modifiers: [...draft.modifiers, { target: "tempHp", op: "delta", value: 6 }],
    });

    expect(result).toMatchObject({ ok: true, after: created });
    expect(calls[0]).toMatchObject({ table: "character_effects", action: "insert" });
    expect(calls[0].values).toMatchObject({
      character_id: "c1",
      name: "Segen",
      temp_hp_remaining: 6,
    });
  });

  it("updates an effect and keeps the before state for undo", async () => {
    const before = { id: "e1", ...draft } as unknown as CharacterEffectRow;
    const { client, calls } = fakeSupabase({ data: { ...before, name: "Großer Segen" } });
    const result = await updateEffect(client, before, { ...draft, name: "Großer Segen" });

    expect(result).toMatchObject({ ok: true, before, after: { name: "Großer Segen" } });
    expect(calls[0]).toMatchObject({ action: "update", filters: [["id", "e1"]] });
  });

  it("ends an effect by setting ended_at instead of deleting it", async () => {
    const { client, calls } = fakeSupabase();
    await endEffect(client, "e1");
    expect(calls[0].action).toBe("update");
    expect(calls[0].values).toHaveProperty("ended_at");
    expect(calls[0].filters).toEqual([["id", "e1"]]);
  });

  it("ends all active effects of one character only", async () => {
    const { client, calls } = fakeSupabase();
    await endAllEffects(client, "c1");
    expect(calls[0].filters).toEqual([
      ["character_id", "c1"],
      ["ended_at", null],
    ]);
  });

  it("saves the remaining temporary hit points", async () => {
    const { client, calls } = fakeSupabase();
    await saveTempHp(client, [{ id: "e1", temp_hp_remaining: 0 }]);
    expect(calls[0]).toMatchObject({
      action: "update",
      values: { temp_hp_remaining: 0 },
      filters: [["id", "e1"]],
    });
  });

  it("returns errors instead of throwing and recognises a missing approval", async () => {
    const failed = await endEffect(fakeSupabase({ error: { message: "boom" } }).client, "e1");
    expect(failed).toMatchObject({ ok: false, error: "boom", notApproved: false });

    const blocked = await endEffect(
      fakeSupabase({ error: { message: "user_not_approved", code: "42501" } }).client,
      "e1"
    );
    expect(blocked.notApproved).toBe(true);
  });
});
