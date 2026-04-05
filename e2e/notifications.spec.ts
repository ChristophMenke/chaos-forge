import { test, expect } from "@playwright/test";

test.describe("Notifications", () => {
  test("bell icon is visible in desktop sidebar", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    const bell = page.getByTestId("notification-bell");
    await expect(bell).toBeVisible();
  });

  test("clicking bell opens notification dropdown", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    await page.getByTestId("notification-bell").click();
    const dropdown = page.getByTestId("notification-dropdown");
    await expect(dropdown).toBeVisible();
  });

  test("clicking outside closes notification dropdown", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    await page.getByTestId("notification-bell").click();
    await expect(page.getByTestId("notification-dropdown")).toBeVisible();

    // Click on the main content area to close
    await page.getByTestId("dashboard-page").click({ position: { x: 500, y: 300 } });
    await expect(page.getByTestId("notification-dropdown")).not.toBeVisible();
  });

  test("empty state shows content in dropdown", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    await page.getByTestId("notification-bell").click();
    const dropdown = page.getByTestId("notification-dropdown");
    await expect(dropdown).toBeVisible();

    // Should show either empty message or notifications
    const content = await dropdown.textContent();
    expect(content!.length).toBeGreaterThan(0);
  });
});

test.describe("Dashboard Improvements", () => {
  test("stats cards are visible", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    await expect(page.getByTestId("stat-card-adventurers")).toBeVisible();
    await expect(page.getByTestId("stat-card-avg-level")).toBeVisible();
    await expect(page.getByTestId("stat-card-sessions")).toBeVisible();
    await expect(page.getByTestId("stat-card-days-since")).toBeVisible();
  });

  test("class and race distribution cards are visible when characters exist", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    // These are conditional — only shown if user has characters with classes
    const classCard = page.getByTestId("stat-card-classes");
    const raceCard = page.getByTestId("stat-card-races");

    if (await classCard.isVisible()) {
      await expect(classCard).toContainText(/\w+ \d+/);
    }
    if (await raceCard.isVisible()) {
      await expect(raceCard).toContainText(/\w+ \d+/);
    }
  });
});
