import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  if (site.seo.noindex) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  // The demo console stays crawlable so its noindex tags can be read.
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
