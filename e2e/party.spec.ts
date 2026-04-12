import { test, expect } from "@playwright/test";
import { PartyPage } from "./pages/party.page";
import { createTestCharacter, deleteTestCharacter } from "./helpers/test-character";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const TEST_EMAIL = "QA-primary@qa.chaosforge.test";

let charId: string;

test.beforeAll(async ({ request }) => {
  charId = await createTestCharacter(request, {
    name: "QA-Party",
    race_id: "human",
    class_id: "fighter",
    level: 3,
    hp_current: 25,
    hp_max: 25,
    gold_gp: 500,
    gold_sp: 100,
  });
});

test.afterAll(async ({ request }) => {
  try {
    await fetch(`${BASE_URL}/api/test-party-cleanup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_EMAIL }),
    }).catch(() => {});
  } catch {
    /* server may be shutting down */
  }

  if (charId) await deleteTestCharacter(request, charId);
});

test.describe("Party Inventory Page", () => {
  test("shows party page with gold pool, items panel, and log", async ({ page }) => {
    test.setTimeout(30000);
    const party = new PartyPage(page);
    await party.goto();

    await expect(party.goldPanel).toBeVisible();
    await expect(party.itemsPanel).toBeVisible();
    await expect(party.logPanel).toBeVisible();

    await expect(party.goldPP).toBeVisible();
    await expect(party.goldGP).toBeVisible();
    await expect(party.goldSP).toBeVisible();
    await expect(party.goldCP).toBeVisible();

    await expect(party.addGoldBtn).toBeVisible();
    await expect(party.distributeGoldBtn).toBeVisible();
    await expect(party.itemsAddBtn).toBeVisible();
  });

  test("can add gold to the party pool", async ({ page }) => {
    test.setTimeout(30000);
    const party = new PartyPage(page);
    await party.goto();

    const gpBefore = await party.goldGP.textContent();

    await party.addGoldBtn.click();
    await expect(party.addGoldDialog).toBeVisible();

    await party.addGoldGP.fill("50");
    await party.addGoldConfirm.click();

    await expect(party.addGoldDialog).not.toBeVisible({ timeout: 5000 });

    const expectedGP = String(Number(gpBefore) + 50);
    await expect(party.goldGP).toHaveText(expectedGP, { timeout: 5000 });

    await page.reload();
    await party.container.waitFor({ timeout: 10000 });
    await expect(party.logEntries).toBeVisible({ timeout: 5000 });
  });

  test("can cancel add gold dialog", async ({ page }) => {
    test.setTimeout(20000);
    const party = new PartyPage(page);
    await party.goto();

    const gpBefore = await party.goldGP.textContent();

    await party.addGoldBtn.click();
    await expect(party.addGoldDialog).toBeVisible();

    await party.addGoldGP.fill("100");
    await party.addGoldCancel.click();

    await expect(party.addGoldDialog).not.toBeVisible();
    const gpAfter = await party.goldGP.textContent();
    expect(gpAfter).toBe(gpBefore);
  });

  test("navigation item exists and links to /party", async ({ page }) => {
    test.setTimeout(20000);
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 10000 });

    const navItem = page.getByTestId("nav-party");
    await expect(navItem).toBeVisible();
    await navItem.click();

    await expect(page).toHaveURL(/\/party/);
    await expect(page.getByTestId("party-page")).toBeVisible({ timeout: 10000 });
  });

  test("distribute gold dialog shows character dropdown", async ({ page }) => {
    test.setTimeout(30000);
    const party = new PartyPage(page);
    await party.goto();

    await party.distributeGoldBtn.click();
    await expect(party.distributeGoldDialog).toBeVisible();

    await expect(party.distributeGoldCharacter).toBeVisible();
    const options = party.distributeGoldCharacter.locator("option");
    const count = await options.count();
    expect(count).toBeGreaterThan(1);

    await party.distributeGoldCancel.click();
    await expect(party.distributeGoldDialog).not.toBeVisible();
  });
});
