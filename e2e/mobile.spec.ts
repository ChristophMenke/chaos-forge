import { test, expect } from "@playwright/test";
import { createTestCharacter, deleteTestCharacter } from "./helpers/test-character";

/**
 * Mobile-specific tests that run in an iPhone device context.
 * These tests require a real mobile viewport (not setViewportSize on Desktop Chrome).
 */

let charId: string;

test.beforeAll(async ({ request }) => {
  charId = await createTestCharacter(request, {
    name: "QA-Mobile",
    race_id: "human",
    class_id: "fighter",
    level: 3,
    hp_current: 25,
    hp_max: 25,
  });
});

test.afterAll(async ({ request }) => {
  if (charId) await deleteTestCharacter(request, charId);
});

test.describe("Mobile Navigation", () => {
  test("characters page — mobile nav has more menu", async ({ page }) => {
    await page.goto("/characters");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("app-nav-mobile")).toBeVisible({ timeout: 10000 });
    const moreTrigger = page.getByTestId("mobile-more-trigger");
    await expect(moreTrigger).toBeVisible();
    await moreTrigger.tap();
    await expect(page.getByTestId("mobile-more-panel")).toBeVisible({ timeout: 10000 });
  });

  test("notification bell is visible in mobile more panel", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });
    await expect(page.getByTestId("app-nav-mobile")).toBeVisible({ timeout: 10000 });
    const moreTrigger = page.getByTestId("mobile-more-trigger");
    await expect(moreTrigger).toBeVisible();
    await moreTrigger.tap();
    await expect(page.getByTestId("mobile-more-panel")).toBeVisible({ timeout: 10000 });
    const panel = page.getByTestId("mobile-more-panel");
    const bell = panel.getByTestId("notification-bell");
    await expect(bell).toBeVisible({ timeout: 10000 });
  });

  test("character cards render without overflow", async ({ page }) => {
    await page.goto("/characters");
    const grid = page.getByTestId("active-characters-grid");
    await expect(grid).toBeVisible({ timeout: 10000 });
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 1);
  });
});
