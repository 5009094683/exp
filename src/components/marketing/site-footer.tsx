import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { Logo } from "@/components/brand/logo";
import {
  DiscordIcon,
  GitHubIcon,
  LinkedInIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/brand/social-icons";
import { site } from "@/config/site";
import { capabilities } from "@/content/capabilities";
import { solutions } from "@/content/solutions";
import { telHref } from "@/lib/phone";
import type { AppRoute } from "@/lib/routes";
import { InlineAddress } from "./inline-address";
import { Container } from "./layout";

type FooterLink =
  | { label: string; href: AppRoute; external?: false }
  | { label: string; href: string; external: true };

type FooterColumn = { title: string; links: FooterLink[] };

function buildColumns(): FooterColumn[] {
  const resources: FooterLink[] = [
    { label: "Documentation", href: "/docs" },
    { label: "Demo console", href: "/console" },
    { label: "Security", href: "/security" },
    { label: "Pricing", href: "/pricing" },
  ];
  if (site.links.status) {
    resources.push({ label: "System status", href: site.links.status, external: true });
  }

  const company: FooterLink[] = [
    { label: "About", href: "/company" },
    { label: "Contact", href: "/contact" },
    { label: "Early access", href: "/early-access" },
  ];
  if (site.links.careers) {
    company.push({ label: "Careers", href: site.links.careers, external: true });
  }

  return [
    {
      title: "Platform",
      links: [
        { label: "Overview", href: "/platform" },
        ...capabilities.map((capability): FooterLink => ({
          label: capability.name,
          href: `/platform/${capability.slug}`,
        })),
      ],
    },
    {
      title: "Solutions",
      links: solutions.map((solution): FooterLink => ({
        label: solution.name,
        href: `/solutions/${solution.slug}`,
      })),
    },
    { title: "Resources", links: resources },
    { title: "Company", links: company },
    {
      title: "Legal",
      links: [
        { label: "Privacy policy", href: "/legal/privacy" },
        { label: "Terms of use", href: "/legal/terms" },
        { label: "Cookie policy", href: "/legal/cookies" },
      ],
    },
  ];
}

const socialLinks: Array<{
  key: keyof typeof site.social;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
  { key: "x", label: "X", icon: XIcon },
  { key: "linkedin", label: "LinkedIn", icon: LinkedInIcon },
  { key: "github", label: "GitHub", icon: GitHubIcon },
  { key: "youtube", label: "YouTube", icon: YouTubeIcon },
  { key: "discord", label: "Discord", icon: DiscordIcon },
];

const linkClasses = "text-sm text-fg-subtle transition-colors hover:text-fg";

export function SiteFooter() {
  const columns = buildColumns();
  const social = socialLinks.filter((item) => site.social[item.key]);
  const { company } = site;
  const { email, phone } = site.contact;

  return (
    <footer className="border-t border-line bg-bg-subtle">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_3fr]">
          <div>
            <Link href="/" aria-label={`${site.product.name} home`} className="inline-flex">
              <Logo name={site.product.name} />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-fg-subtle">
              {site.product.tagline}. Build, deploy and govern autonomous agents on one platform.
            </p>
            {social.length > 0 ? (
              <ul className="mt-6 flex items-center gap-1">
                {social.map((item) => (
                  <li key={item.key}>
                    <a
                      href={site.social[item.key]}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${site.product.name} on ${item.label}`}
                      className="inline-flex size-9 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-white/[0.06] hover:text-fg"
                    >
                      <item.icon className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-5"
          >
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="text-[13px] font-medium text-fg">{column.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className={linkClasses}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className={linkClasses}>
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-8 text-[13px] text-fg-subtle md:flex-row md:items-start md:justify-between md:gap-10">
          {/* Keeps its own width, up to half the row, so a long address cannot squeeze it. */}
          <div className="space-y-1 md:max-w-[50%] md:shrink-0">
            <p>
              © {site.copyrightYear} {company.legalName}. All rights reserved.
            </p>
            {company.registration ? <p>{company.registration}</p> : null}
          </div>
          {company.addressLines.length > 0 || phone || email ? (
            <address className="min-w-0 space-y-1 not-italic md:text-right">
              {company.addressLines.length > 0 ? (
                <p className="md:text-balance">
                  <InlineAddress lines={company.addressLines} />
                </p>
              ) : null}
              {phone || email ? (
                // Stacked on phones; one line with a separator where there is room for both.
                <p className="flex flex-col items-start gap-1 md:flex-row md:flex-wrap md:justify-end md:gap-x-2.5">
                  {phone ? (
                    <a
                      href={telHref(phone)}
                      className="whitespace-nowrap transition-colors hover:text-fg"
                    >
                      {phone}
                    </a>
                  ) : null}
                  {phone && email ? (
                    <span aria-hidden="true" className="hidden md:inline">
                      ·
                    </span>
                  ) : null}
                  {email ? (
                    <a href={`mailto:${email}`} className="transition-colors hover:text-fg">
                      {email}
                    </a>
                  ) : null}
                </p>
              ) : null}
            </address>
          ) : null}
        </div>
      </Container>
    </footer>
  );
}
