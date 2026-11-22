/**
 * Plans and metered rates. Edit this file to change pricing; the pricing page,
 * the estimator, the home page teaser and the demo console all read from here.
 *
 * This module has no dependencies so the estimator can use it in the browser.
 */

export type Plan = {
  id: "team" | "business" | "enterprise";
  name: string;
  tagline: string;
  /** Monthly price per agent in USD, or `null` when the plan is quoted individually. */
  pricePerAgent: number | null;
  /** Executions included per agent each month, pooled across the workspace. */
  includedExecutions: number | null;
  /** Largest number of agents the plan is meant for. */
  maxAgents: number | null;
  featured?: boolean;
  features: string[];
};

export const plans: Plan[] = [
  {
    id: "team",
    name: "Team",
    tagline: "For teams putting their first agents into production.",
    pricePerAgent: 49,
    includedExecutions: 2500,
    maxAgents: 25,
    features: [
      "Up to 25 agents",
      "2,500 executions per agent each month",
      "Orchestration, memory and MCP integrations",
      "Policies with approval steps",
      "30 days of audit log retention",
      "Shared sandboxes",
      "Email support",
    ],
  },
  {
    id: "business",
    name: "Business",
    tagline: "For companies running agents across several teams.",
    pricePerAgent: 39,
    includedExecutions: 5000,
    maxAgents: 250,
    featured: true,
    features: [
      "Up to 250 agents",
      "5,000 executions per agent each month",
      "SAML single sign-on and SCIM",
      "Custom roles and approval groups",
      "1 year of audit log retention and streaming export",
      "Private connectors for internal systems",
      "Dedicated sandbox capacity",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For large fleets with deployment and compliance requirements.",
    pricePerAgent: null,
    includedExecutions: null,
    maxAgents: null,
    features: [
      "Annual license sized to your fleet",
      "Deployment in your own cloud or data center",
      "Tenant isolation for multi-customer platforms",
      "Custom data residency and retention",
      "Customer-managed encryption keys",
      "Security review and custom terms",
      "Named support engineer",
    ],
  },
];

/** Metered usage beyond what a plan includes, in USD. */
export const usageRates = {
  /** Per 1,000 executions above the included amount. */
  executionsPerThousand: 4,
  /** Per sandbox vCPU-hour. */
  sandboxVcpuHour: 0.08,
};

export const pricingNotes = {
  execution:
    "An execution is one agent run, from trigger to final output, however many steps it takes.",
  models:
    "Model usage is billed by your model provider. Connect your own provider accounts; there is no markup.",
  status:
    "Planned pricing for general availability. During early access, pricing is agreed with each team.",
};

export type Estimate = {
  plan: Plan;
  subscription: number;
  includedExecutions: number;
  extraExecutions: number;
  executionCost: number;
  sandboxCost: number;
  total: number;
};

/**
 * Estimates a monthly bill. Returns `null` when the fleet is larger than the
 * self-serve plans cover, where pricing is quoted individually.
 */
export function estimate(input: {
  agents: number;
  executionsPerAgent: number;
  sandboxVcpuHours: number;
}): Estimate | null {
  const agents = Math.max(0, Math.round(input.agents));
  const plan = plans.find(
    (candidate) =>
      candidate.pricePerAgent !== null &&
      candidate.maxAgents !== null &&
      agents <= candidate.maxAgents,
  );
  if (!plan || plan.pricePerAgent === null || plan.includedExecutions === null) return null;

  const subscription = agents * plan.pricePerAgent;
  const includedExecutions = agents * plan.includedExecutions;
  const totalExecutions = agents * Math.max(0, input.executionsPerAgent);
  const extraExecutions = Math.max(0, totalExecutions - includedExecutions);
  const executionCost = (extraExecutions / 1000) * usageRates.executionsPerThousand;
  const sandboxCost = Math.max(0, input.sandboxVcpuHours) * usageRates.sandboxVcpuHour;

  return {
    plan,
    subscription,
    includedExecutions,
    extraExecutions,
    executionCost,
    sandboxCost,
    total: subscription + executionCost + sandboxCost,
  };
}
