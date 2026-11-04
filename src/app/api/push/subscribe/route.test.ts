// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

let user: { id: string } | null = { id: "u1" };
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) } }),
}));

const upsert = vi.fn(async () => ({ error: null }));
const deleteEq = vi.fn();
const service = {
  from: () => ({
    upsert,
    delete: () => ({
      eq: (col: string, value: string) => {
        deleteEq(col, value);
        return {
          eq: async (col2: string, value2: string) => {
            deleteEq(col2, value2);
            return { error: null };
          },
        };
      },
    }),
  }),
};
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => service }));

const { POST, DELETE } = await import("./route");

const VALID = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  keys: { p256dh: "BPkey", auth: "authkey" },
  locale: "en",
};

function request(method: string, body: unknown) {
  return new Request("http://localhost/api/push/subscribe", {
    method,
    headers: { "Content-Type": "application/json", "user-agent": "iPhone Safari" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  user = { id: "u1" };
  upsert.mockClear();
  deleteEq.mockClear();
});

describe("POST /api/push/subscribe", () => {
  it("requires a login", async () => {
    user = null;
    expect((await POST(request("POST", VALID))).status).toBe(401);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("stores the device for the current user, replacing an earlier owner of the endpoint", async () => {
    const res = await POST(request("POST", VALID));

    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      {
        user_id: "u1",
        endpoint: VALID.endpoint,
        p256dh: "BPkey",
        auth: "authkey",
        locale: "en",
        user_agent: "iPhone Safari",
      },
      { onConflict: "endpoint" }
    );
  });

  it("falls back to German for unknown locales", async () => {
    await POST(request("POST", { ...VALID, locale: "fr" }));
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ locale: "de" }),
      expect.anything()
    );
  });

  it.each([
    ["a non-https endpoint", { ...VALID, endpoint: "http://evil.example" }],
    ["missing keys", { endpoint: VALID.endpoint }],
    ["no body", null],
  ])("rejects %s", async (_label, body) => {
    expect((await POST(request("POST", body))).status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/push/subscribe", () => {
  it("deletes only the current user's device", async () => {
    const res = await DELETE(request("DELETE", { endpoint: VALID.endpoint }));
    expect(res.status).toBe(200);
    expect(deleteEq).toHaveBeenCalledWith("endpoint", VALID.endpoint);
    expect(deleteEq).toHaveBeenCalledWith("user_id", "u1");
  });

  it("requires a login", async () => {
    user = null;
    expect((await DELETE(request("DELETE", { endpoint: VALID.endpoint }))).status).toBe(401);
  });
});
