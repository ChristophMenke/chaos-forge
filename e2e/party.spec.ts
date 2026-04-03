import { test, expect } from "@playwright/test";
import { PartyPage } from "./pages/party.page";

test.describe("Party Inventory Page", () => {
  test("shows party page with gold pool, items panel, and log", async ({ page }) => {
    test.setTimeout(30000);
    const party = new PartyPage(page);
    await party.goto();

    // All three panels visible
    await expect(party.goldPanel).toBeVisible();
    await expect(party.itemsPanel).toBeVisible();
    await expect(party.logPanel).toBeVisible();

    // Gold panel shows all 5 coin types
    await expect(party.goldPP).toBeVisible();
    await expect(party.goldGP).toBeVisible();
    await expect(party.goldEP).toBeVisible();
    await expect(party.goldSP).toBeVisible();
    await expect(party.goldCP).toBeVisible();

    // Action buttons visible
    await expect(party.addGoldBtn).toBeVisible();
    await expect(party.distributeGoldBtn).toBeVisible();

    // Items panel has search input and add button
    await expect(party.itemsSearchInput).toBeVisible();
    await expect(party.itemsAddBtn).toBeVisible();
  });

  test("can add gold to the party pool", async ({ page }) => {
    test.setTimeout(30000);
    const party = new PartyPage(page);
    await party.goto();

    // Read current GP value
    const gpBefore = await party.goldGP.textContent();

    // Open add gold dialog
    await party.addGoldBtn.click();
    await expect(party.addGoldDialog).toBeVisible();

    // Enter 50 GP
    await party.addGoldGP.fill("50");
    await party.addGoldConfirm.click();

    // Dialog closes
    await expect(party.addGoldDialog).not.toBeVisible({ timeout: 5000 });

    // GP value increased by 50
    const gpAfter = await party.goldGP.textContent();
    expect(Number(gpAfter)).toBe(Number(gpBefore) + 50);

    // Log entry appears after reload (server component fetches from DB)
    await page.reload();
    await party.container.waitFor({ timeout: 10000 });
    await expect(party.logEntries).toBeVisible({ timeout: 5000 });
  });

  test("can cancel add gold dialog", async ({ page }) => {
    test.setTimeout(20000);
    const party = new PartyPage(page);
    await party.goto();

    const gpBefore = await party.goldGP.textContent();

    await party.addGoldBtn.click();
    await expect(party.addGoldDialog).toBeVisible();

    // Enter value but cancel
    await party.addGoldGP.fill("100");
    await party.addGoldCancel.click();

    // Dialog closes, value unchanged
    await expect(party.addGoldDialog).not.toBeVisible();
    const gpAfter = await party.goldGP.textContent();
    expect(gpAfter).toBe(gpBefore);
  });

  test("can add a custom item to the party pool", async ({ page }) => {
    test.setTimeout(30000);
    const party = new PartyPage(page);
    await party.goto();

    // Focus the search input (enters search mode), then create custom item
    await party.itemsSearchInput.click();
    await party.itemsSearchInput.fill("QA-Testartikel");

    // Wait for dropdown, then click the custom item link
    await page.waitForTimeout(500);
    const customBtn = page.locator("button.text-primary", { hasText: "QA-Testartikel" }).first();
    await customBtn.click();

    // Now in custom mode — click Add
    await party.itemsAddBtn.click();

    // Wait for item to appear in list
    await expect(party.itemsList).toBeVisible({ timeout: 5000 });
    const itemText = await party.itemsList.textContent();
    expect(itemText).toContain("QA-Testartikel");
  });

  test("can remove an item from the party pool", async ({ page }) => {
    test.setTimeout(30000);
    const party = new PartyPage(page);
    await party.goto();

    // First add an item via the custom item flow
    await party.itemsSearchInput.click();
    await party.itemsSearchInput.fill("QA-RemoveTest");
    // Wait for dropdown, then click the custom item link
    await page.waitForTimeout(500);
    const customBtn = page.locator("button.text-primary", { hasText: "QA-RemoveTest" }).first();
    await customBtn.click();
    // Now in custom mode, click Add
    await party.itemsAddBtn.click();
    await expect(party.itemsList).toBeVisible({ timeout: 5000 });

    // Find the remove button for this item
    const itemRow = party.itemsList
      .locator("[data-testid^='party-item-']")
      .filter({ hasText: "QA-RemoveTest" });
    await expect(itemRow).toBeVisible({ timeout: 5000 });
    const removeBtn = itemRow.locator("[data-testid^='party-item-remove-']");
    await removeBtn.click();

    // Item should be gone
    await expect(itemRow).not.toBeVisible({ timeout: 5000 });
  });

  test("navigation item exists and links to /party", async ({ page }) => {
    test.setTimeout(20000);
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);

    const navItem = page.getByTestId("nav-party");
    await expect(navItem).toBeVisible();
    await navItem.click();

    await expect(page).toHaveURL(/\/party/);
    await expect(page.getByTestId("party-page")).toBeVisible({ timeout: 10000 });
  });

  test("distribute gold dialog shows character dropdown", async ({ page }) => {
    test.setTimeout(30000);
    const party = new PartyPage(page);
    await party.goto();

    await party.distributeGoldBtn.click();
    await expect(party.distributeGoldDialog).toBeVisible();

    // Character dropdown is visible with at least one option
    await expect(party.distributeGoldCharacter).toBeVisible();
    const options = party.distributeGoldCharacter.locator("option");
    const count = await options.count();
    expect(count).toBeGreaterThan(1); // at least placeholder + 1 character

    // Cancel
    await party.distributeGoldCancel.click();
    await expect(party.distributeGoldDialog).not.toBeVisible();
  });
});
