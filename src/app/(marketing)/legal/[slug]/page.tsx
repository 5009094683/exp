import { notFound } from "next/navigation";
import { PageHero } from "@/components/marketing/page-hero";

const documents = ["privacy", "terms", "cookies"];

export const dynamicParams = false;

export function generateStaticParams() {
  return documents.map((slug) => ({ slug }));
}

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  if (!documents.includes(slug)) notFound();

  return <PageHero eyebrow="Legal" title={slug} />;
}
