import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return <PageHero eyebrow="Pricing" title="Pricing that scales with your fleet" />;
}
