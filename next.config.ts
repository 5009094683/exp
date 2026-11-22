import type { NextConfig } from "next";

/**
 * Two build targets share one codebase:
 *
 * - "server" (default): standard Next.js build for Vercel or any Node host.
 *   API routes (`route.server.ts`) run as functions.
 * - "static": `output: "export"` into `out/` for Cloudflare Workers or any
 *   static host. API routes are left out of the build and served by
 *   `worker/index.ts` instead.
 *
 * Workers Builds sets WORKERS_CI=1, so `pnpm build` picks the right target there.
 */
const target = process.env.BUILD_TARGET ?? (process.env.WORKERS_CI === "1" ? "static" : "server");

if (target !== "server" && target !== "static") {
  throw new Error(`BUILD_TARGET must be "server" or "static", received "${target}".`);
}

const isStatic = target === "static";

const nextConfig: NextConfig = {
  output: isStatic ? "export" : undefined,
  // API routes are named `route.server.ts`, so they only exist in the server target.
  pageExtensions: isStatic ? ["tsx", "ts"] : ["tsx", "ts", "server.ts"],
  // Cache Components stays off: a static export requires route handlers to set
  // `dynamic = "force-static"`, which Cache Components rejects (Next.js 16.4).
  typedRoutes: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
