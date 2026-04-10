import { test, expect } from "@playwright/test";
import { createTestNpc, deleteTestNpc } from "./helpers/test-npc";

/**
 * Regression test for the dashboard NPC widget filter:
 * NPCs with is_visible_to_players = false must NOT appear on the player dashboard.
 * Previously the dashboard query was unscoped and leaked hidden NPCs to players.
 */

const VISIBLE_NPC_NAME = `QA-Visible-NPC-${Date.now()}`;
const HIDDEN_NPC_NAME = `QA-Hidden-NPC-${Date.now()}`;

let visibleId: string;
let hiddenId: string;

test.beforeAll(async ({ request }) => {
  // Create the hidden NPC first so it has an older created_at than the visible one.
  // The dashboard orders by created_at DESC and limits to 5, so both should appear
  // in the window if unfiltered. We want the hidden one to be within that window.
  hiddenId = await createTestNpc(request, {
    name: HIDDEN_NPC_NAME,
    is_visible_to_players: false,
    description: "This NPC must not be shown to players",
  });
  visibleId = await createTestNpc(request, {
    name: VISIBLE_NPC_NAME,
    is_visible_to_players: true,
    description: "This NPC is visible to players",
  });
});

test.afterAll(async ({ request }) => {
  if (visibleId) await deleteTestNpc(request, visibleId);
  if (hiddenId) await deleteTestNpc(request, hiddenId);
});

test.describe("Dashboard — NPC visibility filter", () => {
  test("hides NPCs with is_visible_to_players=false from the player dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.getByTestId("dashboard-page").waitFor({ timeout: 15000 });

    const widget = page.getByTestId("dashboard-latest-npcs");
    await expect(widget).toBeVisible({ timeout: 10000 });

    // Visible NPC must be rendered
    await expect(page.getByTestId(`dashboard-npc-${visibleId}`)).toBeVisible();
    await expect(widget).toContainText(VISIBLE_NPC_NAME);

    // Hidden NPC must NOT be rendered — neither as a data-testid entry nor in text
    await expect(page.getByTestId(`dashboard-npc-${hiddenId}`)).toHaveCount(0);
    await expect(widget).not.toContainText(HIDDEN_NPC_NAME);
  });
});
