import type { Page, Locator } from "@playwright/test";

export class PartyPage {
  readonly page: Page;
  readonly container: Locator;

  // Gold panel
  readonly goldPanel: Locator;
  readonly goldCoins: Locator;
  readonly goldPP: Locator;
  readonly goldGP: Locator;
  readonly goldEP: Locator;
  readonly goldSP: Locator;
  readonly goldCP: Locator;
  readonly addGoldBtn: Locator;
  readonly distributeGoldBtn: Locator;

  // Add Gold dialog
  readonly addGoldDialog: Locator;
  readonly addGoldPP: Locator;
  readonly addGoldGP: Locator;
  readonly addGoldConfirm: Locator;
  readonly addGoldCancel: Locator;

  // Distribute Gold dialog
  readonly distributeGoldDialog: Locator;
  readonly distributeGoldCharacter: Locator;
  readonly distributeGoldGP: Locator;
  readonly distributeGoldConfirm: Locator;
  readonly distributeGoldCancel: Locator;

  // Items panel
  readonly itemsPanel: Locator;
  readonly itemsSearchInput: Locator;
  readonly itemsAddBtn: Locator;
  readonly itemsList: Locator;
  readonly itemsEmpty: Locator;

  // Distribute Item dialog
  readonly distributeItemDialog: Locator;
  readonly distributeItemCharacter: Locator;
  readonly distributeItemQuantity: Locator;
  readonly distributeItemConfirm: Locator;
  readonly distributeItemCancel: Locator;

  // Log panel
  readonly logPanel: Locator;
  readonly logEntries: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId("party-page");

    // Gold panel
    this.goldPanel = page.getByTestId("party-gold-panel");
    this.goldCoins = page.getByTestId("party-gold-coins");
    this.goldPP = page.getByTestId("party-gold-pp");
    this.goldGP = page.getByTestId("party-gold-gp");
    this.goldEP = page.getByTestId("party-gold-ep");
    this.goldSP = page.getByTestId("party-gold-sp");
    this.goldCP = page.getByTestId("party-gold-cp");
    this.addGoldBtn = page.getByTestId("party-add-gold-btn");
    this.distributeGoldBtn = page.getByTestId("party-distribute-gold-btn");

    // Add Gold dialog
    this.addGoldDialog = page.getByTestId("party-add-gold-dialog");
    this.addGoldPP = page.getByTestId("party-add-gold-pp");
    this.addGoldGP = page.getByTestId("party-add-gold-gp");
    this.addGoldConfirm = page.getByTestId("party-add-gold-confirm");
    this.addGoldCancel = page.getByTestId("party-add-gold-cancel");

    // Distribute Gold dialog
    this.distributeGoldDialog = page.getByTestId("party-distribute-gold-dialog");
    this.distributeGoldCharacter = page.getByTestId("party-distribute-gold-character");
    this.distributeGoldGP = page.getByTestId("party-distribute-gold-gp");
    this.distributeGoldConfirm = page.getByTestId("party-distribute-gold-confirm");
    this.distributeGoldCancel = page.getByTestId("party-distribute-gold-cancel");

    // Items panel
    this.itemsPanel = page.getByTestId("party-items-panel");
    this.itemsSearchInput = page.getByTestId("party-items-search-input");
    this.itemsAddBtn = page.getByTestId("party-items-add-btn");
    this.itemsList = page.getByTestId("party-items-list");
    this.itemsEmpty = page.getByTestId("party-items-empty");

    // Distribute Item dialog
    this.distributeItemDialog = page.getByTestId("party-distribute-item-dialog");
    this.distributeItemCharacter = page.getByTestId("party-distribute-item-character");
    this.distributeItemQuantity = page.getByTestId("party-distribute-item-quantity");
    this.distributeItemConfirm = page.getByTestId("party-distribute-item-confirm");
    this.distributeItemCancel = page.getByTestId("party-distribute-item-cancel");

    // Log panel
    this.logPanel = page.getByTestId("party-log-panel");
    this.logEntries = page.getByTestId("party-log-entries");
  }

  async goto() {
    await this.page.goto("/party");
    await this.container.waitFor({ timeout: 15000 });
  }
}
