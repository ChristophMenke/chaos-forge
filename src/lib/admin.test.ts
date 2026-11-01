import { describe, it, expect } from "vitest";
import { ADMIN_EMAIL, isAdminEmail } from "./admin";

describe("isAdminEmail", () => {
  it("recognises the admin address, ignoring case and surrounding spaces", () => {
    expect(isAdminEmail(ADMIN_EMAIL)).toBe(true);
    expect(isAdminEmail(" Christoph.Menke@Gmail.com ")).toBe(true);
  });

  it("rejects other or missing addresses", () => {
    expect(isAdminEmail("player@example.com")).toBe(false);
    expect(isAdminEmail("")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });
});
