import type { Page, APIRequestContext } from "@playwright/test";

const TEST_EMAIL = "christoph@chaos-forge.de";
const SUPABASE_PROJECT_REF = "ptozyrwvbngascgydjjt";

/**
 * Login via test-login API and set Supabase session cookies.
 * Supabase SSR stores auth tokens in cookies (not localStorage).
 */
export async function loginAsTestUser(page: Page) {
  return loginAsUser(page, TEST_EMAIL);
}

/**
 * Login as any @chaos-forge.de test user.
 * Creates the user if it doesn't exist yet.
 */
export async function loginAsUser(page: Page, email: string) {
  // Step 1: Get tokens from test-login API
  const resp = await page.request.post("/api/test-login", {
    data: { email },
  });

  if (!resp.ok()) {
    throw new Error(`Test login API failed: ${resp.status()}`);
  }

  const { access_token, refresh_token } = await resp.json();

  if (!access_token) {
    throw new Error("No access_token in test-login response");
  }

  // Step 2: Build the session JSON that Supabase expects
  const sessionData = JSON.stringify({
    access_token,
    refresh_token,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  });

  // Step 3: Set cookies in Playwright browser context
  // Supabase SSR stores session in chunked cookies: sb-{ref}-auth-token.0, .1, etc.
  // For sessions < 3500 chars, a single cookie suffices
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

  // Also set in localStorage via addInitScript (some Supabase client code reads from there)
  await page.context().addInitScript(
    ({ session, projectRef }) => {
      window.localStorage.setItem(`sb-${projectRef}-auth-token`, session);
    },
    { session: sessionData, projectRef: SUPABASE_PROJECT_REF }
  );

  // Step 4: Navigate to protected page and verify session
  await page.goto("/characters");
  await page
    .getByTestId("active-characters-grid")
    .waitFor({ state: "visible", timeout: 15000 })
    .catch(() => {});

  if (page.url().includes("/login")) {
    throw new Error("Login failed — cookies did not establish session");
  }
}

/**
 * Create a test user via the test-login API (also logs them in to verify).
 * Returns the user_id.
 */
export async function createTestUser(request: APIRequestContext, email: string): Promise<string> {
  const resp = await request.post("/api/test-login", {
    data: { email },
  });

  if (!resp.ok()) {
    throw new Error(`Failed to create test user ${email}: ${resp.status()}`);
  }

  const { user_id } = await resp.json();
  return user_id;
}

/**
 * Delete a test user via the test-cleanup API.
 * Only works for @chaos-forge.de emails (safety guard).
 */
export async function deleteTestUser(request: APIRequestContext, email: string): Promise<void> {
  const resp = await request.post("/api/test-cleanup", {
    data: { email },
  });

  if (!resp.ok()) {
    console.warn(`Failed to clean up test user ${email}: ${resp.status()}`);
  }
}
