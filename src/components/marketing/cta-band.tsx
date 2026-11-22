import Link from "next/link";
import type { ReactNode } from "react";
import { EarlyAccessButton } from "@/components/leads/early-access-button";
import { Button } from "@/components/ui/button";
import { site } from "@/config/site";
import { Container } from "./layout";

/** Closing call to action used at the bottom of marketing pages. */
export function CtaBand({
  title = "Put your agents into production with guardrails",
  description,
  source,
}: {
  title?: ReactNode;
  description?: ReactNode;
  /** Recorded with early-access requests started here. */
  source: string;
}) {
  return (
    <section className="relative overflow-hidden border-t border-line">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid mask-radial-from-10% mask-radial-to-70% opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-72 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-accent/25 blur-[140px]"
      />
      <Container className="relative py-24 text-center md:py-32">
        <h2 className="reveal mx-auto max-w-3xl text-gradient text-4xl leading-[1.08] font-semibold tracking-[-0.03em] md:text-6xl">
          {title}
        </h2>
        <p className="reveal mx-auto mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">
          {description ??
            `${site.product.name} is in private early access. Tell us what you want to build and we'll set up a workspace for your team.`}
        </p>
        <div className="reveal mt-10 flex flex-wrap items-center justify-center gap-3">
          <EarlyAccessButton source={source} size="lg" />
          <Button asChild variant="secondary" size="lg">
            <Link href="/contact">Talk to the team</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
