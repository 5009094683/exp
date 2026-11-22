import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { EarlyAccessButton } from "@/components/early-access/early-access-button";
import { Button } from "@/components/ui/button";
import { site } from "@/config/site";
import { capabilities } from "@/content/capabilities";
import { solutions } from "@/content/solutions";
import { DesktopNav, type NavLinkItem, type NavMenuItem } from "./desktop-nav";
import { Container } from "./layout";
import { MobileNav } from "./mobile-nav";

const links: NavLinkItem[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/security", label: "Security" },
  { href: "/company", label: "Company" },
];

export function SiteHeader() {
  const platformItems: NavMenuItem[] = capabilities.map((capability) => ({
    href: `/platform/${capability.slug}`,
    label: capability.name,
    description: capability.summary,
    icon: <capability.icon className="size-4" aria-hidden="true" />,
  }));

  const solutionItems: NavMenuItem[] = solutions.map((solution) => ({
    href: `/solutions/${solution.slug}`,
    label: solution.name,
    description: solution.summary,
    icon: <solution.icon className="size-4" aria-hidden="true" />,
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/75 backdrop-blur-xl backdrop-saturate-150">
      <Container className="flex h-(--header-height) items-center gap-6">
        <Link
          href="/"
          aria-label={`${site.product.name} home`}
          className="rounded-md transition-opacity hover:opacity-90"
        >
          <Logo name={site.product.name} />
        </Link>

        <DesktopNav platform={platformItems} solutions={solutionItems} links={links} />

        <div className="ml-auto flex items-center gap-1.5">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/signin">Sign in</Link>
          </Button>
          <EarlyAccessButton source="header" size="sm">
            Request access
          </EarlyAccessButton>
          <MobileNav
            platform={platformItems}
            solutions={solutionItems}
            links={[...links, { href: "/contact", label: "Contact" }]}
            brand={<Logo name={site.product.name} />}
            actions={
              <>
                <EarlyAccessButton source="mobile-menu" size="lg" />
                <Button asChild variant="secondary" size="lg">
                  <Link href="/signin">Sign in</Link>
                </Button>
              </>
            }
          />
        </div>
      </Container>
    </header>
  );
}
