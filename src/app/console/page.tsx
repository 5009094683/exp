import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";

export const metadata: Metadata = { title: "Console" };

export default function ConsolePage() {
  return <PageHero eyebrow="Demo workspace" title="Console" />;
}
