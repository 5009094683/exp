import { getAgent, type ModelProfile, type TriggerType } from "./agents";
import type { PolicyDecision } from "./policies";
import { createRandom, hashString } from "./random";
import { scenarios, type Json, type RunStatus, type StepKind } from "./scenarios";

export type { Json, RunStatus, StepKind } from "./scenarios";

export type StepStatus = "ok" | "error" | "denied" | "waiting" | "running" | "pending";

export type RunStep = {
  id: string;
  index: number;
  kind: StepKind;
  title: string;
  /** Tool reference, model profile, memory scope or sandbox template. */
  ref: string;
  status: StepStatus;
  /** Offset from the start of the run. */
  startMs: number;
  durationMs: number;
  tokens?: { input: number; output: number };
  cost?: number;
  input?: Json;
  output?: Json;
  error?: string;
  policy?: { id: string; decision: PolicyDecision; reason: string };
  approval?: {
    approvers: string;
    channel: string;
    request: string;
    decision: "approved" | "pending";
    decidedBy?: string;
  };
  sandbox?: {
    id: string;
    template: string;
    command: string;
    logs: string[];
    exitCode?: number;
    egress: Array<{ host: string; allowed: boolean }>;
    cpuSeconds: number;
    peakMemoryMb: number;
  };
};

export type Run = {
  id: string;
  agentSlug: string;
  agentName: string;
  status: RunStatus;
  trigger: { type: TriggerType; label: string };
  /** When the run started, relative to the demo clock. */
  startedMinutesAgo: number;
  /** When the run finished; unset while it is still in progress. */
  endedMinutesAgo?: number;
  /** Elapsed time: total for finished runs, so far for runs in progress. */
  durationMs: number;
  steps: RunStep[];
  tokens: number;
  cost: number;
  version: number;
  summary: string;
};

/** Illustrative prices in USD per million tokens, by model profile. */
const TOKEN_PRICES: Record<ModelProfile, { input: number; output: number }> = {
  fast: { input: 0.25, output: 1.25 },
  balanced: { input: 3, output: 15 },
  reasoning: { input: 5, output: 25 },
};
const SANDBOX_PRICE_PER_CPU_SECOND = 0.000024;

/**
 * [agent, status, minutes ago, scenario index]. The time is when a finished
 * run ended, or when a run still in progress started.
 */
const RUN_PLAN: Array<[string, RunStatus, number, number?]> = [
  ["support-triage", "running", 0.08],
  ["payment-risk-screener", "succeeded", 0.9],
  ["lead-enrichment", "succeeded", 1.4],
  ["code-review", "running", 0.6],
  ["access-concierge", "awaiting_approval", 4],
  ["data-quality-monitor", "succeeded", 4.6],
  ["support-triage", "succeeded", 5.2],
  ["payment-risk-screener", "awaiting_approval", 7],
  ["lead-enrichment", "blocked", 9],
  ["support-triage", "awaiting_approval", 11, 1],
  ["incident-responder", "succeeded", 14],
  ["invoice-reconciler", "succeeded", 18],
  ["support-triage", "succeeded", 22, 1],
  ["code-review", "failed", 26],
  ["access-concierge", "failed", 31],
  ["data-quality-monitor", "succeeded", 34],
  ["contract-analyst", "succeeded", 41],
  ["payment-risk-screener", "succeeded", 47],
  ["lead-enrichment", "succeeded", 58],
  ["invoice-reconciler", "awaiting_approval", 78],
  ["code-review", "succeeded", 95],
  ["data-quality-monitor", "failed", 124],
  ["support-triage", "failed", 156],
  ["incident-responder", "cancelled", 190],
  ["payment-risk-screener", "failed", 240],
  ["access-concierge", "succeeded", 305],
  ["renewal-forecaster", "succeeded", 412],
  ["contract-analyst", "succeeded", 505],
  ["release-notes-writer", "succeeded", 4460],
];

function buildRun(
  agentSlug: string,
  status: RunStatus,
  minutesAgo: number,
  scenarioIndex = 0,
): Run {
  const agent = getAgent(agentSlug);
  const scenario = scenarios[agentSlug]?.[scenarioIndex];
  if (!agent || !scenario) throw new Error(`No demo scenario for "${agentSlug}".`);

  const inProgress = status === "running" || status === "awaiting_approval";
  const random = createRandom(hashString(`${agentSlug}:${status}:${minutesAgo}`));
  const id = random.id("run_", 12);
  const templates = scenario.steps;

  // Where the run stops short of the end, and why.
  let stopIndex = -1;
  if (status === "failed") stopIndex = templates.findIndex((step) => step.fails);
  if (status === "blocked") stopIndex = templates.findIndex((step) => step.blocks);
  if (status === "awaiting_approval") {
    stopIndex = templates.findIndex((step) => step.kind === "approval");
  }
  if (status === "running") {
    // Runs are usually caught in their slowest step.
    stopIndex = templates.reduce(
      (slowest, step, index) =>
        step.kind !== "approval" && step.ms[1] > templates[slowest].ms[1] ? index : slowest,
      0,
    );
  }
  if (status === "cancelled") stopIndex = Math.floor(templates.length * 0.45);
  if (status !== "succeeded" && stopIndex === -1) {
    throw new Error(`Scenario for "${agentSlug}" does not support status "${status}".`);
  }

  const elapsedBudgetMs = minutesAgo * 60_000;
  let clock = 0;
  let tokens = 0;
  let cost = 0;

  const steps = templates.map((template, index): RunStep => {
    const step: RunStep = {
      id: `${id}.${index + 1}`,
      index,
      kind: template.kind,
      title: template.title,
      ref: template.ref,
      status: "ok",
      startMs: clock,
      durationMs: 0,
      input: template.input,
      output: template.output,
      policy: template.policy,
    };

    if (stopIndex !== -1 && index > stopIndex) {
      return { ...step, status: "pending", output: undefined, policy: undefined };
    }

    const stopsHere = index === stopIndex;
    let duration = random.int(template.ms[0], template.ms[1]);

    if (template.sandbox) {
      step.sandbox = {
        id: random.id("sbx_", 10),
        template: template.sandbox.template,
        command: template.sandbox.command,
        logs: template.sandbox.logs,
        exitCode: 0,
        egress: template.sandbox.egress ?? [],
        cpuSeconds: template.sandbox.cpuSeconds,
        peakMemoryMb: template.sandbox.peakMemoryMb,
      };
    }

    if (template.approval) {
      duration = random.int(template.approval.waitMs[0], template.approval.waitMs[1]);
      step.approval = {
        approvers: template.approval.approvers,
        channel: template.approval.channel,
        request: template.approval.request,
        decision: "approved",
        decidedBy: template.approval.decidedBy,
      };
      step.output = { decision: "approved", by: template.approval.decidedBy };
    }

    if (stopsHere && status === "failed" && template.fails) {
      step.status = "error";
      step.error = template.fails.error;
      step.output = undefined;
      // Retries with backoff make a failing step slower than a healthy one.
      duration = Math.round(duration * 2.6);
      if (step.sandbox) {
        step.sandbox = {
          ...step.sandbox,
          logs: template.fails.logs ?? step.sandbox.logs,
          exitCode: 1,
        };
      }
    } else if (stopsHere && status === "blocked" && template.blocks) {
      step.status = "denied";
      step.input = template.blocks.input ?? template.input;
      step.output = undefined;
      step.policy = {
        id: template.blocks.policy,
        decision: "deny",
        reason: template.blocks.reason,
      };
      duration = random.int(4, 11);
    } else if (stopsHere && status === "awaiting_approval" && step.approval) {
      step.status = "waiting";
      step.approval = { ...step.approval, decision: "pending", decidedBy: undefined };
      step.output = undefined;
      duration = Math.max(20_000, elapsedBudgetMs - clock);
    } else if (stopsHere && status === "running") {
      step.status = "running";
      step.output = undefined;
      if (step.sandbox) {
        step.sandbox = {
          ...step.sandbox,
          logs: step.sandbox.logs.slice(0, Math.ceil(step.sandbox.logs.length / 2)),
          exitCode: undefined,
        };
      }
      // Still in progress: the step has been running since the previous one finished.
      duration = Math.max(400, elapsedBudgetMs - clock);
    } else if (stopsHere && status === "cancelled") {
      return { ...step, status: "pending", output: undefined, policy: undefined };
    }

    if (template.tokens && step.status !== "running") {
      const profile = template.ref as ModelProfile;
      const input = Math.round(template.tokens[0] * random.float(0.94, 1.06));
      const output = Math.round(template.tokens[1] * random.float(0.94, 1.06));
      step.tokens = { input, output };
      step.cost =
        (input * TOKEN_PRICES[profile].input + output * TOKEN_PRICES[profile].output) / 1_000_000;
      tokens += input + output;
      cost += step.cost;
    }
    if (step.sandbox) {
      step.cost = step.sandbox.cpuSeconds * SANDBOX_PRICE_PER_CPU_SECOND;
      cost += step.cost;
    }

    step.durationMs = duration;
    clock += duration + random.int(3, 24);
    return step;
  });

  return {
    id,
    agentSlug,
    agentName: agent.name,
    status,
    trigger: scenario.trigger,
    startedMinutesAgo: inProgress ? minutesAgo : minutesAgo + clock / 60_000,
    endedMinutesAgo: inProgress ? undefined : minutesAgo,
    durationMs: clock,
    steps,
    tokens,
    cost,
    version: agent.version,
    summary: scenario.outcomes[status] ?? scenario.outcomes.succeeded ?? "",
  };
}

/** Sample runs for the demo workspace, most recent first. */
export const runs: Run[] = RUN_PLAN.map(([agent, status, minutesAgo, scenario]) =>
  buildRun(agent, status, minutesAgo, scenario),
).sort((a, b) => a.startedMinutesAgo - b.startedMinutesAgo);

export function getRun(id: string): Run | undefined {
  return runs.find((run) => run.id === id);
}

export function runsForAgent(slug: string): Run[] {
  return runs.filter((run) => run.agentSlug === slug);
}

/** Minutes since the agent last started a run, taken from the sample runs when possible. */
export function lastRunMinutesAgo(slug: string): number | undefined {
  const latest = runsForAgent(slug)[0];
  return latest?.startedMinutesAgo ?? getAgent(slug)?.lastRunMinutesAgo;
}

/** The run shown in product visuals across the marketing site. */
export const showcaseRun: Run =
  runs.find((run) => run.agentSlug === "incident-responder" && run.status === "succeeded") ??
  runs[0];

export const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  succeeded: "Succeeded",
  failed: "Failed",
  running: "Running",
  awaiting_approval: "Awaiting approval",
  blocked: "Blocked by policy",
  cancelled: "Cancelled",
};
