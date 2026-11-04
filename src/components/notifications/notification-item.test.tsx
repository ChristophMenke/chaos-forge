import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { NotificationRow } from "@/lib/supabase/types";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
  useLocale: () => "de",
}));

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));

import { NotificationItem } from "./notification-item";

function notification(
  type: NotificationRow["type"],
  details: Record<string, unknown>,
  extra: Partial<NotificationRow> = {}
): NotificationRow {
  return {
    id: "n1",
    user_id: "u1",
    character_id: null,
    type,
    details,
    is_read: false,
    created_at: new Date().toISOString(),
    ...extra,
  };
}

function renderItem(n: NotificationRow) {
  const onMarkRead = vi.fn();
  render(<NotificationItem notification={n} onMarkRead={onMarkRead} onDelete={vi.fn()} />);
  return { onMarkRead, click: () => fireEvent.click(screen.getAllByRole("button")[0]) };
}

describe("NotificationItem", () => {
  it("shows a new game date and opens the settings", () => {
    const { click, onMarkRead } = renderItem(
      notification("game_date_created", { event_date: "2026-11-14", title: "Finale" })
    );

    expect(screen.getByText(/^gameDateCreated:/)).toBeTruthy();
    expect(screen.getByText("Finale")).toBeTruthy();
    click();
    expect(onMarkRead).toHaveBeenCalledWith("n1");
    expect(push).toHaveBeenCalledWith("/settings");
  });

  it("opens the XP dialog of the character for session XP", () => {
    const { click } = renderItem(
      notification(
        "session_xp_awarded",
        { character_name: "Thorin", xp_amount: 1200, session_id: "s1", session_title: "Grauzahn" },
        { character_id: "c1" }
      )
    );

    expect(screen.getByText(/^sessionXpAwarded:.*"character":"Thorin"/)).toBeTruthy();
    click();
    expect(push).toHaveBeenCalledWith("/characters/c1/manage?openXp=1&sessionId=s1&xpAmount=1200");
  });

  it("lists received coins as subtitle and has no link", () => {
    const { click } = renderItem(
      notification("gm_gold_received", { character_name: "Thorin", gp: 50, sp: 3, pp: 0 })
    );

    expect(screen.getByText(/^gmGoldReceived:/)).toBeTruthy();
    expect(screen.getByText("50 GP, 3 SP")).toBeTruthy();
    click();
    expect(push).not.toHaveBeenCalled();
  });
});
