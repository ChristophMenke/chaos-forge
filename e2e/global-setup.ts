import type { FullConfig } from "@playwright/test";

/**
 * Global setup: waits for the dev server to be ready.
 * Test characters are NO LONGER seeded here — each test creates its own data.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3000";

  // Wait for the server to be ready
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${baseURL}/login`);
      if (res.ok) break;
    } catch {
      // server not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}
