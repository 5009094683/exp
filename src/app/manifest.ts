import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { PAGE_BACKGROUND } from "@/config/site-schema";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.product.name,
    short_name: site.product.name,
    description: site.product.description,
    start_url: "/",
    display: "browser",
    background_color: PAGE_BACKGROUND,
    theme_color: PAGE_BACKGROUND,
    icons: [
      { src: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/app-icon-192.png", type: "image/png", sizes: "192x192" },
      { src: "/app-icon-512.png", type: "image/png", sizes: "512x512" },
      { src: "/app-icon-512.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
    ],
  };
}
