import type { LeadKind } from "../src/lib/leads/schema";
import { handleLeadRequest, type LeadHandlerEnv } from "../src/server/leads/handler";

/**
 * Request routing for the Cloudflare Worker, kept free of platform types so it
 * can be unit tested in Node. `index.ts` binds it to the real environment.
 */

export type RouterDeps = {
  /** Serves static assets, applying the configured 404 handling. */
  assets: { fetch(request: Request): Promise<Response> };
  env: LeadHandlerEnv;
  siteName?: string;
  rateLimit?: (key: string) => Promise<boolean>;
};

const LEAD_ROUTES: Record<string, LeadKind> = {
  "/api/early-access": "early-access",
  "/api/contact": "contact",
};

export async function route(request: Request, deps: RouterDeps): Promise<Response> {
  const { pathname } = new URL(request.url);
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  const kind = LEAD_ROUTES[normalized];
  if (kind) {
    return handleLeadRequest(request, {
      kind,
      env: deps.env,
      siteName: deps.siteName,
      rateLimit: deps.rateLimit,
    });
  }

  if (normalized === "/api" || normalized.startsWith("/api/")) {
    return new Response(JSON.stringify({ ok: false, error: "not_found" }), {
      status: 404,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  }

  // No static asset matched this path: let the assets binding apply `not_found_handling`.
  return deps.assets.fetch(request);
}
