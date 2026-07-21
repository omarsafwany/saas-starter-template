import { defineConfig, devices } from "@playwright/test";
import { BACKEND_URL, E2E_DATABASE_URL, FRONTEND_URL } from "./e2e/env.js";

/**
 * PERPRO-22: full-stack E2E config. Boots the real backend (tsx watch, incl.
 * pg-boss) and the real Vite dev server against an isolated "e2e" Postgres
 * schema (see e2e/env.ts), then drives both through a real Chromium browser.
 *
 * CI trade-off (documented per the ticket's acceptance criteria): this is
 * NOT wired into the existing CI workflow (.github/workflows/ci.yml). A
 * full-stack run here means two Node servers + Postgres migrations + a real
 * browser, which is a meaningfully heavier and slower job than the existing
 * Vitest/Supertest CI step, and would need its own Postgres service
 * container, dedicated timeout budget, and flake-retry story to be a good
 * CI citizen. For now `npm run test:e2e` is a manual/pre-release check
 * (see root README); revisit wiring it into CI as a separate, opt-in job
 * once the suite has proven itself stable locally.
 */
export default defineConfig({
  testDir: "./e2e",
  // Mirrors backend/vitest.config.ts's fileParallelism:false: every spec
  // here shares one real backend server and one real Postgres schema, so
  // multiple parallel workers would just race each other for no benefit.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 30_000,
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: FRONTEND_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run dev",
      cwd: "../backend",
      url: `${BACKEND_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        DATABASE_URL: E2E_DATABASE_URL,
        BETTER_AUTH_URL: BACKEND_URL,
        FRONTEND_URL,
        PORT: "4000",
      },
    },
    {
      command: "npm run dev -- --port 5173 --strictPort",
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
