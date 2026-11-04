import { describe, it, expect, vi, afterEach } from "vitest";
import {
  disablePush,
  enablePush,
  getCurrentSubscription,
  getPushSupport,
  urlBase64ToUint8Array,
  type PushEnv,
} from "./client";

function env(overrides: Partial<PushEnv> = {}): PushEnv {
  return {
    hasServiceWorker: true,
    hasPushManager: true,
    hasNotification: true,
    permission: "default",
    userAgent: "Mozilla/5.0 (Linux; Android 14) Chrome/130",
    maxTouchPoints: 5,
    isStandalone: false,
    ...overrides,
  };
}

describe("getPushSupport", () => {
  it("is supported in a normal Android browser", () => {
    expect(getPushSupport(env())).toBe("supported");
  });

  it("asks iPhone users to add the app to the home screen first", () => {
    const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Safari/604.1";
    // Safari on iOS without home screen app has no PushManager at all.
    expect(getPushSupport(env({ userAgent: iphone, hasPushManager: false }))).toBe(
      "ios-needs-install"
    );
    expect(getPushSupport(env({ userAgent: iphone, isStandalone: true }))).toBe("supported");
  });

  it("treats an iPad that reports itself as Mac like an iPhone", () => {
    const ipad = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15";
    expect(getPushSupport(env({ userAgent: ipad, hasPushManager: false, maxTouchPoints: 5 }))).toBe(
      "ios-needs-install"
    );
  });

  it("reports browsers without push and denied permissions", () => {
    expect(getPushSupport(env({ hasServiceWorker: false }))).toBe("unsupported");
    expect(getPushSupport(env({ permission: "denied" }))).toBe("denied");
  });
});

describe("urlBase64ToUint8Array", () => {
  it("decodes URL-safe base64 without padding", () => {
    expect(Array.from(urlBase64ToUint8Array("AQID_-8"))).toEqual([1, 2, 3, 255, 239]);
  });
});

describe("enablePush / disablePush", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  function stubBrowser(existing: unknown = null) {
    const subscription = {
      endpoint: "https://push.example/1",
      toJSON: () => ({ endpoint: "https://push.example/1", keys: { p256dh: "p", auth: "a" } }),
      unsubscribe: vi.fn().mockResolvedValue(true),
    };
    const pushManager = {
      getSubscription: vi.fn().mockResolvedValue(existing),
      subscribe: vi.fn().mockResolvedValue(subscription),
    };
    const registration = { pushManager };
    const serviceWorker = {
      register: vi.fn().mockResolvedValue(registration),
      getRegistration: vi.fn().mockResolvedValue(registration),
      ready: Promise.resolve(registration),
    };
    vi.stubGlobal("navigator", { ...navigator, serviceWorker });
    vi.stubGlobal("Notification", { requestPermission: vi.fn().mockResolvedValue("granted") });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "AQID");
    return { subscription, pushManager, serviceWorker, fetchMock };
  }

  it("registers the worker, subscribes and stores the device with its language", async () => {
    const { serviceWorker, pushManager, fetchMock } = stubBrowser();

    expect(await enablePush("en")).toBe("enabled");

    expect(serviceWorker.register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
    expect(pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: expect.any(Uint8Array),
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/push/subscribe",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          endpoint: "https://push.example/1",
          keys: { p256dh: "p", auth: "a" },
          locale: "en",
        }),
      })
    );
  });

  it("returns denied when the user refuses the permission", async () => {
    stubBrowser();
    vi.stubGlobal("Notification", { requestPermission: vi.fn().mockResolvedValue("denied") });
    expect(await enablePush("de")).toBe("denied");
  });

  it("unsubscribes the device and removes it on the server", async () => {
    const existing = {
      endpoint: "https://push.example/1",
      unsubscribe: vi.fn().mockResolvedValue(true),
    };
    const { fetchMock } = stubBrowser(existing);

    expect(await getCurrentSubscription()).toBe(existing);
    await disablePush();

    expect(existing.unsubscribe).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/push/subscribe",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ endpoint: "https://push.example/1" }),
      })
    );
  });

  it("disablePush is a no-op without service worker support", async () => {
    vi.stubGlobal("navigator", { ...navigator, serviceWorker: undefined });
    await expect(disablePush()).resolves.toBeUndefined();
  });
});
