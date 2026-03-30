import { test as setup, expect } from "@playwright/test";

const SUPABASE_PROJECT_REF = "ptozyrwvbngascgydjjt";
const TEST_EMAIL = "christoph@chaos-forge.de";

export const AUTH_FILE = "e2e/.auth/user.json";

/**
 * Runs once before all test files.
 * Authenticates via test-login API and saves browser state (cookies + localStorage)
 * so that parallel workers can reuse the same session without repeated API calls.
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

  // Verify the session works
  await page.goto("/characters");
  await page.waitForTimeout(3000);
  expect(page.url()).not.toContain("/login");

  // Save state for all workers to reuse
  await page.context().storageState({ path: AUTH_FILE });
});
