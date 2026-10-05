import { describe, it, expect } from "vitest";
import {
  parseGameDate,
  todayInGroupTimezone,
  GROUP_TIME_ZONE,
  daysUntil,
  isPastGameDate,
  splitUpcomingPast,
  formatGameDate,
  validateGameDate,
  resolveGameDateTitle,
  toDateInputValue,
  MAX_GAME_DATE_TITLE_LENGTH,
} from "./index";
import type { GameDateRow } from "@/lib/supabase/types";

function makeDate(overrides: Partial<GameDateRow> = {}): GameDateRow {
  return {
    id: "game-date-1",
    event_date: "2026-06-20",
    title: null,
    created_by: "user-1",
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

// Reference "today" for all deterministic assertions: 2026-06-18, 22:30 local.
// The late hour is deliberate — it catches implementations that compare raw
// timestamps instead of calendar days.
const TODAY = new Date(2026, 5, 18, 22, 30, 0);

describe("parseGameDate", () => {
  it("parses an ISO date into local midnight", () => {
    const parsed = parseGameDate("2026-06-20");
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(5);
    expect(parsed.getDate()).toBe(20);
    expect(parsed.getHours()).toBe(0);
  });

  it("does not shift the day across timezones (no UTC parsing)", () => {
    // new Date("2026-01-01") would be UTC midnight and can render as Dec 31
    // in negative-offset zones. Ours must stay on the 1st.
    expect(parseGameDate("2026-01-01").getDate()).toBe(1);
  });
});

describe("daysUntil", () => {
  it("returns 0 for today even late in the evening", () => {
    expect(daysUntil("2026-06-18", TODAY)).toBe(0);
  });

  it("returns 1 for tomorrow", () => {
    expect(daysUntil("2026-06-19", TODAY)).toBe(1);
  });

  it("returns a positive count for future dates", () => {
    expect(daysUntil("2026-06-20", TODAY)).toBe(2);
  });

  it("returns a negative count for past dates", () => {
    expect(daysUntil("2026-06-17", TODAY)).toBe(-1);
  });

  it("counts across a month boundary", () => {
    expect(daysUntil("2026-07-01", TODAY)).toBe(13);
  });

  it("counts across a DST change without off-by-one", () => {
    // Europe/Berlin switches to CEST on 2026-03-29.
    const beforeDst = new Date(2026, 2, 27, 12, 0, 0);
    expect(daysUntil("2026-03-31", beforeDst)).toBe(4);
  });
});

describe("isPastGameDate", () => {
  it("treats today as not past", () => {
    expect(isPastGameDate("2026-06-18", TODAY)).toBe(false);
  });

  it("treats yesterday as past", () => {
    expect(isPastGameDate("2026-06-17", TODAY)).toBe(true);
  });
});

describe("splitUpcomingPast", () => {
  const dates = [
    makeDate({ id: "past-old", event_date: "2026-01-10" }),
    makeDate({ id: "future-far", event_date: "2026-08-01" }),
    makeDate({ id: "today", event_date: "2026-06-18" }),
    makeDate({ id: "past-recent", event_date: "2026-06-17" }),
    makeDate({ id: "future-near", event_date: "2026-06-20" }),
  ];

  it("sorts upcoming dates ascending, nearest first", () => {
    const { upcoming } = splitUpcomingPast(dates, TODAY);
    expect(upcoming.map((d) => d.id)).toEqual(["today", "future-near", "future-far"]);
  });

  it("sorts past dates descending, most recent first", () => {
    const { past } = splitUpcomingPast(dates, TODAY);
    expect(past.map((d) => d.id)).toEqual(["past-recent", "past-old"]);
  });

  it("keeps today in upcoming — the session has not happened yet", () => {
    const { upcoming, past } = splitUpcomingPast([makeDate({ event_date: "2026-06-18" })], TODAY);
    expect(upcoming).toHaveLength(1);
    expect(past).toHaveLength(0);
  });

  it("returns empty lists for no dates", () => {
    expect(splitUpcomingPast([], TODAY)).toEqual({ upcoming: [], past: [] });
  });

  it("does not mutate the input array", () => {
    const input = [...dates];
    splitUpcomingPast(input, TODAY);
    expect(input.map((d) => d.id)).toEqual(dates.map((d) => d.id));
  });

  it("keeps both entries when two dates fall on the same day", () => {
    const sameDay = [
      makeDate({ id: "a", event_date: "2026-06-20" }),
      makeDate({ id: "b", event_date: "2026-06-20" }),
    ];
    expect(splitUpcomingPast(sameDay, TODAY).upcoming).toHaveLength(2);
  });
});

describe("formatGameDate", () => {
  it("formats German locale with weekday", () => {
    const formatted = formatGameDate("2026-06-20", "de");
    expect(formatted).toContain("20");
    expect(formatted).toContain("2026");
  });

  it("differs between locales", () => {
    expect(formatGameDate("2026-06-20", "de")).not.toBe(formatGameDate("2026-06-20", "en"));
  });
});

describe("resolveGameDateTitle", () => {
  it("returns the title when set", () => {
    expect(resolveGameDateTitle("Finale in Waterdeep", "Rollenspielabend")).toBe(
      "Finale in Waterdeep"
    );
  });

  it("falls back for null", () => {
    expect(resolveGameDateTitle(null, "Rollenspielabend")).toBe("Rollenspielabend");
  });

  it("falls back for a whitespace-only title", () => {
    expect(resolveGameDateTitle("   ", "Rollenspielabend")).toBe("Rollenspielabend");
  });

  it("trims surrounding whitespace", () => {
    expect(resolveGameDateTitle("  Endkampf  ", "Rollenspielabend")).toBe("Endkampf");
  });
});

describe("toDateInputValue", () => {
  it("formats a Date as YYYY-MM-DD in local time", () => {
    expect(toDateInputValue(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("validateGameDate", () => {
  it("accepts a future date without title", () => {
    const result = validateGameDate({ eventDate: "2026-06-20", title: "" }, TODAY);
    expect(result.error).toBeNull();
    expect(result.warning).toBeNull();
  });

  it("rejects an empty date", () => {
    expect(validateGameDate({ eventDate: "", title: "" }, TODAY).error).toBe("dateRequired");
  });

  it("rejects a malformed date", () => {
    expect(validateGameDate({ eventDate: "20.06.2026", title: "" }, TODAY).error).toBe(
      "dateInvalid"
    );
  });

  it("rejects a calendar-impossible date", () => {
    expect(validateGameDate({ eventDate: "2026-02-30", title: "" }, TODAY).error).toBe(
      "dateInvalid"
    );
  });

  it("rejects a title above the length limit", () => {
    const title = "x".repeat(MAX_GAME_DATE_TITLE_LENGTH + 1);
    expect(validateGameDate({ eventDate: "2026-06-20", title }, TODAY).error).toBe("titleTooLong");
  });

  it("accepts a title exactly at the length limit", () => {
    const title = "x".repeat(MAX_GAME_DATE_TITLE_LENGTH);
    expect(validateGameDate({ eventDate: "2026-06-20", title }, TODAY).error).toBeNull();
  });

  it("warns but does not block for a past date — house rule: never block", () => {
    const result = validateGameDate({ eventDate: "2026-06-17", title: "" }, TODAY);
    expect(result.error).toBeNull();
    expect(result.warning).toBe("datePast");
  });

  it("does not warn for today", () => {
    expect(validateGameDate({ eventDate: "2026-06-18", title: "" }, TODAY).warning).toBeNull();
  });
});

describe("todayInGroupTimezone", () => {
  // Der Dashboard-Banner rendert serverseitig; Vercel läuft standardmäßig in UTC.
  // Ohne Zeitzonen-Pinning wäre "heute" dort zwischen Mitternacht und 02:00
  // deutscher Zeit noch der Vortag.
  it("returns the group's calendar day, not the server's", () => {
    // 23:30 UTC = 01:30 Uhr am Folgetag in Berlin (Sommerzeit)
    const afterBerlinMidnight = new Date("2026-06-18T23:30:00Z");
    expect(toDateInputValue(todayInGroupTimezone(afterBerlinMidnight))).toBe("2026-06-19");
  });

  it("also shifts the day during winter time (UTC+1)", () => {
    // 23:30 UTC = 00:30 Uhr am Folgetag in Berlin (Winterzeit)
    const afterBerlinMidnight = new Date("2026-01-05T23:30:00Z");
    expect(toDateInputValue(todayInGroupTimezone(afterBerlinMidnight))).toBe("2026-01-06");
  });

  it("keeps the same day when both zones agree", () => {
    const middayUtc = new Date("2026-06-18T10:00:00Z");
    expect(toDateInputValue(todayInGroupTimezone(middayUtc))).toBe("2026-06-18");
  });

  it("returns local midnight so it can be fed into daysUntil", () => {
    const today = todayInGroupTimezone(new Date("2026-06-18T10:00:00Z"));
    expect(today.getHours()).toBe(0);
    expect(daysUntil("2026-06-20", today)).toBe(2);
  });

  it("honours an explicit timezone override", () => {
    // 23:30 UTC ist in Tokio (UTC+9) bereits der übernächste Vormittag
    const value = todayInGroupTimezone(new Date("2026-06-18T23:30:00Z"), "Asia/Tokyo");
    expect(toDateInputValue(value)).toBe("2026-06-19");
  });

  it("pins the group timezone to Europe/Berlin", () => {
    expect(GROUP_TIME_ZONE).toBe("Europe/Berlin");
  });
});
