#!/usr/bin/env node
/**
 * Builds one target with a fully configured site, then runs the Playwright
 * suite against it:
 *
 *   node scripts/e2e.mjs server   # next build + next start
 *   node scripts/e2e.mjs static   # static export + wrangler dev
 *
 * Extra arguments go to Playwright, for example `-- --project desktop -g contact`.
 * Set E2E_SKIP_BUILD=1 to reuse the previous build.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { isolatedSiteEnv } from "./lib/site-env.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);

const [target, ...rest] = process.argv.slice(2);
if (target !== "server" && target !== "static") {
  console.error("Usage: node scripts/e2e.mjs <server|static> [-- playwright args]");
  process.exit(1);
}
const playwrightArgs = rest[0] === "--" ? rest.slice(1) : rest;

/**
 * Every optional setting is filled in so the tests exercise the UI that only
 * appears when a value is present. The values are fictional, and they are the
 * only site settings the build sees: `.env` and `.env.local` do not apply.
 */
const siteEnv = {
  SITE_URL: "https://www.example.com",
  SITE_COMPANY_NAME: "Example Labs",
  SITE_COMPANY_LEGAL_NAME: "Example Labs, Inc.",
  SITE_COMPANY_ADDRESS: "100 Example Street, Suite 200 | San Francisco, CA 94105 | United States",
  SITE_COMPANY_FOUNDED: "2026",
  SITE_COMPANY_REGISTRATION: "Company No. 00000000",
  SITE_CONTACT_EMAIL: "hello@example.com",
  SITE_SALES_EMAIL: "sales@example.com",
  SITE_SUPPORT_EMAIL: "support@example.com",
  SITE_SECURITY_EMAIL: "security@example.com",
  SITE_PRIVACY_EMAIL: "privacy@example.com",
  SITE_CONTACT_PHONE: "+1 415 555 0100",
  SITE_BOOKING_URL: "https://cal.example.com/intro",
  SITE_SOCIAL_X: "https://x.com/example",
  SITE_SOCIAL_LINKEDIN: "https://www.linkedin.com/company/example",
  SITE_SOCIAL_GITHUB: "https://github.com/example",
  SITE_STATUS_URL: "https://status.example.com",
  SITE_CAREERS_URL: "https://jobs.example.com",
  SITE_ANNOUNCEMENT_TEXT: "Now onboarding early-access teams",
  SITE_ANNOUNCEMENT_HREF: "/early-access",
  SITE_LEGAL_EFFECTIVE_DATE: "2026-11-01",
  SITE_LEGAL_JURISDICTION: "the State of Delaware, United States",
  SITE_COMPLIANCE_SOC2: "in-progress",
  SITE_CUSTOMERS: JSON.stringify(["Initech", "Globex", "Hooli", "Umbrella"]),
  SITE_TESTIMONIALS: JSON.stringify([
    {
      quote: "Sample testimonial used by the automated tests.",
      name: "Test Person",
      title: "Head of Platform",
      company: "Initech",
    },
  ]),
  SITE_TEAM: JSON.stringify([
    { name: "Test Founder", role: "Co-founder & CEO", url: "https://www.linkedin.com/in/example" },
    { name: "Test Engineer", role: "Co-founder & CTO" },
  ]),
  SITE_BACKERS: JSON.stringify(["Example Ventures"]),
  SITE_STATS: JSON.stringify([{ value: "12", label: "design partners" }]),
};

function run(command, args, env) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const env = { ...isolatedSiteEnv(siteEnv), BUILD_TARGET: target, E2E_TARGET: target };

if (!process.env.E2E_SKIP_BUILD) {
  run(process.execPath, [require.resolve("next/dist/bin/next"), "build"], env);
}
run(process.execPath, [require.resolve("@playwright/test/cli"), "test", ...playwrightArgs], env);
