import type { Page, Locator } from "@playwright/test";

export class SpellbookPage {
  readonly page: Page;
  readonly container: Locator;
  readonly backLink: Locator;
  readonly learnButton: Locator;
  readonly resources: Locator;
  readonly searchInput: Locator;
  readonly filterAll: Locator;
  readonly filterPrepared: Locator;
  readonly emptyState: Locator;
  readonly noMagic: Locator;
  readonly learnDialog: Locator;
  readonly learnDialogSearch: Locator;
  readonly learnDialogClose: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId("spellbook");
    this.backLink = page.getByTestId("spellbook-back-link");
    this.learnButton = page.getByTestId("spellbook-learn-button");
    this.resources = page.getByTestId("spellbook-resources");
    this.searchInput = page.getByTestId("spellbook-search");
    this.filterAll = page.getByTestId("spellbook-filter-all");
    this.filterPrepared = page.getByTestId("spellbook-filter-prepared");
    this.emptyState = page.getByTestId("spellbook-empty");
    this.noMagic = page.getByTestId("spellbook-no-magic");
    this.learnDialog = page.getByTestId("spellbook-learn-dialog");
    this.learnDialogSearch = page.getByTestId("spellbook-learn-search");
    this.learnDialogClose = page.getByTestId("spellbook-learn-dialog-close");
  }

  async goto(characterId: string) {
    await this.page.goto(`/characters/${characterId}/spellbook`);
    // Wait for spellbook container or no-magic fallback
    await Promise.race([
      this.container.waitFor({ state: "visible", timeout: 15000 }),
      this.noMagic.waitFor({ state: "visible", timeout: 15000 }),
    ]);
  }

  spellCard(spellId: string) {
    return this.page.getByTestId(`spellbook-card-${spellId}`);
  }

  spellToggle(spellId: string) {
    return this.page.getByTestId(`spellbook-toggle-${spellId}`);
  }

  spellDetails(spellId: string) {
    return this.page.getByTestId(`spellbook-details-${spellId}`);
  }

  spellPrepare(spellId: string) {
    return this.page.getByTestId(`spellbook-prepare-${spellId}`);
  }

  spellRemove(spellId: string) {
    return this.page.getByTestId(`spellbook-remove-${spellId}`);
  }

  filterLevel(level: number) {
    return this.page.getByTestId(`spellbook-filter-level-${level}`);
  }

  learnableSpell(spellId: string) {
    return this.page.getByTestId(`spellbook-learnable-${spellId}`);
  }

  learnSpellButton(spellId: string) {
    return this.page.getByTestId(`spellbook-learn-${spellId}`);
  }
}
