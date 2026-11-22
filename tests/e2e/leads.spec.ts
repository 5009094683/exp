import { expect, test } from "@playwright/test";
import { expectDelivery, trackPageProblems, uniqueEmail, waitForFillTimer } from "./helpers";

test.describe("early-access dialog", () => {
  test("validates, submits and forwards the request", async ({ page }, testInfo) => {
    const problems = trackPageProblems(page);
    const email = uniqueEmail(testInfo);

    await page.goto("/");
    await page
      .getByRole("main")
      .getByRole("link", { name: "Request early access" })
      .first()
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Request early access" })).toBeVisible();

    await dialog.getByRole("button", { name: "Request access" }).click();
    await expect(dialog.getByText("Enter your work email.")).toBeVisible();
    await expect(dialog.getByText("Enter your full name.")).toBeVisible();
    await expect(dialog.getByText("Enter your company.")).toBeVisible();

    await dialog.getByLabel("Work email").fill(email);
    await dialog.getByLabel("Full name").fill("Jane Doe");
    await dialog.getByLabel("Company", { exact: true }).fill("Initech");
    await dialog.getByLabel("Primary use case").selectOption("Customer support");
    await waitForFillTimer(page);
    await dialog.getByRole("button", { name: "Request access" }).click();

    await expect(dialog.getByRole("heading", { name: "Request received" })).toBeVisible();
    await expect(dialog.getByText(email)).toBeVisible();

    const delivery = await expectDelivery(email);
    expect(delivery).toMatchObject({
      event: "lead.created",
      kind: "early-access",
      source: "hero",
      page: "/",
      fields: { name: "Jane Doe", company: "Initech", useCase: "Customer support" },
    });

    // Asking again shows the confirmation instead of a second form.
    await dialog.getByRole("button", { name: "Done" }).click();
    await page.getByRole("banner").getByRole("link", { name: "Request access" }).click();
    await expect(dialog.getByRole("heading", { name: "Request received" })).toBeVisible();

    expect(problems).toEqual([]);
  });
});

test.describe("early-access page", () => {
  test("submits the full form and records where the visitor came from", async ({
    page,
  }, testInfo) => {
    const email = uniqueEmail(testInfo);

    await page.goto("/early-access?source=pricing");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Full name").fill("Sam Lee");
    await page.getByLabel("Company", { exact: true }).fill("Globex");
    await page.getByLabel("Role").fill("Head of Platform");
    await page.getByLabel("Agents planned").selectOption("100-1,000");
    await page.getByLabel("Deployment").selectOption("Our own cloud (VPC)");
    await waitForFillTimer(page);
    await page.getByRole("button", { name: "Request early access" }).click();

    await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible();

    const delivery = await expectDelivery(email);
    expect(delivery).toMatchObject({
      kind: "early-access",
      source: "pricing",
      page: "/early-access",
      fields: { role: "Head of Platform", agents: "100-1,000", deployment: "Our own cloud (VPC)" },
    });
  });
});

test.describe("contact page", () => {
  test("sends a message", async ({ page }, testInfo) => {
    const email = uniqueEmail(testInfo);

    await page.goto("/contact");
    await page.getByLabel("Full name").fill("Ada Park");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Topic").selectOption("Security");
    await page.getByLabel("Message").fill("Do you support customer-managed encryption keys?");
    await waitForFillTimer(page);
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page.getByRole("heading", { name: "Message sent" })).toBeVisible();

    const delivery = await expectDelivery(email);
    expect(delivery).toMatchObject({
      kind: "contact",
      source: "contact-page",
      fields: { topic: "Security" },
    });
  });
});

test.describe("hosts without a function runtime", () => {
  test("the form offers a prefilled email instead", async ({ page }) => {
    // A purely static host answers the form endpoint with its HTML 404 page.
    await page.route("**/api/contact", (route) =>
      route.fulfill({ status: 404, contentType: "text/html", body: "<h1>Not found</h1>" }),
    );

    await page.goto("/contact");
    await page.getByLabel("Full name").fill("Ada Park");
    await page.getByLabel("Email").fill("ada@globex.com");
    await page.getByLabel("Topic").selectOption("Sales");
    await page.getByLabel("Message").fill("Please send pricing.");
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "We couldn't send your request." }),
    ).toBeVisible();
    const fallback = page.getByRole("link", { name: "Send it by email instead" });
    const href = await fallback.getAttribute("href");
    expect(href).toMatch(/^mailto:hello@example\.com\?subject=Website%20enquiry/);
    expect(decodeURIComponent(href!)).toContain("Message: Please send pricing.");
  });
});

test.describe("lead API", () => {
  test("only accepts JSON posts from the site itself", async ({ request, baseURL }) => {
    const withoutOrigin = await request.post("/api/early-access", { data: {} });
    expect(withoutOrigin.status()).toBe(403);

    const foreign = await request.post("/api/early-access", {
      data: {},
      headers: { origin: "https://attacker.example" },
    });
    expect(foreign.status()).toBe(403);

    const invalid = await request.post("/api/contact", {
      data: { elapsedMs: 5000, referral_code: "" },
      headers: { origin: baseURL! },
    });
    expect(invalid.status()).toBe(422);
    expect(Object.keys((await invalid.json()).fields)).toEqual([
      "email",
      "name",
      "topic",
      "message",
    ]);

    const wrongMethod = await request.get("/api/early-access");
    expect(wrongMethod.status()).toBe(405);
  });
});
