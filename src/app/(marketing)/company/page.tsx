import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { EarlyAccessButton } from "@/components/leads/early-access-button";
import { CtaBand } from "@/components/marketing/cta-band";
import { InlineAddress } from "@/components/marketing/inline-address";
import { Container, Eyebrow, Section, SectionHeading } from "@/components/marketing/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { Button } from "@/components/ui/button";
import { site } from "@/config/site";
import { pageMetadata } from "@/lib/metadata";
import { telHref } from "@/lib/phone";

export const metadata: Metadata = pageMetadata({
  title: "Company",
  description: `${site.company.name} builds ${site.product.name}, the infrastructure that lets companies trust autonomous AI agents with real work.`,
  path: "/company",
});

const principles = [
  {
    title: "Control comes before capability",
    body: "An agent that can do more is only useful if you can limit what it does. We build the limits first.",
  },
  {
    title: "Explain every action",
    body: "If the platform cannot show why something happened, we treat that as a bug.",
  },
  {
    title: "Boring on purpose",
    body: "Infrastructure should be predictable. We choose proven patterns over clever ones.",
  },
  {
    title: "Open standards",
    body: "We build on the Model Context Protocol and plain configuration files, so you are never locked into our way of connecting tools.",
  },
  {
    title: "Evidence, not claims",
    body: "We show where our security and compliance work stands instead of asking for trust.",
  },
];

const factLink =
  "underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-fg";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function CompanyPage() {
  const { company, product, proof } = site;
  const { phone } = site.contact;
  const facts: Array<{ label: string; value: ReactNode }> = [
    // Without a configured legal name this is the trading name, so it is not called one.
    {
      label: company.legalName === company.name ? "Company" : "Legal name",
      value: company.legalName,
    },
    ...(company.foundedYear ? [{ label: "Founded", value: String(company.foundedYear) }] : []),
    ...(company.registration ? [{ label: "Registration", value: company.registration }] : []),
    ...(company.addressLines.length > 0
      ? [{ label: "Address", value: <InlineAddress lines={company.addressLines} /> }]
      : []),
    ...(phone
      ? [
          {
            label: "Phone",
            value: (
              <a href={telHref(phone)} className={factLink}>
                {phone}
              </a>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHero
        eyebrow="Company"
        title="Infrastructure for companies that put agents to work"
        description={`${company.name} builds ${product.name}, the operating layer that lets organizations run autonomous agents against real systems and stay in control of what they do.`}
        actions={
          <>
            <EarlyAccessButton source="company" size="lg" />
            <Button asChild variant="secondary" size="lg">
              <Link href="/contact">Get in touch</Link>
            </Button>
          </>
        }
      />

      <Section>
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <SectionHeading
            className="reveal"
            eyebrow="Why we exist"
            title="The limit is no longer what agents can do"
          />
          <div className="reveal space-y-6 text-lg leading-relaxed text-fg-muted">
            <p>
              Models can now plan, use tools and work for hours without supervision. What holds
              companies back is no longer capability. It is whether anyone can say what an agent is
              allowed to do, prove what it did, and stop it when something goes wrong.
            </p>
            <p>
              Every earlier wave of software needed the same thing before it reached production at
              scale: an operating layer that handles scheduling, isolation, access control and
              record keeping, so that application teams do not have to. Agents need that layer too.
            </p>
            <p className="text-fg">
              {product.name} is that layer. We are building it together with a small group of
              early-access teams who run agents against real systems.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="subtle" divider>
        <Container>
          <SectionHeading className="reveal" eyebrow="Principles" title="How we make decisions" />
          <ol className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
            {principles.map((principle, index) => (
              <li key={principle.title} className="reveal bg-surface p-7">
                <p className="font-mono text-xs text-accent-text">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 text-lg font-medium text-fg">{principle.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{principle.body}</p>
              </li>
            ))}
            <li className="reveal flex flex-col justify-between bg-surface p-7">
              <p className="text-[15px] leading-relaxed text-fg-muted">
                See these principles in the product: open the demo console and follow a run from
                trigger to audit record.
              </p>
              <Button asChild variant="secondary" className="mt-6 self-start">
                <Link href="/console">
                  Open the demo console
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </li>
          </ol>
        </Container>
      </Section>

      {proof.team.length > 0 ? (
        <Section divider>
          <Container>
            <SectionHeading className="reveal" eyebrow="Team" title="The people behind it" />
            <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {proof.team.map((member) => (
                <li
                  key={member.name}
                  className="reveal rounded-2xl border border-line bg-surface p-6 edge-highlight"
                >
                  <span className="inline-flex size-12 items-center justify-center rounded-full border border-line-strong bg-white/[0.04] font-mono text-sm text-fg-muted">
                    {initials(member.name)}
                  </span>
                  <h3 className="mt-5 font-medium text-fg">{member.name}</h3>
                  <p className="mt-1 text-sm text-fg-muted">{member.role}</p>
                  {member.url ? (
                    <a
                      href={member.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-1 text-[13px] text-fg-subtle transition-colors hover:text-fg"
                    >
                      Profile
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {proof.backers.length > 0 ? (
        <Section tone="subtle" divider>
          <Container className="flex flex-col gap-8 md:flex-row md:items-center md:gap-16">
            <Eyebrow className="shrink-0">Backed by</Eyebrow>
            <ul className="flex flex-wrap items-center gap-x-12 gap-y-4">
              {proof.backers.map((backer) => (
                <li key={backer} className="text-xl font-semibold tracking-tight text-fg-muted">
                  {backer}
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <Section divider>
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div className="reveal">
            <SectionHeading
              eyebrow="Where we are"
              title="Private early access"
              description={`${product.name} is open to a limited number of teams while we build with them. If you run agents in production, or are about to, we would like to hear from you.`}
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/early-access">
                  About early access
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              {site.links.careers ? (
                <Button asChild variant="ghost">
                  <a href={site.links.careers} target="_blank" rel="noreferrer">
                    Open roles
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <dl className="reveal divide-y divide-line self-start rounded-2xl border border-line bg-surface">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="grid grid-cols-1 gap-1 px-6 py-4 sm:grid-cols-[160px_1fr] sm:gap-6"
              >
                <dt className="text-sm text-fg-subtle">{fact.label}</dt>
                <dd className="text-[15px] text-fg">{fact.value}</dd>
              </div>
            ))}
            <div className="grid grid-cols-1 gap-1 px-6 py-4 sm:grid-cols-[160px_1fr] sm:gap-6">
              <dt className="text-sm text-fg-subtle">Contact</dt>
              <dd className="text-[15px] text-fg">
                {site.contact.email ? (
                  <a href={`mailto:${site.contact.email}`} className={factLink}>
                    {site.contact.email}
                  </a>
                ) : (
                  <Link href="/contact" className={factLink}>
                    Contact form
                  </Link>
                )}
              </dd>
            </div>
          </dl>
        </Container>
      </Section>

      <CtaBand source="company-cta" />
    </>
  );
}
