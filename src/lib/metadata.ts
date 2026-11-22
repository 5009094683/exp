import "server-only";

import type { Metadata } from "next";
import { site } from "@/config/site";

/** The generated social card, served from `src/app/og.png/route.tsx`. */
export const SOCIAL_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: `${site.product.name}: ${site.product.tagline}`,
};

export const DEFAULT_TITLE = `${site.product.name} — ${site.product.tagline}`;

/**
 * Metadata for one page. Next.js merges metadata shallowly, so a page that
 * only set `title` would inherit the home page's Open Graph title; this sets
 * the search, Open Graph and Twitter fields together.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  /** Omit on the home page to use the product name and tagline. */
  title?: string;
  description: string;
  /** Canonical path, starting with a slash. */
  path: string;
}): Metadata {
  const socialTitle = title ? `${title} — ${site.product.name}` : DEFAULT_TITLE;

  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.product.name,
      locale: "en_US",
      url: path,
      title: socialTitle,
      description,
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [SOCIAL_IMAGE],
      ...(site.seo.xHandle ? { site: site.seo.xHandle } : {}),
    },
  };
}
