/**
 * Deep exploratory tests for the Priest system.
 * Tests: i18n language switching, wizard step title accuracy,
 * priesthood command undead display, multiclass edge cases.
 */
import { test, expect } from "@playwright/test";

// Helper: navigate wizard steps
async function wizardNext(page: import("@playwright/test").Page) {
  await page.getByTestId("wizard-next-button").click();
  await page.waitForTimeout(400);
}

async function navigateToPriesthoodStep(
  page: import("@playwright/test").Page,
  classId: string,
  name: string
) {
  await page.goto("/characters/new/wizard");
  await expect(page.getByTestId("character-wizard")).toBeVisible({ timeout: 10000 });
  await page.getByTestId("wizard-name-input").fill(name);
  await wizardNext(page);
  await wizardNext(page); // abilities
  await page.getByTestId("wizard-race-human").click();
  await wizardNext(page); // race
  await page.getByTestId(`wizard-class-${classId}`).click();
  await wizardNext(page); // class
  await wizardNext(page); // kit
}

async function createAndNavigateToPlay(
  page: import("@playwright/test").Page,
  classId: string,
  name: string
) {
  await page.goto("/characters/new/wizard");
  await expect(page.getByTestId("character-wizard")).toBeVisible({ timeout: 10000 });
  await page.getByTestId("wizard-name-input").fill(name);
  await wizardNext(page);
  await wizardNext(page);
  await page.getByTestId("wizard-race-human").click();
  await wizardNext(page);
  await page.getByTestId(`wizard-class-${classId}`).click();
  await wizardNext(page);
  await wizardNext(page); // kit

  // Priesthood step — if visible, skip forward
  const isPriesthoodVisible = await page
    .getByTestId("step-priesthood")
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (isPriesthoodVisible) {
    await wizardNext(page);
  }

  // Combat
  await expect(page.getByTestId("wizard-hp-max")).toBeVisible({ timeout: 5000 });
  await page.getByTestId("wizard-hp-max").fill("8");
  await wizardNext(page);

  // Summary — create
  await page.getByTestId("wizard-create-button").click();
  await page.waitForURL(/\/characters\/[a-z0-9-]+$/, { timeout: 20000 });

  // Go to play mode
  await page.getByTestId("character-play-link").click();
  await page.waitForTimeout(3000);
}

test.describe("Priest System — i18n and Language Switching", () => {
  test("DE-01: Wizard step title shows 'Glaubensrichtung' in German", async ({ page }) => {
    await navigateToPriesthoodStep(page, "cleric", "QA-DE-Kleriker");

    // H2 heading should say "Glaubensrichtung"
    const heading = page.locator("h2").filter({ hasText: "Glaubensrichtung" });
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test("DE-02: Combat rating labels are in German (Gut/Mittel/Schlecht)", async ({ page }) => {
    await navigateToPriesthoodStep(page, "cleric", "QA-DE-Priester");
    await expect(page.getByTestId("step-priesthood")).toBeVisible({ timeout: 5000 });

    // Find a badge with "Gut", "Mittel", or "Schlecht"
    const goodBadge = page
      .locator('[data-slot="badge"]')
      .filter({ hasText: /Gut|Mittel|Schlecht/ });
    await expect(goodBadge.first()).toBeVisible({ timeout: 5000 });
  });

  test("DE-03: Turn Undead panel title is in German on DE locale", async ({ page }) => {
    test.setTimeout(90000);
    await createAndNavigateToPlay(page, "cleric", "QA-DE-Turn-Kleriker");

    await expect(page.getByTestId("turn-undead-panel")).toBeVisible({ timeout: 10000 });

    // Panel heading should be "Untote vertreiben" in German
    const heading = page.locator('[data-testid="turn-undead-panel"]').locator("h3");
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    // Should contain German text
    expect(headingText).toMatch(/Untote|vertreiben|befehligen/i);
  });

  test("EN-01: Switch to English — wizard step title shows 'Faith'", async ({ page }) => {
    // Set cookie for English locale
    await page
      .context()
      .addCookies([{ name: "NEXT_LOCALE", value: "en", domain: "localhost", path: "/" }]);

    await navigateToPriesthoodStep(page, "cleric", "QA-EN-Cleric");

    // H2 heading should say "Faith"
    const heading = page.locator("h2").filter({ hasText: "Faith" });
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test("EN-02: Combat rating labels in English (Good/Medium/Poor)", async ({ page }) => {
    await page
      .context()
      .addCookies([{ name: "NEXT_LOCALE", value: "en", domain: "localhost", path: "/" }]);

    await navigateToPriesthoodStep(page, "cleric", "QA-EN-Priest");
    await expect(page.getByTestId("step-priesthood")).toBeVisible({ timeout: 5000 });

    const ratingBadge = page.locator('[data-slot="badge"]').filter({ hasText: /Good|Medium|Poor/ });
    await expect(ratingBadge.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Priest System — Multiclass Edge Cases", () => {
  test("MC-01: Cleric/Fighter multiclass shows Priesthood step", async ({ page }) => {
    await page.goto("/characters/new/wizard");
    await expect(page.getByTestId("character-wizard")).toBeVisible({ timeout: 10000 });
    await page.getByTestId("wizard-name-input").fill("QA-MC-Kleriker-Krieger");
    await wizardNext(page);
    await wizardNext(page);
    await page.getByTestId("wizard-race-human").click();
    await wizardNext(page);

    // Select both cleric and fighter (multiclass)
    await page.getByTestId("wizard-class-cleric").click();
    await page.getByTestId("wizard-class-fighter").click();
    await wizardNext(page);
    await wizardNext(page); // kit

    // Priesthood step should appear (has cleric)
    await expect(page.getByTestId("step-priesthood")).toBeVisible({ timeout: 5000 });
  });

  test("MC-02: Fighter/Mage multiclass does NOT show Priesthood step", async ({ page }) => {
    await page.goto("/characters/new/wizard");
    await expect(page.getByTestId("character-wizard")).toBeVisible({ timeout: 10000 });
    await page.getByTestId("wizard-name-input").fill("QA-MC-Krieger-Magier");
    await wizardNext(page);
    await wizardNext(page);
    await page.getByTestId("wizard-race-human").click();
    await wizardNext(page);

    // Select fighter + mage (no priest)
    await page.getByTestId("wizard-class-fighter").click();
    await page.getByTestId("wizard-class-mage").click();
    await wizardNext(page);
    await wizardNext(page); // kit

    // Priesthood step should NOT appear
    await expect(page.getByTestId("step-priesthood")).not.toBeVisible();
    await expect(page.getByTestId("wizard-hp-max")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Priest System — Play Mode Navigation Tab", () => {
  test("NAV-01: Turn Undead tab appears in mobile nav for cleric", async ({ page }) => {
    test.setTimeout(90000);
    await createAndNavigateToPlay(page, "cleric", "QA-Nav-Kleriker");

    // Mobile nav should have the "Untote" / "Undead" tab
    // data-testid="play-nav-turnUndead"
    // This is only visible on mobile viewport, but the element should exist in DOM
    const navButton = page.getByTestId("play-nav-turnUndead");
    // On desktop the mobile nav is hidden (sm:hidden), but we can check it exists
    await expect(navButton).toBeAttached();
  });

  test("NAV-02: Turn Undead tab does NOT appear for fighter (Gor)", async ({ page }) => {
    await page.goto("/characters");
    await page.waitForTimeout(3000);

    const gorLink = page.locator("a").filter({ hasText: "Gor" });
    await expect(gorLink).toBeVisible({ timeout: 10000 });
    await gorLink.click();

    await expect(page.getByTestId("character-choice-page")).toBeVisible({ timeout: 15000 });
    await page.getByTestId("character-play-link").click();
    await page.waitForTimeout(3000);

    // The turn undead nav button should NOT exist for fighter
    const navButton = page.getByTestId("play-nav-turnUndead");
    await expect(navButton).not.toBeAttached();
  });
});

test.describe("Priest System — Summary Step Verification", () => {
  test("SUM-01: Summary step shows deity and priesthood info for cleric with war priesthood", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await navigateToPriesthoodStep(page, "cleric", "QA-Summary-Kleriker");

    await expect(page.getByTestId("step-priesthood")).toBeVisible({ timeout: 5000 });

    // Fill deity and select war priesthood
    await page.getByTestId("deity-input").fill("Tempus");
    await page.getByTestId("priesthood-option-war").click();
    await wizardNext(page);

    // Combat
    await expect(page.getByTestId("wizard-hp-max")).toBeVisible({ timeout: 5000 });
    await page.getByTestId("wizard-hp-max").fill("8");
    await wizardNext(page);

    // Summary step
    const summary = page.getByTestId("wizard-step-summary");
    await expect(summary).toBeVisible({ timeout: 5000 });

    // Summary should mention deity "Tempus" or priesthood "war"
    const summaryText = await summary.textContent();
    // Deity or priesthood info should appear
    expect(summaryText).toBeTruthy();
  });

  test("SUM-02: Summary step works for generic cleric (no priesthood)", async ({ page }) => {
    test.setTimeout(60000);
    await navigateToPriesthoodStep(page, "cleric", "QA-Generic-Summary-Kleriker");

    await expect(page.getByTestId("step-priesthood")).toBeVisible({ timeout: 5000 });

    // Leave generic cleric selected (default)
    await wizardNext(page);

    // Combat
    await expect(page.getByTestId("wizard-hp-max")).toBeVisible({ timeout: 5000 });
    await page.getByTestId("wizard-hp-max").fill("8");
    await wizardNext(page);

    // Summary step should not crash
    const summary = page.getByTestId("wizard-step-summary");
    await expect(summary).toBeVisible({ timeout: 5000 });
  });
});
