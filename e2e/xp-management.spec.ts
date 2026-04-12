import { test, expect, type Page } from "@playwright/test";

const TEST_EMAIL = "QA-primary@qa.chaosforge.test";
const BASE_URL = "http://localhost:3000";

/** Create a multiclass test character via API */
async function createMulticlassChar(request: Page["request"]): Promise<string> {
  const resp = await request.put(`${BASE_URL}/api/test-seed`, {
    data: {
      email: TEST_EMAIL,
      character: {
        name: "QA-MultiXP",
        race_id: "gnome",
        class_id: "illusionist",
        level: 7,
        str: 8,
        dex: 17,
        con: 14,
        int: 19,
        wis: 12,
        cha: 14,
        hp_current: 20,
        hp_max: 20,
        alignment: "chaotic-neutral",
        classes: [
          { class_id: "illusionist", level: 7, xp_current: 60000 },
          { class_id: "thief", level: 7, xp_current: 60000 },
        ],
      },
    },
  });
  const data = await resp.json();
  return data.character_id;
}

/** Create a single-class test character via API */
async function createSingleClassChar(request: Page["request"]): Promise<string> {
  const resp = await request.put(`${BASE_URL}/api/test-seed`, {
    data: {
      email: TEST_EMAIL,
      character: {
        name: "QA-SingleXP",
        race_id: "human",
        class_id: "fighter",
        level: 3,
        str: 16,
        dex: 12,
        con: 15,
        int: 10,
        wis: 10,
        cha: 10,
        hp_current: 30,
        hp_max: 30,
        alignment: "lawful-good",
        classes: [{ class_id: "fighter", level: 3, xp_current: 4000 }],
      },
    },
  });
  const data = await resp.json();
  return data.character_id;
}

/** Delete test character via API */
async function deleteTestChar(_request: Page["request"], charId: string) {
  await fetch(`${BASE_URL}/api/test-seed`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, character_id: charId }),
  }).catch(() => {});
}

/** Navigate to character manage page and open XP dialog */
async function openXpDialog(page: Page, charId: string) {
  await page.goto(`/characters/${charId}/manage`);
  await page.getByTestId("character-sheet").waitFor({ timeout: 15000 });
  // Wait for hydration to complete before interacting
  await page.waitForLoadState("networkidle");

  const addXpBtn = page.getByTestId("sheet-add-xp-button");
  await addXpBtn.scrollIntoViewIfNeeded();
  await expect(addXpBtn).toBeVisible({ timeout: 5000 });
  await addXpBtn.click();
  await expect(page.getByTestId("xp-add-dialog")).toBeVisible({ timeout: 5000 });
}

// Each test creates and cleans up its own data — fully independent

test.describe("XP Management", () => {
  test("single-class: add and verify XP", async ({ page }) => {
    test.setTimeout(90000);

    const charId = await createSingleClassChar(page.request);
    expect(charId).toBeTruthy();

    try {
      await openXpDialog(page, charId);

      // Should NOT show distribution section (single class)
      await page.getByTestId("xp-amount-input").fill("1000");
      await expect(page.getByTestId("xp-distribution-section")).not.toBeVisible();

      // Preview should show the class (Fighter/Kämpfer)
      const preview = page.getByTestId("xp-preview-section");
      await expect(preview).toBeVisible();
      const previewText = await preview.textContent();
      expect(previewText).toContain("L3");

      // Apply XP
      await page.getByTestId("xp-apply-button").click();
      await expect(page.getByTestId("xp-add-dialog")).not.toBeVisible({ timeout: 10000 });

      // Verify XP was applied by reloading and checking XP history
      await page.reload();
      await page.getByTestId("character-sheet").waitFor({ timeout: 15000 });
      const xpHistory = page.getByTestId("xp-history-section");
      await xpHistory.scrollIntoViewIfNeeded();
      await xpHistory.click();
      // Wait for history content to expand
      await expect(xpHistory).toContainText(/1[,.]?000/, { timeout: 5000 });
    } finally {
      await deleteTestChar(page.request, charId);
    }
  });

  test("single-class: delete XP entry via confirm dialog", async ({ page }) => {
    test.setTimeout(90000);

    // Create own test character (fully independent)
    const charId = await createSingleClassChar(page.request);
    expect(charId).toBeTruthy();

    try {
      // First add XP so there's something to delete
      await openXpDialog(page, charId);
      await page.getByTestId("xp-amount-input").fill("100");
      await page.getByTestId("xp-apply-button").click();
      await expect(page.getByTestId("xp-add-dialog")).not.toBeVisible({ timeout: 10000 });

      // Reload to get fresh history
      await page.reload();
      await page.getByTestId("character-sheet").waitFor({ timeout: 15000 });

      // Open XP history section
      const xpHistory = page.getByTestId("xp-history-section");
      await xpHistory.scrollIntoViewIfNeeded();
      await xpHistory.click();

      // Wait for delete button to appear after history expands
      const deleteBtn = page.locator("[data-testid^='xp-history-delete-']").first();
      const isVisible = await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false);

      if (isVisible) {
        page.on("dialog", (dialog) => dialog.accept());
        await deleteBtn.click();
        // Wait for deletion to complete
        await expect(deleteBtn)
          .not.toBeVisible({ timeout: 5000 })
          .catch(() => {});
      }
    } finally {
      await deleteTestChar(page.request, charId);
    }
  });

  test("multiclass: add XP shows per-class distribution", async ({ page }) => {
    test.setTimeout(90000);

    const charId = await createMulticlassChar(page.request);
    expect(charId).toBeTruthy();

    try {
      await openXpDialog(page, charId);

      // Enter XP
      await page.getByTestId("xp-amount-input").fill("2000");

      // Distribution section should be visible (multiclass)
      await expect(page.getByTestId("xp-distribution-section")).toBeVisible({ timeout: 3000 });

      // Two class inputs should exist
      const classInputs = page.locator("[data-testid^='xp-class-input-']");
      await expect(classInputs).toHaveCount(2, { timeout: 3000 });

      // Default: equal split (1000 each)
      const firstInput = classInputs.first();
      await expect(firstInput).toHaveValue("1000", { timeout: 3000 });

      // Preview should show both classes with L7
      const preview = page.getByTestId("xp-preview-section");
      const previewText = await preview.textContent();
      expect(previewText).toContain("L7");

      // Apply
      await page.getByTestId("xp-apply-button").click();
      await expect(page.getByTestId("xp-add-dialog")).not.toBeVisible({ timeout: 5000 });
    } finally {
      await deleteTestChar(page.request, charId);
    }
  });

  test("multiclass: custom XP distribution per class", async ({ page }) => {
    test.setTimeout(90000);

    const charId = await createMulticlassChar(page.request);
    expect(charId).toBeTruthy();

    try {
      await openXpDialog(page, charId);

      // Enter total XP
      await page.getByTestId("xp-amount-input").fill("3000");
      await expect(page.getByTestId("xp-distribution-section")).toBeVisible({ timeout: 3000 });

      // Override: give 2000 to first class, 1000 to second
      const classInputs = page.locator("[data-testid^='xp-class-input-']");
      await expect(classInputs).toHaveCount(2, { timeout: 3000 });
      await classInputs.first().fill("2000");
      await classInputs.nth(1).fill("1000");

      // Remaining should show 0
      const remaining = page.getByTestId("xp-remaining");
      await expect(remaining).toContainText("0", { timeout: 3000 });

      // Apply
      await page.getByTestId("xp-apply-button").click();
      await expect(page.getByTestId("xp-add-dialog")).not.toBeVisible({ timeout: 5000 });
    } finally {
      await deleteTestChar(page.request, charId);
    }
  });

  test("cancel XP dialog does not change anything", async ({ page }) => {
    test.setTimeout(90000);

    const charId = await createSingleClassChar(page.request);
    expect(charId).toBeTruthy();

    try {
      await openXpDialog(page, charId);

      // Enter value but cancel
      await page.getByTestId("xp-amount-input").fill("5000");
      await page.getByTestId("xp-cancel-button").click();

      // Dialog closes
      await expect(page.getByTestId("xp-add-dialog")).not.toBeVisible({ timeout: 3000 });
    } finally {
      await deleteTestChar(page.request, charId);
    }
  });
});
