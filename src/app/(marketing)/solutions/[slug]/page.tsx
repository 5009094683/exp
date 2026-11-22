import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EarlyAccessButton } from "@/components/leads/early-access-button";
import { Checklist, FeatureGrid, LinkCard, SplitHero } from "@/components/marketing/blocks";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqSection } from "@/components/marketing/faq";
import { Container, Eyebrow, Section, SectionHeading } from "@/components/marketing/layout";
import { capabilityVisuals } from "@/components/marketing/visuals/capability-visuals";
import { AgentStatusBadge } from "@/components/product/status";
import { Button } from "@/components/ui/button";
import { getCapability } from "@/content/capabilities";
import { solutionPages } from "@/content/solution-pages";
import { getSolution, solutions } from "@/content/solutions";
import { getAgent } from "@/demo/agents";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return solutions.map((solution) => ({ slug: solution.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/solutions/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const solution = getSolution(slug);
  if (!solution) return {};

  return pageMetadata({
    title: `For ${solution.name.toLowerCase()}`,
    description: solutionPages[solution.slug].metaDescription,
    path: `/solutions/${solution.slug}`,
  });
}

export default async function SolutionPage({ params }: PageProps<"/solutions/[slug]">) {
  const { slug } = await params;
  const solution = getSolution(slug);
  if (!solution) notFound();

  const page = solutionPages[solution.slug];
  const Visual = capabilityVisuals[page.visual];

  return (
    <>
      <SplitHero
        eyebrow={`Solutions / ${solution.name}`}
        title={page.headline}
        description={page.lede}
        actions={
          <>
            <EarlyAccessButton source={`solutions-${solution.slug}`} size="lg" />
            <Button asChild variant="secondary" size="lg">
              <Link href="/contact">Talk to the team</Link>
            </Button>
          </>
        }
        visual={<Visual />}
      />

      <Section>
        <Container>
          <SectionHeading
            className="reveal"
            eyebrow="Where teams get stuck"
            title="The agent is the easy part"
          />
          <ol className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
            {page.challenges.map((challenge, index) => (
              <li key={challenge.title} className="reveal bg-bg p-7 md:p-8">
                <p className="font-mono text-xs text-fg-subtle">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 text-lg font-medium tracking-tight text-fg">
                  {challenge.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-fg-muted">{challenge.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="subtle" divider>
        <Container>
          <SectionHeading
            className="reveal"
            eyebrow="What changes"
            title={`What ${solution.name.toLowerCase()} get from the platform`}
          />
          <FeatureGrid features={page.outcomes} className="mt-12" />
        </Container>
      </Section>

      <Section divider>
        <Container>
          <SectionHeading
            className="reveal"
            eyebrow="Example agents"
            title="See them in the demo console"
            description="Each of these runs in the demo workspace on sample data. Open one to see its configuration, tools, policies and recent runs."
          />
          <ul className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {page.examples.map((example) => {
              const agent = getAgent(example.agent);
              if (!agent) return null;
              return (
                <li key={example.agent} className="reveal">
                  <Link
                    href={`/console/agents/${agent.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-7 edge-highlight transition-colors hover:border-line-strong"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Eyebrow className="text-fg-subtle">{example.title}</Eyebrow>
                      <AgentStatusBadge status={agent.status} size="sm" />
                    </div>
                    <h3 className="mt-5 flex items-center gap-1.5 text-xl font-medium tracking-tight text-fg">
                      {agent.name}
                      <ArrowUpRight
                        className="size-4 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </h3>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-fg-muted">
                      {example.body}
                    </p>
                    <p className="mt-auto pt-6 font-mono text-[11px] text-fg-subtle">
                      {agent.triggers[0].label}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      <Section tone="subtle" divider>
        <Container className="grid grid-cols-1 gap-14 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div>
            <SectionHeading
              className="reveal"
              eyebrow="Start here"
              title="The building blocks that matter most"
            />
            <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {page.capabilities.map((item) => {
                const capability = getCapability(item.slug);
                if (!capability) return null;
                return (
                  <li key={item.slug} className="reveal">
                    <LinkCard
                      href={`/platform/${capability.slug}`}
                      icon={capability.icon}
                      title={capability.name}
                      body={item.why}
                    />
                  </li>
                );
              })}
            </ul>
          </div>

          <aside className="reveal self-start rounded-2xl border border-line-strong bg-surface p-7 edge-highlight md:p-8">
            <Eyebrow>Commercials</Eyebrow>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-fg">
              {page.buying.title}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">{page.buying.body}</p>
            <Checklist items={page.buying.points} className="mt-6" />
            <Button asChild variant="secondary" className="mt-8">
              <Link href="/pricing">
                See pricing
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </aside>
        </Container>
      </Section>

      <FaqSection items={page.faq} />
      <CtaBand source={`solutions-${solution.slug}-cta`} />
    </>
  );
}
