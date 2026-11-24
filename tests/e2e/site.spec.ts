import { expect, test } from "@playwright/test";
import { securityHeaders } from "../../src/config/headers";
import { trackPageProblems } from "./helpers";

/** Details the e2e build is configured with (see scripts/e2e.mjs). */
const SITE_URL = "https://www.example.com";
const PHONE = "+1 415 555 0100";
const PHONE_HREF = "tel:+14155550100";
const ADDRESS_LINES = ["100 Example Street, Suite 200", "San Francisco, CA 94105", "United States"];

test.describe("navigation", () => {
  test("the desktop menu leads to a capability page", async ({ page, isMobile }) => {
    test.skip(isMobile, "Phones use the menu sheet instead.");

    await page.goto("/");
    await page.getByRole("button", { name: "Platform" }).click();
    await page
      .getByRole("link", { name: /^Memory\b/ })
      .first()
      .click();

    await expect(page).toHaveURL(/\/platform\/memory$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Memory");
  });

  test("the phone menu opens, navigates and closes", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Desktop uses the dropdown menu instead.");

    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog");
    await expect(menu.getByRole("link", { name: "Orchestration" })).toBeVisible();

    await menu.getByRole("link", { name: "Pricing" }).click();
    await expect(page).toHaveURL(/\/pricing$/);
    await expect(menu).toBeHidden();
  });

  test("unknown paths get a helpful 404 page", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page
      .getByRole("link", { name: /Documentation/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/docs$/);
  });
});

test.describe("pricing estimator", () => {
  test("recalculates from the public price list", async ({ page }) => {
    const problems = trackPageProblems(page);
    await page.goto("/pricing");
    const result = page.locator('[aria-live="polite"]').filter({ hasText: "plan" }).first();

    // 40 agents on Business: 40 x $39 + 40,000 extra executions x $4/1,000 + 500 x $0.08.
    await expect(result).toContainText("Business plan");
    await expect(result).toContainText("$1,760");

    // 10 agents on Team: 10 x $49 + 35,000 extra executions x $4/1,000 + 500 x $0.08.
    await page.getByLabel("Agents", { exact: true }).fill("10");
    await expect(result).toContainText("Team plan");
    await expect(result).toContainText("$670");

    expect(problems).toEqual([]);
  });

  test("hands fleets beyond the self-serve plans to sales", async ({ page }) => {
    await page.goto("/pricing");
    await page.getByLabel("Agents", { exact: true }).fill("300");

    const result = page.locator('[aria-live="polite"]').filter({ hasText: "Enterprise" });
    await expect(result.getByText("Let's size this together")).toBeVisible();
    await expect(result.getByRole("link", { name: "Talk to sales" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });
});

test.describe("documentation preview", () => {
  test("is labelled as a preview and can be read in order", async ({ page, isMobile }) => {
    await page.goto("/docs");
    await expect(page.getByText("Preview documentation.")).toBeVisible();

    await page.getByRole("link", { name: /^Next/ }).click();
    await expect(page).toHaveURL(/\/docs\/concepts$/);
    await expect(page.getByRole("heading", { level: 1, name: "Core concepts" })).toBeVisible();

    if (isMobile) await page.locator("summary").click();
    await page
      .getByRole("navigation", { name: "Documentation" })
      .getByRole("link", { name: "API overview" })
      .click();
    await expect(page).toHaveURL(/\/docs\/api$/);
    await expect(page.getByRole("heading", { level: 2, name: "Authentication" })).toBeVisible();
    await expect(page.getByText("https://api.example.com/v1").first()).toBeVisible();
  });

  test("offers early access instead of an install command", async ({ page }) => {
    await page.goto("/docs/agents");
    await page.getByLabel("About this documentation").getByRole("link").click();
    await expect(
      page.getByRole("dialog").getByRole("heading", { name: "Request early access" }),
    ).toBeVisible();
  });
});

test.describe("configured details", () => {
  test("appear in the announcement bar, the footer and the contact page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Now onboarding early-access teams")).toBeVisible();
    await expect(page.getByText("Initech").first()).toBeVisible();

    const footer = page.getByRole("contentinfo");
    await expect(footer).toContainText(/Example Labs, Inc\. All rights reserved\./);
    await expect(footer).toContainText(
      "100 Example Street, Suite 200, San Francisco, CA 94105, United States",
    );
    await expect(footer).toContainText("Company No. 00000000");
    await expect(footer.locator(`a[href="${PHONE_HREF}"]`)).toHaveText(PHONE);
    await expect(footer.locator('a[href="mailto:hello@example.com"]')).toBeVisible();
    await expect(footer.getByRole("link", { name: /on LinkedIn/ })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/company/example",
    );

    await page.goto("/contact");
    const main = page.getByRole("main");
    for (const address of ["sales@example.com", "support@example.com", "security@example.com"]) {
      await expect(main.locator(`a[href="mailto:${address}"]`).first()).toBeVisible();
    }
    await expect(main.locator(`a[href="${PHONE_HREF}"]`)).toContainText(PHONE);
    for (const line of ADDRESS_LINES) {
      await expect(main.getByText(line, { exact: true })).toBeVisible();
    }
  });

  test("fill in the company, security and legal pages", async ({ page }) => {
    await page.goto("/company");
    await expect(page.getByText("Test Founder")).toBeVisible();
    await expect(page.getByText("Example Ventures")).toBeVisible();

    const facts = page.getByRole("main").locator("dl").filter({ hasText: "Legal name" });
    await expect(facts).toContainText("Example Labs, Inc.");
    await expect(facts).toContainText(ADDRESS_LINES.join(", "));
    await expect(facts.locator(`a[href="${PHONE_HREF}"]`)).toHaveText(PHONE);

    await page.goto("/security");
    await expect(page.getByText("In progress").first()).toBeVisible();

    await page.goto("/legal/terms");
    await expect(page.getByText("Effective November 1, 2026")).toBeVisible();
    await expect(page.getByRole("main")).toContainText(
      "governed by the laws of the State of Delaware, United States",
    );

    await page.goto("/legal/privacy");
    await expect(
      page.getByRole("main").locator('a[href="mailto:privacy@example.com"]').first(),
    ).toBeVisible();
  });
});

test.describe("search engines and sharing", () => {
  test("pages describe themselves", async ({ page }) => {
    await page.goto("/pricing");
    const content = (selector: string) => page.locator(selector).getAttribute("content");

    await expect(page).toHaveTitle("Pricing — AgentOS");
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe(
      `${SITE_URL}/pricing`,
    );
    expect(await content('meta[property="og:title"]')).toBe("Pricing — AgentOS");
    expect(await content('meta[property="og:url"]')).toBe(`${SITE_URL}/pricing`);
    expect(await content('meta[property="og:image"]')).toBe(`${SITE_URL}/og.png`);
    expect(await content('meta[name="twitter:card"]')).toBe("summary_large_image");
    expect(await content('meta[name="twitter:site"]')).toBe("@example");
    expect(await page.locator('link[rel="icon"]').first().getAttribute("href")).toBe(
      "/favicon.svg",
    );
  });

  test("structured data names the organization", async ({ page }) => {
    await page.goto("/");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const graphs = blocks.map((block) => JSON.parse(block) as Record<string, unknown>);

    const site = graphs.find((graph) => Array.isArray(graph["@graph"]));
    const [organization, website] = site!["@graph"] as Array<Record<string, unknown>>;
    expect(organization).toMatchObject({
      "@type": "Organization",
      name: "Example Labs",
      legalName: "Example Labs, Inc.",
      url: SITE_URL,
      email: "hello@example.com",
    });
    expect(organization.sameAs).toContain("https://github.com/example");
    expect(website).toMatchObject({ "@type": "WebSite", url: SITE_URL });
    expect(graphs.some((graph) => graph["@type"] === "FAQPage")).toBe(true);
  });

  test("robots.txt, the sitemap and security.txt are generated", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
    expect(robots).toContain("Disallow: /api/");

    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain(`<loc>${SITE_URL}</loc>`);
    expect(sitemap).toContain(`<loc>${SITE_URL}/platform/audit-logs</loc>`);
    expect(sitemap).toContain(`<loc>${SITE_URL}/docs/api</loc>`);
    expect(sitemap).not.toContain("/console");
    expect(sitemap).not.toContain("/signin");

    const security = await (await request.get("/.well-known/security.txt")).text();
    expect(security).toContain("Contact: mailto:security@example.com");
    const expires = Date.parse(/^Expires: (.+)$/m.exec(security)![1]);
    expect(expires).toBeGreaterThan(Date.now());
  });

  test("the social card, icons and manifest are served", async ({ request }) => {
    const card = await request.get("/og.png");
    expect(card.headers()["content-type"]).toBe("image/png");
    expect((await card.body()).byteLength).toBeGreaterThan(20_000);

    const favicon = await request.get("/favicon.svg");
    expect(favicon.headers()["content-type"]).toContain("image/svg+xml");
    expect(await favicon.text()).toContain("<svg");

    const manifest = (await (await request.get("/manifest.webmanifest")).json()) as {
      name: string;
      icons: Array<{ src: string }>;
    };
    expect(manifest.name).toBe("AgentOS");
    for (const icon of manifest.icons) {
      expect((await request.get(icon.src)).status(), icon.src).toBe(200);
    }
    expect((await request.get("/app-icon-180.png")).status()).toBe(200);
  });
});

test.describe("security headers", () => {
  test("are sent with pages, the demo console and the 404 page", async ({ request }) => {
    for (const path of ["/", "/console", "/this-page-does-not-exist"]) {
      const headers = (await request.get(path)).headers();
      for (const header of securityHeaders()) {
        expect(headers[header.key.toLowerCase()], `${header.key} on ${path}`).toBe(header.value);
      }
    }
  });
});
