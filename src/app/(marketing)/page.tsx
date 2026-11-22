import Link from "next/link";
import { EarlyAccessButton } from "@/components/leads/early-access-button";
import { PageHero } from "@/components/marketing/page-hero";
import { Button } from "@/components/ui/button";
import { site } from "@/config/site";

export default function HomePage() {
  return (
    <PageHero
      eyebrow="Private early access"
      title="Run thousands of AI agents. Keep control of every action."
      description={site.product.description}
      actions={
        <>
          <EarlyAccessButton source="hero" size="lg" />
          <Button asChild variant="secondary" size="lg">
            <Link href="/console">Explore the demo console</Link>
          </Button>
        </>
      }
    />
  );
}
