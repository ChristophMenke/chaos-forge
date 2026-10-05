import { describe, it, expect } from "vitest";
import { executeApplyPlan, type SupabaseLike } from "./execute-apply-plan";
import type { ApplyOperation } from "./character-diff-types";

interface RecordedCall {
  table: string;
  method: string;
  payload: unknown;
  filter?: { method: string; args: unknown[] };
}

/**
 * Minimaler Fake des Supabase-Query-Builders. Zeichnet auf, was aufgerufen
 * wurde, und liefert für Tabellen aus `failing` einen Fehler zurück.
 */
function makeSupabase(failing: Record<string, string> = {}) {
  const calls: RecordedCall[] = [];

  const client: SupabaseLike = {
    from(table: string) {
      const result = () =>
        Promise.resolve({ error: failing[table] ? { message: failing[table] } : null });

      // Der echte Builder ist selbst awaitable UND bietet Filter-Methoden —
      // deshalb ein Promise, an das die Filter angeheftet werden.
      const withFilter = (call: RecordedCall) =>
        Object.assign(result(), {
          match(criteria: Record<string, string>) {
            call.filter = { method: "match", args: [criteria] };
            return result();
          },
          in(column: string, values: string[]) {
            call.filter = { method: "in", args: [column, values] };
            return result();
          },
        });

      return {
        update(values: Record<string, unknown>) {
          const call: RecordedCall = { table, method: "update", payload: values };
          calls.push(call);
          return withFilter(call);
        },
        insert(rows: Record<string, unknown>[]) {
          calls.push({ table, method: "insert", payload: rows });
          return result();
        },
        upsert(rows: Record<string, unknown>[], options: { onConflict: string }) {
          calls.push({
            table,
            method: "upsert",
            payload: rows,
            filter: {
              method: "onConflict",
              args: [options.onConflict],
            },
          });
          return result();
        },
        delete() {
          const call: RecordedCall = { table, method: "delete", payload: null };
          calls.push(call);
          return withFilter(call);
        },
      };
    },
  };

  return { client, calls };
}

describe("executeApplyPlan", () => {
  it("does nothing for an empty plan", async () => {
    const { client, calls } = makeSupabase();
    expect(await executeApplyPlan(client, [])).toEqual({ applied: 0, failed: [] });
    expect(calls).toHaveLength(0);
  });

  it("runs an update with its match filter", async () => {
    const { client, calls } = makeSupabase();
    const op: ApplyOperation = {
      table: "characters",
      op: "update",
      match: { id: "char-1" },
      values: { hp_max: 29 },
    };
    const result = await executeApplyPlan(client, [op]);
    expect(result.applied).toBe(1);
    expect(calls[0]).toMatchObject({
      table: "characters",
      method: "update",
      payload: { hp_max: 29 },
      filter: { method: "match", args: [{ id: "char-1" }] },
    });
  });

  it("passes the conflict target on an upsert", async () => {
    const { client, calls } = makeSupabase();
    await executeApplyPlan(client, [
      {
        table: "character_spells",
        op: "upsert",
        onConflict: "character_id,spell_id",
        rows: [{ character_id: "char-1", spell_id: "sp-mm" }],
      },
    ]);
    expect(calls[0].filter).toEqual({ method: "onConflict", args: ["character_id,spell_id"] });
  });

  it("bulk-deletes via in()", async () => {
    const { client, calls } = makeSupabase();
    await executeApplyPlan(client, [
      { table: "character_languages", op: "delete", ids: ["lang-1", "lang-2"] },
    ]);
    expect(calls[0].filter).toEqual({ method: "in", args: ["id", ["lang-1", "lang-2"]] });
  });

  it("deletes via match when there is no row id", async () => {
    const { client, calls } = makeSupabase();
    await executeApplyPlan(client, [
      {
        table: "character_spells",
        op: "delete",
        match: { character_id: "char-1", spell_id: "sp-inv" },
      },
    ]);
    expect(calls[0].filter?.method).toBe("match");
  });

  it("collects failures instead of aborting the run", async () => {
    const { client } = makeSupabase({ character_equipment: "RLS denied" });
    const result = await executeApplyPlan(client, [
      { table: "characters", op: "update", match: { id: "char-1" }, values: { hp_max: 29 } },
      { table: "character_equipment", op: "insert", rows: [{ character_id: "char-1" }] },
      { table: "character_languages", op: "delete", ids: ["lang-1"] },
    ]);
    expect(result.applied).toBe(2);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]).toMatchObject({ message: "RLS denied" });
    expect(result.failed[0].operation.table).toBe("character_equipment");
  });

  it("catches a thrown error and reports it as a failed operation", async () => {
    const client: SupabaseLike = {
      from() {
        throw new Error("Netzwerk weg");
      },
    };
    const result = await executeApplyPlan(client, [
      { table: "characters", op: "update", match: { id: "char-1" }, values: {} },
    ]);
    expect(result.applied).toBe(0);
    expect(result.failed[0].message).toBe("Netzwerk weg");
  });

  it("keeps the plan order", async () => {
    const { client, calls } = makeSupabase();
    await executeApplyPlan(client, [
      { table: "character_languages", op: "delete", ids: ["lang-1"] },
      { table: "character_languages", op: "upsert", onConflict: "x", rows: [{}] },
      { table: "characters", op: "update", match: { id: "char-1" }, values: {} },
    ]);
    expect(calls.map((c) => c.method)).toEqual(["delete", "upsert", "update"]);
  });
});
