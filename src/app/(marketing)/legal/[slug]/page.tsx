import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocBlocks } from "@/components/docs/blocks";
import { TableOfContents } from "@/components/docs/toc";
import { Container, Eyebrow } from "@/components/marketing/layout";
import { site } from "@/config/site";
import { getLegalDocument, legalDocuments } from "@/content/legal";
import { cn } from "@/lib/cn";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return legalDocuments.map((document) => ({ slug: document.slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const document = getLegalDocument(slug);
  if (!document) return {};
  return pageMetadata({
    title: document.title,
    description: document.description,
    path: `/legal/${document.slug}`,
  });
}

function formatEffectiveDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

export default async function LegalPage({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  const document = getLegalDocument(slug);
  if (!document) notFound();

  const headings = document.blocks.flatMap((block) =>
    block.type === "h2" ? [{ id: block.id, text: block.text }] : [],
  );

  return (
    <Container className="py-10 lg:py-14">
      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
        <nav aria-label="Legal documents" className="mb-8 lg:mb-0">
          <div className="lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
            <p className="hidden px-3 font-mono text-[11px] font-medium tracking-[0.14em] text-fg-subtle uppercase lg:block">
              Legal
            </p>
            <ul className="flex gap-1 overflow-x-auto lg:mt-2 lg:flex-col lg:gap-0.5">
              {legalDocuments.map((item) => {
                const active = item.slug === document.slug;
                return (
                  <li key={item.slug} className="shrink-0">
                    <Link
                      href={`/legal/${item.slug}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                        active
                          ? "bg-white/[0.07] font-medium text-fg"
                          : "text-fg-muted hover:bg-white/[0.04] hover:text-fg",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="min-w-0 xl:grid xl:grid-cols-[minmax(0,1fr)_190px] xl:gap-10">
          <article className="max-w-[46rem] min-w-0">
            <header>
              <Eyebrow>Legal</Eyebrow>
              <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-[-0.02em] text-fg sm:text-4xl">
                {document.title}
              </h1>
              <p className="mt-3 text-sm text-fg-subtle">
                {site.company.legalName}
                {site.legal.effectiveDate ? (
                  <>
                    {" · "}
                    Effective{" "}
                    <time dateTime={site.legal.effectiveDate}>
                      {formatEffectiveDate(site.legal.effectiveDate)}
                    </time>
                  </>
                ) : null}
              </p>
            </header>

            <div className="mt-10">
              <DocBlocks blocks={document.blocks} />
            </div>
          </article>

          <aside className="hidden xl:block">
            <div className="sticky top-[calc(var(--header-height)+2rem)]">
              <TableOfContents headings={headings} />
            </div>
          </aside>
        </div>
      </div>
    </Container>
  );
}
