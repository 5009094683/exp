import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { unstable_readConfig } from "wrangler";

/**
 * Cloudflare builds every branch other than production as a Preview, with
 * `wrangler preview`. That command needs a Cloudflare account, so CI cannot run
 * it; these checks cover what it requires of wrangler.jsonc instead.
 */
describe("wrangler.jsonc", () => {
  const config = unstable_readConfig({
    config: fileURLToPath(new URL("../../wrangler.jsonc", import.meta.url)),
  });

  it("has the previews block that `wrangler preview` refuses to run without", () => {
    expect(config.previews).toBeDefined();
  });

  it("gives Previews every rate limiter the Worker reads, since bindings are not inherited", () => {
    const names = (limiters: Array<{ name: string }>) => limiters.map((limiter) => limiter.name);

    expect(names(config.ratelimits)).toContain("LEADS_RATE_LIMITER");
    expect(names(config.previews?.ratelimits ?? [])).toEqual(names(config.ratelimits));
  });

  it("counts requests to Previews apart from requests to production", () => {
    const production = config.ratelimits.map((limiter) => limiter.namespace_id);

    for (const limiter of config.previews?.ratelimits ?? []) {
      expect(production, limiter.name).not.toContain(limiter.namespace_id);
    }
  });
});
