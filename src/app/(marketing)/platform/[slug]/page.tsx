import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/marketing/page-hero";
import { capabilities, getCapability } from "@/content/capabilities";

export const dynamicParams = false;

export function generateStaticParams() {
  return capabilities.map((capability) => ({ slug: capability.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/platform/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: getCapability(slug)?.name };
}

export default async function CapabilityPage({ params }: PageProps<"/platform/[slug]">) {
  const { slug } = await params;
  const capability = getCapability(slug);
  if (!capability) notFound();

  return <PageHero eyebrow="Platform" title={capability.name} description={capability.summary} />;
}
