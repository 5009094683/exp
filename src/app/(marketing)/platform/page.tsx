import { ArrowRight, Braces, Cloud, Plug, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EarlyAccessButton } from "@/components/leads/early-access-button";
import { Checklist, FeatureGrid } from "@/components/marketing/blocks";
import { CtaBand } from "@/components/marketing/cta-band";
import { Container, Eyebrow, Section, SectionHeading } from "@/components/marketing/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { ArchitectureDiagram } from "@/components/marketing/visuals/architecture";
import { capabilityVisuals } from "@/components/marketing/visuals/capability-visuals";
import { Button } from "@/components/ui/button";
import { site } from "@/config/site";
import { capabilities } from "@/content/capabilities";
import { capabilityPages } from "@/content/capability-pages";
import { cn } from "@/lib/cn";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Platform",
  description: `How ${site.product.name} works: orchestration, memory, MCP integrations, permissions, audit logs and sandboxed execution behind one control plane.`,
  path: "/platform",
});

const openness = [
  {
    icon: Sparkles,
    title: "Model-agnostic",
    body: "Connect the model providers you already use, or a self-hosted endpoint. Agents ask for a profile such as fast, balanced or reasoning, and you decide which model serves it.",
  },
  {
    icon: Plug,
    title: "Built on MCP",
    body: "Tools are connected through the Model Context Protocol, an open standard. Anything with an MCP server works, including servers you write yourself.",
  },
  {
    icon: Braces,
    title: "API-first",
    body: "Everything the console does is available through the API, so agents can live inside your own product and your own pipelines.",
  },
  {
    icon: Cloud,
    title: "Deploy your way",
    body: "Use the managed service in the region you choose, or run the platform in your own cloud on the Enterprise plan.",
  },
];

const lifecycle = [
  {
    title: "Build",
    body: "Describe the agent, its tools and its limits in a manifest. Keep it in version control.",
  },
  {
    title: "Test",
    body: "Replay recorded runs against a new version and check policies in monitor mode.",
  },
  {
    title: "Deploy",
    body: "Promote through staging to production, to a slice of traffic first.",
  },
  {
    title: "Operate",
    body: "Follow every run step by step. Set quotas, budgets and alerts for the fleet.",
  },
  {
    title: "Govern",
    body: "Review access, approvals and the audit log. Export evidence when you need it.",
  },
];

export default function PlatformPage() {
  return (
    <>
      <PageHero
        align="center"
        eyebrow="Platform"
        title="One platform for the whole agent lifecycle"
        description={`${site.product.name} sits between your agents and everything they touch. It runs them, connects them to tools, checks every action against policy and keeps the record.`}
        actions={
          <>
            <EarlyAccessButton source="platform" size="lg" />
            <Button asChild variant="secondary" size="lg">
              <Link href="/console">
                Explore the demo console
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </>
        }
      >
        <ArchitectureDiagram className="mx-auto mt-16 max-w-5xl animate-fade-up anim-delay-300" />
      </PageHero>

      <Section>
        <Container>
          <SectionHeading
            className="reveal"
            eyebrow="Building blocks"
            title="Six capabilities that every production agent needs"
            description="Use them together from day one, or adopt them one at a time next to what you already run."
          />

          <div className="mt-16 space-y-20 md:space-y-28">
            {capabilities.map((capability, index) => {
              const page = capabilityPages[capability.slug];
              const Visual = capabilityVisuals[capability.slug];
              const reversed = index % 2 === 1;

              return (
                <article
                  key={capability.slug}
                  className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20"
                >
                  <div className={cn("reveal min-w-0", reversed && "lg:order-2")}>
                    <Eyebrow className="flex items-center gap-2.5">
                      <capability.icon className="size-4" aria-hidden="true" />
                      {capability.name}
                    </Eyebrow>
                    <h3 className="mt-4 text-2xl leading-tight font-semibold tracking-tight text-fg md:text-[2rem]">
                      {page.headline}
                    </h3>
                    <p className="mt-4 text-[17px] leading-relaxed text-fg-muted">{page.lede}</p>
                    <Checklist items={page.highlights} className="mt-6" />
                    <Button asChild variant="secondary" className="mt-8">
                      <Link href={`/platform/${capability.slug}`}>
                        More on {capability.name.toLowerCase()}
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                  <div className={cn("reveal min-w-0", reversed && "lg:order-1")}>
                    {capability.slug === "orchestration" ? (
                      <div className="rounded-2xl border border-line bg-surface px-4 pt-6 pb-12 edge-highlight sm:px-8">
                        <Visual />
                      </div>
                    ) : (
                      <Visual />
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section tone="subtle" divider>
        <Container>
          <SectionHeading
            className="reveal"
            eyebrow="Open by design"
            title="Fits the stack you already have"
            description="No required model, framework or cloud. The platform governs how agents run, not how you build them."
          />
          <FeatureGrid features={openness} columns={2} className="mt-12" />
        </Container>
      </Section>

      <Section divider>
        <Container>
          <SectionHeading
            className="reveal"
            eyebrow="Lifecycle"
            title="From first draft to a governed fleet"
          />
          <ol className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
            {lifecycle.map((step, index) => (
              <li key={step.title} className="reveal bg-bg p-6">
                <p className="font-mono text-xs text-accent-text">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 text-lg font-medium text-fg">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <CtaBand source="platform-cta" />
    </>
  );
}
