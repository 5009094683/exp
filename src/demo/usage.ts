import { plans, usageRates } from "@/content/pricing";
import { agents, fleet } from "./agents";
import { createRandom } from "./random";
import { sandboxTemplates } from "./sandboxes";
import { scenarios } from "./scenarios";

const DAY_MS = 86_400_000;

/** Runs per hour over the last 24 hours, oldest first. Sums to the fleet's 24h total. */
export function hourlyRuns(): Array<{ hoursAgo: number; succeeded: number; failed: number }> {
  const random = createRandom(4242);
  const weights = Array.from({ length: 24 }, (_, index) => {
    // A working-day curve: quieter at the start of the window, busiest in the middle.
    const wave = 0.62 + 0.38 * Math.sin(((index - 5) / 24) * Math.PI * 2);
    return wave * random.float(0.9, 1.1);
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const failureRate = 1 - fleet.successRate;

  let assigned = 0;
  return weights.map((weight, index) => {
    const runs =
      index === 23 ? fleet.runs24h - assigned : Math.round((weight / total) * fleet.runs24h);
    assigned += runs;
    const failed = Math.round(runs * failureRate * random.float(0.6, 1.5));
    return { hoursAgo: 23 - index, succeeded: runs - failed, failed };
  });
}

export type DailyUsage = { date: Date; executions: number; failed: number };

/** Executions per day, oldest first, ending today. Weekends are quieter. */
export function dailyUsage(now: number, days = 30): DailyUsage[] {
  const random = createRandom(9001);
  return Array.from({ length: days }, (_, index) => {
    const daysAgo = days - 1 - index;
    const date = new Date(now - daysAgo * DAY_MS);
    const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
    const growth = 1 - daysAgo * 0.006;
    const executions = Math.round(
      fleet.runs24h * growth * (weekend ? 0.46 : 1) * random.float(0.94, 1.05),
    );
    return {
      date,
      executions,
      failed: Math.round(executions * (1 - fleet.successRate) * random.float(0.7, 1.4)),
    };
  });
}

/** Average tokens one run of an agent uses, taken from its sample scenario. */
function tokensPerRun(slug: string): number {
  const steps = scenarios[slug]?.[0]?.steps ?? [];
  return steps.reduce((sum, step) => sum + (step.tokens ? step.tokens[0] + step.tokens[1] : 0), 0);
}

function sandboxSecondsPerRun(slug: string): number {
  const steps = scenarios[slug]?.[0]?.steps ?? [];
  return steps.reduce((sum, step) => sum + (step.sandbox?.cpuSeconds ?? 0), 0);
}

export type BillingPeriod = {
  start: Date;
  end: Date;
  /** Days of the current month that have passed, including today. */
  daysElapsed: number;
  daysInMonth: number;
};

export function billingPeriod(now: number): BillingPeriod {
  const today = new Date(now);
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
  return { start, end, daysElapsed: today.getUTCDate(), daysInMonth: end.getUTCDate() };
}

export type AgentUsage = {
  slug: string;
  name: string;
  executions: number;
  tokens: number;
  sandboxVcpuHours: number;
  modelCost: number;
};

/** Month-to-date usage for each agent, largest first. */
export function usageByAgent(now: number): AgentUsage[] {
  const { daysElapsed } = billingPeriod(now);
  const days = dailyUsage(now, 31).slice(-daysElapsed);
  // Scale each agent's daily volume by how the month actually went.
  const factor = days.reduce((sum, day) => sum + day.executions, 0) / Math.max(1, fleet.runs24h);

  return agents
    .filter((agent) => agent.runs24h > 0)
    .map((agent) => {
      const executions = Math.round(agent.runs24h * factor);
      return {
        slug: agent.slug,
        name: agent.name,
        executions,
        tokens: executions * tokensPerRun(agent.slug),
        sandboxVcpuHours: (executions * sandboxSecondsPerRun(agent.slug)) / 3600,
        modelCost: agent.cost24h * factor,
      };
    })
    .sort((a, b) => b.executions - a.executions);
}

export type BillLine = { label: string; detail: string; amount: number };

/** The month-to-date bill on the workspace's plan, using the public pricing. */
export function currentBill(now: number): {
  planName: string;
  billableAgents: number;
  executions: number;
  includedExecutions: number;
  sandboxVcpuHours: number;
  lines: BillLine[];
  total: number;
  projected: number;
} {
  const period = billingPeriod(now);
  const usage = usageByAgent(now);
  const billableAgents = agents.filter((agent) => agent.status !== "draft").length;
  const executions = usage.reduce((sum, item) => sum + item.executions, 0);
  const sandboxVcpuHours = usage.reduce((sum, item) => sum + item.sandboxVcpuHours, 0);
  const plan = plans.find((candidate) => candidate.id === "business") ?? plans[0];

  // The demo workspace is on Business regardless of which plan its size alone would pick.
  const price = plan.pricePerAgent ?? 0;
  const included = billableAgents * (plan.includedExecutions ?? 0);
  const extra = Math.max(0, executions - included);
  const executionCost = (extra / 1000) * usageRates.executionsPerThousand;
  const sandboxCost = sandboxVcpuHours * usageRates.sandboxVcpuHour;
  const subscription = billableAgents * price;
  const total = subscription + executionCost + sandboxCost;

  return {
    planName: plan.name,
    billableAgents,
    executions,
    includedExecutions: included,
    sandboxVcpuHours,
    lines: [
      {
        label: "Agent subscriptions",
        detail: `${billableAgents} agents × $${price}`,
        amount: subscription,
      },
      {
        label: "Additional executions",
        detail: `${Math.round(extra).toLocaleString("en-US")} beyond ${included.toLocaleString("en-US")} included × $${usageRates.executionsPerThousand} per 1,000`,
        amount: executionCost,
      },
      {
        label: "Sandbox compute",
        detail: `${Math.round(sandboxVcpuHours).toLocaleString("en-US")} vCPU-hours × $${usageRates.sandboxVcpuHour.toFixed(2)}`,
        amount: sandboxCost,
      },
    ],
    total,
    projected:
      subscription + ((executionCost + sandboxCost) / period.daysElapsed) * period.daysInMonth,
  };
}

/** Sandbox sessions per template over the last 24 hours, for the sandboxes view. */
export const sandboxSessions24h = sandboxTemplates.reduce(
  (sum, template) => sum + template.sessions24h,
  0,
);
