import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  contentSecurityPolicy,
  IMMUTABLE_CACHE_CONTROL,
  renderHeadersFile,
  securityHeaders,
} from "@/config/headers";

const headersFile = fileURLToPath(new URL("../../public/_headers", import.meta.url));

describe("security headers", () => {
  it("keeps public/_headers identical to the headers the server target sends", () => {
    const expected = renderHeadersFile();
    if (process.env.UPDATE_HEADERS) writeFileSync(headersFile, expected);

    expect(
      readFileSync(headersFile, "utf8"),
      "public/_headers is out of date. Run: UPDATE_HEADERS=1 pnpm test",
    ).toBe(expected);
  });

  it("stays within the limits static hosts apply to header rules", () => {
    for (const line of renderHeadersFile().split("\n")) {
      expect(line.length).toBeLessThan(2000);
    }
  });

  it("sends each header once", () => {
    const keys = securityHeaders().map((header) => header.key.toLowerCase());
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual(
      expect.arrayContaining([
        "x-content-type-options",
        "referrer-policy",
        "x-frame-options",
        "permissions-policy",
        "strict-transport-security",
        "content-security-policy",
      ]),
    );
  });

  it("can leave the content security policy out for the dev server", () => {
    const keys = securityHeaders({ contentSecurityPolicy: false }).map((header) => header.key);
    expect(keys).not.toContain("Content-Security-Policy");
    expect(keys).toContain("X-Frame-Options");
  });

  it("caches fingerprinted files for a year", () => {
    expect(IMMUTABLE_CACHE_CONTROL).toBe("public, max-age=31536000, immutable");
  });
});

describe("content security policy", () => {
  const directives = (policy: string) =>
    Object.fromEntries(
      policy.split("; ").map((directive) => {
        const [name, ...sources] = directive.split(" ");
        return [name, sources];
      }),
    );

  it("limits everything to the site's own origin and forbids framing", () => {
    const policy = directives(contentSecurityPolicy());

    expect(policy["default-src"]).toEqual(["'self'"]);
    expect(policy["connect-src"]).toEqual(["'self'"]);
    expect(policy["form-action"]).toEqual(["'self'"]);
    expect(policy["frame-ancestors"]).toEqual(["'none'"]);
    expect(policy["object-src"]).toEqual(["'none'"]);
    expect(policy["script-src"]).not.toContain("'unsafe-eval'");
    for (const sources of Object.values(policy)) {
      expect(sources.some((source) => source === "*" || source.startsWith("http:"))).toBe(false);
    }
  });

  it("only allows the Vercel toolbar on preview deployments", () => {
    expect(contentSecurityPolicy()).not.toContain("vercel");

    const preview = directives(contentSecurityPolicy({ vercelPreview: true }));
    expect(preview["script-src"]).toContain("https://vercel.live");
    expect(preview["frame-src"]).toEqual(["https://vercel.live"]);
    expect(preview["frame-ancestors"]).toEqual(["'none'"]);
  });
});
