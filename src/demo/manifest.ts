import type { Agent, ModelProfile } from "./agents";
import { createRandom, hashString } from "./random";

export type ManifestInput = {
  name: string;
  description: string;
  model: ModelProfile;
  instructions: string;
  triggers: string[];
  tools: string[];
  policies: string[];
  memoryScopes: string[];
  sandbox?: string;
  concurrency: number;
  maxDuration: string;
  dailyBudgetUsd: number;
};

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "new-agent"
  );
}

function quote(value: string): string {
  return /[:#"'{}[\],&*!|>%@`]/.test(value) || value.trim() !== value
    ? JSON.stringify(value)
    : value;
}

/** Wraps text into a YAML block scalar at roughly 78 columns. */
function block(text: string, indent: string): string {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line && (line + " " + word).length > 74) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.map((item) => `${indent}${item}`).join("\n");
}

/** Renders an agent definition in the manifest format shown across the site. */
export function buildManifest(input: ManifestInput): string {
  const lines = [
    `name: ${slug(input.name)}`,
    `description: ${quote(input.description.trim() || "Describe what this agent does.")}`,
    `model: ${input.model}`,
    "instructions: |",
    block(input.instructions || "Describe how the agent should do its job.", "  "),
    "",
    "triggers:",
    ...(input.triggers.length > 0
      ? input.triggers.map((trigger) => `  - ${quote(trigger)}`)
      : ["  - manual"]),
    "",
    "tools:",
    ...(input.tools.length > 0
      ? input.tools.map((tool) => `  - ${tool}`)
      : ["  []   # no tools granted yet"]),
    "",
    "policies:",
    ...input.policies.map((policy) => `  - ${policy}`),
    "",
    "memory:",
    `  scopes: [${input.memoryScopes.join(", ")}]`,
  ];

  if (input.sandbox) lines.push("", "sandbox:", `  template: ${input.sandbox}`);

  lines.push(
    "",
    "limits:",
    `  concurrency: ${input.concurrency}`,
    `  max_duration: ${input.maxDuration}`,
    `  daily_budget_usd: ${input.dailyBudgetUsd}`,
    "",
  );
  return lines.join("\n");
}

export function manifestForAgent(agent: Agent): string {
  return buildManifest({
    name: agent.slug,
    description: agent.description,
    model: agent.model,
    instructions: agent.instructions,
    triggers: agent.triggers.map((trigger) => trigger.label),
    tools: agent.tools,
    policies: agent.policies,
    memoryScopes: agent.memoryScopes,
    sandbox: agent.sandbox,
    concurrency: Math.max(5, Math.round(agent.instances / 8)),
    maxDuration: agent.p95Ms > 120_000 ? "30m" : "10m",
    dailyBudgetUsd: Math.max(50, Math.ceil((agent.cost24h * 1.5) / 50) * 50),
  });
}

export type AgentVersion = {
  version: number;
  author: string;
  hoursAgo: number;
  change: string;
  /** Share of traffic served; the current version carries all of it. */
  traffic: number;
};

const CHANGES = [
  "Tightened the instructions for edge cases found in review",
  "Raised the concurrency limit",
  "Added a tool and granted it in policy",
  "Shortened the maximum run duration",
  "Moved to a different model profile after a replay comparison",
  "Added a retry with backoff to a flaky tool call",
  "Reduced the daily budget",
  "Clarified when to hand off to a person",
];

/** A plausible recent history for an agent, newest first. */
export function versionHistory(agent: Agent, count = 6): AgentVersion[] {
  const random = createRandom(hashString(`versions:${agent.slug}`));
  let hoursAgo = agent.updatedHoursAgo;

  return Array.from({ length: Math.min(count, agent.version) }, (_, index) => {
    const entry: AgentVersion = {
      version: agent.version - index,
      author: index % 3 === 2 ? "Priya Natarajan" : agent.owner,
      hoursAgo,
      change: index === agent.version - 1 ? "Initial version" : random.pick(CHANGES),
      traffic: index === 0 ? 1 : 0,
    };
    hoursAgo += random.int(20, 190);
    return entry;
  });
}
