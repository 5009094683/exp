import {
  ArrowRight,
  Box,
  Building2,
  Fingerprint,
  Globe,
  Lock,
  Mail,
  Network,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EarlyAccessButton } from "@/components/leads/early-access-button";
import { FeatureGrid, type Feature } from "@/components/marketing/blocks";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqSection, type FaqItem } from "@/components/marketing/faq";
import { Container, Eyebrow, Section, SectionHeading } from "@/components/marketing/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { site } from "@/config/site";
import type { ComplianceStatus } from "@/config/site-schema";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Security",
  description: `How ${site.product.name} keeps autonomous agents constrained, attributed and recorded: least privilege, isolation, audit logs and human approvals.`,
  path: "/security",
});

const principles: Feature[] = [
  {
    icon: ShieldCheck,
    title: "Least privilege by default",
    body: "Agents start with no access. Every tool, memory scope and network destination is granted explicitly.",
  },
  {
    icon: Box,
    title: "Isolation at every boundary",
    body: "Tenants, runs and sandboxes are kept apart, so a problem in one does not spread to another.",
  },
  {
    icon: ScrollText,
    title: "Everything on the record",
    body: "Each action is attributed to an agent, a version and a person, and written to an append-only log.",
  },
  {
    icon: UserCheck,
    title: "People stay in control",
    body: "High-risk actions wait for someone accountable, and any run can be paused or stopped.",
  },
];

const controls: Feature[] = [
  {
    icon: Fingerprint,
    title: "Identity and access",
    body: "Single sign-on through SAML or OpenID Connect, SCIM provisioning, role-based access and scoped, rotatable API keys.",
  },
  {
    icon: Lock,
    title: "Encryption",
    body: "Data is encrypted in transit and at rest. Tool credentials live in a separate vault, and customer-managed keys are available on the Enterprise plan.",
  },
  {
    icon: Building2,
    title: "Tenant isolation",
    body: "Memory, credentials, limits and logs are separated for each tenant, and every run carries the tenant it belongs to.",
  },
  {
    icon: Network,
    title: "Network boundaries",
    body: "Internal systems are reached through an outbound-only connector in your network. Sandboxes have no network access unless you allow specific hosts.",
  },
  {
    icon: Globe,
    title: "Residency and retention",
    body: "Choose the region where run data, memory and logs are stored, and set how long each is kept.",
  },
  {
    icon: Sparkles,
    title: "Model providers",
    body: "Prompts go only to the providers you connect, under your own agreement with them. Your data is not used to train models.",
  },
];

const threats = [
  {
    threat: "Prompt injection",
    control:
      "Policies are enforced outside the model. An injected instruction cannot grant access the agent does not already have.",
  },
  {
    threat: "Excessive agency",
    control: "Per-tool permissions and approval steps limit what an agent can do without a person.",
  },
  {
    threat: "Data exfiltration",
    control:
      "Egress allowlists, redaction rules and policies on external tools keep sensitive data inside the boundary.",
  },
  {
    threat: "Credential leakage",
    control:
      "Credentials are attached to outgoing calls by the gateway and never enter the model's context.",
  },
  {
    threat: "Unsafe code execution",
    control:
      "Agent-written code runs in short-lived sandboxes with no credentials and hard resource limits.",
  },
  {
    threat: "Runaway loops and cost",
    control: "Step limits, rate limits and budgets stop a run before it becomes an incident.",
  },
];

const STATUS: Record<
  ComplianceStatus,
  { label: string; tone: "neutral" | "info" | "success"; note: string }
> = {
  planned: { label: "Planned", tone: "neutral", note: "On the roadmap; work has not started." },
  "in-progress": { label: "In progress", tone: "info", note: "Work is under way." },
  achieved: { label: "Achieved", tone: "success", note: "Complete. Ask us for the report." },
};

export default function SecurityPage() {
  const securityEmail = site.contact.security;

  const faq: FaqItem[] = [
    {
      question: "Do you train models on our data?",
      answer: "No. Your prompts, outputs, memory and logs are used only to run your agents.",
    },
    {
      question: "Which model providers see our data?",
      answer:
        "Only the ones you connect. Each request goes to the provider you chose for that model profile, under your own agreement with that provider.",
    },
    {
      question: "Can we keep data in a specific region?",
      answer:
        "Yes. You choose the region for your workspace, and on the Enterprise plan the platform can run in your own cloud account.",
    },
    {
      question: "How do we report a vulnerability?",
      answer: securityEmail
        ? `Email ${securityEmail} with the details and steps to reproduce. We acknowledge reports and keep you informed while we investigate.`
        : "Use the contact form with the topic Security and include the details and steps to reproduce. We acknowledge reports and keep you informed while we investigate.",
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="Security"
        title="Built so agents can be trusted with real access"
        description={`Agents read data, call APIs and run code. ${site.product.name} is designed so that each of those actions is constrained, attributed and recorded.`}
        actions={
          <>
            <EarlyAccessButton source="security" size="lg" />
            <Button asChild variant="secondary" size="lg">
              <Link href="/platform/permissions">
                How permissions work
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </>
        }
      />

      <Section>
        <Container>
          <SectionHeading
            className="reveal"
            eyebrow="Principles"
            title="Four rules the platform is built around"
          />
          <FeatureGrid features={principles} columns={2} className="mt-12" />
        </Container>
      </Section>

      <Section tone="subtle" divider>
        <Container>
          <SectionHeading
            className="reveal"
            eyebrow="Controls"
            title="How your data is protected"
            description="The controls security teams ask about first, built into the platform."
          />
          <FeatureGrid features={controls} className="mt-12" />
        </Container>
      </Section>

      <Section divider>
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
          <SectionHeading
            className="reveal"
            eyebrow="Agent-specific risks"
            title="Threats that come with autonomy, and what stops them"
            description="Agents introduce risks that ordinary applications do not have. Each one is addressed by a control in the execution path, not by a prompt."
          />
          <dl className="divide-y divide-line border-y border-line">
            {threats.map((item) => (
              <div
                key={item.threat}
                className="reveal grid grid-cols-1 gap-2 py-5 sm:grid-cols-[200px_1fr] sm:gap-8"
              >
                <dt className="flex items-start gap-2.5 font-medium text-fg">
                  <ShieldAlert
                    className="mt-1 size-4 shrink-0 text-accent-text"
                    aria-hidden="true"
                  />
                  {item.threat}
                </dt>
                <dd className="text-[15px] leading-relaxed text-fg-muted">{item.control}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      {site.compliance.length > 0 ? (
        <Section tone="subtle" divider id="compliance">
          <Container>
            <SectionHeading
              className="reveal"
              eyebrow="Compliance"
              title="Where our compliance work stands"
              description="We publish the current state of each framework instead of a wall of badges. This list is updated as the work progresses."
            />
            <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
              {site.compliance.map((item) => (
                <li
                  key={item.id}
                  className="reveal rounded-2xl border border-line bg-surface p-6 edge-highlight md:p-7"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-medium text-fg">{item.name}</h3>
                    <Badge tone={STATUS[item.status].tone}>{STATUS[item.status].label}</Badge>
                  </div>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-fg-muted">
                    {item.description}
                  </p>
                  <p className="mt-4 text-[13px] text-fg-subtle">{STATUS[item.status].note}</p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <Section divider>
        <Container className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="reveal rounded-2xl border border-line bg-surface p-7 edge-highlight md:p-9">
            <Eyebrow>Security reviews</Eyebrow>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-fg">
              Evaluating {site.product.name}?
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
              During an evaluation we walk your security team through the architecture and data
              flows, and answer your questionnaire.
            </p>
            <Button asChild variant="secondary" className="mt-7">
              <Link href="/contact">
                Contact us
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div
            id="disclosure"
            className="reveal scroll-mt-24 rounded-2xl border border-line bg-surface p-7 edge-highlight md:p-9"
          >
            <Eyebrow>Responsible disclosure</Eyebrow>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-fg">
              Found a vulnerability?
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
              Tell us what you found and how to reproduce it. Please give us reasonable time to fix
              an issue before you disclose it publicly.
            </p>
            {securityEmail ? (
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Button asChild variant="secondary">
                  <a href={`mailto:${securityEmail}`}>
                    <Mail aria-hidden="true" />
                    {securityEmail}
                  </a>
                </Button>
                <a
                  href="/.well-known/security.txt"
                  className="font-mono text-[13px] text-fg-subtle underline decoration-line-strong underline-offset-4 transition-colors hover:text-fg"
                >
                  security.txt
                </a>
              </div>
            ) : (
              <Button asChild variant="secondary" className="mt-7">
                <Link href="/contact">
                  Report through the contact form
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            )}
          </div>
        </Container>
      </Section>

      <FaqSection items={faq} title="Security questions" tone="subtle" />
      <CtaBand source="security-cta" />
    </>
  );
}
