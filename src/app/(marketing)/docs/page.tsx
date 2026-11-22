import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";

export const metadata: Metadata = { title: "Documentation" };

export default function DocsPage() {
  return <PageHero eyebrow="Documentation" title="Documentation" />;
}
