/**
 * Security and caching headers, defined once for both build targets:
 *
 * - the server target applies them through `headers()` in next.config.ts;
 * - static hosts read them from `public/_headers`, which a unit test keeps
 *   identical to `renderHeadersFile()`.
 *
 * This module is imported by next.config.ts, so it must stay dependency-free.
 */

export type Header = { key: string; value: string };

type Directives = Record<string, string[]>;

/**
 * Pages are prerendered and carry inline scripts with the data React needs to
 * hydrate, and a static page cannot carry a per-request nonce, so inline
 * scripts are allowed. Everything else is limited to the site's own origin.
 */
const CSP: Directives = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:"],
  "font-src": ["'self'"],
  "connect-src": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
};

/** Sources the Vercel toolbar needs on preview deployments. */
const VERCEL_PREVIEW: Directives = {
  "script-src": ["https://vercel.live"],
  "style-src": ["https://vercel.live"],
  "img-src": ["https://vercel.live", "https://vercel.com"],
  "font-src": ["https://vercel.live", "https://assets.vercel.com"],
  "connect-src": ["https://vercel.live", "wss://ws-us3.pusher.com"],
  "frame-src": ["https://vercel.live"],
};

export function contentSecurityPolicy(options: { vercelPreview?: boolean } = {}): string {
  const directives: Directives = Object.fromEntries(
    Object.entries(CSP).map(([name, sources]) => [name, [...sources]]),
  );
  if (options.vercelPreview) {
    for (const [name, sources] of Object.entries(VERCEL_PREVIEW)) {
      directives[name] = [...(directives[name] ?? []), ...sources];
    }
  }
  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ");
}

export function securityHeaders(
  options: { vercelPreview?: boolean; contentSecurityPolicy?: boolean } = {},
): Header[] {
  const headers: Header[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
    // This host only: `includeSubDomains` would also bind every other subdomain.
    { key: "Strict-Transport-Security", value: "max-age=31536000" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
  if (options.contentSecurityPolicy !== false) {
    headers.push({
      key: "Content-Security-Policy",
      value: contentSecurityPolicy({ vercelPreview: options.vercelPreview }),
    });
  }
  return headers;
}

/** File names under this path contain a content hash, so they never change. */
export const IMMUTABLE_PATH = "/_next/static/*";
export const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

/** The `_headers` file read by Cloudflare Workers and other static hosts. */
export function renderHeadersFile(): string {
  const lines = [
    "# Generated from src/config/headers.ts and checked by tests/unit/headers.test.ts.",
    "# To change a header, edit that module, then run: UPDATE_HEADERS=1 pnpm test",
    "",
    "/*",
    ...securityHeaders().map((header) => `  ${header.key}: ${header.value}`),
    "",
    IMMUTABLE_PATH,
    `  Cache-Control: ${IMMUTABLE_CACHE_CONTROL}`,
    "",
  ];
  return lines.join("\n");
}
