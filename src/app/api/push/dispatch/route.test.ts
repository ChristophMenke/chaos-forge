// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

let notification: Record<string, unknown> | null = null;
const service = {
  from: () => ({
    select: () => ({
      eq: () => ({ maybeSingle: async () => ({ data: notification, error: null }) }),
    }),
  }),
};
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => service }));

const sendPushToUser = vi.fn();
vi.mock("@/lib/push/send", () => ({ sendPushToUser }));

const { POST, runtime } = await import("./route");

function request(body: unknown, secret?: string) {
  return new Request("http://localhost/api/push/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(secret ? { "x-push-secret": secret } : {}) },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("PUSH_WEBHOOK_SECRET", "s3cret");
  sendPushToUser.mockReset().mockResolvedValue({ sent: 1, removed: 0, failed: 0 });
  notification = {
    id: "n1",
    user_id: "u1",
    character_id: null,
    type: "gallery_images_added",
    details: { count: 2 },
    is_read: false,
    created_at: "",
  };
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/push/dispatch", () => {
  it("runs on Node (web-push needs crypto)", () => {
    expect(runtime).toBe("nodejs");
  });

  it.each([undefined, "wrong", "s3cre"])("rejects the secret %s", async (secret) => {
    const res = await POST(request({ notification_id: "n1" }, secret));
    expect(res.status).toBe(401);
    expect(sendPushToUser).not.toHaveBeenCalled();
  });

  it("rejects everything while no secret is configured", async () => {
    vi.stubEnv("PUSH_WEBHOOK_SECRET", "");
    expect((await POST(request({ notification_id: "n1" }, ""))).status).toBe(401);
  });

  it("answers 404 for an unknown notification", async () => {
    notification = null;
    expect((await POST(request({ notification_id: "nope" }, "s3cret"))).status).toBe(404);
  });

  it("sends the notification from the database, not from the request", async () => {
    const res = await POST(
      request({ notification_id: "n1", user_id: "attacker", body: "spam" }, "s3cret")
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: 1, removed: 0, failed: 0 });
    expect(sendPushToUser).toHaveBeenCalledWith(service, "u1", expect.any(Function));
    const build = sendPushToUser.mock.calls[0][2] as (l: string) => { body: string; url: string };
    expect(build("de")).toMatchObject({
      body: "Der Meister hat 2 neue Szenen in die Galerie gehängt",
      url: "/gallery",
    });
  });
});
