"use client";

import { Ban, Check, CircleX, Globe, RotateCcw, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TimeAgo, Timestamp } from "@/components/console/clock";
import { Avatar, CopyId, JsonView, KeyValue, Mono, Panel, Terminal } from "@/components/console/ui";
import { GateButton } from "@/components/leads/early-access-button";
import {
  DecisionBadge,
  RunStatusBadge,
  STEP_KINDS,
  StepStatusIcon,
} from "@/components/product/status";
import { TraceWaterfall } from "@/components/product/trace";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDuration, formatNumber } from "@/demo/format";
import { getPolicy } from "@/demo/policies";
import type { Run, RunStep } from "@/demo/runs";
import { cn } from "@/lib/cn";

const STEP_STATUS_LABELS: Record<RunStep["status"], string> = {
  ok: "Completed",
  error: "Failed",
  denied: "Denied by policy",
  waiting: "Waiting for approval",
  running: "Running",
  pending: "Not started",
};

/** The step a reader most likely wants first: where the run stopped, or its approval. */
function defaultStep(run: Run): RunStep {
  return (
    run.steps.find((step) => !["ok", "pending"].includes(step.status)) ??
    run.steps.find((step) => step.kind === "approval") ??
    run.steps[0]
  );
}

function StepDetail({ run, step }: { run: Run; step: RunStep }) {
  const kind = STEP_KINDS[step.kind];
  const policy = step.policy ? getPolicy(step.policy.id) : undefined;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white/[0.03]",
            kind.color,
          )}
        >
          <kind.icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.14em] text-fg-subtle uppercase">
            Step {step.index + 1} of {run.steps.length} · {kind.label}
          </p>
          <h2 className="mt-0.5 text-base font-semibold text-fg">{step.title}</h2>
          <Mono className="mt-0.5 block truncate text-fg-subtle">{step.ref}</Mono>
        </div>
      </div>

      <KeyValue
        items={[
          {
            label: "Status",
            value: (
              <span className="inline-flex items-center gap-1.5">
                <StepStatusIcon status={step.status} />
                {STEP_STATUS_LABELS[step.status]}
              </span>
            ),
          },
          ...(step.status === "pending"
            ? []
            : [
                { label: "Started", value: `+${formatDuration(step.startMs)}` },
                { label: "Duration", value: formatDuration(step.durationMs) },
              ]),
          ...(step.tokens
            ? [
                {
                  label: "Tokens",
                  value: `${formatNumber(step.tokens.input)} in · ${formatNumber(step.tokens.output)} out`,
                },
              ]
            : []),
          ...(step.cost !== undefined
            ? [{ label: "Cost", value: formatCurrency(step.cost, 4) }]
            : []),
        ]}
      />

      {step.error ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/10 p-3 text-[13px] text-fg">
          <CircleX className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          <p className="leading-relaxed">{step.error}</p>
        </div>
      ) : null}

      {step.policy ? (
        <div className="rounded-lg border border-line bg-white/[0.02] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-fg">
              <ShieldCheck className="size-3.5 text-fg-subtle" aria-hidden="true" />
              Policy decision
            </p>
            <DecisionBadge decision={step.policy.decision} size="sm" />
          </div>
          <p className="mt-2.5 text-[13px] leading-relaxed text-fg-muted">{step.policy.reason}</p>
          <p className="mt-2 text-xs text-fg-subtle">
            Policy{" "}
            <Link href="/console/policies" className="font-mono text-fg-muted hover:underline">
              {step.policy.id}
            </Link>
            {policy ? ` · v${policy.version} · ${policy.mode}` : ""}
          </p>
        </div>
      ) : null}

      {step.approval ? (
        <div className="rounded-lg border border-line bg-white/[0.02] p-3">
          <p className="text-xs font-medium text-fg">Approval request</p>
          <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
            “{step.approval.request}”
          </p>
          <p className="mt-2 text-xs text-fg-subtle">
            Sent to <Mono className="text-fg-muted">{step.approval.approvers}</Mono> in{" "}
            {step.approval.channel}
          </p>
          {step.approval.decision === "approved" && step.approval.decidedBy ? (
            <div className="mt-3 flex items-center gap-2.5 border-t border-line pt-3">
              <Avatar name={step.approval.decidedBy} />
              <p className="text-[13px] text-fg-muted">
                <span className="font-medium text-fg">{step.approval.decidedBy}</span> approved
                after {formatDuration(step.durationMs)}
              </p>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <GateButton gate="generic" source="console:approve-run" size="sm">
                <Check aria-hidden="true" />
                Approve
              </GateButton>
              <GateButton gate="generic" source="console:reject-run" size="sm" variant="secondary">
                <X aria-hidden="true" />
                Reject
              </GateButton>
              <span className="text-xs text-fg-subtle">
                Waiting {formatDuration(step.durationMs)}
              </span>
            </div>
          )}
        </div>
      ) : null}

      {step.sandbox ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-fg">Sandbox output</p>
            <Link href="/console/sandboxes" className="hover:underline">
              <Mono className="text-fg-subtle">{step.sandbox.id}</Mono>
            </Link>
          </div>
          <Terminal lines={step.sandbox.logs} />
          <KeyValue
            items={[
              { label: "Template", value: <Mono>{step.sandbox.template}</Mono> },
              {
                label: "Exit code",
                value:
                  step.sandbox.exitCode === undefined ? "Still running" : step.sandbox.exitCode,
              },
              { label: "CPU time", value: `${step.sandbox.cpuSeconds.toFixed(1)}s` },
              { label: "Peak memory", value: `${formatNumber(step.sandbox.peakMemoryMb)} MB` },
            ]}
          />
          {step.sandbox.egress.length > 0 ? (
            <ul className="space-y-1.5">
              {step.sandbox.egress.map((entry) => (
                <li
                  key={entry.host}
                  className="flex items-center justify-between gap-3 rounded-md border border-line bg-white/[0.02] px-2.5 py-1.5"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Globe className="size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
                    <Mono className="truncate text-fg-muted">{entry.host}</Mono>
                  </span>
                  <Badge tone={entry.allowed ? "success" : "danger"} size="sm">
                    {entry.allowed ? "Allowed" : "Blocked"}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {step.input !== undefined ? <JsonView value={step.input} label="Input" /> : null}
      {step.output !== undefined ? <JsonView value={step.output} label="Output" /> : null}

      {step.status === "pending" ? (
        <p className="rounded-lg border border-dashed border-line-strong p-3 text-[13px] leading-relaxed text-fg-muted">
          This step has not run. It starts when the steps before it finish.
        </p>
      ) : null}
    </div>
  );
}

export function RunDetailView({ run }: { run: Run }) {
  const [selectedId, setSelectedId] = useState(defaultStep(run).id);
  const selected = run.steps.find((step) => step.id === selectedId) ?? run.steps[0];
  const inProgress = run.status === "running" || run.status === "awaiting_approval";

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-fg">
              <Link href={`/console/agents/${run.agentSlug}`} className="hover:underline">
                {run.agentName}
              </Link>
            </h1>
            <RunStatusBadge status={run.status} />
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-fg-muted">{run.summary}</p>
          <CopyId value={run.id} className="mt-2" />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {inProgress ? (
            <GateButton gate="generic" source="console:cancel-run" variant="secondary" size="sm">
              <Ban aria-hidden="true" />
              Cancel run
            </GateButton>
          ) : null}
          <GateButton gate="run-agent" source="console:replay-run" variant="secondary" size="sm">
            <RotateCcw aria-hidden="true" />
            Replay
          </GateButton>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Trigger", value: <Mono className="text-fg">{run.trigger.label}</Mono> },
          {
            label: "Started",
            value: (
              <>
                <TimeAgo minutes={run.startedMinutesAgo} className="text-fg" />
                <Timestamp
                  minutes={run.startedMinutesAgo}
                  className="mt-0.5 block font-mono text-[11px] text-fg-subtle"
                />
              </>
            ),
          },
          {
            label: inProgress ? "Elapsed" : "Duration",
            value: <span className="text-fg tabular-nums">{formatDuration(run.durationMs)}</span>,
          },
          {
            label: "Steps",
            value: (
              <span className="text-fg tabular-nums">
                {run.steps.filter((step) => step.status !== "pending").length} of {run.steps.length}
              </span>
            ),
          },
          {
            label: "Tokens",
            value: <span className="text-fg tabular-nums">{formatNumber(run.tokens)}</span>,
          },
          {
            label: "Model cost",
            value: (
              <>
                <span className="text-fg tabular-nums">{formatCurrency(run.cost, 3)}</span>
                <span className="mt-0.5 block font-mono text-[11px] text-fg-subtle">
                  agent v{run.version}
                </span>
              </>
            ),
          },
        ].map((item) => (
          <div key={item.label} className="min-w-0 bg-surface px-4 py-3">
            <dt className="text-xs text-fg-subtle">{item.label}</dt>
            <dd className="mt-1 truncate text-[13px]">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel title="Trace" description="Select a step to see its inputs, outputs and decisions.">
          <TraceWaterfall
            run={run}
            selectedId={selected.id}
            onSelect={(step) => setSelectedId(step.id)}
          />
        </Panel>
        <Panel className="xl:sticky xl:top-20">
          <StepDetail key={selected.id} run={run} step={selected} />
        </Panel>
      </div>
    </>
  );
}
