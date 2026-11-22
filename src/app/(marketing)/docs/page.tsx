import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsArticle } from "@/components/docs/article";
import { site } from "@/config/site";
import { getDocsPage } from "@/content/docs/pages";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Documentation",
  description: `Concepts, manifest formats and the API of ${site.product.name}: agents, orchestration, memory, MCP integrations, policies, audit logs and sandboxes.`,
  path: "/docs",
});

export default function DocsPage() {
  const page = getDocsPage("");
  if (!page) notFound();
  return <DocsArticle page={page} />;
}
