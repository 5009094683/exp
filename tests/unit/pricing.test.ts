import { describe, expect, it } from "vitest";
import { estimate, plans, usageRates } from "@/content/pricing";

describe("pricing estimate", () => {
  it("uses the Team plan for small fleets", () => {
    const result = estimate({ agents: 10, executionsPerAgent: 2000, sandboxVcpuHours: 0 });
    expect(result?.plan.id).toBe("team");
    expect(result).toMatchObject({
      subscription: 490,
      includedExecutions: 25_000,
      extraExecutions: 0,
      executionCost: 0,
      sandboxCost: 0,
      total: 490,
    });
  });

  it("switches to the Business plan above the Team limit", () => {
    expect(estimate({ agents: 25, executionsPerAgent: 0, sandboxVcpuHours: 0 })?.plan.id).toBe(
      "team",
    );
    expect(estimate({ agents: 26, executionsPerAgent: 0, sandboxVcpuHours: 0 })?.plan.id).toBe(
      "business",
    );
  });

  it("charges for executions beyond the pooled allowance and for sandbox time", () => {
    const result = estimate({ agents: 40, executionsPerAgent: 6000, sandboxVcpuHours: 500 });
    expect(result?.plan.id).toBe("business");
    expect(result?.subscription).toBe(40 * 39);
    expect(result?.includedExecutions).toBe(200_000);
    expect(result?.extraExecutions).toBe(40_000);
    expect(result?.executionCost).toBe(40 * usageRates.executionsPerThousand);
    expect(result?.sandboxCost).toBeCloseTo(500 * usageRates.sandboxVcpuHour);
    expect(result?.total).toBeCloseTo(1560 + 160 + 40);
  });

  it("returns null when the fleet needs an enterprise license", () => {
    const largest = Math.max(...plans.map((plan) => plan.maxAgents ?? 0));
    expect(
      estimate({ agents: largest, executionsPerAgent: 1, sandboxVcpuHours: 0 }),
    ).not.toBeNull();
    expect(
      estimate({ agents: largest + 1, executionsPerAgent: 1, sandboxVcpuHours: 0 }),
    ).toBeNull();
  });

  it("ignores negative inputs", () => {
    const result = estimate({ agents: 5, executionsPerAgent: -100, sandboxVcpuHours: -10 });
    expect(result?.total).toBe(5 * 49);
  });
});
