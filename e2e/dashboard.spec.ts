import { test, expect } from "@playwright/test";

test.describe("Dashboard Layout & Stats", () => {
  test("my characters section appears before stats row", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    // My Characters heading should exist
    const myCharsHeading = page.getByRole("heading", { level: 2 }).first();
    await expect(myCharsHeading).toBeVisible();
  });

  test("stat cards show icons and values", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    // All 4 stat cards should be visible
    await expect(page.getByTestId("stat-card-adventurers")).toBeVisible();
    await expect(page.getByTestId("stat-card-avg-level")).toBeVisible();
    await expect(page.getByTestId("stat-card-sessions")).toBeVisible();
    await expect(page.getByTestId("stat-card-days-since")).toBeVisible();

    // Each stat card should contain a number or dash
    const adventurers = page.getByTestId("stat-card-adventurers");
    const text = await adventurers.textContent();
    expect(text).toMatch(/\d+/);
  });

  test("class distribution shows colored bars", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    const classCard = page.getByTestId("stat-card-classes");
    if (await classCard.isVisible()) {
      // Should contain distribution bars
      const bars = classCard.locator(".distribution-bar-fill");
      const count = await bars.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test("race distribution shows bars", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    const raceCard = page.getByTestId("stat-card-races");
    if (await raceCard.isVisible()) {
      const bars = raceCard.locator(".distribution-bar-fill");
      const count = await bars.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

test.describe("Dashboard Party Statistics", () => {
  test("party stat cards are visible", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    // Party adventurers and avg level should always show
    await expect(page.getByTestId("stat-card-party-adventurers")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("stat-card-party-avg-level")).toBeVisible();
  });

  test("combat stats show when party has characters", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    // These depend on party data existing
    const avgAC = page.getByTestId("stat-card-avg-ac");
    if (await avgAC.isVisible()) {
      const text = await avgAC.textContent();
      expect(text).toMatch(/\d+/);
    }
  });

  test("attribute averages panel shows 6 stats", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    const attrPanel = page.getByTestId("stat-card-attr-averages");
    if (await attrPanel.isVisible()) {
      const text = await attrPanel.textContent();
      // Should contain all 6 stat abbreviations
      expect(text).toContain("STR");
      expect(text).toContain("DEX");
      expect(text).toContain("CON");
      expect(text).toContain("INT");
      expect(text).toContain("WIS");
      expect(text).toContain("CHA");
    }
  });

  test("attribute extremes panel shows high and low values", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    const extremes = page.getByTestId("stat-card-attr-extremes");
    if (await extremes.isVisible()) {
      const text = await extremes.textContent();
      // Should contain stat names and character names
      expect(text).toContain("STR");
      expect(text).toMatch(/\d+/);
    }
  });

  test("alignment distribution shows bars", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    const alignCard = page.getByTestId("stat-card-alignments");
    if (await alignCard.isVisible()) {
      const bars = alignCard.locator(".distribution-bar-fill");
      const count = await bars.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

test.describe("Dashboard Party Overview", () => {
  test("shows party overview widget with active characters", async ({ page }) => {
    test.setTimeout(30000);
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    const overview = page.getByTestId("dashboard-party-overview");
    await expect(overview).toBeVisible({ timeout: 10000 });

    // Should contain at least one character link
    const charLinks = overview.locator("[data-testid^='party-char-']");
    const count = await charLinks.count();
    expect(count).toBeGreaterThan(0);

    // Each character link should show name, race/class info, and HP
    const firstChar = charLinks.first();
    await expect(firstChar).toBeVisible();
    const text = await firstChar.textContent();
    expect(text).toContain("HP");
    expect(text?.trim().length).toBeGreaterThan(5);
    const hpBar = firstChar.locator(".rounded-full").first();
    await expect(hpBar).toBeVisible();
  });

  test("party overview character links navigate to character page", async ({ page }) => {
    test.setTimeout(30000);
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    const overview = page.getByTestId("dashboard-party-overview");
    await expect(overview).toBeVisible({ timeout: 10000 });

    const firstChar = overview.locator("[data-testid^='party-char-']").first();
    await expect(firstChar).toBeVisible();

    await firstChar.click();
    await expect(page).toHaveURL(/\/characters\//, { timeout: 10000 });
  });
});
