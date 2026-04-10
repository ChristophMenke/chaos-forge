import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load .env.local so tests can access GM_PIN, SUPABASE keys etc.
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 3,
  reporter: process.env.CI ? [["github"], ["html"]] : "html",
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    // Auth setup — runs once, saves storage state for authenticated tests
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    // Authenticated tests — pre-loaded session cookies, parallel-safe
    {
      name: "chromium",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      testMatch: [
        "regression.spec.ts",
        "responsive-a11y.spec.ts",
        "share-dialog.spec.ts",
        "rulebook-chat.spec.ts",
        "party.spec.ts",
        "dashboard.spec.ts",
        "dashboard-npc-visibility.spec.ts",
        "xp-management.spec.ts",
        "master.spec.ts",
        "notifications.spec.ts",
        "magic-items.spec.ts",
      ],
    },
    // Mobile tests — use Pixel 5 (Chromium-based) for reliable mobile viewport in CI
    {
      name: "mobile",
      dependencies: ["setup"],
      use: {
        ...devices["Pixel 5"],
        storageState: "e2e/.auth/user.json",
      },
      testMatch: ["mobile.spec.ts"],
    },
    // Unauthenticated tests — no storage state, but wait for setup (webserver)
    {
      name: "chromium-noauth",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
      testMatch: [
        "smoke.spec.ts",
        "landing.spec.ts",
        "not-found.spec.ts",
        "accessibility.spec.ts",
        "auth-redirect.spec.ts",
        "login.spec.ts",
        "layout.spec.ts",
      ],
    },
  ],
  webServer: {
    command: process.env.CI_USE_BUILD ? "npx next start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
