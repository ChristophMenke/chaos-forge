import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useLocale: () => "de",
  useTranslations: () => (key: string) => key,
}));

const { BackupOfferDialog } = await import("./backup-offer-dialog");

afterEach(cleanup);

describe("BackupOfferDialog", () => {
  it("asks whether to save a backup and offers to create it right here", () => {
    render(<BackupOfferDialog open onOpenChange={() => {}} />);

    expect(screen.getByText("offerTitle")).toBeInTheDocument();
    expect(screen.getByText("offerText")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "create" })).toBeInTheDocument();
  });

  it("closes on 'later'", async () => {
    const onOpenChange = vi.fn();
    render(<BackupOfferDialog open onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole("button", { name: "later" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything()));
  });

  it("renders nothing while closed", () => {
    render(<BackupOfferDialog open={false} onOpenChange={() => {}} />);
    expect(screen.queryByText("offerTitle")).not.toBeInTheDocument();
  });
});
