import { test as setup, expect } from "@playwright/test";
import { createTestCharacter, deleteTestCharacter } from "./helpers/test-character";

const SUPABASE_PROJECT_REF = "ptozyrwvbngascgydjjt";
const TEST_EMAIL = "QA-primary@qa.chaosforge.test";

export const AUTH_FILE = "e2e/.auth/user.json";

/**
 * Runs once before all test files.
 * Authenticates via test-login API and saves browser state (cookies + localStorage)
 * so that parallel workers can reuse the same session without repeated API calls.
 *
 * Creates a temporary character to verify the session works, then deletes it.
 */
setup("authenticate", async ({ page }) => {
  const resp = await page.request.post("/api/test-login", {
    data: { email: TEST_EMAIL },
  });
  expect(resp.ok(), "test-login API should succeed").toBeTruthy();

  const { access_token, refresh_token } = await resp.json();
  expect(access_token, "access_token should be present").toBeTruthy();

  const sessionData = JSON.stringify({
    access_token,
    refresh_token,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  });

  const cookieName = `sb-${SUPABASE_PROJECT_REF}-auth-token.0`;

  await page.context().addCookies([
    {
      name: cookieName,
      value: sessionData,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  // Create a temporary character to verify the session works
  const charId = await createTestCharacter(page.request, { name: "QA-AuthSetup" });

  // Verify the session works — characters page loads (not redirect to login)
  await page.goto("/characters");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
  await page.getByTestId("active-characters-grid").waitFor({ state: "visible", timeout: 15000 });

  // Save state for all workers to reuse, then clean up temp character
  try {
    await page.context().storageState({ path: AUTH_FILE });
  } finally {
    await deleteTestCharacter(page.request, charId);
  }
});
