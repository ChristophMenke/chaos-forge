import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** Shared axe builder configuration excluding Next.js dev tools overlay */
function createAxeBuilder(page: import("@playwright/test").Page) {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .exclude("#__next-build-indicator")
    .exclude("[data-nextjs-dialog-overlay]")
    .exclude("[data-nextjs-toast]");
}

test.describe("Accessibility — Dark Mode (WCAG 2 AA)", () => {
  test("landing page should have no accessibility violations", async ({ page }) => {
    await page.goto("/");
    const results = await createAxeBuilder(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test("login page should have no accessibility violations", async ({ page }) => {
    await page.goto("/login");
    const results = await createAxeBuilder(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test("404 page should have no accessibility violations", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    const results = await createAxeBuilder(page).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("Accessibility — Light Mode (WCAG 2 AA)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("chaos-forge-theme", "light");
    });
  });

  async function ensureLightMode(page: import("@playwright/test").Page) {
    await expect(page.locator("html.light")).toBeAttached({ timeout: 5000 });
    // Theme switch from SSR dark → client light requires a paint cycle for
    // CSS custom properties to fully resolve. Wait for transition to settle.
    await page
      .waitForFunction(
        () => {
          const bg = getComputedStyle(document.body).backgroundColor;
          return bg !== "" && bg !== "rgba(0, 0, 0, 0)";
        },
        { timeout: 3000 }
      )
      .catch(() => {});
  }

  test("landing page in light mode should have no accessibility violations", async ({ page }) => {
    await page.goto("/");
    await ensureLightMode(page);
    const results = await createAxeBuilder(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test("login page in light mode should have no accessibility violations", async ({ page }) => {
    await page.goto("/login");
    await ensureLightMode(page);
    const results = await createAxeBuilder(page).analyze();
    expect(results.violations).toEqual([]);
  });

  test("404 page in light mode should have no accessibility violations", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await page.waitForLoadState("networkidle");
    await ensureLightMode(page);
    const results = await createAxeBuilder(page).analyze();
    expect(results.violations).toEqual([]);
  });
});
