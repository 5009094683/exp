import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseSiteConfig, SITE_SETTING_NAMES } from "@/config/site-schema";
import { isolatedSiteEnv, siteSettingNames } from "../../scripts/lib/site-env.mjs";

const committedEnv = fileURLToPath(new URL("../../.env", import.meta.url));

type NextEnvLoader = {
  loadEnvConfig(
    directory: string,
    dev: boolean,
    log: { info: () => void; error: () => void },
    forceReload: boolean,
  ): { combinedEnv: Record<string, string | undefined> };
  resetEnv(): void;
};

/** The loader Next.js reads `.env` files with. It is a dependency of `next`, not of this project. */
function nextEnvLoader(): NextEnvLoader {
  const require = createRequire(import.meta.url);
  return createRequire(require.resolve("next/package.json"))("@next/env") as NextEnvLoader;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe(".env, the committed site details", () => {
  // The file is optional: a site can take every setting from its host instead.
  const values = parseEnv(existsSync(committedEnv) ? readFileSync(committedEnv, "utf8") : "");

  it("holds site settings only, because the file is public", () => {
    const others = Object.keys(values).filter((name) => !SITE_SETTING_NAMES.includes(name));
    expect(
      others,
      ".env is committed, so it must not hold keys, webhook URLs or other runtime values. " +
        "Move these to .env.local or to the host's settings",
    ).toEqual([]);
  });

  it("is a valid configuration", () => {
    expect(parseSiteConfig(values).warnings).toEqual([]);
  });
});

describe(".env.example", () => {
  it("documents every setting the site reads, and no others", () => {
    expect(siteSettingNames().sort()).toEqual([...SITE_SETTING_NAMES].sort());
  });
});

describe("builds that must not depend on .env", () => {
  it("define every site setting, empty unless a value is given", () => {
    vi.stubEnv("SITE_CONTACT_PHONE", "+1 000 000 0000");
    vi.stubEnv("LEADS_TO_EMAIL", "kept@example.com");

    const env = isolatedSiteEnv({ SITE_PRODUCT_NAME: "Zephyrline" });

    expect(env.SITE_PRODUCT_NAME).toBe("Zephyrline");
    expect(env.LEADS_TO_EMAIL).toBe("kept@example.com");
    for (const name of SITE_SETTING_NAMES) {
      if (name !== "SITE_PRODUCT_NAME") expect(env[name], name).toBe("");
    }
  });

  it("rely on Next.js leaving a variable alone once it is defined, even as an empty string", () => {
    const { loadEnvConfig, resetEnv } = nextEnvLoader();

    const directory = mkdtempSync(join(tmpdir(), "site-env-"));
    writeFileSync(
      join(directory, ".env"),
      'SITE_TEST_DEFINED_EMPTY="from the file"\nSITE_TEST_NOT_DEFINED="from the file"\n',
    );
    vi.stubEnv("SITE_TEST_DEFINED_EMPTY", "");

    try {
      const silent = { info: () => {}, error: () => {} };
      const { combinedEnv } = loadEnvConfig(directory, false, silent, true);

      expect(combinedEnv.SITE_TEST_DEFINED_EMPTY).toBe("");
      expect(combinedEnv.SITE_TEST_NOT_DEFINED).toBe("from the file");
    } finally {
      resetEnv();
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
