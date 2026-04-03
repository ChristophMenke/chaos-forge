import { test, expect } from "@playwright/test";

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
