import { Handshake, LifeBuoy, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LeadFormCard } from "@/components/leads/lead-form-card";
import { Container, Eyebrow } from "@/components/marketing/layout";
import { Button } from "@/components/ui/button";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with the ${site.product.name} team about the platform, pricing, security or partnerships.`,
  alternates: { canonical: "/contact" },
};

type Channel = { icon: LucideIcon; title: string; body: string; label: string; href: string };

/** Only channels with a configured address are listed; nothing is a placeholder. */
function buildChannels(): Channel[] {
  const { contact } = site;
  const channels: Channel[] = [];

  if (contact.sales) {
    channels.push({
      icon: Handshake,
      title: "Sales",
      body: "Use cases, pricing and pilots.",
      label: contact.sales,
      href: `mailto:${contact.sales}`,
    });
  }
  if (contact.support) {
    channels.push({
      icon: LifeBuoy,
      title: "Support",
      body: "Help for early-access customers.",
      label: contact.support,
      href: `mailto:${contact.support}`,
    });
  }
  if (contact.security) {
    channels.push({
      icon: ShieldCheck,
      title: "Security",
      body: "Report a vulnerability or ask about our practices.",
      label: contact.security,
      href: `mailto:${contact.security}`,
    });
  }
  if (contact.email) {
    channels.push({
      icon: Mail,
      title: "General",
      body: "Everything else.",
      label: contact.email,
      href: `mailto:${contact.email}`,
    });
  }
  if (contact.phone) {
    channels.push({
      icon: Phone,
      title: "Phone",
      body: "During business hours.",
      label: contact.phone,
      href: `tel:${contact.phone.replace(/[^\d+]/g, "")}`,
    });
  }
  return channels;
}

export default function ContactPage() {
  const channels = buildChannels();
  const { addressLines, legalName } = site.company;

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
          <Eyebrow className="animate-fade-up">Contact</Eyebrow>
          <h1 className="mt-5 animate-fade-up text-gradient text-4xl leading-[1.06] font-semibold tracking-[-0.03em] anim-delay-75 md:text-5xl">
            Talk to the team
          </h1>
          <p className="mt-5 max-w-lg animate-fade-up text-lg leading-relaxed text-fg-muted anim-delay-150">
            Questions about the platform, pricing, security or partnerships? Send a message and the
            right person will get back to you.
          </p>

          {channels.length > 0 ? (
            <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
              {channels.map((channel) => (
                <li key={channel.title} className="bg-surface p-5">
                  <channel.icon className="size-[18px] text-accent-text" aria-hidden="true" />
                  <h2 className="mt-3 text-sm font-medium text-fg">{channel.title}</h2>
                  <p className="mt-1 text-[13px] text-fg-subtle">{channel.body}</p>
                  <a
                    href={channel.href}
                    className="mt-3 inline-block text-sm break-all text-fg-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-fg"
                  >
                    {channel.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          {addressLines.length > 0 ? (
            <div className="mt-8 flex gap-4">
              <MapPin className="mt-0.5 size-[18px] shrink-0 text-accent-text" aria-hidden="true" />
              <address className="text-[15px] leading-relaxed text-fg-muted not-italic">
                <span className="font-medium text-fg">{legalName}</span>
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>
          ) : null}

          <p className="mt-10 max-w-lg border-t border-line pt-8 text-[15px] leading-relaxed text-fg-muted">
            Want to use {site.product.name} with your team?{" "}
            <Link
              href="/early-access"
              className="font-medium text-fg underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-fg"
            >
              Request early access
            </Link>{" "}
            and tell us what you plan to build.
          </p>
        </div>

        <div className="animate-fade-up self-start rounded-2xl border border-line-strong bg-surface p-6 shadow-2xl edge-highlight shadow-black/40 anim-delay-150 sm:p-8">
          <LeadFormCard
            variant="contact"
            source="contact-page"
            successTitle="Message sent"
            successAction={
              <Button asChild variant="secondary">
                <Link href="/">Back to home</Link>
              </Button>
            }
          />
        </div>
      </Container>
    </section>
  );
}
