import type { Route } from "next";
import type { CapabilitySlug } from "@/content/capabilities";
import type { SolutionSlug } from "@/content/solutions";

export type LegalSlug = "privacy" | "terms" | "cookies";

/**
 * Any internal link target. `Route` on its own only covers static routes, so
 * the dynamic sections are listed here; `<Link href>` still validates each one.
 */
export type AppRoute =
  Route | `/platform/${CapabilitySlug}` | `/solutions/${SolutionSlug}` | `/legal/${LegalSlug}`;
