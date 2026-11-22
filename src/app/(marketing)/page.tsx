import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EarlyAccessButton } from "@/components/leads/early-access-button";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqSection, type FaqItem } from "@/components/marketing/faq";
import {
  CustomersStrip,
  FleetSection,
  HowItWorksSection,
  PlatformSection,
  PricingTeaser,
  ProblemSection,
  ProofSection,
  SecuritySection,
  SolutionsSection,
} from "@/components/marketing/home/sections";
import { Container } from "@/components/marketing/layout";
import { HeroConsole } from "@/components/marketing/visuals/hero-console";
import { Button } from "@/components/ui/button";
import { site } from "@/config/site";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  description: site.product.description,
  path: "/",
});

const faq: FaqItem[] = [
  {
    question: `What is ${site.product.name}?`,
    answer: `${site.product.name} is infrastructure for running autonomous AI agents in production: an orchestration engine, a memory layer, an MCP gateway, a policy engine, an audit log and sandboxed execution, behind one console and API.`,
  },
  {
    question: "Is it available today?",
    answer: `${site.product.name} is in private early access. Teams in the program get their own workspace and work directly with our engineers. The console on this site is a demo that runs on sample data.`,
  },
  {
    question: "Which models and tools does it work with?",
    answer:
      "The platform is model-agnostic: connect the model providers you already use, or a self-hosted endpoint. Agents can call any tool that is exposed through a Model Context Protocol (MCP) server, including servers you run inside your own network.",
  },
  {
    question: "How do you stop an agent from doing something it shouldn't?",
    answer:
      "Every tool call, memory access and model request is checked against policy before it runs. High-risk actions can require approval from a named person or group, and any code an agent writes runs in an isolated sandbox with no credentials and a restricted network.",
  },
  {
    question: "Can we run it in our own cloud?",
    answer:
      "Deployment in your own cloud account or data center is part of the Enterprise plan. Tell us about your requirements when you request access and we'll confirm what is supported today.",
  },
  {
    question: "How is it priced?",
    answer:
      "Per agent per month, with a number of executions included and metered usage beyond that. Enterprise licensing is available for large fleets. The pricing page has the details and an estimator.",
  },
];

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid mask-b-from-30% mask-b-to-85% opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-64 left-1/2 h-[560px] w-[1100px] -translate-x-1/2 rounded-full bg-accent/25 blur-[140px]"
      />

      <Container className="relative pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-4xl text-center">
          <Link
            href="/early-access"
            className="group inline-flex animate-fade-up items-center gap-2.5 rounded-full border border-line-strong bg-white/[0.04] py-1 pr-3 pl-1.5 text-[13px] text-fg-muted transition-colors hover:border-white/25 hover:text-fg"
          >
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent-text">
              Early access
            </span>
            Now accepting requests
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>

          <h1 className="mt-7 animate-fade-up text-gradient text-[2.6rem] leading-[1.04] font-semibold tracking-[-0.035em] anim-delay-75 sm:text-6xl md:text-7xl">
            Run thousands of AI agents.
            <br className="hidden sm:block" /> Keep control of every action.
          </h1>

          <p className="mx-auto mt-7 max-w-2xl animate-fade-up text-lg leading-relaxed text-fg-muted anim-delay-150 md:text-xl">
            {site.product.name} is the operating system for autonomous agents: orchestration,
            memory, MCP integrations, permissions, audit logs and sandboxed execution on one
            platform your security team can sign off on.
          </p>

          <div className="mt-10 flex animate-fade-up flex-wrap items-center justify-center gap-3 anim-delay-200">
            <EarlyAccessButton source="hero" size="lg" />
            <Button asChild variant="secondary" size="lg">
              <Link href="/console">
                Explore the demo console
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <HeroConsole className="mt-16 animate-fade-up anim-delay-300 md:mt-20" />
        <p className="mt-5 text-center text-[13px] text-fg-subtle">
          A run from the demo workspace: an incident investigated, a rollback approved by the
          on-call engineer, recovery verified.
        </p>
      </Container>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <CustomersStrip />
      <ProblemSection />
      <PlatformSection />
      <HowItWorksSection />
      <FleetSection />
      <SolutionsSection />
      <SecuritySection />
      <ProofSection />
      <PricingTeaser />
      <FaqSection
        items={faq}
        description="Short answers to what teams ask first. For anything else, get in touch."
      />
      <CtaBand source="home-cta" />
    </>
  );
}
