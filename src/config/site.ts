import "server-only";

import { parseSiteConfig, toPublicSite } from "./site-schema";

/**
 * Site-wide configuration, read from `SITE_*` environment variables.
 *
 * Pages are prerendered, so values are fixed at build time: change a variable,
 * then redeploy. Client components read the public subset through `useSite()`.
 */
const parsed = parseSiteConfig(process.env);

const globalState = globalThis as { __siteConfigWarned?: boolean };
if (parsed.warnings.length > 0 && !globalState.__siteConfigWarned) {
  globalState.__siteConfigWarned = true;
  for (const warning of parsed.warnings) console.warn(`[site config] ${warning}`);
}

export const site = parsed.site;
export const publicSite = toPublicSite(parsed.site);
