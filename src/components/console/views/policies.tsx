"use client";

import { Check, CircleCheck, LoaderCircle, Pencil, Play, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { SegmentBar } from "@/components/console/charts";
import { TimeAgo } from "@/components/console/clock";
import { KeyValue, Mono, PageHeader, Panel, Stat } from "@/components/console/ui";
import { GateButton } from "@/components/leads/early-access-button";
import { DecisionBadge } from "@/components/product/status";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { agents } from "@/demo/agents";
import { formatCompact, formatNumber } from "@/demo/format";
import { policies, type Policy } from "@/demo/policies";
import { cn } from "@/lib/cn";

type TestState = "idle" | "running" | "passed";

function PolicyTests({ policy }: { policy: Policy }) {
  const [state, setState] = useState<TestState>("idle");

  useEffect(() => {
    if (state !== "running") return;
    const timer = window.setTimeout(() => setState("passed"), 900);
    return () => window.clearTimeout(timer);
  }, [state]);

  return (
    <Panel
      title="Tests"
      description="Example requests with the decision each one must get."
      action={
        <Button
          variant="secondary"
          size="sm"
          disabled={state === "running"}
          onClick={() => setState("running")}
        >
          {state === "running" ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Play aria-hidden="true" />
          )}
          Run tests
        </Button>
      }
      bodyClassName="divide-y divide-line"
    >
      {policy.tests.map((test) => (
        <div key={test.label} className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-medium text-fg">{test.label}</p>
            <div className="flex items-center gap-2">
              {state === "passed" ? (
                <span className="inline-flex animate-fade-in items-center gap-1 text-xs text-success">
                  <Check className="size-3.5" aria-hidden="true" />
                  Passed
                </span>
              ) : null}
              <DecisionBadge decision={test.decision} size="sm" />
            </div>
          </div>
          <Mono className="mt-1.5 block break-words text-fg-muted">{test.request}</Mono>
          <p className="mt-1 font-mono text-[11px] text-fg-subtle">matched {test.rule}</p>
        </div>
      ))}
      <p className="px-4 py-2.5 text-xs text-fg-subtle" aria-live="polite">
        {state === "passed"
          ? `${policy.tests.length} of ${policy.tests.length} tests passed against v${policy.version}.`
          : "Tests run automatically whenever a policy changes."}
      </p>
    </Panel>
  );
}

function PolicyDetail({ policy }: { policy: Policy }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(policy.source);
  const allowed = policy.evaluations24h - policy.approvals24h - policy.denied24h;
  const appliesTo = agents.filter((agent) => agent.policies.includes(policy.id));

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-lg font-semibold tracking-tight text-fg">{policy.name}</h2>
            <Badge tone={policy.mode === "enforce" ? "success" : "info"}>
              <StatusDot tone={policy.mode === "enforce" ? "success" : "info"} />
              {policy.mode === "enforce" ? "Enforcing" : "Monitoring"}
            </Badge>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{policy.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {editing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft(policy.source);
                  setEditing(false);
                }}
              >
                Discard
              </Button>
              <GateButton gate="save-policy" size="sm">
                Save policy
              </GateButton>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil aria-hidden="true" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          {editing ? (
            <div className="overflow-hidden rounded-xl border border-accent/50 bg-surface">
              <div className="flex h-10 items-center justify-between border-b border-line bg-white/[0.02] px-4">
                <span className="font-mono text-xs text-fg-subtle">policies/{policy.id}.yaml</span>
                <Badge tone="accent" size="sm">
                  Editing
                </Badge>
              </div>
              <label className="sr-only" htmlFor={`policy-${policy.id}`}>
                Policy source
              </label>
              <textarea
                id={`policy-${policy.id}`}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                spellCheck={false}
                rows={draft.split("\n").length + 1}
                className="block w-full resize-y bg-transparent p-4 font-mono text-[13px] leading-[1.7] text-fg focus:outline-none"
              />
            </div>
          ) : (
            <CodeBlock
              code={policy.source}
              language="yaml"
              title={`policies/${policy.id}.yaml`}
              lineNumbers
            />
          )}
          <PolicyTests key={policy.id} policy={policy} />
        </div>

        <div className="min-w-0 space-y-6">
          <Panel title="Decisions · 24h" bodyClassName="p-4">
            <p className="text-2xl font-semibold tracking-tight text-fg tabular-nums">
              {formatNumber(policy.evaluations24h)}
            </p>
            <p className="mt-0.5 text-xs text-fg-subtle">
              {policy.mode === "monitor" ? "evaluations (nothing blocked)" : "evaluations"}
            </p>
            <div className="mt-4">
              <SegmentBar
                segments={[
                  { key: "allowed", value: allowed, className: "bg-success/80" },
                  { key: "approval", value: policy.approvals24h, className: "bg-warning" },
                  { key: "denied", value: policy.denied24h, className: "bg-danger" },
                ]}
              />
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-xs">
              {[
                { label: "Allowed", value: allowed, tone: "success" as const },
                { label: "Approval", value: policy.approvals24h, tone: "warning" as const },
                { label: "Denied", value: policy.denied24h, tone: "danger" as const },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="flex items-center gap-1.5 text-fg-subtle">
                    <StatusDot tone={item.tone} /> {item.label}
                  </dt>
                  <dd className="mt-1 font-mono text-[13px] text-fg tabular-nums">
                    {formatNumber(item.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Details" bodyClassName="px-4 py-1.5">
            <KeyValue
              items={[
                { label: "Applies to", value: policy.scope },
                { label: "Version", value: <Mono>v{policy.version}</Mono> },
                { label: "Last changed", value: <TimeAgo minutes={policy.updatedHoursAgo * 60} /> },
                { label: "Changed by", value: policy.author },
                {
                  label: "Agents",
                  value:
                    appliesTo.length === agents.length
                      ? "All agents"
                      : appliesTo.map((agent) => agent.name).join(", ") || "None",
                },
              ]}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}

export function PoliciesView() {
  const [selectedId, setSelectedId] = useState(policies[1].id);
  const selected = policies.find((policy) => policy.id === selectedId) ?? policies[0];

  const totals = policies.reduce(
    (sum, policy) => ({
      evaluations: sum.evaluations + policy.evaluations24h,
      approvals: sum.approvals + policy.approvals24h,
      denied: sum.denied + policy.denied24h,
    }),
    { evaluations: 0, approvals: 0, denied: 0 },
  );

  return (
    <>
      <PageHeader
        title="Policies"
        description="Rules checked before every action. They decide what runs on its own, what needs a person and what never happens."
        actions={
          <GateButton gate="save-policy" source="console:new-policy" size="sm">
            <Plus aria-hidden="true" />
            New policy
          </GateButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Policies"
          value={policies.length}
          hint={`${policies.filter((policy) => policy.mode === "monitor").length} in monitor mode`}
        />
        <Stat
          label="Evaluations · 24h"
          value={formatCompact(totals.evaluations)}
          icon={CircleCheck}
        />
        <Stat label="Sent for approval" value={formatNumber(totals.approvals)} tone="warning" />
        <Stat label="Denied" value={formatNumber(totals.denied)} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Panel className="self-start">
          <ul className="divide-y divide-line" aria-label="Policies">
            {policies.map((policy) => {
              const active = policy.id === selected.id;
              return (
                <li key={policy.id} className="relative">
                  {active ? (
                    <span
                      className="absolute inset-y-0 left-0 w-0.5 bg-accent-text"
                      aria-hidden="true"
                    />
                  ) : null}
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => setSelectedId(policy.id)}
                    className={cn(
                      "block w-full px-4 py-3 text-left transition-colors",
                      active ? "bg-accent/[0.08]" : "hover:bg-white/[0.03]",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-medium text-fg">
                        {policy.name}
                      </span>
                      <StatusDot tone={policy.mode === "enforce" ? "success" : "info"} />
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2 text-xs text-fg-subtle">
                      <Mono>{policy.id}</Mono>
                      <span className="tabular-nums">{formatCompact(policy.evaluations24h)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        <PolicyDetail key={selected.id} policy={selected} />
      </div>
    </>
  );
}
