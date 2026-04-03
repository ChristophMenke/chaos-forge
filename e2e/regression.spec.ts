import { test, expect } from "@playwright/test";
import { CharacterSheetPage } from "./pages/character-sheet.page";
import { LoginPage } from "./pages/login.page";

test.describe("Login Page", () => {
  test("shows email input and code send button", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(login.emailInput).toBeVisible();
    await expect(login.submitButton).toBeVisible();
    await expect(login.codeInput).not.toBeVisible();
  });

  test("authenticated user is redirected to characters", async ({ page }) => {
    await page.goto("/characters");
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("/characters");
    expect(page.url()).not.toContain("/login");
  });
});

test.describe("Character Sheet — Owner", () => {
  test("shows character name and all tabs (read-only smoke)", async ({ page }) => {
    test.setTimeout(90000);
    await page.goto("/characters");
    const sheet = new CharacterSheetPage(page);

    // Navigate to first own character → choice page → manage
    const activeGrid = page.getByTestId("active-characters-grid");
    await expect(activeGrid).toBeVisible({ timeout: 10000 });
    const firstCard = activeGrid.locator("a").first();
    await firstCard.click();
    await expect(page.getByTestId("character-choice-page")).toBeVisible({ timeout: 15000 });
    await page.getByTestId("character-manage-link").click();
    await sheet.container.waitFor({ timeout: 30000 });

    // Character name and class visible
    await expect(sheet.name).toBeVisible();
    await expect(sheet.classBadge).toBeVisible();

    // Equipment tab
    await sheet.switchTab("equipment");
    await expect(page.getByTestId("equipment-ac")).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("equipment-movement")).toBeVisible({ timeout: 5000 });

    // Armor items in inventory show AC value
    const armorAcBadges = page.locator("[data-testid^='armor-ac-']");
    const armorCount = await armorAcBadges.count();
    if (armorCount > 0) {
      const firstBadge = armorAcBadges.first();
      await expect(firstBadge).toBeVisible();
      await expect(firstBadge).toHaveText(/\(AC \d+\)/);
    }

    // Spells tab (if visible)
    const spellsTrigger = page.getByTestId("tab-trigger-spells");
    if (await spellsTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
      await spellsTrigger.click();
      await page.waitForTimeout(1000);
      await expect(page.getByTestId("tab-spells")).toBeVisible({ timeout: 5000 });
    }

    // Thief skills tab (if visible)
    const thiefTrigger = page.getByTestId("tab-trigger-thief-skills");
    if (await thiefTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
      await thiefTrigger.click();
      await page.waitForTimeout(1000);
      await expect(sheet.thiefPickLocks).toBeVisible({ timeout: 5000 });
    }

    // Proficiencies tab
    await sheet.switchTab("proficiencies");
    await expect(page.getByTestId("weapon-proficiencies-section")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Character Sheet — Read-Only", () => {
  test("non-owner cannot see save or delete buttons", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/characters");
    const sheet = new CharacterSheetPage(page);

    // Other characters (shared, not owned by test user)
    const otherSection = page.getByTestId("other-characters-section");
    if (!(await otherSection.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, "No shared characters available");
    }
    await otherSection.locator("summary").click();

    // Click first shared character
    const sharedCard = otherSection.locator("a").first();
    await expect(sharedCard).toBeVisible({ timeout: 5000 });
    await sharedCard.click();
    // Non-owner is redirected directly to manage (no choice page)
    await sheet.container.waitFor({ timeout: 30000 });

    // Delete button should NOT be visible for non-owner
    await expect(sheet.deleteButton).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe("Loading & Navigation", () => {
  test("characters page loads without error", async ({ page }) => {
    await page.goto("/characters");
    const cards = page.locator('[data-testid^="character-card-"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Character Choice Page", () => {
  test("shows manage and play options, both navigate correctly", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/characters");

    // Navigate to first own character
    const activeGrid = page.getByTestId("active-characters-grid");
    await expect(activeGrid).toBeVisible({ timeout: 10000 });
    await activeGrid.locator("a").first().click();

    // Choice page loads with both options
    await expect(page.getByTestId("character-choice-page")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("character-manage-link")).toBeVisible();
    await expect(page.getByTestId("character-play-link")).toBeVisible();

    // Click play → play mode loads
    await page.getByTestId("character-play-link").click();
    await expect(page.getByTestId("play-mode")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("play-hp-bar")).toBeVisible();

    // Go back and click manage → character sheet loads
    await page.goBack();
    await expect(page.getByTestId("character-choice-page")).toBeVisible({ timeout: 10000 });
    await page.getByTestId("character-manage-link").click();
    const sheet = new CharacterSheetPage(page);
    await sheet.container.waitFor({ timeout: 30000 });
  });
});

test.describe("Print View", () => {
  test("print view loads with all sections", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/characters");
    const sheet = new CharacterSheetPage(page);

    const activeGrid = page.getByTestId("active-characters-grid");
    await expect(activeGrid).toBeVisible({ timeout: 10000 });
    await activeGrid.locator("a").first().click();
    await expect(page.getByTestId("character-choice-page")).toBeVisible({ timeout: 15000 });
    await page.getByTestId("character-manage-link").click();
    await sheet.container.waitFor({ timeout: 30000 });

    await sheet.printButton.click();
    await page.waitForTimeout(5000);
    await expect(page.getByTestId("print-sheet")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("print-section-personal")).toBeVisible();
    await expect(page.getByTestId("print-section-abilities")).toBeVisible();
    await expect(page.getByTestId("print-section-combat")).toBeVisible();
  });
});
