/**
 * Exploratory tests for the Priest system:
 * - Character Wizard: Glaubensrichtung step (Cleric, Druid, Non-Priest)
 * - Turn Undead panel in Play Mode
 * - Priesthood-based sphere filtering
 *
 * Uses the shared storageState auth (from auth.setup.ts).
 * All tests navigate to /characters/new/wizard directly.
 */
import { test, expect } from "@playwright/test";

// Helper: click Next and wait briefly
async function wizardNext(page: import("@playwright/test").Page) {
  await page.getByTestId("wizard-next-button").click();
  await page.waitForTimeout(400);
}

// Helper: navigate through wizard to Priesthood step for a given classId
async function navigateToPriesthoodStep(
  page: import("@playwright/test").Page,
  classId: string,
  characterName: string
) {
  await page.goto("/characters/new/wizard");
  await expect(page.getByTestId("character-wizard")).toBeVisible({ timeout: 10000 });

  // Step 1: Basics — fill name
  await page.getByTestId("wizard-name-input").fill(characterName);
  await wizardNext(page);

  // Step 2: Abilities — just proceed
  await wizardNext(page);

  // Step 3: Race — pick human
  await page.getByTestId("wizard-race-human").click();
  await wizardNext(page);

  // Step 4: Class
  await page.getByTestId(`wizard-class-${classId}`).click();
  await wizardNext(page);

  // Step 5: Kit — just proceed
  await wizardNext(page);
}

test.describe("Priest System — Character Wizard", () => {
  test("Scenario 1: Cleric shows Priesthood step with all expected elements", async ({ page }) => {
    await navigateToPriesthoodStep(page, "cleric", "QA-Aldric der Fromme");

    // Should now be on Priesthood step
    await expect(page.getByTestId("step-priesthood")).toBeVisible({ timeout: 5000 });

    // Deity input visible
    await expect(page.getByTestId("deity-input")).toBeVisible();

    // Priesthood search visible (cleric-only)
    await expect(page.getByTestId("priesthood-search")).toBeVisible();

    // Generic cleric option visible
    await expect(page.getByTestId("priesthood-option-none")).toBeVisible();

    // At least 50+ priesthood cards visible (64 options + generic)
    const priesthoodCards = page.locator('[data-testid^="priesthood-option-"]');
    const count = await priesthoodCards.count();
    expect(count).toBeGreaterThan(50);

    // War priesthood exists
    await expect(page.getByTestId("priesthood-option-war")).toBeVisible();
  });

  test("Scenario 2: Non-priest (Thief) skips Priesthood step", async ({ page }) => {
    await navigateToPriesthoodStep(page, "thief", "QA-Shiv der Dieb");

    // Should NOT see priesthood step — should go directly to combat
    await expect(page.getByTestId("step-priesthood")).not.toBeVisible();
    // Combat step should be active
    await expect(page.getByTestId("wizard-hp-max")).toBeVisible({ timeout: 5000 });
  });

  test("Scenario 3: Fighter skips Priesthood step", async ({ page }) => {
    await navigateToPriesthoodStep(page, "fighter", "QA-Krag der Krieger");

    // Should NOT see priesthood step
    await expect(page.getByTestId("step-priesthood")).not.toBeVisible();
    await expect(page.getByTestId("wizard-hp-max")).toBeVisible({ timeout: 5000 });
  });

  test("Scenario 4: Druid shows deity input but NO priesthood selection", async ({ page }) => {
    await navigateToPriesthoodStep(page, "druid", "QA-Sylva die Druidin");

    // Priesthood step should be visible (druid is priest)
    await expect(page.getByTestId("step-priesthood")).toBeVisible({ timeout: 5000 });

    // Deity input should be visible
    await expect(page.getByTestId("deity-input")).toBeVisible();

    // Priesthood search should NOT be visible (druids don't choose priesthood)
    await expect(page.getByTestId("priesthood-search")).not.toBeVisible();

    // "No priesthood for druid" hint should be visible
    await expect(page.getByTestId("no-priesthood-druid")).toBeVisible();

    // Generic cleric option should NOT be visible
    await expect(page.getByTestId("priesthood-option-none")).not.toBeVisible();
  });

  test("Scenario 5: Priesthood search filter works — Krieg narrows results", async ({ page }) => {
    await navigateToPriesthoodStep(page, "cleric", "QA-Suchtest-Kleriker");

    await expect(page.getByTestId("step-priesthood")).toBeVisible({ timeout: 5000 });

    const searchInput = page.getByTestId("priesthood-search");
    const allCards = page.locator('[data-testid^="priesthood-option-"]');

    // Total count before filtering
    const totalCount = await allCards.count();
    expect(totalCount).toBeGreaterThan(50);

    // Search for "Krieg" (German for war)
    await searchInput.fill("Krieg");
    await page.waitForTimeout(300);

    // War priesthood should be visible
    await expect(page.getByTestId("priesthood-option-war")).toBeVisible();

    // Filtered count should be much less
    const filteredCount = await allCards.count();
    expect(filteredCount).toBeLessThan(totalCount);

    // Clear search
    await searchInput.fill("");
    await page.waitForTimeout(300);

    // All options should be restored
    const restoredCount = await allCards.count();
    expect(restoredCount).toBe(totalCount);
  });

  test("Scenario 6: Priesthood selection shows spheres, combat rating, and granted powers", async ({
    page,
  }) => {
    await navigateToPriesthoodStep(page, "cleric", "QA-Tempuspriester");

    await expect(page.getByTestId("step-priesthood")).toBeVisible({ timeout: 5000 });

    // Select War priesthood
    const warOption = page.getByTestId("priesthood-option-war");
    await warOption.click();
    await page.waitForTimeout(300);

    // Should be selected (has highlighted border)
    const warClass = await warOption.getAttribute("class");
    expect(warClass).toContain("border-primary");

    // Should show sphere badges inside the card
    const sphereBadgesInCard = warOption.locator("span");
    const badgeCount = await sphereBadgesInCard.count();
    expect(badgeCount).toBeGreaterThan(0);

    // Combat rating badge must be present (good/medium/poor) — it's a Badge component
    const ratingBadge = warOption.locator('[data-slot="badge"]');
    await expect(ratingBadge.first()).toBeVisible();
  });

  test("Scenario 7: Back navigation from Priesthood step returns to Kit step", async ({ page }) => {
    await navigateToPriesthoodStep(page, "cleric", "QA-Rückwärts-Kleriker");

    await expect(page.getByTestId("step-priesthood")).toBeVisible({ timeout: 5000 });

    // Go back — should return to Kit step (priesthood disappears)
    await page.getByTestId("wizard-prev-button").click();
    await page.waitForTimeout(400);

    await expect(page.getByTestId("step-priesthood")).not.toBeVisible();

    // Go forward again — Priesthood should re-appear
    await wizardNext(page);
    await expect(page.getByTestId("step-priesthood")).toBeVisible({ timeout: 5000 });
  });

  test("Scenario 8: Complete Cleric creation with War priesthood saves successfully", async ({
    page,
  }) => {
    test.setTimeout(60000);

    await navigateToPriesthoodStep(page, "cleric", "QA-Tempus-Priester-E2E");

    // Priesthood — fill deity and select War
    await expect(page.getByTestId("step-priesthood")).toBeVisible({ timeout: 5000 });
    await page.getByTestId("deity-input").fill("Tempus");
    await page.getByTestId("priesthood-option-war").click();
    await wizardNext(page);

    // Combat — fill HP
    await expect(page.getByTestId("wizard-hp-max")).toBeVisible({ timeout: 5000 });
    await page.getByTestId("wizard-hp-max").fill("8");
    await wizardNext(page);

    // Summary — create character
    const createButton = page.getByTestId("wizard-create-button");
    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();

    // Should redirect to character page
    await page.waitForURL(/\/characters\/[a-z0-9-]+$/, { timeout: 20000 });
    expect(page.url()).toMatch(/\/characters\/[a-z0-9-]+/);
  });

  test("Scenario 9: Generic Cleric option is selected by default", async ({ page }) => {
    await navigateToPriesthoodStep(page, "cleric", "QA-Generischer-Kleriker");

    await expect(page.getByTestId("step-priesthood")).toBeVisible({ timeout: 5000 });

    // Generic cleric should be visually selected by default (priesthood = null initially)
    const noneOption = page.getByTestId("priesthood-option-none");
    const noneClass = await noneOption.getAttribute("class");
    expect(noneClass).toContain("border-primary");
  });

  test("Scenario 10: Progress indicator has 8 steps (includes Priesthood)", async ({ page }) => {
    await page.goto("/characters/new/wizard");
    await expect(page.getByTestId("character-wizard")).toBeVisible({ timeout: 10000 });

    // Count progress bars in the wizard header area
    const progressWrapper = page.locator('[data-testid="character-wizard"] > div').first();
    const steps = progressWrapper.locator("div");
    const stepCount = await steps.count();
    // Should be 8 steps (basics, abilities, race, class, kit, priesthood, combat, summary)
    expect(stepCount).toBe(8);
  });

  test("Scenario 11: Priesthood search — no results shows empty list but keeps generic cleric", async ({
    page,
  }) => {
    await navigateToPriesthoodStep(page, "cleric", "QA-Nomatch-Kleriker");

    await expect(page.getByTestId("step-priesthood")).toBeVisible({ timeout: 5000 });

    // Search for something that won't match
    await page.getByTestId("priesthood-search").fill("XYZXYZXYZ_NOMATCH_12345");
    await page.waitForTimeout(300);

    // Priesthood-specific cards should be gone (excluding "none")
    const priestCards = page.locator(
      '[data-testid^="priesthood-option-"]:not([data-testid="priesthood-option-none"])'
    );
    const count = await priestCards.count();
    expect(count).toBe(0);

    // Generic cleric should still be visible (it's outside the filter)
    await expect(page.getByTestId("priesthood-option-none")).toBeVisible();
  });

  test("Scenario 12: Deity field accepts special characters and unicode", async ({ page }) => {
    await navigateToPriesthoodStep(page, "cleric", "QA-Unicode-Priester");

    await expect(page.getByTestId("step-priesthood")).toBeVisible({ timeout: 5000 });

    const deityInput = page.getByTestId("deity-input");

    // Special characters
    await deityInput.fill("Tyr & Tempus — Götter des Krieges! <test>");
    const specialVal = await deityInput.inputValue();
    expect(specialVal.length).toBeGreaterThan(0);

    // Unicode
    await deityInput.fill("Gott Äöü Перун");
    const unicodeVal = await deityInput.inputValue();
    expect(unicodeVal.length).toBeGreaterThan(0);

    // Very long name (boundary test)
    const longName = "A".repeat(200);
    await deityInput.fill(longName);
    const longVal = await deityInput.inputValue();
    expect(longVal.length).toBeGreaterThan(0);
  });
});

// Helper: create a Cleric character via wizard and return the character URL
async function createClericAndNavigateToPlay(page: import("@playwright/test").Page): Promise<void> {
  // Create a cleric via wizard
  await page.goto("/characters/new/wizard");
  await expect(page.getByTestId("character-wizard")).toBeVisible({ timeout: 10000 });
  await page.getByTestId("wizard-name-input").fill("QA-Turn-Undead-Kleriker");
  await page.getByTestId("wizard-next-button").click();
  await page.waitForTimeout(300);
  await page.getByTestId("wizard-next-button").click();
  await page.waitForTimeout(300);
  await page.getByTestId("wizard-race-human").click();
  await page.getByTestId("wizard-next-button").click();
  await page.waitForTimeout(300);
  await page.getByTestId("wizard-class-cleric").click();
  await page.getByTestId("wizard-next-button").click();
  await page.waitForTimeout(300);
  await page.getByTestId("wizard-next-button").click(); // Kit
  await page.waitForTimeout(300);
  // Priesthood step — leave as generic
  await page.getByTestId("wizard-next-button").click();
  await page.waitForTimeout(300);
  // Combat
  await expect(page.getByTestId("wizard-hp-max")).toBeVisible({ timeout: 5000 });
  await page.getByTestId("wizard-hp-max").fill("8");
  await page.getByTestId("wizard-next-button").click();
  await page.waitForTimeout(300);
  // Summary — create
  await page.getByTestId("wizard-create-button").click();
  // Redirect to character choice page
  await page.waitForURL(/\/characters\/[a-z0-9-]+$/, { timeout: 20000 });
  // Now navigate to play mode
  await page.getByTestId("character-play-link").click();
  await page.waitForTimeout(3000);
}

test.describe("Priest System — Turn Undead in Play Mode", () => {
  test("Scenario 13: Cleric character has Turn Undead panel visible", async ({ page }) => {
    test.setTimeout(90000);
    await createClericAndNavigateToPlay(page);

    // Turn Undead panel should be visible for cleric
    await expect(page.getByTestId("turn-undead-panel")).toBeVisible({ timeout: 10000 });

    // Undead type dropdown
    await expect(page.getByTestId("undead-type-select")).toBeVisible();

    // Turn button
    await expect(page.getByTestId("turn-undead-button")).toBeVisible();

    // Level badge
    await expect(page.getByTestId("turn-undead-level")).toBeVisible();
    const levelText = await page.getByTestId("turn-undead-level").textContent();
    expect(levelText).toMatch(/Stufe|Level/);
  });

  test("Scenario 14: Turn Undead — clicking Vertreiben! shows result", async ({ page }) => {
    test.setTimeout(90000);
    await createClericAndNavigateToPlay(page);

    await expect(page.getByTestId("turn-undead-panel")).toBeVisible({ timeout: 10000 });

    // Click turn button — result should appear
    await page.getByTestId("turn-undead-button").click();
    await expect(page.getByTestId("turn-undead-result")).toBeVisible({ timeout: 3000 });

    // Result has meaningful content
    const resultText = await page.getByTestId("turn-undead-result").textContent();
    expect(resultText).toBeTruthy();
    expect(resultText!.length).toBeGreaterThan(0);
  });

  test("Scenario 15: Turn Undead — changing undead type clears previous result", async ({
    page,
  }) => {
    test.setTimeout(90000);
    await createClericAndNavigateToPlay(page);

    await expect(page.getByTestId("turn-undead-panel")).toBeVisible({ timeout: 10000 });

    // Turn against skeleton first
    const select = page.getByTestId("undead-type-select");
    await select.selectOption("skeleton");
    await page.getByTestId("turn-undead-button").click();
    await expect(page.getByTestId("turn-undead-result")).toBeVisible({ timeout: 3000 });

    // Change undead type — result should clear
    await select.selectOption("ghoul");
    await page.waitForTimeout(200);
    await expect(page.getByTestId("turn-undead-result")).not.toBeVisible();
  });

  test("Scenario 16: Turn Undead — reference table expands on click", async ({ page }) => {
    test.setTimeout(90000);
    await createClericAndNavigateToPlay(page);

    await expect(page.getByTestId("turn-undead-panel")).toBeVisible({ timeout: 10000 });

    // Reference table details element
    const details = page.locator('[data-testid="turn-undead-panel"] details');
    await expect(details).toBeVisible();

    // Initially closed
    const initialOpen = await details.getAttribute("open");
    expect(initialOpen).toBeNull();

    // Click to expand
    await details.locator("summary").click();
    await page.waitForTimeout(300);

    // Should be open now
    await expect(details).toHaveAttribute("open", "");
  });

  test("Scenario 17: Fighter (Gor) has NO Turn Undead panel", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/characters");
    await page.waitForTimeout(3000);

    const gorLink = page.locator("a").filter({ hasText: "Gor" });
    await expect(gorLink).toBeVisible({ timeout: 10000 });
    await gorLink.click();

    await expect(page.getByTestId("character-choice-page")).toBeVisible({ timeout: 15000 });
    await page.getByTestId("character-play-link").click();
    await page.waitForTimeout(3000);

    // Turn Undead panel should NOT be visible for fighter
    await expect(page.getByTestId("turn-undead-panel")).not.toBeVisible();
  });

  test("Scenario 18: Turn Undead — all undead types available in dropdown", async ({ page }) => {
    test.setTimeout(90000);
    await createClericAndNavigateToPlay(page);

    await expect(page.getByTestId("turn-undead-panel")).toBeVisible({ timeout: 10000 });

    // Count options in the undead type select
    const select = page.getByTestId("undead-type-select");
    const options = await select.locator("option").all();

    // AD&D 2e has 12+ undead types in the turn undead table
    expect(options.length).toBeGreaterThanOrEqual(12);

    // Verify key undead types are present
    const optionValues = await Promise.all(options.map((o) => o.getAttribute("value")));
    expect(optionValues).toContain("skeleton");
    expect(optionValues).toContain("ghoul");
    expect(optionValues).toContain("lich");
  });

  test("Scenario 19: Turn Undead — target info updates when undead type changes", async ({
    page,
  }) => {
    test.setTimeout(90000);
    await createClericAndNavigateToPlay(page);

    await expect(page.getByTestId("turn-undead-panel")).toBeVisible({ timeout: 10000 });

    const select = page.getByTestId("undead-type-select");
    const targetInfoBox = page.locator(
      '[data-testid="turn-undead-panel"] .rounded-md.bg-muted\\/50'
    );

    // Select skeleton (easiest) — should show a number or T
    await select.selectOption("skeleton");
    await page.waitForTimeout(200);
    const skeletonText = await targetInfoBox.textContent();
    expect(skeletonText).toBeTruthy();

    // Select lich (hardest) — should show a different (higher number) or "Nicht möglich"
    await select.selectOption("lich");
    await page.waitForTimeout(200);
    const lichText = await targetInfoBox.textContent();
    expect(lichText).toBeTruthy();

    // They should differ (lich is harder than skeleton)
    expect(skeletonText).not.toBe(lichText);
  });
});
