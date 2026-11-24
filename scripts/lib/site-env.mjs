import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const examplePath = fileURLToPath(new URL("../../.env.example", import.meta.url));

/**
 * The name of every site setting, as documented in `.env.example`.
 *
 * @returns {string[]}
 */
export function siteSettingNames() {
  const names = new Set();
  for (const [, name] of readFileSync(examplePath, "utf8").matchAll(/^#?\s*(SITE_[A-Z0-9_]+)=/gm)) {
    names.add(name);
  }
  return [...names];
}

/**
 * The environment for a build whose site settings are exactly `settings`.
 *
 * Next.js copies values from `.env` and `.env.local` into every variable that
 * is not already defined, so the details of this checkout would otherwise end
 * up in a build that has to be the same everywhere. A variable defined as an
 * empty string is left alone, and the site reads an empty setting as unset.
 *
 * @param {Record<string, string>} [settings]
 * @returns {Record<string, string | undefined>}
 */
export function isolatedSiteEnv(settings = {}) {
  const unset = Object.fromEntries(siteSettingNames().map((name) => [name, ""]));
  return { ...process.env, ...unset, ...settings };
}
