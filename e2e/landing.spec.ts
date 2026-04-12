import { test, expect } from "@playwright/test";
import { LandingPage } from "./pages/landing.page";

test.describe("Landing Page (unauthenticated)", () => {
  test("should show landing page with CTA", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(landing.heading).toContainText("Schmiede deine Legende");
    await expect(landing.ctaButton).toBeVisible();
  });

  test("should navigate to login when CTA is clicked", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await landing.ctaButton.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows all four feature cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("landing-feature-character")).toBeVisible();
    await expect(page.getByTestId("landing-feature-session")).toBeVisible();
    await expect(page.getByTestId("landing-feature-chat")).toBeVisible();
    await expect(page.getByTestId("landing-feature-gm")).toBeVisible();
  });

  test("shows how-it-works timeline with three steps", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("landing-step-1")).toBeVisible();
    await expect(page.getByTestId("landing-step-2")).toBeVisible();
    await expect(page.getByTestId("landing-step-3")).toBeVisible();
  });

  test("footer CTA also navigates to login", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByTestId("landing-footer-cta");
    await footer.scrollIntoViewIfNeeded();
    await page.getByTestId("cta-login-button-footer").click();
    await expect(page).toHaveURL(/\/login/);
  });
});
