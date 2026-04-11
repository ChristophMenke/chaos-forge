import { describe, it, expect } from "vitest";
import { convertImperialText, lbsToKg, feetToMeters } from "./units";

describe("existing utils", () => {
  it("lbsToKg converts correctly", () => {
    expect(lbsToKg(10)).toBe("4.5");
  });
  it("feetToMeters converts correctly", () => {
    expect(feetToMeters(60)).toBe("18.3");
  });
});

describe("convertImperialText", () => {
  // --- Yards ---
  it("converts '60 yards' to metric", () => {
    expect(convertImperialText("60 yards")).toBe("54.9 m");
  });

  it("converts '30 yds.' to metric", () => {
    expect(convertImperialText("30 yds.")).toBe("27.4 m");
  });

  it("converts '5 yds' to metric", () => {
    expect(convertImperialText("5 yds")).toBe("4.6 m");
  });

  it("converts singular 'yard'", () => {
    expect(convertImperialText("1 yard")).toBe("0.9 m");
  });

  it("converts hyphenated yard form", () => {
    expect(convertImperialText("10-yard radius")).toBe("9.1-Meter radius");
  });

  // --- Feet ---
  it("converts '60 feet' to metric", () => {
    expect(convertImperialText("60 feet")).toBe("18.3 m");
  });

  it("converts '120 Fuß' to metric", () => {
    expect(convertImperialText("120 Fuß")).toBe("36.6 m");
  });

  it("converts '10 ft.' to metric", () => {
    expect(convertImperialText("10 ft.")).toBe("3 m");
  });

  it("converts '1 foot' to metric", () => {
    expect(convertImperialText("1 foot")).toBe("0.3 m");
  });

  it("converts hyphenated foot form '10-foot radius'", () => {
    expect(convertImperialText("10-foot radius")).toBe("3-Meter radius");
  });

  it("converts '10-ft. radius'", () => {
    expect(convertImperialText("10-ft. radius")).toBe("3-Meter radius");
  });

  it("converts '20-Fuß Radius'", () => {
    expect(convertImperialText("20-Fuß Radius")).toBe("6.1-Meter Radius");
  });

  // --- Miles ---
  it("converts '1 mile' to metric", () => {
    expect(convertImperialText("1 mile")).toBe("1.6 km");
  });

  it("converts '10 miles' to metric", () => {
    expect(convertImperialText("10 miles")).toBe("16.1 km");
  });

  // --- Pounds ---
  it("converts '10 lbs.' to metric", () => {
    expect(convertImperialText("10 lbs.")).toBe("4.5 kg");
  });

  it("converts '5 pounds' to metric", () => {
    expect(convertImperialText("5 pounds")).toBe("2.3 kg");
  });

  // --- Inches ---
  it("converts '6 inches' to metric", () => {
    expect(convertImperialText("6 inches")).toBe("15.2 cm");
  });

  // --- Compound expressions ---
  it("converts compound range '60 yards + 10 yards/level'", () => {
    expect(convertImperialText("60 yards + 10 yards/level")).toBe("54.9 m + 9.1 m/level");
  });

  it("converts German compound '60 Fuß + 10 Fuß/Stufe'", () => {
    expect(convertImperialText("60 Fuß + 10 Fuß/Stufe")).toBe("18.3 m + 3 m/Stufe");
  });

  it("converts embedded in sentence 'a 15-foot radius sphere'", () => {
    expect(convertImperialText("a 15-foot radius sphere")).toBe("a 4.6-Meter radius sphere");
  });

  // --- Pass-through cases ---
  it("leaves '0' unchanged", () => {
    expect(convertImperialText("0")).toBe("0");
  });

  it("leaves 'Touch' unchanged", () => {
    expect(convertImperialText("Touch")).toBe("Touch");
  });

  it("leaves 'Berührung' unchanged", () => {
    expect(convertImperialText("Berührung")).toBe("Berührung");
  });

  it("leaves 'Special' unchanged", () => {
    expect(convertImperialText("Special")).toBe("Special");
  });

  it("leaves empty string unchanged", () => {
    expect(convertImperialText("")).toBe("");
  });

  it("does not double-convert already-metric values '4.5 m'", () => {
    expect(convertImperialText("4.5 m")).toBe("4.5 m");
  });

  // --- Decimal values ---
  it("converts decimal feet '2.5 feet'", () => {
    expect(convertImperialText("2.5 feet")).toBe("0.8 m");
  });

  // --- Trailing .0 removal ---
  it("strips trailing .0 from round numbers", () => {
    // 10 ft = 3.048 → rounded to 3 (not 3.0)
    expect(convertImperialText("10 feet")).toBe("3 m");
  });

  // --- Edge cases from real spell data ---
  it("does not match 'lb' inside words like 'club'", () => {
    expect(convertImperialText("a club")).toBe("a club");
  });

  it("does not match 'ft' inside words like 'left'", () => {
    expect(convertImperialText("left behind")).toBe("left behind");
  });

  it("handles multiple conversions in one string", () => {
    expect(convertImperialText("30 feet long and 10 feet wide")).toBe("9.1 m long and 3 m wide");
  });

  it("handles '10 ft x 10 ft' area format", () => {
    expect(convertImperialText("10 ft. x 10 ft.")).toBe("3 m x 3 m");
  });

  // --- Range handling (e.g. from monster narrative texts) ---
  it("converts pound ranges '150-200 pounds' to a proper kg range", () => {
    // 150 lbs ≈ 68 kg, 200 lbs ≈ 90.7 kg
    expect(convertImperialText("150-200 pounds")).toBe("68-90.7 kg");
  });

  it("converts pound ranges with lbs shorthand '10-20 lbs'", () => {
    expect(convertImperialText("10-20 lbs")).toBe("4.5-9.1 kg");
  });

  it("converts feet ranges '5-10 feet'", () => {
    expect(convertImperialText("5-10 feet")).toBe("1.5-3 m");
  });

  it("converts yard ranges '2-3 yards'", () => {
    expect(convertImperialText("2-3 yards")).toBe("1.8-2.7 m");
  });

  it("converts mile ranges '1-2 miles'", () => {
    expect(convertImperialText("1-2 miles")).toBe("1.6-3.2 km");
  });

  it("range handling does not break existing hyphenated adjective form", () => {
    // '15-foot radius' has a word after the dash, not a number, so it stays
    // in the existing hyphenated-adjective branch.
    expect(convertImperialText("a 15-foot radius")).toBe("a 4.6-Meter radius");
  });

  it("range handling coexists with trailing single values", () => {
    expect(convertImperialText("between 5-10 feet and up to 20 feet")).toBe(
      "between 1.5-3 m and up to 6.1 m"
    );
  });
});
