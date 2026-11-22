import { expect, test, type Page } from "@playwright/test";
import { expectDelivery, trackPageProblems, uniqueEmail, waitForFillTimer } from "./helpers";

const SECTIONS: Array<{ link: string; path: string; heading: string }> = [
  { link: "Agents", path: "/console/agents", heading: "Agents" },
  { link: "Runs", path: "/console/runs", heading: "Runs" },
  { link: "Memory", path: "/console/memory", heading: "Memory" },
  { link: "Integrations", path: "/console/integrations", heading: "Integrations" },
  { link: "Sandboxes", path: "/console/sandboxes", heading: "Sandboxes" },
  { link: "Policies", path: "/console/policies", heading: "Policies" },
  { link: "Audit log", path: "/console/audit", heading: "Audit log" },
  { link: "Usage", path: "/console/usage", heading: "Usage" },
  { link: "Settings", path: "/console/settings", heading: "Settings" },
  { link: "Overview", path: "/console", heading: "Overview" },
];

/** The dialog that replaces an action the demo workspace cannot perform. */
async function expectGate(page: Page, title: string) {
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: title })).toBeVisible();
  await expect(dialog.getByLabel("Work email")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
}

test.describe("demo console", () => {
  test("says it is a demo and every section opens from the navigation", async ({
    page,
    isMobile,
  }) => {
    const problems = trackPageProblems(page);
    await page.goto("/console");
    await expect(page.getByText("You are exploring a demo workspace.")).toBeVisible();

    for (const section of SECTIONS) {
      if (isMobile) await page.getByRole("button", { name: "Open navigation" }).click();
      await page
        .getByRole("navigation", { name: "Console" })
        .getByRole("link", { name: section.link, exact: true })
        .click();

      await expect(page).toHaveURL(new RegExp(`${section.path}$`));
      await expect(page.getByRole("heading", { level: 1, name: section.heading })).toBeVisible();
      if (isMobile) await expect(page.getByRole("dialog")).toBeHidden();
    }

    expect(problems).toEqual([]);
  });

  test("a run can be followed step by step", async ({ page }) => {
    await page.goto("/console/runs");
    await page.getByPlaceholder("Search by run ID, agent or outcome").fill("Refunded");
    await page.locator("tbody tr").first().getByRole("link").click();

    await expect(page).toHaveURL(/\/console\/runs\/run_[0-9a-z]{12}$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Payment Risk Screener" }),
    ).toBeVisible();
    await expect(page.getByText("Refunded $1,840.00 as likely fraud")).toBeVisible();

    // The approval names the policy that asked for it and the person who decided.
    await page.getByRole("button", { name: /Finance approval/ }).click();
    await expect(page.getByText("payments-over-1000").first()).toBeVisible();
    await expect(page.getByText("Marcus Tan").first()).toBeVisible();

    await page.getByRole("button", { name: /Create refund/ }).click();
    await expect(page.getByText('"fraudulent"')).toBeVisible();
  });

  test("lists can be filtered, searched and reset", async ({ page }) => {
    await page.goto("/console/runs");
    const rows = page.locator("tbody tr");
    const total = await rows.count();

    await page.getByRole("button", { name: /^Failed/ }).click();
    const failed = await rows.count();
    expect(failed).toBeGreaterThan(0);
    expect(failed).toBeLessThan(total);
    for (const text of await rows.allInnerTexts()) expect(text).toContain("Failed");

    await page.getByPlaceholder("Search by run ID, agent or outcome").fill("no such run");
    await expect(page.getByText("No runs match")).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(rows).toHaveCount(total);
  });

  test("the runs list is prerendered and honors a status in the URL", async ({ page, request }) => {
    const html = await (await request.get("/console/runs")).text();
    expect(html).toMatch(/run_[0-9a-z]{12}/);

    await page.goto("/console/runs?status=failed");
    await expect(page.getByRole("button", { name: /^Failed/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const rows = await page.locator("tbody tr").allInnerTexts();
    expect(rows.length).toBeGreaterThan(0);
    for (const text of rows) expect(text).toContain("Failed");
  });

  test("the audit log pages through events and shows how they are chained", async ({ page }) => {
    await page.goto("/console/audit");
    await expect(page.getByText("Chain verified")).toBeVisible();
    await expect(page.getByText(/^1–20 of \d+ sample events$/)).toBeVisible();

    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.getByText(/^21–40 of \d+ sample events$/)).toBeVisible();

    await page.getByRole("button", { name: "People" }).click();
    await expect(page.getByText(/^1–\d+ of \d+ sample events$/)).toBeVisible();

    await page.locator("tbody tr").first().getByRole("button").first().click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Hash chain")).toBeVisible();
    await expect(sheet.getByText(/^[0-9a-f]{64}$/).first()).toBeVisible();
  });

  test("the new agent form builds a manifest", async ({ page }) => {
    await page.goto("/console/agents/new");
    const next = page.getByRole("button", { name: "Continue" });

    await page.getByLabel("Name").fill("");
    await next.click();
    await expect(page.getByText("Give the agent a name.")).toBeVisible();

    await page.getByLabel("Name").fill("Refund checker");
    for (let step = 0; step < 4; step += 1) await next.click();

    const manifest = page.locator("figure").filter({ hasText: "agent manifest" });
    await expect(manifest).toContainText("name: refund-checker");
    await expect(manifest).toContainText("- zendesk.get_ticket");
    await expect(manifest).toContainText("- least-privilege");
  });

  test("dates follow the visitor's clock, not the build", async ({ page }) => {
    const problems = trackPageProblems(page);
    await page.clock.install({ time: new Date("2031-03-18T10:15:00Z") });

    await page.goto("/console/usage");
    await expect(
      page.getByText("Billing period Mar 1 to Mar 31, 2031. Day 18 of 31."),
    ).toBeVisible();

    expect(problems).toEqual([]);
  });
});

test.describe("actions that need a real workspace", () => {
  test("deploying an agent", async ({ page }) => {
    await page.goto("/console/agents/new");
    for (let step = 0; step < 4; step += 1) {
      await page.getByRole("button", { name: "Continue" }).click();
    }
    await page.getByRole("button", { name: "Deploy agent" }).click();
    await expectGate(page, "Deploy your own agents");
  });

  test("connecting an MCP server", async ({ page }) => {
    await page.goto("/console/integrations");
    await page.getByRole("button", { name: "Connect server" }).click();
    await expectGate(page, "Connect your MCP servers");
  });

  test("saving a policy", async ({ page }) => {
    await page.goto("/console/policies");
    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByRole("button", { name: "Save policy" }).click();
    await expectGate(page, "Enforce your own policies");
  });

  test("creating an API key", async ({ page }) => {
    await page.goto("/console/settings/api-keys");
    await page.getByRole("button", { name: "Create API key" }).click();
    await expectGate(page, "Create API keys");
  });

  test("inviting a member", async ({ page }) => {
    await page.goto("/console/settings/members");
    await page.getByRole("button", { name: "Invite member" }).click();
    await expectGate(page, "Invite your team");
  });

  test("exporting audit logs", async ({ page }) => {
    await page.goto("/console/audit");
    await page.getByRole("button", { name: "Export" }).click();
    await page.getByRole("menuitem").first().click();
    await expectGate(page, "Export audit logs");
  });

  test("signing in", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel("Work email").fill("jane@initech.com");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expectGate(page, "AgentOS is invite-only for now");
  });

  test("a request sent from a gate records where it came from", async ({ page }, testInfo) => {
    const email = uniqueEmail(testInfo);

    await page.goto("/console/integrations");
    await page.getByRole("button", { name: "Connect server" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Work email").fill(email);
    await dialog.getByLabel("Full name").fill("Jane Doe");
    await dialog.getByLabel("Company", { exact: true }).fill("Initech");
    await waitForFillTimer(page);
    await dialog.getByRole("button", { name: "Request access" }).click();
    await expect(dialog.getByRole("heading", { name: "Request received" })).toBeVisible();

    const delivery = await expectDelivery(email);
    expect(delivery).toMatchObject({
      kind: "early-access",
      source: "console:connect-mcp",
      page: "/console/integrations",
    });

    // Other gates now confirm the request instead of asking again.
    await page.keyboard.press("Escape");
    await page.goto("/console/settings/members");
    await page.getByRole("button", { name: "Invite member" }).click();
    await expect(dialog.getByRole("heading", { name: "Request received" })).toBeVisible();
  });
});
