import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("unknown paths return the 404 page with a 404 status", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
});

test("the early-access endpoint answers POST requests", async ({ request }) => {
  const response = await request.post("/api/early-access", { data: {} });
  expect(response.headers()["content-type"]).toContain("application/json");
});
