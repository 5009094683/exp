import type { LeadHandlerEnv } from "../src/server/leads/handler";
import { route } from "./router";

/**
 * Cloudflare Worker entry for the static build target.
 *
 * Pages are static assets and never reach this code. The Worker only answers
 * `/api/*` (see `run_worker_first` in wrangler.jsonc) and requests that match
 * no asset, which it hands back to the assets binding for the 404 page.
 */

// Optional values set in the dashboard or with `wrangler secret put`; they are
// not declared in wrangler.jsonc, so they are typed here rather than generated.
interface AppEnv extends Env, LeadHandlerEnv {
  /** Product name for notification subjects. Defaults to the request host. */
  SITE_PRODUCT_NAME?: string;
}

export default {
  async fetch(request, env): Promise<Response> {
    return route(request, {
      assets: env.ASSETS,
      env,
      siteName: env.SITE_PRODUCT_NAME,
      rateLimit: async (key) => (await env.LEADS_RATE_LIMITER.limit({ key })).success,
    });
  },
} satisfies ExportedHandler<AppEnv>;
