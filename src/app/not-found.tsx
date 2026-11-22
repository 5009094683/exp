import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/marketing/layout";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import type { AppRoute } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

const destinations: Array<{ href: AppRoute; label: string; body: string }> = [
  { href: "/platform", label: "Platform", body: "How the six building blocks fit together." },
  { href: "/console", label: "Demo console", body: "Explore a workspace running on sample data." },
  { href: "/docs", label: "Documentation", body: "Concepts and configuration reference." },
  { href: "/contact", label: "Contact", body: "Ask the team a question." },
];

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-grid mask-b-from-10% mask-b-to-80% opacity-60"
        />
        <Container className="relative py-24 md:py-32">
          <p className="font-mono text-sm text-accent-text">404</p>
          <h1 className="mt-4 text-gradient text-4xl font-semibold tracking-[-0.03em] md:text-6xl">
            This page does not exist
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-fg-muted">
            The link may be out of date, or the page may have moved. Here are some places to go
            instead.
          </p>
          <Button asChild size="lg" className="mt-9">
            <Link href="/">
              Back to home
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>

          <ul className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {destinations.map((destination) => (
              <li key={destination.href}>
                <Link
                  href={destination.href}
                  className="group block h-full bg-surface p-6 transition-colors hover:bg-surface-2"
                >
                  <span className="flex items-center gap-1.5 font-medium text-fg">
                    {destination.label}
                    <ArrowRight
                      className="size-3.5 text-fg-subtle transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-1.5 block text-[15px] text-fg-muted">{destination.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
