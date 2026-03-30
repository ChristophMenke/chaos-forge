import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
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
      testMatch: ["regression.spec.ts", "responsive-a11y.spec.ts", "share-dialog.spec.ts"],
    },
    // Unauthenticated tests — no storage state
    {
      name: "chromium-noauth",
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
