import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StrictMode, type ReactNode } from "react";
import { cleanup, act, render, screen, waitFor } from "@testing-library/react";

const channelNames: string[] = [];
const removedChannels: unknown[] = [];
const profileQueries: string[] = [];
let approved = true;

type ChangeHandler = (payload: { new: { is_approved?: boolean } }) => void;

function makeChannel(name: string) {
  const channel = {
    name,
    subscribed: false,
    handler: null as ChangeHandler | null,
    on: vi.fn((_event: string, _filter: unknown, handler: ChangeHandler) => {
      // Mirrors realtime-js: registering a callback after subscribe() throws.
      if (channel.subscribed) {
        throw new Error(
          `cannot add \`postgres_changes\` callbacks for realtime:${name} after \`subscribe()\`.`
        );
      }
      channel.handler = handler;
      return channel;
    }),
    subscribe: vi.fn(() => {
      channel.subscribed = true;
      return channel;
    }),
  };
  return channel;
}

// One client per app, mirroring the real singleton: asking for the same channel
// name twice hands back the very same (already subscribed) channel object.
const openChannels = new Map<string, ReturnType<typeof makeChannel>>();
let claimsUserId: string | null = "user-1";

const mockClient = {
  auth: {
    getClaims: () =>
      Promise.resolve(
        claimsUserId
          ? { data: { claims: { sub: claimsUserId } }, error: null }
          : { data: null, error: null }
      ),
  },
  from: () => ({
    select: () => ({
      eq: (_column: string, value: string) => {
        profileQueries.push(value);
        return {
          maybeSingle: () =>
            Promise.resolve({ data: { is_approved: approved, email: "a@b.test" } }),
        };
      },
    }),
  }),
  channel: (name: string) => {
    channelNames.push(name);
    const existing = openChannels.get(name);
    if (existing) return existing;
    const created = makeChannel(name);
    openChannels.set(name, created);
    return created;
  },
  removeChannel: (channel: unknown) => {
    removedChannels.push(channel);
    for (const [name, value] of openChannels) {
      if (value === channel) openChannels.delete(name);
    }
  },
};

vi.mock("@/lib/supabase/client", () => ({ createClient: () => mockClient }));

const { ApprovalProvider, useApproval } = await import("./approval-provider");

function Probe({ label }: { label: string }) {
  const { userId, isApproved, isLoading } = useApproval();
  return (
    <span data-testid={label}>
      {`${userId ?? "none"}|${isApproved ? "approved" : "pending"}|${isLoading ? "loading" : "ready"}`}
    </span>
  );
}

function renderWithProvider(children: ReactNode) {
  return render(<ApprovalProvider>{children}</ApprovalProvider>);
}

afterEach(cleanup);

describe("ApprovalProvider", () => {
  beforeEach(() => {
    channelNames.length = 0;
    removedChannels.length = 0;
    profileQueries.length = 0;
    openChannels.clear();
    approved = true;
    claimsUserId = "user-1";
  });

  it("serves every consumer from a single profile query and channel", async () => {
    renderWithProvider(
      <>
        <Probe label="banner" />
        <Probe label="gate-1" />
        <Probe label="gate-2" />
      </>
    );

    await waitFor(() =>
      expect(screen.getByTestId("gate-2")).toHaveTextContent("user-1|approved|ready")
    );
    expect(profileQueries).toEqual(["user-1"]);
    expect(channelNames).toHaveLength(1);
  });

  it("reports a pending user and flips to approved on the realtime update", async () => {
    approved = false;
    renderWithProvider(<Probe label="banner" />);

    await waitFor(() =>
      expect(screen.getByTestId("banner")).toHaveTextContent("user-1|pending|ready")
    );

    const channel = openChannels.values().next().value!;
    act(() => channel.handler!({ new: { is_approved: true } }));

    expect(screen.getByTestId("banner")).toHaveTextContent("user-1|approved|ready");
  });

  it("removes its channel on unmount", async () => {
    const { unmount } = renderWithProvider(<Probe label="banner" />);
    await waitFor(() => expect(channelNames).toHaveLength(1));

    unmount();
    expect(removedChannels).toHaveLength(1);
  });

  /**
   * Regression for #174: StrictMode mounts effects twice. A fixed channel name
   * would hand the second mount the already-subscribed channel, and calling
   * .on() on it throws, taking the page down through the error boundary.
   */
  it("survives a StrictMode double mount", async () => {
    render(
      <StrictMode>
        <ApprovalProvider>
          <Probe label="banner" />
        </ApprovalProvider>
      </StrictMode>
    );

    await waitFor(() =>
      expect(screen.getByTestId("banner")).toHaveTextContent("user-1|approved|ready")
    );
  });

  it("does not query or subscribe without a logged-in user", async () => {
    claimsUserId = null;
    renderWithProvider(<Probe label="banner" />);

    await waitFor(() =>
      expect(screen.getByTestId("banner")).toHaveTextContent("none|approved|ready")
    );
    expect(profileQueries).toHaveLength(0);
    expect(channelNames).toHaveLength(0);
  });

  it("falls back to a permissive state outside the provider", () => {
    render(<Probe label="orphan" />);
    expect(screen.getByTestId("orphan")).toHaveTextContent("none|approved|ready");
  });
});
