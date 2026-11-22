import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsArticle } from "@/components/docs/article";
import { docsPages } from "@/content/docs/nav";
import { getDocsPage } from "@/content/docs/pages";

export const dynamicParams = false;

export function generateStaticParams() {
  return docsPages.filter((page) => page.slug !== "").map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps<"/docs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = getDocsPage(slug);
  if (!page) return {};
  return {
    title: `${page.title} · Docs`,
    description: page.description,
    alternates: { canonical: `/docs/${page.slug}` },
  };
}

export default async function DocsArticlePage({ params }: PageProps<"/docs/[slug]">) {
  const { slug } = await params;
  const page = slug === "" ? undefined : getDocsPage(slug);
  if (!page) notFound();
  return <DocsArticle page={page} />;
}
