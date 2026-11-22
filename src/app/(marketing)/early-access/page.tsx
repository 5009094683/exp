import { BadgeCheck, Boxes, MessagesSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LeadFormCard } from "@/components/leads/lead-form-card";
import { Container, Eyebrow } from "@/components/marketing/layout";
import { Button } from "@/components/ui/button";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Request early access",
  description: `Request early access to ${site.product.name}: a workspace for your team to build, run and govern autonomous AI agents.`,
  alternates: { canonical: "/early-access" },
};

const benefits = [
  {
    icon: Boxes,
    title: "A workspace for your team",
    body: "Build, run and govern agents on your own tools and data, with separate staging and production environments.",
  },
  {
    icon: MessagesSquare,
    title: "Direct access to the engineers",
    body: "Work with the people building the platform and help set its priorities.",
  },
  {
    icon: BadgeCheck,
    title: "Terms that fit a pilot",
    body: "Early-access pricing agreed up front, ahead of general availability.",
  },
];

const steps = [
  {
    title: "We review your request",
    body: "Every submission is read by the team and checked against what the platform supports today.",
  },
  {
    title: "Intro call",
    body: "A short conversation about your use cases, systems and security requirements.",
  },
  {
    title: "Workspace setup",
    body: "We provision your workspace and help you ship your first agent.",
  },
];

export default function EarlyAccessPage() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid mask-b-from-10% mask-b-to-70% opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-56 left-1/4 h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-accent/20 blur-[130px]"
      />

      <Container className="relative grid gap-14 py-16 md:py-24 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div className="lg:pt-4">
          <Eyebrow className="animate-fade-up">Early access</Eyebrow>
          <h1 className="mt-5 animate-fade-up text-gradient text-4xl leading-[1.06] font-semibold tracking-[-0.03em] anim-delay-75 md:text-5xl">
            Request early access
          </h1>
          <p className="mt-5 max-w-lg animate-fade-up text-lg leading-relaxed text-fg-muted anim-delay-150">
            {site.product.name} is opening to a limited number of teams. Tell us what you want to
            build and we&apos;ll follow up about setting up your workspace.
          </p>

          <ul className="mt-12 space-y-7">
            {benefits.map((benefit) => (
              <li key={benefit.title} className="flex gap-4">
                <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-white/[0.03] text-accent-text">
                  <benefit.icon className="size-[18px]" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-medium text-fg">{benefit.title}</h2>
                  <p className="mt-1 text-[15px] leading-relaxed text-fg-muted">{benefit.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-12 border-t border-line pt-10">
            <h2 className="font-mono text-xs tracking-[0.16em] text-fg-subtle uppercase">
              What happens next
            </h2>
            <ol className="mt-6 space-y-5">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-line-strong font-mono text-[11px] text-fg-muted">
                    {index + 1}
                  </span>
                  <p className="text-[15px] leading-relaxed text-fg-muted">
                    <span className="font-medium text-fg">{step.title}.</span> {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="animate-fade-up self-start rounded-2xl border border-line-strong bg-surface p-6 shadow-2xl edge-highlight shadow-black/40 anim-delay-150 sm:p-8">
          <LeadFormCard
            variant="early-access-full"
            source="early-access-page"
            sourceFromQuery
            successTitle="Request received"
            successAction={
              <Button asChild variant="secondary">
                <Link href="/console">Explore the demo console</Link>
              </Button>
            }
          />
        </div>
      </Container>
    </section>
  );
}
