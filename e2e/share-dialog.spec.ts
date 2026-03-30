import { test, expect } from "@playwright/test";
import { createTestUser, deleteTestUser } from "./helpers/auth";
import { CharacterSheetPage } from "./pages/character-sheet.page";

const SHARE_TEST_EMAIL = "share-e2e-test@chaos-forge.de";

test.describe("Share Dialog", () => {
  // Create a secondary test user before all tests
  test.beforeAll(async ({ request }) => {
    await createTestUser(request, SHARE_TEST_EMAIL);
  });

  // Clean up the secondary test user after all tests
  test.afterAll(async ({ request }) => {
    await deleteTestUser(request, SHARE_TEST_EMAIL);
  });

  test("opens share dialog and shows user list without @chaos-forge.de addresses", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/characters");
    const sheet = new CharacterSheetPage(page);

    // Navigate to Gor (owned by test user) → choice page → manage
    const gorCard = page.locator("a", { hasText: "Gor" });
    await expect(gorCard).toBeVisible({ timeout: 10000 });
    await gorCard.click();
    await expect(page.getByTestId("character-choice-page")).toBeVisible({ timeout: 15000 });
    await page.getByTestId("character-manage-link").click();
    await sheet.container.waitFor({ timeout: 30000 });

    // Open share dialog
    await sheet.shareButton.click();
    const dialog = page.getByTestId("share-dialog");
    await expect(dialog).toBeVisible();

    // Should NOT show "no users" message (real users exist)
    await expect(page.getByTestId("share-no-users")).not.toBeVisible();

    // Should show the user select dropdown
    const select = page.getByTestId("share-user-select");
    await expect(select).toBeVisible();

    // Verify no @chaos-forge.de addresses in the dropdown
    const options = select.locator("option");
    const count = await options.count();
    for (let i = 1; i < count; i++) {
      // skip placeholder option
      const text = await options.nth(i).textContent();
      expect(text).not.toContain("@chaos-forge.de");
    }

    // Close dialog
    await page.getByTestId("share-close-button").click();
    await expect(dialog).not.toBeVisible();
  });

  test("public toggle switches between yes and no", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/characters");
    const sheet = new CharacterSheetPage(page);

    const gorCard = page.locator("a", { hasText: "Gor" });
    await expect(gorCard).toBeVisible({ timeout: 10000 });
    await gorCard.click();
    await expect(page.getByTestId("character-choice-page")).toBeVisible({ timeout: 15000 });
    await page.getByTestId("character-manage-link").click();
    await sheet.container.waitFor({ timeout: 30000 });

    await sheet.shareButton.click();
    const dialog = page.getByTestId("share-dialog");
    await expect(dialog).toBeVisible();

    const toggle = page.getByTestId("share-toggle-public");
    const initialText = await toggle.textContent();

    // Toggle public visibility
    await toggle.click();
    await page.waitForTimeout(1000);
    const newText = await toggle.textContent();
    expect(newText).not.toBe(initialText);

    // Restore original state
    await toggle.click();
    await page.waitForTimeout(1000);
    const restoredText = await toggle.textContent();
    expect(restoredText).toBe(initialText);

    await page.getByTestId("share-close-button").click();
  });
});
