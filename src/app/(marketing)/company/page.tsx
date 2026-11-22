import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";

export const metadata: Metadata = { title: "Company" };

export default function CompanyPage() {
  return <PageHero eyebrow="Company" title="Infrastructure for the agent era" />;
}
