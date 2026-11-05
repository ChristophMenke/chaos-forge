import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { RELEASES, groupReleasesByDay } from "@/lib/release-notes";

const DAYS = groupReleasesByDay(RELEASES);

vi.mock("next-intl", () => ({
  useLocale: () => "de",
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

const { ReleaseNotesSection } = await import("./release-notes-section");

afterEach(cleanup);

describe("ReleaseNotesSection", () => {
  it("shows only the newest release day in the settings", () => {
    render(<ReleaseNotesSection />);

    const section = screen.getByTestId("settings-section-release-notes");
    expect(within(section).getByRole("heading", { name: "sectionTitle" })).toBeInTheDocument();
    const shown = within(section).getAllByTestId("release-notes-release");
    expect(shown).toHaveLength(1);
    for (const release of RELEASES.filter((r) => r.date === RELEASES[0].date)) {
      expect(shown[0]).toHaveTextContent(release.items[0].title.de);
    }
  });

  it("opens the older releases as cards, one card per older day", () => {
    render(<ReleaseNotesSection />);

    const button = screen.getByTestId("release-notes-older");
    expect(button).toHaveTextContent(`olderButton:{"count":${DAYS.length - 1}}`);
    expect(screen.queryByTestId("older-releases")).toBeNull();

    fireEvent.click(button);
    const viewer = screen.getByTestId("older-releases");
    expect(within(viewer).getByTestId("release-notes-release")).toHaveTextContent(
      DAYS[1].items[0].title.de
    );
  });
});
