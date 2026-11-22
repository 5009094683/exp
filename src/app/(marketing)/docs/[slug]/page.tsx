import { docsPages } from "@/content/docs/nav";

export const dynamicParams = false;

export function generateStaticParams() {
  return docsPages.filter((page) => page.slug !== "").map((page) => ({ slug: page.slug }));
}

export default function DocsArticlePage() {
  return null;
}
