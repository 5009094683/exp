import { describe, expect, it, vi } from "vitest";
import {
  handleLeadRequest,
  type LeadHandlerEnv,
  type LeadHandlerOptions,
  type LeadLogEntry,
} from "@/server/leads/handler";

const ORIGIN = "https://www.example.com";

const validPayload = {
  email: "jane@initech.com",
  name: "Jane Doe",
  company: "Initech",
  useCase: "Customer support",
  source: "hero",
  page: "/",
  referral_code: "",
  elapsedMs: 4200,
};

function makeRequest(
  body: unknown,
  init: { method?: string; headers?: Record<string, string>; origin?: string | null } = {},
) {
  const headers = new Headers({ "content-type": "application/json", ...init.headers });
  if (init.origin !== null) headers.set("origin", init.origin ?? ORIGIN);
  const method = init.method ?? "POST";
  return new Request(`${ORIGIN}/api/early-access`, {
    method,
    headers,
    body: method === "POST" ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });
}

function setup(env: LeadHandlerEnv = {}, overrides: Partial<LeadHandlerOptions> = {}) {
  const logs: LeadLogEntry[] = [];
  const fetchMock = vi.fn<typeof fetch>(async () => new Response("ok"));
  const options: LeadHandlerOptions = {
    kind: "early-access",
    env,
    siteName: "AgentOS",
    fetch: fetchMock,
    log: (entry) => logs.push(entry),
    now: () => new Date("2026-11-22T12:00:00Z"),
    ...overrides,
  };
  const events = () => logs.map((entry) => entry.event);
  return { options, logs, events, fetchMock };
}

async function sentBody(fetchMock: ReturnType<typeof setup>["fetchMock"], call = 0) {
  const init = fetchMock.mock.calls[call][1];
  return JSON.parse(String(init?.body));
}

describe("request checks", () => {
  it("rejects methods other than POST", async () => {
    const { options } = setup();
    const response = await handleLeadRequest(makeRequest(null, { method: "GET" }), options);
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST, OPTIONS");
  });

  it("answers OPTIONS without a body", async () => {
    const { options } = setup();
    const response = await handleLeadRequest(makeRequest(null, { method: "OPTIONS" }), options);
    expect(response.status).toBe(204);
  });

  it("requires an Origin header that matches the site", async () => {
    const { options } = setup();
    const missing = await handleLeadRequest(makeRequest(validPayload, { origin: null }), options);
    const foreign = await handleLeadRequest(
      makeRequest(validPayload, { origin: "https://evil.example" }),
      options,
    );
    expect(missing.status).toBe(403);
    expect(foreign.status).toBe(403);
    expect(await foreign.json()).toEqual({ ok: false, error: "forbidden_origin" });
  });

  it("accepts the forwarded host and explicitly allowed origins", async () => {
    const forwarded = setup();
    const viaProxy = await handleLeadRequest(
      makeRequest(validPayload, {
        origin: "https://agentos.example",
        headers: { "x-forwarded-host": "agentos.example" },
      }),
      forwarded.options,
    );
    expect(viaProxy.status).toBe(200);

    const allowed = setup({ LEADS_ALLOWED_ORIGINS: "https://preview.example, staging.example" });
    const fromPreview = await handleLeadRequest(
      makeRequest(validPayload, { origin: "https://staging.example" }),
      allowed.options,
    );
    expect(fromPreview.status).toBe(200);
  });

  it("requires a JSON body", async () => {
    const { options } = setup();
    const wrongType = await handleLeadRequest(
      makeRequest("a=b", { headers: { "content-type": "application/x-www-form-urlencoded" } }),
      options,
    );
    const malformed = await handleLeadRequest(makeRequest("{nope"), options);
    const array = await handleLeadRequest(makeRequest([1, 2]), options);
    expect(wrongType.status).toBe(415);
    expect(malformed.status).toBe(400);
    expect(array.status).toBe(400);
  });

  it("rejects oversized bodies", async () => {
    const { options, fetchMock } = setup({ LEADS_WEBHOOK_URL: "https://hooks.example/lead" });
    const response = await handleLeadRequest(
      makeRequest({ ...validPayload, message: "x".repeat(20_000) }),
      options,
    );
    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("spam filtering", () => {
  it.each([
    ["a filled honeypot", { referral_code: "FREE" }, "honeypot"],
    ["a form submitted too fast", { elapsedMs: 300 }, "submitted_too_fast"],
    ["a missing timer", { elapsedMs: undefined }, "submitted_too_fast"],
  ])("silently drops %s", async (_label, override, reason) => {
    const { options, logs, fetchMock } = setup({ LEADS_WEBHOOK_URL: "https://hooks.example/lead" });
    const response = await handleLeadRequest(
      makeRequest({ ...validPayload, ...override }),
      options,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(logs).toEqual([{ level: "warn", event: "lead.dropped", kind: "early-access", reason }]);
  });

  it("returns 429 when the rate limiter refuses", async () => {
    const rateLimit = vi.fn(async () => false);
    const { options, fetchMock } = setup({}, { rateLimit });
    const response = await handleLeadRequest(
      makeRequest(validPayload, { headers: { "cf-connecting-ip": "203.0.113.9" } }),
      options,
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(rateLimit).toHaveBeenCalledWith("early-access:203.0.113.9");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("validation", () => {
  it("returns field errors for invalid input", async () => {
    const { options, events } = setup();
    const response = await handleLeadRequest(
      makeRequest({ ...validPayload, email: "nope", company: "" }),
      options,
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      ok: false,
      error: "validation_failed",
      fields: { email: "Enter a valid email address.", company: "Enter your company." },
    });
    expect(events()).toEqual([]);
  });
});

describe("delivery", () => {
  it("logs the request and succeeds when no destination is configured", async () => {
    const { options, logs, events, fetchMock } = setup();
    const response = await handleLeadRequest(
      makeRequest(validPayload, { headers: { "cf-ipcountry": "DE" } }),
      options,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(events()).toEqual(["lead.received", "lead.no_destination"]);
    expect(logs[0]).toMatchObject({
      level: "info",
      id: body.id,
      receivedAt: "2026-11-22T12:00:00.000Z",
      kind: "early-access",
      site: "www.example.com",
      source: "hero",
      page: "/",
      country: "DE",
      fields: {
        email: "jane@initech.com",
        name: "Jane Doe",
        company: "Initech",
        useCase: "Customer support",
      },
    });
  });

  it("posts a structured event to a generic webhook", async () => {
    const { options, fetchMock, events } = setup({ LEADS_WEBHOOK_URL: "https://hooks.example/x" });
    const response = await handleLeadRequest(makeRequest(validPayload), options);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("https://hooks.example/x");
    expect(await sentBody(fetchMock)).toMatchObject({
      event: "lead.created",
      kind: "early-access",
      site: "www.example.com",
      fields: { email: "jane@initech.com", company: "Initech" },
    });
    expect(events()).toEqual(["lead.received"]);
  });

  it("formats Slack webhooks as text and neutralizes markup", async () => {
    const { options, fetchMock } = setup({
      LEADS_WEBHOOK_URL: "https://hooks.slack.com/services/T000/B000/XXXX",
    });
    await handleLeadRequest(makeRequest({ ...validPayload, company: "<!channel> & Co" }), options);
    const { text } = await sentBody(fetchMock);

    expect(text).toContain("*New early-access request: Jane Doe (&lt;!channel&gt; &amp; Co)");
    expect(text).toContain("• *Work email:* jane@initech.com");
    expect(text).not.toContain("<!channel>");
  });

  it("formats Discord webhooks as content with mentions disabled", async () => {
    const { options, fetchMock } = setup({
      LEADS_WEBHOOK_URL: "https://discord.com/api/webhooks/123/abc",
    });
    await handleLeadRequest(makeRequest(validPayload), options);
    const body = await sentBody(fetchMock);

    expect(body.content).toContain("**New early-access request: Jane Doe (Initech) · AgentOS**");
    expect(body.allowed_mentions).toEqual({ parse: [] });
  });

  it("sends an email through Resend with the requester as reply-to", async () => {
    const { options, fetchMock } = setup({
      RESEND_API_KEY: "re_test",
      LEADS_TO_EMAIL: "founders@example.com, sales@example.com",
      LEADS_FROM_EMAIL: "Website <website@example.com>",
    });
    const response = await handleLeadRequest(makeRequest(validPayload), options);
    const [url, init] = fetchMock.mock.calls[0];
    const body = await sentBody(fetchMock);

    expect(response.status).toBe(200);
    expect(url).toBe("https://api.resend.com/emails");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer re_test");
    expect(body).toMatchObject({
      from: "Website <website@example.com>",
      to: ["founders@example.com", "sales@example.com"],
      subject: "New early-access request: Jane Doe (Initech) · AgentOS",
      reply_to: "jane@initech.com",
    });
    expect(body.text).toContain("Primary use case: Customer support");
  });

  it("falls back to the request host when no site name is given", async () => {
    const { options, fetchMock } = setup(
      { LEADS_WEBHOOK_URL: "https://discord.com/api/webhooks/123/abc" },
      { siteName: undefined },
    );
    await handleLeadRequest(makeRequest(validPayload), options);
    expect((await sentBody(fetchMock)).content).toContain("· www.example.com**");
  });

  it("succeeds when one destination works and logs the one that failed", async () => {
    const { options, fetchMock, logs } = setup({
      LEADS_WEBHOOK_URL: "https://hooks.example/x",
      RESEND_API_KEY: "re_test",
      LEADS_TO_EMAIL: "founders@example.com",
      LEADS_FROM_EMAIL: "website@example.com",
    });
    fetchMock.mockImplementation(async (url) =>
      String(url).includes("resend") ? new Response("no", { status: 500 }) : new Response("ok"),
    );
    const response = await handleLeadRequest(makeRequest(validPayload), options);

    expect(response.status).toBe(200);
    expect(logs.at(-1)).toMatchObject({
      level: "error",
      event: "lead.delivery_failed",
      channel: "email",
      detail: "HTTP 500",
    });
  });

  it("returns 502 when every configured destination fails", async () => {
    const { options, fetchMock, events } = setup({ LEADS_WEBHOOK_URL: "https://hooks.example/x" });
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));
    const response = await handleLeadRequest(makeRequest(validPayload), options);

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ ok: false, error: "delivery_failed" });
    expect(events()).toEqual(["lead.received", "lead.delivery_failed"]);
  });

  it("treats a Resend key without addresses as a failed destination", async () => {
    const { options, fetchMock, logs } = setup({ RESEND_API_KEY: "re_test" });
    const response = await handleLeadRequest(makeRequest(validPayload), options);

    expect(response.status).toBe(502);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(String(logs.at(-1)?.detail)).toContain("LEADS_TO_EMAIL");
  });

  it("handles contact requests", async () => {
    const { options, fetchMock } = setup(
      { LEADS_WEBHOOK_URL: "https://discord.com/api/webhooks/123/abc" },
      { kind: "contact" },
    );
    const response = await handleLeadRequest(
      makeRequest({
        email: "sam@globex.com",
        name: "Sam Lee",
        topic: "Security",
        message: "Do you support customer-managed keys?",
        source: "contact-page",
        page: "/contact",
        referral_code: "",
        elapsedMs: 9000,
      }),
      options,
    );

    expect(response.status).toBe(200);
    expect((await sentBody(fetchMock)).content).toContain(
      "New contact message: Sam Lee · Security",
    );
  });
});

describe("failures", () => {
  it("returns 500 and logs when something unexpected throws", async () => {
    const { options, logs } = setup(
      {},
      {
        rateLimit: async () => {
          throw new Error("limiter offline");
        },
      },
    );
    const response = await handleLeadRequest(makeRequest(validPayload), options);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: "internal_error" });
    expect(logs.at(-1)).toMatchObject({ event: "lead.unhandled_error", detail: "limiter offline" });
  });
});
