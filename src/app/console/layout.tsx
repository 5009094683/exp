import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DemoClock } from "@/components/console/clock";
import { ConsoleShell } from "@/components/console/shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { buildTime } from "@/config/build";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: {
    default: "Demo console",
    template: `%s · Demo console — ${site.product.name}`,
  },
  description: `An interactive demo of the ${site.product.name} console, running on sample data.`,
  // The demo shows sample data; keep it out of search results.
  robots: { index: false, follow: true },
};

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <DemoClock builtAt={buildTime}>
      <TooltipProvider delayDuration={150}>
        <ConsoleShell>{children}</ConsoleShell>
      </TooltipProvider>
    </DemoClock>
  );
}
