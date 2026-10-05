import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const approval = { userId: "user-1" as string | null, isApproved: true, isLoading: false };

vi.mock("./approval-provider", () => ({ useApproval: () => approval }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

const { ApprovalGate } = await import("./approval-gate");

afterEach(cleanup);

describe("ApprovalGate", () => {
  beforeEach(() => {
    approval.userId = "user-1";
    approval.isApproved = true;
    approval.isLoading = false;
  });

  it("renders the action for an approved user", () => {
    render(<ApprovalGate>action</ApprovalGate>);
    expect(screen.getByText("action")).toBeInTheDocument();
  });

  it("stays permissive while the status is loading", () => {
    approval.isApproved = false;
    approval.isLoading = true;
    render(<ApprovalGate>action</ApprovalGate>);
    expect(screen.getByText("action")).toBeInTheDocument();
  });

  it("shows the locked hint for a pending user", () => {
    approval.isApproved = false;
    render(<ApprovalGate>action</ApprovalGate>);
    expect(screen.queryByText("action")).not.toBeInTheDocument();
    expect(screen.getByTestId("approval-gate-locked")).toBeInTheDocument();
  });

  it("renders nothing for a pending user when the fallback is null", () => {
    approval.isApproved = false;
    const { container } = render(<ApprovalGate fallback={null}>action</ApprovalGate>);
    expect(container).toBeEmptyDOMElement();
  });
});
