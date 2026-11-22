import { describe, expect, it } from "vitest";
import { agents, fleet, getAgent } from "@/demo/agents";
import { getServer, getTool, servers } from "@/demo/integrations";
import { getPolicy, policies } from "@/demo/policies";
import { runs, showcaseRun } from "@/demo/runs";
import { getSandboxTemplate, sandboxTemplates } from "@/demo/sandboxes";
import { scenarios } from "@/demo/scenarios";

describe("demo agents", () => {
  it("have unique slugs and ids", () => {
    expect(new Set(agents.map((agent) => agent.slug)).size).toBe(agents.length);
    expect(new Set(agents.map((agent) => agent.id)).size).toBe(agents.length);
  });

  it("only reference tools, policies and sandboxes that exist", () => {
    for (const agent of agents) {
      for (const tool of agent.tools) {
        expect(getTool(tool), `${agent.slug} → ${tool}`).toBeDefined();
      }
      for (const policy of agent.policies) {
        expect(getPolicy(policy), `${agent.slug} → ${policy}`).toBeDefined();
      }
      if (agent.sandbox) {
        expect(getSandboxTemplate(agent.sandbox), `${agent.slug} → ${agent.sandbox}`).toBeDefined();
      }
    }
  });

  it("produce consistent fleet totals", () => {
    expect(fleet.agents).toBe(agents.length);
    expect(fleet.runs24h).toBe(agents.reduce((sum, agent) => sum + agent.runs24h, 0));
    expect(fleet.successRate).toBeGreaterThan(0.95);
    expect(fleet.successRate).toBeLessThan(1);
  });
});

describe("demo integrations and sandboxes", () => {
  it("have unique ids", () => {
    expect(new Set(servers.map((server) => server.id)).size).toBe(servers.length);
    expect(new Set(sandboxTemplates.map((template) => template.id)).size).toBe(
      sandboxTemplates.length,
    );
  });

  it("list sandbox users that exist", () => {
    for (const template of sandboxTemplates) {
      for (const slug of template.usedBy) expect(getAgent(slug), slug).toBeDefined();
    }
  });
});

describe("demo policies", () => {
  it("have unique ids and at least one test each", () => {
    expect(new Set(policies.map((policy) => policy.id)).size).toBe(policies.length);
    for (const policy of policies) expect(policy.tests.length).toBeGreaterThan(0);
  });
});

describe("demo scenarios", () => {
  it("exist for every agent that has run, using only its granted tools", () => {
    for (const [slug, list] of Object.entries(scenarios)) {
      const agent = getAgent(slug);
      expect(agent, slug).toBeDefined();
      for (const scenario of list) {
        for (const step of scenario.steps) {
          if (step.kind === "tool") {
            expect(agent!.tools, `${slug} uses ${step.ref}`).toContain(step.ref);
            expect(getServer(step.ref.split(".")[0])).toBeDefined();
          }
          if (step.policy) expect(getPolicy(step.policy.id), step.policy.id).toBeDefined();
          if (step.sandbox) expect(agent!.sandbox).toBe(step.sandbox.template);
        }
      }
    }
  });
});

describe("demo runs", () => {
  it("are deterministic, unique and sorted most recent first", () => {
    expect(new Set(runs.map((run) => run.id)).size).toBe(runs.length);
    const starts = runs.map((run) => run.startedMinutesAgo);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    for (const run of runs) expect(run.id).toMatch(/^run_[0-9a-z]{12}$/);
  });

  it("have steps whose state matches the run status", () => {
    for (const run of runs) {
      const statuses = run.steps.map((step) => step.status);
      const label = `${run.agentSlug} (${run.status})`;

      if (run.status === "succeeded") {
        expect(
          statuses.every((status) => status === "ok"),
          label,
        ).toBe(true);
      }
      if (run.status === "failed") expect(statuses, label).toContain("error");
      if (run.status === "blocked") expect(statuses, label).toContain("denied");
      if (run.status === "awaiting_approval") expect(statuses, label).toContain("waiting");
      if (run.status === "running") expect(statuses, label).toContain("running");
      if (run.status !== "succeeded") expect(statuses.at(-1), label).toBe("pending");

      // Nothing runs after the step where a run stopped.
      const stopped = statuses.findIndex((status) => status !== "ok");
      if (stopped !== -1) {
        expect(
          statuses.slice(stopped + 1).every((status) => status === "pending"),
          label,
        ).toBe(true);
      }
    }
  });

  it("have timelines that add up", () => {
    for (const run of runs) {
      let cursor = 0;
      for (const step of run.steps) {
        expect(step.startMs).toBeGreaterThanOrEqual(cursor);
        cursor = step.startMs + step.durationMs;
      }
      expect(run.durationMs).toBeGreaterThanOrEqual(cursor);
      expect(run.cost).toBeGreaterThanOrEqual(0);
      expect(run.summary).not.toBe("");
    }
  });

  it("do not claim to have run longer than the time since they started", () => {
    for (const run of runs) {
      expect(run.durationMs, `${run.agentSlug} (${run.status})`).toBeLessThanOrEqual(
        run.startedMinutesAgo * 60_000 + 60,
      );
    }
  });

  it("include a finished run with an approval for product visuals", () => {
    expect(showcaseRun.status).toBe("succeeded");
    expect(showcaseRun.steps.some((step) => step.kind === "approval")).toBe(true);
  });
});
