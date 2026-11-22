import { describe, expect, it } from "vitest";
import { plans, usageRates } from "@/content/pricing";
import { agents, fleet, getAgent } from "@/demo/agents";
import { auditEvents } from "@/demo/audit";
import { buildManifest, manifestForAgent, versionHistory } from "@/demo/manifest";
import { memoryEntries, memoryScopes } from "@/demo/memory";
import { getPolicy } from "@/demo/policies";
import { getRun } from "@/demo/runs";
import { sandboxSessions } from "@/demo/sandbox-sessions";
import { getSandboxTemplate } from "@/demo/sandboxes";
import { billingPeriod, currentBill, dailyUsage, hourlyRuns, usageByAgent } from "@/demo/usage";
import { apiKeys, members, modelRouting } from "@/demo/workspace";

const NOW = Date.UTC(2026, 10, 22, 21, 41);
const memberIds = new Set(members.map((member) => member.name.toLowerCase().replace(/\s+/g, ".")));

describe("demo audit log", () => {
  it("is ordered newest first with unique ids", () => {
    const times = auditEvents.map((event) => event.minutesAgo);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(new Set(auditEvents.map((event) => event.id)).size).toBe(auditEvents.length);
  });

  it("links every event to the one before it", () => {
    for (let index = 0; index < auditEvents.length - 1; index += 1) {
      expect(auditEvents[index].prevHash).toBe(auditEvents[index + 1].hash);
    }
    for (const event of auditEvents) expect(event.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(new Set(auditEvents.map((event) => event.hash)).size).toBe(auditEvents.length);
  });

  it("only references runs and people that exist in the workspace", () => {
    for (const event of auditEvents) {
      if (event.runId) expect(getRun(event.runId), event.runId).toBeDefined();
      if (event.actor.type === "user" && event.actor.id !== "unknown") {
        expect(memberIds, event.actor.id).toContain(event.actor.id);
      }
    }
  });

  it("records a policy decision for every denied step", () => {
    const denied = auditEvents.filter((event) => event.outcome === "denied");
    expect(denied.length).toBeGreaterThan(0);
    for (const event of denied) expect(["policy", "access"]).toContain(event.category);
  });
});

describe("demo usage and billing", () => {
  it("spreads the last 24 hours of runs without losing any", () => {
    const hours = hourlyRuns();
    expect(hours).toHaveLength(24);
    expect(hours.reduce((sum, hour) => sum + hour.succeeded + hour.failed, 0)).toBe(fleet.runs24h);
    for (const hour of hours) expect(hour.succeeded).toBeGreaterThan(hour.failed);
  });

  it("is deterministic for a given moment", () => {
    expect(dailyUsage(NOW)).toEqual(dailyUsage(NOW));
    expect(currentBill(NOW)).toEqual(currentBill(NOW));
  });

  it("derives the billing period from the calendar month", () => {
    const period = billingPeriod(NOW);
    expect(period.start.toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-11-30T00:00:00.000Z");
    expect(period.daysElapsed).toBe(22);
    expect(period.daysInMonth).toBe(30);
    expect(billingPeriod(Date.UTC(2028, 1, 29)).daysInMonth).toBe(29);
  });

  it("bills with the public price list", () => {
    const bill = currentBill(NOW);
    const business = plans.find((plan) => plan.id === "business")!;
    const usage = usageByAgent(NOW);

    expect(bill.billableAgents).toBe(agents.filter((agent) => agent.status !== "draft").length);
    expect(bill.executions).toBe(usage.reduce((sum, item) => sum + item.executions, 0));
    expect(bill.lines[0].amount).toBe(bill.billableAgents * business.pricePerAgent!);
    expect(bill.lines[1].amount).toBeCloseTo(
      (Math.max(0, bill.executions - bill.includedExecutions) / 1000) *
        usageRates.executionsPerThousand,
    );
    expect(bill.lines[2].amount).toBeCloseTo(bill.sandboxVcpuHours * usageRates.sandboxVcpuHour);
    expect(bill.total).toBeCloseTo(bill.lines.reduce((sum, line) => sum + line.amount, 0));
    expect(bill.projected).toBeGreaterThanOrEqual(bill.total);
  });

  it("lists agents by volume", () => {
    const executions = usageByAgent(NOW).map((item) => item.executions);
    expect(executions).toEqual([...executions].sort((a, b) => b - a));
  });
});

describe("demo memory", () => {
  it("places every entry in a scope that exists", () => {
    const scopes = new Set(memoryScopes.map((scope) => scope.id));
    expect(new Set(memoryEntries.map((entry) => entry.id)).size).toBe(memoryEntries.length);
    for (const entry of memoryEntries) {
      expect(scopes, entry.id).toContain(entry.scope);
      expect(entry.store.startsWith(entry.scope), entry.store).toBe(true);
      if (entry.sourceRunId) expect(getRun(entry.sourceRunId), entry.id).toBeDefined();
    }
  });

  it("names writers that are agents or members", () => {
    const people = new Set(members.map((member) => member.name));
    for (const entry of memoryEntries) {
      expect(
        getAgent(entry.writtenBy) !== undefined || people.has(entry.writtenBy),
        entry.writtenBy,
      ).toBe(true);
    }
  });
});

describe("demo sandbox sessions", () => {
  it("reference templates, agents and runs that exist", () => {
    expect(new Set(sandboxSessions.map((session) => session.id)).size).toBe(sandboxSessions.length);
    for (const session of sandboxSessions) {
      expect(getSandboxTemplate(session.template), session.template).toBeDefined();
      expect(getAgent(session.agentSlug), session.agentSlug).toBeDefined();
      if (session.runId) expect(getRun(session.runId), session.runId).toBeDefined();
      expect(session.logs.length).toBeGreaterThan(0);
    }
  });

  it("cover each outcome the console can show", () => {
    const statuses = new Set(sandboxSessions.map((session) => session.status));
    expect(statuses).toEqual(new Set(["running", "completed", "failed", "terminated"]));
  });
});

describe("demo workspace", () => {
  it("has unique members and keys created by members", () => {
    const names = new Set(members.map((member) => member.name));
    expect(names.size).toBe(members.length);
    expect(new Set(members.map((member) => member.email)).size).toBe(members.length);
    for (const member of members) expect(member.email).toMatch(/@example\.com$/);
    for (const key of apiKeys) expect(names, key.createdBy).toContain(key.createdBy);
  });

  it("gives every agent an owner in the workspace", () => {
    const names = new Set(members.map((member) => member.name));
    for (const agent of agents)
      expect(names, `${agent.slug} → ${agent.owner}`).toContain(agent.owner);
  });

  it("routes all model traffic", () => {
    expect(modelRouting.reduce((sum, route) => sum + route.share24h, 0)).toBeCloseTo(1);
  });
});

describe("agent manifests", () => {
  it("render every section of an agent definition", () => {
    const agent = getAgent("code-review")!;
    const manifest = manifestForAgent(agent);

    expect(manifest).toContain("name: code-review\n");
    expect(manifest).toContain(`model: ${agent.model}\n`);
    for (const tool of agent.tools) expect(manifest).toContain(`  - ${tool}\n`);
    for (const policy of agent.policies) {
      expect(getPolicy(policy)).toBeDefined();
      expect(manifest).toContain(`  - ${policy}\n`);
    }
    expect(manifest).toContain(`sandbox:\n  template: ${agent.sandbox}\n`);
    expect(manifest).toMatch(/limits:\n {2}concurrency: \d+\n {2}max_duration: \d+m\n/);
  });

  it("stay valid when the form is empty", () => {
    const manifest = buildManifest({
      name: "  ",
      description: "",
      model: "balanced",
      instructions: "",
      triggers: [],
      tools: [],
      policies: ["least-privilege"],
      memoryScopes: ["agent"],
      concurrency: 1,
      maxDuration: "10m",
      dailyBudgetUsd: 0,
    });

    expect(manifest).toContain("name: new-agent\n");
    expect(manifest).toContain("triggers:\n  - manual\n");
    expect(manifest).not.toContain("sandbox:");
    expect(manifest).not.toContain("undefined");
  });

  it("quote values that would otherwise change meaning in YAML", () => {
    const manifest = buildManifest({
      name: "Refunds: tier 2",
      description: "Handles refunds: over $500",
      model: "fast",
      instructions: "Check the order.",
      triggers: ["zendesk · ticket.created"],
      tools: [],
      policies: [],
      memoryScopes: [],
      concurrency: 1,
      maxDuration: "5m",
      dailyBudgetUsd: 50,
    });

    expect(manifest).toContain("name: refunds-tier-2\n");
    expect(manifest).toContain('description: "Handles refunds: over $500"\n');
  });

  it("number versions down from the current one", () => {
    for (const agent of agents) {
      const history = versionHistory(agent);
      expect(history[0]?.version ?? agent.version).toBe(agent.version);
      const hours = history.map((entry) => entry.hoursAgo);
      expect(hours).toEqual([...hours].sort((a, b) => a - b));
      expect(history.filter((entry) => entry.traffic === 1)).toHaveLength(history.length ? 1 : 0);
    }
  });
});
