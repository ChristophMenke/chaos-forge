import type { Page, Locator } from "@playwright/test";

export class PartyPage {
  readonly page: Page;
  readonly container: Locator;

  // Character selector (Acting As)
  readonly actingAsSelect: Locator;

  // Tabs (mobile)
  readonly tabLoot: Locator;
  readonly tabGold: Locator;
  readonly tabLog: Locator;

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
  readonly itemsAddBtn: Locator;
  readonly itemsList: Locator;
  readonly itemsEmpty: Locator;

  // Add-to-Loot sheet
  readonly addLootSheet: Locator;
  readonly addLootCharacterList: Locator;
  readonly addLootSearch: Locator;
  readonly addLootQtyMinus: Locator;
  readonly addLootQtyPlus: Locator;
  readonly addLootQtyInput: Locator;
  readonly addLootConfirm: Locator;
  readonly addLootCancel: Locator;
  readonly addLootEquippedWarning: Locator;

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

    this.actingAsSelect = page.getByTestId("party-acting-as-select");

    this.tabLoot = page.getByTestId("party-tab-loot");
    this.tabGold = page.getByTestId("party-tab-gold");
    this.tabLog = page.getByTestId("party-tab-log");

    this.goldPanel = page.getByTestId("party-gold-panel");
    this.goldCoins = page.getByTestId("party-gold-coins");
    this.goldPP = page.getByTestId("party-gold-pp");
    this.goldGP = page.getByTestId("party-gold-gp");
    this.goldEP = page.getByTestId("party-gold-ep");
    this.goldSP = page.getByTestId("party-gold-sp");
    this.goldCP = page.getByTestId("party-gold-cp");
    this.addGoldBtn = page.getByTestId("party-add-gold-btn");
    this.distributeGoldBtn = page.getByTestId("party-distribute-gold-btn");

    this.addGoldDialog = page.getByTestId("party-add-gold-dialog");
    this.addGoldPP = page.getByTestId("party-add-gold-pp");
    this.addGoldGP = page.getByTestId("party-add-gold-gp");
    this.addGoldConfirm = page.getByTestId("party-add-gold-confirm");
    this.addGoldCancel = page.getByTestId("party-add-gold-cancel");

    this.distributeGoldDialog = page.getByTestId("party-distribute-gold-dialog");
    this.distributeGoldCharacter = page.getByTestId("party-distribute-gold-character");
    this.distributeGoldGP = page.getByTestId("party-distribute-gold-gp");
    this.distributeGoldConfirm = page.getByTestId("party-distribute-gold-confirm");
    this.distributeGoldCancel = page.getByTestId("party-distribute-gold-cancel");

    this.itemsPanel = page.getByTestId("party-items-panel");
    this.itemsAddBtn = page.getByTestId("party-items-add-btn");
    this.itemsList = page.getByTestId("party-items-list");
    this.itemsEmpty = page.getByTestId("party-items-empty");

    this.addLootSheet = page.getByTestId("add-to-loot-sheet");
    this.addLootCharacterList = page.getByTestId("add-loot-character-list");
    this.addLootSearch = page.getByTestId("add-loot-search");
    this.addLootQtyMinus = page.getByTestId("add-loot-qty-minus");
    this.addLootQtyPlus = page.getByTestId("add-loot-qty-plus");
    this.addLootQtyInput = page.getByTestId("add-loot-qty-input");
    this.addLootConfirm = page.getByTestId("add-loot-confirm");
    this.addLootCancel = page.getByTestId("add-loot-cancel");
    this.addLootEquippedWarning = page.getByTestId("add-loot-equipped-warning");

    this.distributeItemDialog = page.getByTestId("party-distribute-item-dialog");
    this.distributeItemCharacter = page.getByTestId("party-distribute-item-character");
    this.distributeItemQuantity = page.getByTestId("party-distribute-item-quantity");
    this.distributeItemConfirm = page.getByTestId("party-distribute-item-confirm");
    this.distributeItemCancel = page.getByTestId("party-distribute-item-cancel");

    this.logPanel = page.getByTestId("party-log-panel");
    this.logEntries = page.getByTestId("party-log-entries");
  }

  async goto() {
    await this.page.goto("/party");
    await this.container.waitFor({ timeout: 15000 });
  }

  /**
   * Opens Add-to-Loot sheet, forces character selection to the given
   * character, and clicks the item. Parallel-safe for the shared test user.
   */
  async addFromInventory(characterName: string, itemLabel: string | RegExp) {
    await this.itemsAddBtn.click();
    await this.addLootSheet.waitFor({ timeout: 5000 });

    // Back out of item-step if sheet auto-skipped character selection
    const backBtn = this.addLootSheet.getByTestId("add-loot-back");
    if (
      await backBtn
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await backBtn.first().click();
    }

    // Pick the explicit character
    const charCard = this.addLootSheet
      .locator("button[data-testid^='add-loot-character-']")
      .filter({ hasText: characterName });
    await charCard.first().click();

    // Pick the item
    const row = this.addLootSheet
      .locator("button[data-testid^='add-loot-item-']")
      .filter({ hasText: itemLabel });
    await row.first().click();
  }
}
