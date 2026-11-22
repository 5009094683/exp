import type { ReactNode } from "react";
import { JsonLd } from "@/components/json-ld";
import { AnnouncementBar } from "@/components/marketing/announcement-bar";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { site } from "@/config/site";
import { buildSiteStructuredData } from "@/lib/structured-data";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <JsonLd data={buildSiteStructuredData(site)} />
    </>
  );
}
