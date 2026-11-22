import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { SiteProvider } from "@/components/site-provider";
import { publicSite, site } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.product.name} — ${site.product.tagline}`,
    template: `%s — ${site.product.name}`,
  },
  description: site.product.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <SiteProvider value={publicSite}>{children}</SiteProvider>
      </body>
    </html>
  );
}
