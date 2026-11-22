"use client";

import {
  Activity,
  ArrowRight,
  Boxes,
  CircleDollarSign,
  Hourglass,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BarChart, BarList, SegmentBar, Sparkline } from "@/components/console/charts";
import { TimeAgo, useNow } from "@/components/console/clock";
import { LinkRow } from "@/components/console/link-row";
import { PageHeader, Panel, Stat, Table, Td, Th } from "@/components/console/ui";
import { RunStatusBadge } from "@/components/product/status";
import { Badge, StatusDot } from "@/components/ui/badge";
import { agents, fleet } from "@/demo/agents";
import {
  formatCompact,
  formatCurrency,
  formatDuration,
  formatNumber,
  formatPercent,
} from "@/demo/format";
import { servers } from "@/demo/integrations";
import { policies } from "@/demo/policies";
import { runs } from "@/demo/runs";
import { hourlyRuns } from "@/demo/usage";

/** Counts up slowly after the page loads, so the workspace feels live. */
function useLiveCount(base: number): number {
  const [extra, setExtra] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setExtra((current) => current + Math.floor(Math.random() * 4));
    }, 1800);
    return () => window.clearInterval(timer);
  }, []);

  return base + extra;
}

export function OverviewView() {
  const now = useNow();
  const hours = useMemo(() => hourlyRuns(), []);
  const runCount = useLiveCount(fleet.runs24h);

  const waiting = runs.filter((run) => run.status === "awaiting_approval");
  const failedLastHour = runs.filter(
    (run) => run.status === "failed" && (run.endedMinutesAgo ?? 0) <= 60,
  );
  const degradedServers = servers.filter((server) => server.status === "degraded");
  const longestWait = Math.max(0, ...waiting.map((run) => run.durationMs));

  const decisions = policies.reduce(
    (totals, policy) => ({
      evaluations: totals.evaluations + policy.evaluations24h,
      approvals: totals.approvals + policy.approvals24h,
      denied: totals.denied + policy.denied24h,
    }),
    { evaluations: 0, approvals: 0, denied: 0 },
  );
  const allowed = decisions.evaluations - decisions.approvals - decisions.denied;

  const topAgents = [...agents].sort((a, b) => b.runs24h - a.runs24h).slice(0, 5);

  const chart = hours.map((hour, index) => {
    const at = new Date(now - hour.hoursAgo * 3_600_000);
    const label = `${String(at.getUTCHours()).padStart(2, "0")}:00`;
    const total = hour.succeeded + hour.failed;
    return {
      key: String(hour.hoursAgo),
      label,
      value: total,
      highlight: hour.failed,
      title: `${label} UTC · ${formatNumber(total)} runs, ${formatNumber(hour.failed)} failed`,
      showLabel: index % 4 === 1,
    };
  });

  return (
    <>
      <PageHeader
        title="Overview"
        description="What your agents are doing right now, and what needs a person."
        badge={
          <Badge tone="success">
            <StatusDot tone="success" live />
            Live
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat
          label="Agent instances"
          value={formatNumber(fleet.instances)}
          hint={`${fleet.agents} agents · ${fleet.active} deployed`}
          icon={Boxes}
        />
        <Stat label="Runs · 24h" value={formatNumber(runCount)} icon={Activity}>
          <Sparkline values={hours.map((hour) => hour.succeeded + hour.failed)} className="mt-2" />
        </Stat>
        <Stat
          label="Success rate · 24h"
          value={formatPercent(fleet.successRate)}
          hint={`${formatNumber(Math.round(fleet.runs24h * (1 - fleet.successRate)))} failed`}
          icon={ShieldCheck}
        />
        <Stat
          label="Awaiting approval"
          value={waiting.length}
          hint={`Longest wait ${formatDuration(longestWait)}`}
          icon={Hourglass}
          tone={waiting.length > 0 ? "warning" : "default"}
        />
        <div className="col-span-2 lg:col-span-1">
          <Stat
            label="Model spend · 24h"
            value={formatCurrency(fleet.cost24h, 0)}
            hint={`${formatNumber(fleet.approvals24h)} approvals requested`}
            icon={CircleDollarSign}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Panel
            title="Runs per hour"
            description="Last 24 hours, UTC. Failed runs are shown in red."
            bodyClassName="p-4 pt-5"
          >
            <BarChart data={chart} formatValue={formatCompact} />
          </Panel>

          <Panel
            title="Recent runs"
            action={
              <Link
                href="/console/runs"
                className="inline-flex items-center gap-1 text-xs text-fg-muted transition-colors hover:text-fg"
              >
                All runs
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            }
          >
            <Table>
              <thead>
                <tr>
                  <Th>Status</Th>
                  <Th>Agent</Th>
                  <Th className="hidden md:table-cell">Outcome</Th>
                  <Th>Started</Th>
                  <Th className="hidden text-right sm:table-cell">Duration</Th>
                </tr>
              </thead>
              <tbody>
                {runs.slice(0, 8).map((run) => (
                  <LinkRow key={run.id} href={`/console/runs/${run.id}`}>
                    <Td className="whitespace-nowrap">
                      <RunStatusBadge status={run.status} size="sm" />
                    </Td>
                    <Td className="whitespace-nowrap">
                      <Link
                        href={`/console/runs/${run.id}`}
                        className="font-medium text-fg hover:underline"
                      >
                        {run.agentName}
                      </Link>
                    </Td>
                    <Td className="hidden max-w-0 md:table-cell md:w-full">
                      <span className="block truncate">{run.summary}</span>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <TimeAgo minutes={run.startedMinutesAgo} />
                    </Td>
                    <Td className="hidden text-right font-mono text-xs whitespace-nowrap tabular-nums sm:table-cell">
                      {formatDuration(run.durationMs)}
                    </Td>
                  </LinkRow>
                ))}
              </tbody>
            </Table>
          </Panel>
        </div>

        <div className="min-w-0 space-y-6">
          <Panel title="Needs attention" bodyClassName="divide-y divide-line">
            {waiting.map((run) => {
              const step = run.steps.find((item) => item.status === "waiting");
              return (
                <Link
                  key={run.id}
                  href={`/console/runs/${run.id}`}
                  className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
                >
                  <Hourglass className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-fg">
                      {step?.approval?.request ?? run.summary}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-fg-subtle">
                      {run.agentName} · waiting {formatDuration(step?.durationMs ?? 0)} for{" "}
                      {step?.approval?.approvers}
                    </span>
                  </span>
                  <ArrowRight
                    className="mt-0.5 size-3.5 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
            {degradedServers.map((server) => (
              <Link
                key={server.id}
                href="/console/integrations"
                className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
              >
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-fg">
                    {server.name} is degraded
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-fg-subtle">
                    {formatPercent(server.errorRate)} of calls failing · p50{" "}
                    {formatDuration(server.p50Ms)}
                  </span>
                </span>
                <ArrowRight
                  className="mt-0.5 size-3.5 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            ))}
            {failedLastHour.length > 0 ? (
              <Link
                href={{ pathname: "/console/runs", query: { status: "failed" } }}
                className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
              >
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-fg">
                    {failedLastHour.length} sampled {failedLastHour.length === 1 ? "run" : "runs"}{" "}
                    failed in the last hour
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-fg-subtle">
                    {failedLastHour.map((run) => run.agentName).join(", ")}
                  </span>
                </span>
                <ArrowRight
                  className="mt-0.5 size-3.5 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            ) : null}
          </Panel>

          <Panel
            title="Policy decisions · 24h"
            action={
              <Link
                href="/console/policies"
                className="inline-flex items-center gap-1 text-xs text-fg-muted transition-colors hover:text-fg"
              >
                Policies
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            }
            bodyClassName="p-4"
          >
            <p className="text-2xl font-semibold tracking-tight text-fg tabular-nums">
              {formatNumber(decisions.evaluations)}
            </p>
            <p className="mt-0.5 text-xs text-fg-subtle">actions checked before they ran</p>
            <div className="mt-4">
              <SegmentBar
                segments={[
                  { key: "allowed", value: allowed, className: "bg-success/80" },
                  { key: "approval", value: decisions.approvals, className: "bg-warning" },
                  { key: "denied", value: decisions.denied, className: "bg-danger" },
                ]}
              />
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <div>
                <dt className="flex items-center gap-1.5 text-fg-subtle">
                  <StatusDot tone="success" /> Allowed
                </dt>
                <dd className="mt-1 font-mono text-[13px] text-fg tabular-nums">
                  {formatNumber(allowed)}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-fg-subtle">
                  <StatusDot tone="warning" /> Approval
                </dt>
                <dd className="mt-1 font-mono text-[13px] text-fg tabular-nums">
                  {formatNumber(decisions.approvals)}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-fg-subtle">
                  <StatusDot tone="danger" /> Denied
                </dt>
                <dd className="mt-1 font-mono text-[13px] text-fg tabular-nums">
                  {formatNumber(decisions.denied)}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Busiest agents · 24h" bodyClassName="p-4">
            <BarList
              formatValue={formatNumber}
              items={topAgents.map((agent) => ({
                key: agent.slug,
                value: agent.runs24h,
                label: (
                  <Link href={`/console/agents/${agent.slug}`} className="hover:underline">
                    {agent.name}
                  </Link>
                ),
              }))}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
