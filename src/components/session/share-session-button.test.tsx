import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// useTranslations → return the raw key so we can assert against keys.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const rpcMock = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ rpc: rpcMock }),
}));

// Imported AFTER mocks are registered.
import { ShareSessionButton } from "./share-session-button";

const SESSION_ID = "11111111-1111-1111-1111-111111111111";

describe("ShareSessionButton", () => {
  beforeEach(() => {
    rpcMock.mockResolvedValue({ error: null });
  });

  it("opens the share dialog on click", () => {
    render(<ShareSessionButton sessionId={SESSION_ID} initialIsPublic={false} />);
    fireEvent.click(screen.getByTestId("session-share-button"));
    expect(screen.getByText("shareTitle")).toBeInTheDocument();
  });

  it("hides the link while the session is private", () => {
    render(<ShareSessionButton sessionId={SESSION_ID} initialIsPublic={false} />);
    fireEvent.click(screen.getByTestId("session-share-button"));
    expect(screen.queryByTestId("session-share-url")).not.toBeInTheDocument();
    expect(screen.getByText("shareMakePublic")).toBeInTheDocument();
  });

  it("shows the public link when already shared", () => {
    render(<ShareSessionButton sessionId={SESSION_ID} initialIsPublic={true} />);
    fireEvent.click(screen.getByTestId("session-share-button"));
    const input = screen.getByTestId("session-share-url") as HTMLInputElement;
    expect(input.value).toContain(`/share/sessions/${SESSION_ID}`);
  });

  it("calls the set_session_public RPC with the new value when toggling on", async () => {
    render(<ShareSessionButton sessionId={SESSION_ID} initialIsPublic={false} />);
    fireEvent.click(screen.getByTestId("session-share-button"));
    fireEvent.click(screen.getByTestId("session-share-toggle"));

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("set_session_public", {
        p_session_id: SESSION_ID,
        p_is_public: true,
      });
    });
    // After enabling, the link becomes visible.
    await waitFor(() => {
      expect(screen.getByTestId("session-share-url")).toBeInTheDocument();
    });
  });

  it("toggles back to private", async () => {
    render(<ShareSessionButton sessionId={SESSION_ID} initialIsPublic={true} />);
    fireEvent.click(screen.getByTestId("session-share-button"));
    fireEvent.click(screen.getByTestId("session-share-toggle"));

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("set_session_public", {
        p_session_id: SESSION_ID,
        p_is_public: false,
      });
    });
  });
});
