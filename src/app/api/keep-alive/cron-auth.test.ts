import { describe, it, expect } from "vitest";
import { isAuthorizedCronRequest } from "./cron-auth";

describe("isAuthorizedCronRequest", () => {
  describe("without a configured secret", () => {
    it("allows a request without an Authorization header", () => {
      expect(isAuthorizedCronRequest(null, undefined)).toBe(true);
    });

    it("treats an empty or whitespace-only secret as unconfigured", () => {
      expect(isAuthorizedCronRequest(null, "")).toBe(true);
      expect(isAuthorizedCronRequest(null, "   ")).toBe(true);
    });
  });

  describe("with a configured secret", () => {
    it("allows a matching Bearer token", () => {
      expect(isAuthorizedCronRequest("Bearer s3cret", "s3cret")).toBe(true);
    });

    it("tolerates surrounding whitespace in the env value", () => {
      expect(isAuthorizedCronRequest("Bearer s3cret", "  s3cret\n")).toBe(true);
    });

    it("rejects a wrong token", () => {
      expect(isAuthorizedCronRequest("Bearer wrong", "s3cret")).toBe(false);
    });

    it("rejects a missing Authorization header", () => {
      expect(isAuthorizedCronRequest(null, "s3cret")).toBe(false);
    });

    it("rejects a token without the Bearer scheme", () => {
      expect(isAuthorizedCronRequest("s3cret", "s3cret")).toBe(false);
    });

    it("rejects a token that only shares a prefix", () => {
      expect(isAuthorizedCronRequest("Bearer s3cretXL", "s3cret")).toBe(false);
    });
  });
});
