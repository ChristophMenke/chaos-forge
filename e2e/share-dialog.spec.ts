import { test, expect } from "@playwright/test";
import { createTestUser, deleteTestUser } from "./helpers/auth";
import { CharacterSheetPage } from "./pages/character-sheet.page";

const TEST_EMAIL = "christoph@chaos-forge.de";

test.describe("Share Dialog", () => {
  let characterId: string;
  let shareUserEmail: string;

  // Create unique secondary test user + test character before each test
  test.beforeEach(async ({ request }, testInfo) => {
    const uniqueId = `${Date.now()}-${testInfo.workerIndex}`;
    shareUserEmail = `share-e2e-${uniqueId}@chaos-forge.de`;
    await createTestUser(request, shareUserEmail);

    const resp = await request.put("/api/test-seed", {
      data: {
        email: TEST_EMAIL,
        character: {
          name: `QA-Share-${uniqueId}`,
          level: 3,
          race_id: "human",
          class_id: "fighter",
          str: 14,
          dex: 12,
          con: 13,
          int: 10,
          wis: 10,
          cha: 10,
          hp_current: 25,
          hp_max: 25,
          alignment: "chaotic-good",
        },
      },
    });

    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    characterId = data.character_id;
  });

  // Clean up test character + secondary user after each test
  test.afterEach(async ({ request }) => {
    if (characterId) {
      await request.delete("/api/test-seed", {
        data: { character_id: characterId },
      });
    }
    if (shareUserEmail) {
      await deleteTestUser(request, shareUserEmail);
    }
  });

  test("opens share dialog and shows user list without @chaos-forge.de addresses", async ({
    page,
  }) => {
    test.setTimeout(60000);
    const sheet = new CharacterSheetPage(page);

    await page.goto(`/characters/${characterId}/manage`);
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
      const text = await options.nth(i).textContent();
      expect(text).not.toContain("@chaos-forge.de");
    }

    // Close dialog
    await page.getByTestId("share-close-button").click();
    await expect(dialog).not.toBeVisible();
  });

  test("public toggle switches between yes and no", async ({ page }) => {
    test.setTimeout(60000);
    const sheet = new CharacterSheetPage(page);

    await page.goto(`/characters/${characterId}/manage`);
    await sheet.container.waitFor({ timeout: 30000 });

    await sheet.shareButton.click();
    const dialog = page.getByTestId("share-dialog");
    await expect(dialog).toBeVisible();

    const toggle = page.getByTestId("share-toggle-public");
    const initialText = await toggle.textContent();

    // Toggle public visibility
    await toggle.click();
    await expect(async () => {
      const newText = await toggle.textContent();
      expect(newText).not.toBe(initialText);
    }).toPass({ timeout: 5000 });

    // Restore original state
    await toggle.click();
    await expect(async () => {
      const restoredText = await toggle.textContent();
      expect(restoredText).toBe(initialText);
    }).toPass({ timeout: 5000 });
    const restoredText = await toggle.textContent();
    expect(restoredText).toBe(initialText);

    await page.getByTestId("share-close-button").click();
  });
});
