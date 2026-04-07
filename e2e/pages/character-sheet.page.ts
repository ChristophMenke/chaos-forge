import type { Page, Locator } from "@playwright/test";

export class CharacterSheetPage {
  readonly page: Page;
  readonly container: Locator;
  readonly name: Locator;
  readonly classBadge: Locator;
  readonly levelBadge: Locator;
  readonly multiclassBadge: Locator;
  readonly avatarUploadTrigger: Locator;
  readonly avatarImage: Locator;
  readonly avatarInitials: Locator;
  readonly avatarUploadModal: Locator;
  readonly avatarFileInput: Locator;
  readonly shareButton: Locator;
  readonly printButton: Locator;
  readonly saveButton: Locator;
  readonly deleteButton: Locator;
  readonly tabs: Locator;

  // Stats tab
  readonly personalDetailsSection: Locator;
  readonly playerNameInput: Locator;
  readonly ageInput: Locator;
  readonly genderInput: Locator;

  // Thief skills tab
  readonly thiefSkillsTab: Locator;
  readonly thiefPickLocks: Locator;
  readonly thiefFindTraps: Locator;

  // Equipment tab
  readonly equipmentTab: Locator;
  readonly addItemButton: Locator;
  readonly addItemDialog: Locator;
  readonly equipmentSearch: Locator;
  readonly addInventoryButton: Locator;

  // Spells tab
  readonly spellsTab: Locator;
  readonly learnSpellButton: Locator;
  readonly spellPointsTotal: Locator;

  // Proficiencies tab
  readonly proficienciesTab: Locator;
  readonly weaponNameInput: Locator;
  readonly weaponAddButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId("character-sheet");
    this.name = page.getByTestId("sheet-name");
    this.classBadge = page.getByTestId("sheet-class-badge");
    this.levelBadge = page.getByTestId("sheet-level-badge");
    this.multiclassBadge = page.getByTestId("sheet-multiclass-badge");
    this.avatarUploadTrigger = page.getByTestId("avatar-upload-trigger");
    this.avatarImage = page.getByTestId("avatar-image");
    this.avatarInitials = page.getByTestId("avatar-initials");
    this.avatarUploadModal = page.getByTestId("avatar-upload-modal");
    this.avatarFileInput = page.getByTestId("avatar-file-input");
    this.shareButton = page.getByTestId("sheet-share-button");
    this.printButton = page.getByTestId("sheet-print-button");
    this.saveButton = page.getByTestId("sheet-save-button");
    this.deleteButton = page.getByTestId("sheet-delete-button");
    this.tabs = page.getByTestId("sheet-tabs");

    // Stats
    this.personalDetailsSection = page.getByTestId("personal-details-section");
    this.playerNameInput = page.getByTestId("sheet-player-name");
    this.ageInput = page.getByTestId("sheet-age");
    this.genderInput = page.getByTestId("sheet-gender");

    // Thief skills
    this.thiefSkillsTab = page.getByTestId("sheet-tabs").locator('[value="thief-skills"]');
    this.thiefPickLocks = page.getByTestId("thief-input-pickLocks");
    this.thiefFindTraps = page.getByTestId("thief-input-findTraps");

    // Equipment
    this.equipmentTab = page.getByTestId("sheet-tabs").locator('[value="equipment"]');
    this.addItemButton = page.getByTestId("add-item-btn");
    this.addItemDialog = page.getByTestId("add-item-dialog");
    this.equipmentSearch = page.getByTestId("equipment-search");
    this.addInventoryButton = page.getByTestId("add-inventory-btn");

    // Spells
    this.spellsTab = page.getByTestId("sheet-tabs").locator('[value="spells"]');
    this.learnSpellButton = page.getByTestId("learn-spell-button");
    this.spellPointsTotal = page.getByTestId("spell-points-total");

    // Proficiencies
    this.proficienciesTab = page.getByTestId("sheet-tabs").locator('[value="proficiencies"]');
    this.weaponNameInput = page.getByTestId("weapon-name-input");
    this.weaponAddButton = page.getByTestId("weapon-add-button");
  }

  async goto(characterId: string) {
    await this.page.goto(`/characters/${characterId}/manage`);
    await this.container.waitFor({ timeout: 15000 });
  }

  async switchTab(
    tab: "stats" | "combat" | "notes" | "equipment" | "spells" | "thief-skills" | "proficiencies"
  ) {
    await this.page.getByTestId(`tab-trigger-${tab}`).click();
    await this.page.getByTestId(`tab-${tab}`).waitFor({ state: "visible", timeout: 5000 });
  }

  async save() {
    await this.saveButton.click();
    // Wait for save to complete by watching for the save response
    await this.page
      .waitForResponse(
        (resp) => resp.url().includes("/characters/") && resp.request().method() === "PUT",
        { timeout: 10000 }
      )
      .catch(() => {
        /* save may have already completed */
      });
  }
}
