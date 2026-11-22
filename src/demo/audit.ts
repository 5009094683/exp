import { agents } from "./agents";
import { hashString } from "./random";
import { runs, type Json } from "./runs";

export type AuditCategory =
  "run" | "model" | "tool" | "memory" | "policy" | "approval" | "sandbox" | "config" | "access";

export type AuditOutcome = "success" | "denied" | "failed" | "pending";

export type AuditEvent = {
  id: string;
  minutesAgo: number;
  actor: { type: "agent" | "user" | "system"; id: string };
  action: string;
  category: AuditCategory;
  resource: string;
  outcome: AuditOutcome;
  runId?: string;
  detail?: { [key: string]: Json };
  /** Source address for actions taken by people. */
  ip?: string;
  hash: string;
  prevHash: string;
};

type Draft = Omit<AuditEvent, "id" | "hash" | "prevHash">;

function userId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ".");
}

/** Events derived from the sample runs: one or two per step. */
function runEvents(): Draft[] {
  const events: Draft[] = [];

  for (const run of runs) {
    const actor = { type: "agent" as const, id: `${run.agentSlug}@${run.version}` };
    const at = (offsetMs: number) => Math.max(0, run.startedMinutesAgo - offsetMs / 60_000);

    for (const step of run.steps) {
      if (step.status === "pending") continue;
      const end = step.startMs + step.durationMs;
      const base = { actor, runId: run.id, minutesAgo: at(end) };
      const failed = step.status === "error";

      switch (step.kind) {
        case "trigger":
          events.push({
            ...base,
            actor: { type: "system", id: run.trigger.type },
            action: "run.start",
            category: "run",
            resource: run.id,
            outcome: "success",
            detail: { trigger: run.trigger.label, agent: run.agentSlug },
          });
          break;
        case "model":
          events.push({
            ...base,
            action: "model.call",
            category: "model",
            resource: `profile:${step.ref}`,
            outcome: step.status === "running" ? "pending" : "success",
            detail: step.tokens
              ? { input_tokens: step.tokens.input, output_tokens: step.tokens.output }
              : undefined,
          });
          break;
        case "tool":
          if (step.policy) {
            events.push({
              ...base,
              minutesAgo: at(step.startMs),
              action: "policy.evaluate",
              category: "policy",
              resource: step.policy.id,
              outcome: step.policy.decision === "deny" ? "denied" : "success",
              detail: {
                tool: step.ref,
                decision: step.policy.decision,
                reason: step.policy.reason,
              },
            });
          }
          if (step.status !== "denied") {
            events.push({
              ...base,
              action: "tool.call",
              category: "tool",
              resource: step.ref,
              outcome: failed ? "failed" : "success",
              detail: failed ? { error: step.error ?? "error" } : { duration_ms: step.durationMs },
            });
          }
          break;
        case "memory":
          events.push({
            ...base,
            action: step.ref.startsWith("memory.write") ? "memory.write" : "memory.read",
            category: "memory",
            resource: step.ref.split("· ")[1] ?? "memory",
            outcome: "success",
          });
          break;
        case "sandbox":
          events.push({
            ...base,
            action: "sandbox.exec",
            category: "sandbox",
            resource: step.sandbox?.id ?? step.ref,
            outcome: failed ? "failed" : step.status === "running" ? "pending" : "success",
            detail: {
              template: step.ref,
              exit_code: step.sandbox?.exitCode ?? null,
              blocked_egress: step.sandbox?.egress.filter((entry) => !entry.allowed).length ?? 0,
            },
          });
          break;
        case "approval":
          events.push({
            ...base,
            minutesAgo: at(step.startMs),
            action: "approval.request",
            category: "approval",
            resource: step.approval?.approvers ?? step.ref,
            outcome: "pending",
            detail: { policy: step.policy?.id ?? "", request: step.approval?.request ?? "" },
          });
          if (step.approval?.decision === "approved" && step.approval.decidedBy) {
            events.push({
              ...base,
              actor: { type: "user", id: userId(step.approval.decidedBy) },
              action: "approval.grant",
              category: "approval",
              resource: run.id,
              outcome: "success",
              ip: `203.0.113.${(hashString(step.approval.decidedBy) % 200) + 20}`,
              detail: { channel: step.approval.channel, policy: step.policy?.id ?? "" },
            });
          }
          break;
        case "output":
          events.push({
            ...base,
            action: "run.complete",
            category: "run",
            resource: run.id,
            outcome: "success",
          });
          break;
      }
    }

    if (run.status === "failed") {
      events.push({
        actor,
        runId: run.id,
        minutesAgo: run.endedMinutesAgo ?? 0,
        action: "run.fail",
        category: "run",
        resource: run.id,
        outcome: "failed",
        detail: { summary: run.summary },
      });
    }
    if (run.status === "cancelled") {
      events.push({
        actor: { type: "user", id: "priya.natarajan" },
        runId: run.id,
        minutesAgo: run.endedMinutesAgo ?? 0,
        action: "run.cancel",
        category: "run",
        resource: run.id,
        outcome: "success",
        ip: "203.0.113.41",
      });
    }
  }
  return events;
}

/** Configuration and access events from people, between the run events. */
function adminEvents(): Draft[] {
  const user = (name: string) => ({ type: "user" as const, id: userId(name) });
  const deploys: Draft[] = agents
    .filter((agent) => agent.status !== "draft")
    .map((agent) => ({
      actor: user(agent.owner),
      minutesAgo: agent.updatedHoursAgo * 60,
      action: "agent.deploy",
      category: "config" as const,
      resource: `${agent.slug}@${agent.version}`,
      outcome: "success" as const,
      ip: `203.0.113.${(hashString(agent.owner) % 200) + 20}`,
      detail: { from_version: agent.version - 1, traffic: "10% → 100%" },
    }));

  return [
    ...deploys,
    {
      actor: user("Noah Lindqvist"),
      minutesAgo: 480,
      action: "policy.update",
      category: "config",
      resource: "sandbox-egress@8",
      outcome: "success",
      ip: "203.0.113.77",
      detail: { change: "Added files.pythonhosted.org to the default allowlist" },
    },
    {
      actor: user("Dana Whitfield"),
      minutesAgo: 1140,
      action: "policy.update",
      category: "config",
      resource: "p1-replies@6",
      outcome: "success",
      ip: "203.0.113.58",
      detail: { change: "Approval timeout changed from 60m to 30m" },
    },
    {
      actor: user("Elena Rossi"),
      minutesAgo: 1320,
      action: "integration.connect",
      category: "config",
      resource: "identity-provider",
      outcome: "success",
      ip: "203.0.113.24",
      detail: { transport: "Private connector", tools: 4 },
    },
    {
      actor: user("Tom Becker"),
      minutesAgo: 1460,
      action: "apikey.create",
      category: "access",
      resource: "staging-experiments",
      outcome: "success",
      ip: "203.0.113.92",
      detail: { scopes: ["agents:deploy", "runs:create", "runs:read"], environment: "Staging" },
    },
    {
      actor: user("Elena Rossi"),
      minutesAgo: 2890,
      action: "member.invite",
      category: "access",
      resource: "jonas.weber@example.com",
      outcome: "success",
      ip: "203.0.113.24",
      detail: { role: "Viewer" },
    },
    {
      actor: user("Jonas Weber"),
      minutesAgo: 2870,
      action: "audit.export",
      category: "access",
      resource: "audit-log",
      outcome: "success",
      ip: "203.0.113.130",
      detail: { format: "csv", period: "last 90 days", events: 2_841_906 },
    },
    {
      actor: user("Tom Becker"),
      minutesAgo: 212,
      action: "session.login",
      category: "access",
      resource: "sso",
      outcome: "success",
      ip: "203.0.113.92",
    },
    {
      actor: { type: "user", id: "unknown" },
      minutesAgo: 356,
      action: "session.login",
      category: "access",
      resource: "sso",
      outcome: "denied",
      ip: "198.51.100.7",
      detail: { reason: "Source address is not on the IP allowlist" },
    },
    {
      actor: { type: "system", id: "scim" },
      minutesAgo: 22,
      action: "directory.sync",
      category: "access",
      resource: "scim",
      outcome: "success",
      detail: { groups: 14, changes: 0 },
    },
  ];
}

/** 64 hexadecimal characters derived from the event, standing in for a real digest. */
function digest(input: string): string {
  let output = "";
  for (let part = 0; part < 8; part += 1) {
    output += hashString(`${part}:${input}`).toString(16).padStart(8, "0");
  }
  return output;
}

function build(): AuditEvent[] {
  const drafts = [...runEvents(), ...adminEvents()].sort((a, b) => b.minutesAgo - a.minutesAgo);

  let prevHash = digest("genesis");
  const chained = drafts.map((draft, index) => {
    const id = `evt_${hashString(`${index}:${draft.action}:${draft.resource}`).toString(36).padStart(7, "0")}${index.toString(36).padStart(3, "0")}`;
    const hash = digest(`${prevHash}:${id}:${draft.action}:${draft.resource}:${draft.outcome}`);
    const event: AuditEvent = { ...draft, id, hash, prevHash };
    prevHash = hash;
    return event;
  });

  // Newest first for display.
  return chained.reverse();
}

export const auditEvents: AuditEvent[] = build();

export const AUDIT_CATEGORIES: Record<AuditCategory, string> = {
  run: "Runs",
  model: "Model calls",
  tool: "Tool calls",
  memory: "Memory",
  policy: "Policy",
  approval: "Approvals",
  sandbox: "Sandboxes",
  config: "Configuration",
  access: "Access",
};

export function shortHash(hash: string): string {
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
}
