"use client";

import {
  Activity,
  CirclePause,
  Clock,
  Database,
  KeyRound,
  Pencil,
  Play,
  Rocket,
  RotateCcw,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Sparkline } from "@/components/console/charts";
import { TimeAgo } from "@/components/console/clock";
import {
  Avatar,
  CopyId,
  EmptyState,
  KeyValue,
  Mono,
  Monogram,
  Panel,
  Stat,
  Table,
  Td,
  Th,
} from "@/components/console/ui";
import { RunsTable } from "@/components/console/views/runs-list";
import { GateButton } from "@/components/leads/early-access-button";
import { AgentStatusBadge } from "@/components/product/status";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fleet, MODEL_PROFILES, type Agent } from "@/demo/agents";
import { formatCurrency, formatDuration, formatNumber, formatPercent } from "@/demo/format";
import { getServer, type ToolPermission } from "@/demo/integrations";
import { manifestForAgent, versionHistory } from "@/demo/manifest";
import { getPolicy } from "@/demo/policies";
import { runsForAgent } from "@/demo/runs";
import { getSandboxTemplate } from "@/demo/sandboxes";
import { hourlyRuns } from "@/demo/usage";

const PERMISSION: Record<
  ToolPermission,
  { label: string; tone: "success" | "warning" | "danger" }
> = {
  allow: { label: "Allowed", tone: "success" },
  approval: { label: "Needs approval", tone: "warning" },
  deny: { label: "Blocked", tone: "danger" },
};

export function AgentDetailView({ agent }: { agent: Agent }) {
  const agentRuns = runsForAgent(agent.slug);
  const manifest = manifestForAgent(agent);
  const versions = versionHistory(agent);
  const hasRuns = agent.status !== "draft";
  const share = agent.runs24h / Math.max(1, fleet.runs24h);
  const trend = hourlyRuns().map((hour) => Math.round((hour.succeeded + hour.failed) * share));

  const groups = new Map<string, string[]>();
  for (const reference of agent.tools) {
    const [serverId, tool] = reference.split(".");
    groups.set(serverId, [...(groups.get(serverId) ?? []), tool]);
  }
  const toolGroups = [...groups.entries()];

  const sandbox = agent.sandbox ? getSandboxTemplate(agent.sandbox) : undefined;

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-fg">{agent.name}</h1>
            <AgentStatusBadge status={agent.status} />
            <Badge tone="neutral">v{agent.version}</Badge>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-fg-muted">
            {agent.description}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-fg-subtle">
            <span className="flex items-center gap-1.5">
              <Avatar name={agent.owner} className="size-5 text-[9px]" />
              {agent.owner} · {agent.team}
            </span>
            <CopyId value={agent.id} />
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <GateButton gate="run-agent" variant="secondary" size="sm">
            <Play aria-hidden="true" />
            Run now
          </GateButton>
          {agent.status === "active" || agent.status === "degraded" ? (
            <GateButton gate="generic" source="console:pause-agent" variant="secondary" size="sm">
              <CirclePause aria-hidden="true" />
              Pause
            </GateButton>
          ) : null}
          <GateButton gate="deploy-agent" size="sm">
            <Rocket aria-hidden="true" />
            Deploy new version
          </GateButton>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="runs">
            Runs
            <span className="text-fg-faint">{agentRuns.length}</span>
          </TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="tools">Tools and permissions</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {hasRuns ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Stat label="Runs · 24h" value={formatNumber(agent.runs24h)} icon={Activity}>
                <Sparkline values={trend} className="mt-2" />
              </Stat>
              <Stat
                label="Success rate"
                value={agent.runs24h > 0 ? formatPercent(agent.successRate) : "—"}
                tone={agent.successRate < 0.95 && agent.runs24h > 0 ? "warning" : "default"}
                hint={agent.runs24h > 0 ? "Last 24 hours" : "No runs in the last 24 hours"}
              />
              <Stat
                label="Duration"
                value={formatDuration(agent.p50Ms)}
                hint={`p95 ${formatDuration(agent.p95Ms)}`}
                icon={Clock}
              />
              <Stat
                label="Model spend · 24h"
                value={formatCurrency(agent.cost24h)}
                hint={
                  agent.runs24h > 0
                    ? `${formatCurrency(agent.cost24h / agent.runs24h, 4)} per run`
                    : undefined
                }
              />
              <div className="col-span-2 lg:col-span-1">
                <Stat
                  label="Instances"
                  value={formatNumber(agent.instances)}
                  hint={`${formatNumber(agent.approvals24h)} approvals requested`}
                />
              </div>
            </div>
          ) : (
            <Panel>
              <EmptyState
                icon={Rocket}
                title="This agent is a draft"
                description="It has a configuration but has never been deployed, so there are no runs yet."
                action={
                  <GateButton gate="deploy-agent" size="sm">
                    Deploy agent
                  </GateButton>
                }
              />
            </Panel>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-6">
              <Panel title="Instructions" bodyClassName="p-4">
                <p className="text-sm leading-relaxed text-fg-muted">{agent.instructions}</p>
              </Panel>
              {agentRuns.length > 0 ? (
                <Panel title="Recent runs">
                  <RunsTable items={agentRuns.slice(0, 5)} showAgent={false} compact />
                </Panel>
              ) : null}
            </div>

            <div className="min-w-0 space-y-6">
              <Panel title="Configuration" bodyClassName="px-4 py-1.5">
                <KeyValue
                  items={[
                    {
                      label: "Model profile",
                      value: (
                        <span title={MODEL_PROFILES[agent.model].description}>
                          {MODEL_PROFILES[agent.model].label}
                        </span>
                      ),
                    },
                    {
                      label: "Triggers",
                      value: (
                        <span className="flex flex-col items-end gap-1">
                          {agent.triggers.map((trigger) => (
                            <span key={trigger.label} className="flex items-center gap-1.5">
                              <Zap className="size-3 text-fg-subtle" aria-hidden="true" />
                              <Mono>{trigger.label}</Mono>
                            </span>
                          ))}
                        </span>
                      ),
                    },
                    {
                      label: "Memory scopes",
                      value: (
                        <span className="flex flex-wrap justify-end gap-1.5">
                          {agent.memoryScopes.map((scope) => (
                            <Badge key={scope} size="sm">
                              <Database aria-hidden="true" />
                              {scope}
                            </Badge>
                          ))}
                        </span>
                      ),
                    },
                    {
                      label: "Sandbox",
                      value: sandbox ? (
                        <Link href="/console/sandboxes" className="hover:underline">
                          <Mono>{sandbox.id}</Mono>
                        </Link>
                      ) : (
                        "None"
                      ),
                    },
                    {
                      label: "Last deployed",
                      value: <TimeAgo minutes={agent.updatedHoursAgo * 60} />,
                    },
                  ]}
                />
              </Panel>

              <Panel title="Policies" bodyClassName="divide-y divide-line">
                {agent.policies.map((id) => {
                  const policy = getPolicy(id);
                  if (!policy) return null;
                  return (
                    <Link
                      key={id}
                      href="/console/policies"
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
                    >
                      <KeyRound
                        className="mt-0.5 size-4 shrink-0 text-fg-subtle"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-fg">
                          {policy.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-fg-subtle">
                          {policy.description}
                        </span>
                      </span>
                      <Badge tone={policy.mode === "enforce" ? "success" : "info"} size="sm">
                        {policy.mode === "enforce" ? "Enforcing" : "Monitoring"}
                      </Badge>
                    </Link>
                  );
                })}
              </Panel>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="runs" className="mt-6">
          <Panel>
            {agentRuns.length > 0 ? (
              <RunsTable items={agentRuns} showAgent={false} />
            ) : (
              <EmptyState
                icon={Activity}
                title="No sample runs for this agent"
                description={
                  hasRuns
                    ? "The demo keeps a small sample of runs. This agent has none in it."
                    : "Runs appear here after the agent is deployed."
                }
              />
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="configuration" className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-fg-muted">
              The manifest for v{agent.version}, as stored in version control.
            </p>
            <GateButton
              gate="deploy-agent"
              source="console:edit-agent"
              variant="secondary"
              size="sm"
            >
              <Pencil aria-hidden="true" />
              Edit configuration
            </GateButton>
          </div>
          <CodeBlock
            code={manifest}
            language="yaml"
            title={`agents/${agent.slug}.yaml`}
            lineNumbers
          />
        </TabsContent>

        <TabsContent value="tools" className="mt-6 space-y-4">
          <p className="text-sm text-fg-muted">
            {agent.tools.length} tools across {toolGroups.length}{" "}
            {toolGroups.length === 1 ? "server" : "servers"}. Anything not listed is denied.
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {toolGroups.map(([serverId, tools]) => {
              const server = getServer(serverId);
              if (!server) return null;
              return (
                <Panel
                  key={serverId}
                  title={
                    <span className="flex items-center gap-2.5">
                      <Monogram name={server.name} className="size-6 text-[10px]" />
                      {server.name}
                    </span>
                  }
                  action={
                    <Badge tone={server.status === "connected" ? "success" : "warning"} size="sm">
                      {server.status === "connected" ? "Connected" : "Degraded"}
                    </Badge>
                  }
                  bodyClassName="divide-y divide-line"
                >
                  {tools.map((name) => {
                    const tool = server.tools.find((item) => item.name === name);
                    if (!tool) return null;
                    return (
                      <div
                        key={name}
                        className="flex items-center justify-between gap-4 px-4 py-2.5"
                      >
                        <div className="min-w-0">
                          <Mono className="text-fg">{name}</Mono>
                          <p className="mt-0.5 truncate text-xs text-fg-subtle">
                            {tool.description}
                          </p>
                        </div>
                        <Badge tone={PERMISSION[tool.permission].tone} size="sm">
                          {PERMISSION[tool.permission].label}
                        </Badge>
                      </div>
                    );
                  })}
                  <div className="px-4 py-2.5 text-xs text-fg-subtle">
                    {server.identity} · {server.auth}
                  </div>
                </Panel>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="versions" className="mt-6">
          <Panel>
            <Table>
              <thead>
                <tr>
                  <Th>Version</Th>
                  <Th>Change</Th>
                  <Th className="hidden sm:table-cell">Author</Th>
                  <Th>Deployed</Th>
                  <Th className="text-right">Traffic</Th>
                  <Th className="text-right">
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr key={version.version} className="[&:last-child>td]:border-b-0">
                    <Td className="whitespace-nowrap">
                      <Mono className="text-fg">v{version.version}</Mono>
                      {version.traffic === 1 ? (
                        <Badge tone="success" size="sm" className="ml-2">
                          Current
                        </Badge>
                      ) : null}
                    </Td>
                    <Td className="min-w-48">{version.change}</Td>
                    <Td className="hidden whitespace-nowrap sm:table-cell">{version.author}</Td>
                    <Td className="whitespace-nowrap">
                      <TimeAgo minutes={version.hoursAgo * 60} />
                    </Td>
                    <Td className="text-right tabular-nums">{formatPercent(version.traffic, 0)}</Td>
                    <Td className="text-right">
                      {version.traffic === 1 ? null : (
                        <GateButton
                          gate="deploy-agent"
                          source="console:rollback-agent"
                          variant="ghost"
                          size="sm"
                        >
                          <RotateCcw aria-hidden="true" />
                          Roll back
                        </GateButton>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Panel>
        </TabsContent>
      </Tabs>
    </>
  );
}
