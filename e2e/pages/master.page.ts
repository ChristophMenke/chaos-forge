import type { Page, Locator } from "@playwright/test";

export class MasterPage {
  readonly page: Page;

  // PIN Gate
  readonly pinGate: Locator;
  readonly pinInputs: Locator;
  readonly pinSubmit: Locator;
  readonly pinError: Locator;
  readonly pinLocked: Locator;

  // Dashboard
  readonly dashboard: Locator;
  readonly liveIndicator: Locator;

  // Sidebar (desktop) — used for tab switching
  readonly sidebarParty: Locator;
  readonly sidebarItems: Locator;
  readonly sidebarGold: Locator;
  readonly sidebarChat: Locator;

  // Party Panel
  readonly partyPanel: Locator;
  readonly partyEmpty: Locator;

  // Items Panel
  readonly itemsPanel: Locator;
  readonly itemSearch: Locator;
  readonly weaponsTab: Locator;
  readonly armorTab: Locator;
  readonly generalItemsTab: Locator;
  readonly toast: Locator;

  constructor(page: Page) {
    this.page = page;

    // PIN Gate
    this.pinGate = page.getByTestId("gm-pin-gate");
    this.pinInputs = page.getByTestId("gm-pin-inputs");
    this.pinSubmit = page.getByTestId("gm-pin-submit");
    this.pinError = page.getByTestId("gm-pin-error");
    this.pinLocked = page.getByTestId("gm-pin-locked");

    // Dashboard
    this.dashboard = page.getByTestId("gm-dashboard");
    this.liveIndicator = page.getByTestId("gm-live-indicator");

    // Sidebar tabs (desktop)
    this.sidebarParty = page.getByTestId("gm-sidebar-party");
    this.sidebarItems = page.getByTestId("gm-sidebar-items");
    this.sidebarGold = page.getByTestId("gm-sidebar-gold");
    this.sidebarChat = page.getByTestId("gm-sidebar-chat");

    // Party Panel
    this.partyPanel = page.getByTestId("gm-party-panel");
    this.partyEmpty = page.getByTestId("gm-party-empty");

    // Items Panel
    this.itemsPanel = page.getByTestId("gm-items-panel");
    this.itemSearch = page.getByTestId("gm-item-search");
    this.weaponsTab = page.getByTestId("gm-item-tab-weapons");
    this.armorTab = page.getByTestId("gm-item-tab-armor");
    this.generalItemsTab = page.getByTestId("gm-item-tab-items");
    this.toast = page.getByTestId("gm-toast");
  }

  async goto() {
    await this.page.goto("/master");
    await this.page.waitForTimeout(1000);
  }

  async enterPin(pin: string) {
    for (let i = 0; i < pin.length; i++) {
      await this.page.getByTestId(`gm-pin-digit-${i}`).fill(pin[i]);
    }
  }

  async submitPin() {
    // PIN gate auto-submits when all 6 digits are filled.
    // If the button is still enabled (e.g. auto-submit didn't trigger), click it.
    const btn = this.pinSubmit;
    if (await btn.isEnabled().catch(() => false)) {
      await btn.click();
    }
    await this.page.waitForTimeout(2000);
  }

  async enterAndSubmitPin(pin: string) {
    await this.enterPin(pin);
    // Wait for auto-submit or the dashboard to appear
    await this.page.waitForTimeout(2000);
  }

  async switchToItems() {
    await this.sidebarItems.click();
    await this.page.waitForTimeout(500);
  }

  async switchToGold() {
    await this.sidebarGold.click();
    await this.page.waitForTimeout(500);
  }

  async searchItems(query: string) {
    await this.itemSearch.fill(query);
    await this.page.waitForTimeout(500);
  }

  getCharacterCard(characterId: string) {
    return this.page.getByTestId(`gm-character-card-${characterId}`);
  }
}
