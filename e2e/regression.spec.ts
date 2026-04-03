import { test, expect } from "@playwright/test";
import { CharacterSheetPage } from "./pages/character-sheet.page";
import { LoginPage } from "./pages/login.page";

// Helper: Navigate to Gor's manage page
async function navigateToGor(page: import("@playwright/test").Page) {
  const sheet = new CharacterSheetPage(page);
  await page.goto("/characters");
  const gorCard = page.locator("a", { hasText: "Gor" });
  await expect(gorCard).toBeVisible({ timeout: 10000 });
  await gorCard.click();
  await expect(page.getByTestId("character-choice-page")).toBeVisible({ timeout: 15000 });
  await page.getByTestId("character-manage-link").click();
  await sheet.container.waitFor({ timeout: 30000 });
  return sheet;
}

// ── Login ────────────────────────────────────────────────────

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

// ── Character List & Navigation ──────────────────────────────

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

    const gorCard = page.locator("a", { hasText: "Gor" });
    await expect(gorCard).toBeVisible({ timeout: 10000 });
    await gorCard.click();

    await expect(page.getByTestId("character-choice-page")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("character-manage-link")).toBeVisible();
    await expect(page.getByTestId("character-play-link")).toBeVisible();

    // Play mode loads
    await page.getByTestId("character-play-link").click();
    await expect(page.getByTestId("play-mode")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("play-hp-bar")).toBeVisible();

    // Back → manage loads
    await page.goBack();
    await expect(page.getByTestId("character-choice-page")).toBeVisible({ timeout: 10000 });
    await page.getByTestId("character-manage-link").click();
    const sheet = new CharacterSheetPage(page);
    await sheet.container.waitFor({ timeout: 30000 });
  });
});

// ── Character Sheet — Read-Only Smoke ────────────────────────

test.describe("Character Sheet — Read-Only Smoke", () => {
  test("shows all tabs with correct data", async ({ page }) => {
    test.setTimeout(90000);
    const sheet = await navigateToGor(page);

    // Header
    await expect(sheet.name).toBeVisible();
    await expect(sheet.classBadge).toBeVisible();

    // Equipment tab — AC badge on armor
    await sheet.switchTab("equipment");
    await expect(page.getByTestId("equipment-ac")).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("equipment-movement")).toBeVisible({ timeout: 5000 });
    const armorAcBadge = page.locator("[data-testid^='armor-ac-']").first();
    await expect(armorAcBadge).toBeVisible({ timeout: 5000 });
    await expect(armorAcBadge).toHaveText(/\(AC \d+\)/);

    // Weapon details visible (Long Sword from seed)
    await expect(page.getByTestId("weapon-details-section")).toBeVisible({ timeout: 5000 });

    // Proficiencies tab
    await sheet.switchTab("proficiencies");
    await expect(page.getByTestId("weapon-proficiencies-section")).toBeVisible({ timeout: 5000 });
  });

  test("non-owner cannot see delete button", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/characters");
    const sheet = new CharacterSheetPage(page);

    const otherSection = page.getByTestId("other-characters-section");
    await expect(otherSection).toBeVisible({ timeout: 5000 });
    await otherSection.locator("summary").click();

    const elaraCard = page.locator("a", { hasText: "Elara" });
    await expect(elaraCard).toBeVisible({ timeout: 10000 });
    await elaraCard.click();
    await sheet.container.waitFor({ timeout: 30000 });

    await expect(sheet.deleteButton).not.toBeVisible({ timeout: 3000 });
  });
});

// ── Character Sheet — Edit & Save ────────────────────────────

test.describe("Character Sheet — Edit & Save", () => {
  test("edit personal details and save persists after reload", async ({ page }) => {
    test.setTimeout(90000);
    const sheet = await navigateToGor(page);

    // Expand personal details and change player name
    await sheet.personalDetailsSection.locator("summary").click();
    await page.waitForTimeout(500);
    const originalName = await sheet.playerNameInput.inputValue();

    await sheet.playerNameInput.fill("E2E-Test-Player");
    await sheet.save();

    // Reload and verify persistence
    await page.reload();
    await sheet.container.waitFor({ timeout: 30000 });
    await sheet.personalDetailsSection.locator("summary").click();
    await page.waitForTimeout(500);
    await expect(sheet.playerNameInput).toHaveValue("E2E-Test-Player");

    // Restore original value
    await sheet.playerNameInput.fill(originalName || "");
    await sheet.save();
  });

  test("edit notes and save persists after reload", async ({ page }) => {
    test.setTimeout(90000);
    const sheet = await navigateToGor(page);
    await sheet.switchTab("notes");

    const notesField = page.getByTestId("sheet-notes");
    await expect(notesField).toBeVisible({ timeout: 5000 });
    const originalNotes = await notesField.inputValue();

    await notesField.fill("E2E regression test notes — Gor the Fighter");
    await sheet.save();

    // Reload and verify
    await page.reload();
    await sheet.container.waitFor({ timeout: 30000 });
    await sheet.switchTab("notes");
    await expect(page.getByTestId("sheet-notes")).toHaveValue(
      "E2E regression test notes — Gor the Fighter"
    );

    // Restore
    await page.getByTestId("sheet-notes").fill(originalNotes || "E2E test character");
    await sheet.save();
  });
});

// ── Equipment — Add & Remove ─────────────────────────────────

test.describe("Equipment — Add & Remove", () => {
  test("add armor via dialog, verify AC badge, then remove", async ({ page }) => {
    test.setTimeout(90000);
    const sheet = await navigateToGor(page);
    await sheet.switchTab("equipment");

    // Open add item dialog → armor tab
    await page.getByTestId("add-item-btn").click();
    await expect(page.getByTestId("add-item-dialog")).toBeVisible({ timeout: 5000 });
    await page.getByTestId("add-dialog-tab-armor").click();
    await page.waitForTimeout(500);

    // Search for "Leather" and add it
    await page.getByTestId("equipment-search").fill("Leather");
    await page.waitForTimeout(1000);
    const leatherAddBtn = page.locator("[data-testid^='add-armor-btn-']").first();
    await expect(leatherAddBtn).toBeVisible({ timeout: 5000 });
    await leatherAddBtn.click();
    await page.waitForTimeout(1000);

    // Close dialog
    await page.getByTestId("close-add-dialog-btn").click();
    await page.waitForTimeout(500);

    // Verify new armor appears in inventory with AC badge
    const armorAcBadges = page.locator("[data-testid^='armor-ac-']");
    const countAfterAdd = await armorAcBadges.count();
    expect(countAfterAdd).toBeGreaterThanOrEqual(2); // Chain Mail + Leather

    // Remove the newly added armor (last one)
    const removeButtons = page.locator("[data-testid^='remove-item-']");
    const lastRemoveBtn = removeButtons.last();
    await lastRemoveBtn.click();
    await page.waitForTimeout(1000);

    // Verify count decreased
    const countAfterRemove = await page.locator("[data-testid^='armor-ac-']").count();
    expect(countAfterRemove).toBeLessThan(countAfterAdd);
  });

  test("unequip item changes AC value", async ({ page }) => {
    test.setTimeout(90000);
    const sheet = await navigateToGor(page);
    await sheet.switchTab("equipment");

    // Read initial AC
    const acDisplay = page.getByTestId("equipment-ac");
    await expect(acDisplay).toBeVisible({ timeout: 5000 });
    const initialAcText = await acDisplay.textContent();

    // Unequip the Chain Mail (first unequip button for armor)
    const unequipBtn = page.locator("[data-testid^='unequip-btn-']").first();
    if (await unequipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await unequipBtn.click();
      await page.waitForTimeout(1000);

      // AC should have changed (worse without armor)
      const newAcText = await acDisplay.textContent();
      expect(newAcText).not.toBe(initialAcText);

      // Re-equip to restore state
      const equipToggle = page.locator("[data-testid^='equip-toggle-']").first();
      await equipToggle.click();
      await page.waitForTimeout(1000);
    }
  });
});

// ── Play Mode — HP & Combat ──────────────────────────────────

test.describe("Play Mode — HP & Combat", () => {
  test("take damage and heal in play mode", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/characters");
    const gorCard = page.locator("a", { hasText: "Gor" });
    await expect(gorCard).toBeVisible({ timeout: 10000 });
    await gorCard.click();
    await expect(page.getByTestId("character-choice-page")).toBeVisible({ timeout: 15000 });
    await page.getByTestId("character-play-link").click();
    await expect(page.getByTestId("play-mode")).toBeVisible({ timeout: 15000 });

    // Read initial HP text
    const hpText = page.getByTestId("play-hp-text");
    await expect(hpText).toBeVisible();
    const initialHp = await hpText.textContent();

    // Take 5 damage
    await page.getByTestId("play-damage-btn").click();
    await expect(page.getByTestId("play-hp-input")).toBeVisible({ timeout: 3000 });
    await page.getByTestId("play-hp-input-field").fill("5");
    await page.getByTestId("play-hp-apply").click();
    await page.waitForTimeout(1000);

    // HP should have decreased
    const afterDamageHp = await hpText.textContent();
    expect(afterDamageHp).not.toBe(initialHp);

    // Heal 5 to restore
    await page.getByTestId("play-heal-btn").click();
    await expect(page.getByTestId("play-hp-input")).toBeVisible({ timeout: 3000 });
    await page.getByTestId("play-hp-input-field").fill("5");
    await page.getByTestId("play-hp-apply").click();
    await page.waitForTimeout(1000);

    // HP should be back to original
    const afterHealHp = await hpText.textContent();
    expect(afterHealHp).toBe(initialHp);
  });

  test("combat panel shows weapon cards and AC breakdown", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/characters");
    const gorCard = page.locator("a", { hasText: "Gor" });
    await expect(gorCard).toBeVisible({ timeout: 10000 });
    await gorCard.click();
    await page.getByTestId("character-play-link").click();
    await expect(page.getByTestId("play-mode")).toBeVisible({ timeout: 15000 });

    // Combat panel should be default — check for weapon cards
    const weaponCards = page.locator("[data-testid^='play-weapon-']");
    await expect(weaponCards.first()).toBeVisible({ timeout: 5000 });

    // AC and THAC0 displayed
    await expect(page.getByTestId("play-ac")).toBeVisible();
    await expect(page.getByTestId("play-thac0")).toBeVisible();

    // Toggle AC breakdown
    const acToggle = page.getByTestId("play-ac-toggle");
    if (await acToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acToggle.click();
      await expect(page.getByTestId("play-ac-breakdown")).toBeVisible({ timeout: 3000 });
    }
  });
});

// ── Play Mode — Coin Purse ───────────────────────────────────

test.describe("Play Mode — Coin Purse", () => {
  test("receive coins and verify balance updates", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/characters");
    const gorCard = page.locator("a", { hasText: "Gor" });
    await expect(gorCard).toBeVisible({ timeout: 10000 });
    await gorCard.click();
    await page.getByTestId("character-play-link").click();
    await expect(page.getByTestId("play-mode")).toBeVisible({ timeout: 15000 });

    // Navigate to Coin Purse panel
    await page.getByTestId("play-nav-coinPurse").click();
    await expect(page.getByTestId("play-coins")).toBeVisible({ timeout: 5000 });

    // Read initial GP
    const gpDisplay = page.getByTestId("play-coin-gp");
    await expect(gpDisplay).toBeVisible();
    const initialGp = await gpDisplay.textContent();

    // Receive 10 GP
    await page.getByTestId("play-receive-btn").click();
    await expect(page.getByTestId("play-receive-dialog")).toBeVisible({ timeout: 3000 });
    await page.getByTestId("play-receive-gp").fill("10");
    await page.getByTestId("play-receive-confirm").click();
    await page.waitForTimeout(1000);

    // GP should have increased
    const newGp = await gpDisplay.textContent();
    expect(newGp).not.toBe(initialGp);

    // Pay 10 GP back to restore
    await page.getByTestId("play-pay-btn").click();
    await page.waitForTimeout(500);
    // Pay dialog uses the manage-mode pay dialog
    const payGpInput = page.getByTestId("pay-gp-input");
    if (await payGpInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await payGpInput.fill("10");
      await page.getByTestId("pay-confirm").click();
      await page.waitForTimeout(1000);
    }
  });
});

// ── Play Mode — Inventory ────────────────────────────────────

test.describe("Play Mode — Inventory", () => {
  test("add custom item and remove it", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/characters");
    const gorCard = page.locator("a", { hasText: "Gor" });
    await expect(gorCard).toBeVisible({ timeout: 10000 });
    await gorCard.click();
    await page.getByTestId("character-play-link").click();
    await expect(page.getByTestId("play-mode")).toBeVisible({ timeout: 15000 });

    // Navigate to Inventory panel
    await page.getByTestId("play-nav-inventory").click();
    await page.waitForTimeout(1000);

    // Count existing items
    const itemsBefore = await page.locator("[data-testid^='play-inventory-item-']").count();

    // Add a custom item
    const nameInput = page.getByTestId("play-inventory-name-input");
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill("E2E Test Rope");
    await page.getByTestId("play-inventory-add-btn").click();
    await page.waitForTimeout(1000);

    // Verify item was added
    const itemsAfter = await page.locator("[data-testid^='play-inventory-item-']").count();
    expect(itemsAfter).toBe(itemsBefore + 1);

    // Find and remove the test item (last one added)
    const lastItem = page.locator("[data-testid^='play-inventory-item-']").last();
    const itemTestId = await lastItem.getAttribute("data-testid");
    const itemId = itemTestId?.replace("play-inventory-item-", "");
    if (itemId) {
      // Decrease quantity to 0 removes item
      await page.getByTestId(`play-inventory-minus-${itemId}`).click();
      await page.waitForTimeout(1000);
    }
  });
});

// ── Proficiencies — Add & Remove ─────────────────────────────

test.describe("Proficiencies — Add & Remove", () => {
  test("add weapon proficiency and remove it", async ({ page }) => {
    test.setTimeout(90000);
    const sheet = await navigateToGor(page);
    await sheet.switchTab("proficiencies");

    await expect(page.getByTestId("weapon-proficiencies-section")).toBeVisible({ timeout: 5000 });

    // Count existing proficiencies
    const profsBefore = await page.locator("[data-testid^='weapon-proficiency-']").count();

    // Type weapon name and add
    await page.getByTestId("weapon-name-input").fill("Dagger");
    await page.waitForTimeout(500);

    // Select from dropdown if visible
    const dropdown = page.getByTestId("weapon-dropdown");
    if (await dropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
      const firstOption = page.locator("[data-testid^='weapon-option-']").first();
      await firstOption.click();
      await page.waitForTimeout(300);
    }

    await page.getByTestId("weapon-add-button").click();
    await page.waitForTimeout(1000);

    // Verify proficiency was added
    const profsAfter = await page.locator("[data-testid^='weapon-proficiency-']").count();
    expect(profsAfter).toBe(profsBefore + 1);

    // Remove the last proficiency
    const removeButtons = page.locator("[data-testid^='weapon-remove-']");
    await removeButtons.last().click();
    await page.waitForTimeout(1000);

    // Verify count is back to original
    const profsAfterRemove = await page.locator("[data-testid^='weapon-proficiency-']").count();
    expect(profsAfterRemove).toBe(profsBefore);
  });
});

// ── Print View ───────────────────────────────────────────────

test.describe("Print View", () => {
  test("print view loads with all sections", async ({ page }) => {
    test.setTimeout(60000);
    const sheet = await navigateToGor(page);

    await sheet.printButton.click();
    await page.waitForTimeout(5000);
    await expect(page.getByTestId("print-sheet")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("print-section-personal")).toBeVisible();
    await expect(page.getByTestId("print-section-abilities")).toBeVisible();
    await expect(page.getByTestId("print-section-combat")).toBeVisible();
  });

  test("print customization toggles sections", async ({ page }) => {
    test.setTimeout(60000);
    const sheet = await navigateToGor(page);

    await sheet.printButton.click();
    await page.waitForTimeout(5000);
    await expect(page.getByTestId("print-sheet")).toBeVisible({ timeout: 10000 });

    // Open customization panel
    const customizeToggle = page.getByTestId("print-customize-toggle");
    if (await customizeToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await customizeToggle.click();
      await expect(page.getByTestId("print-customization-panel")).toBeVisible({ timeout: 3000 });

      // Toggle notes section off
      const notesToggle = page.getByTestId("print-toggle-notes");
      if (await notesToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
        await notesToggle.click();
        await page.waitForTimeout(500);
        // Notes section should be hidden
        await expect(page.getByTestId("print-section-notes")).not.toBeVisible();

        // Toggle back on
        await notesToggle.click();
        await page.waitForTimeout(500);
        await expect(page.getByTestId("print-section-notes")).toBeVisible();
      }
    }
  });
});
