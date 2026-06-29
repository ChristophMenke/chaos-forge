import { test, expect } from "@playwright/test";

const RANDOM_UUID = "00000000-0000-0000-0000-000000000000";

test.describe("Public session share route", () => {
  test("is reachable without login (no redirect to /login)", async ({ page }) => {
    await page.goto(`/share/sessions/${RANDOM_UUID}`);
    // Unlike protected routes, the public share route must NOT bounce to login.
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("returns 404 for a non-public / unknown session", async ({ page }) => {
    const res = await page.goto(`/share/sessions/${RANDOM_UUID}`);
    expect(res?.status()).toBe(404);
  });

  test("protected session detail still redirects to login", async ({ page }) => {
    await page.goto(`/sessions/${RANDOM_UUID}`);
    await expect(page).toHaveURL(/\/login/);
  });
});
