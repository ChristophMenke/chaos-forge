import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { Release } from "@/lib/release-notes";

let locale = "de";
vi.mock("next-intl", () => ({
  useLocale: () => locale,
  useTranslations: () => (key: string) => (key === "botName" ? "SvenBot" : key),
}));

const { ReleaseNotesList } = await import("./release-notes-list");

afterEach(() => {
  cleanup();
  locale = "de";
});

const RELEASES: Release[] = [
  {
    id: "2026-10-31",
    date: "2026-10-31",
    items: [
      {
        icon: "svenbot",
        title: { de: "SvenBot lebt!", en: "SvenBot lives!" },
        text: { de: "Fies und korrekt.", en: "Mean and correct." },
      },
      {
        icon: "undo",
        title: { de: "Rückgängig", en: "Undo" },
        text: { de: "Pfeile oben.", en: "Arrows on top." },
      },
    ],
  },
  {
    id: "2026-09-01",
    date: "2026-09-01",
    items: [
      {
        icon: "effects",
        title: { de: "Effekte", en: "Effects" },
        text: { de: "Zustände.", en: "Conditions." },
      },
    ],
  },
];

describe("ReleaseNotesList", () => {
  it("lists every release with its long German date, newest first", () => {
    render(<ReleaseNotesList releases={RELEASES} />);

    const releases = screen.getAllByTestId("release-notes-release");
    expect(releases).toHaveLength(2);
    // Local midnight via parseGameDate — never shifted to the 30th by UTC parsing.
    expect(within(releases[0]).getByText("31. Oktober 2026")).toBeInTheDocument();
    expect(within(releases[1]).getByText("1. September 2026")).toBeInTheDocument();
  });

  it("shows titles and texts in the player's language", () => {
    locale = "en";
    render(<ReleaseNotesList releases={RELEASES} />);

    expect(screen.getByText("October 31, 2026")).toBeInTheDocument();
    expect(screen.getByText("SvenBot lives!")).toBeInTheDocument();
    expect(screen.getByText("Mean and correct.")).toBeInTheDocument();
    expect(screen.queryByText("SvenBot lebt!")).not.toBeInTheDocument();
  });

  it("marks the SvenBot entry with Sven's face", () => {
    render(<ReleaseNotesList releases={RELEASES} />);

    const item = screen.getByText("SvenBot lebt!").closest("li") as HTMLElement;
    expect(item.querySelector("img")).not.toBeNull();
  });
});
