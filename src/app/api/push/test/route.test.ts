// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

let user: { id: string } | null = { id: "u1" };
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) } }),
}));

let subscriptionCount = 1;
const service = {
  from: () => ({
    select: () => ({ eq: async () => ({ count: subscriptionCount, error: null }) }),
  }),
};
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => service }));

const createNotification = vi.fn();
vi.mock("@/lib/notifications", () => ({ createNotification }));

const { POST } = await import("./route");

beforeEach(() => {
  user = { id: "u1" };
  subscriptionCount = 1;
  createNotification.mockClear();
});

describe("POST /api/push/test", () => {
  it("requires a login", async () => {
    user = null;
    expect((await POST()).status).toBe(401);
  });

  it("refuses without a subscription and creates no notification", async () => {
    subscriptionCount = 0;
    const res = await POST();
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "noSubscription" });
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("creates a test notification for the user, which the webhook pushes", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    expect(createNotification).toHaveBeenCalledWith(service, {
      userId: "u1",
      type: "push_test",
      details: {},
    });
  });
});
