import { ArrowLeft, ArrowRight, FlaskConical } from "lucide-react";
import Link from "next/link";
import { EarlyAccessButton } from "@/components/leads/early-access-button";
import { Eyebrow } from "@/components/marketing/layout";
import { site } from "@/config/site";
import { docsHref, docsNav, docsPages } from "@/content/docs/nav";
import type { DocPage } from "@/content/docs/types";
import { DocBlocks } from "./blocks";
import { TableOfContents } from "./toc";

function PagerLink({
  page,
  direction,
}: {
  page: { slug: string; title: string };
  direction: "previous" | "next";
}) {
  const next = direction === "next";
  return (
    <Link
      href={docsHref(page.slug)}
      rel={next ? "next" : "prev"}
      className={`group flex min-w-0 flex-col rounded-xl border border-line bg-surface px-4 py-3 transition-colors hover:border-line-strong hover:bg-surface-2 ${next ? "items-end text-right sm:col-start-2" : ""}`}
    >
      <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
        {next ? null : <ArrowLeft className="size-3" aria-hidden="true" />}
        {next ? "Next" : "Previous"}
        {next ? <ArrowRight className="size-3" aria-hidden="true" /> : null}
      </span>
      <span className="mt-1 max-w-full truncate text-sm font-medium text-fg">{page.title}</span>
    </Link>
  );
}

export function DocsArticle({ page }: { page: DocPage }) {
  const index = docsPages.findIndex((candidate) => candidate.slug === page.slug);
  const previous = index > 0 ? docsPages[index - 1] : undefined;
  const next = index < docsPages.length - 1 ? docsPages[index + 1] : undefined;
  const group = docsNav.find((candidate) =>
    candidate.items.some((item) => item.slug === page.slug),
  );
  const headings = page.blocks.flatMap((block) =>
    block.type === "h2" ? [{ id: block.id, text: block.text }] : [],
  );

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_190px] xl:gap-10">
      <article className="max-w-[46rem] min-w-0">
        <header>
          {group ? <Eyebrow>{group.title}</Eyebrow> : null}
          <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-[-0.02em] text-fg sm:text-4xl">
            {page.title}
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-fg-muted">{page.description}</p>
        </header>

        <aside
          aria-label="About this documentation"
          className="mt-8 flex flex-col gap-3 rounded-xl border border-accent/25 bg-accent/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex gap-3 text-[13px] leading-relaxed text-fg-muted">
            <FlaskConical className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden="true" />
            <span>
              <strong className="font-medium text-fg">Preview documentation.</strong>{" "}
              {site.product.name} is in early access. These pages describe the interface as it is
              designed today, and details may change before general availability.
            </span>
          </p>
          <EarlyAccessButton
            source={`docs:${page.slug || "introduction"}`}
            variant="secondary"
            size="sm"
            className="shrink-0 self-start sm:self-auto"
          >
            Request access
          </EarlyAccessButton>
        </aside>

        <div className="mt-10">
          <DocBlocks blocks={page.blocks} />
        </div>

        <nav
          aria-label="Previous and next page"
          className="mt-14 grid grid-cols-1 gap-3 border-t border-line pt-8 sm:grid-cols-2"
        >
          {previous ? <PagerLink page={previous} direction="previous" /> : null}
          {next ? <PagerLink page={next} direction="next" /> : null}
        </nav>
      </article>

      <aside className="hidden xl:block">
        <div className="sticky top-[calc(var(--header-height)+2rem)]">
          <TableOfContents headings={headings} />
        </div>
      </aside>
    </div>
  );
}
