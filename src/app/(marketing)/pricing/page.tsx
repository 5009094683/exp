import { Check, Minus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EarlyAccessButton } from "@/components/leads/early-access-button";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqSection, type FaqItem } from "@/components/marketing/faq";
import { Container, Section, SectionHeading } from "@/components/marketing/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { PricingEstimator } from "@/components/marketing/pricing/estimator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { site } from "@/config/site";
import { plans, pricingNotes, usageRates } from "@/content/pricing";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Pricing",
  description: `${site.product.name} pricing: a monthly price per agent with executions included, metered usage beyond that and enterprise licensing for large fleets.`,
  alternates: { canonical: "/pricing" },
};

type Cell = string | boolean;

const comparison: Array<{ group: string; rows: Array<[string, Cell, Cell, Cell]> }> = [
  {
    group: "Platform",
    rows: [
      ["Agents", "Up to 25", "Up to 250", "By license"],
      ["Executions included per agent", "2,500 / month", "5,000 / month", "Custom"],
      ["Orchestration, memory and MCP integrations", true, true, true],
      ["Environments", "Staging and production", "Unlimited", "Unlimited"],
      ["Private connectors for internal systems", false, true, true],
      ["Sandbox capacity", "Shared", "Dedicated", "Dedicated or in your cloud"],
    ],
  },
  {
    group: "Governance",
    rows: [
      ["Policies and approval steps", true, true, true],
      ["Custom roles and approval groups", false, true, true],
      ["Sign-in", "Google and Microsoft", "SAML and SCIM", "SAML and SCIM"],
      ["Audit log retention", "30 days", "1 year", "Custom"],
      ["Streaming audit export", false, true, true],
      ["Customer-managed encryption keys", false, false, true],
    ],
  },
  {
    group: "Deployment and support",
    rows: [
      ["Managed service in a region you choose", true, true, true],
      ["Deployment in your own cloud", false, false, true],
      ["Support", "Email", "Priority", "Named engineer"],
      ["Security review and custom terms", false, false, true],
    ],
  },
];

const faq: FaqItem[] = [
  {
    question: "What counts as an agent?",
    answer:
      "An agent is one deployed agent definition in a workspace. It is counted once, however many times it runs or however many tenants it serves. Drafts that have never been deployed are not counted.",
  },
  { question: "What is an execution?", answer: pricingNotes.execution },
  { question: "Do you charge for model usage?", answer: pricingNotes.models },
  {
    question: "What happens if we go over the included executions?",
    answer: `Additional executions are billed at $${usageRates.executionsPerThousand} per 1,000 at the end of the month. You can set a spending limit so that runs pause instead of going over.`,
  },
  {
    question: "Is there a trial?",
    answer:
      "During early access we work with each team individually. Tell us about your project and we'll agree a pilot that fits.",
  },
  {
    question: "Do you offer annual or volume pricing?",
    answer:
      "Yes. Annual commitments and larger fleets are priced individually. Get in touch and we'll put a proposal together.",
  },
];

function CellValue({ value }: { value: Cell }) {
  if (value === true) {
    return <Check className="mx-auto size-4 text-accent-text" aria-label="Included" />;
  }
  if (value === false) {
    return <Minus className="mx-auto size-4 text-fg-faint" aria-label="Not included" />;
  }
  return <span className="text-fg-muted">{value}</span>;
}

export default function PricingPage() {
  return (
    <>
      <PageHero
        align="center"
        eyebrow="Pricing"
        title="Pay per agent, plus what they run"
        description="A monthly price for each agent with executions included, metered usage beyond that, and an annual license for large fleets."
      >
        <p className="mx-auto mt-8 w-fit animate-fade-up rounded-full border border-line-strong bg-white/[0.04] px-4 py-1.5 text-center text-[13px] text-fg-muted anim-delay-200">
          {pricingNotes.status}
        </p>

        <ul className="mt-12 grid animate-fade-up grid-cols-1 gap-4 anim-delay-300 lg:grid-cols-3">
          {plans.map((plan) => (
            <li
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-surface p-7 text-left edge-highlight md:p-8",
                plan.featured
                  ? "border-accent/50 shadow-[0_0_80px_-30px_var(--accent)]"
                  : "border-line",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-medium text-fg">{plan.name}</h2>
                {plan.featured ? <Badge tone="accent">Most teams start here</Badge> : null}
              </div>
              <p className="mt-2 min-h-12 text-[15px] leading-relaxed text-fg-muted">
                {plan.tagline}
              </p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-tight text-fg">
                  {plan.pricePerAgent === null ? "Custom" : `$${plan.pricePerAgent}`}
                </span>
                {plan.pricePerAgent === null ? null : (
                  <span className="text-sm text-fg-subtle">per agent / month</span>
                )}
              </p>
              <p className="mt-2 text-[13px] text-fg-subtle">
                {plan.pricePerAgent === null
                  ? "Annual license, sized to your fleet"
                  : `Then $${usageRates.executionsPerThousand} per 1,000 additional executions`}
              </p>

              {plan.id === "enterprise" ? (
                <Button asChild variant="secondary" size="lg" className="mt-7">
                  <Link href="/contact">Talk to sales</Link>
                </Button>
              ) : (
                <EarlyAccessButton
                  source={`pricing-${plan.id}`}
                  size="lg"
                  variant={plan.featured ? "primary" : "secondary"}
                  className="mt-7"
                />
              )}

              <ul className="mt-8 space-y-3 border-t border-line pt-7">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-[15px] text-fg-muted">
                    <Check className="mt-1 size-3.5 shrink-0 text-accent-text" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </PageHero>

      <Section>
        <Container>
          <SectionHeading
            className="reveal"
            eyebrow="Usage"
            title="What is metered"
            description="Plans include a pool of executions. Beyond that, you pay for what your agents run."
          />
          <dl className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
            <div className="reveal bg-surface p-7">
              <dt className="text-sm text-fg-muted">Additional executions</dt>
              <dd className="mt-3 text-3xl font-semibold tracking-tight text-fg">
                ${usageRates.executionsPerThousand}
                <span className="ml-2 text-sm font-normal text-fg-subtle">per 1,000</span>
              </dd>
              <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">
                {pricingNotes.execution}
              </p>
            </div>
            <div className="reveal bg-surface p-7">
              <dt className="text-sm text-fg-muted">Sandbox compute</dt>
              <dd className="mt-3 text-3xl font-semibold tracking-tight text-fg">
                ${usageRates.sandboxVcpuHour.toFixed(2)}
                <span className="ml-2 text-sm font-normal text-fg-subtle">per vCPU-hour</span>
              </dd>
              <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">
                Billed by the second for the time agent code actually runs in a sandbox.
              </p>
            </div>
            <div className="reveal bg-surface p-7">
              <dt className="text-sm text-fg-muted">Model usage</dt>
              <dd className="mt-3 text-3xl font-semibold tracking-tight text-fg">
                No markup
                <span className="ml-2 text-sm font-normal text-fg-subtle">bring your own</span>
              </dd>
              <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">
                {pricingNotes.models}
              </p>
            </div>
          </dl>
        </Container>
      </Section>

      <Section tone="subtle" divider id="estimate">
        <Container>
          <SectionHeading
            className="reveal"
            eyebrow="Estimator"
            title="Estimate your monthly cost"
            description="Move the sliders to match your fleet. The estimate picks the plan that fits and shows how the total is made up."
          />
          <div className="reveal mt-12">
            <PricingEstimator />
          </div>
        </Container>
      </Section>

      <Section divider>
        <Container>
          <SectionHeading className="reveal" eyebrow="Compare" title="What each plan includes" />
          <div className="reveal mt-12 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[720px] border-collapse text-left text-[15px]">
              <thead>
                <tr className="border-b border-line bg-surface">
                  <th scope="col" className="w-[40%] px-6 py-4 font-medium text-fg-subtle">
                    <span className="sr-only">Feature</span>
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      scope="col"
                      className="w-[20%] px-4 py-4 text-center font-medium text-fg"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              {comparison.map((section) => (
                <tbody key={section.group}>
                  <tr className="border-b border-line bg-bg-subtle">
                    <th
                      scope="colgroup"
                      colSpan={4}
                      className="px-6 py-3 font-mono text-xs font-normal tracking-[0.14em] text-fg-subtle uppercase"
                    >
                      {section.group}
                    </th>
                  </tr>
                  {section.rows.map(([label, ...cells]) => (
                    <tr key={label} className="border-b border-line last:border-b-0">
                      <th scope="row" className="px-6 py-3.5 font-normal text-fg">
                        {label}
                      </th>
                      {cells.map((cell, index) => (
                        <td key={index} className="px-4 py-3.5 text-center text-sm">
                          <CellValue value={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        </Container>
      </Section>

      <FaqSection items={faq} title="Pricing questions" tone="subtle" />
      <CtaBand
        source="pricing-cta"
        title="Tell us about your fleet"
        description="Share how many agents you plan to run and where, and we'll come back with pricing for your pilot."
      />
    </>
  );
}
