import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { RELEASES } from "@/lib/release-notes";

vi.mock("next-intl", () => ({
  useLocale: () => "de",
  useTranslations: () => (key: string) => key,
}));

const { ReleaseNotesSection } = await import("./release-notes-section");

afterEach(cleanup);

describe("ReleaseNotesSection", () => {
  it("shows all releases under 'What's new' in the settings", () => {
    render(<ReleaseNotesSection />);

    const section = screen.getByTestId("settings-section-release-notes");
    expect(within(section).getByRole("heading", { name: "sectionTitle" })).toBeInTheDocument();
    expect(within(section).getAllByTestId("release-notes-release")).toHaveLength(RELEASES.length);
  });
});
