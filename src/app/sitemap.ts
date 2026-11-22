import type { MetadataRoute } from "next";
import { buildTime } from "@/config/build";
import { site } from "@/config/site";
import { indexableRoutes } from "@/lib/site-routes";

export const dynamic = "force-static";

/** Lists the public pages. The demo console and sign-in are left out on purpose. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (site.seo.noindex) return [];

  const lastModified = new Date(buildTime);
  return indexableRoutes.map((route) => ({
    url: `${site.url}${route === "/" ? "" : route}`,
    lastModified,
  }));
}
