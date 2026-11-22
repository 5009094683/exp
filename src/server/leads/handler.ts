import {
  describeLead,
  HONEYPOT_FIELD,
  MIN_FILL_MS,
  validateLead,
  type Lead,
  type LeadKind,
} from "../../lib/leads/schema";

/**
 * Handles early-access and contact submissions.
 *
 * Uses only web-standard APIs (Request, Response, fetch, crypto), so the same
 * code runs in a Next.js route handler and in the Cloudflare Worker.
 */

/** Runtime settings. All optional: with no destination, requests are only logged. */
export type LeadHandlerEnv = {
  /** Slack or Discord incoming webhook, or any endpoint that accepts a JSON POST. */
  LEADS_WEBHOOK_URL?: string;
  /** Resend API key. Email is sent when this, LEADS_TO_EMAIL and LEADS_FROM_EMAIL are set. */
  RESEND_API_KEY?: string;
  LEADS_TO_EMAIL?: string;
  LEADS_FROM_EMAIL?: string;
  /** Extra origins allowed to post, comma separated. The site's own origin always is. */
  LEADS_ALLOWED_ORIGINS?: string;
};

export type LeadRecord = {
  id: string;
  receivedAt: string;
  kind: LeadKind;
  site: string;
  source: string;
  page: string;
  country?: string;
  fields: Record<string, string>;
};

export type LeadLogEntry = { level: "info" | "warn" | "error"; event: string } & Record<
  string,
  unknown
>;

export type LeadHandlerOptions = {
  kind: LeadKind;
  env: LeadHandlerEnv;
  /** Product name used in notification subjects. Falls back to the request host. */
  siteName?: string;
  /** Returns false when the caller has sent too many requests. */
  rateLimit?: (key: string) => Promise<boolean>;
  fetch?: typeof fetch;
  log?: (entry: LeadLogEntry) => void;
  now?: () => Date;
};

const MAX_BODY_BYTES = 16 * 1024;
const DELIVERY_TIMEOUT_MS = 8000;

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...headers } });
}

function defaultLog(entry: LeadLogEntry) {
  const line = JSON.stringify(entry);
  if (entry.level === "error") console.error(line);
  else if (entry.level === "warn") console.warn(line);
  else console.log(line);
}

function hostOf(value: string): string | null {
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).host.toLowerCase();
  } catch {
    return null;
  }
}

/** The form may only be posted from the site itself (or an explicitly allowed origin). */
function isAllowedOrigin(request: Request, env: LeadHandlerEnv): boolean {
  const origin = request.headers.get("origin");
  const originHost = origin ? hostOf(origin) : null;
  if (!originHost) return false;

  const allowed = new Set<string>();
  const candidates = [
    request.url,
    request.headers.get("host"),
    request.headers.get("x-forwarded-host"),
    ...(env.LEADS_ALLOWED_ORIGINS ?? "").split(","),
  ];
  for (const candidate of candidates) {
    const host = candidate?.trim() ? hostOf(candidate.trim()) : null;
    if (host) allowed.add(host);
  }
  return allowed.has(originHost);
}

/** Reads the body with a hard cap so an oversized request cannot exhaust memory. */
async function readBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

function clientKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function headline(record: LeadRecord): string {
  const { name, company, topic } = record.fields;
  const who = company ? `${name} (${company})` : name;
  return record.kind === "early-access"
    ? `New early-access request: ${who}`
    : `New contact message: ${who}${topic ? ` · ${topic}` : ""}`;
}

function detailLines(record: LeadRecord, lead: Lead): Array<{ label: string; value: string }> {
  return [
    ...describeLead(lead),
    { label: "Source", value: `${record.source} (${record.page})` },
    ...(record.country ? [{ label: "Country", value: record.country }] : []),
    { label: "Reference", value: record.id },
  ];
}

const escapeSlack = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Builds the JSON body for the webhook, matching Slack and Discord where detected. */
export function buildWebhookPayload(
  webhookUrl: string,
  record: LeadRecord,
  lead: Lead,
  siteName: string,
): unknown {
  const host = hostOf(webhookUrl) ?? "";
  const lines = detailLines(record, lead);
  const title = `${headline(record)} · ${siteName}`;

  if (host === "hooks.slack.com") {
    return {
      text: [
        `*${escapeSlack(title)}*`,
        ...lines.map((line) => `• *${escapeSlack(line.label)}:* ${escapeSlack(line.value)}`),
      ].join("\n"),
    };
  }

  if (host === "discord.com" || host === "discordapp.com") {
    const content = [
      `**${title}**`,
      ...lines.map((line) => `• **${line.label}:** ${line.value}`),
    ].join("\n");
    return { content: content.slice(0, 1900), allowed_mentions: { parse: [] } };
  }

  return { event: "lead.created", ...record };
}

type Delivery = { channel: "webhook" | "email"; ok: boolean; detail?: string };

async function post(
  fetcher: typeof fetch,
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<{ ok: boolean; detail?: string }> {
  try {
    const response = await fetcher(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });
    // Release the connection; the response body is not needed.
    await response.body?.cancel();
    return response.ok ? { ok: true } : { ok: false, detail: `HTTP ${response.status}` };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : "request failed" };
  }
}

async function deliver(
  record: LeadRecord,
  lead: Lead,
  options: Required<Pick<LeadHandlerOptions, "env" | "fetch">> & { siteName: string },
): Promise<Delivery[]> {
  const { env, siteName } = options;
  const tasks: Array<Promise<Delivery>> = [];

  const webhookUrl = env.LEADS_WEBHOOK_URL?.trim();
  if (webhookUrl) {
    tasks.push(
      post(options.fetch, webhookUrl, buildWebhookPayload(webhookUrl, record, lead, siteName)).then(
        (result) => ({ channel: "webhook" as const, ...result }),
      ),
    );
  }

  const apiKey = env.RESEND_API_KEY?.trim();
  if (apiKey) {
    const to = (env.LEADS_TO_EMAIL ?? "")
      .split(",")
      .map((address) => address.trim())
      .filter(Boolean);
    const from = env.LEADS_FROM_EMAIL?.trim();

    if (to.length === 0 || !from) {
      tasks.push(
        Promise.resolve({
          channel: "email" as const,
          ok: false,
          detail: "RESEND_API_KEY is set but LEADS_TO_EMAIL or LEADS_FROM_EMAIL is missing",
        }),
      );
    } else {
      const text = [
        headline(record),
        "",
        ...detailLines(record, lead).map((line) => `${line.label}: ${line.value}`),
      ].join("\n");
      tasks.push(
        post(
          options.fetch,
          "https://api.resend.com/emails",
          {
            from,
            to,
            subject: `${headline(record)} · ${siteName}`,
            text,
            reply_to: record.fields.email,
          },
          { authorization: `Bearer ${apiKey}`, "idempotency-key": record.id },
        ).then((result) => ({ channel: "email" as const, ...result })),
      );
    }
  }

  return Promise.all(tasks);
}

export async function handleLeadRequest(
  request: Request,
  options: LeadHandlerOptions,
): Promise<Response> {
  const log = options.log ?? defaultLog;
  const { kind, env } = options;

  try {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { allow: "POST, OPTIONS" } });
    }
    if (request.method !== "POST") {
      return json({ ok: false, error: "method_not_allowed" }, 405, { allow: "POST, OPTIONS" });
    }
    if (!isAllowedOrigin(request, env)) {
      return json({ ok: false, error: "forbidden_origin" }, 403);
    }
    if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
      return json({ ok: false, error: "unsupported_media_type" }, 415);
    }

    const body = await readBody(request);
    if (body === null) return json({ ok: false, error: "payload_too_large" }, 413);

    let payload: unknown;
    try {
      payload = JSON.parse(body);
    } catch {
      return json({ ok: false, error: "invalid_json" }, 400);
    }
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      return json({ ok: false, error: "invalid_json" }, 400);
    }
    const data = payload as Record<string, unknown>;

    // Automated submissions get a success response so they do not adapt, but go no further.
    const elapsed = typeof data.elapsedMs === "number" ? data.elapsedMs : Number.NaN;
    const trap = typeof data[HONEYPOT_FIELD] === "string" ? data[HONEYPOT_FIELD] : "";
    if (trap !== "" || !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) {
      log({
        level: "warn",
        event: "lead.dropped",
        kind,
        reason: trap !== "" ? "honeypot" : "submitted_too_fast",
      });
      return json({ ok: true });
    }

    if (options.rateLimit && !(await options.rateLimit(`${kind}:${clientKey(request)}`))) {
      return json({ ok: false, error: "rate_limited" }, 429, { "retry-after": "60" });
    }

    const validation = validateLead(kind, data);
    if (!validation.ok) {
      return json({ ok: false, error: "validation_failed", fields: validation.errors }, 422);
    }
    const { lead } = validation;

    const site = new URL(request.url).host;
    const record: LeadRecord = {
      id: crypto.randomUUID(),
      receivedAt: (options.now?.() ?? new Date()).toISOString(),
      kind,
      site,
      source: lead.source,
      page: lead.page,
      country:
        request.headers.get("cf-ipcountry") ??
        request.headers.get("x-vercel-ip-country") ??
        undefined,
      fields: lead.fields,
    };

    // The log line is the record of last resort when no destination is configured.
    log({ level: "info", event: "lead.received", ...record });

    const deliveries = await deliver(record, lead, {
      env,
      fetch: options.fetch ?? fetch,
      siteName: options.siteName?.trim() || site,
    });

    for (const delivery of deliveries) {
      if (!delivery.ok) {
        log({
          level: "error",
          event: "lead.delivery_failed",
          id: record.id,
          channel: delivery.channel,
          detail: delivery.detail,
        });
      }
    }

    if (deliveries.length === 0) {
      log({ level: "warn", event: "lead.no_destination", id: record.id });
    } else if (deliveries.every((delivery) => !delivery.ok)) {
      return json({ ok: false, error: "delivery_failed", id: record.id }, 502);
    }

    return json({ ok: true, id: record.id });
  } catch (error) {
    log({
      level: "error",
      event: "lead.unhandled_error",
      kind,
      detail: error instanceof Error ? error.message : String(error),
    });
    return json({ ok: false, error: "internal_error" }, 500);
  }
}
