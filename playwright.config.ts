import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a production build of one target at a time:
 *
 *   E2E_TARGET=server  -> `next start` (what Vercel runs)
 *   E2E_TARGET=static  -> `wrangler dev` (static export + Worker in the Workers runtime)
 *
 * Build the matching target first; `pnpm test:e2e:server` and
 * `pnpm test:e2e:static` do both steps.
 */
const target = process.env.E2E_TARGET === "static" ? "static" : "server";
const port = target === "static" ? 8788 : 3100;
const baseURL = `http://127.0.0.1:${port}`;

/** Local receiver that stands in for the leads webhook (see tests/e2e/global-setup.ts). */
export const WEBHOOK_PORT = 4010;
const webhookUrl = `http://127.0.0.1:${WEBHOOK_PORT}/hook`;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer:
    target === "static"
      ? {
          command: `pnpm exec wrangler dev --port ${port} --ip 127.0.0.1 --var LEADS_WEBHOOK_URL:${webhookUrl}`,
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        }
      : {
          command: `pnpm exec next start --port ${port}`,
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: { LEADS_WEBHOOK_URL: webhookUrl },
        },
});
