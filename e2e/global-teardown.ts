import type { FullConfig } from "@playwright/test";

const TEST_EMAIL = "QA-primary@qa.chaosforge.test";
const SECONDARY_EMAIL = "QA-secondary@qa.chaosforge.test";

/**
 * Global teardown: removes test characters and the secondary test user
 * after all E2E tests have completed. Keeps the primary test user intact.
 */
export default async function globalTeardown(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3000";

  // Delete test characters owned by the primary test user
  try {
    const resp = await fetch(`${baseURL}/api/test-seed-cleanup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_EMAIL }),
    });
    if (resp.ok) {
      const data = await resp.json();
      console.log(`✓ Test cleanup: ${data.deleted ?? 0} characters removed`);
    } else {
      console.warn(`⚠ Test cleanup failed (${resp.status})`);
    }
  } catch {
    console.warn("⚠ Test cleanup: server not reachable");
  }

  // Delete the secondary test user (e2e-other)
  try {
    await fetch(`${baseURL}/api/test-cleanup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: SECONDARY_EMAIL }),
    });
  } catch {
    // ignore — server might already be shut down
  }
}
