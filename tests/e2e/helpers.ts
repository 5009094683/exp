import { expect, type Page, type TestInfo } from "@playwright/test";
import { WEBHOOK_PORT } from "../../playwright.config";

/** A unique address per test so parallel runs can find their own webhook delivery. */
export function uniqueEmail(testInfo: TestInfo): string {
  const slug = `${testInfo.project.name}-${testInfo.title}`
    .replace(/[^a-z0-9]+/gi, "-")
    .slice(0, 40);
  return `e2e-${slug}-${Date.now()}@example.com`.toLowerCase();
}

type Delivery = {
  event: string;
  kind: string;
  source: string;
  page: string;
  fields: Record<string, string>;
};

/** Waits for the local webhook receiver to get the request sent with `email`. */
export async function expectDelivery(email: string): Promise<Delivery> {
  let found: Delivery | undefined;
  await expect
    .poll(
      async () => {
        const response = await fetch(`http://127.0.0.1:${WEBHOOK_PORT}/received`);
        const deliveries = (await response.json()) as Delivery[];
        found = deliveries.find((delivery) => delivery?.fields?.email === email);
        return Boolean(found);
      },
      { message: `webhook delivery for ${email}`, timeout: 10_000 },
    )
    .toBe(true);
  return found!;
}

/** Forms ignore submissions that arrive faster than a person could type them. */
export async function waitForFillTimer(page: Page) {
  await page.waitForTimeout(1700);
}

/** Collects console errors and failed requests so a test can assert the page was clean. */
export function trackPageProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`error: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400) problems.push(`${response.status()} ${response.url()}`);
  });
  return problems;
}
