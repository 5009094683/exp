"use client";

import { Bot, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TimeAgo } from "@/components/console/clock";
import { LinkRow } from "@/components/console/link-row";
import {
  EmptyState,
  FilterTabs,
  Mono,
  PageHeader,
  Panel,
  SearchInput,
  SelectFilter,
  Table,
  Td,
  Th,
} from "@/components/console/ui";
import { AgentStatusBadge } from "@/components/product/status";
import { Button } from "@/components/ui/button";
import { agents, MODEL_PROFILES, type AgentStatus } from "@/demo/agents";
import { formatCurrency, formatDuration, formatNumber, formatPercent } from "@/demo/format";
import { lastRunMinutesAgo } from "@/demo/runs";

type StatusFilter = "all" | AgentStatus;

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "degraded", label: "Degraded" },
  { value: "paused", label: "Paused" },
  { value: "draft", label: "Draft" },
];

export function AgentsListView() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [team, setTeam] = useState("all");

  const teams = useMemo(() => [...new Set(agents.map((agent) => agent.team))].sort(), []);

  const visible = agents.filter((agent) => {
    const text = `${agent.name} ${agent.description} ${agent.team} ${agent.slug}`.toLowerCase();
    return (
      (status === "all" || agent.status === status) &&
      (team === "all" || agent.team === team) &&
      text.includes(query.trim().toLowerCase())
    );
  });

  return (
    <>
      <PageHeader
        title="Agents"
        description="Every agent in this workspace, with how it is doing over the last 24 hours."
        actions={
          <Button asChild size="sm">
            <Link href="/console/agents/new">
              <Plus aria-hidden="true" />
              New agent
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search agents"
          className="lg:w-72"
        />
        <FilterTabs
          label="Filter by status"
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS.map((option) => ({
            ...option,
            count:
              option.value === "all"
                ? agents.length
                : agents.filter((agent) => agent.status === option.value).length,
          }))}
        />
        <div className="lg:ml-auto">
          <SelectFilter
            label="Filter by team"
            value={team}
            onChange={setTeam}
            options={[
              { value: "all", label: "All teams" },
              ...teams.map((name) => ({ value: name, label: name })),
            ]}
          />
        </div>
      </div>

      <Panel>
        {visible.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="No agents match"
            description="Try a different search, or clear the status and team filters."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setTeam("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Agent</Th>
                <Th>Status</Th>
                <Th className="hidden lg:table-cell">Model</Th>
                <Th className="hidden text-right md:table-cell">Instances</Th>
                <Th className="text-right">Runs · 24h</Th>
                <Th className="hidden text-right sm:table-cell">Success</Th>
                <Th className="hidden text-right xl:table-cell">p95</Th>
                <Th className="hidden text-right xl:table-cell">Spend · 24h</Th>
                <Th className="hidden text-right md:table-cell">Last run</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((agent) => {
                const lastRun = lastRunMinutesAgo(agent.slug);
                const hasRuns = agent.status !== "draft";
                return (
                  <LinkRow key={agent.slug} href={`/console/agents/${agent.slug}`}>
                    <Td className="max-w-[22rem]">
                      <Link
                        href={`/console/agents/${agent.slug}`}
                        className="font-medium text-fg hover:underline"
                      >
                        {agent.name}
                      </Link>
                      <span className="mt-0.5 block truncate text-xs text-fg-subtle">
                        {agent.team} · v{agent.version}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <AgentStatusBadge status={agent.status} size="sm" />
                    </Td>
                    <Td className="hidden whitespace-nowrap lg:table-cell">
                      <Mono>{MODEL_PROFILES[agent.model].label.toLowerCase()}</Mono>
                    </Td>
                    <Td className="hidden text-right tabular-nums md:table-cell">
                      {formatNumber(agent.instances)}
                    </Td>
                    <Td className="text-right text-fg tabular-nums">
                      {hasRuns ? formatNumber(agent.runs24h) : "—"}
                    </Td>
                    <Td className="hidden text-right tabular-nums sm:table-cell">
                      {hasRuns && agent.runs24h > 0 ? (
                        <span className={agent.successRate < 0.95 ? "text-warning" : undefined}>
                          {formatPercent(agent.successRate)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="hidden text-right font-mono text-xs tabular-nums xl:table-cell">
                      {hasRuns ? formatDuration(agent.p95Ms) : "—"}
                    </Td>
                    <Td className="hidden text-right tabular-nums xl:table-cell">
                      {hasRuns ? formatCurrency(agent.cost24h) : "—"}
                    </Td>
                    <Td className="hidden text-right whitespace-nowrap md:table-cell">
                      {hasRuns && lastRun !== undefined ? <TimeAgo minutes={lastRun} /> : "Never"}
                    </Td>
                  </LinkRow>
                );
              })}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}
