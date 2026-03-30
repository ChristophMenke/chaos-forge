import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// ─── Mobile Responsive Tests (iPhone 13 viewport) ──────────────────────────

const MOBILE_VIEWPORT = { width: 390, height: 844 };

test.describe("Mobile Responsive (iPhone 13)", () => {
  test("characters page — mobile nav has more menu", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/characters");
    await page.waitForTimeout(2000);
    // Mobile bottom nav should be visible
    await expect(page.getByTestId("app-nav-mobile")).toBeVisible();
    // More button should exist
    const moreTrigger = page.getByTestId("mobile-more-trigger");
    await expect(moreTrigger).toBeVisible();
    // Click more to open panel
    await moreTrigger.click();
    await expect(page.getByTestId("mobile-more-panel")).toBeVisible();
  });

  test("character cards render without overflow on mobile", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/characters");
    const grid = page.getByTestId("active-characters-grid");
    await expect(grid).toBeVisible({ timeout: 10000 });
    // Cards should not cause horizontal scroll
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 1);
  });

  test("character sheet tabs visible on mobile", async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/characters");
    // Navigate to first character → choice page → manage
    const firstCard = page.locator("[data-testid^='character-card-']").first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();
    await expect(page.getByTestId("character-choice-page")).toBeVisible({ timeout: 15000 });
    await page.getByTestId("character-manage-link").click();
    // Tabs should be visible
    const tabs = page.getByTestId("sheet-tabs");
    await expect(tabs).toBeVisible({ timeout: 15000 });
    // All tab triggers should exist in the DOM
    await expect(page.getByTestId("tab-trigger-stats")).toBeAttached();
    await expect(page.getByTestId("tab-trigger-proficiencies")).toBeAttached();
    // Container should not cause body-level horizontal scroll
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 1);
  });
});

// ─── Desktop Sidebar & Navigation Tests ─────────────────────────────────────

const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

test.describe("Desktop Sidebar Navigation", () => {
  test("sidebar visible on desktop, hidden on mobile", async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 10000 });
    // Sidebar should be visible on desktop
    await expect(page.getByTestId("app-sidebar")).toBeVisible();
    // Mobile nav should be hidden on desktop
    await expect(page.getByTestId("app-nav-mobile")).not.toBeVisible();

    // Switch to mobile viewport
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.waitForTimeout(300);
    // Sidebar should be hidden on mobile
    await expect(page.getByTestId("app-sidebar")).not.toBeVisible();
    // Mobile nav should be visible
    await expect(page.getByTestId("app-nav-mobile")).toBeVisible();
  });

  test("FAB visible on mobile, hidden on desktop", async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/characters");
    await page.waitForTimeout(500);
    await expect(page.getByTestId("fab-new-character")).toBeVisible();

    // Switch to desktop
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.waitForTimeout(300);
    await expect(page.getByTestId("fab-new-character")).not.toBeVisible();
  });

  test("sidebar navigation links work", async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 10000 });

    // Click characters nav item in sidebar
    await page.getByTestId("nav-characters").click();
    await expect(page).toHaveURL(/\/characters/);
  });
});

// ─── Accessibility Tests (Authenticated Pages) ─────────────────────────────

test.describe("Accessibility — Authenticated Pages (WCAG 2 AA)", () => {
  test("characters page should have no critical a11y violations", async ({ page }) => {
    await page.goto("/characters");
    await page.getByTestId("active-characters-grid").waitFor({ timeout: 10000 });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .exclude(".no-scrollbar") // exclude known utility class
      .analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    if (critical.length > 0) {
      console.log("A11y violations:", JSON.stringify(critical, null, 2));
    }
    expect(critical).toEqual([]);
  });

  test("character sheet should have no critical a11y violations", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/characters");
    const firstCard = page.locator("[data-testid^='character-card-']").first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();
    await expect(page.getByTestId("character-choice-page")).toBeVisible({ timeout: 15000 });
    await page.getByTestId("character-manage-link").click();
    await page.getByTestId("sheet-tabs").waitFor({ timeout: 30000 });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    if (critical.length > 0) {
      console.log("A11y violations:", JSON.stringify(critical, null, 2));
    }
    expect(critical).toEqual([]);
  });

  test("new character choice page should have no critical a11y violations", async ({ page }) => {
    await page.goto("/characters/new");
    await page.getByTestId("new-character-page").waitFor({ timeout: 10000 });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });

  test("dashboard should have no critical a11y violations", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 10000 });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });
});
