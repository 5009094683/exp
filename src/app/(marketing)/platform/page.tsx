import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/page-hero";

export const metadata: Metadata = { title: "Platform" };

export default function PlatformPage() {
  return <PageHero eyebrow="Platform" title="One platform for the whole agent lifecycle" />;
}
