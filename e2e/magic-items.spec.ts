import { test, expect, type Page } from "@playwright/test";

const TEST_EMAIL = "christoph@chaos-forge.de";
const BASE_URL = "http://localhost:3000";

/** Create a test character via API */
async function createTestChar(request: Page["request"]): Promise<string> {
  const resp = await request.put(`${BASE_URL}/api/test-seed`, {
    data: {
      email: TEST_EMAIL,
      character: {
        name: "QA-MagicItems",
        race_id: "human",
        class_id: "fighter",
        level: 5,
        str: 16,
        dex: 14,
        con: 15,
        int: 10,
        wis: 12,
        cha: 10,
        hp_current: 40,
        hp_max: 40,
        alignment: "true_neutral",
        classes: [{ class_id: "fighter", level: 5, xp_current: 18000 }],
      },
    },
  });
  const data = await resp.json();
  return data.character_id;
}

/** Delete test character via API */
async function deleteTestChar(request: Page["request"], charId: string) {
  await request
    .delete(`${BASE_URL}/api/test-seed`, {
      data: { character_id: charId },
    })
    .catch(() => {});
}

test.describe("Magic Items", () => {
  let charId: string;

  test.beforeEach(async ({ page }) => {
    charId = await createTestChar(page.request);
  });

  test.afterEach(async ({ page }) => {
    if (charId) {
      await deleteTestChar(page.request, charId);
    }
  });

  test("can create a magic item with basic effects", async ({ page }) => {
    // Navigate to Equipment tab
    await page.goto(`/characters/${charId}/manage`);
    await page.getByTestId("character-sheet").waitFor({ timeout: 15000 });

    // Open Equipment tab
    await page.getByTestId("tab-trigger-equipment").click();

    // Click Add Item
    await page.getByTestId("add-item-btn").click();

    // Switch to Magic Items tab
    await page.getByTestId("add-dialog-tab-magic").click();

    // Fill in basic info
    await page.getByTestId("magic-item-name").fill("Ring of Protection +1");
    await page.getByTestId("magic-item-category").selectOption("Ring");

    // Open Combat section and set AC bonus
    await page.getByTestId("magic-section-combat").click();
    await page.getByTestId("magic-effect-ac-bonus").fill("-1");

    // Open Saves section and set save_all
    await page.getByTestId("magic-section-saves").click();
    await page.getByTestId("magic-effect-save_all").fill("1");

    // Submit
    await page.getByTestId("magic-item-submit").click();

    // Verify item appears in equipped list
    await expect(page.getByText("Ring of Protection +1 (Ring)").first()).toBeVisible({
      timeout: 5000,
    });

    // Verify effect badges are shown
    await expect(page.getByText("AC -1").first()).toBeVisible();
    await expect(page.getByText("Saves +1").first()).toBeVisible();
  });

  test("can create a magic item with spell abilities and resistances", async ({ page }) => {
    await page.goto(`/characters/${charId}/manage`);
    await page.getByTestId("character-sheet").waitFor({ timeout: 15000 });

    await page.getByTestId("tab-trigger-equipment").click();
    await page.getByTestId("add-item-btn").click();
    await page.getByTestId("add-dialog-tab-magic").click();

    // Basic info
    await page.getByTestId("magic-item-name").fill("Robe of the Archmagi");
    await page.getByTestId("magic-item-category").selectOption("Robe");

    // Open Resistances section and add a resistance
    await page.getByTestId("magic-section-resistances").click();
    await page.getByTestId("magic-resistance-input").fill("Fire Resistance");
    await page.getByTestId("magic-resistance-input").press("Enter");

    // Verify tag appears
    await expect(page.getByText("Fire Resistance")).toBeVisible();

    // Open Spell Abilities section and add one
    await page.getByTestId("magic-section-spell-abilities").click();
    await page.getByTestId("magic-add-spell-ability").click();
    await page.getByTestId("magic-spell-ability-name-0").fill("Detect Magic");
    await page.getByTestId("magic-spell-ability-uses-0").fill("3");
    await page.getByTestId("magic-spell-ability-desc-0").fill("Wie der Zauber");

    // Submit
    await page.getByTestId("magic-item-submit").click();

    // Verify item appears with badges
    await expect(page.getByText("Robe of the Archmagi (Robe)").first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText("Fire Resistance").first()).toBeVisible();
    await expect(page.getByText("Detect Magic (3/day)").first()).toBeVisible();
  });

  test("can create a magic item with description and cursed flag", async ({ page }) => {
    await page.goto(`/characters/${charId}/manage`);
    await page.getByTestId("character-sheet").waitFor({ timeout: 15000 });

    await page.getByTestId("tab-trigger-equipment").click();
    await page.getByTestId("add-item-btn").click();
    await page.getByTestId("add-dialog-tab-magic").click();

    // Basic info with cursed flag
    await page.getByTestId("magic-item-name").fill("Cursed Ring of Weakness");
    await page.getByTestId("magic-item-description").fill("Schwächt den Träger");
    await page.getByTestId("magic-item-cursed").check();

    // Open Attributes section and set negative STR
    await page.getByTestId("magic-section-attributes").click();
    await page.getByTestId("magic-effect-str").fill("-3");

    // Submit
    await page.getByTestId("magic-item-submit").click();

    // Verify item appears with cursed badge
    await expect(page.getByText("Cursed Ring of Weakness").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Cursed").first()).toBeVisible();
    await expect(page.getByText("STR -3").first()).toBeVisible();
  });

  test("magic item effects are visible after page reload", async ({ page }) => {
    await page.goto(`/characters/${charId}/manage`);
    await page.getByTestId("character-sheet").waitFor({ timeout: 15000 });

    await page.getByTestId("tab-trigger-equipment").click();
    await page.getByTestId("add-item-btn").click();
    await page.getByTestId("add-dialog-tab-magic").click();

    // Create item
    await page.getByTestId("magic-item-name").fill("Gauntlets of STR");
    await page.getByTestId("magic-section-attributes").click();
    await page.getByTestId("magic-effect-str").fill("3");
    await page.getByTestId("magic-item-submit").click();
    await expect(page.getByText("Gauntlets of STR").first()).toBeVisible({ timeout: 5000 });

    // Reload page
    await page.reload();
    await page.getByTestId("character-sheet").waitFor({ timeout: 15000 });
    await page.getByTestId("tab-trigger-equipment").click();

    // Verify item and effects still visible
    await expect(page.getByText("Gauntlets of STR").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("STR +3").first()).toBeVisible();
  });
});
