import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EarlyAccessButton } from "@/components/leads/early-access-button";
import {
  Checklist,
  FeatureGrid,
  Highlights,
  LinkCard,
  SplitHero,
} from "@/components/marketing/blocks";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqSection } from "@/components/marketing/faq";
import { Container, Section, SectionHeading } from "@/components/marketing/layout";
import { capabilityVisuals } from "@/components/marketing/visuals/capability-visuals";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { capabilities, getCapability } from "@/content/capabilities";
import { capabilityPages } from "@/content/capability-pages";

export const dynamicParams = false;

export function generateStaticParams() {
  return capabilities.map((capability) => ({ slug: capability.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/platform/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const capability = getCapability(slug);
  if (!capability) return {};

  return {
    title: capability.name,
    description: capabilityPages[capability.slug].metaDescription,
    alternates: { canonical: `/platform/${capability.slug}` },
  };
}

export default async function CapabilityPage({ params }: PageProps<"/platform/[slug]">) {
  const { slug } = await params;
  const capability = getCapability(slug);
  if (!capability) notFound();

  const page = capabilityPages[capability.slug];
  const Visual = capabilityVisuals[capability.slug];
  const others = capabilities.filter((item) => item.slug !== capability.slug);

  return (
    <>
      <SplitHero
        eyebrow={
          <>
            <Link href="/platform" className="transition-colors hover:text-fg">
              Platform
            </Link>{" "}
            / {capability.name}
          </>
        }
        title={page.headline}
        description={page.lede}
        actions={
          <>
            <EarlyAccessButton source={`platform-${capability.slug}`} size="lg" />
            <Button asChild variant="secondary" size="lg">
              <Link href={page.consoleHref}>
                {page.consoleLabel}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </>
        }
        visual={
          capability.slug === "orchestration" ? (
            <div className="rounded-2xl border border-line bg-surface px-4 pt-6 pb-12 edge-highlight sm:px-8">
              <Visual />
            </div>
          ) : (
            <Visual />
          )
        }
        footer={<Highlights items={page.highlights} />}
      />

      <Section>
        <Container>
          <SectionHeading
            className="reveal"
            eyebrow="What you get"
            title={`${capability.name}, built for production`}
          />
          <FeatureGrid features={page.features} className="mt-12" />
        </Container>
      </Section>

      <Section tone="subtle" divider>
        <Container className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div className="space-y-12">
            {page.sections.map((section, index) => (
              <div key={section.title} className="reveal">
                <p className="font-mono text-xs text-fg-subtle">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-fg md:text-3xl">
                  {section.title}
                </h2>
                <p className="mt-4 text-[17px] leading-relaxed text-fg-muted">{section.body}</p>
                <Checklist items={section.points} className="mt-5" />
              </div>
            ))}
          </div>

          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <CodeBlock
              code={page.sample.code}
              language={page.sample.language}
              title={page.sample.filename}
              lineNumbers
              className="reveal"
            />
            <p className="mt-4 text-sm leading-relaxed text-fg-muted">{page.sampleCaption}</p>
            <p className="mt-1.5 text-[13px] text-fg-subtle">
              Preview of the configuration format. Details may change before general availability.
            </p>
          </div>
        </Container>
      </Section>

      <Section divider>
        <Container>
          <SectionHeading
            className="reveal"
            eyebrow="The rest of the platform"
            title="Works with every other building block"
            description="Each capability is useful on its own. Together they give every agent the same foundations."
          />
          <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {others.map((item) => (
              <li key={item.slug} className="reveal">
                <LinkCard
                  href={`/platform/${item.slug}`}
                  icon={item.icon}
                  title={item.name}
                  body={item.summary}
                />
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <FaqSection items={page.faq} title={`${capability.name} questions`} tone="subtle" />
      <CtaBand source={`platform-${capability.slug}-cta`} />
    </>
  );
}
