import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return <PageHero eyebrow="Contact" title="Talk to the team" />;
}
