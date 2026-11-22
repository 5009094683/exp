"use client";

import { Activity } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
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
import { RunStatusBadge } from "@/components/product/status";
import { Button } from "@/components/ui/button";
import { agents, fleet } from "@/demo/agents";
import { formatCurrency, formatDuration, formatNumber } from "@/demo/format";
import { RUN_STATUS_LABELS, runs, type Run, type RunStatus } from "@/demo/runs";

type StatusFilter = "all" | RunStatus;

const STATUSES: RunStatus[] = [
  "running",
  "awaiting_approval",
  "succeeded",
  "failed",
  "blocked",
  "cancelled",
];

function isStatus(value: string | null): value is RunStatus {
  return value !== null && (STATUSES as string[]).includes(value);
}

/** Table of runs; reused on the agent page with the agent column hidden. */
export function RunsTable({
  items,
  showAgent = true,
  compact = false,
}: {
  items: Run[];
  showAgent?: boolean;
  /** Fewer columns, for narrow panels. */
  compact?: boolean;
}) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Status</Th>
          <Th>Run</Th>
          {showAgent ? <Th>Agent</Th> : null}
          {compact ? null : <Th className="hidden lg:table-cell">Trigger</Th>}
          <Th>Started</Th>
          <Th className="hidden text-right sm:table-cell">Duration</Th>
          {compact ? null : <Th className="hidden text-right md:table-cell">Steps</Th>}
          {compact ? null : <Th className="hidden text-right xl:table-cell">Model cost</Th>}
        </tr>
      </thead>
      <tbody>
        {items.map((run) => {
          const done = run.steps.filter((step) => step.status !== "pending").length;
          return (
            <LinkRow key={run.id} href={`/console/runs/${run.id}`}>
              <Td className="whitespace-nowrap">
                <RunStatusBadge status={run.status} size="sm" />
              </Td>
              <Td className="max-w-[26rem]">
                <Link href={`/console/runs/${run.id}`} className="hover:underline">
                  <Mono className="text-fg">{run.id}</Mono>
                </Link>
                <span className="mt-0.5 block truncate text-xs text-fg-subtle">{run.summary}</span>
              </Td>
              {showAgent ? <Td className="whitespace-nowrap text-fg">{run.agentName}</Td> : null}
              {compact ? null : (
                <Td className="hidden whitespace-nowrap lg:table-cell">
                  <Mono>{run.trigger.label}</Mono>
                </Td>
              )}
              <Td className="whitespace-nowrap">
                <TimeAgo minutes={run.startedMinutesAgo} />
              </Td>
              <Td className="hidden text-right font-mono text-xs whitespace-nowrap tabular-nums sm:table-cell">
                {formatDuration(run.durationMs)}
              </Td>
              {compact ? null : (
                <Td className="hidden text-right tabular-nums md:table-cell">
                  {done}/{run.steps.length}
                </Td>
              )}
              {compact ? null : (
                <Td className="hidden text-right tabular-nums xl:table-cell">
                  {formatCurrency(run.cost, 3)}
                </Td>
              )}
            </LinkRow>
          );
        })}
      </tbody>
    </Table>
  );
}

export function RunsListView() {
  const params = useSearchParams();
  const initialStatus = params.get("status");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>(
    isStatus(initialStatus) ? initialStatus : "all",
  );
  const [agent, setAgent] = useState("all");

  const visible = runs.filter((run) => {
    const text = `${run.id} ${run.agentName} ${run.summary} ${run.trigger.label}`.toLowerCase();
    return (
      (status === "all" || run.status === status) &&
      (agent === "all" || run.agentSlug === agent) &&
      text.includes(query.trim().toLowerCase())
    );
  });

  return (
    <>
      <PageHeader
        title="Runs"
        description={`A sample of recent runs. This workspace completed ${formatNumber(fleet.runs24h)} in the last 24 hours.`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search by run ID, agent or outcome"
          className="min-w-0 flex-1 sm:w-80 sm:flex-none"
        />
        <div className="order-last w-full min-w-0">
          <FilterTabs
            label="Filter by status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all" as StatusFilter, label: "All", count: runs.length },
              ...STATUSES.map((value) => ({
                value: value as StatusFilter,
                label: RUN_STATUS_LABELS[value],
                count: runs.filter((run) => run.status === value).length,
              })),
            ]}
          />
        </div>
        <div className="ml-auto">
          <SelectFilter
            label="Filter by agent"
            value={agent}
            onChange={setAgent}
            options={[
              { value: "all", label: "All agents" },
              ...agents
                .filter((item) => runs.some((run) => run.agentSlug === item.slug))
                .map((item) => ({ value: item.slug, label: item.name })),
            ]}
          />
        </div>
      </div>

      <Panel>
        {visible.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No runs match"
            description="Try a different search, or clear the status and agent filters."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setAgent("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <RunsTable items={visible} />
        )}
      </Panel>
    </>
  );
}
