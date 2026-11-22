import type { Metadata } from "next";
import { OverviewView } from "@/components/console/views/overview";
import { site } from "@/config/site";

export const metadata: Metadata = {
  // A layout's title template does not apply to the page in its own segment.
  title: { absolute: `Overview · Demo console — ${site.product.name}` },
};

export default function ConsoleOverviewPage() {
  return <OverviewView />;
}
