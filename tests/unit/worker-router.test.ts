import { describe, expect, it, vi } from "vitest";
import { route, type RouterDeps } from "../../worker/router";

const ORIGIN = "https://www.example.com";

function deps(overrides: Partial<RouterDeps> = {}): RouterDeps & {
  assets: { fetch: ReturnType<typeof vi.fn> };
} {
  return {
    assets: { fetch: vi.fn(async () => new Response("<h1>Not found</h1>", { status: 404 })) },
    env: {},
    ...overrides,
  } as RouterDeps & { assets: { fetch: ReturnType<typeof vi.fn> } };
}

function leadRequest(path: string, body: Record<string, unknown>) {
  return new Request(`${ORIGIN}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify({
      referral_code: "",
      elapsedMs: 5000,
      source: "test",
      page: "/",
      ...body,
    }),
  });
}

describe("worker router", () => {
  it("handles early-access requests without touching static assets", async () => {
    const d = deps();
    const response = await route(
      leadRequest("/api/early-access", {
        email: "jane@initech.com",
        name: "Jane Doe",
        company: "Initech",
      }),
      d,
    );

    expect(response.status).toBe(200);
    expect((await response.json()).ok).toBe(true);
    expect(d.assets.fetch).not.toHaveBeenCalled();
  });

  it("handles contact requests, with or without a trailing slash", async () => {
    const response = await route(
      leadRequest("/api/contact/", {
        email: "sam@globex.com",
        name: "Sam Lee",
        topic: "Sales",
        message: "Hello",
      }),
      deps(),
    );
    expect(response.status).toBe(200);
  });

  it("validates each route against its own form", async () => {
    const response = await route(
      leadRequest("/api/contact", { email: "sam@globex.com", name: "Sam Lee" }),
      deps(),
    );
    expect(response.status).toBe(422);
    expect(Object.keys((await response.json()).fields)).toEqual(["topic", "message"]);
  });

  it("passes the rate limiter through to the handler", async () => {
    const rateLimit = vi.fn(async () => false);
    const response = await route(
      leadRequest("/api/early-access", {
        email: "jane@initech.com",
        name: "Jane Doe",
        company: "Initech",
      }),
      deps({ rateLimit }),
    );
    expect(response.status).toBe(429);
    expect(rateLimit).toHaveBeenCalledOnce();
  });

  it("rejects GET on a lead route", async () => {
    const response = await route(new Request(`${ORIGIN}/api/early-access`), deps());
    expect(response.status).toBe(405);
  });

  it("returns a JSON 404 for unknown API paths", async () => {
    const d = deps();
    const response = await route(new Request(`${ORIGIN}/api/unknown`), d);

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ ok: false, error: "not_found" });
    expect(d.assets.fetch).not.toHaveBeenCalled();
  });

  it("hands every other path to the assets binding for the 404 page", async () => {
    const d = deps();
    const request = new Request(`${ORIGIN}/does-not-exist`);
    const response = await route(request, d);

    expect(d.assets.fetch).toHaveBeenCalledWith(request);
    expect(response.status).toBe(404);
    expect(await response.text()).toContain("Not found");
  });

  it("does not treat lookalike paths as API routes", async () => {
    const d = deps();
    await route(new Request(`${ORIGIN}/apiary`), d);
    expect(d.assets.fetch).toHaveBeenCalledOnce();
  });
});
