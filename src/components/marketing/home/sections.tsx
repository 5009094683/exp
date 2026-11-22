import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileSearch,
  Fingerprint,
  Gauge,
  GitBranch,
  Globe,
  KeyRound,
  Layers,
  Lock,
  Network,
  ScrollText,
  ShieldAlert,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Container, Eyebrow, Section, SectionHeading } from "@/components/marketing/layout";
import { capabilityVisuals } from "@/components/marketing/visuals/capability-visuals";
import { FleetGrid } from "@/components/marketing/visuals/fleet-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { buildTime } from "@/config/build";
import { site } from "@/config/site";
import type { ComplianceStatus } from "@/config/site-schema";
import { capabilities, type CapabilitySlug } from "@/content/capabilities";
import { plans, pricingNotes } from "@/content/pricing";
import {
  agentManifest,
  auditEventSample,
  integrationManifest,
  policyManifest,
} from "@/content/samples";
import { solutions } from "@/content/solutions";
import { cn } from "@/lib/cn";
import { HowItWorks } from "./how-it-works";

/* ------------------------------------------------------------------------- */

/** Customer names, shown only when SITE_CUSTOMERS is set. */
export function CustomersStrip() {
  const { customers } = site.proof;
  if (customers.length === 0) return null;

  return (
    <section className="border-y border-line bg-bg-subtle">
      <Container className="flex flex-col items-center gap-6 py-10 md:flex-row md:gap-12">
        <p className="shrink-0 font-mono text-xs tracking-[0.16em] text-fg-subtle uppercase">
          Trusted by teams at
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 md:justify-start">
          {customers.map((customer) => (
            <li key={customer} className="text-lg font-semibold tracking-tight text-fg-muted">
              {customer}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------------- */

const problems: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: KeyRound,
    title: "Access that is far too broad",
    body: "Agents run on shared API keys and can reach much more than the task in front of them requires.",
  },
  {
    icon: FileSearch,
    title: "No record of what happened",
    body: "When an agent takes an action, nobody can say which prompt, tool call or approval led to it.",
  },
  {
    icon: TriangleAlert,
    title: "Fine for ten, fragile at a thousand",
    body: "Retries, rate limits, long waits and partial failures turn a working demo into an on-call problem.",
  },
];

export function ProblemSection() {
  return (
    <Section divider>
      <Container>
        <SectionHeading
          className="reveal"
          eyebrow="The gap"
          title="Agents are easy to demo. Operating them is the hard part."
          description="A prototype needs a model and a prompt. A fleet in production needs what every other production system has: scheduling, isolation, access control and a record of what happened."
        />
        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {problems.map((problem) => (
            <li key={problem.title} className="reveal bg-bg p-7 md:p-8">
              <problem.icon className="size-5 text-accent-text" aria-hidden="true" />
              <h3 className="mt-5 text-lg font-medium tracking-tight text-fg">{problem.title}</h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-fg-muted">{problem.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------------- */

const bentoLayout: Record<CapabilitySlug, { span: string; description: string }> = {
  orchestration: {
    span: "lg:col-span-7",
    description:
      "Every agent runs as a durable workflow. Steps are checkpointed, failures retry from where they stopped, and a run can wait days for an approval without holding a server open.",
  },
  permissions: {
    span: "lg:col-span-5",
    description:
      "Each tool call is checked against policy before it runs. Allow it, block it, or route it to the person who has to sign off.",
  },
  integrations: {
    span: "lg:col-span-4",
    description:
      "Register an MCP server once. Decide which agents can call which tools, and with whose credentials.",
  },
  memory: {
    span: "lg:col-span-4",
    description:
      "Context that outlives a run, kept in scopes with their own retention, redaction and tenant isolation.",
  },
  sandboxes: {
    span: "lg:col-span-4",
    description:
      "Agent-written code runs in a short-lived sandbox with no credentials, a restricted network and hard limits.",
  },
  "audit-logs": {
    span: "lg:col-span-12",
    description:
      "Prompts, decisions, tool calls and approvals are recorded with who or what started them, in a hash-chained log you can search and export.",
  },
};

const bentoOrder: CapabilitySlug[] = [
  "orchestration",
  "permissions",
  "integrations",
  "memory",
  "sandboxes",
  "audit-logs",
];

export function PlatformSection() {
  return (
    <Section tone="subtle" divider id="platform">
      <Container>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            className="reveal"
            eyebrow="The platform"
            title="Six building blocks, one control plane"
            description={`${site.product.name} gives every agent the same foundations, so teams ship agents without rebuilding infrastructure each time.`}
          />
          <Button asChild variant="secondary" className="reveal shrink-0 self-start md:self-auto">
            <Link href="/platform">
              Platform overview
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {bentoOrder.map((slug) => {
            const capability = capabilities.find((item) => item.slug === slug);
            if (!capability) return null;
            const Visual = capabilityVisuals[slug];
            const wide = slug === "audit-logs";

            return (
              <li key={slug} className={cn("reveal min-w-0", bentoLayout[slug].span)}>
                <Link
                  href={`/platform/${slug}`}
                  className={cn(
                    "group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface edge-highlight transition-colors hover:border-line-strong",
                    wide && "lg:flex-row lg:items-center",
                  )}
                >
                  <div className={cn("p-7", wide && "lg:w-[38%] lg:shrink-0 lg:p-9")}>
                    <span className="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-accent-text">
                      <capability.icon className="size-[18px]" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 flex items-center gap-1.5 text-xl font-medium tracking-tight text-fg">
                      {capability.name}
                      <ArrowUpRight
                        className="size-4 text-fg-subtle opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </h3>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-fg-muted">
                      {bentoLayout[slug].description}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "mt-auto min-w-0 px-7 pb-7",
                      wide && "lg:mt-0 lg:flex-1 lg:py-7 lg:pr-9 lg:pl-0",
                      slug === "orchestration" && "px-4 pt-2 pb-10 sm:px-7",
                    )}
                  >
                    <Visual />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------------- */

export function HowItWorksSection() {
  const audit = auditEventSample(new Date(buildTime));
  const steps = [
    {
      id: "define",
      label: "Define",
      title: "Describe the agent",
      body: "Declare the model profile, triggers, tools and limits in a manifest you keep in version control.",
      sample: agentManifest,
    },
    {
      id: "connect",
      label: "Connect",
      title: "Connect tools over MCP",
      body: "Register an MCP server once and set what each of its tools is allowed to do.",
      sample: integrationManifest,
    },
    {
      id: "govern",
      label: "Govern",
      title: "Write the rules",
      body: "Policies decide what runs on its own, what needs a person and what never happens.",
      sample: policyManifest,
    },
    {
      id: "observe",
      label: "Observe",
      title: "See every action",
      body: "Each decision, call and approval lands in an audit log you can search, export and stream.",
      sample: audit,
    },
  ];

  return (
    <Section divider>
      <Container>
        <SectionHeading
          className="reveal"
          eyebrow="How it works"
          title="From manifest to governed production in four steps"
          description="Agents, integrations and policies are plain files. Review them in pull requests and promote them through environments like any other change."
        />
        <div className="reveal mt-14">
          <HowItWorks
            steps={steps.map((step) => ({
              id: step.id,
              label: step.label,
              title: step.title,
              body: step.body,
              sample: (
                <CodeBlock
                  code={step.sample.code}
                  language={step.sample.language}
                  title={step.sample.filename}
                  lineNumbers
                />
              ),
            }))}
          />
        </div>
        <p className="reveal mt-6 text-[13px] text-fg-subtle">
          Preview of the configuration format. Details may change before general availability.
        </p>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------------- */

const fleetPoints: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Layers,
    title: "Tenant isolation",
    body: "Run one agent for each customer with separate memory, credentials and limits.",
  },
  {
    icon: GitBranch,
    title: "Versioned rollouts",
    body: "Ship a new version to a slice of traffic, compare, then promote or roll back.",
  },
  {
    icon: Gauge,
    title: "Quotas and budgets",
    body: "Cap concurrency, call rates and spend per agent, team or tenant.",
  },
  {
    icon: Network,
    title: "Environments",
    body: "Keep staging and production apart, each with its own integrations and policies.",
  },
];

export function FleetSection() {
  return (
    <Section tone="subtle" divider>
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-end lg:gap-20">
          <SectionHeading
            className="reveal"
            eyebrow="Fleet operations"
            title="Built for fleets, not single agents"
            description="Operate thousands of agents the way you operate services, with one place to see what each of them is doing right now."
          />
          <FleetGrid className="reveal" />
        </div>
        <ul className="mt-14 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {fleetPoints.map((point) => (
            <li key={point.title} className="reveal border-t border-line pt-6">
              <point.icon className="size-5 text-accent-text" aria-hidden="true" />
              <h3 className="mt-4 font-medium text-fg">{point.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{point.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------------- */

const solutionPoints: Record<string, string[]> = {
  enterprise: [
    "Central policies across every team",
    "Single sign-on and role-based access",
    "Audit evidence for security reviews",
  ],
  saas: [
    "One isolated agent per customer",
    "Usage metering you can bill on",
    "Agents inside your own product",
  ],
  agencies: [
    "Separate workspaces for each client",
    "Reusable agent templates",
    "Usage reports per client",
  ],
};

export function SolutionsSection() {
  return (
    <Section divider>
      <Container>
        <SectionHeading
          className="reveal"
          eyebrow="Who it's for"
          title="One platform, three ways to use it"
        />
        <ul className="mt-14 grid gap-4 lg:grid-cols-3">
          {solutions.map((solution) => (
            <li key={solution.slug} className="reveal">
              <Link
                href={`/solutions/${solution.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-7 edge-highlight transition-colors hover:border-line-strong md:p-8"
              >
                <solution.icon className="size-6 text-accent-text" aria-hidden="true" />
                <h3 className="mt-6 text-xl font-medium tracking-tight text-fg">{solution.name}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{solution.summary}</p>
                <ul className="mt-6 space-y-2.5 border-t border-line pt-6">
                  {solutionPoints[solution.slug].map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[15px] text-fg-muted">
                      <Check
                        className="mt-1 size-3.5 shrink-0 text-accent-text"
                        aria-hidden="true"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
                <span className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-fg">
                  Learn more
                  <ArrowRight
                    className="size-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------------- */

const securityPoints: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Fingerprint,
    title: "Single sign-on and SCIM",
    body: "Sign in through your identity provider and manage membership from it.",
  },
  {
    icon: Users,
    title: "Role-based access",
    body: "Decide who can build, deploy, approve and administer, per environment.",
  },
  {
    icon: Lock,
    title: "Encryption everywhere",
    body: "Data is encrypted in transit and at rest; credentials live in a separate vault.",
  },
  {
    icon: Globe,
    title: "Data residency",
    body: "Choose the region where run data, memory and logs are stored.",
  },
  {
    icon: Network,
    title: "Private connectivity",
    body: "Reach internal systems through a connector inside your own network.",
  },
  {
    icon: ScrollText,
    title: "Audit export",
    body: "Stream every event to your SIEM or data lake as it happens.",
  },
];

const COMPLIANCE_LABELS: Record<
  ComplianceStatus,
  { label: string; tone: "neutral" | "info" | "success" }
> = {
  planned: { label: "Planned", tone: "neutral" },
  "in-progress": { label: "In progress", tone: "info" },
  achieved: { label: "Achieved", tone: "success" },
};

export function SecuritySection() {
  return (
    <Section tone="subtle" divider>
      <Container>
        <div className="grid gap-14 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
          <div className="reveal">
            <Eyebrow>Security</Eyebrow>
            <h2 className="mt-4 text-3xl leading-[1.1] font-semibold tracking-[-0.025em] text-fg md:text-[2.75rem]">
              Controls your security team will recognize
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-fg-muted">
              Agents act with real access to real systems. {site.product.name} applies the same
              controls you expect of any production platform, in the path of every action.
            </p>
            <Button asChild variant="secondary" className="mt-8">
              <Link href="/security">
                How we approach security
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>

            {site.compliance.length > 0 ? (
              <div className="mt-10 border-t border-line pt-8">
                <p className="flex items-center gap-2 font-mono text-xs tracking-[0.16em] text-fg-subtle uppercase">
                  <ShieldAlert className="size-3.5" aria-hidden="true" />
                  Compliance roadmap
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {site.compliance.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-2.5 rounded-lg border border-line bg-surface py-1.5 pr-2 pl-3 text-sm text-fg"
                    >
                      {item.name}
                      <Badge tone={COMPLIANCE_LABELS[item.status].tone} size="sm">
                        {COMPLIANCE_LABELS[item.status].label}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {securityPoints.map((point) => (
              <li key={point.title} className="reveal bg-surface p-6 md:p-7">
                <point.icon className="size-5 text-accent-text" aria-hidden="true" />
                <h3 className="mt-4 font-medium text-fg">{point.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-fg-muted">{point.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------------- */

/** Stats and testimonials, shown only when real ones are configured. */
export function ProofSection() {
  const { stats, testimonials } = site.proof;
  if (stats.length === 0 && testimonials.length === 0) return null;

  return (
    <Section divider>
      <Container>
        {stats.length > 0 ? (
          <dl className="reveal grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-bg p-7">
                <dd className="text-4xl font-semibold tracking-tight text-fg">{stat.value}</dd>
                <dt className="mt-2 text-[15px] text-fg-muted">{stat.label}</dt>
              </div>
            ))}
          </dl>
        ) : null}

        {testimonials.length > 0 ? (
          <ul className={cn("grid gap-4 md:grid-cols-2", stats.length > 0 && "mt-10")}>
            {testimonials.map((testimonial) => (
              <li
                key={testimonial.quote}
                className="reveal rounded-2xl border border-line bg-surface p-7 edge-highlight md:p-8"
              >
                <blockquote className="text-lg leading-relaxed text-fg">
                  “{testimonial.quote}”
                </blockquote>
                <p className="mt-6 text-sm text-fg-muted">
                  <span className="font-medium text-fg">{testimonial.name}</span>
                  {testimonial.title ? `, ${testimonial.title}` : ""}
                  {testimonial.company ? ` · ${testimonial.company}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------------- */

export function PricingTeaser() {
  return (
    <Section divider>
      <Container>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            className="reveal"
            eyebrow="Pricing"
            title="Pay per agent, plus what they run"
            description="A monthly price for each agent with executions included, metered usage beyond that, and licensing for large fleets."
          />
          <Button asChild variant="secondary" className="reveal shrink-0 self-start md:self-auto">
            <Link href="/pricing">
              See pricing
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {plans.map((plan) => (
            <li key={plan.id} className="reveal bg-surface p-7 md:p-8">
              <h3 className="font-medium text-fg">{plan.name}</h3>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight text-fg">
                  {plan.pricePerAgent === null ? "Custom" : `$${plan.pricePerAgent}`}
                </span>
                {plan.pricePerAgent === null ? null : (
                  <span className="text-sm text-fg-subtle">per agent / month</span>
                )}
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">{plan.tagline}</p>
            </li>
          ))}
        </ul>
        <p className="reveal mt-6 text-[13px] text-fg-subtle">{pricingNotes.status}</p>
      </Container>
    </Section>
  );
}
