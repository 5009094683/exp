import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";

export const metadata: Metadata = { title: "Request early access" };

export default function EarlyAccessPage() {
  return <PageHero eyebrow="Early access" title="Request early access" />;
}
