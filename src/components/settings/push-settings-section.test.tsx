import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

const { toast, push } = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn() },
  push: {
    support: "supported" as string,
    subscription: null as unknown,
    enablePush: vi.fn(),
    disablePush: vi.fn(),
    refreshSubscription: vi.fn(),
  },
}));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/push/client", () => ({
  readPushEnv: () => ({}),
  getPushSupport: () => push.support,
  getCurrentSubscription: async () => push.subscription,
  enablePush: (...args: unknown[]) => push.enablePush(...args),
  disablePush: () => push.disablePush(),
  refreshSubscription: (...args: unknown[]) => push.refreshSubscription(...args),
}));

import { PushSettingsSection } from "./push-settings-section";

const toggle = () => screen.getByTestId("settings-push-toggle");

beforeEach(() => {
  push.support = "supported";
  push.subscription = null;
  push.enablePush.mockResolvedValue("enabled");
  push.disablePush.mockResolvedValue(undefined);
  push.refreshSubscription.mockResolvedValue(undefined);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
});

describe("PushSettingsSection", () => {
  it("is off without subscription and turns push on in the current language", async () => {
    render(<PushSettingsSection />);
    await waitFor(() => expect(toggle().getAttribute("aria-checked")).toBe("false"));
    expect(screen.queryByTestId("settings-push-test")).toBeNull();

    fireEvent.click(toggle());

    await waitFor(() => expect(toggle().getAttribute("aria-checked")).toBe("true"));
    expect(push.enablePush).toHaveBeenCalledWith("en");
    expect(screen.getByTestId("settings-push-test")).toBeTruthy();
  });

  it("shows on for a subscribed device and re-stores the subscription with the language", async () => {
    push.subscription = { endpoint: "https://push.example/1" };
    render(<PushSettingsSection />);

    await waitFor(() => expect(toggle().getAttribute("aria-checked")).toBe("true"));
    expect(push.refreshSubscription).toHaveBeenCalledWith("en");
  });

  it("turns push off", async () => {
    push.subscription = { endpoint: "https://push.example/1" };
    render(<PushSettingsSection />);
    await waitFor(() => expect(toggle().getAttribute("aria-checked")).toBe("true"));

    fireEvent.click(toggle());

    await waitFor(() => expect(toggle().getAttribute("aria-checked")).toBe("false"));
    expect(push.disablePush).toHaveBeenCalled();
  });

  it("explains a refused permission after the prompt", async () => {
    push.enablePush.mockResolvedValue("denied");
    render(<PushSettingsSection />);
    await waitFor(() => expect(toggle().getAttribute("aria-checked")).toBe("false"));

    fireEvent.click(toggle());

    expect(await screen.findByText("pushDenied")).toBeTruthy();
  });

  it.each([
    ["ios-needs-install", "pushIosInstall"],
    ["unsupported", "pushUnsupported"],
    ["denied", "pushDenied"],
  ])("disables the switch for %s with a hint", async (support, hint) => {
    push.support = support;
    render(<PushSettingsSection />);

    expect(await screen.findByText(hint)).toBeTruthy();
    expect((toggle() as HTMLButtonElement).disabled).toBe(true);
  });

  it("sends a test notification and reports a missing subscription", async () => {
    push.subscription = { endpoint: "https://push.example/1" };
    render(<PushSettingsSection />);
    fireEvent.click(await screen.findByTestId("settings-push-test"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("pushTestSent"));
    expect(fetch).toHaveBeenCalledWith("/api/push/test", { method: "POST" });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 409 }));
    fireEvent.click(screen.getByTestId("settings-push-test"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("pushTestFailed"));
  });
});
