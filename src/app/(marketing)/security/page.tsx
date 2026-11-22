import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return <PageHero eyebrow="Security" title="Security is the product" />;
}
