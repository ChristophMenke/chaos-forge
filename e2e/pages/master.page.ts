import { type Page, type Locator, expect } from "@playwright/test";

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

  // NPC Panel
  readonly npcsPanel: Locator;
  readonly npcSearch: Locator;
  readonly npcCreate: Locator;
  readonly npcForm: Locator;
  readonly npcEmpty: Locator;

  // Bestiary Panel
  readonly bestiaryPanel: Locator;
  readonly bestiarySearch: Locator;
  readonly bestiaryEmpty: Locator;

  // Combat Simulator
  readonly combatSimulator: Locator;
  readonly combatSetup: Locator;
  readonly combatRun: Locator;
  readonly combatResults: Locator;
  readonly combatLog: Locator;

  // Sidebar new tabs
  readonly sidebarNpcs: Locator;
  readonly sidebarBestiary: Locator;
  readonly sidebarCombat: Locator;

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
    this.sidebarNpcs = page.getByTestId("gm-sidebar-npcs");
    this.sidebarBestiary = page.getByTestId("gm-sidebar-bestiary");
    this.sidebarCombat = page.getByTestId("gm-sidebar-combat");

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

    // NPC Panel
    this.npcsPanel = page.getByTestId("gm-npcs-panel");
    this.npcSearch = page.getByTestId("gm-npc-search");
    this.npcCreate = page.getByTestId("gm-npc-create");
    this.npcForm = page.getByTestId("gm-npc-form");
    this.npcEmpty = page.getByTestId("gm-npc-empty");

    // Bestiary Panel
    this.bestiaryPanel = page.getByTestId("gm-bestiary-panel");
    this.bestiarySearch = page.getByTestId("gm-bestiary-search");
    this.bestiaryEmpty = page.getByTestId("gm-bestiary-empty");

    // Combat Simulator
    this.combatSimulator = page.getByTestId("gm-combat-simulator");
    this.combatSetup = page.getByTestId("gm-combat-setup");
    this.combatRun = page.getByTestId("gm-combat-run");
    this.combatResults = page.getByTestId("gm-combat-results");
    this.combatLog = page.getByTestId("gm-combat-log");
  }

  async goto() {
    await this.page.goto("/master");
    // Wait for either PIN gate or dashboard (if already authenticated)
    await Promise.race([
      this.pinGate.waitFor({ state: "visible", timeout: 15000 }),
      this.dashboard.waitFor({ state: "visible", timeout: 15000 }),
    ]);
  }

  async enterPin(pin: string) {
    // Fill each digit individually and wait for React to process
    // the state update before proceeding to the next digit.
    // This avoids stale closure issues with the digits state array.
    for (let i = 0; i < pin.length; i++) {
      const input = this.page.getByTestId(`gm-pin-digit-${i}`);
      await input.click();
      await input.pressSequentially(pin[i]);
      // Wait for React to commit the state update
      await expect(input).toHaveValue(pin[i], { timeout: 2000 });
    }
  }

  async enterAndSubmitPin(pin: string) {
    await this.enterPin(pin);
    // Auto-submit triggers when 6th digit is entered via handleChange.
    // If auto-submit didn't fire, click the button as fallback.
    try {
      await this.dashboard.waitFor({ state: "visible", timeout: 10000 });
    } catch {
      if (await this.pinSubmit.isEnabled().catch(() => false)) {
        await this.pinSubmit.click();
      }
    }
  }

  async switchToItems() {
    await this.sidebarItems.click();
    await this.itemsPanel.waitFor({ state: "visible", timeout: 5000 });
  }

  async switchToGold() {
    await this.sidebarGold.click();
    await this.page.getByTestId("gm-gold-panel").waitFor({ state: "visible", timeout: 5000 });
  }

  async switchToNpcs() {
    await this.sidebarNpcs.click();
    await this.npcsPanel.waitFor({ state: "visible", timeout: 5000 });
  }

  async switchToBestiary() {
    await this.sidebarBestiary.click();
    await this.bestiaryPanel.waitFor({ state: "visible", timeout: 5000 });
  }

  async switchToCombat() {
    await this.sidebarCombat.click();
    await this.combatSimulator.waitFor({ state: "visible", timeout: 5000 });
  }

  async searchItems(query: string) {
    await this.itemSearch.fill(query);
    // Wait for search results or empty state to appear
    await Promise.race([
      this.page.locator("[data-testid^='gm-item-result-']").first().waitFor({ timeout: 3000 }),
      this.page.getByTestId("gm-item-empty").waitFor({ timeout: 3000 }),
    ]).catch(() => {
      /* results may already be visible */
    });
  }

  getCharacterCard(characterId: string) {
    return this.page.getByTestId(`gm-character-card-${characterId}`);
  }
}
