import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { RulebookChatPage } from "./pages/rulebook-chat.page";

test.describe("Rulebook Chat", () => {
  test("shows welcome screen with example questions", async ({ page }) => {
    const chat = new RulebookChatPage(page);
    await chat.goto();

    await expect(chat.container).toBeVisible({ timeout: 15000 });
    await expect(chat.welcomeScreen).toBeVisible();
    await expect(chat.exampleQuestions).toHaveCount(3);
    await expect(chat.chatInput).toBeVisible();
    await expect(chat.sendButton).toBeVisible();
  });

  test("send button is disabled when input is empty", async ({ page }) => {
    const chat = new RulebookChatPage(page);
    await chat.goto();

    await expect(chat.container).toBeVisible({ timeout: 15000 });
    await expect(chat.sendButton).toBeDisabled();
  });

  test("book filter toggles on click", async ({ page }) => {
    const chat = new RulebookChatPage(page);
    await chat.goto();

    await expect(chat.container).toBeVisible({ timeout: 15000 });

    // Filter is hidden by default
    await expect(chat.bookFilter).not.toBeVisible();

    // Click toggle to show
    await chat.bookFilterToggle.click();
    await expect(chat.bookFilter).toBeVisible();
    await expect(chat.bookFilterAll).toBeVisible();

    // Click toggle to hide
    await chat.bookFilterToggle.click();
    await expect(chat.bookFilter).not.toBeVisible();
  });

  test("sends a question and shows user message (mocked API)", async ({ page }) => {
    // Mock the API to return a streamed response
    await page.route("**/api/rulebook-chat", async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
        body: "Ein Kämpfer der Stufe 5 hat eine THAC0 von 16. **(PHB)**",
      });
    });

    const chat = new RulebookChatPage(page);
    await chat.goto();

    await expect(chat.container).toBeVisible({ timeout: 15000 });

    // Send a question
    await chat.sendMessage("Welche THAC0 hat ein Kämpfer auf Stufe 5?");

    // User message appears
    await expect(chat.userMessages().first()).toContainText("THAC0");

    // Assistant message appears (from mocked response)
    await expect(chat.assistantMessages().first()).toBeVisible({ timeout: 10000 });
    await expect(chat.assistantMessages().first()).toContainText("THAC0 von 16");
    await expect(chat.assistantMessages().first()).toContainText("PHB");
  });

  test("clicking example question sends it", async ({ page }) => {
    // Mock API
    await page.route("**/api/rulebook-chat", async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
        body: "Mock-Antwort",
      });
    });

    const chat = new RulebookChatPage(page);
    await chat.goto();

    await expect(chat.container).toBeVisible({ timeout: 15000 });

    // Click first example question
    await chat.exampleQuestions.first().click();

    // Welcome screen disappears, user message appears
    await expect(chat.userMessages().first()).toBeVisible({ timeout: 5000 });
  });

  test("handles API error gracefully", async ({ page }) => {
    await page.route("**/api/rulebook-chat", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Regelbuch-Chat nicht verfügbar" }),
      });
    });

    const chat = new RulebookChatPage(page);
    await chat.goto();

    await expect(chat.container).toBeVisible({ timeout: 15000 });
    await chat.sendMessage("Testfrage");

    // Error message appears in chat
    await expect(chat.assistantMessages().first()).toBeVisible({ timeout: 10000 });
    await expect(chat.assistantMessages().first()).toContainText("Fehler");
  });

  test("navigation item is visible in sidebar", async ({ page }) => {
    const chat = new RulebookChatPage(page);
    await chat.goto();

    await expect(page.getByTestId("nav-rulebook")).toBeVisible({ timeout: 15000 });
  });

  test("passes axe-core accessibility scan", async ({ page }) => {
    // Mock API to avoid real calls
    await page.route("**/api/rulebook-chat", async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
        body: "Antwort",
      });
    });

    const chat = new RulebookChatPage(page);
    await chat.goto();
    await expect(chat.container).toBeVisible({ timeout: 15000 });

    const results = await new AxeBuilder({ page })
      .exclude(".glass") // exclude glassmorphism for color contrast
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
