import { Box, Brain, KeyRound, Plug, ScrollText, Workflow, type LucideIcon } from "lucide-react";

export type CapabilitySlug =
  "orchestration" | "memory" | "integrations" | "permissions" | "audit-logs" | "sandboxes";

export type CapabilityMeta = {
  slug: CapabilitySlug;
  name: string;
  /** One line for menus and cards. */
  summary: string;
  icon: LucideIcon;
};

/** The six platform capabilities, in the order they appear across the site. */
export const capabilities: CapabilityMeta[] = [
  {
    slug: "orchestration",
    name: "Orchestration",
    summary: "Durable workflows, triggers and approvals for agent fleets.",
    icon: Workflow,
  },
  {
    slug: "memory",
    name: "Memory",
    summary: "Scoped, governed context that persists across runs.",
    icon: Brain,
  },
  {
    slug: "integrations",
    name: "MCP integrations",
    summary: "Connect any MCP server with per-tool control.",
    icon: Plug,
  },
  {
    slug: "permissions",
    name: "Permissions",
    summary: "Least-privilege policies checked on every action.",
    icon: KeyRound,
  },
  {
    slug: "audit-logs",
    name: "Audit logs",
    summary: "A tamper-evident record of every decision and call.",
    icon: ScrollText,
  },
  {
    slug: "sandboxes",
    name: "Sandboxed execution",
    summary: "Isolated, resource-limited environments for agent code.",
    icon: Box,
  },
];

export function getCapability(slug: string): CapabilityMeta | undefined {
  return capabilities.find((capability) => capability.slug === slug);
}
