import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { CSSProperties, ReactNode } from "react";
import { EarlyAccessProvider } from "@/components/leads/early-access-provider";
import { SiteProvider } from "@/components/site-provider";
import { publicSite, site } from "@/config/site";
import { PAGE_BACKGROUND } from "@/config/site-schema";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.product.name} — ${site.product.tagline}`,
    template: `%s — ${site.product.name}`,
  },
  description: site.product.description,
  applicationName: site.product.name,
};

export const viewport: Viewport = {
  themeColor: PAGE_BACKGROUND,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const { accent } = site.theme;
  const themeVariables = {
    "--accent": accent.base,
    "--accent-hover": accent.hover,
    "--accent-text": accent.text,
    "--accent-contrast": accent.contrast,
  } as CSSProperties;

  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={themeVariables}
    >
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only rounded-md bg-fg px-4 py-2 text-sm font-medium text-bg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100]"
        >
          Skip to content
        </a>
        <SiteProvider value={publicSite}>
          <EarlyAccessProvider>{children}</EarlyAccessProvider>
        </SiteProvider>
      </body>
    </html>
  );
}
