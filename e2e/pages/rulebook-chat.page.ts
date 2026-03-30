import type { Page, Locator } from "@playwright/test";

export class RulebookChatPage {
  readonly page: Page;
  readonly container: Locator;
  readonly welcomeScreen: Locator;
  readonly chatInput: Locator;
  readonly sendButton: Locator;
  readonly chatMessages: Locator;
  readonly loadingIndicator: Locator;
  readonly bookFilterToggle: Locator;
  readonly bookFilter: Locator;
  readonly bookFilterAll: Locator;
  readonly exampleQuestions: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId("rulebook-chat");
    this.welcomeScreen = page.getByTestId("chat-welcome");
    this.chatInput = page.getByTestId("chat-input");
    this.sendButton = page.getByTestId("chat-send-button");
    this.chatMessages = page.getByTestId("chat-messages");
    this.loadingIndicator = page.getByTestId("chat-loading");
    this.bookFilterToggle = page.getByTestId("toggle-book-filter");
    this.bookFilter = page.getByTestId("book-filter");
    this.bookFilterAll = page.getByTestId("book-filter-all");
    this.exampleQuestions = page.getByTestId("example-question");
  }

  async goto() {
    await this.page.goto("/chat");
  }

  async sendMessage(text: string) {
    await this.chatInput.fill(text);
    await this.sendButton.click();
  }

  userMessages() {
    return this.page.getByTestId("chat-message-user");
  }

  assistantMessages() {
    return this.page.getByTestId("chat-message-assistant");
  }
}
