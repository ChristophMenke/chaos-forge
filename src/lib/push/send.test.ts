// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));
const setVapidDetails = vi.fn();
vi.mock("web-push", () => ({ default: { setVapidDetails, sendNotification: vi.fn() } }));

const { sendPushToUser } = await import("./send");

const PAYLOAD = { title: "Chaos Forge", body: "Hallo", url: "/gallery", tag: "n1" };

function subscription(id: string, locale: "de" | "en" = "de") {
  return { id, endpoint: `https://push.example/${id}`, p256dh: "p", auth: "a", locale };
}

function fakeService(subs: ReturnType<typeof subscription>[]) {
  const deleted: string[] = [];
  const touched: string[] = [];
  const service = {
    from: () => ({
      select: () => ({ eq: async () => ({ data: subs, error: null }) }),
      delete: () => ({
        in: async (_col: string, ids: string[]) => {
          deleted.push(...ids);
          return { error: null };
        },
      }),
      update: () => ({
        in: async (_col: string, ids: string[]) => {
          touched.push(...ids);
          return { error: null };
        },
      }),
    }),
  };
  return { service, deleted, touched };
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "pub");
  vi.stubEnv("VAPID_PRIVATE_KEY", "priv");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  setVapidDetails.mockClear();
});

describe("sendPushToUser", () => {
  it("sends to every device in its own language and touches last_used_at", async () => {
    const { service, touched } = fakeService([subscription("s1", "de"), subscription("s2", "en")]);
    const sender = vi.fn().mockResolvedValue({ statusCode: 201 });
    const build = vi.fn((locale: string) => ({ ...PAYLOAD, body: locale }));

    const result = await sendPushToUser(service as never, "u1", build, sender);

    expect(result).toEqual({ sent: 2, removed: 0, failed: 0 });
    expect(setVapidDetails).toHaveBeenCalledWith(expect.stringMatching(/^mailto:/), "pub", "priv");
    expect(sender).toHaveBeenCalledWith(
      { endpoint: "https://push.example/s1", keys: { p256dh: "p", auth: "a" } },
      JSON.stringify({ ...PAYLOAD, body: "de" }),
      { TTL: 60 * 60 * 24 }
    );
    expect(sender.mock.calls[1][1]).toContain('"body":"en"');
    expect(touched).toEqual(["s1", "s2"]);
  });

  it("removes subscriptions the push service no longer knows", async () => {
    const { service, deleted } = fakeService([
      subscription("gone"),
      subscription("expired"),
      subscription("flaky"),
    ]);
    const sender = vi
      .fn()
      .mockRejectedValueOnce({ statusCode: 404 })
      .mockRejectedValueOnce({ statusCode: 410 })
      .mockRejectedValueOnce({ statusCode: 500 });

    const result = await sendPushToUser(service as never, "u1", () => PAYLOAD, sender);

    expect(result).toEqual({ sent: 0, removed: 2, failed: 1 });
    expect(deleted).toEqual(["gone", "expired"]);
  });

  it("does nothing without VAPID keys", async () => {
    vi.stubEnv("VAPID_PRIVATE_KEY", "");
    const { service } = fakeService([subscription("s1")]);
    const sender = vi.fn();

    expect(await sendPushToUser(service as never, "u1", () => PAYLOAD, sender)).toEqual({
      sent: 0,
      removed: 0,
      failed: 0,
    });
    expect(sender).not.toHaveBeenCalled();
  });
});
