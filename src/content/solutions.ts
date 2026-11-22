import { Building2, Layers, Network, type LucideIcon } from "lucide-react";

export type SolutionSlug = "enterprise" | "saas" | "agencies";

export type SolutionMeta = {
  slug: SolutionSlug;
  name: string;
  /** One line for menus and cards. */
  summary: string;
  icon: LucideIcon;
};

export const solutions: SolutionMeta[] = [
  {
    slug: "enterprise",
    name: "Enterprises",
    summary: "Roll out agents across teams with central governance.",
    icon: Building2,
  },
  {
    slug: "saas",
    name: "SaaS companies",
    summary: "Ship agent features on multi-tenant infrastructure.",
    icon: Layers,
  },
  {
    slug: "agencies",
    name: "Automation agencies",
    summary: "Run client fleets with isolation and usage reporting.",
    icon: Network,
  },
];

export function getSolution(slug: string): SolutionMeta | undefined {
  return solutions.find((solution) => solution.slug === slug);
}
