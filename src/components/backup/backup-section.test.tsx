import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useLocale: () => "de",
  useTranslations: () => (key: string) => key,
}));

const { BackupSection } = await import("./backup-section");

afterEach(cleanup);

describe("BackupSection", () => {
  it("explains the backup and offers to create one", () => {
    render(<BackupSection />);

    const section = screen.getByTestId("settings-section-backup");
    expect(within(section).getByRole("heading", { name: "sectionTitle" })).toBeInTheDocument();
    expect(within(section).getByText("hint")).toBeInTheDocument();
    expect(within(section).getByRole("button", { name: "create" })).toBeInTheDocument();
  });
});
