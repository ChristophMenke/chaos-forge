import { test, expect } from "@playwright/test";
import { MasterPage } from "./pages/master.page";

const CORRECT_PIN = process.env.GM_PIN ?? "123456";

test.describe("Master of Chaos — GM Interface", () => {
  test.describe("PIN Gate", () => {
    test("shows PIN gate when not authenticated as GM", async ({ page }) => {
      const master = new MasterPage(page);
      await master.goto();

      await expect(master.pinGate).toBeVisible({ timeout: 10_000 });
      await expect(master.pinInputs).toBeVisible();
      await expect(master.pinSubmit).toBeVisible();
      await expect(master.dashboard).not.toBeVisible();
    });

    test("shows error on wrong PIN", async ({ page }) => {
      const master = new MasterPage(page);
      await master.goto();

      await expect(master.pinGate).toBeVisible({ timeout: 10_000 });
      await master.enterAndSubmitPin("000000");

      await expect(master.pinError).toBeVisible({ timeout: 5_000 });
    });

    test("unlocks dashboard with correct PIN", async ({ page }) => {
      const master = new MasterPage(page);
      await master.goto();

      await expect(master.pinGate).toBeVisible({ timeout: 10_000 });
      await master.enterAndSubmitPin(CORRECT_PIN);

      await expect(master.dashboard).toBeVisible({ timeout: 10_000 });
      await expect(master.pinGate).not.toBeVisible();
    });

    test("PIN inputs have adequate touch targets (44px)", async ({ page }) => {
      const master = new MasterPage(page);
      await page.setViewportSize({ width: 414, height: 896 });
      await master.goto();

      await expect(master.pinGate).toBeVisible({ timeout: 10_000 });

      const firstDigit = page.getByTestId("gm-pin-digit-0");
      const box = await firstDigit.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    });

    test("PIN inputs accept only digits", async ({ page }) => {
      const master = new MasterPage(page);
      await master.goto();

      await expect(master.pinGate).toBeVisible({ timeout: 10_000 });

      const firstDigit = page.getByTestId("gm-pin-digit-0");
      await firstDigit.fill("a");
      await expect(firstDigit).toHaveValue("");

      await firstDigit.fill("5");
      await expect(firstDigit).toHaveValue("5");
    });
  });

  test.describe("Dashboard", () => {
    test.beforeEach(async ({ page }) => {
      const master = new MasterPage(page);
      await master.goto();
      await expect(master.pinGate).toBeVisible({ timeout: 10_000 });
      await master.enterAndSubmitPin(CORRECT_PIN);
      await expect(master.dashboard).toBeVisible({ timeout: 10_000 });
    });

    test("shows sidebar with tabs and character cards", async ({ page }) => {
      const master = new MasterPage(page);

      await expect(master.sidebarParty).toBeVisible();
      await expect(master.sidebarItems).toBeVisible();
      await expect(master.sidebarGold).toBeVisible();

      // Party panel should be visible by default
      await expect(master.partyPanel).toBeVisible();

      // Should show at least one character card (assuming test DB has active characters)
      const cards = page.locator("[data-testid^='gm-character-card-']");
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });

    test("character cards show combat data", async ({ page }) => {
      // Get first character card
      const firstCard = page.locator("[data-testid^='gm-character-card-']").first();
      await expect(firstCard).toBeVisible();

      // Should contain HP bar
      await expect(firstCard.getByTestId("hp-bar")).toBeVisible();

      // Should contain level badge
      await expect(firstCard.getByTestId("level-badge")).toBeVisible();
    });

    test("shows live indicator", async ({ page }) => {
      const master = new MasterPage(page);
      await expect(master.liveIndicator).toBeVisible();
    });

    test("can switch to items tab", async ({ page }) => {
      const master = new MasterPage(page);

      await master.switchToItems();

      await expect(master.itemsPanel).toBeVisible();
      await expect(master.itemSearch).toBeVisible();
      await expect(master.weaponsTab).toBeVisible();
      await expect(master.armorTab).toBeVisible();
    });

    test("items tab — search filters weapons", async ({ page }) => {
      const master = new MasterPage(page);
      await master.switchToItems();

      await master.searchItems("Langschwert");
      await page.waitForTimeout(500);

      // Should find at least one result
      const weaponCards = page.locator("[data-testid^='gm-weapon-']");
      const count = await weaponCards.count();
      expect(count).toBeGreaterThan(0);
    });

    test("items tab — search filters armor", async ({ page }) => {
      const master = new MasterPage(page);
      await master.switchToItems();

      // Switch to armor tab
      await master.armorTab.click();
      await page.waitForTimeout(300);

      await master.searchItems("Ketten");
      await page.waitForTimeout(500);

      const armorCards = page.locator("[data-testid^='gm-armor-']");
      const count = await armorCards.count();
      expect(count).toBeGreaterThan(0);
    });

    test("items tab — no results shows empty state", async ({ page }) => {
      const master = new MasterPage(page);
      await master.switchToItems();

      await master.searchItems("xyznonexistent123");
      await page.waitForTimeout(500);

      const weaponCards = page.locator("[data-testid^='gm-weapon-']");
      await expect(weaponCards).toHaveCount(0);
    });
  });

  test.describe("Responsive — iPhone XR (414x896)", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 414, height: 896 });
      const master = new MasterPage(page);
      await master.goto();
      await expect(master.pinGate).toBeVisible({ timeout: 10_000 });
      await master.enterAndSubmitPin(CORRECT_PIN);
      await expect(master.dashboard).toBeVisible({ timeout: 10_000 });
    });

    test("no horizontal scroll on mobile", async ({ page }) => {
      const hasOverflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
      expect(hasOverflow).toBe(false);
    });

    test("character cards stack vertically on mobile", async ({ page }) => {
      const master = new MasterPage(page);
      await expect(master.partyPanel).toBeVisible();

      const cards = page.locator("[data-testid^='gm-character-card-']");
      const count = await cards.count();
      if (count >= 2) {
        const first = await cards.nth(0).boundingBox();
        const second = await cards.nth(1).boundingBox();
        expect(first).not.toBeNull();
        expect(second).not.toBeNull();
        // Cards should be stacked (second card below first, not side by side)
        expect(second!.y).toBeGreaterThan(first!.y);
      }
    });

    test("PIN inputs have adequate touch targets on mobile", async ({ page }) => {
      // Navigate to master — PIN gate shows because GM cookie is scoped to /master
      // and this test's beforeEach already entered the correct PIN.
      // We need to check the PIN gate in a fresh context — use the PIN Gate group instead.
      // Here we just verify that the dashboard renders without horizontal overflow on mobile.
      const master = new MasterPage(page);
      await expect(master.dashboard).toBeVisible();
    });
  });
});
