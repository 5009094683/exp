"use client";

import { Box, Cpu, Globe, MemoryStick, Plus, Timer } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TimeAgo } from "@/components/console/clock";
import {
  FilterTabs,
  KeyValue,
  Mono,
  PageHeader,
  Panel,
  Stat,
  Table,
  Td,
  Terminal,
  Th,
  rowLink,
} from "@/components/console/ui";
import { GateButton } from "@/components/leads/early-access-button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogDescription, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAgent } from "@/demo/agents";
import { formatDuration, formatNumber } from "@/demo/format";
import { sandboxSessions, type SandboxSession } from "@/demo/sandbox-sessions";
import { getSandboxTemplate, sandboxTemplates } from "@/demo/sandboxes";
import { sandboxSessions24h } from "@/demo/usage";

type StatusFilter = "all" | SandboxSession["status"];

const STATUS: Record<
  SandboxSession["status"],
  { label: string; tone: "info" | "success" | "danger" | "warning" }
> = {
  running: { label: "Running", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  terminated: { label: "Terminated", tone: "warning" },
};

function SessionSheet({ session }: { session: SandboxSession }) {
  const template = getSandboxTemplate(session.template);

  return (
    <div className="space-y-5 p-6">
      <div className="pr-8">
        <DialogTitle className="font-mono text-base">{session.id}</DialogTitle>
        <DialogDescription className="mt-1">
          {session.agentName} · {template?.name ?? session.template}
        </DialogDescription>
      </div>

      <KeyValue
        items={[
          {
            label: "Status",
            value: (
              <Badge tone={STATUS[session.status].tone} size="sm">
                {STATUS[session.status].label}
              </Badge>
            ),
          },
          { label: "Started", value: <TimeAgo minutes={session.startedMinutesAgo} /> },
          { label: "Duration", value: formatDuration(session.durationMs) },
          {
            label: "Exit code",
            value:
              session.exitCode === undefined ? "Still running" : <Mono>{session.exitCode}</Mono>,
          },
          { label: "CPU time", value: `${session.cpuSeconds.toFixed(1)}s` },
          { label: "Peak memory", value: `${formatNumber(session.peakMemoryMb)} MB` },
          { label: "Image", value: <Mono className="break-all">{template?.image}</Mono> },
          {
            label: "Run",
            value: session.runId ? (
              <Link href={`/console/runs/${session.runId}`} className="hover:underline">
                <Mono>{session.runId}</Mono>
              </Link>
            ) : (
              "Run no longer retained"
            ),
          },
        ]}
      />

      <div>
        <h3 className="mb-2 text-xs font-medium text-fg">Output</h3>
        <Terminal lines={session.logs} />
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium text-fg">Network requests</h3>
        {session.egress.length === 0 ? (
          <p className="rounded-lg border border-line bg-white/[0.02] px-3 py-2.5 text-[13px] text-fg-muted">
            No outbound requests were attempted.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {session.egress.map((entry) => (
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
        )}
      </div>

      <p className="text-xs leading-relaxed text-fg-subtle">
        The sandbox and its filesystem were destroyed when the task ended. Only this record is kept.
      </p>
    </div>
  );
}

export function SandboxesView() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<SandboxSession | null>(null);

  const visible = sandboxSessions.filter(
    (session) => status === "all" || session.status === status,
  );
  const blocked = sandboxSessions.reduce(
    (sum, session) => sum + session.egress.filter((entry) => !entry.allowed).length,
    0,
  );

  return (
    <>
      <PageHeader
        title="Sandboxes"
        description="Short-lived, isolated environments where agents run code. Each one starts with no credentials and no network."
        actions={
          <GateButton gate="generic" source="console:new-sandbox-template" size="sm">
            <Plus aria-hidden="true" />
            New template
          </GateButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sessions · 24h" value={formatNumber(sandboxSessions24h)} icon={Box} />
        <Stat
          label="Running now"
          value={sandboxSessions.filter((session) => session.status === "running").length}
          hint="In this sample"
        />
        <Stat label="Templates" value={sandboxTemplates.length} hint="Images pinned by digest" />
        <Stat
          label="Blocked requests"
          value={blocked}
          tone={blocked > 0 ? "warning" : "default"}
          hint="Outbound, in this sample"
        />
      </div>

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="templates">
            Templates
            <span className="text-fg-faint">{sandboxTemplates.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-6 space-y-4">
          <FilterTabs
            label="Filter by status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all" as StatusFilter, label: "All", count: sandboxSessions.length },
              ...(Object.keys(STATUS) as Array<SandboxSession["status"]>).map((key) => ({
                value: key as StatusFilter,
                label: STATUS[key].label,
                count: sandboxSessions.filter((session) => session.status === key).length,
              })),
            ]}
          />
          <Panel>
            <Table>
              <thead>
                <tr>
                  <Th>Sandbox</Th>
                  <Th>Status</Th>
                  <Th className="hidden md:table-cell">Agent</Th>
                  <Th className="hidden lg:table-cell">Template</Th>
                  <Th>Started</Th>
                  <Th className="hidden text-right sm:table-cell">Duration</Th>
                  <Th className="hidden text-right xl:table-cell">CPU</Th>
                  <Th className="hidden text-right xl:table-cell">Peak memory</Th>
                  <Th className="hidden text-right md:table-cell">Blocked</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((session) => {
                  const blockedCount = session.egress.filter((entry) => !entry.allowed).length;
                  return (
                    <tr key={session.id} className={rowLink} onClick={() => setSelected(session)}>
                      <Td className="whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelected(session)}
                          className="hover:underline"
                        >
                          <Mono className="text-fg">{session.id}</Mono>
                        </button>
                      </Td>
                      <Td className="whitespace-nowrap">
                        <Badge tone={STATUS[session.status].tone} size="sm">
                          {STATUS[session.status].label}
                        </Badge>
                      </Td>
                      <Td className="hidden whitespace-nowrap md:table-cell">
                        {session.agentName}
                      </Td>
                      <Td className="hidden whitespace-nowrap lg:table-cell">
                        <Mono>{session.template}</Mono>
                      </Td>
                      <Td className="whitespace-nowrap">
                        <TimeAgo minutes={session.startedMinutesAgo} />
                      </Td>
                      <Td className="hidden text-right font-mono text-xs tabular-nums sm:table-cell">
                        {formatDuration(session.durationMs)}
                      </Td>
                      <Td className="hidden text-right font-mono text-xs tabular-nums xl:table-cell">
                        {session.cpuSeconds.toFixed(1)}s
                      </Td>
                      <Td className="hidden text-right font-mono text-xs tabular-nums xl:table-cell">
                        {formatNumber(session.peakMemoryMb)} MB
                      </Td>
                      <Td className="hidden text-right tabular-nums md:table-cell">
                        {blockedCount > 0 ? (
                          <span className="text-warning">{blockedCount}</span>
                        ) : (
                          "0"
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Panel>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <ul className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {sandboxTemplates.map((template) => (
              <li
                key={template.id}
                className="flex flex-col rounded-xl border border-line bg-surface p-5 edge-highlight"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-fg">{template.name}</h3>
                    <Mono className="mt-1 block truncate text-fg-subtle">{template.image}</Mono>
                  </div>
                  <Badge size="sm">{formatNumber(template.sessions24h)} / 24h</Badge>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">
                  {template.description}
                </p>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  {[
                    { icon: Cpu, label: "CPU", value: template.cpu },
                    { icon: MemoryStick, label: "Memory", value: template.memory },
                    { icon: Timer, label: "Time limit", value: template.timeout },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-line bg-white/[0.02] p-2.5"
                    >
                      <dt className="flex items-center gap-1.5 text-fg-subtle">
                        <item.icon className="size-3" aria-hidden="true" />
                        {item.label}
                      </dt>
                      <dd className="mt-1 font-mono text-fg">{item.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4">
                  <p className="text-xs text-fg-subtle">Outbound network</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {template.egress.length === 0 ? (
                      <li>
                        <Badge tone="danger" size="sm">
                          No network access
                        </Badge>
                      </li>
                    ) : (
                      template.egress.map((host) => (
                        <li key={host}>
                          <Badge size="sm">
                            <Globe aria-hidden="true" />
                            {host}
                          </Badge>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <p className="[margin-block-start:1rem] mt-auto border-t border-line pt-3 text-xs text-fg-subtle">
                  Used by {template.usedBy.map((slug) => getAgent(slug)?.name ?? slug).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => (open ? undefined : setSelected(null))}
      >
        <SheetContent className="max-w-lg">
          {selected ? <SessionSheet session={selected} /> : null}
        </SheetContent>
      </Dialog>
    </>
  );
}
